import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import random
import logging
import re
from typing import List, Dict, Optional, Set, Generator
from datetime import datetime
from dataclasses import dataclass
import sys
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_schema import (
    PetDataItem, ScrapingResult, SourceType, Language,
    detect_pet_type, detect_category, calculate_quality_score
)

logger = logging.getLogger(__name__)

@dataclass
class SiteConfig:
    name: str
    base_url: str
    source_type: str = SourceType.BLOG.value
    language: str = Language.VI.value
    
    article_list_selector: str = "article, .post, .article, .entry, .blog-item, .news-item"
    article_link_selector: str = "a[href]"
    title_selector: str = "h1, .post-title, .entry-title, .article-title, .blog-title, .news-title"
    content_selector: str = ".post-content, .entry-content, .article-content, .blog-content, article, .content, .single-content, main"
    date_selector: str = "time, .date, .published, .post-date, .entry-date, [datetime]"
    author_selector: str = ".author, .byline, .writer, .author-name"
    image_selector: str = "img"
    
    article_url_pattern: str = r".*" 
    exclude_url_patterns: List[str] = None  
    min_url_path_segments: int = 2  
    

    sitemap_url: str = None  
    use_sitemap: bool = False 
    sitemap_min_words_in_slug: int = 3  
    

    max_pages: int = 50       
    max_articles: int = 500   
    crawl_depth: int = 3     
    
    must_contain_keywords: List[str] = None 
    
    def __post_init__(self):
        if self.exclude_url_patterns is None:
            self.exclude_url_patterns = [
                r'/tag/', r'/author/', r'#', r'/feed',
                r'\.pdf$', r'\.jpg$', r'\.png$', r'\.gif$', r'\.css$', r'\.js$',
                r'/cart', r'/checkout', r'/login', r'/register', r'/account',
                r'/search', r'/contact', r'/about-us', r'/gioi-thieu',
                r'/lien-he', r'/chinh-sach', r'/policy',
                r'/collections/', r'/products/', r'/san-pham/',
                r'^/$',
            ]
        if self.must_contain_keywords is None:
            self.must_contain_keywords = [
                'chó', 'mèo', 'thú cưng', 'pet', 'dog', 'cat',
                'hamster', 'cá', 'chim', 'thỏ', 'bird', 'fish',
                'thú y', 'veterinary', 'vet', 'canine', 'feline',
                'animal', 'puppy', 'kitten', 'spay', 'neuter'
            ]

VIETNAMESE_PET_SITES = [
    SiteConfig(
        name="ThuCanh",
        base_url="https://thucanh.vn/",
        source_type=SourceType.BLOG.value,
        language=Language.VI.value,
        article_url_pattern=r".*",
        min_url_path_segments=1,
        title_selector="h1, .entry-title, .post-title",
        content_selector=".entry-content, .post-content, article .content, main article",
        use_sitemap=False,
        max_articles=300,
    ),
    SiteConfig(
        name="PetMart Blog",
        base_url="https://petmart.vn/blog/",
        source_type=SourceType.BLOG.value,
        language=Language.VI.value,
        article_url_pattern=r"/blog/.*",
    ),
    SiteConfig(
        name="PetCity",
        base_url="https://petcity.vn/blogs/",
        source_type=SourceType.BLOG.value,
        language=Language.VI.value,
    ),
    SiteConfig(
        name="DogHouse VN",
        base_url="https://doghouse.vn/",
        source_type=SourceType.BLOG.value,
        language=Language.VI.value,
    ),
    SiteConfig(
        name="CatShop VN",
        base_url="https://catshop.vn/blog/",
        source_type=SourceType.BLOG.value,
        language=Language.VI.value,
    ),
]

