
import sys
import os
import json
import glob
import argparse

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
import time
from typing import List, Dict

import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

from config import (
    DATA_DIR,
    VECTORSTORE_DIR,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DEVICE,
    EMBEDDING_BATCH_SIZE,
    CHROMA_COLLECTION_NAME,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
)

PROGRESS_FILE = os.path.join(VECTORSTORE_DIR, "embed_progress.json")
RECORDS_PER_BATCH = 500


def load_jsonl(file_path: str) -> List[Dict]:
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                records.append(record)
            except json.JSONDecodeError as e:
                print(f"  WARN: skip line {line_no}: {e}")
    return records


def extract_text_from_record(record: Dict) -> str:
    if "question" in record and "answer" in record:
        return f"Câu hỏi: {record['question']}\nTrả lời: {record['answer']}"

    if "instruction" in record and "output" in record:
        text = f"Hướng dẫn: {record['instruction']}"
        if record.get("input"):
            text += f"\nĐầu vào: {record['input']}"
        text += f"\nTrả lời: {record['output']}"
        return text

    if "input" in record and "output" in record:
        return f"Câu hỏi: {record['input']}\nTrả lời: {record['output']}"

    if "text" in record:
        return record["text"]

    if "content" in record:
        return record["content"]

    parts = []
    for key, value in record.items():
        if isinstance(value, str) and value.strip():
            parts.append(f"{key}: {value}")
    return "\n".join(parts)


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        if end < len(text):
            newline_pos = text.rfind("\n", start, end)
            if newline_pos > start + chunk_size // 2:
                end = newline_pos + 1
            else:
                dot_pos = text.rfind(". ", start, end)
                if dot_pos > start + chunk_size // 2:
                    end = dot_pos + 2

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap

    return chunks


class Embedder:
    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME, device: str = EMBEDDING_DEVICE):
        print(f"Loading embedding: {model_name} on {device}")
        self.model = SentenceTransformer(model_name, device=device)
        print("Embedding model ready.")

    def embed(self, texts: List[str], batch_size: int = EMBEDDING_BATCH_SIZE) -> List[List[float]]:
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            normalize_embeddings=True,
        )
        return embeddings.tolist()


def get_chroma_collection(reset: bool = False):
    os.makedirs(VECTORSTORE_DIR, exist_ok=True)

    client = chromadb.PersistentClient(path=VECTORSTORE_DIR)

    if reset:
        try:
            client.delete_collection(CHROMA_COLLECTION_NAME)
            print(f"Deleted collection '{CHROMA_COLLECTION_NAME}'.")
        except Exception:
            pass

    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    return collection

def save_progress(file_name: str, completed: int, total: int, chunks_added: int):
    progress = {
        "file": file_name,
        "completed_records": completed,
        "total_records": total,
        "total_chunks_added": chunks_added,
        "last_update": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def load_progress(file_name: str):
    if not os.path.exists(PROGRESS_FILE):
        return 0, 0
    try:
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            progress = json.load(f)
        if progress.get("file") == file_name:
            return progress.get("completed_records", 0), progress.get("total_chunks_added", 0)
    except (json.JSONDecodeError, KeyError):
        pass
    return 0, 0


def clear_progress():
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)


