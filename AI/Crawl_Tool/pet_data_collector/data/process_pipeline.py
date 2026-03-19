import json
import hashlib
import os
import re
import glob
from datetime import datetime
from collections import Counter
from typing import List, Dict, Optional, Tuple

import ftfy
from langdetect import detect as langdetect_detect, LangDetectException

try:
    from sentence_transformers import SentenceTransformer, util as st_util
    HAS_SEMANTIC = True
except ImportError:
    HAS_SEMANTIC = False
    print("[WARN] sentence-transformers not installed. Semantic dedup disabled.")

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(DATA_DIR, "processed")

SOURCE_PRIORITY = {
    "vet_clinic": 10,
    "official": 9,
    "blog": 7,
    "news": 6,
    "ai_generated": 5,
    "forum": 4,
    "reddit": 3,
    "social_media": 2,
}

VALID_PET_TYPES = {"dog", "cat", "bird", "fish", "hamster", "rabbit", "reptile", "turtle", "general", "other"}
VALID_CATEGORIES = {
    "health", "nutrition", "care", "training", "behavior",
    "breeding", "products", "other", "breed_info",
    "experience", "emergency", "product_review"
}

CATEGORY_NORMALIZE = {
    "product_review": "products",
    "breed_info": "care",
    "experience": "other",
}

def generate_id(title: str, content: str) -> str:
    text = f"{title}|{content[:500]}"
    return hashlib.md5(text.encode()).hexdigest()[:16]

def content_hash(text: str) -> str:
    normalized = re.sub(r'\s+', ' ', text.lower().strip())
    return hashlib.md5(normalized.encode()).hexdigest()

def clean_text(text: str) -> str:
    if not text:
        return ""
    
    text = ftfy.fix_text(text)
    
    text = re.sub(r'\[deleted\]|\[removed\]', '', text)
    
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'^\s+', '', text, flags=re.MULTILINE)
    
    text = re.sub(r'Share this article.*$', '', text, flags=re.IGNORECASE | re.MULTILINE)
    text = re.sub(r'Subscribe to our newsletter.*$', '', text, flags=re.IGNORECASE | re.MULTILINE)
    text = re.sub(r'Click here to.*$', '', text, flags=re.IGNORECASE | re.MULTILINE)
    text = re.sub(r'Advertisement\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Sponsored\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Related Articles?:?\s*$', '', text, flags=re.IGNORECASE | re.MULTILINE)
    
    text = re.sub(r'https?://\S+', '', text)
    
    text = re.sub(r' +', ' ', text)
    text = text.strip()
    
    return text

def detect_language(text: str) -> str:
    try:
        sample = text[:1000].strip()
        if len(sample) < 20:
            return "en"
        lang = langdetect_detect(sample)
        return "vi" if lang == "vi" else "en"
    except (LangDetectException, Exception):
        return "en"

def detect_pet_types(text: str) -> List[str]:
    text_lower = text.lower()
    detected = []
    
    keywords = {
        "dog": ["dog", "puppy", "puppies", "canine", "chó", "cún", "cẩu"],
        "cat": ["cat", "kitten", "feline", "mèo", "kitty"],
        "bird": ["bird", "parrot", "budgie", "cockatiel", "chim", "vẹt", "parakeet", "avian"],
        "fish": ["fish", "aquarium", "betta", "goldfish", "cá", "bể cá", "tank"],
        "hamster": ["hamster", "gerbil", "chuột hamster"],
        "rabbit": ["rabbit", "bunny", "bunnies", "thỏ"],
        "turtle": ["turtle", "tortoise", "rùa"],
        "reptile": ["reptile", "snake", "lizard", "gecko", "dragon", "bò sát", "rắn", "thằn lằn"],
    }
    
    for pet_type, kws in keywords.items():
        if any(kw in text_lower for kw in kws):
            detected.append(pet_type)
    
    return detected if detected else ["general"]

