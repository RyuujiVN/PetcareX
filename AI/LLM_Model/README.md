# 🐾 RAG Chatbot Thú Y

Hệ thống chatbot hỏi đáp thú y sử dụng **RAG** (Retrieval-Augmented Generation) với:
- **LLM**: VinALLaMA 7B Chat (quantized 4-bit)
- **Embedding**: BAAI/bge-m3
- **Vector DB**: ChromaDB

## 📁 Cấu trúc project

```
TrainChatboxModel/
├── config.py              # Cấu hình chung
├── embed_data.py          # Script embed data JSONL → ChromaDB
├── rag_pipeline.py        # RAG pipeline (Retriever + LLM)
├── chat_cli.py            # Chatbot giao diện Terminal
├── chat_gradio.py         # Chatbot giao diện Web (Gradio)
├── check_vectorstore.py   # Tiện ích kiểm tra vectorstore
├── requirements.txt       # Dependencies
├── data/                  # ← Đặt file JSONL ở đây
└── vectorstore/           # ChromaDB sẽ lưu ở đây
```

## 🚀 Hướng dẫn sử dụng

### 1. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

> **Lưu ý**: Cần GPU với ít nhất ~6GB VRAM cho model 4-bit. Nếu không có GPU, đổi `EMBEDDING_DEVICE` và `LLM_DEVICE` thành `"cpu"` trong `config.py`.

### 2. Chuẩn bị data

Copy file `.jsonl` vào thư mục `data/`. Hỗ trợ các format:

```jsonl
{"question": "Chó bị parvo có triệu chứng gì?", "answer": "Chó bị parvo thường có triệu chứng..."}
{"instruction": "Mô tả cách điều trị FIP ở mèo", "output": "FIP (Feline Infectious Peritonitis)..."}
{"text": "Vacxin dại cho chó nên tiêm lúc 3 tháng tuổi..."}
```

### 3. Embed data vào ChromaDB

```bash
# Embed tất cả file .jsonl trong data/
python embed_data.py

# Embed file cụ thể
python embed_data.py --file data/thu_y_qa.jsonl

# Xóa DB cũ rồi embed lại
python embed_data.py --reset

# Dùng CPU nếu không có GPU
python embed_data.py --device cpu
```

### 4. Kiểm tra vectorstore

```bash
# Xem thống kê
python check_vectorstore.py

# Test query
python check_vectorstore.py --query "triệu chứng chó bị parvo"

# Xem documents mẫu
python check_vectorstore.py --sample 10
```

### 5. Chạy chatbot

**Terminal (CLI):**
```bash
python chat_cli.py
```

**Web (Gradio):**
```bash
python chat_gradio.py
python chat_gradio.py --share   # Tạo public link
python chat_gradio.py --port 8080
```

## ⚙️ Cấu hình

Sửa file `config.py` để tùy chỉnh:

| Tham số | Mặc định | Mô tả |
|---------|----------|-------|
| `EMBEDDING_MODEL_NAME` | `BAAI/bge-m3` | Model embedding |
| `LLM_MODEL_NAME` | `vilm/vinallama-7b-chat` | Model LLM |
| `CHUNK_SIZE` | 512 | Kích thước chunk (ký tự) |
| `CHUNK_OVERLAP` | 50 | Overlap giữa chunks |
| `RAG_TOP_K` | 5 | Số documents truy xuất |
| `LLM_LOAD_IN_4BIT` | True | Quantize 4-bit |
| `LLM_TEMPERATURE` | 0.3 | Nhiệt độ sampling |

## 🔄 Workflow

```
JSONL data → chunk → BGE-M3 embed → ChromaDB
                                        ↓
User query → BGE-M3 embed → similarity search → top-K docs
                                                     ↓
                                    VinALLaMA + context → response
```
