REDDIT_SUBREDDITS = {
    
    # ===== EXOTIC & NICHE PETS =====
    "Tarantulas": {"pet_type": "reptile", "lang": "en", "priority": 1},
    "Spiders": {"pet_type": "reptile", "lang": "en", "priority": 1},
    "Axolotls": {"pet_type": "small", "lang": "en", "priority": 1},
    "IllegallyBigAxolotls": {"pet_type": "small", "lang": "en", "priority": 1},
    "ExoticPets": {"pet_type": "general", "lang": "en", "priority": 1},
    "Herpetology": {"pet_type": "reptile", "lang": "en", "priority": 1},
    "LizardBros": {"pet_type": "reptile", "lang": "en", "priority": 1},

    # ===== FUNNY / CUTE PETS =====
    "WhatsWrongWithYourDog": {"pet_type": "dog", "lang": "en", "priority": 1},
    "WhatsWrongWithYourCat": {"pet_type": "cat", "lang": "en", "priority": 1},
    "CatsStandingUp": {"pet_type": "cat", "lang": "en", "priority": 1},
    "IllegallyBigBeans": {"pet_type": "cat", "lang": "en", "priority": 1},
    "CatsAreAssholes": {"pet_type": "cat", "lang": "en", "priority": 1},
    "IllegallySmolRats": {"pet_type": "small", "lang": "en", "priority": 1},
    "FatAnimalsStandingUp": {"pet_type": "general", "lang": "en", "priority": 1},
    "IllegallyBigAnimals": {"pet_type": "general", "lang": "en", "priority": 1},
    "Zoomies": {"pet_type": "general", "lang": "en", "priority": 1},
    "Blep": {"pet_type": "general", "lang": "en", "priority": 1},

    # ===== AQUARIUMS ADVANCED =====
    "Aquascaping": {"pet_type": "fish", "lang": "en", "priority": 1},
    "Jellyfish": {"pet_type": "fish", "lang": "en", "priority": 1},

    # ===== BEHAVIOR & SCIENCE =====
    "AnimalBehavior": {"pet_type": "general", "lang": "en", "priority": 1},
    "PetBehavior": {"pet_type": "general", "lang": "en", "priority": 1},


}

VIETNAMESE_WEBSITES = [
    
]

ENGLISH_WEBSITES = [
    
]

SEARCH_QUERIES = {
    "vi": [
        "cách chăm sóc chó con mới sinh",
        "bệnh thường gặp ở mèo",
        "thức ăn tốt cho chó",
        "cách huấn luyện chó",
        "nuôi hamster như thế nào",
        "cách nuôi cá cảnh",
        "chăm sóc thỏ kiểng",
        "bệnh thú cưng phòng tránh",
        "tiêm phòng cho chó mèo",
        "chế độ dinh dưỡng cho thú cưng",
    ],
    "en": [
        "how to train a puppy",
        "cat health problems symptoms",
        "best dog food nutrition",
        "hamster care guide beginners",
        "aquarium fish care tips",
        "bird parrot training",
        "rabbit diet vegetables",
        "reptile gecko care",
        "pet vaccination schedule",
        "pet emergency first aid",
    ],
}


SCRAPING_CONFIG = {
    "default_limit_per_source": 1000,
    "delay_range": (1, 3),
    "delay_between_sources": (5, 10),
    "max_rate_limit_per_site": 3,
    "rate_limit_wait_max": 30,
    "preferred_language": "both",
    "priority_levels_to_scrape": [1],
    "export_format": "jsonl",

    "reddit_limit_per_source": 50,
    "reddit_min_score": 10,
    "include_comments": False,
    "reddit_delay_range": (3, 8),
    "reddit_max_retries": 5,


    "praw_enabled": False,
    "praw_client_id": "",
    "praw_client_secret": "",
    "praw_username": "",
    "praw_password": "",
    "praw_user_agent": "PetDataCollector/1.0 by u/yourusername",
}

def get_reddit_subreddits(priority_levels: list = None, pet_types: list = None) -> list:
    subreddits = []
    for name, info in REDDIT_SUBREDDITS.items():
        if priority_levels and info.get("priority") not in priority_levels:
            continue
        if pet_types and info.get("pet_type") not in pet_types:
            continue
        subreddits.append(name)
    return subreddits

def get_websites(language: str = "both", types: list = None, priority_levels: list = None) -> list:
    websites = []
    if language in ["vi", "both"]:
        websites.extend(VIETNAMESE_WEBSITES)
    if language in ["en", "both"]:
        websites.extend(ENGLISH_WEBSITES)
    if types:
        websites = [w for w in websites if w.get("type") in types]
    if priority_levels:
        websites = [w for w in websites if w.get("priority") in priority_levels]
    return websites


if __name__ == "__main__":
    print("=== Reddit Subreddits ===")
    print(f"Total: {len(REDDIT_SUBREDDITS)}")
    for pet_type in ["dog", "cat", "bird", "fish", "hamster", "rabbit", "turtle", "reptile", "general", "other"]:
        count = len([s for s, i in REDDIT_SUBREDDITS.items() if i["pet_type"] == pet_type])
        if count > 0:
            print(f"  {pet_type}: {count}")
    
    print(f"\n=== Vietnamese Websites: {len(VIETNAMESE_WEBSITES)} ===")
    print(f"=== English Websites: {len(ENGLISH_WEBSITES)} ===")
