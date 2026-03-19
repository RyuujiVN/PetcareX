REDDIT_SUBREDDITS = {
    "dogs": {"pet_type": "dog", "lang": "en", "priority": 1},
    "DogAdvice": {"pet_type": "dog", "lang": "en", "priority": 1},
    "AskVet": {"pet_type": "general", "lang": "en", "priority": 1},
    "puppy101": {"pet_type": "dog", "lang": "en", "priority": 1},
    "dogtraining": {"pet_type": "dog", "lang": "en", "priority": 1},
    "reactivedogs": {"pet_type": "dog", "lang": "en", "priority": 1},

    "cats": {"pet_type": "cat", "lang": "en", "priority": 1},
    "CatAdvice": {"pet_type": "cat", "lang": "en", "priority": 1},
    "catcare": {"pet_type": "cat", "lang": "en", "priority": 1},
    "CatTraining": {"pet_type": "cat", "lang": "en", "priority": 1},
    "kittens": {"pet_type": "cat", "lang": "en", "priority": 1},

    "Pets": {"pet_type": "general", "lang": "en", "priority": 1},
    "PetAdvice": {"pet_type": "general", "lang": "en", "priority": 1},
    "veterinary": {"pet_type": "general", "lang": "en", "priority": 1},

    "hamsters": {"pet_type": "hamster", "lang": "en", "priority": 1},
    "hamstercare": {"pet_type": "hamster", "lang": "en", "priority": 1},
    "Rabbits": {"pet_type": "rabbit", "lang": "en", "priority": 1},

    "parrots": {"pet_type": "bird", "lang": "en", "priority": 1},
    "budgies": {"pet_type": "bird", "lang": "en", "priority": 1},
    "cockatiel": {"pet_type": "bird", "lang": "en", "priority": 1},

    "Aquariums": {"pet_type": "fish", "lang": "en", "priority": 1},
    "bettafish": {"pet_type": "fish", "lang": "en", "priority": 1},
    "goldfish": {"pet_type": "fish", "lang": "en", "priority": 1},
    "PlantedTank": {"pet_type": "fish", "lang": "en", "priority": 1},

    "reptiles": {"pet_type": "reptile", "lang": "en", "priority": 1},
    "leopardgeckos": {"pet_type": "reptile", "lang": "en", "priority": 1},
    "BeardedDragons": {"pet_type": "reptile", "lang": "en", "priority": 1},
    "ballpython": {"pet_type": "reptile", "lang": "en", "priority": 1},
    "snakes": {"pet_type": "reptile", "lang": "en", "priority": 1},
    "turtle": {"pet_type": "turtle", "lang": "en", "priority": 1},
    "tortoises": {"pet_type": "turtle", "lang": "en", "priority": 2},
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
