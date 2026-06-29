# HealthMate

HealthMate is an AI fitness and nutrition coach grounded in a curated PDF
knowledge base. The current app uses a React frontend and a FastAPI backend—no
Streamlit.

## What it includes

- Responsive React chat interface for desktop and mobile
- Multiple conversations saved in the browser
- Suggested prompts and Markdown-formatted answers
- Expandable source citations for every grounded response
- Conversational memory using the last six messages
- Lazy-loaded RAG pipeline for faster, more reliable API startup
- Clear loading, empty, failure, and unconfigured states

## Architecture

```text
React + Vite frontend
        │ POST /api/chat
        ▼
FastAPI service
        │
        ▼
LangChain conversational RAG
  ├─ Groq: openai/gpt-oss-20b
  ├─ HuggingFace: all-MiniLM-L6-v2
  └─ FAISS vector index
```

## Run locally

You need Node.js 18+, Python 3.9+, and a
[Groq API key](https://console.groq.com/).

```bash
git clone https://github.com/reemikadas/HealthMate_AI_Fitness_Nutrition_Guide.git
cd HealthMate_AI_Fitness_Nutrition_Guide

cp .env.example .env
# Add your GROQ_API_KEY to .env

python -m venv .venv
source .venv/bin/activate
pip install -r code/requirements.txt
uvicorn code.api:app --reload
```

In a second terminal:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api`
requests to the FastAPI server at `http://127.0.0.1:8000`.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `GROQ_API_KEY` | Yes | Authenticates requests to Groq |
| `GROQ_MODEL_NAME` | No | Defaults to `openai/gpt-oss-20b` |
| `CORS_ORIGINS` | Production | Comma-separated frontend origins |
| `VITE_API_URL` | Split deployment | Public backend URL used by the frontend |

Never add `.env` to version control.

## Production deployment

The frontend can be deployed to Vercel, Netlify, or Cloudflare Pages:

```bash
npm run build
```

Publish the generated `dist/` directory and set `VITE_API_URL` to the deployed
FastAPI origin. Deploy the Python API to a service that supports the memory and
startup requirements of FAISS and `sentence-transformers` (for example Render,
Railway, Fly.io, or a container host). Set `GROQ_API_KEY` and `CORS_ORIGINS` on
the API host.

## Useful commands

```bash
npm run lint
npm run build
python -m compileall code
```

## Knowledge base

The existing vector store is in `vector_store/db_faiss`. To rebuild it after
changing PDFs in `data/`, run:

```bash
python code/indexing.py
```

## Disclaimer

HealthMate provides general educational information, not medical advice,
diagnosis, or treatment. Consult a qualified healthcare provider or certified
fitness professional for individual care.