def detect_categories(text: str) -> List[str]:
    text_lower = text.lower()
    detected = []
    
    keywords = {
        "health": ["disease", "sick", "vet", "symptom", "treatment", "medicine", "diagnos",
                    "bệnh", "ốm", "thú y", "triệu chứng", "điều trị", "thuốc", "infection", "surgery"],
        "nutrition": ["food", "diet", "feed", "eat", "nutrition", "kibble", "raw",
                       "thức ăn", "ăn", "dinh dưỡng", "hạt", "pate", "vitamin", "supplement"],
        "training": ["train", "command", "trick", "obedience", "crate",
                      "huấn luyện", "dạy", "vâng lời", "positive reinforcement"],
        "care": ["groom", "bath", "clean", "care", "brush", "housing", "cage", "tank setup",
                  "tắm", "chải", "chăm sóc", "vệ sinh", "cắt móng", "enclosure"],
        "behavior": ["behavior", "behaviour", "aggression", "anxiety", "body language",
                      "hành vi", "lo lắng", "gây hấn"],
        "emergency": ["emergency", "urgent", "poison", "toxic", "bleeding",
                       "cấp cứu", "khẩn cấp", "ngộ độc", "tai nạn"],
        "breeding": ["breed", "mating", "pregnancy", "whelping", "kitten birth",
                      "phối giống", "mang thai", "đẻ"],
    }
    
    for cat, kws in keywords.items():
        if any(kw in text_lower for kw in kws):
            detected.append(cat)
    
    return detected if detected else ["other"]

def calculate_quality_score(item: dict) -> float:
    score = 0.0
    content = item.get("content", "")
    content_len = len(content)
    
    if content_len >= 2000:
        score += 0.30
    elif content_len >= 1000:
        score += 0.25
    elif content_len >= 500:
        score += 0.20
    elif content_len >= 200:
        score += 0.10
    elif content_len >= 100:
        score += 0.05
    
    pet_types = item.get("pet_types", [])
    categories = item.get("categories", [])
    if pet_types and pet_types[0] != "general":
        score += 0.08
    if categories and categories[0] != "other":
        score += 0.07
    
    source_type = item.get("source_type", "")
    source_scores = {
        "vet_clinic": 0.20, "official": 0.18, "blog": 0.15,
        "news": 0.12, "ai_generated": 0.10, "forum": 0.08,
        "reddit": 0.06, "social_media": 0.04,
    }
    score += source_scores.get(source_type, 0.05)
    
    upvotes = item.get("upvotes") or 0
    if upvotes >= 100:
        score += 0.15
    elif upvotes >= 50:
        score += 0.12
    elif upvotes >= 10:
        score += 0.08
    elif upvotes >= 5:
        score += 0.04
    
    if item.get("summary") and len(item.get("summary", "")) > 20:
        score += 0.05
    
    if item.get("tags") and len(item.get("tags", [])) >= 2:
        score += 0.05
    
    paragraphs = content.count("\n\n") + 1
    if paragraphs >= 3:
        score += 0.05
    words = set(content.lower().split())
    if len(words) >= 100:
        score += 0.05
    elif len(words) >= 50:
        score += 0.02
    
    return round(min(score, 1.0), 3)

def normalize_record(raw: dict, source_file: str = "") -> dict:
    content = clean_text(raw.get("content", ""))
    title = raw.get("title", "").strip()
    
    language = raw.get("language", "")
    if not language or language == "vi-vi":
        language = detect_language(f"{title} {content}")
    
    pet_types = raw.get("pet_types", [])
    if not pet_types:
        pet_types = detect_pet_types(f"{title} {content}")
    pet_types = [pt for pt in pet_types if pt in VALID_PET_TYPES] or ["general"]
    
    categories = raw.get("categories", [])
    if not categories:
        categories = detect_categories(f"{title} {content}")
    categories = [CATEGORY_NORMALIZE.get(c, c) for c in categories]
    categories = [c for c in categories if c in VALID_CATEGORIES] or ["other"]
    seen = set()
    categories = [c for c in categories if not (c in seen or seen.add(c))]
    
    source_type = raw.get("source_type", "")
    source_name = raw.get("source_name", "")
    if not source_type:
        if "ai_generated" in source_file or source_name == "AI Generated":
            source_type = "ai_generated"
            source_name = source_name or "AI Generated"
        elif source_name.startswith("r/"):
            source_type = "reddit"
        else:
            source_type = "blog"
    
    item_id = raw.get("id", "") or generate_id(title, content)
    
    normalized = {
        "id": item_id,
        "title": title,
        "content": content,
        "summary": (raw.get("summary") or title[:200]).strip(),
        "pet_types": pet_types,
        "categories": categories,
        "tags": raw.get("tags", []),
        "source_type": source_type,
        "source_name": source_name or "Unknown",
        "source_url": raw.get("source_url", ""),
        "language": language,
        "author": raw.get("author"),
        "published_date": raw.get("published_date"),
        "scraped_date": raw.get("scraped_date", datetime.now().isoformat()),
        "upvotes": raw.get("upvotes"),
        "comments_count": raw.get("comments_count"),
        "views": raw.get("views"),
        "comments": raw.get("comments", []),
        "images": raw.get("images", []),
        "related_links": raw.get("related_links", []),
        "quality_score": 0,
        "is_verified": raw.get("is_verified", False),
    }
    
    normalized["quality_score"] = calculate_quality_score(normalized)
    
    return normalized

