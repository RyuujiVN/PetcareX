import sys
import argparse

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import chromadb
from sentence_transformers import SentenceTransformer

from config import (
    VECTORSTORE_DIR,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DEVICE,
    CHROMA_COLLECTION_NAME,
    RAG_TOP_K,
)


def show_stats():
    client = chromadb.PersistentClient(path=VECTORSTORE_DIR)

    try:
        collection = client.get_collection(name=CHROMA_COLLECTION_NAME)
    except Exception:
        print(f"Collection '{CHROMA_COLLECTION_NAME}' not found. Run embed_data.py first.")
        return None

    count = collection.count()
    print(f"Collection: {CHROMA_COLLECTION_NAME} | Docs: {count} | Path: {VECTORSTORE_DIR}")

    return collection


def show_sample(collection, n: int = 5):
    if collection is None:
        return

    count = collection.count()
    n = min(n, count)

    results = collection.peek(limit=n)
    print(f"\n--- {n} sample docs ---")
    for i in range(len(results["ids"])):
        doc_id = results["ids"][i]
        doc = results["documents"][i]
        meta = results["metadatas"][i]
        preview = doc[:200].replace("\n", " ")
        print(f"\n[{doc_id}] source={meta.get('source_file', '?')}")
        print(f"  {preview}...")


def test_query(collection, query: str, top_k: int = RAG_TOP_K):
    if collection is None:
        return

    print(f"Loading embedding model...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=EMBEDDING_DEVICE)

    print(f"Query: \"{query}\"")
    query_emb = model.encode(query, normalize_embeddings=True).tolist()

    results = collection.query(
        query_embeddings=[query_emb],
        n_results=top_k,
        include=["documents", "distances", "metadatas"],
    )

    print(f"\n--- Top {top_k} results ---")
    for i in range(len(results["ids"][0])):
        doc = results["documents"][0][i]
        dist = results["distances"][0][i]
        meta = results["metadatas"][0][i]
        similarity = 1 - dist
        preview = doc[:300].replace("\n", " ")
        print(f"\n[{i+1}] similarity={similarity:.4f} | source={meta.get('source_file', '?')}")
        print(f"  {preview}")


def main():
    parser = argparse.ArgumentParser(description="Check vectorstore")
    parser.add_argument("--query", type=str, help="Test retrieval query")
    parser.add_argument("--sample", type=int, default=0, help="Show N sample docs")
    parser.add_argument("--top-k", type=int, default=RAG_TOP_K, help="Number of results")
    args = parser.parse_args()

    collection = show_stats()

    if args.sample > 0:
        show_sample(collection, args.sample)

    if args.query:
        test_query(collection, args.query, args.top_k)

    if not args.query and args.sample == 0 and collection:
        show_sample(collection, 3)


if __name__ == "__main__":
    main()
