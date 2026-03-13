import logging
import random
import re
import time
from datetime import datetime
from html import unescape
from typing import Dict, List, Optional

import requests
from bs4 import BeautifulSoup

from data_schema import (
    Language,
    PetDataItem,
    ScrapingResult,
    SourceType,
    calculate_quality_score,
    detect_category,
    detect_pet_type,
)

logger = logging.getLogger(__name__)


class QuoraScraper:
    def __init__(
        self,
        user_agent: str = "PetDataCollector/1.0 (Educational Purpose)",
        delay_range: tuple = (2, 5),
        max_retries: int = 3,
        timeout: int = 30,
    ):
        self.user_agent = user_agent
        self.delay_range = delay_range
        self.max_retries = max_retries
        self.timeout = timeout

        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": self.user_agent,
                "Accept": "application/rss+xml,application/xml,text/xml,text/html;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
            }
        )

    def _random_delay(self):
        time.sleep(random.uniform(*self.delay_range))

    def _make_request(self, url: str) -> Optional[requests.Response]:
        for attempt in range(self.max_retries):
            try:
                response = self.session.get(url, timeout=self.timeout)
                if response.status_code == 200:
                    return response
                if response.status_code == 403:
                    logger.warning(f"Quora blocked (403): {url}")
                    return None
                wait_time = min(2 ** attempt, 10)
                logger.warning(f"HTTP {response.status_code} for {url}, retry in {wait_time}s")
                time.sleep(wait_time)
            except requests.RequestException as error:
                wait_time = min(2 ** attempt, 10)
                logger.warning(f"Request error for {url}: {error}, retry in {wait_time}s")
                time.sleep(wait_time)
        return None

    @staticmethod
    def _strip_html(text: str) -> str:
        if not text:
            return ""
        soup = BeautifulSoup(text, "html.parser")
        clean = soup.get_text(" ", strip=True)
        clean = re.sub(r"\s+", " ", clean)
        return unescape(clean).strip()

    def _convert_rss_item(
        self,
        rss_item,
        topic_name: str,
        topic_pet_type: str,
        language: str = Language.EN.value,
    ) -> Optional[PetDataItem]:
        title = self._strip_html((rss_item.title.text if rss_item.title else "").strip())
        link = (rss_item.link.text if rss_item.link else "").strip()
        description = self._strip_html(rss_item.description.text if rss_item.description else "")
        published = (rss_item.pubdate.text if rss_item.pubdate else "").strip()

        if not title or not link:
            return None

        content = description if len(description) >= 50 else title
        full_text = f"{title} {content}".strip()

        pet_types = detect_pet_type(full_text)
        if topic_pet_type and topic_pet_type not in pet_types:
            pet_types.insert(0, topic_pet_type)

        categories = detect_category(full_text)

        item = PetDataItem(
            id="",
            title=title,
            content=content,
            summary=content[:200] + "..." if len(content) > 200 else content,
            pet_types=pet_types,
            categories=categories,
            tags=["quora", topic_name],
            source_type=SourceType.FORUM.value,
            source_name=f"Quora/{topic_name}",
            source_url=link,
            language=language,
            published_date=published if published else None,
            is_verified=False,
        )
        item.quality_score = calculate_quality_score(item)
        return item

    def scrape_topic(
        self,
        topic_slug: str,
        topic_name: str = None,
        pet_type: str = "general",
        language: str = Language.EN.value,
        limit: int = 30,
    ) -> ScrapingResult:
        started_at = datetime.now().isoformat()
        topic_name = topic_name or topic_slug

        items: List[PetDataItem] = []
        errors: List[str] = []

        rss_url = f"https://www.quora.com/topic/{topic_slug}/rss"
        response = self._make_request(rss_url)

        if not response:
            errors.append(f"Cannot fetch RSS: {rss_url}")
            return ScrapingResult(
                source_name=f"Quora/{topic_name}",
                total_found=0,
                successful=0,
                failed=0,
                items=[],
                errors=errors,
                started_at=started_at,
                completed_at=datetime.now().isoformat(),
            )

        feed = BeautifulSoup(response.text, "xml")
        rss_items = feed.find_all("item")

        for rss_item in rss_items[:limit]:
            try:
                item = self._convert_rss_item(
                    rss_item=rss_item,
                    topic_name=topic_name,
                    topic_pet_type=pet_type,
                    language=language,
                )
                if item and item.is_valid():
                    items.append(item)
            except Exception as error:
                errors.append(f"Convert item error: {error}")

        total_found = min(len(rss_items), limit)

        if rss_items and not items:
            errors.append("RSS fetched but no valid items after filtering")

        self._random_delay()

        return ScrapingResult(
            source_name=f"Quora/{topic_name}",
            total_found=total_found,
            successful=len(items),
            failed=max(total_found - len(items), 0),
            items=items,
            errors=errors,
            started_at=started_at,
            completed_at=datetime.now().isoformat(),
        )