def step1_load_all(data_dir: str) -> Tuple[List[dict], dict]:
    print("\n" + "=" * 60)
    print("STEP 1: LOADING ALL DATA FILES")
    print("=" * 60)
    
    all_records = []
    file_stats = {}
    
    jsonl_files = sorted(glob.glob(os.path.join(data_dir, "*.jsonl")))
    
    for filepath in jsonl_files:
        filename = os.path.basename(filepath)
        count = 0
        errors = 0
        
        with open(filepath, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                    rec["_source_file"] = filename
                    all_records.append(rec)
                    count += 1
                except json.JSONDecodeError:
                    errors += 1
        
        file_stats[filename] = {"records": count, "errors": errors}
        print(f"  {filename}: {count} records" + (f" ({errors} errors)" if errors else ""))
    
    print(f"\n  TOTAL LOADED: {len(all_records)} records from {len(jsonl_files)} files")
    return all_records, file_stats

def step2_normalize(records: List[dict]) -> List[dict]:
    print("\n" + "=" * 60)
    print("STEP 2: NORMALIZING FORMAT")
    print("=" * 60)
    
    normalized = []
    for rec in records:
        source_file = rec.pop("_source_file", "")
        try:
            norm = normalize_record(rec, source_file)
            normalized.append(norm)
        except Exception as e:
            pass
    
    print(f"  Normalized: {len(normalized)} / {len(records)} records")
    return normalized

def step3_filter(records: List[dict]) -> Tuple[List[dict], dict]:
    print("\n" + "=" * 60)
    print("STEP 3: FILTERING JUNK")
    print("=" * 60)
    
    filter_stats = {
        "empty_content": 0,
        "too_short_title": 0,
        "content_under_50": 0,
        "title_is_url": 0,
        "mostly_urls": 0,
    }
    
    filtered = []
    
    for rec in records:
        content = rec.get("content", "")
        title = rec.get("title", "")
        
        if not content.strip():
            filter_stats["empty_content"] += 1
            continue
        
        if len(title.strip()) < 5:
            filter_stats["too_short_title"] += 1
            continue
        
        if len(content) < 50:
            filter_stats["content_under_50"] += 1
            continue
        
        if title.startswith("http"):
            filter_stats["title_is_url"] += 1
            continue
        
        url_count = len(re.findall(r'https?://\S+', content))
        word_count = len(content.split())
        if word_count > 0 and url_count / max(word_count, 1) > 0.3:
            filter_stats["mostly_urls"] += 1
            continue
        
        filtered.append(rec)
    
    total_removed = len(records) - len(filtered)
    print(f"  Removed: {total_removed} records")
    for reason, count in filter_stats.items():
        if count > 0:
            print(f"    - {reason}: {count}")
    print(f"  Remaining: {len(filtered)} records")
    
    return filtered, filter_stats

def step4_deduplicate(records: List[dict]) -> Tuple[List[dict], dict]:
    print("\n" + "=" * 60)
    print("STEP 4: DEDUPLICATION")
    print("=" * 60)
    
    dedup_stats = {
        "exact_content_dups": 0,
        "semantic_dups": 0,
        "url_dups": 0,
        "title_dups": 0,
    }
    
    seen_content = {}
    unique_pass1 = []
    
    for rec in records:
        ch = content_hash(rec.get("content", ""))
        if ch in seen_content:
            existing = seen_content[ch]
            existing_priority = SOURCE_PRIORITY.get(existing.get("source_type", ""), 0)
            current_priority = SOURCE_PRIORITY.get(rec.get("source_type", ""), 0)
            
            if current_priority > existing_priority:
                unique_pass1 = [r for r in unique_pass1 if content_hash(r.get("content", "")) != ch]
                unique_pass1.append(rec)
                seen_content[ch] = rec
            
            dedup_stats["exact_content_dups"] += 1
        else:
            seen_content[ch] = rec
            unique_pass1.append(rec)
    
    print(f"  Pass 1 (content hash): removed {dedup_stats['exact_content_dups']}, remaining {len(unique_pass1)}")
    
    if HAS_SEMANTIC:
        print(f"\n  Pass 1.5 (semantic dedup):")
        print(f"  Loading model all-MiniLM-L6-v2...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        texts = [r.get("content", "")[:300] for r in unique_pass1]
        print(f"  Encoding {len(texts)} texts & mining near-duplicates...")
        
        paraphrases = st_util.paraphrase_mining(
            model, texts,
            batch_size=128,
            show_progress_bar=True,
            top_k=50,
        )
        
        to_remove = set()
        for score, i, j in paraphrases:
            if score < 0.92:
                break
            if i in to_remove or j in to_remove:
                continue
            rec_i = unique_pass1[i]
            rec_j = unique_pass1[j]
            pri_i = SOURCE_PRIORITY.get(rec_i.get("source_type", ""), 0)
            pri_j = SOURCE_PRIORITY.get(rec_j.get("source_type", ""), 0)
            if pri_i > pri_j or (pri_i == pri_j and len(rec_i.get("content", "")) >= len(rec_j.get("content", ""))):
                to_remove.add(j)
            else:
                to_remove.add(i)
        
        dedup_stats["semantic_dups"] = len(to_remove)
        unique_pass1 = [r for idx, r in enumerate(unique_pass1) if idx not in to_remove]
        print(f"  Pass 1.5 (semantic): removed {len(to_remove)}, remaining {len(unique_pass1)}")
        
        del model, texts, paraphrases
    else:
        dedup_stats["semantic_dups"] = 0
    
    seen_urls = {}
    unique_pass2 = []
    
    for rec in unique_pass1:
        url = rec.get("source_url", "").strip()
        if url and url in seen_urls:
            existing = seen_urls[url]
            if len(rec.get("content", "")) > len(existing.get("content", "")):
                unique_pass2 = [r for r in unique_pass2 if r.get("source_url", "").strip() != url]
                unique_pass2.append(rec)
                seen_urls[url] = rec
            dedup_stats["url_dups"] += 1
        else:
            if url:
                seen_urls[url] = rec
            unique_pass2.append(rec)
    
    print(f"  Pass 2 (URL dedup): removed {dedup_stats['url_dups']}, remaining {len(unique_pass2)}")
    
    seen_titles = {}
    unique_pass3 = []
    
    for rec in unique_pass2:
        title_key = rec.get("title", "").lower().strip()
        title_key = re.sub(r'[^\w\s]', '', title_key)
        title_key = re.sub(r'\s+', ' ', title_key).strip()
        
        if title_key and title_key in seen_titles:
            existing = seen_titles[title_key]
            existing_priority = SOURCE_PRIORITY.get(existing.get("source_type", ""), 0)
            current_priority = SOURCE_PRIORITY.get(rec.get("source_type", ""), 0)
            
            if current_priority > existing_priority or (
                current_priority == existing_priority and 
                len(rec.get("content", "")) > len(existing.get("content", ""))
            ):
                unique_pass3 = [r for r in unique_pass3 if re.sub(r'[^\w\s]', '', re.sub(r'\s+', ' ', r.get("title", "").lower().strip())).strip() != title_key]
                unique_pass3.append(rec)
                seen_titles[title_key] = rec
            
            dedup_stats["title_dups"] += 1
        else:
            if title_key:
                seen_titles[title_key] = rec
            unique_pass3.append(rec)
    
    print(f"  Pass 3 (title dedup): removed {dedup_stats['title_dups']}, remaining {len(unique_pass3)}")
    
    total_removed = len(records) - len(unique_pass3)
    print(f"\n  TOTAL DUPLICATES REMOVED: {total_removed}")
    print(f"  UNIQUE RECORDS: {len(unique_pass3)}")
    
    return unique_pass3, dedup_stats

def step5_enrich(records: List[dict]) -> List[dict]:
    print("\n" + "=" * 60)
    print("STEP 5: ENRICHING DATA")
    print("=" * 60)
    
    enriched_count = 0
    
    for rec in records:
        changed = False
        content = rec.get("content", "")
        title = rec.get("title", "")
        combined = f"{title} {content}"
        
        if rec.get("pet_types") == ["general"]:
            detected = detect_pet_types(combined)
            if detected != ["general"]:
                rec["pet_types"] = detected
                changed = True
        
        if rec.get("categories") == ["other"]:
            detected = detect_categories(combined)
            if detected != ["other"]:
                rec["categories"] = detected
                changed = True
        
        summary = rec.get("summary", "")
        if not summary or summary == rec.get("title", "")[:200]:
            sentences = re.split(r'[.!?]\s', content[:500])
            if sentences and len(sentences[0]) > 20:
                rec["summary"] = sentences[0].strip() + "."
                changed = True
        
        if not rec.get("tags"):
            tags = []
            for pt in rec.get("pet_types", []):
                if pt != "general":
                    tags.append(pt)
            for cat in rec.get("categories", []):
                if cat != "other":
                    tags.append(cat)
            rec["tags"] = tags[:5]
            changed = True
        
        new_score = calculate_quality_score(rec)
        if new_score != rec.get("quality_score"):
            rec["quality_score"] = new_score
            changed = True
        
        if changed:
            enriched_count += 1
    
    print(f"  Enriched: {enriched_count} records updated")
    return records

def step6_sort_and_export(records: List[dict], output_dir: str) -> dict:
    print("\n" + "=" * 60)
    print("STEP 6: SORTING & EXPORTING")
    print("=" * 60)
    
    os.makedirs(output_dir, exist_ok=True)
    
    records.sort(key=lambda x: x.get("quality_score", 0), reverse=True)
    
    all_path = os.path.join(output_dir, "merged_all.jsonl")
    with open(all_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"  merged_all.jsonl: {len(records)} records")
    
    high = [r for r in records if r.get("quality_score", 0) >= 0.5 and len(r.get("content", "")) >= 200]
    high_path = os.path.join(output_dir, "clean_high.jsonl")
    with open(high_path, "w", encoding="utf-8") as f:
        for rec in high:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"  clean_high.jsonl: {len(high)} records (quality>=0.5, content>=200)")
    
    medium = [r for r in records if r.get("quality_score", 0) >= 0.3 and len(r.get("content", "")) >= 100]
    medium_path = os.path.join(output_dir, "clean_medium.jsonl")
    with open(medium_path, "w", encoding="utf-8") as f:
        for rec in medium:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"  clean_medium.jsonl: {len(medium)} records (quality>=0.3, content>=100)")
    
    alpaca = []
    for rec in high:
        content = rec.get("content", "")
        if len(content) < 100:
            continue
        
        if rec.get("language") == "vi":
            instruction = "Hãy trả lời câu hỏi về thú cưng dựa trên kiến thức chuyên môn."
        else:
            instruction = "Answer the following pet care question based on professional veterinary knowledge."
        
        alpaca.append({
            "instruction": instruction,
            "input": rec.get("title", ""),
            "output": content[:3000],
            "metadata": {
                "pet_types": rec.get("pet_types", []),
                "categories": rec.get("categories", []),
                "language": rec.get("language", "en"),
                "quality_score": rec.get("quality_score", 0),
                "source": rec.get("source_name", ""),
            }
        })
    
    alpaca_path = os.path.join(output_dir, "training_alpaca.jsonl")
    with open(alpaca_path, "w", encoding="utf-8") as f:
        for item in alpaca:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    print(f"  training_alpaca.jsonl: {len(alpaca)} records")
    
    sharegpt = []
    for rec in high:
        content = rec.get("content", "")
        if len(content) < 100:
            continue
        
        title = rec.get("title", "")
        if title.endswith("?") or any(title.lower().startswith(w) for w in 
            ["how", "what", "why", "when", "can", "should", "is", "are",
             "cách", "tại sao", "làm sao", "như thế nào", "có nên", "khi nào"]):
            human_msg = title
        else:
            if rec.get("language") == "vi":
                human_msg = f"Hãy cho tôi biết về: {title}"
            else:
                human_msg = f"Tell me about: {title}"
        
        sharegpt.append({
            "conversations": [
                {"from": "human", "value": human_msg},
                {"from": "gpt", "value": content[:3000]},
            ]
        })
    
    sharegpt_path = os.path.join(output_dir, "training_sharegpt.jsonl")
    with open(sharegpt_path, "w", encoding="utf-8") as f:
        for item in sharegpt:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    print(f"  training_sharegpt.jsonl: {len(sharegpt)} records")
    
    return {
        "all": len(records),
        "high": len(high),
        "medium": len(medium),
        "alpaca": len(alpaca),
        "sharegpt": len(sharegpt),
    }

