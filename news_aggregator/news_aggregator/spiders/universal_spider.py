import json
import os
import re
import ssl
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlsplit, urlunsplit

import scrapy
import urllib3
from dateutil import parser
from newspaper import Article, Config


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context


class NewsSpider(scrapy.Spider):
    name = "news_spider"

    MAX_RSS_CANDIDATES = 45
    MAX_HTML_CANDIDATES = 45
    MIN_ARTICLE_WORDS = 45
    TRACKING_PARAMS = {
        "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source",
    }
    BLOCKED_PATH_PARTS = {
        "/account", "/advert", "/author/", "/authors/", "/category/", "/contact",
        "/events", "/feed", "/forum", "/login", "/members/", "/newsletter",
        "/podcast", "/privacy", "/profile/", "/search", "/shop", "/sign-in",
        "/signin", "/signup", "/subscribe", "/tag/", "/tags/", "/terms",
        "/topic/", "/topics/", "/user/", "/video/",
    }
    NON_ARTICLE_EXTENSIONS = (
        ".css", ".gif", ".ico", ".jpeg", ".jpg", ".js", ".json", ".pdf",
        ".png", ".svg", ".webp", ".xml", ".zip",
    )
    NON_STORY_LABELS = {
        "about", "advertise", "all", "careers", "contact", "home", "latest",
        "login", "menu", "more", "newsletter", "podcasts", "privacy",
        "search", "see all", "sign in", "subscribe", "terms", "videos",
    }

    def __init__(self, *args, **kwargs):
        super(NewsSpider, self).__init__(*args, **kwargs)
        self.news_config = Config()
        self.news_config.browser_user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
        self.news_config.request_timeout = 10
        self.news_config.request_args = {"verify": False, "timeout": 10}

        raw_keywords = getattr(self, "keyword", "")
        self.keywords = [
            keyword.strip().lower()
            for keyword in str(raw_keywords).split(",")
            if keyword.strip()
        ]
        self.keyword_patterns = [
            (keyword, re.compile(r"(?<!\w)" + re.escape(keyword) + r"(?!\w)", re.IGNORECASE))
            for keyword in self.keywords
        ]
        self.target_sites = getattr(self, "target_sites", "All")
        self.start_date = self.parse_filter_date(getattr(self, "from_date", None))
        self.end_date = self.parse_filter_date(getattr(self, "to_date", None))
        self.seen_article_urls = set()
        self.fallback_sources = set()
        print("LOG: Spider initialized. RSS-first content validation enabled.", flush=True)

    async def start(self):
        for request in self.build_initial_requests():
            yield request

    def start_requests(self):
        # Kept for compatibility with older Scrapy installations.
        yield from self.build_initial_requests()

    def build_initial_requests(self):
        sites_path = os.path.abspath(os.path.join(os.getcwd(), "..", "sites.json"))
        if not os.path.exists(sites_path):
            sites_path = os.path.join(os.getcwd(), "sites.json")
        if not os.path.exists(sites_path):
            print("LOG: Error - sites.json not found.", flush=True)
            return

        with open(sites_path, "r", encoding="utf-8") as f:
            sites = json.load(f)

        active_sites = sites
        if self.target_sites != "All":
            target_list = [name.strip().lower() for name in self.target_sites.split(",")]
            active_sites = [
                site for site in sites
                if site.get("name", "").strip().lower() in target_list
            ]

        print(f"LOG: Date Range Filter: {self.start_date} -> {self.end_date}", flush=True)
        print(f"LOG: Targeting {len(active_sites)} sources.", flush=True)
        for site in active_sites:
            site_name = site.get("name", "Unknown Source")
            configured_url = site.get("url", "")
            if not configured_url:
                continue
            print(f"LOG: Checking feed for {site_name}...", flush=True)
            yield scrapy.Request(
                url=configured_url,
                callback=self.parse_source_response,
                errback=self.handle_source_error,
                meta=self.source_meta(site_name, configured_url),
                dont_filter=True,
            )

    @staticmethod
    def parse_filter_date(value):
        if not value or str(value).lower() == "null":
            return None
        try:
            return datetime.strptime(str(value), "%Y-%m-%d").date()
        except ValueError:
            return None

    @staticmethod
    def source_home(url):
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}/"

    def source_meta(self, site_name, configured_url):
        return {
            "site_name": site_name,
            "configured_url": configured_url,
            "source_home": self.source_home(configured_url),
        }

    def is_in_range(self, date_obj):
        if not date_obj:
            return True
        local_date = date_obj.date() if isinstance(date_obj, datetime) else date_obj
        if self.start_date and local_date < self.start_date:
            return False
        if self.end_date and local_date > self.end_date:
            return False
        return True

    def parse_source_response(self, response):
        if self.looks_like_feed(response):
            yield from self.parse_feed(response)
            return

        discovered_feed = self.discover_feed_url(response)
        if discovered_feed:
            print(f"LOG: Discovered RSS/Atom feed for {response.meta['site_name']}.", flush=True)
            yield scrapy.Request(
                discovered_feed,
                callback=self.parse_feed,
                errback=self.handle_feed_error,
                meta=response.meta,
                dont_filter=True,
            )
            return

        print(f"LOG: No RSS feed for {response.meta['site_name']}. Scanning article links.", flush=True)
        yield from self.parse_listing_page(response)

    def looks_like_feed(self, response):
        content_type = response.headers.get("Content-Type", b"").decode("utf-8").lower()
        if any(token in content_type for token in ("rss", "atom", "xml")):
            return True
        return bool(response.xpath(
            "//*[local-name()='rss' or local-name()='feed' or local-name()='item' or local-name()='entry']"
        ).get())

    def discover_feed_url(self, response):
        candidates = response.xpath(
            "//link[contains(translate(@type, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'rss') "
            "or contains(translate(@type, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'atom') "
            "or contains(translate(@type, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'xml')]/@href"
        ).getall()
        for candidate in candidates:
            absolute_url = response.urljoin(candidate)
            if absolute_url:
                return absolute_url
        return None

    def parse_feed(self, response):
        site_name = response.meta["site_name"]
        entries = response.xpath(
            "//*[local-name()='channel']/*[local-name()='item'] | "
            "/*[local-name()='feed']/*[local-name()='entry']"
        )
        if not entries:
            print(f"LOG: {site_name} feed is empty or invalid. Falling back to website scan.", flush=True)
            yield from self.request_website_fallback(response.meta)
            return

        queued = 0
        for entry in entries:
            if queued >= self.MAX_RSS_CANDIDATES:
                break
            title = self.clean_text(entry.xpath("string(./*[local-name()='title'][1])").get())
            link = (
                entry.xpath("./*[local-name()='link'][1]/@href").get()
                or entry.xpath("string(./*[local-name()='link'][1])").get()
                or entry.xpath("string(./*[local-name()='guid'][1])").get()
            )
            published = self.parse_published_date(
                entry.xpath("string(./*[local-name()='pubDate'][1])").get()
                or entry.xpath("string(./*[local-name()='published'][1])").get()
                or entry.xpath("string(./*[local-name()='updated'][1])").get()
            )
            if published and not self.is_in_range(published):
                continue
            request = self.article_request(
                urljoin(response.url, str(link or "").strip()),
                site_name,
                title=title,
                published=published,
                method="RSS",
            )
            if request:
                queued += 1
                yield request

        print(f"LOG: {site_name} feed supplied {queued} article candidates.", flush=True)

    def handle_source_error(self, failure):
        site_name = failure.request.meta["site_name"]
        print(f"LOG: Feed unavailable for {site_name}. Trying website discovery.", flush=True)
        yield from self.request_website_fallback(failure.request.meta)

    def handle_feed_error(self, failure):
        site_name = failure.request.meta["site_name"]
        print(f"LOG: Discovered feed failed for {site_name}. Trying website discovery.", flush=True)
        yield from self.request_website_fallback(failure.request.meta)

    def request_website_fallback(self, meta):
        site_name = meta["site_name"]
        if site_name in self.fallback_sources:
            return
        self.fallback_sources.add(site_name)
        yield scrapy.Request(
            meta["source_home"],
            callback=self.parse_listing_page,
            errback=self.handle_website_error,
            meta=meta,
            dont_filter=True,
        )

    def handle_website_error(self, failure):
        print(f"LOG: Website discovery failed for {failure.request.meta['site_name']}.", flush=True)

    def parse_listing_page(self, response):
        site_name = response.meta["site_name"]
        candidates = []
        candidate_urls = set()
        selector_groups = [
            (4, "//article//a[@href]"),
            (3, "//main//a[@href][not(ancestor::nav or ancestor::header or ancestor::footer or ancestor::aside)]"),
            (1, "//body//a[@href][not(ancestor::nav or ancestor::header or ancestor::footer or ancestor::aside or ancestor::form)]"),
        ]
        for context_score, selector in selector_groups:
            for anchor in response.xpath(selector):
                link = response.urljoin(anchor.xpath("@href").get() or "")
                title_hint = self.clean_text(" ".join(anchor.xpath(".//text()").getall()))
                normalized = self.normalize_article_url(link)
                if not normalized or normalized in candidate_urls:
                    continue
                score = self.story_link_score(normalized, title_hint, response.url, context_score)
                if score < 4:
                    continue
                candidate_urls.add(normalized)
                candidates.append((score, normalized, title_hint))

        candidates.sort(key=lambda candidate: candidate[0], reverse=True)
        queued = 0
        for _, link, title_hint in candidates[:self.MAX_HTML_CANDIDATES]:
            request = self.article_request(
                link, site_name, title=title_hint, published=None, method="Website Discovery"
            )
            if request:
                queued += 1
                yield request
        print(f"LOG: {site_name} website supplied {queued} likely article candidates.", flush=True)

    def story_link_score(self, link, title_hint, listing_url, context_score):
        parsed = urlparse(link)
        origin = urlparse(listing_url)
        if parsed.netloc.lower().removeprefix("www.") != origin.netloc.lower().removeprefix("www."):
            return -1
        path = parsed.path.lower()
        if path in ("", "/") or path.endswith(self.NON_ARTICLE_EXTENSIONS):
            return -1
        if any(blocked in path for blocked in self.BLOCKED_PATH_PARTS):
            return -1
        label = title_hint.strip().lower()
        if label in self.NON_STORY_LABELS:
            return -1
        score = context_score
        if re.search(r"/20\d{2}/\d{1,2}/|\b20\d{2}[-/]\d{2}", path):
            score += 3
        if any(marker in path for marker in ("/news/", "/article/", "/story/", "/tech/", "/business/")):
            score += 2
        if len([part for part in path.split("/") if part]) >= 2:
            score += 1
        if len(title_hint.split()) >= 4:
            score += 1
        return score

    def article_request(self, url, site_name, title, published, method):
        normalized = self.normalize_article_url(url)
        if not normalized or normalized in self.seen_article_urls:
            return None
        self.seen_article_urls.add(normalized)
        return scrapy.Request(
            normalized,
            callback=self.parse_article_page,
            errback=self.handle_article_error,
            meta={
                "site_name": site_name,
                "seed_title": title,
                "seed_date": published,
                "method": method,
            },
        )

    def normalize_article_url(self, url):
        try:
            parsed = urlsplit(str(url or "").strip())
            if parsed.scheme not in ("http", "https") or not parsed.netloc:
                return None
            path = parsed.path or "/"
            if path.lower().endswith(self.NON_ARTICLE_EXTENSIONS):
                return None
            query = urlencode([
                (key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True)
                if not key.lower().startswith("utm_") and key.lower() not in self.TRACKING_PARAMS
            ])
            return urlunsplit((parsed.scheme, parsed.netloc.lower(), path.rstrip("/") or "/", query, ""))
        except ValueError:
            return None

    def handle_article_error(self, failure):
        print(f"LOG: Article request failed: {failure.request.url[:80]}", flush=True)

    def parse_article_page(self, response):
        seed_title = response.meta.get("seed_title", "")
        site_name = response.meta["site_name"]
        article = None
        try:
            article = Article(response.url, config=self.news_config)
            article.download(input_html=response.text)
            article.parse()
        except Exception as error:
            print(f"LOG: Structured extraction failed for {response.url[:70]}: {error}", flush=True)

        title = self.clean_text(
            (article.title if article else "")
            or response.xpath("string(//meta[@property='og:title']/@content)").get()
            or response.xpath("string(//h1[1])").get()
            or seed_title
        )
        extracted_text = self.clean_text(article.text if article else "")
        fallback_text = self.extract_clean_body_text(response)
        full_text = extracted_text if len(extracted_text.split()) >= self.MIN_ARTICLE_WORDS else fallback_text

        if not title or len(full_text.split()) < self.MIN_ARTICLE_WORDS:
            print(f"LOG: Skipped non-article or thin page from {site_name}: {response.url[:65]}", flush=True)
            return

        publish_date = (
            self.normalize_datetime(article.publish_date if article else None)
            or response.meta.get("seed_date")
        )
        if publish_date and not self.is_in_range(publish_date):
            return

        found_keywords = self.find_keywords(f"{title} {full_text}")
        if not found_keywords:
            return

        quick_summary = self.make_summary(full_text)
        item = {
            "source": site_name,
            "title": title,
            "link": response.url,
            "date": str((publish_date or datetime.now()).date()),
            "snippet": quick_summary,
            "full_content": full_text,
            "top_image": (article.top_image if article else "") or self.extract_image(response),
            "authors": list(article.authors) if article and article.authors else [],
            "summary": quick_summary,
            "keywords_found": found_keywords,
            "word_count": len(full_text.split()),
            "method": response.meta.get("method", "Website Discovery"),
        }
        print(f"LOG: Collected clean article: {title[:55]}...", flush=True)
        yield item

    def extract_clean_body_text(self, response):
        excluded = (
            "not(ancestor::header or ancestor::nav or ancestor::footer or "
            "ancestor::aside or ancestor::form or ancestor::button or "
            "ancestor::script or ancestor::style or ancestor::*[@role='navigation'])"
        )
        paragraphs = response.xpath(f"//article//p[{excluded}]//text()").getall()
        if not paragraphs:
            paragraphs = response.xpath(f"//main//p[{excluded}]//text()").getall()
        return self.clean_text(" ".join(paragraphs))

    def extract_image(self, response):
        return (
            response.xpath("//meta[@property='og:image']/@content").get()
            or response.xpath("//meta[@name='twitter:image']/@content").get()
            or ""
        )

    def find_keywords(self, text):
        return [
            keyword for keyword, pattern in self.keyword_patterns
            if pattern.search(text or "")
        ]

    @staticmethod
    def normalize_datetime(value):
        if not value:
            return None
        if isinstance(value, datetime):
            return value.replace(tzinfo=None)
        try:
            return parser.parse(str(value)).replace(tzinfo=None)
        except (ValueError, TypeError, OverflowError):
            return None

    def parse_published_date(self, value):
        return self.normalize_datetime(value)

    @staticmethod
    def clean_text(value):
        return re.sub(r"\s+", " ", str(value or "")).strip()

    def make_summary(self, text):
        sentences = [
            sentence.strip()
            for sentence in re.split(r"(?<=[.!?])\s+", text)
            if sentence.strip()
        ]
        summary = " ".join(sentences[:4]) if sentences else text[:700]
        return summary[:1000].strip()
