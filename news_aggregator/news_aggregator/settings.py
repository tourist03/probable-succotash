BOT_NAME = "news_aggregator"
SPIDER_MODULES = ["news_aggregator.spiders"]
NEWSPIDER_MODULE = "news_aggregator.spiders"
ROBOTSTXT_OBEY = False
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
LOG_LEVEL = "WARNING"