ENGLISH_PET_SITES = [
    SiteConfig(
        name="GreatPetCare",
        base_url="https://www.greatpetcare.com/",
        source_type=SourceType.VET_CLINIC.value,
        language=Language.EN.value,
        article_url_pattern=r"/dog-health/|/cat-health/|/parasites/|/pet-medication/|/pet-vaccinations/|/dog-breeds/|/cat-breeds/|/new-pet/|/wellness/|/dog-behavior/|/cat-behavior/|/dog-nutrition/|/cat-nutrition/",
        title_selector="h1, .entry-title, .post-title",
        content_selector=".entry-content, .post-content, article .content, main article",
        sitemap_url="https://www.greatpetcare.com/post-sitemap.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=3,
        max_articles=500,
    ),
    SiteConfig(
        name="SugarCreekVet",
        base_url="https://sugarcreekvet.com/",
        source_type=SourceType.VET_CLINIC.value,
        language=Language.EN.value,
        article_url_pattern=r"/pet-health/",
        min_url_path_segments=1,
        title_selector="h1, .entry-title, .page-title",
        content_selector=".entry-content, .page-content, article, main .content",
        sitemap_url="https://sugarcreekvet.com/page-sitemap.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=2,
        max_articles=300,
    ),
    SiteConfig(
        name="VetStreet",
        base_url="https://www.vetstreet.com/",
        source_type=SourceType.BLOG.value,
        language=Language.EN.value,
        article_url_pattern=r".*",
        title_selector="h1, .article-title, .entry-title",
        content_selector=".article-content, .entry-content, .post-content, article, main",
        sitemap_url="https://www.vetstreet.com/post-sitemap.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=3,
        max_articles=500,
    ),
    SiteConfig(
        name="PetMD",
        base_url="https://www.petmd.com/",
        source_type=SourceType.VET_CLINIC.value,
        language=Language.EN.value,
        article_url_pattern=r"/dog/|/cat/|/bird/|/fish/",
        use_sitemap=False,
    ),
    SiteConfig(
        name="The Spruce Pets",
        base_url="https://www.thesprucepets.com/",
        source_type=SourceType.BLOG.value,
        language=Language.EN.value,
        sitemap_url="https://www.thesprucepets.com/sitemap_1.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=4,  
    ),
    SiteConfig(
        name="VCA Hospitals",
        base_url="https://vcahospitals.com/",
        source_type=SourceType.VET_CLINIC.value,
        language=Language.EN.value,
        sitemap_url="https://vcahospitals.com/-/sitemap/sitemap-kyp.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=2, 
        content_selector="[class*='kyp'], .kyp-content, .article-body, main",
        title_selector="h1",
    ),
    SiteConfig(
        name="Hill's Pet",
        base_url="https://www.hillspet.com/",
        source_type=SourceType.OFFICIAL.value,
        language=Language.EN.value,
        sitemap_url="https://www.hillspet.com/sitemap.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=3,
    ),
    SiteConfig(
        name="AKC",
        base_url="https://www.akc.org/",
        source_type=SourceType.OFFICIAL.value,
        language=Language.EN.value,
        sitemap_url="https://www.akc.org/sitemap.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=3,
        article_url_pattern=r"/expert-advice/",
    ),
    SiteConfig(
        name="BSAVA",
        base_url="https://www.bsava.com/",
        source_type=SourceType.NEWS.value,
        language=Language.EN.value,
        article_url_pattern=r".*",
        title_selector="h1, .page-title, .entry-title, .article-title",
        content_selector=".article-body, .node__content, .field--name-body, .entry-content, article, main",
        sitemap_url="https://www.bsava.com/sitemap.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=3,
        max_articles=400,
    ),
    SiteConfig(
        name="VetTimes",
        base_url="https://www.vettimes.com/",
        source_type=SourceType.NEWS.value,
        language=Language.EN.value,
        article_url_pattern=r"/news/",
        title_selector="h1, .entry-title, .article-title, .post-title",
        content_selector="[class*='article'], [class*='content'], .entry-content, .article-content, .post-content, article, main",
        sitemap_url="https://www.vettimes.com/sitemap.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=3,
        max_articles=500,
    ),
    SiteConfig(
        name="ASPCA",
        base_url="https://www.aspca.org/",
        source_type=SourceType.OFFICIAL.value,
        language=Language.EN.value,
        article_url_pattern=r"/pet-care/",
        title_selector="h1, .page-title, .node__title, .entry-title",
        content_selector="#article-panel, .center-wrapper, .field--name-body, .node__content, .entry-content, article, main",
        sitemap_url="https://www.aspca.org/sitemap.xml",
        use_sitemap=True,
        sitemap_min_words_in_slug=2,
    ),
    SiteConfig(
        name="BluePearl",
        base_url="https://bluepearlvet.com/",
        source_type=SourceType.VET_CLINIC.value,
        language=Language.EN.value,
        article_url_pattern=r"/pet-blog/",
        title_selector="h1, .entry-title, .post-title",
        content_selector=".entry-content, .post-content, article, main",
        use_sitemap=False,
    ),
    SiteConfig(
        name="VeterinaryPartner",
        base_url="https://veterinarypartner.vin.com/default.aspx?pid=19239",
        source_type=SourceType.OFFICIAL.value,
        language=Language.EN.value,
        min_url_path_segments=1,
        article_url_pattern=r"[?&]id=\d+",
        title_selector="h1, .vin-article-title, .article-title, .page-title",
        content_selector=".vin-article-content, .article-content, .vin-content, main, .content",
        use_sitemap=False,
        max_articles=300,
    ),
]

