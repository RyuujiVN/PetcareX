import json
import os
from typing import List, Dict, Optional
from collections import Counter
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_schema import PetDataItem, load_from_jsonl

def load_data(filepath: str) -> List[PetDataItem]:
    if filepath.endswith('.jsonl'):
        return load_from_jsonl(filepath)
    else:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return [PetDataItem.from_dict(d) for d in data]

def filter_by_pet_type(items: List[PetDataItem], pet_types: List[str]) -> List[PetDataItem]:
    return [item for item in items if any(pt in item.pet_types for pt in pet_types)]

def filter_by_category(items: List[PetDataItem], categories: List[str]) -> List[PetDataItem]:
    return [item for item in items if any(cat in item.categories for cat in categories)]

def filter_by_quality(items: List[PetDataItem], min_score: float = 0.5) -> List[PetDataItem]:
    return [item for item in items if (item.quality_score or 0) >= min_score]

def filter_by_language(items: List[PetDataItem], language: str) -> List[PetDataItem]:
    return [item for item in items if item.language == language]

def filter_by_min_content_length(items: List[PetDataItem], min_length: int = 200) -> List[PetDataItem]:
    return [item for item in items if len(item.content) >= min_length]

def deduplicate(items: List[PetDataItem], by: str = 'url') -> List[PetDataItem]:
    seen = set()
    unique = []
    
    for item in items:
        if by == 'url':
            key = item.source_url
        elif by == 'title':
            key = item.title.lower().strip()
        elif by == 'id':
            key = item.id
        else:
            key = item.source_url
        
        if key not in seen:
            seen.add(key)
            unique.append(item)
    
    return unique

def clean_content(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\[deleted\]|\[removed\]', '', text)
    text = re.sub(r'http\S+', '', text)
    return text.strip()

def prepare_for_training(items: List[PetDataItem], 
                        include_title: bool = True,
                        include_comments: bool = False,
                        max_length: int = 2000) -> List[Dict]:
    training_data = []
    
    for item in items:
        parts = []
        if include_title:
            parts.append(f"Tiêu đề: {item.title}")
        
        content = clean_content(item.content)
        if len(content) > max_length:
            content = content[:max_length] + "..."
        parts.append(f"Nội dung: {content}")
        
        if include_comments and item.comments:
            comment_texts = []
            for c in item.comments[:3]:
                if c.get('body'):
                    comment_texts.append(f"- {clean_content(c['body'])[:200]}")
            if comment_texts:
                parts.append("Bình luận:\n" + "\n".join(comment_texts))
        
        text = "\n\n".join(parts)
        
        training_data.append({
            "text": text,
            "metadata": {
                "pet_types": item.pet_types,
                "categories": item.categories,
                "source": item.source_name,
                "language": item.language,
                "quality_score": item.quality_score
            }
        })
    
    return training_data

def convert_to_qa_format(items: List[PetDataItem]) -> List[Dict]:
    qa_data = []
    
    for item in items:
        title = item.title.strip()
        
        is_question = any([
            title.endswith('?'),
            title.lower().startswith(('how', 'what', 'why', 'when', 'where', 'can', 'should', 'is', 'are', 'do', 'does')),
            title.lower().startswith(('cách', 'tại sao', 'làm sao', 'như thế nào', 'có nên', 'khi nào', 'bao lâu'))
        ])
        
        if is_question and len(item.content) > 100:
            qa_data.append({
                "question": title,
                "answer": clean_content(item.content),
                "context": f"Nguồn: {item.source_name}, Loại: {', '.join(item.pet_types)}"
            })
    
    return qa_data

def split_by_topic(items: List[PetDataItem]) -> Dict[str, List[PetDataItem]]:
    topics = {}
    
    for item in items:
        for pet_type in item.pet_types:
            for category in item.categories:
                topic = f"{pet_type}_{category}"
                if topic not in topics:
                    topics[topic] = []
                topics[topic].append(item)
    
    return topics

def get_word_frequency(items: List[PetDataItem], top_n: int = 100) -> List[tuple]:
    all_text = ' '.join([f"{item.title} {item.content}" for item in items])
    words = re.findall(r'\b\w+\b', all_text.lower())
   
    stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 
                 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                 'và', 'của', 'là', 'được', 'cho', 'với', 'trong', 'này',
                 'có', 'không', 'đã', 'sẽ', 'để', 'từ', 'như', 'các', 'một'}
    
    words = [w for w in words if w not in stopwords and len(w) > 2]
    
    return Counter(words).most_common(top_n)

def export_for_finetuning(items: List[PetDataItem], 
                         output_path: str,
                         format: str = 'jsonl') -> None:
    training_data = prepare_for_training(items)
    
    if format == 'alpaca':
        alpaca_data = []
        for item in training_data:
            lines = item['text'].split('\n')
            title = lines[0].replace('Tiêu đề: ', '') if lines else ''
            content = '\n'.join(lines[1:])
            
            alpaca_data.append({
                "instruction": "Trả lời câu hỏi về thú cưng dựa trên thông tin được cung cấp.",
                "input": title,
                "output": content.replace('Nội dung: ', '')
            })
        training_data = alpaca_data
    
    elif format == 'sharegpt':
        sharegpt_data = []
        for item in training_data:
            lines = item['text'].split('\n')
            title = lines[0].replace('Tiêu đề: ', '') if lines else ''
            content = '\n'.join(lines[1:]).replace('Nội dung: ', '')
            
            sharegpt_data.append({
                "conversations": [
                    {"from": "human", "value": title},
                    {"from": "gpt", "value": content}
                ]
            })
        training_data = sharegpt_data
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in training_data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    print(f"Exported {len(training_data)} items to {output_path}")

def analyze_data(items: List[PetDataItem]) -> Dict:
    analysis = {
        "total_items": len(items),
        "avg_content_length": sum(len(i.content) for i in items) / len(items) if items else 0,
        "avg_quality_score": sum(i.quality_score or 0 for i in items) / len(items) if items else 0,
        "pet_type_distribution": Counter(pt for i in items for pt in i.pet_types),
        "category_distribution": Counter(c for i in items for c in i.categories),
        "source_distribution": Counter(i.source_name for i in items),
        "language_distribution": Counter(i.language for i in items),
        "has_comments": sum(1 for i in items if i.comments),
        "has_images": sum(1 for i in items if i.images),
        "top_words": get_word_frequency(items, 50)
    }
    return analysis

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python data_processor.py <data_file.jsonl>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    items = load_data(filepath)
    
    print(f"\nLoaded {len(items)} items")
    
    analysis = analyze_data(items)
    print(f"\n📊 Data Analysis:")
    print(f"  - Average content length: {analysis['avg_content_length']:.0f} chars")
    print(f"  - Average quality score: {analysis['avg_quality_score']:.2f}")
    print(f"  - Items with comments: {analysis['has_comments']}")
    print(f"  - Items with images: {analysis['has_images']}")
    
    print(f"\n🐾 Pet Types:")
    for pt, count in analysis['pet_type_distribution'].most_common(10):
        print(f"  - {pt}: {count}")
    
    print(f"\n📑 Categories:")
    for cat, count in analysis['category_distribution'].most_common(10):
        print(f"  - {cat}: {count}")
    
    high_quality = filter_by_quality(items, 0.6)
    print(f"\n⭐ High quality items (score >= 0.6): {len(high_quality)}")
    
    output_path = filepath.replace('.jsonl', '_training.jsonl')
    export_for_finetuning(high_quality, output_path, format='alpaca')
