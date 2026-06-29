"""HealthMate conversational RAG service.

The expensive embedding model and vector database are initialized on the first
request instead of at module import, which keeps API startup fast and makes
configuration errors visible through the health endpoint.
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv()

ROOT_DIR = Path(__file__).resolve().parents[1]
DB_FAISS_PATH = ROOT_DIR / "vector_store" / "db_faiss"
GROQ_MODEL_NAME = os.getenv("GROQ_MODEL_NAME", "openai/gpt-oss-20b")
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_rag_pipeline() -> Any:
    """Build and cache the RAG chain."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not configured. Add it to your environment or .env file."
        )
    if not DB_FAISS_PATH.exists():
        raise RuntimeError(
            "The FAISS knowledge base is missing. Run `python code/indexing.py` first."
        )

    from langchain.chains import create_retrieval_chain
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain.chains.history_aware_retriever import (
        create_history_aware_retriever,
    )
    from langchain_community.vectorstores import FAISS
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
    from langchain_groq import ChatGroq
    from langchain_huggingface import HuggingFaceEmbeddings

    llm = ChatGroq(
        model=GROQ_MODEL_NAME,
        temperature=0,
        max_tokens=512,
        api_key=api_key,
    )
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    vector_db = FAISS.load_local(
        str(DB_FAISS_PATH),
        embeddings,
        allow_dangerous_deserialization=True,
    )

    contextualize_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "Given the chat history and latest user question, rewrite the "
                "question so it stands alone. Do not answer it. If no rewrite "
                "is needed, return it unchanged.",
            ),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )
    answer_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are HealthMate, an expert fitness and nutrition assistant.
Use only the supplied context. If the answer is unavailable, say: "I could not
find relevant information in the knowledge base." Never invent information.

Give clear, concise, beginner-friendly and actionable answers. Use bullets when
useful. Mention workout sets/reps or nutrition numbers only when supported by
the context. Do not diagnose medical conditions. For injuries, medication, or
serious health concerns, recommend consulting a qualified healthcare provider.

<context>
{context}
</context>""",
            ),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    retriever = vector_db.as_retriever(search_kwargs={"k": 3})
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_prompt
    )
    document_chain = create_stuff_documents_chain(llm, answer_prompt)
    return create_retrieval_chain(history_aware_retriever, document_chain)


def ask_healthmate(query: str, chat_history: list[dict[str, str]]) -> tuple[str, list[str]]:
    """Answer a query and return its unique source labels."""
    formatted_history = [
        ("human" if message["role"] == "user" else "ai", message["content"])
        for message in chat_history[-6:]
        if message.get("role") in {"user", "assistant"} and message.get("content")
    ]
    response = get_rag_pipeline().invoke(
        {"input": query, "chat_history": formatted_history}
    )

    sources = set()
    for document in response["context"]:
        source = Path(document.metadata.get("source", "Unknown source")).name
        page = document.metadata.get("page")
        page_label = f"Page {int(page) + 1}" if isinstance(page, int) else "Page N/A"
        sources.add(f"{source} — {page_label}")

    return response["answer"], sorted(sources)


def ask_healthmate_for_eval(query: str) -> dict[str, Any]:
    """Compatibility helper used by the existing evaluation scripts."""
    response = get_rag_pipeline().invoke({"input": query, "chat_history": []})
    return {
        "question": query,
        "answer": response["answer"],
        "documents": response["context"],
    }
