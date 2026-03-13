import os
from typing import List, Tuple

import torch
import chromadb
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM, TextStreamer, BitsAndBytesConfig

from config import (
    VECTORSTORE_DIR,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DEVICE,
    CHROMA_COLLECTION_NAME,
    LLM_MODEL_NAME,
    LLM_DEVICE,
    LLM_MAX_NEW_TOKENS,
    LLM_TEMPERATURE,
    LLM_TOP_P,
    LLM_LOAD_IN_4BIT,
    RAG_TOP_K,
    RAG_SCORE_THRESHOLD,
    MAX_HISTORY_TURNS,
    MAX_PROMPT_TOKENS,
    SYSTEM_PROMPT,
    PROMPT_TEMPLATE,
)


class Retriever:

    def __init__(self):
        print("Loading embedding model...")
        self.embed_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=EMBEDDING_DEVICE)

        self.client = chromadb.PersistentClient(path=VECTORSTORE_DIR)
        self.collection = self.client.get_collection(name=CHROMA_COLLECTION_NAME)
        print(f"Collection '{CHROMA_COLLECTION_NAME}': {self.collection.count()} docs")

    def retrieve(self, query: str, top_k: int = RAG_TOP_K) -> List[Tuple[str, float, dict]]:
        query_embedding = self.embed_model.encode(query, normalize_embeddings=True).tolist()

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "distances", "metadatas"],
        )

        retrieved = []
        for doc, dist, meta in zip(
            results["documents"][0],
            results["distances"][0],
            results["metadatas"][0],
        ):
            similarity = 1 - dist
            if similarity >= RAG_SCORE_THRESHOLD:
                retrieved.append((doc, similarity, meta))

        return retrieved


class LLMGenerator:

    def __init__(self):
        print(f"Loading LLM: {LLM_MODEL_NAME}")

        self.tokenizer = AutoTokenizer.from_pretrained(
            LLM_MODEL_NAME,
            trust_remote_code=True,
        )
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        if LLM_LOAD_IN_4BIT:
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
            )
            self.model = AutoModelForCausalLM.from_pretrained(
                LLM_MODEL_NAME,
                quantization_config=bnb_config,
                trust_remote_code=True,
                low_cpu_mem_usage=True,
            )
        else:
            self.model = AutoModelForCausalLM.from_pretrained(
                LLM_MODEL_NAME,
                torch_dtype=torch.float16,
                trust_remote_code=True,
                low_cpu_mem_usage=True,
            ).to(LLM_DEVICE)
        self.model.eval()

        self.streamer = TextStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)
        print("LLM ready.")

    def generate(self, question: str, context: str, history_text: str = "", stream: bool = True) -> str:
        prompt = PROMPT_TEMPLATE.format(
            system_prompt=SYSTEM_PROMPT,
            context=context,
            history=history_text,
            question=question,
        )

        input_ids = self.tokenizer.encode(prompt)
        if len(input_ids) > MAX_PROMPT_TOKENS:
            prompt = PROMPT_TEMPLATE.format(
                system_prompt=SYSTEM_PROMPT,
                context=context,
                history="",
                question=question,
            )

        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=LLM_MAX_NEW_TOKENS,
                temperature=LLM_TEMPERATURE,
                top_p=LLM_TOP_P,
                do_sample=True,
                streamer=self.streamer if stream else None,
                pad_token_id=self.tokenizer.pad_token_id,
                repetition_penalty=1.1,
            )

        generated_ids = outputs[0][inputs["input_ids"].shape[1]:]
        response = self.tokenizer.decode(generated_ids, skip_special_tokens=True)
        return response.strip()


class RAGChatbot:

    def __init__(self):
        print("\nInitializing RAG Chatbot...")
        self.retriever = Retriever()
        self.llm = LLMGenerator()
        self.history: List[Tuple[str, str]] = []
        print("Ready.\n")

    def build_history_text(self) -> str:
        recent = self.history[-MAX_HISTORY_TURNS:]
        if not recent:
            return ""
        parts = []
        for q, a in recent:
            parts.append(f"<|im_start|>user\n{q}<|im_end|>")
            parts.append(f"<|im_start|>assistant\n{a}<|im_end|>")
        return "\n".join(parts) + "\n"

    def format_context(self, retrieved_docs: List[Tuple[str, float, dict]]) -> str:
        if not retrieved_docs:
            return "Khong tim thay tai lieu lien quan."

        context_parts = []
        for i, (doc, score, meta) in enumerate(retrieved_docs, 1):
            source = meta.get("source_file", "unknown")
            context_parts.append(f"[{i}] (source: {source}, score: {score:.2f})\n{doc}")

        return "\n\n".join(context_parts)

    def chat(self, question: str, stream: bool = True) -> str:
        search_query = question
        if self.history:
            last_q = self.history[-1][0]
            search_query = f"{last_q} {question}"

        retrieved = self.retriever.retrieve(search_query)

        if retrieved:
            print(f"\nRetrieved {len(retrieved)} docs:")
            for i, (doc, score, meta) in enumerate(retrieved, 1):
                preview = doc[:100].replace("\n", " ")
                print(f"  [{i}] score={score:.3f} | {preview}...")
        else:
            print("\nNo relevant docs found.")

        context = self.format_context(retrieved)
        history_text = self.build_history_text()

        print("\nAnswer:")
        print("-" * 40)
        response = self.llm.generate(question, context, history_text, stream=stream)
        print("-" * 40)

        self.history.append((question, response))

        return response

    def chat_for_api(self, question: str) -> dict:
        search_query = question
        if self.history:
            last_q = self.history[-1][0]
            search_query = f"{last_q} {question}"

        retrieved = self.retriever.retrieve(search_query)
        context = self.format_context(retrieved)
        history_text = self.build_history_text()
        response = self.llm.generate(question, context, history_text, stream=False)
        self.history.append((question, response))

        return {
            "question": question,
            "answer": response,
            "sources": [
                {
                    "text": doc[:200],
                    "score": score,
                    "metadata": meta,
                }
                for doc, score, meta in retrieved
            ],
            "num_sources": len(retrieved),
        }
