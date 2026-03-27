import sys
import time
import uuid
import json
import asyncio
import threading
import argparse
import re
import socketio
from contextlib import asynccontextmanager
from typing import Optional, List, Tuple, Set
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from transformers import TextIteratorStreamer, StoppingCriteria, StoppingCriteriaList
from rag_pipeline import Retriever, LLMGenerator
from structured_retriever import StructuredDBRetriever
from database import engine, SessionLocal
import models
import crud
from config import (
    MAX_HISTORY_TURNS,
    MAX_PROMPT_TOKENS,
    LLM_MAX_NEW_TOKENS,
    LLM_DO_SAMPLE,
    SYSTEM_PROMPT,
    TRIAGE_PROMPT,
    PROMPT_TEMPLATE,
    POSTGRES_DSN,
)

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

retriever: Retriever = None
llm: LLMGenerator = None
structured_retriever: StructuredDBRetriever = None
llm_lock = threading.Lock()

class StopGenerationCreteria(StoppingCriteria):
    def __init__(self):
        self.stop_event = threading.Event()

    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor, **kwargs) -> bool:
        return self.stop_event.is_set()
global_stop_criteria = StopGenerationCreteria()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global retriever, llm, structured_retriever
    print("Loading models...")
    retriever = Retriever()
    llm = LLMGenerator()
    structured_retriever = StructuredDBRetriever()
    if POSTGRES_DSN and structured_retriever.enabled:
        print("Structured DB retriever enabled.")
    else:
        reason = structured_retriever.init_error or "POSTGRES_DSN is empty or psycopg missing"
        print(f"Structured DB retriever not active: {reason}")
    print("API ready.")
    yield


app = FastAPI(title="Vet Chatbot API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)


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
        prev = [h[0] for h in history[-3:]] 
        return " ".join(prev + [question]) if prev else question
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


def _format_structured_context(snippets: List[str]) -> str:
    if not snippets:
        return ""
    return "\n".join([f"- {s}" for s in snippets])


def _should_query_structured_db(message: str) -> bool:
    return bool(StructuredDBRetriever.detect_intents(message))


def _has_medical_content(message: str) -> bool:
    q = (message or "").lower()
    markers = [
        "triệu chứng",
        "trieu chung",
        "bệnh",
        "benh",
        "nôn",
        "non",
        "tiêu chảy",
        "tieu chay",
        "sốt",
        "sot",
        "ho",
        "khó thở",
        "kho tho",
        "điều trị",
        "dieu tri",
        "thuốc",
        "thuoc",
        "chẩn đoán",
        "chan doan",
    ]
    return any(m in q for m in markers)


def _plan_retrieval(message: str) -> Tuple[bool, bool, Set[str]]:
    intents = StructuredDBRetriever.detect_intents(message)
    use_db = bool(intents)
    if not use_db:
        return True, False, intents
    use_vector = _has_medical_content(message)
    return use_vector, True, intents


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": llm is not None,
        "structured_db_enabled": bool(structured_retriever and structured_retriever.enabled),
        "structured_db_error": getattr(structured_retriever, "init_error", None),
    }


