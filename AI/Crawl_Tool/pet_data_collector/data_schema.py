from dataclasses import dataclass, field, asdict
from typing import List, Optional
from datetime import datetime
from enum import Enum
import json
import hashlib

class PetType(Enum):
    DOG = "dog"
    CAT = "cat"
    BIRD = "bird"
    FISH = "fish"
    HAMSTER = "hamster"
    RABBIT = "rabbit"
    TURTLE = "turtle"
    REPTILE = "reptile"
    OTHER = "other"
    GENERAL = "general"  

class ContentCategory(Enum):
    HEALTH = "health"                   
    NUTRITION = "nutrition"             
    TRAINING = "training"              
    CARE = "care"                       
    BREED_INFO = "breed_info"            
    PRODUCT_REVIEW = "product_review" 
    EXPERIENCE = "experience"           
    EMERGENCY = "emergency"             
    OTHER = "other"

class SourceType(Enum):
    REDDIT = "reddit"
    BLOG = "blog"
    NEWS = "news"
    VET_CLINIC = "vet_clinic"         
    FORUM = "forum"
    OFFICIAL = "official"             
    SOCIAL_MEDIA = "social_media"

class Language(Enum):
    VI = "vi"
    EN = "en"

@dataclass
class PetDataItem:
    id: str                                          
    title: str                                       
    content: str                                    
    summary: Optional[str] = None                    
    
    pet_types: List[str] = field(default_factory=list)          
    categories: List[str] = field(default_factory=list)          
    tags: List[str] = field(default_factory=list)                
    
    source_type: str = ""                            
    source_name: str = ""                           
    source_url: str = ""                             
    language: str = "vi"                             
    
    author: Optional[str] = None
    published_date: Optional[str] = None
    scraped_date: str = ""
    
    upvotes: Optional[int] = None
    comments_count: Optional[int] = None
    views: Optional[int] = None
    
    comments: List[dict] = field(default_factory=list)
    images: List[str] = field(default_factory=list)
    related_links: List[str] = field(default_factory=list)
    
    quality_score: Optional[float] = None          
    is_verified: bool = False                      
    
    def __post_init__(self):
        if not self.id and self.source_url:
            self.id = self.generate_id(self.source_url)
        if not self.scraped_date:
            self.scraped_date = datetime.now().isoformat()
    
    @staticmethod
    def generate_id(url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()[:16]
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'PetDataItem':
        return cls(**data)
    
    def validate(self) -> List[str]:
        errors = []
        if not self.title or len(self.title.strip()) < 5:
            errors.append("Title quá ngắn hoặc rỗng")
        if not self.content or len(self.content.strip()) < 50:
            errors.append("Content quá ngắn (< 50 ký tự)")
        if not self.source_url:
            errors.append("Thiếu source_url")
        return errors
    
    def is_valid(self) -> bool:
        return len(self.validate()) == 0

@dataclass
class ScrapingResult:
    source_name: str
    total_found: int
    successful: int
    failed: int
    items: List[PetDataItem]
    errors: List[str]
    started_at: str
    completed_at: str
    
    def to_dict(self) -> dict:
        return {
            "source_name": self.source_name,
            "total_found": self.total_found,
            "successful": self.successful,
            "failed": self.failed,
            "items": [item.to_dict() for item in self.items],
            "errors": self.errors,
            "started_at": self.started_at,
            "completed_at": self.completed_at
        }

def detect_pet_type(text: str) -> List[str]:
    text_lower = text.lower()
    detected = []
    
    pet_keywords = {
        PetType.DOG.value: ['dog', 'puppy', 'chó', 'cún', 'cẩu', 'doggo', 'pup'],
        PetType.CAT.value: ['cat', 'kitten', 'mèo', 'kitty', 'feline'],
        PetType.BIRD.value: ['bird', 'parrot', 'chim', 'vẹt', 'yến', 'canary'],
        PetType.FISH.value: ['fish', 'cá', 'aquarium', 'bể cá', 'goldfish'],
        PetType.HAMSTER.value: ['hamster', 'chuột hamster', 'gerbil'],
        PetType.RABBIT.value: ['rabbit', 'bunny', 'thỏ'],
        PetType.TURTLE.value: ['turtle', 'tortoise', 'rùa'],
        PetType.REPTILE.value: ['reptile', 'snake', 'lizard', 'bò sát', 'rắn', 'thằn lằn', 'gecko'],
    }
    
    for pet_type, keywords in pet_keywords.items():
        if any(kw in text_lower for kw in keywords):
            detected.append(pet_type)
    
    return detected if detected else [PetType.GENERAL.value]

def detect_category(text: str) -> List[str]:
    text_lower = text.lower()
    detected = []
    
    category_keywords = {
        ContentCategory.HEALTH.value: [
            'disease', 'sick', 'vet', 'doctor', 'symptom', 'treatment', 'medicine',
            'bệnh', 'ốm', 'thú y', 'triệu chứng', 'điều trị', 'thuốc', 'khám'
        ],
        ContentCategory.NUTRITION.value: [
            'food', 'diet', 'feed', 'eat', 'nutrition', 'kibble',
            'thức ăn', 'ăn', 'dinh dưỡng', 'hạt', 'pate', 'cơm'
        ],
        ContentCategory.TRAINING.value: [
            'train', 'behavior', 'command', 'trick', 'obedience',
            'huấn luyện', 'dạy', 'hành vi', 'vâng lời'
        ],
        ContentCategory.CARE.value: [
            'groom', 'bath', 'clean', 'care', 'brush',
            'tắm', 'chải', 'chăm sóc', 'vệ sinh', 'cắt móng'
        ],
        ContentCategory.EMERGENCY.value: [
            'emergency', 'urgent', 'poison', 'accident', 'help',
            'cấp cứu', 'khẩn cấp', 'ngộ độc', 'tai nạn'
        ],
        ContentCategory.BREED_INFO.value: [
            'breed', 'species', 'type', 'giống', 'loài', 'dòng'
        ],
    }
    
    for category, keywords in category_keywords.items():
        if any(kw in text_lower for kw in keywords):
            detected.append(category)
    
    return detected if detected else [ContentCategory.OTHER.value]

def calculate_quality_score(item: PetDataItem) -> float:
    score = 0.0
    
    content_len = len(item.content)
    if content_len > 2000:
        score += 0.3
    elif content_len > 500:
        score += 0.2
    elif content_len > 100:
        score += 0.1
    
    if item.pet_types and item.pet_types[0] != PetType.GENERAL.value:
        score += 0.1
    if item.categories and item.categories[0] != ContentCategory.OTHER.value:
        score += 0.1
    
    if item.upvotes and item.upvotes > 100:
        score += 0.2
    elif item.upvotes and item.upvotes > 10:
        score += 0.1
    
    if item.source_type == SourceType.VET_CLINIC.value:
        score += 0.2
    elif item.source_type == SourceType.OFFICIAL.value:
        score += 0.15
    
    if item.images:
        score += 0.05
    if item.comments:
        score += 0.05
    
    return min(score, 1.0)

def export_to_jsonl(items: List[PetDataItem], filepath: str):
    with open(filepath, 'w', encoding='utf-8') as f:
        for item in items:
            f.write(json.dumps(item.to_dict(), ensure_ascii=False) + '\n')

def export_to_json(items: List[PetDataItem], filepath: str):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump([item.to_dict() for item in items], f, ensure_ascii=False, indent=2)

def load_from_jsonl(filepath: str) -> List[PetDataItem]:
    items = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                items.append(PetDataItem.from_dict(json.loads(line)))
    return items

if __name__ == "__main__":
    sample = PetDataItem(
        id="",
        title="Cách chăm sóc chó con mới đẻ",
        content="Chó con mới đẻ cần được giữ ấm và cho bú mẹ đầy đủ...",
        source_url="https://example.com/article/1",
        source_type=SourceType.VET_CLINIC.value,
        source_name="PetMart Vet",
        pet_types=[PetType.DOG.value],
        categories=[ContentCategory.CARE.value],
        language=Language.VI.value
    )
    
    print("Sample data:")
    print(sample.to_json())
    print(f"\nValidation: {sample.validate()}")
    print(f"Quality score: {calculate_quality_score(sample)}")