_DOMAIN_CONFIG_MAP = {}
for _sc in ENGLISH_PET_SITES + VIETNAMESE_PET_SITES:
    _d = urlparse(_sc.base_url).netloc.replace('www.', '')
    if _d not in _DOMAIN_CONFIG_MAP:
        _DOMAIN_CONFIG_MAP[_d] = _sc

def get_site_config_for_url(url: str, name: str = None, source_type: str = None,
                            language: str = None, max_articles: int = 500) -> SiteConfig:
    parsed = urlparse(url)
    domain = parsed.netloc.replace('www.', '')

    base = _DOMAIN_CONFIG_MAP.get(domain)
    if base:
        return SiteConfig(
            name=name or base.name,
            base_url=url,
            source_type=source_type or base.source_type,
            language=language or base.language,
            article_url_pattern=base.article_url_pattern,
            min_url_path_segments=base.min_url_path_segments,
            title_selector=base.title_selector,
            content_selector=base.content_selector,
            author_selector=base.author_selector,
            date_selector=base.date_selector,
            use_sitemap=base.use_sitemap,
            sitemap_url=base.sitemap_url,
            sitemap_min_words_in_slug=base.sitemap_min_words_in_slug,
            max_articles=max_articles,
        )

    if language is None:
        language = Language.VI.value if '.vn' in domain else Language.EN.value

    return SiteConfig(
        name=name or domain,
        base_url=url,
        source_type=source_type or SourceType.BLOG.value,
        language=language,
        max_articles=max_articles,
    )

