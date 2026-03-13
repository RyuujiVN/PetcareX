
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from rag_pipeline import RAGChatbot


def main():
    chatbot = RAGChatbot()
    print("CHATBOT THU Y - 'quit' to exit, 'history' for history")
    while True:
        try:
            question = input("Q: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break

        if not question:
            continue

        if question.lower() in ("quit", "exit", "thoát"):
            print("Bye!")
            break

        if question.lower() == "history":
            if not chatbot.history:
                print("No history yet.")
            else:
                for i, (q, a) in enumerate(chatbot.history, 1):
                    print(f"\n--- #{i} ---")
                    print(f"Q: {q}")
                    print(f"A: {a}")
            continue

        chatbot.chat(question)
        print()


if __name__ == "__main__":
    main()
