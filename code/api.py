"""FastAPI entry point for the HealthMate web client."""

import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .rag_pipeline import ask_healthmate


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=6)


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


app = FastAPI(
    title="HealthMate API",
    description="Grounded fitness and nutrition guidance.",
    version="2.0.0",
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "configured": bool(os.getenv("GROQ_API_KEY")),
    }


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    try:
        answer, sources = ask_healthmate(
            request.message.strip(),
            [message.model_dump() for message in request.history],
        )
        return ChatResponse(answer=answer, sources=sources)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        # Avoid leaking provider or infrastructure details to the browser.
        raise HTTPException(
            status_code=502,
            detail="The coaching service could not respond. Please try again shortly.",
        ) from error
