import json
import os


class LiveStreamPipeline:
    def __init__(self):
        self.enabled = os.environ.get("SENSE_STREAM_ITEMS") == "1"

    def process_item(self, item, spider):
        if self.enabled:
            try:
                payload = json.dumps(dict(item), ensure_ascii=False, default=str)
                print(f"SENSE_STREAM_ITEM:{payload}", flush=True)
            except Exception as exc:
                spider.logger.warning("Live stream item emit failed: %s", exc)

        return item


class NewsAggregatorPipeline:
    def process_item(self, item, spider):
        return item