class WebScraper:
    def __init__(self,
                 user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                 delay_range: tuple = (1, 3),
                 max_retries: int = 3,
                 timeout: int = 60,
                 max_rate_limit_per_site: int = 3,
                 rate_limit_wait_max: int = 60):
        self.user_agent = user_agent
        self.delay_range = delay_range
        self.max_retries = max_retries
        self.timeout = timeout
        self.max_rate_limit_per_site = max_rate_limit_per_site
        self.rate_limit_wait_max = rate_limit_wait_max
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        })
        
        self.visited_urls: Set[str] = set()
        self.rate_limit_count: int = 0
    
    def _random_delay(self):
        delay = random.uniform(*self.delay_range)
        time.sleep(delay)
    
    def _discover_from_sitemap(self, config: SiteConfig, max_urls: int = 500) -> List[str]:
        if not config.sitemap_url:
            return []
        
        logger.info(f"Fetching sitemap: {config.sitemap_url}")
        discovered = []
        
        try:
            response = self.session.get(config.sitemap_url, timeout=max(self.timeout, 120))
            if response.status_code != 200:
                logger.warning(f"Sitemap returned {response.status_code}")
                return []
            
            content = response.text
            
            if '<sitemapindex' in content:
                sitemap_locs = re.findall(r'<loc>(.*?)</loc>', content)
                logger.info(f"Found sitemap index with {len(sitemap_locs)} sitemaps")
                
                for sitemap_url in sitemap_locs[:5]:
                    try:
                        self._random_delay()
                        resp = self.session.get(sitemap_url, timeout=max(self.timeout, 120))
                        if resp.status_code == 200:
                            urls = re.findall(r'<loc>(.*?)</loc>', resp.text)
                            discovered.extend(urls)
                            logger.info(f"  Fetched {len(urls)} URLs from {sitemap_url}")
                    except Exception as e:
                        logger.error(f"Error fetching {sitemap_url}: {e}")
                        continue
            else:
                discovered = re.findall(r'<loc>(.*?)</loc>', content)
                logger.info(f"Found {len(discovered)} URLs in sitemap")
            
            filtered = []
            base_domain = urlparse(config.base_url).netloc.replace('www.', '')
            
            for url in discovered:
                url_domain = urlparse(url).netloc.replace('www.', '')
                if url_domain != base_domain:
                    continue

                if not self._is_valid_article_url(url, config):
                    continue
                
                path = urlparse(url).path.strip('/')
                last_segment = path.split('/')[-1] if path else ''
                slug = re.sub(r'-\d+$', '', last_segment)
                words = [w for w in slug.replace('-', ' ').split() if len(w) > 2]
                
                if len(words) >= config.sitemap_min_words_in_slug:
                    filtered.append(url)
            
            logger.info(f"Filtered to {len(filtered)} article URLs (min {config.sitemap_min_words_in_slug} words in slug)")
            return filtered[:max_urls]
            
        except Exception as e:
            logger.error(f"Error fetching sitemap: {e}")
            return []
    
    def _make_request(self, url: str, skip_on_rate_limit: bool = False) -> Optional[BeautifulSoup]:

        for attempt in range(self.max_retries):
            try:
                response = self.session.get(url, timeout=self.timeout)
                
                if response.status_code == 200:
                    return BeautifulSoup(response.content, 'html.parser')
                elif response.status_code == 429:
                    self.rate_limit_count += 1
                    
                    if self.rate_limit_count >= self.max_rate_limit_per_site:
                        logger.warning(f"Site rate limited {self.rate_limit_count}x. Skipping remaining articles.")
                        return None
                    
                    retry_after = response.headers.get('Retry-After')
                    if retry_after and retry_after.isdigit():
                        wait_time = min(int(retry_after), self.rate_limit_wait_max)
                    else:
                        wait_time = min(self.rate_limit_wait_max, 20 * (2 ** attempt))
                    logger.warning(f"Rate limited ({self.rate_limit_count}/{self.max_rate_limit_per_site}). Waiting {wait_time}s...")
                    time.sleep(wait_time)
                elif response.status_code == 403:
                    logger.warning(f"Access denied: {url}")
                    return None
                else:
                    logger.warning(f"HTTP {response.status_code} for {url}")
                    
            except requests.RequestException as e:
                logger.error(f"Request error (attempt {attempt + 1}): {e}")
                time.sleep(5 * (attempt + 1))
        
        return None
    
    def _is_valid_article_url(self, url: str, config: SiteConfig) -> bool:
        parsed = urlparse(url)
        path = parsed.path.strip('/')

        if parsed.query:
            params = {}
            for pair in parsed.query.split('&'):
                if '=' in pair:
                    k, v = pair.split('=', 1)
                    params[k.lower()] = v
            if 'id' in params and params['id'].isdigit() and 'catid' not in params:
                if config.article_url_pattern and config.article_url_pattern != r'.*':
                    return bool(re.search(config.article_url_pattern, url, re.IGNORECASE))
                return True

        if len(path) < 10:
            return False
        
        for pattern in config.exclude_url_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                return False
        
        if re.search(r'-\d{4,}$', path):
            if config.article_url_pattern and config.article_url_pattern != r'.*':
                return bool(re.search(config.article_url_pattern, url, re.IGNORECASE))
            return True
        
        segments = [s for s in path.split('/') if s]
        if len(segments) < config.min_url_path_segments:
            return False
        
        if config.article_url_pattern and config.article_url_pattern != r'.*':
            if not re.search(config.article_url_pattern, url, re.IGNORECASE):
                return False
        
        return True
    
    def _extract_text(self, soup: BeautifulSoup, selector: str) -> str:
        for sel in selector.split(','):
            element = soup.select_one(sel.strip())
            if element:
                return element.get_text(strip=True)
        return ""
    
    def _extract_content(self, soup: BeautifulSoup, selector: str) -> str:
        for sel in selector.split(','):
            element = soup.select_one(sel.strip())
            if element:
                for tag in element.find_all(['script', 'style', 'nav', 'header', 'footer', 'aside']):
                    tag.decompose()
                
                paragraphs = []
                for p in element.find_all(['p', 'h2', 'h3', 'h4', 'li']):
                    text = p.get_text(strip=True)
                    if text and len(text) > 20:
                        paragraphs.append(text)
                
                if paragraphs:
                    return '\n\n'.join(paragraphs)
                
                return element.get_text(separator='\n', strip=True)
        return ""
    
    def _extract_images(self, soup: BeautifulSoup, selector: str, base_url: str) -> List[str]:
        images = []
        for img in soup.select(selector)[:5]:
            src = img.get('src') or img.get('data-src')
            if src:
                full_url = urljoin(base_url, src)
                if any(ext in full_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                    images.append(full_url)
        return images
    
    def _extract_date(self, soup: BeautifulSoup, selector: str) -> Optional[str]:
        for sel in selector.split(','):
            element = soup.select_one(sel.strip())
            if element:
                datetime_attr = element.get('datetime')
                if datetime_attr:
                    return datetime_attr
                
                text = element.get_text(strip=True)
                patterns = [
                    r'\d{4}-\d{2}-\d{2}',
                    r'\d{2}/\d{2}/\d{4}',
                    r'\d{2}-\d{2}-\d{4}',
                ]
                for pattern in patterns:
                    match = re.search(pattern, text)
                    if match:
                        return match.group()
        return None
    
    def _contains_pet_keywords(self, text: str, keywords: List[str]) -> bool:
        text_lower = text.lower()
        return any(kw.lower() in text_lower for kw in keywords)
    
    def scrape_article(self, url: str, config: SiteConfig) -> Optional[PetDataItem]:
        if url in self.visited_urls:
            return None
        
        self.visited_urls.add(url)
        
        soup = self._make_request(url)
        if not soup:
            return None
        
        title = self._extract_text(soup, config.title_selector)
        content = self._extract_content(soup, config.content_selector)
        
        if not title or not content or len(content) < 100:
            return None
        
        full_text = f"{title} {content}"
        if config.must_contain_keywords and not self._contains_pet_keywords(full_text, config.must_contain_keywords):
            return None
        
        author = self._extract_text(soup, config.author_selector)
        pub_date = self._extract_date(soup, config.date_selector)
        images = self._extract_images(soup, config.image_selector, url)
        
        pet_types = detect_pet_type(full_text)
        categories = detect_category(full_text)
        
        item = PetDataItem(
            id="",
            title=title,
            content=content,
            summary=content[:200] + "..." if len(content) > 200 else content,
            
            pet_types=pet_types,
            categories=categories,
            tags=[],
            
            source_type=config.source_type,
            source_name=config.name,
            source_url=url,
            language=config.language,
            
            author=author if author else None,
            published_date=pub_date,
            
            images=images,
            is_verified=config.source_type == SourceType.VET_CLINIC.value
        )
        
        item.quality_score = calculate_quality_score(item)
        
        return item
    
    def _is_pagination_url(self, href: str) -> bool:
        pagination_patterns = [
            r'/page/\d+',
            r'\?page=\d+',
            r'\?p=\d+',
            r'/trang/\d+',
            r'/trang-\d+',
            r'\?paged=\d+',
            r'/p/\d+',
            r'[?&]offset=\d+',
            r'[?&]start=\d+',
            r'/\d+/?$',
        ]
        return any(re.search(pattern, href) for pattern in pagination_patterns)
    
    def _find_pagination_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        pagination_links = []
        base_domain = urlparse(base_url).netloc
        
        pagination_selectors = [
            '.pagination a',
            '.paging a', 
            '.page-numbers a',
            '.nav-links a',
            '.wp-pagenavi a',
            'nav.pagination a',
            '.paginate a',
            '[class*="pagination"] a',
            '[class*="pager"] a',
            '.next-page',
            '.load-more',
            'a[rel="next"]',
        ]
        
        for selector in pagination_selectors:
            for a in soup.select(selector):
                href = a.get('href', '')
                if href:
                    full_url = urljoin(base_url, href)
                    if urlparse(full_url).netloc == base_domain:
                        if full_url not in pagination_links:
                            pagination_links.append(full_url)
        
        for a in soup.find_all('a', href=True):
            href = a['href']
            if self._is_pagination_url(href):
                full_url = urljoin(base_url, href)
                if urlparse(full_url).netloc == base_domain:
                    if full_url not in pagination_links:
                        pagination_links.append(full_url)
        
        return pagination_links
    
    def _find_category_links(self, soup: BeautifulSoup, base_url: str, config: SiteConfig) -> List[str]:
        category_links = []
        base_domain = urlparse(base_url).netloc
        
        nav_selectors = [
            'nav a',
            '.menu a',
            '.nav a',
            '.sidebar a',
            '.categories a',
            '[class*="category"] a',
            '[class*="menu"] a',
        ]
        
        pet_category_keywords = [
            'dog', 'cat', 'bird', 'fish', 'pet', 'animal',
            'chó', 'mèo', 'chim', 'cá', 'thú cưng', 'thú y',
            'health', 'care', 'nutrition', 'training',
            'sức khỏe', 'chăm sóc', 'dinh dưỡng', 'huấn luyện',
        ]
        
        for selector in nav_selectors:
            for a in soup.select(selector):
                href = a.get('href', '')
                text = a.get_text(strip=True).lower()
                
                if any(kw in text or kw in href.lower() for kw in pet_category_keywords):
                    full_url = urljoin(base_url, href)
                    if urlparse(full_url).netloc == base_domain:
                        if full_url not in category_links:
                            category_links.append(full_url)
        
        return category_links[:10]
    
    def _find_articles_by_selector(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        article_urls = []
        base_domain = urlparse(base_url).netloc
        
        article_selectors = [
            '.post-item a',
            '.blog-post a', 
            '.article-item a',
            '.entry a',
            '.news-item a',
            'article.post a',
            '.post-title a',
            '.entry-title a',
            '.box-blog-post a',
            '.blog-item a',
            
            '.card a',
            '.card__title a',
            '.card__title-text',
            '.mntl-card a',
            '.comp a[href*="-"]',
            'a.mntl-card-list-items',
            '.article-card a',
            '.content-card a',
            '.teaser a',
            '.teaser__title a',
            
            'h2.title a',
            'h3.title a',
            '.card-title a',
            '.list-item a',
            '.item-post a',
            'article a[href]',
            '.article-list a',
            '.articles a',
        ]
        
        for selector in article_selectors:
            try:
                for a in soup.select(selector):
                    href = a.get('href', '')
                    if href and not href.startswith('#') and not href.startswith('javascript'):
                        full_url = urljoin(base_url, href)
                        parsed = urlparse(full_url)
                        if base_domain in parsed.netloc or parsed.netloc in base_domain:
                            if full_url not in article_urls:
                                article_urls.append(full_url)
            except Exception:
                continue
        
        return article_urls
    
    def discover_article_urls(self, 
                             start_url: str, 
                             config: SiteConfig,
                             max_urls: int = 100,
                             deep_crawl: bool = True) -> List[str]:
        if config.use_sitemap and config.sitemap_url:
            sitemap_urls = self._discover_from_sitemap(config, max_urls)
            if sitemap_urls:
                logger.info(f"Using {len(sitemap_urls)} URLs from sitemap")
                return sitemap_urls
            logger.warning("Sitemap discovery failed, falling back to crawling")
        
        discovered = []
        to_visit = [start_url]
        visited = set()
        pages_crawled = 0
        
        while to_visit and len(discovered) < max_urls and pages_crawled < config.max_pages * 3:
            url = to_visit.pop(0)
            if url in visited:
                continue
            visited.add(url)
            pages_crawled += 1
            
            soup = self._make_request(url)
            if not soup:
                continue
            
            self._random_delay()
            
            base_domain = urlparse(config.base_url).netloc
            
            selector_urls = self._find_articles_by_selector(soup, url)
            for article_url in selector_urls:
                if article_url not in discovered and article_url not in visited:
                    if urlparse(article_url).netloc == base_domain:
                        discovered.append(article_url)
            
            if len(selector_urls) < 3:
                for a in soup.find_all('a', href=True):
                    href = a['href']
                    full_url = urljoin(url, href)
                    
                    if urlparse(full_url).netloc != base_domain:
                        continue
                    
                    if self._is_valid_article_url(full_url, config):
                        if full_url not in discovered and full_url not in visited:
                            discovered.append(full_url)
            
            pagination_links = self._find_pagination_links(soup, url)
            for pag_url in pagination_links:
                if pag_url not in visited and pag_url not in to_visit:
                    to_visit.append(pag_url)
            
            if deep_crawl and pages_crawled <= 2:
                category_links = self._find_category_links(soup, url, config)
                for cat_url in category_links:
                    if cat_url not in visited and cat_url not in to_visit:
                        to_visit.append(cat_url)
            
            logger.info(f"[{pages_crawled}] Discovered {len(discovered)} articles, queue: {len(to_visit)}")
        
        logger.info(f"Total discovered: {len(discovered)} articles from {pages_crawled} pages")
        return discovered[:max_urls]
    
    def scrape_site(self, config: SiteConfig) -> ScrapingResult:
        started_at = datetime.now().isoformat()
        items = []
        errors = []
        
        self.rate_limit_count = 0
        
        logger.info(f"Starting scrape of {config.name}...")
        
        urls = self.discover_article_urls(config.base_url, config, config.max_articles)
        logger.info(f"Found {len(urls)} potential articles")
        
        for i, url in enumerate(urls):
            if self.rate_limit_count >= self.max_rate_limit_per_site:
                logger.warning(f"Stopping {config.name} - rate limited {self.rate_limit_count} times")
                errors.append(f"Site rate limited {self.rate_limit_count} times, skipped remaining {len(urls) - i} articles")
                break
            
            try:
                item = self.scrape_article(url, config)
                if item and item.is_valid():
                    items.append(item)
                    logger.info(f"[{i+1}/{len(urls)}] Scraped: {item.title[:50]}...")
                
                self._random_delay()
                
            except Exception as e:
                error_msg = f"Error scraping {url}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        return ScrapingResult(
            source_name=config.name,
            total_found=len(urls),
            successful=len(items),
            failed=len(urls) - len(items),
            items=items,
            errors=errors,
            started_at=started_at,
            completed_at=datetime.now().isoformat()
        )
    
    def scrape_url(self, url: str, source_name: str = None) -> ScrapingResult:
        started_at = datetime.now().isoformat()
        items = []
        errors = []
        
        parsed = urlparse(url)
        config = SiteConfig(
            name=source_name or parsed.netloc,
            base_url=url,
            language=Language.VI.value if '.vn' in parsed.netloc else Language.EN.value,
        )
        
        logger.info(f"Auto-scraping from: {url}")
        
        urls = self.discover_article_urls(url, config, config.max_articles)
        
        for article_url in urls:
            try:
                item = self.scrape_article(article_url, config)
                if item and item.is_valid():
                    items.append(item)
                self._random_delay()
            except Exception as e:
                errors.append(f"Error: {article_url} - {str(e)}")
        
        return ScrapingResult(
            source_name=config.name,
            total_found=len(urls),
            successful=len(items),
            failed=len(urls) - len(items),
            items=items,
            errors=errors,
            started_at=started_at,
            completed_at=datetime.now().isoformat()
        )
    
    def scrape_multiple_sites(self, 
                             sites: List[SiteConfig] = None,
                             include_vietnamese: bool = True,
                             include_english: bool = True) -> List[ScrapingResult]:
        if sites is None:
            sites = []
            if include_vietnamese:
                sites.extend(VIETNAMESE_PET_SITES)
            if include_english:
                sites.extend(ENGLISH_PET_SITES)
        
        results = []
        
        for i, config in enumerate(sites):
            logger.info(f"Progress: {i+1}/{len(sites)} - {config.name}")
            
            result = self.scrape_site(config)
            results.append(result)
            
            if i < len(sites) - 1:
                delay = random.uniform(10, 20)
                logger.info(f"Waiting {delay:.1f}s before next site...")
                time.sleep(delay)
        
        return results

class GoogleSearchScraper:
    
    def __init__(self):
        self.web_scraper = WebScraper()
    
    def search_google(self, query: str, num_results: int = 10) -> List[str]:
        urls = []
        search_url = f"https://www.google.com/search?q={requests.utils.quote(query)}&num={num_results}"
        
        soup = self.web_scraper._make_request(search_url)
        if soup:
            for result in soup.select('div.g a'):
                href = result.get('href', '')
                if href.startswith('/url?q='):
                    url = href.split('/url?q=')[1].split('&')[0]
                    if url.startswith('http') and 'google.com' not in url:
                        urls.append(url)
        
        return urls[:num_results]
    
    def search_and_scrape(self, 
                         queries: List[str],
                         results_per_query: int = 10) -> ScrapingResult:
        started_at = datetime.now().isoformat()
        all_urls = set()
        items = []
        errors = []
        
        for query in queries:
            logger.info(f"Searching: {query}")
            urls = self.search_google(query, results_per_query)
            all_urls.update(urls)
            time.sleep(5)
        
        for url in all_urls:
            try:
                result = self.web_scraper.scrape_url(url)
                items.extend(result.items)
            except Exception as e:
                errors.append(f"Error with {url}: {str(e)}")
        
        return ScrapingResult(
            source_name="Google Search",
            total_found=len(all_urls),
            successful=len(items),
            failed=len(all_urls) - len(items),
            items=items,
            errors=errors,
            started_at=started_at,
            completed_at=datetime.now().isoformat()
        )

def main():
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description='Web Pet Data Scraper')
    parser.add_argument('--url', type=str, help='Single URL to scrape')
    parser.add_argument('--sites', nargs='+', choices=['vn', 'en', 'all'], 
                       default=['all'], help='Site categories to scrape')
    parser.add_argument('--output', type=str, default='web_data.jsonl', help='Output file')
    parser.add_argument('--max-articles', type=int, default=50, help='Max articles per site')
    
    args = parser.parse_args()
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    scraper = WebScraper()
    all_items = []
    
    if args.url:
        result = scraper.scrape_url(args.url)
        all_items.extend(result.items)
        print(f"Scraped {result.successful} articles from {args.url}")
    else:
        include_vn = 'vn' in args.sites or 'all' in args.sites
        include_en = 'en' in args.sites or 'all' in args.sites
        
        results = scraper.scrape_multiple_sites(
            include_vietnamese=include_vn,
            include_english=include_en
        )
        
        for result in results:
            all_items.extend(result.items)
            print(f"{result.source_name}: {result.successful}/{result.total_found} articles")
    
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', args.output)
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in all_items:
            f.write(json.dumps(item.to_dict(), ensure_ascii=False) + '\n')
    
    print(f"\nTotal: {len(all_items)} items saved to {output_path}")

if __name__ == "__main__":
    main()
