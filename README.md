# 🏋️‍♂️ HealthMate — AI Fitness & Nutrition Guide 🥗

> Your AI-powered conversational coach for personalized workout plans, nutrition advice, meal planning, and recovery tips.

🔗 **Live Demo:** [healthmate-coach.streamlit.app](https://healthmate-coach.streamlit.app/)

---

## 📌 Project Overview

HealthMate is a **Conversational RAG (Retrieval-Augmented Generation)** application that lets users interact with a domain-specific AI coach trained on curated fitness and nutrition documents. Unlike generic AI chatbots, HealthMate retrieves answers grounded in its knowledge base — so responses are accurate, source-cited, and contextually aware across a multi-turn conversation.

Whether you're a beginner starting your fitness journey or someone optimizing macros for muscle gain, HealthMate provides actionable, beginner-friendly guidance — all in a clean, intuitive chat interface.

---

## ✨ Features

### 💬 Conversational AI with Memory
- Multi-turn chat that remembers previous messages within a session
- History-aware retriever rewrites follow-up questions into standalone queries for more accurate retrieval
- Maintains up to the last 6 messages for context

### 🏋️‍♂️ Workout Planning
- Beginner to advanced fitness guidance
- Exercise recommendations with sets, reps, and routines (when available in knowledge base)

### 🥗 Nutrition & Meal Planning
- Protein, carbohydrate, and fiber content for foods
- Meal prep ideas, calorie guidance, and dietary tips

### 🛏️ Recovery & Wellness
- Post-workout recovery strategies
- Sleep habits, hydration tips, and healthy lifestyle recommendations

### 📚 Source Transparency
- Every response includes an expandable **Source Documents** panel showing which PDF(s) and page number(s) the answer was drawn from

### 🗂️ Chat Management
- Create multiple chat sessions with auto-generated titles
- Switch between past chats from the sidebar
- Clear or start fresh at any time

---

## 🏗️ Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────────┐
│              Streamlit UI (healthmate.py)    │
│  - Chat interface, session state, sidebar   │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│           RAG Pipeline (rag_pipeline.py)     │
│                                             │
│  1. Query Rewriting (History-Aware)         │
│     └─ Rewrites follow-ups into standalone  │
│        questions using chat history         │
│                                             │
│  2. Retriever                               │
│     └─ FAISS Vector DB → Top 5 chunks      │
│                                             │
│  3. LLM Generation                         │
│     └─ Groq (GPT-OSS 20B) + custom prompt  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│         Vector Store (FAISS)                │
│  Built via indexing.py:                     │
│  PDF Docs → Chunks (600 chars, 100 overlap) │
│  → Embeddings (all-MiniLM-L6-v2)           │
│  → Saved FAISS index                        │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend / UI** | Streamlit |
| **LLM** | Groq API — `openai/gpt-oss-20b` |
| **Embeddings** | HuggingFace — `sentence-transformers/all-MiniLM-L6-v2` |
| **Vector Database** | FAISS (Facebook AI Similarity Search) |
| **RAG Framework** | LangChain |
| **Document Loader** | LangChain `PyPDFLoader` |
| **Text Splitter** | `RecursiveCharacterTextSplitter` |
| **Environment Mgmt** | `python-dotenv` |
| **Deployment** | Streamlit Community Cloud |

---

## 📂 Project Structure

```
HealthMate/
│
├── code/                                              # 📁 Application source code
│   ├── healthmate.py                                  # Streamlit UI — chat interface, sidebar, session state
│   ├── rag_pipeline.py                                # RAG chain — LLM, retriever, prompts, query function
│   ├── indexing.py                                    # One-time script — loads PDFs, chunks, embeds & saves FAISS index
│   └── requirements.txt                               # Python dependencies
│
├── data/                                              # 📁 Source PDF knowledge base
│   ├── Dietary Guidelines for Americans 2025-30.pdf
│   ├── NUTRITION_4_HEALTH_SPAN_GWI_final_202301210_hi-res.pdf
│   ├── protein-fat-carb-counter.pdf
│   ├── Protein-List.pdf
│   ├── Workout Guide I.pdf
│   ├── Workout Guide II.pdf
│   ├── Workout Guide III.pdf
│   └── Workout Guide IV.pdf
│
└── vector_store/
    └── db_faiss/                                      # 📁 Saved FAISS vector index (generated by indexing.py)
        ├── index.faiss
        └── index.pkl
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- A [Groq API key](https://console.groq.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/reemikadas/healthmate.git
cd healthmate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Add Your Knowledge Base Documents

Place your fitness and nutrition PDF files inside the `data/` folder.

### 5. Build the Vector Index

Run this **once** to process your PDFs and create the FAISS index:

```bash
python code/indexing.py
```

This will:
- Load all PDFs from `data/`
- Split them into chunks of 600 characters (100 overlap)
- Generate embeddings using `all-MiniLM-L6-v2`
- Save the FAISS index to `vector_store/db_faiss/`

### 6. Launch the App

```bash
streamlit run code/healthmate.py
```

Open your browser at `http://localhost:8501`.

---

## 💡 Usage Guide

| What you want | What to ask |
|---|---|
| Workout plan | *"Give me a beginner full-body workout plan"* |
| Nutrition info | *"How much protein is in 100g of chicken breast?"* |
| Meal planning | *"Suggest a high-protein meal plan for muscle gain"* |
| Fat loss tips | *"What foods help with fat loss?"* |
| Recovery advice | *"How should I recover after an intense leg day?"* |
| Fiber in foods | *"Which vegetables are highest in fiber?"* |

Each response includes a **📚 Source Documents** expander that shows which PDF and page the answer came from.

---

## ⚙️ Configuration

| Parameter | Value | Location |
|---|---|---|
| LLM Model | `openai/gpt-oss-20b` | `rag_pipeline.py` |
| LLM Temperature | `0.6` | `rag_pipeline.py` |
| Max Tokens | `1024` | `rag_pipeline.py` |
| Embedding Model | `all-MiniLM-L6-v2` | `rag_pipeline.py` / `indexing.py` |
| Chunk Size | `600` characters | `indexing.py` |
| Chunk Overlap | `100` characters | `indexing.py` |
| Top-K Retrieval | `5` chunks | `rag_pipeline.py` |
| Chat History Window | Last `6` messages | `rag_pipeline.py` |

---

## 📦 Dependencies

```
streamlit==1.46.1
langchain==0.3.26
langchain-community==0.3.27
langchain-core==0.3.68
langchain-groq==0.3.5
langchain-huggingface==0.3.0
langchain-text-splitters==0.3.8
faiss-cpu==1.11.0
sentence-transformers==5.0.0
pypdf==5.7.0
python-dotenv==1.1.1
```

---

## ⚠️ Disclaimer

HealthMate is an AI-powered informational tool. It is **not a substitute for professional medical advice, diagnosis, or treatment**. Always consult a qualified healthcare provider or certified fitness professional before making significant changes to your diet or exercise routine, especially if you have any medical conditions or injuries.

---

## 🙌 Acknowledgements

- [LangChain](https://www.langchain.com/) — RAG framework
- [Groq](https://groq.com/) — Fast LLM inference
- [HuggingFace](https://huggingface.co/) — Sentence embeddings
- [FAISS](https://faiss.ai/) — Vector similarity search
- [Streamlit](https://streamlit.io/) — UI & deployment
