import requests
import time
import random
import logging
from typing import List, Dict, Optional, Generator
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_schema import (
    PetDataItem, ScrapingResult, SourceType, Language,
    detect_pet_type, detect_category, calculate_quality_score
)

logger = logging.getLogger(__name__)

try:
    import praw
    PRAW_AVAILABLE = True
except ImportError:
    PRAW_AVAILABLE = False
    logger.debug("PRAW không được cài. Dùng: pip install praw để tăng tốc Reddit scraping.")

class RedditScraper:
    DEFAULT_SUBREDDITS = {
        'dogs': {'pet_type': 'dog', 'lang': 'en'},
        'dogtraining': {'pet_type': 'dog', 'lang': 'en'},
        'DogAdvice': {'pet_type': 'dog', 'lang': 'en'},
        'AskVet': {'pet_type': 'general', 'lang': 'en'},
        'puppy101': {'pet_type': 'dog', 'lang': 'en'},
        'Dogfood': {'pet_type': 'dog', 'lang': 'en'},
        
        'cats': {'pet_type': 'cat', 'lang': 'en'},
        'CatAdvice': {'pet_type': 'cat', 'lang': 'en'},
        'catcare': {'pet_type': 'cat', 'lang': 'en'},
        'CatTraining': {'pet_type': 'cat', 'lang': 'en'},
        'Kitten': {'pet_type': 'cat', 'lang': 'en'},
        
        'hamsters': {'pet_type': 'hamster', 'lang': 'en'},
        'Rabbits': {'pet_type': 'rabbit', 'lang': 'en'},
        'guineapigs': {'pet_type': 'other', 'lang': 'en'},
        'gerbil': {'pet_type': 'hamster', 'lang': 'en'},
        
        'parrots': {'pet_type': 'bird', 'lang': 'en'},
        'budgies': {'pet_type': 'bird', 'lang': 'en'},
        'cockatiel': {'pet_type': 'bird', 'lang': 'en'},
        'birdcare': {'pet_type': 'bird', 'lang': 'en'},
        
        'Aquariums': {'pet_type': 'fish', 'lang': 'en'},
        'bettafish': {'pet_type': 'fish', 'lang': 'en'},
        'goldfish': {'pet_type': 'fish', 'lang': 'en'},
        'PlantedTank': {'pet_type': 'fish', 'lang': 'en'},
        
        'reptiles': {'pet_type': 'reptile', 'lang': 'en'},
        'geckos': {'pet_type': 'reptile', 'lang': 'en'},
        'snakes': {'pet_type': 'reptile', 'lang': 'en'},
        'turtle': {'pet_type': 'turtle', 'lang': 'en'},
        
        'Pets': {'pet_type': 'general', 'lang': 'en'},
        'petcare': {'pet_type': 'general', 'lang': 'en'},
    }
    
    def __init__(self, 
                 user_agent: str = "PetDataCollector/1.0 (Educational Purpose)",
                 delay_range: tuple = (2, 5),
                 max_retries: int = 5,
                 praw_config: dict = None):
        self.user_agent = user_agent
        self.delay_range = delay_range
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': user_agent,
            'Accept': 'application/json',
        })

        self.reddit_praw = None
        if praw_config and praw_config.get('enabled') and PRAW_AVAILABLE:
            try:
                self.reddit_praw = praw.Reddit(
                    client_id=praw_config['client_id'],
                    client_secret=praw_config['client_secret'],
                    username=praw_config['username'],
                    password=praw_config['password'],
                    user_agent=praw_config.get('user_agent', user_agent),
                )
                logger.info("PRAW khởi tạo thành công — dùng OAuth API (60 req/min)")
            except Exception as e:
                logger.warning(f"PRAW khởi tạo thất bại: {e} — fallback sang public JSON API")
                self.reddit_praw = None
    
    def _random_delay(self):
        delay = random.uniform(*self.delay_range)
        time.sleep(delay)
    
    def _make_request(self, url: str) -> Optional[Dict]:
        for attempt in range(self.max_retries):
            try:
                response = self.session.get(url, timeout=30)
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    retry_after = response.headers.get('Retry-After')
                    if retry_after:
                        wait_time = int(retry_after)
                    else:
                        wait_time = min(30 * (2 ** attempt), 480)
                    logger.warning(f"Rate limited (attempt {attempt+1}). Waiting {wait_time}s...")
                    time.sleep(wait_time)
                elif response.status_code == 403:
                    logger.error(f"Access denied: {url}")
                    return None
                else:
                    logger.warning(f"HTTP {response.status_code} for {url}")
                    time.sleep(2 ** attempt)
                    
            except requests.RequestException as e:
                wait = min(5 * (2 ** attempt), 60)
                logger.error(f"Request error (attempt {attempt+1}): {e} — retry in {wait}s")
                time.sleep(wait)
        
        return None
    
    def get_subreddit_posts(self, 
                           subreddit: str,
                           sort: str = 'top',
                           time_filter: str = 'all',
                           limit: int = 100) -> Generator[Dict, None, None]:
        base_url = f"https://www.reddit.com/r/{subreddit}/{sort}.json"
        params = {
            'limit': min(limit, 100),
            't': time_filter
        }
        
        after = None
        collected = 0
        
        while collected < limit:
            url = f"{base_url}?limit={params['limit']}&t={params['t']}"
            if after:
                url += f"&after={after}"
            
            data = self._make_request(url)
            if not data:
                break
            
            posts = data.get('data', {}).get('children', [])
            if not posts:
                break
            
            for post in posts:
                if collected >= limit:
                    break
                yield post.get('data', {})
                collected += 1
            
            after = data.get('data', {}).get('after')
            if not after:
                break
            
            self._random_delay()
        
        logger.info(f"Collected {collected} posts from r/{subreddit}")
    
    def get_post_comments(self, 
                         subreddit: str, 
                         post_id: str, 
                         limit: int = 10) -> List[Dict]:
        url = f"https://www.reddit.com/r/{subreddit}/comments/{post_id}.json?limit={limit}"
        data = self._make_request(url)
        
        if not data or len(data) < 2:
            return []
        
        comments = []
        for comment in data[1].get('data', {}).get('children', [])[:limit]:
            comment_data = comment.get('data', {})
            if comment_data.get('body') and comment_data.get('author') != '[deleted]':
                comments.append({
                    'author': comment_data.get('author', ''),
                    'body': comment_data.get('body', ''),
                    'score': comment_data.get('score', 0),
                    'created_utc': comment_data.get('created_utc', 0)
                })
        
        return comments
    
    def _convert_to_pet_data(self, 
                            post: Dict, 
                            subreddit: str,
                            subreddit_info: Dict,
                            include_comments: bool = True) -> Optional[PetDataItem]:
        try:
            if post.get('removed_by_category') or post.get('author') == '[deleted]':
                return None
            
            title = post.get('title', '').strip()
            selftext = post.get('selftext', '').strip()
            
            if not title:
                return None
            
            if not selftext or selftext == '[removed]' or selftext == '[deleted]':
                selftext = title
            
            if len(selftext) < 80 and selftext == title:
                return None
            
            comments = []
            if include_comments and post.get('num_comments', 0) > 0:
                post_id = post.get('id')
                if post_id:
                    self._random_delay()
                    comments = self.get_post_comments(subreddit, post_id, limit=5)
            
            full_text = f"{title} {selftext}"
            
            pet_types = detect_pet_type(full_text)
            if subreddit_info.get('pet_type') and subreddit_info['pet_type'] not in pet_types:
                pet_types.insert(0, subreddit_info['pet_type'])
            
            categories = detect_category(full_text)
            
            images = []
            if post.get('url') and any(ext in post['url'].lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
                images.append(post['url'])
            if post.get('preview', {}).get('images'):
                for img in post['preview']['images'][:3]:
                    if img.get('source', {}).get('url'):
                        images.append(img['source']['url'].replace('&amp;', '&'))
            
            item = PetDataItem(
                id="",
                title=title,
                content=selftext if selftext else title,
                summary=title[:200] if len(title) < 200 else title[:197] + "...",
                
                pet_types=pet_types,
                categories=categories,
                tags=[subreddit] + post.get('link_flair_text', '').split() if post.get('link_flair_text') else [subreddit],
                
                source_type=SourceType.REDDIT.value,
                source_name=f"r/{subreddit}",
                source_url=f"https://www.reddit.com{post.get('permalink', '')}",
                language=subreddit_info.get('lang', Language.EN.value),
                
                author=post.get('author', ''),
                published_date=datetime.utcfromtimestamp(
                    post.get('created_utc', 0)
                ).isoformat() if post.get('created_utc') else None,
                
                upvotes=post.get('score', 0),
                comments_count=post.get('num_comments', 0),
                
                comments=comments,
                images=images,
                
                is_verified=False
            )
            
            item.quality_score = calculate_quality_score(item)
            
            return item
            
        except Exception as e:
            logger.error(f"Error converting post: {e}")
            return None
    
    def _scrape_subreddit_praw(self,
                              subreddit: str,
                              posts_limit: int,
                              min_score: int,
                              include_comments: bool) -> ScrapingResult:
        started_at = datetime.now().isoformat()
        items = []
        errors = []
        total_found = 0

        subreddit_info = self.DEFAULT_SUBREDDITS.get(subreddit, {'pet_type': 'general', 'lang': 'en'})

        try:
            sub = self.reddit_praw.subreddit(subreddit)
            for submission in sub.top(time_filter='all', limit=posts_limit * 2):
                total_found += 1
                if submission.score < min_score:
                    continue
                if submission.removed_by_category or submission.author is None:
                    continue

                title = submission.title.strip()
                selftext = submission.selftext.strip() if submission.selftext else ''

                if not selftext or selftext in ('[removed]', '[deleted]'):
                    selftext = title
                if len(selftext) < 80 and selftext == title:
                    continue

                comments = []
                if include_comments and submission.num_comments > 0:
                    submission.comments.replace_more(limit=0)
                    for c in list(submission.comments)[:5]:
                        if hasattr(c, 'body') and c.author:
                            comments.append({
                                'author': str(c.author),
                                'body': c.body,
                                'score': c.score,
                                'created_utc': c.created_utc,
                            })

                full_text = f"{title} {selftext}"
                pet_types = detect_pet_type(full_text)
                if subreddit_info.get('pet_type') and subreddit_info['pet_type'] not in pet_types:
                    pet_types.insert(0, subreddit_info['pet_type'])

                item = PetDataItem(
                    id="",
                    title=title,
                    content=selftext,
                    summary=title[:200],
                    pet_types=pet_types,
                    categories=detect_category(full_text),
                    tags=[subreddit],
                    source_type=SourceType.REDDIT.value,
                    source_name=f"r/{subreddit}",
                    source_url=f"https://www.reddit.com{submission.permalink}",
                    language=subreddit_info.get('lang', Language.EN.value),
                    author=str(submission.author) if submission.author else '',
                    published_date=datetime.utcfromtimestamp(submission.created_utc).isoformat(),
                    upvotes=submission.score,
                    comments_count=submission.num_comments,
                    comments=comments,
                    images=[submission.url] if any(ext in submission.url for ext in ['.jpg','.png','.gif']) else [],
                    is_verified=False,
                )
                item.quality_score = calculate_quality_score(item)

                if item.is_valid():
                    items.append(item)
                if len(items) >= posts_limit:
                    break

        except Exception as e:
            errors.append(f"PRAW error r/{subreddit}: {str(e)}")
            logger.error(f"PRAW error r/{subreddit}: {e}")

        return ScrapingResult(
            source_name=f"r/{subreddit}",
            total_found=total_found,
            successful=len(items),
            failed=total_found - len(items),
            items=items,
            errors=errors,
            started_at=started_at,
            completed_at=datetime.now().isoformat()
        )

    def scrape_subreddit(self,
                        subreddit: str,
                        posts_limit: int = 50,
                        min_score: int = 10,
                        include_comments: bool = False,
                        sort: str = 'top',
                        time_filter: str = 'all') -> ScrapingResult:
        if self.reddit_praw:
            logger.info(f"[PRAW] Scraping r/{subreddit}")
            return self._scrape_subreddit_praw(subreddit, posts_limit, min_score, include_comments)

        started_at = datetime.now().isoformat()
        items = []
        errors = []
        total_found = 0
        
        subreddit_info = self.DEFAULT_SUBREDDITS.get(subreddit, {
            'pet_type': 'general',
            'lang': 'en'
        })
        
        logger.info(f"Starting scrape of r/{subreddit}...")
        
        try:
            for post in self.get_subreddit_posts(subreddit, sort, time_filter, posts_limit * 2):
                total_found += 1
                
                if post.get('score', 0) < min_score:
                    continue
                
                item = self._convert_to_pet_data(post, subreddit, subreddit_info, include_comments)
                if item and item.is_valid():
                    items.append(item)
                
                if len(items) >= posts_limit:
                    break
                    
        except Exception as e:
            error_msg = f"Error scraping r/{subreddit}: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
        
        return ScrapingResult(
            source_name=f"r/{subreddit}",
            total_found=total_found,
            successful=len(items),
            failed=total_found - len(items),
            items=items,
            errors=errors,
            started_at=started_at,
            completed_at=datetime.now().isoformat()
        )
    
    def scrape_multiple_subreddits(self,
                                   subreddits: List[str] = None,
                                   posts_per_subreddit: int = 50,
                                   **kwargs) -> List[ScrapingResult]:
        if subreddits is None:
            subreddits = list(self.DEFAULT_SUBREDDITS.keys())
        
        results = []
        
        for i, subreddit in enumerate(subreddits):
            logger.info(f"Progress: {i+1}/{len(subreddits)} - r/{subreddit}")
            
            result = self.scrape_subreddit(subreddit, posts_per_subreddit, **kwargs)
            results.append(result)
            
            if i < len(subreddits) - 1:
                delay = random.uniform(5, 10)
                logger.info(f"Waiting {delay:.1f}s before next subreddit...")
                time.sleep(delay)
        
        return results
    
    def search_reddit(self, 
                     query: str,
                     subreddit: str = None,
                     limit: int = 100,
                     sort: str = 'relevance',
                     time_filter: str = 'all') -> ScrapingResult:
        started_at = datetime.now().isoformat()
        items = []
        errors = []
        
        if subreddit:
            base_url = f"https://www.reddit.com/r/{subreddit}/search.json"
            params_extra = "&restrict_sr=1"
        else:
            base_url = "https://www.reddit.com/search.json"
            params_extra = ""
        
        url = f"{base_url}?q={requests.utils.quote(query)}&sort={sort}&t={time_filter}&limit={min(limit, 100)}{params_extra}"
        
        logger.info(f"Searching Reddit for: {query}")
        
        data = self._make_request(url)
        if data:
            posts = data.get('data', {}).get('children', [])
            
            for post in posts[:limit]:
                post_data = post.get('data', {})
                post_subreddit = post_data.get('subreddit', '')
                subreddit_info = self.DEFAULT_SUBREDDITS.get(post_subreddit, {
                    'pet_type': 'general', 'lang': 'en'
                })
                
                item = self._convert_to_pet_data(post_data, post_subreddit, subreddit_info, False)
                if item and item.is_valid():
                    items.append(item)
        
        return ScrapingResult(
            source_name=f"Reddit Search: {query}",
            total_found=len(items),
            successful=len(items),
            failed=0,
            items=items,
            errors=errors,
            started_at=started_at,
            completed_at=datetime.now().isoformat()
        )

def main():
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description='Reddit Pet Data Scraper')
    parser.add_argument('--subreddits', nargs='+', help='List of subreddits to scrape')
    parser.add_argument('--limit', type=int, default=50, help='Posts per subreddit')
    parser.add_argument('--min-score', type=int, default=5, help='Minimum post score')
    parser.add_argument('--search', type=str, help='Search query instead of scraping')
    parser.add_argument('--output', type=str, default='reddit_data.jsonl', help='Output file')
    parser.add_argument('--no-comments', action='store_true', help='Skip fetching comments')
    
    args = parser.parse_args()
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    scraper = RedditScraper()
    all_items = []
    
    if args.search:
        result = scraper.search_reddit(args.search, limit=args.limit)
        all_items.extend(result.items)
        print(f"Found {result.successful} items for search: {args.search}")
    else:
        results = scraper.scrape_multiple_subreddits(
            subreddits=args.subreddits,
            posts_per_subreddit=args.limit,
            min_score=args.min_score,
            include_comments=not args.no_comments
        )
        
        for result in results:
            all_items.extend(result.items)
            print(f"{result.source_name}: {result.successful}/{result.total_found} posts")
    
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', args.output)
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in all_items:
            f.write(json.dumps(item.to_dict(), ensure_ascii=False) + '\n')
    
    print(f"\nTotal: {len(all_items)} items saved to {output_path}")

if __name__ == "__main__":
    main()
