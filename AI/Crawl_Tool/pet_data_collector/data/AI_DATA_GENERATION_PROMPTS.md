# PROMPTS SINH DATA THÚ CƯNG CHO CHATBOT

## HƯỚNG DẪN SỬ DỤNG
1. Copy prompt vào ChatGPT/Claude/Gemini
2. Yêu cầu AI sinh 10-50 items mỗi lần
3. Copy kết quả vào file JSONL
4. Lặp lại nhiều lần với các prompt khác nhau
5. **Mục tiêu**: Thu thập 10,000-50,000 items

---

## FORMAT OUTPUT MẪU

```json
{"title": "...", "content": "...", "summary": "...", "pet_types": ["dog"], "categories": ["health"], "tags": ["..."], "language": "vi", "quality_score": 0.8}
```

---

## 🔥 MEGA PROMPT - SINH DATA TỔNG HỢP (COPY NGUYÊN KHỐI)

```
Bạn là chuyên gia thú y và chăm sóc thú cưng. Hãy sinh DỮ LIỆU HUẤN LUYỆN cho chatbot thú cưng.

FORMAT OUTPUT (JSONL - mỗi item 1 dòng):
{"title": "...", "content": "...", "summary": "...", "pet_types": ["..."], "categories": ["..."], "tags": ["..."], "language": "vi", "quality_score": 0.8}

RULES:
- pet_types: dog, cat, bird, fish, hamster, rabbit, reptile, turtle, general
- categories: health, nutrition, care, training, behavior, breeding, products, other
- language: "vi" (tiếng Việt) hoặc "en" (tiếng Anh)
- content: 200-1000 từ, chi tiết, chuyên môn
- quality_score: 0.7-0.9

Sinh 20 items về CHỦ ĐỀ: [ĐIỀN CHỦ ĐỀ VÀO ĐÂY]

Chỉ output JSON, không giải thích.
```

---

## PROMPT THEO LOẠI THÚ CƯNG

### 1. CHÓ (Dogs)
```
Sinh 20 bài viết tiếng Việt về CHÓ theo format JSONL:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["dog"], "categories": ["..."], "tags": ["..."], "language": "vi", "quality_score": 0.8}

Chủ đề cần bao gồm:
- Bệnh thường gặp ở chó (parvo, care, ghẻ, viêm ruột)
- Dinh dưỡng và thức ăn cho chó con/chó trưởng thành
- Huấn luyện chó cơ bản (ngồi, nằm, đi vệ sinh,....)
- Chăm sóc lông, móng, răng
- Tiêm phòng và tẩy giun
- Các giống chó phổ biến tại Việt Nam
- Hành vi và tâm lý chó

Mỗi bài 300-800 từ, chuyên môn, thực tế.
```

### 2. MÈO (Cats)
```
Sinh 20 bài viết tiếng Việt về MÈO theo format JSONL:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["cat"], "categories": ["..."], "tags": ["..."], "language": "vi", "quality_score": 0.8}

Chủ đề cần bao gồm:
- Bệnh FIP, viêm đường hô hấp, sỏi thận ở mèo
- Dinh dưỡng cho mèo (thức ăn khô, ướt, tự nấu)

- Chăm sóc mèo con mới sinh
- Triệt sản mèo - lợi ích và lưu ý
- Huấn luyện mèo đi vệ sinh đúng chỗ
- Các giống mèo: Anh lông ngắn, Ba Tư, Munchkin
- Hành vi mèo: cào, cắn, kêu đêm

Mỗi bài 300-800 từ, chuyên môn, thực tế.
```

### 3. CÁ CẢNH (Fish)
```
Sinh 20 bài viết tiếng Việt về CÁ CẢNH theo format JSONL:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["fish"], "categories": ["..."], "tags": ["..."], "language": "vi", "quality_score": 0.8}

Chủ đề:
- Setup bể cá cho người mới
- Chu trình nitơ và xử lý nước
- Bệnh thường gặp: nấm, đốm trắng, thối vây
- Các loài cá dễ nuôi: Betta, Guppy, Neon
- Thức ăn và chế độ cho ăn
- Cây thủy sinh cơ bản
- Cá cảnh nước mặn vs nước ngọt
```