def process_file(file_path: str, embedder: Embedder, collection,
                 records_per_batch: int = RECORDS_PER_BATCH) -> int:
    file_name = os.path.basename(file_path)
    print(f"\nProcessing: {file_path}")

    records = load_jsonl(file_path)
    total_records = len(records)
    print(f"  Records: {total_records}")

    if not records:
        print("  Empty, skipped.")
        return 0

    already_done, chunks_so_far = load_progress(file_name)
    if already_done > 0 and already_done < total_records:
        print(f"  Resume: {already_done}/{total_records} records ({chunks_so_far} chunks)")
    elif already_done >= total_records:
        print(f"  Already done ({chunks_so_far} chunks). Skipped.")
        return 0

    total_chunks_added = chunks_so_far
    processed = already_done
    newly_added = 0
    last_pct_logged = -1

    remaining = records[already_done:]
    try:
        for batch_start in range(0, len(remaining), records_per_batch):
            batch_end = min(batch_start + records_per_batch, len(remaining))
            batch_records = remaining[batch_start:batch_end]

            batch_chunks = []
            batch_metadata = []
            for i, record in enumerate(batch_records):
                record_idx = already_done + batch_start + i
                text = extract_text_from_record(record)
                if not text.strip():
                    continue
                chunks = chunk_text(text)
                for chunk_idx, chunk in enumerate(chunks):
                    batch_chunks.append(chunk)
                    batch_metadata.append({
                        "source_file": file_name,
                        "record_index": record_idx,
                        "chunk_index": chunk_idx,
                        "total_chunks": len(chunks),
                    })

            if not batch_chunks:
                processed = already_done + batch_end
                save_progress(file_name, processed, total_records, total_chunks_added)
                continue

            embeddings = embedder.embed(batch_chunks)

            CHROMA_MAX = 5000
            ids = [f"{file_name}_{m['record_index']}_{m['chunk_index']}" for m in batch_metadata]
            for s in range(0, len(batch_chunks), CHROMA_MAX):
                e = min(s + CHROMA_MAX, len(batch_chunks))
                collection.add(
                    ids=ids[s:e],
                    embeddings=embeddings[s:e],
                    documents=batch_chunks[s:e],
                    metadatas=batch_metadata[s:e],
                )

            total_chunks_added += len(batch_chunks)
            newly_added += len(batch_chunks)
            processed = already_done + batch_end

            save_progress(file_name, processed, total_records, total_chunks_added)

            pct = int(processed / total_records * 100)
            milestone = pct // 10 * 10
            if milestone > last_pct_logged:
                last_pct_logged = milestone
                print(f"  [{milestone}%] {processed}/{total_records} records, "
                      f"{total_chunks_added} chunks saved")

    except KeyboardInterrupt:
        print(f"\nInterrupted at record {processed}/{total_records} "
              f"({processed/total_records*100:.1f}%), {total_chunks_added} chunks saved.")
        print(f"Run again to resume, or use --reset to restart.")
        return newly_added

    print(f"  [100%] Done. {total_chunks_added} chunks from {total_records} records.")
    clear_progress()
    return newly_added


def main():
    parser = argparse.ArgumentParser(description="Embed JSONL into ChromaDB")
    parser.add_argument("--file", type=str, help="Path to specific JSONL file")
    parser.add_argument("--data-dir", type=str, default=DATA_DIR, help="Directory with JSONL files")
    parser.add_argument("--reset", action="store_true", help="Reset vectorstore")
    parser.add_argument("--device", type=str, default=EMBEDDING_DEVICE, help="cuda or cpu")
    parser.add_argument("--batch-records", type=int, default=RECORDS_PER_BATCH,
                        help=f"Records per batch (default {RECORDS_PER_BATCH})")
    args = parser.parse_args()

    start_time = time.time()

    if args.file:
        files = [args.file]
    else:
        files = glob.glob(os.path.join(args.data_dir, "*.jsonl"))
        if not files:
            print(f"No .jsonl files found in {args.data_dir}")
            return

    print(f"Found {len(files)} JSONL file(s):")
    for f in files:
        print(f"  - {f}")

    if args.reset:
        clear_progress()

    embedder = Embedder(device=args.device)
    collection = get_chroma_collection(reset=args.reset)
    print(f"Collection: {collection.count()} documents")

    total_added = 0
    for file_path in files:
        added = process_file(file_path, embedder, collection,
                             records_per_batch=args.batch_records)
        total_added += added

    elapsed = time.time() - start_time
    print(f"\nAdded: {total_added} chunks | Total: {collection.count()} | Time: {elapsed:.1f}s")


if __name__ == "__main__":
    main()
