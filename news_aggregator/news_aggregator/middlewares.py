from scrapy import signals

class NewsAggregatorSpiderMiddleware:
    @classmethod
    def from_crawler(cls, crawler):
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_spider_output(self, response, result, spider):
        for i in result:
            yield i

    def spider_opened(self, spider):
        spider.logger.debug("Spider opened: %s" % spider.name)

class NewsAggregatorDownloaderMiddleware:
    @classmethod
    def from_crawler(cls, crawler):
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def spider_opened(self, spider):
        spider.logger.debug("Spider opened: %s" % spider.name)