### 4. CHIM (Birds)
```
Sinh 20 bài viết tiếng Việt về CHIM CẢNH theo format JSONL:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["bird"], "categories": ["..."], "tags": ["..."], "language": "vi", "quality_score": 0.8}

Chủ đề:
- Chăm sóc vẹt, yến phụng, chào mào
- Dinh dưỡng và thức ăn cho chim
- Bệnh thường gặp ở chim cảnh
- Lồng chim và môi trường sống
- Sinh sản và ấp trứng
```

### 5. THÚ NHỎ (Hamster, Rabbit)
```
Sinh 20 bài viết tiếng Việt về THÚ NHỎ theo format JSONL:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["hamster"] hoặc ["rabbit"], "categories": ["..."], "tags": ["..."], "language": "vi", "quality_score": 0.8}

Chủ đề:
- Chăm sóc hamster: chuồng, thức ăn, vệ sinh
- Nuôi thỏ cảnh trong nhà
- Bệnh thường gặp ở hamster/thỏ


- Sinh sản và chăm sóc con non
- Đồ chơi và hoạt động
```

---

## PROMPT THEO CATEGORY

### HEALTH (Sức khỏe)
```
Sinh 30 bài viết y khoa thú y tiếng Việt theo format JSONL:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["..."], "categories": ["health"], "tags": ["..."], "language": "vi", "quality_score": 0.85}

Các chủ đề bệnh:
1. Bệnh truyền nhiễm: Parvo, Care, FIP, Calicivirus
2. Bệnh ký sinh trùng: giun, sán, ve, bọ chét
3. Bệnh da: ghẻ, nấm, viêm da dị ứng
4. Bệnh tiêu hóa: viêm ruột, tiêu chảy, táo bón
5. Bệnh hô hấp: viêm phổi, hen, nghẹt mũi
6. Bệnh tiết niệu: sỏi thận, viêm bàng quang
7. Bệnh xương khớp: loạn sản, viêm khớp
8. Cấp cứu: ngộ độc, tai nạn, sốc nhiệt

Nội dung cần có: triệu chứng, nguyên nhân, điều trị, phòng ngừa.
```

### NUTRITION (Dinh dưỡng)
```
Sinh 30 bài viết về DINH DƯỠNG thú cưng tiếng Việt theo format JSONL:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["..."], "categories": ["nutrition"], "tags": ["..."], "language": "vi", "quality_score": 0.8}

Chủ đề:
1. Thức ăn công nghiệp vs tự nấu
2. Dinh dưỡng theo độ tuổi (con non, trưởng thành, già)
3. Dinh dưỡng theo tình trạng (mang thai, sau triệt sản, bệnh)
4. Thực phẩm cấm cho thú cưng
5. Bổ sung vitamin và khoáng chất
6. Chế độ ăn cho thú cưng béo phì
7. Raw food diet - lợi và hại
8. So sánh các thương hiệu thức ăn
```

### TRAINING (Huấn luyện)
```
Sinh 30 bài viết về HUẤN LUYỆN thú cưng tiếng Việt theo format JSONL:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["..."], "categories": ["training"], "tags": ["..."], "language": "vi", "quality_score": 0.8}

Chủ đề:
1. Huấn luyện đi vệ sinh đúng chỗ
2. Các lệnh cơ bản: ngồi, nằm, chờ, lại đây
3. Huấn luyện đi dạo với dây
4. Sửa hành vi xấu: cắn, sủa, phá đồ
5. Xã hội hóa cho thú cưng
6. Huấn luyện bằng clicker
7. Positive reinforcement vs punishment
```

### CARE (Chăm sóc)
```
Sinh 30 bài viết về CHĂM SÓC thú cưng tiếng Việt theo format JSONL:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["..."], "categories": ["care"], "tags": ["..."], "language": "vi", "quality_score": 0.8}

Chủ đề:
1. Tắm và vệ sinh thú cưng
2. Chăm sóc lông (cắt, chải, tỉa)
3. Cắt móng an toàn
4. Vệ sinh răng miệng
5. Vệ sinh tai và mắt
6. Chăm sóc trong mùa nóng/lạnh
7. Chuẩn bị cho thú cưng mới
8. Đồ dùng cần thiết cho thú cưng
```

---

## PROMPT Q&A (Hỏi-Đáp) - QUAN TRỌNG CHO CHATBOT