def step7_report(records: List[dict], file_stats: dict, 
                 filter_stats: dict, dedup_stats: dict,
                 export_stats: dict, output_dir: str):
    print("\n" + "=" * 60)
    print("STEP 7: GENERATING REPORT")
    print("=" * 60)
    
    content_lengths = [len(r.get("content", "")) for r in records]
    quality_scores = [r.get("quality_score", 0) for r in records]
    
    report = {
        "generated_at": datetime.now().isoformat(),
        "total_input_files": len(file_stats),
        "total_input_records": sum(v["records"] for v in file_stats.values()),
        "file_details": file_stats,
        
        "filtering": filter_stats,
        "deduplication": dedup_stats,
        
        "final_dataset": {
            "total_records": len(records),
            "content_length": {
                "min": min(content_lengths) if content_lengths else 0,
                "max": max(content_lengths) if content_lengths else 0,
                "avg": round(sum(content_lengths) / len(content_lengths), 1) if content_lengths else 0,
                "median": sorted(content_lengths)[len(content_lengths)//2] if content_lengths else 0,
            },
            "quality_score": {
                "min": round(min(quality_scores), 3) if quality_scores else 0,
                "max": round(max(quality_scores), 3) if quality_scores else 0,
                "avg": round(sum(quality_scores) / len(quality_scores), 3) if quality_scores else 0,
            },
            "by_language": dict(Counter(r.get("language", "?") for r in records).most_common()),
            "by_pet_type": dict(Counter(pt for r in records for pt in r.get("pet_types", [])).most_common()),
            "by_category": dict(Counter(c for r in records for c in r.get("categories", [])).most_common()),
            "by_source_type": dict(Counter(r.get("source_type", "?") for r in records).most_common()),
            "by_source_name_top20": dict(Counter(r.get("source_name", "?") for r in records).most_common(20)),
        },
        
        "exports": export_stats,
    }
    
    report_path = os.path.join(output_dir, "stats_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"  Report saved to: stats_report.json")
    
    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)
    ds = report["final_dataset"]
    print(f"  Total records: {ds['total_records']}")
    print(f"  Avg content length: {ds['content_length']['avg']} chars")
    print(f"  Avg quality score: {ds['quality_score']['avg']}")
    print(f"\n  By Language:")
    for lang, count in ds["by_language"].items():
        print(f"    {lang}: {count}")
    print(f"\n  By Pet Type:")
    for pt, count in ds["by_pet_type"].items():
        print(f"    {pt}: {count}")
    print(f"\n  By Category:")
    for cat, count in ds["by_category"].items():
        print(f"    {cat}: {count}")
    print(f"\n  Exports:")
    for name, count in export_stats.items():
        print(f"    {name}: {count} records")
    
    return report

def run_pipeline():
    print("\n" + "#" * 60)
    print("#  PET DATA PROCESSING PIPELINE")
    print(f"#  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("#" * 60)
    
    start_time = datetime.now()
    
    records, file_stats = step1_load_all(DATA_DIR)
    
    records = step2_normalize(records)
    
    records, filter_stats = step3_filter(records)
    
    records, dedup_stats = step4_deduplicate(records)
    
    records = step5_enrich(records)
    
    export_stats = step6_sort_and_export(records, OUTPUT_DIR)
    
    report = step7_report(records, file_stats, filter_stats, dedup_stats, export_stats, OUTPUT_DIR)
    
    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"\n{'=' * 60}")
    print(f"PIPELINE COMPLETED in {elapsed:.1f}s")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"{'=' * 60}")
    
    return report

if __name__ == "__main__":
    run_pipeline()