@sio.on('chat_event')
async def handle_chat(sid, data):
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            print(f"Lỗi: Data gửi lên không phải JSON hợp lệ: {data}")
            return
    message = data.get("message", "").strip()
    room_id = data.get("room_id", "")
    user_id = data.get("user_id", "")

    if not message:
        return

    db = SessionLocal()
    try:
        await sio.emit('chat_response', {"type": "status", "status": "generating"}, to=sid)

        history = crud.get_history(db, room_id) if room_id else []
        use_vector, use_db, db_intents = _plan_retrieval(message)

        if use_db and (structured_retriever is None or not structured_retriever.enabled):
            answer = "Hiện tại mình chưa kết nối được cơ sở dữ liệu nghiệp vụ nên chưa thể trả lời chính xác."
            await sio.emit('chat_response', {"type": "done", "answer": answer}, to=sid)
            return

        vector_context = ""
        if use_vector:
            search_query = build_search_query(message, history)
            retrieved = retriever.retrieve(search_query)
            vector_context = _format_context(retrieved)

        structured_context = ""
        if structured_retriever is not None and structured_retriever.enabled and use_db:
            structured_context = _format_structured_context(
                structured_retriever.retrieve(message, intents=db_intents)
            )

        if structured_context and vector_context:
            context = (
                f"{vector_context}\n\n"
                f"Thông tin nghiệp vụ hệ thống (realtime):\n"
                f"{structured_context}"
            )
        elif structured_context:
            context = f"Thông tin nghiệp vụ hệ thống (realtime):\n{structured_context}"
        else:
            context = vector_context

        history_text = build_history_text(history)
        prompt = build_prompt(message, context, history_text)

        streamer = TextIteratorStreamer(
            llm.tokenizer, skip_prompt=True, skip_special_tokens=True, timeout=120.0
        )
        inputs = llm.tokenizer(prompt, return_tensors="pt").to(llm.model.device)
        global_stop_criteria.stop_event.clear()
        generate_kwargs = dict(
            **inputs,
            max_new_tokens=LLM_MAX_NEW_TOKENS,
            do_sample=LLM_DO_SAMPLE,
            pad_token_id=llm.tokenizer.pad_token_id,
            repetition_penalty=1.1,
            streamer=streamer,
            stopping_criteria=StoppingCriteriaList([global_stop_criteria]),
        )

        loop = asyncio.get_running_loop()
        token_q = asyncio.Queue()

        def run_gen():
            with llm_lock:
                with torch.no_grad():
                    llm.model.generate(**generate_kwargs)

        def read_tokens():
            for tok in streamer:
                loop.call_soon_threadsafe(token_q.put_nowait, tok)
            loop.call_soon_threadsafe(token_q.put_nowait, None)

        threading.Thread(target=run_gen, daemon=True).start()
        threading.Thread(target=read_tokens, daemon=True).start()

        full_answer = ""
        while True:
            token = await token_q.get()
            if token is None:
                break
            full_answer += token
            await sio.emit('chat_response', {"type": "token", "token": token, "user_id": user_id, "room_id": room_id}, to=sid)

        answer = full_answer.strip()
        await sio.emit('chat_response', {"type": "done", "answer": answer, "user_id": user_id, "room_id": room_id}, to=sid)
    except Exception as exc:
        await sio.emit(
            'chat_response',
            {
                "type": "error",
                "message": "Server xử lý lỗi, vui lòng thử lại.",
                "detail": str(exc),
            },
            to=sid,
        )
    finally:
        db.close()


@sio.on('message')
async def handle_default_message_event(sid, data):
    if isinstance(data, dict) and "message" in data:
        await handle_chat(sid, data)

@sio.on('stop_chat')
async def handle_stop_chat(sid, data):
    global_stop_criteria.stop_event.set()   
    await sio.emit('chat_response', {"type": "status", "status": "Stopped"}, to=sid)

@app.post("/api/triage")
def create_triage(data: dict):
    symptoms = data.get("symptoms", "")
    if not symptoms:
        return {"error": "Missing 'symptoms' in request body."}
    
    prompt = TRIAGE_PROMPT.format(symptoms=symptoms)
    with llm_lock:
        inputs = llm.tokenizer(prompt, return_tensors="pt").to(llm.model.device)
        outputs = llm.model.generate(**inputs, max_new_tokens=512, pad_token_id=llm.tokenizer.pad_token_id)

        input_len = inputs.input_ids.shape[1]
        answer = llm.tokenizer.decode(outputs[0][input_len:], skip_special_tokens=True)

    return {
        "status": "success",
        "analysis": answer.strip(),
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:socket_app", host="0.0.0.0", port=8000)
