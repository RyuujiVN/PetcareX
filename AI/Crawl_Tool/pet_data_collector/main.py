import json
import logging
import os
from datetime import datetime
from typing import List

from data_schema import PetDataItem, ScrapingResult, export_to_jsonl, export_to_json
from scrapers.reddit_scraper import RedditScraper
from scrapers.quora_scraper import QuoraScraper
from scrapers.web_scraper import WebScraper, SiteConfig, VIETNAMESE_PET_SITES, ENGLISH_PET_SITES, get_site_config_for_url
from config import (
    REDDIT_SUBREDDITS, VIETNAMESE_WEBSITES, ENGLISH_WEBSITES,
    SCRAPING_CONFIG, get_reddit_subreddits, get_websites, get_quora_topics
)

logger = logging.getLogger('pet_collector')
if not logger.handlers:
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    file_handler = logging.FileHandler('pet_collector.log', encoding='utf-8')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    logger.propagate = False 

class PetDataCollector:
    
    def __init__(self, config: dict = None):
        self.config = config or SCRAPING_CONFIG
        praw_config = None
        if self.config.get('praw_enabled') and self.config.get('praw_client_id'):
            praw_config = {
                'enabled': True,
                'client_id': self.config['praw_client_id'],
                'client_secret': self.config['praw_client_secret'],
                'username': self.config['praw_username'],
                'password': self.config['praw_password'],
                'user_agent': self.config.get('praw_user_agent', 'PetDataCollector/1.0'),
            }
        self.reddit_scraper = RedditScraper(
            delay_range=tuple(self.config.get('reddit_delay_range', (3, 8))),
            max_retries=self.config.get('reddit_max_retries', 5),
            praw_config=praw_config,
        )
        self.quora_scraper = QuoraScraper(
            delay_range=tuple(self.config.get('quora_delay_range', (2, 5))),
            max_retries=self.config.get('quora_max_retries', 3),
        )
        self.web_scraper = WebScraper(
            delay_range=tuple(self.config.get('delay_range', (1, 3))),
            max_rate_limit_per_site=self.config.get('max_rate_limit_per_site', 3),
            rate_limit_wait_max=self.config.get('rate_limit_wait_max', 30)
        )
        self.all_items: List[PetDataItem] = []
        self.results: List[ScrapingResult] = [] 
        self.output_dir = os.path.join(os.path.dirname(__file__), 'data') 
        self.auto_save_file = os.path.join(self.output_dir, 'auto_save.jsonl')
    
    def _auto_save(self):
        if self.all_items:
            os.makedirs(self.output_dir, exist_ok=True)
            with open(self.auto_save_file, 'w', encoding='utf-8') as f:
                for item in self.all_items:
                    f.write(json.dumps(item.to_dict(), ensure_ascii=False) + '\n')
            logger.info(f"[Auto-save] Đã lưu {len(self.all_items)} items vào {self.auto_save_file}")
    
    def collect_from_reddit(self,
                           subreddits: List[str] = None,
                           posts_per_subreddit: int = None,
                           pet_types: List[str] = None) -> List[PetDataItem]:
        logger.info("=" * 50)
        logger.info("BẮT ĐẦU THU THẬP TỪ REDDIT")
        logger.info("=" * 50)
        
        if subreddits is None:
            priority_levels = self.config.get('priority_levels_to_scrape', [1, 2])
            subreddits = get_reddit_subreddits(priority_levels, pet_types)
        
        if posts_per_subreddit is None:
            posts_per_subreddit = self.config.get('reddit_limit_per_source', 50)
        
        logger.info(f"Sẽ thu thập từ {len(subreddits)} subreddits, mỗi sub {posts_per_subreddit} posts")
        
        items = []
        for i, subreddit in enumerate(subreddits):
            try:
                logger.info(f"Progress: {i+1}/{len(subreddits)} - r/{subreddit}")
                
                result = self.reddit_scraper.scrape_subreddit(
                    subreddit=subreddit,
                    posts_limit=posts_per_subreddit,
                    min_score=self.config.get('reddit_min_score', 10),
                    include_comments=self.config.get('include_comments', False),
                )
                
                items.extend(result.items)
                self.results.append(result)
                self.all_items.extend(result.items)
                
                logger.info(f"  ✓ r/{subreddit}: {result.successful} items")
                self._auto_save()
                if i < len(subreddits) - 1:
                    import time, random
                    d_min, d_max = self.config.get('delay_between_sources', (5, 10))
                    delay = random.uniform(d_min, d_max)
                    logger.info(f"Waiting {delay:.1f}s...")
                    time.sleep(delay)
                    
            except Exception as e:
                logger.error(f"Lỗi r/{subreddit}: {e}")
                continue
        
        logger.info(f"REDDIT HOÀN TẤT: {len(items)} items")
        return items
    
    def collect_from_websites(self,
                             language: str = None,
                             site_types: List[str] = None,
                             articles_per_site: int = None) -> List[PetDataItem]:
        logger.info("=" * 50)
        logger.info("BẮT ĐẦU THU THẬP TỪ WEBSITES")
        logger.info("=" * 50)
        
        if language is None:
            language = self.config.get('preferred_language', 'vi')
        
        if articles_per_site is None:
            articles_per_site = self.config.get('default_limit_per_source', 50)
        
        items = []
        all_sites = []
        
        if language in ['vi', 'both']:
            priority_levels = self.config.get('priority_levels_to_scrape', [1])
            vi_websites = get_websites('vi', site_types, priority_levels)
            logger.info(f"Vietnamese websites: {len(vi_websites)}")
            for site in vi_websites:
                all_sites.append({
                    'config': get_site_config_for_url(
                        url=site['url'],
                        name=site['name'],
                        source_type=site.get('type', 'blog'),
                        language='vi',
                        max_articles=articles_per_site,
                    ),
                    'source': 'config'
                })
        
        if language in ['en', 'both']:
            priority_levels = self.config.get('priority_levels_to_scrape', [1])
            en_websites = get_websites('en', site_types, priority_levels)
            logger.info(f"English websites from config: {len(en_websites)}")
            for site in en_websites:
                all_sites.append({
                    'config': get_site_config_for_url(
                        url=site['url'],
                        name=site['name'],
                        source_type=site.get('type', 'blog'),
                        language='en',
                        max_articles=articles_per_site,
                    ),
                    'source': 'config'
                })
        
        logger.info(f"Tổng: {len(all_sites)} websites")
        
        for i, site_info in enumerate(all_sites):
            config = site_info['config']
            try:
                logger.info(f"Progress: {i+1}/{len(all_sites)} - {config.name} [{site_info['source']}]")
                
                result = self.web_scraper.scrape_site(config)
                items.extend(result.items)
                self.results.append(result)
                self.all_items.extend(result.items)
                
                logger.info(f"  ✓ {result.source_name}: {result.successful} items")
                
                self._auto_save()
                
                if i < len(all_sites) - 1:
                    import time, random
                    d_min, d_max = self.config.get('delay_between_sources', (5, 10))
                    delay = random.uniform(d_min, d_max)
                    logger.info(f"Waiting {delay:.1f}s...")
                    time.sleep(delay)
                    
            except Exception as e:
                logger.error(f"Lỗi site {config.name}: {e}")
                continue
        
        logger.info(f"WEBSITES HOÀN TẤT: {len(items)} items")
        return items

    def collect_from_quora(self,
                           topics: List[dict] = None,
                           questions_per_topic: int = None,
                           pet_types: List[str] = None) -> List[PetDataItem]:
        logger.info("=" * 50)
        logger.info("BẮT ĐẦU THU THẬP TỪ QUORA")
        logger.info("=" * 50)

        if topics is None:
            priority_levels = self.config.get('priority_levels_to_scrape', [1])
            topics = get_quora_topics(priority_levels, pet_types)

        if questions_per_topic is None:
            questions_per_topic = self.config.get('quora_limit_per_topic', 30)

        logger.info(f"Sẽ thu thập từ {len(topics)} topics, mỗi topic {questions_per_topic} items")

        items = []
        for i, topic in enumerate(topics):
            try:
                logger.info(f"Progress: {i+1}/{len(topics)} - Quora/{topic.get('name')}")

                result = self.quora_scraper.scrape_topic(
                    topic_slug=topic.get('slug', topic.get('name', 'Pet-Care')),
                    topic_name=topic.get('name', topic.get('slug', 'Pet-Care')),
                    pet_type=topic.get('pet_type', 'general'),
                    language=topic.get('lang', 'en'),
                    limit=questions_per_topic,
                )

                items.extend(result.items)
                self.results.append(result)
                self.all_items.extend(result.items)

                logger.info(f"  ✓ Quora/{topic.get('name')}: {result.successful} items")
                if result.errors:
                    logger.warning(f"    {result.errors[0]}")

                self._auto_save()

                if i < len(topics) - 1:
                    import time, random
                    d_min, d_max = self.config.get('delay_between_sources', (5, 10))
                    delay = random.uniform(d_min, d_max)
                    logger.info(f"Waiting {delay:.1f}s...")
                    time.sleep(delay)

            except Exception as e:
                logger.error(f"Lỗi Quora/{topic.get('name')}: {e}")
                continue

        logger.info(f"QUORA HOÀN TẤT: {len(items)} items")
        return items
    
    def collect_from_url(self, url: str, name: str = None) -> List[PetDataItem]:
        logger.info("=" * 50)
        logger.info(f"THU THẬP TỪ URL: {url}")
        logger.info("=" * 50)
        
        result = self.web_scraper.scrape_url(url, name)
        self.results.append(result)
        
        logger.info(f"Hoàn tất: {result.successful} items từ {url}")
        self.all_items.extend(result.items)
        self._auto_save()
        return result.items
    
    def search_and_collect(self, 
                          query: str,
                          source: str = 'reddit',
                          limit: int = 50) -> List[PetDataItem]:
        logger.info("=" * 50)
        logger.info(f"TÌM KIẾM: '{query}' trên {source}")
        logger.info("=" * 50)
        
        if source == 'reddit':
            result = self.reddit_scraper.search_reddit(query, limit=limit)
        else:
            logger.warning("Web search đang được phát triển")
            return []
        
        self.results.append(result)
        self.all_items.extend(result.items)
        
        logger.info(f"Tìm thấy: {result.successful} items")
        return result.items
    
    def collect_all(self,
                   include_reddit: bool = True,
                   include_web: bool = True,
                   include_quora: bool = True) -> List[PetDataItem]:
        logger.info("=" * 60)
        logger.info("BẮT ĐẦU THU THẬP DỮ LIỆU THÚ CƯNG TỰ ĐỘNG")
        logger.info(f"Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 60)
        
        if include_reddit:
            self.collect_from_reddit()
        
        if include_web:
            self.collect_from_websites()

        if include_quora and self.config.get('quora_enabled', True):
            self.collect_from_quora()
        
        logger.info("=" * 60)
        logger.info(f"HOÀN TẤT TOÀN BỘ: {len(self.all_items)} items")
        logger.info("=" * 60)
        
        return self.all_items
    
    def get_statistics(self) -> dict:
        stats = {
            "total_items": len(self.all_items),
            "total_sources": len(self.results),
            "by_source_type": {},
            "by_pet_type": {},
            "by_category": {},
            "by_language": {},
            "quality_distribution": {
                "high": 0,
                "medium": 0,
                "low": 0
            }
        }
        
        for item in self.all_items:
            st = item.source_type
            stats["by_source_type"][st] = stats["by_source_type"].get(st, 0) + 1
            
            for pt in item.pet_types:
                stats["by_pet_type"][pt] = stats["by_pet_type"].get(pt, 0) + 1
            
            for cat in item.categories:
                stats["by_category"][cat] = stats["by_category"].get(cat, 0) + 1
            
            lang = item.language
            stats["by_language"][lang] = stats["by_language"].get(lang, 0) + 1
            
            score = item.quality_score or 0
            if score > 0.7:
                stats["quality_distribution"]["high"] += 1
            elif score > 0.4:
                stats["quality_distribution"]["medium"] += 1
            else:
                stats["quality_distribution"]["low"] += 1
        
        return stats
    
    def save_results(self, 
                    output_dir: str = None,
                    filename: str = None,
                    format: str = None) -> str:
        if output_dir is None:
            output_dir = os.path.join(os.path.dirname(__file__), 'data')
        
        os.makedirs(output_dir, exist_ok=True)
        
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"pet_data_{timestamp}"
        
        if format is None:
            format = self.config.get('export_format', 'jsonl')
        
        filepath = os.path.join(output_dir, f"{filename}.{format}")
        
        if format == 'jsonl':
            export_to_jsonl(self.all_items, filepath)
        else:
            export_to_json(self.all_items, filepath)
        
        stats_path = os.path.join(output_dir, f"{filename}_stats.json")
        with open(stats_path, 'w', encoding='utf-8') as f:
            json.dump(self.get_statistics(), f, ensure_ascii=False, indent=2)
        
        logger.info(f"Đã lưu {len(self.all_items)} items vào {filepath}")
        logger.info(f"Thống kê đã lưu vào {stats_path}")
        
        return filepath
    
    def print_summary(self):
        stats = self.get_statistics()
        
        print("\nTheo loại nguồn:")
        for source, count in stats['by_source_type'].items():
            print(f"  - {source}: {count}")
        
        print("\nTheo loại thú cưng:")
        for pet, count in sorted(stats['by_pet_type'].items(), key=lambda x: -x[1])[:10]:
            print(f"  - {pet}: {count}")
        
        print("\nTheo danh mục:")
        for cat, count in sorted(stats['by_category'].items(), key=lambda x: -x[1])[:10]:
            print(f"  - {cat}: {count}")
        
        print("\nTheo ngôn ngữ:")
        for lang, count in stats['by_language'].items():
            print(f"  - {lang}: {count}")
        
        print("\nPhân bố chất lượng:")
        qd = stats['quality_distribution']
        total = qd['high'] + qd['medium'] + qd['low']
        if total > 0:
            print(f"  - Cao (>0.7): {qd['high']} ({qd['high']*100//total}%)")
            print(f"  - Trung bình: {qd['medium']} ({qd['medium']*100//total}%)")
            print(f"  - Thấp (<0.4): {qd['low']} ({qd['low']*100//total}%)")
        
        print("\n" + "=" * 60)

def main():
    print("=" * 60)
    print("[*] PET DATA COLLECTOR - Thu thap du lieu thu cung")
    print("=" * 60)
    
    collector = PetDataCollector()
    
    try:
        collector.collect_from_websites(language='both')
        if collector.config.get('quora_enabled', True):
            collector.collect_from_quora()
        collector.collect_from_reddit()

        if collector.all_items:
            output_path = collector.save_results()
            collector.print_summary()
            print(f"\n[OK] File da luu: {output_path}")
        else:
            print("\n[!] Khong thu thap duoc du lieu nao!")
            
    except KeyboardInterrupt:
        print("\n\n[!] Da dung boi nguoi dung")
        if collector.all_items:
            print(f"Da thu thap duoc {len(collector.all_items)} items")
            collector.save_results()
            print("[OK] Da tu dong luu du lieu!")
    except Exception as e:
        logger.error(f"Loi: {e}", exc_info=True)
        if collector.all_items:
            collector.save_results()
            print(f"[OK] Da luu {len(collector.all_items)} items truoc khi loi")
        raise

if __name__ == "__main__":
    main()
