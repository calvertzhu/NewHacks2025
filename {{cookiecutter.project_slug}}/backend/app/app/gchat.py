# FastAPI chat endpoint that accepts chat history + current indicator context
#import os, json
#from typing import List, Literal, Optional
#from fastapi import APIRouter, HTTPException
#from pydantic import BaseModel, Field
#from dotenv import load_dotenv
#import google.generativeai as genai
#
#load_dotenv()
#genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# app.py
# FastAPI + Gemini native RAG (single file)
# - Ingest:  POST /rag/ingest
# - Chat:    POST /rag/chat
# Uses: google-generativeai (Gemini), FAISS for vector search
# Tailored for trading indicator context: SMA, EMA, RSI, Volume





# gchat.py  — self-contained FastAPI + Gemini + simple RAG
# Run from this folder:
#   py -3.13 -m pip install --upgrade pip
#   py -3.13 -m pip install fastapi uvicorn "pydantic<3" python-dotenv google-generativeai numpy
#   $env:GEMINI_API_KEY="YOUR_KEY_HERE"   (PowerShell)  or:  set GEMINI_API_KEY=YOUR_KEY_HERE (cmd)
#   uvicorn gchat:app --reload
#
# If you run from the parent folder, use: py -3.13 -m uvicorn app.gchat:app --reload

import os, json, time
from typing import List, Optional, Literal, Dict, Any
from pathlib import Path

print("DEBUG: Loaded gchat.py")  # sanity check you’re loading THIS file

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import google.generativeai as genai

# ── setup ────────────────────────────────────────────────────────────────────
load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError(
        "Missing GEMINI_API_KEY. Set it with:\n"
        'PowerShell:  $env:GEMINI_API_KEY="your_key"\n'
        'cmd:         set GEMINI_API_KEY=your_key'
    )
genai.configure(api_key=API_KEY)

GENERATION_MODEL = "gemini-2.0-flash"
EMBEDDING_MODEL  = "text-embedding-004"

RAG_PATH = Path("rag_store.json")
if not RAG_PATH.exists():
    RAG_PATH.write_text(json.dumps({"items": []}, indent=2), encoding="utf-8")

# ── models ───────────────────────────────────────────────────────────────────
class IngestDoc(BaseModel):
    text: str
    title: Optional[str] = None
    ticker: Optional[str] = None
    source: Optional[str] = None
    url: Optional[str] = None
    timestamp: Optional[str] = None

class IngestRequest(BaseModel):
    docs: List[IngestDoc]

class IndicatorContext(BaseModel):
    symbol: Optional[str] = None
    sma: Optional[str] = None        # e.g., "20:above,50:below"
    ema: Optional[str] = None        # e.g., "12:above,26:below"
    crosses: Optional[str] = None    # e.g., "SMA20-EMA50:bullish"
    rsi: Optional[str] = None        # e.g., "14~68 in [60,80]"
    volume: Optional[str] = None     # e.g., "spike ~ 5e7"
    criteria_text: Optional[str] = None

class ChatTurn(BaseModel):
    role: Literal["user","assistant","system"]
    content: str

class ChatRequest(BaseModel):
    chat_history: List[ChatTurn] = Field(default_factory=list)
    indicator_context: IndicatorContext
    top_k: int = 4

# ── rag helpers ──────────────────────────────────────────────────────────────
def _load_store() -> Dict[str, Any]:
    try:
        return json.loads(RAG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"items": []}

def _save_store(store: Dict[str, Any]) -> None:
    RAG_PATH.write_text(json.dumps(store, indent=2), encoding="utf-8")

def _embed_text(text: str) -> List[float]:
    return genai.embed_content(model=EMBEDDING_MODEL, content=text)["embedding"]