```
Sinh 50 cặp HỎI-ĐÁP về thú cưng theo format JSONL:
{"title": "Câu hỏi: ...", "content": "Trả lời: ...", "summary": "...", "pet_types": ["..."], "categories": ["..."], "tags": ["Q&A"], "language": "vi", "quality_score": 0.85}

Các câu hỏi thường gặp:
- Chó/mèo bị tiêu chảy phải làm sao?
- Nên cho thú cưng ăn bao nhiêu 1 ngày?
- Khi nào cần đưa thú cưng đi khám?
- Tại sao chó/mèo hay nôn?
- Có nên triệt sản không?
- Thú cưng bị ve/bọ chét làm sao?
- Cách chọn thức ăn phù hợp?
- Thú cưng sợ đi xe/đi khám làm sao?

Trả lời chi tiết 100-300 từ, chuyên môn nhưng dễ hiểu.
```

---

## PROMPT TIẾNG ANH (English Content)

```
Generate 30 pet care articles in English, JSONL format:
{"title": "...", "content": "...", "summary": "...", "pet_types": ["..."], "categories": ["..."], "tags": ["..."], "language": "en", "quality_score": 0.8}

Topics:
1. Common dog/cat diseases and treatments
2. Nutrition guides for different life stages
3. Behavioral training tips
4. Grooming and hygiene
5. Emergency first aid for pets
6. Breed-specific care guides
7. Pet adoption and shelter tips
8. Senior pet care

Each article: 300-800 words, professional, practical advice.
```

---

## PROMPT TÌNH HUỐNG THỰC TẾ

```
Sinh 30 TÌNH HUỐNG thực tế về chăm sóc thú cưng theo format JSONL:
{"title": "Tình huống: ...", "content": "Mô tả tình huống và cách xử lý...", "summary": "...", "pet_types": ["..."], "categories": ["..."], "tags": ["case-study"], "language": "vi", "quality_score": 0.85}

Các tình huống:
1. Chó con mới đón về nhà bỏ ăn
2. Mèo đột nhiên hung dữ với chủ
3. Thú cưng ăn phải đồ độc hại
4. Phát hiện thú cưng có bọ chét
5. Chó sủa liên tục khi chủ đi vắng
6. Mèo không chịu dùng khay vệ sinh
7. Thú cưng bị tai nạn giao thông
8. Chó/mèo già bỏ ăn, nằm li bì
9. Thú cưng mang thai không mong muốn
10. Xung đột khi nuôi nhiều thú cưng

Mỗi tình huống cần: mô tả vấn đề, nguyên nhân có thể, cách xử lý từng bước, khi nào cần đến bác sĩ.
```

---

## CHIẾN LƯỢC SINH DATA HIỆU QUẢ

| Bước | Số lượng | Prompt |
|------|----------|--------|
| 1 | 2,000 items | Health (all pet types) |
| 2 | 2,000 items | Nutrition (all pet types) |
| 3 | 2,000 items | Care (all pet types) |
| 4 | 1,500 items | Training (dog, cat) |
| 5 | 1,500 items | Q&A format |
| 6 | 1,000 items | Case studies |
| **TỔNG** | **10,000 items** | ~5-10 triệu ký tự |

---

## LƯU Ý QUAN TRỌNG

1. **Đa dạng hóa**: Mỗi prompt chạy 3-5 lần với yêu cầu khác nhau
2. **Kiểm tra chất lượng**: Đọc qua 5-10% data sinh ra
3. **Loại bỏ trùng lặp**: Dùng script để dedupe
4. **Format đúng**: Đảm bảo mỗi item là 1 dòng JSON hợp lệ
5. **Cân bằng**: Đủ cả tiếng Việt và tiếng Anh (70/30)

---

## SCRIPT GỘP DATA

Sau khi sinh data từ AI, gộp vào file chính:

```python
# merge_ai_data.py
import json

# Đọc data AI sinh
with open('ai_generated.jsonl', 'r', encoding='utf-8') as f:
    new_data = [json.loads(line) for line in f if line.strip()]

# Đọc data hiện có
with open('auto_save.jsonl', 'r', encoding='utf-8') as f:
    existing = [json.loads(line) for line in f if line.strip()]

# Gộp và loại trùng (theo title)
titles = {item['title'] for item in existing}
for item in new_data:
    if item['title'] not in titles:
        existing.append(item)
        titles.add(item['title'])

# Lưu
with open('merged_data.jsonl', 'w', encoding='utf-8') as f:
    for item in existing:
        f.write(json.dumps(item, ensure_ascii=False) + '\n')

print(f"Total: {len(existing)} items")
```
