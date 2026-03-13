import sys
import time
import uuid
import json
import asyncio
import threading
from contextlib import asynccontextmanager
from typing import Optional, List, Tuple
import torch
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from transformers import TextIteratorStreamer
from rag_pipeline import Retriever, LLMGenerator
from config import (
    MAX_HISTORY_TURNS,
    MAX_PROMPT_TOKENS,
    LLM_MAX_NEW_TOKENS,
    LLM_DO_SAMPLE,
    SYSTEM_PROMPT,
    PROMPT_TEMPLATE,
)

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

SESSION_TTL = 3600

retriever: Retriever = None
llm: LLMGenerator = None
llm_lock = threading.Lock()
sessions: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global retriever, llm
    print("Loading models...")
    retriever = Retriever()
    llm = LLMGenerator()
    print("API ready.")
    yield


app = FastAPI(title="Vet Chatbot API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cleanup_sessions(now: float):
    expired = [sid for sid, s in sessions.items() if now - s["last_active"] > SESSION_TTL]
    for sid in expired:
        del sessions[sid]


def get_or_create_session(session_id: Optional[str]) -> str:
    now = time.time()
    _cleanup_sessions(now)
    if session_id and session_id in sessions:
        sessions[session_id]["last_active"] = now
        return session_id
    new_id = str(uuid.uuid4())
    sessions[new_id] = {"history": [], "last_active": now}
    return new_id


def build_history_text(history: List[Tuple[str, str]]) -> str:
    recent = history[-MAX_HISTORY_TURNS:]
    if not recent:
        return ""
    parts = []
    for q, a in recent:
        parts.append(f"<|im_start|>user\n{q}<|im_end|>")
        parts.append(f"<|im_start|>assistant\n{a}<|im_end|>")
    return "\n".join(parts) + "\n"


def build_search_query(question: str, history: List[Tuple[str, str]]) -> str:
    if history:
        return f"{history[-1][0]} {question}"
    return question


def build_prompt(question: str, context: str, history_text: str) -> str:
    prompt = PROMPT_TEMPLATE.format(
        system_prompt=SYSTEM_PROMPT,
        context=context,
        history=history_text,
        question=question,
    )
    if len(prompt) > MAX_PROMPT_TOKENS * 3:
        prompt = PROMPT_TEMPLATE.format(
            system_prompt=SYSTEM_PROMPT,
            context=context,
            history="",
            question=question,
        )
    return prompt


def _format_context(retrieved_docs) -> str:
    if not retrieved_docs:
        return "Khong tim thay tai lieu lien quan."
    parts = []
    for i, (doc, score, meta) in enumerate(retrieved_docs, 1):
        source = meta.get("source_file", "unknown")
        parts.append(f"[{i}] (source: {source}, score: {score:.2f})\n{doc}")
    return "\n\n".join(parts)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "active_sessions": len(sessions),
        "model": llm is not None,
    }


@app.websocket("/ws/chat")
async def ws_chat(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)
            message = data.get("message", "").strip()
            if not message:
                await ws.send_json({"type": "error", "error": "Empty message"})
                continue

            session_id = get_or_create_session(data.get("session_id"))
            await ws.send_json({"type": "session", "session_id": session_id})

            history = sessions[session_id]["history"]
            search_query = build_search_query(message, history)
            retrieved = retriever.retrieve(search_query)
            context = _format_context(retrieved)
            history_text = build_history_text(history)
            prompt = build_prompt(message, context, history_text)

            await ws.send_json({"type": "status", "status": "generating"})

            streamer = TextIteratorStreamer(
                llm.tokenizer, skip_prompt=True, skip_special_tokens=True, timeout=120.0
            )
            inputs = llm.tokenizer(prompt, return_tensors="pt").to(llm.model.device)
            generate_kwargs = dict(
                **inputs,
                max_new_tokens=LLM_MAX_NEW_TOKENS,
                do_sample=LLM_DO_SAMPLE,
                pad_token_id=llm.tokenizer.pad_token_id,
                repetition_penalty=1.1,
                streamer=streamer,
            )

            loop = asyncio.get_event_loop()
            token_q: asyncio.Queue = asyncio.Queue()

            def run_gen():
                with llm_lock:
                    with torch.no_grad():
                        llm.model.generate(**generate_kwargs)

            def read_tokens():
                for tok in streamer:
                    loop.call_soon_threadsafe(token_q.put_nowait, tok)
                loop.call_soon_threadsafe(token_q.put_nowait, None)

            gen_thread = threading.Thread(target=run_gen, daemon=True)
            gen_thread.start()
            reader_thread = threading.Thread(target=read_tokens, daemon=True)
            reader_thread.start()

            full_answer = ""
            while True:
                token = await token_q.get()
                if token is None:
                    break
                full_answer += token
                await ws.send_json({"type": "token", "token": token})

            gen_thread.join()
            reader_thread.join()
            answer = full_answer.strip()
            history.append((message, answer))
            sessions[session_id]["last_active"] = time.time()
            await ws.send_json({"type": "done", "answer": answer})
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1)