def _cos(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0.0:
        return 0.0
    return float(np.dot(a, b) / denom)

def _retrieve(query: str, top_k: int, symbol_bias: Optional[str]) -> List[Dict[str, Any]]:
    store = _load_store()
    if not store["items"]:
        return []
    q_vec = np.array(_embed_text(query), dtype=np.float32)
    scored = []
    for item in store["items"]:
        v = np.array(item["embedding"], dtype=np.float32)
        score = _cos(q_vec, v)
        if symbol_bias and (item.get("ticker") or "").upper() == (symbol_bias or "").upper():
            score += 0.05
        scored.append((score, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [it for _, it in scored[:max(1, top_k)]]

# ── indicator helpers ────────────────────────────────────────────────────────
def _summarize_indicators(ctx: IndicatorContext) -> str:
    return (
        f"Symbol: {ctx.symbol}\n"
        f"SMA: {ctx.sma}\n"
        f"EMA: {ctx.ema}\n"
        f"Crosses: {ctx.crosses}\n"
        f"RSI: {ctx.rsi}\n"
        f"Volume: {ctx.volume}\n"
        f"User Criteria: {ctx.criteria_text}"
    )

SYSTEM_RULES = (
    "You are an educational trading assistant. Analyze SMA/EMA vs close, crossovers, RSI ranges, "
    "and Volume shifts. Be balanced and cautious; this is NOT financial advice. "
    "Explain typical implications, failure modes, and confirmations. Use short bullets plus a bottom line."
)

def _build_prompt(indicator_summary: str, retrieved: List[Dict[str, Any]]) -> str:
    retrieved_block = "\n".join(
        f"- ({d.get('timestamp','')}) {d.get('ticker','')} | {(d.get('title') or d.get('source') or 'Doc')}: "
        f"{(d.get('text') or '')[:700]}"
        for d in retrieved
    ) or "(none ingested yet)"
    return (
        f"{SYSTEM_RULES}\n\n"
        f"[Indicator Context]\n{indicator_summary}\n\n"
        f"[Retrieved Context]\n{retrieved_block}\n\n"
        f"[Task]\nDiscuss momentum vs mean-reversion implications, where signals can fail, "
        f"and what additional confirmations to watch. Conclude with a short bottom line."
    )

# ── FastAPI app (THIS is the variable uvicorn needs) ─────────────────────────
app = FastAPI(title="Gemini Indicator Chat (Self-contained)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True
)

# ── routes ───────────────────────────────────────────────────────────────────
@app.post("/ingest")
def ingest(req: IngestRequest):
    store = _load_store()
    added = 0
    for d in req.docs:
        text = (d.text or "").strip()
        if not text:
            continue
        item = {
            "id": f"doc_{int(time.time()*1000)}_{added}",
            "title": d.title,
            "text": text,
            "ticker": d.ticker,
            "source": d.source,
            "url": d.url,
            "timestamp": d.timestamp or time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "embedding": _embed_text(text),
        }
        store["items"].append(item)
        added += 1
    _save_store(store)
    return {"status": "ok", "added": added, "total": len(store["items"])}

@app.post("/chat")
def chat(req: ChatRequest):
    ctx = req.indicator_context
    ind_summary = _summarize_indicators(ctx)
    last_user = next((t.content for t in reversed(req.chat_history) if t.role == "user"), "")
    retrieval_query = " ".join(filter(None, [ctx.symbol, ctx.sma, ctx.ema, ctx.crosses, ctx.rsi, last_user]))
    docs = _retrieve(retrieval_query, req.top_k, ctx.symbol)
    prompt = _build_prompt(ind_summary, docs)

    msgs = [{"role": "user", "parts": [{"text": prompt}]}]
    for turn in req.chat_history[-10:]:
        msgs.append({"role": turn.role, "parts": [{"text": turn.content}]})

    try:
        model = genai.GenerativeModel(GENERATION_MODEL)
        resp = model.generate_content(msgs)
        text = resp.text or "(no response)"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")

    return {
        "reply": text,
        "used_docs": [
            {k: d.get(k) for k in ["id","title","ticker","source","url","timestamp"]}
            for d in docs
        ],
        "indicator_summary": ind_summary
    }