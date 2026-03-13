import sys
import argparse

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import gradio as gr

from rag_pipeline import RAGChatbot

chatbot: RAGChatbot = None


def initialize():
    global chatbot
    if chatbot is None:
        chatbot = RAGChatbot()


def respond(message: str, chat_history: list) -> tuple:
    if not message.strip():
        return "", chat_history

    result = chatbot.chat_for_api(message)
    answer = result["answer"]

    if result["sources"]:
        sources_info = "\n\n---\n**Nguon tham khao:**\n"
        for i, src in enumerate(result["sources"], 1):
            sources_info += f"- [{i}] {src['metadata'].get('source_file', '?')} (score: {src['score']:.2f})\n"
        answer += sources_info

    chat_history.append((message, answer))
    return "", chat_history


def build_ui() -> gr.Blocks:
    with gr.Blocks(
        title="Chatbot Thú Y",
        theme=gr.themes.Soft(),
        css="""
        .contain { max-width: 900px; margin: auto; }
        """
    ) as demo:
        gr.Markdown(
            """
            # Chatbot Thu Y
            **He thong hoi dap thu y su dung RAG**
            """
        )

        chatbox = gr.Chatbot(
            label="Hội thoại",
            height=500,
            show_copy_button=True,
        )

        with gr.Row():
            msg = gr.Textbox(
                label="Question",
                placeholder="Nhap cau hoi...",
                scale=4,
                show_label=False,
            )
            submit_btn = gr.Button("Send", scale=1, variant="primary")

        with gr.Row():
            clear_btn = gr.Button("Clear")

        msg.submit(respond, [msg, chatbox], [msg, chatbox])
        submit_btn.click(respond, [msg, chatbox], [msg, chatbox])
        clear_btn.click(lambda: ([], None), outputs=[chatbox, msg])

        gr.Markdown(
            """
            ---
            *Powered by Qwen + BGE-M3 + ChromaDB*
            """
        )

    return demo


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--share", action="store_true", help="Create public link")
    parser.add_argument("--port", type=int, default=7860, help="Port")
    args = parser.parse_args()

    initialize()
    demo = build_ui()
    demo.launch(server_port=args.port, share=args.share)


if __name__ == "__main__":
    main()
