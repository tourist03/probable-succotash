import sys
sys.stdout.reconfigure(encoding='utf-8')

import json
import os
import re
from datetime import datetime
from collections import Counter
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.cluster import AgglomerativeClustering
    CLUSTERING_AVAILABLE = True
except ImportError as e:
    print(f"FUSION ERROR: Missing AI libraries: {e}")
    print("Run: pip install sentence-transformers scikit-learn")
    CLUSTERING_AVAILABLE = False

try:
    from transformers import pipeline
    SENTIMENT_AVAILABLE = True
except ImportError:
    SENTIMENT_AVAILABLE = False

try:
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    BART_AVAILABLE = True
except ImportError:
    BART_AVAILABLE = False


class MinimalSemanticEngine:
    def __init__(self):
        self.semantic_model = None
        self.sentiment_analyzer = None
        self.bart_model = None
        self.bart_tokenizer = None
        self.load_models()

    def load_models(self):
        if CLUSTERING_AVAILABLE:
            try:
                print("FUSION ENGINE: Loading Semantic Model...", flush=True)
                model_path = os.path.join(os.getcwd(), "semantic_model")
                if os.path.exists(model_path):
                    self.semantic_model = SentenceTransformer(model_path)
                    print("FUSION ENGINE: Semantic Model Ready.", flush=True)
                else:
                    print("FUSION ENGINE: Semantic model folder not found at ./semantic_model", flush=True)
                    print("FUSION ENGINE: Attempting generic download...", flush=True)
                    self.semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception as e:
                print(f"FUSION ENGINE: Semantic load failed ({e})", flush=True)

        if SENTIMENT_AVAILABLE:
            try:
                print("FUSION ENGINE: Loading Sentiment Analyzer...", flush=True)
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                    device=-1,
                )
            except Exception as e:
                print(f"FUSION ENGINE: Sentiment load failed ({e})", flush=True)

        if BART_AVAILABLE:
            try:
                print("FUSION ENGINE: Loading Summarization...", flush=True)
                model_path = os.path.join(os.getcwd(), "local_bart_model")
                if not os.path.exists(model_path):
                    model_path = os.path.join(os.getcwd(), "..", "local_bart_model")
                if os.path.exists(model_path):
                    self.bart_tokenizer = AutoTokenizer.from_pretrained(
                        model_path, local_files_only=True
                    )
                    self.bart_model = AutoModelForSeq2SeqLM.from_pretrained(
                        model_path, local_files_only=True
                    )
                    print("FUSION ENGINE: Summarization Ready.", flush=True)
                else:
                    print("FUSION ENGINE: BART model not found.", flush=True)
            except Exception as e:
                print(f"FUSION ENGINE: BART load failed ({e})", flush=True)

    def clean_summary(self, text):
        if not text or len(text.strip()) < 20:
            return "No summary available."
        sentences = [
            s.strip()
            for s in re.split(r'(?<=[.!?])\s+', text)
            if s.strip()
        ]
        seen = set()
        unique = []
        for s in sentences:
            normalized = s.lower().strip()
            if normalized not in seen and len(s) > 25:
                seen.add(normalized)
                unique.append(s)
        result = ' '.join(unique[:3])
        if result and result[-1] not in '.!?':
            result += '.'
        if not result or len(result) < 20:
            return text[:300].strip() + '.'
        return result

    def generate_ppt_summary(self, text_list):
        combined_text = " ".join(text_list)
        if not self.bart_model or len(combined_text) < 200:
            return self.clean_summary(combined_text)
        try:
            inputs = self.bart_tokenizer(
                [combined_text], max_length=1024,
                return_tensors="pt", truncation=True
            )
            summary_ids = self.bart_model.generate(
                inputs["input_ids"],
                num_beams=2, min_length=60, max_length=200, early_stopping=True,
                length_penalty=2.0, no_repeat_ngram_size=3,
            )
            return self.bart_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        except:
            return self.clean_summary(combined_text)

    def generate_dynamic_summary(self, text_list):
        combined_text = " ".join(text_list)
        word_count = len(combined_text.split())
        if not self.bart_model or word_count < 40:
            return self.clean_summary(combined_text)
        if word_count < 150: min_len, max_len = 40, 100
        elif word_count < 500: min_len, max_len = 80, 250
        else: min_len, max_len = 150, 400
        try:
            inputs = self.bart_tokenizer(
                [combined_text], max_length=1024,
                return_tensors="pt", truncation=True
            )
            summary_ids = self.bart_model.generate(
                inputs["input_ids"],
                num_beams=4, min_length=min_len, max_length=max_len, early_stopping=True,
                length_penalty=2.0, no_repeat_ngram_size=3,
            )
            return self.bart_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        except Exception as e:
            print(f"FUSION ENGINE: Dynamic Summary Error ({e})", flush=True)
            return self.clean_summary(combined_text)

    def get_sentiment(self, text):
        if not self.sentiment_analyzer:
            return "neutral"
        try:
            result = self.sentiment_analyzer(text[:512])[0]
            label = result["label"].lower()
            score = result["score"]
            if label == "positive" and score > 0.6: return "positive"
            elif label == "negative" and score > 0.6: return "negative"
            else: return "neutral"
        except:
            return "neutral"

    def extract_entities_simple(self, text):
        words = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text)
        ignore = {"The", "A", "An", "But", "Or", "For", "In", "On", "At", "To", "From", "With", "By", "This", "That"}
        entities = [w for w in words if w not in ignore and len(w) > 2]
        top = [e for e, _ in Counter(entities).most_common(10)]
        return {"people": top[:5], "organizations": [], "locations": []}

    def calculate_importance_score(self, cluster, all_articles):
        source_count = len(cluster)
        total_articles = len(all_articles) if len(all_articles) > 0 else 1
        source_score = min(1.0, (source_count / total_articles) * 10)
        unique_sources = len(set(art.get("source", "Unknown") for art in cluster))
        diversity_score = min(1.0, unique_sources / 3)
        try:
            dates = []
            for art in cluster:
                d_str = art.get("date", "")
                if d_str:
                    try: dates.append(datetime.strptime(d_str, "%Y-%m-%d"))
                    except: pass
            if dates:
                days_old = (datetime.now() - max(dates)).days
                recency_score = max(0, 1.0 - (days_old * 0.1))
            else:
                recency_score = 0.5
        except:
            recency_score = 0.5
        final_score = (source_score * 50) + (diversity_score * 30) + (recency_score * 20)
        return round(final_score, 0)

    def semantic_cluster(self, articles):
        if not self.semantic_model or not CLUSTERING_AVAILABLE or len(articles) < 2:
            print(f"FUSION WARNING: Clustering skipped. Model loaded: {self.semantic_model is not None}", flush=True)
            return [[art] for art in articles]
        try:
            print(f"FUSION ENGINE: Computing embeddings for {len(articles)} articles...", flush=True)
            texts = [f"{art.get('title', '')} {art.get('snippet', '')}" for art in articles]

            if len(texts) > 50:
                batch_size = 32
                all_embeddings = []
                for i in range(0, len(texts), batch_size):
                    batch = texts[i:i + batch_size]
                    batch_emb = self.semantic_model.encode(batch, show_progress_bar=False)
                    all_embeddings.append(batch_emb)
                    done = min(i + batch_size, len(texts))
                    print(f"FUSION ENGINE: Embedding articles... {done}/{len(texts)}", flush=True)
                embeddings = np.vstack(all_embeddings)
            else:
                embeddings = self.semantic_model.encode(texts, show_progress_bar=False)

            embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
            clusterer = AgglomerativeClustering(
                n_clusters=None, metric="euclidean", linkage="average", distance_threshold=0.6,
            )
            labels = clusterer.fit_predict(embeddings)
            clusters = {}
            for idx, label in enumerate(labels):
                if label not in clusters: clusters[label] = []
                clusters[label].append(articles[idx])
            print(f"FUSION ENGINE: Condensed {len(articles)} articles into {len(clusters)} events.", flush=True)
            return list(clusters.values())
        except Exception as e:
            print(f"FUSION ENGINE: Clustering Error ({e})", flush=True)
            return [[art] for art in articles]

    def _build_event(self, article, all_articles, seen_registry, current_run_time, fast_mode, event_idx=None, total=None):
        prefix = ""
        if event_idx is not None and total is not None:
            prefix = f"[{event_idx}/{total}] "
        title_preview = article.get("title", "Untitled")[:60]
        content = (
            article.get("full_content", "")
            or article.get("full_contents", "")
            or article.get("summary", "")
            or article.get("snippet", "")
        )
        summaries = [content[:1500]]
        full_contents = (
            article.get("full_content", "")
            or article.get("summary", "")
            or article.get("snippet", "")
        )
        main_link = article.get("link", "#")
        is_fresh = True
        first_seen_label = current_run_time
        if main_link != "#" and main_link in seen_registry:
            is_fresh = False
            first_seen_label = seen_registry[main_link]
        elif main_link != "#":
            seen_registry[main_link] = current_run_time

        if fast_mode:
            combined = " ".join([s for s in summaries if s.strip()])
            dynamic_summary = self.clean_summary(combined)
            ppt_summary = dynamic_summary
            print(f"FUSION ENGINE: {prefix}[FAST] Cleaned: {title_preview}", flush=True)
        else:
            print(f"FUSION ENGINE: {prefix}BART summarizing: {title_preview}...", flush=True)
            ppt_summary = self.generate_ppt_summary(summaries)
            dynamic_summary = self.generate_dynamic_summary(summaries)

        if not dynamic_summary or len(dynamic_summary.strip()) < 10:
            dynamic_summary = article.get("snippet", "") or article.get("summary", "") or "No summary available."
        if not ppt_summary or len(ppt_summary.strip()) < 10:
            ppt_summary = dynamic_summary

        sentiment = self.get_sentiment(dynamic_summary)
        entities = self.extract_entities_simple(article.get("title", ""))
        importance = self.calculate_importance_score([article], all_articles)
        sources_list = [{
            "name": article.get("source", "Unknown"),
            "link": article.get("link", "#"),
            "date": article.get("date", ""),
        }]
        return {
            "title": article.get("title", "Untitled"),
            "master_summary": dynamic_summary,
            "ppt_summary": ppt_summary,
            "top_image": article.get("top_image", ""),
            "date": article.get("date", ""),
            "source_count": 1,
            "sources": sources_list,
            "link": main_link,
            "source": article.get("source", "Unknown"),
            "sentiment": sentiment,
            "importance_score": importance,
            "entities": entities,
            "keywords_found": article.get("keywords_found", []),
            "full_contents": full_contents,
            "is_fresh": is_fresh,
            "first_seen": first_seen_label,
        }

    def fuse_stream(self, job_id=None, fast_mode=False):
        if job_id:
            input_file = os.path.join(os.getcwd(), f"ui_results_{job_id}.json")
        else:
            input_file = os.path.join(os.getcwd(), "ui_results.json")
        registry_file = os.path.join(os.getcwd(), "seen_registry.json")
        mode_label = "FAST (no BART)" if fast_mode else "DEEP (BART enabled)"
        print(f"FUSION ENGINE: [STREAM] Mode -> {mode_label}", flush=True)

        if not os.path.exists(input_file):
            print(f"FUSION ENGINE: Input file not found: {input_file}", flush=True)
            return

        with open(input_file, "r", encoding="utf-8") as f:
            raw_articles = json.load(f)

        if not raw_articles:
            return

        seen_registry = {}
        if os.path.exists(registry_file):
            try:
                with open(registry_file, "r", encoding="utf-8") as f:
                    seen_registry = json.load(f)
            except:
                pass

        current_run_time = datetime.now().strftime("%Y-%m-%d %I:%M %p")
        total = len(raw_articles)
        print(f"FUSION ENGINE: [STREAM] Streaming {total} articles one by one...", flush=True)

        for idx, article in enumerate(raw_articles, 1):
            try:
                event = self._build_event(
                    article, raw_articles, seen_registry,
                    current_run_time, fast_mode,
                    event_idx=idx, total=total,
                )
                print(f"FUSION ENGINE: [{idx}/{total}] ✓ Streamed: {article.get('title', '')[:50]}", flush=True)
                yield event
            except Exception as e:
                print(f"FUSION ENGINE: [{idx}/{total}] ✗ Error: {e}", flush=True)
                continue

        with open(registry_file, "w", encoding="utf-8") as f:
            json.dump(seen_registry, f, indent=4)
        print(f"FUSION ENGINE: [STREAM] All {total} articles streamed.", flush=True)

    def fuse_cluster(self, job_id=None, fast_mode=False):
        if job_id:
            input_file = os.path.join(os.getcwd(), f"ui_results_{job_id}.json")
            output_file = os.path.join(os.getcwd(), f"clustered_results_{job_id}.json")
        else:
            input_file = os.path.join(os.getcwd(), "ui_results.json")
            output_file = os.path.join(os.getcwd(), "clustered_results.json")
        registry_file = os.path.join(os.getcwd(), "seen_registry.json")

        print(f"FUSION ENGINE: [CLUSTER] Starting re-cluster...", flush=True)

        if not os.path.exists(input_file):
            print(f"FUSION ENGINE: [CLUSTER] Input not found.", flush=True)
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump([], f)
            return

        with open(input_file, "r", encoding="utf-8") as f:
            raw_articles = json.load(f)

        if not raw_articles:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump([], f)
            return

        seen_registry = {}
        if os.path.exists(registry_file):
            try:
                with open(registry_file, "r", encoding="utf-8") as f:
                    seen_registry = json.load(f)
            except:
                pass

        current_run_time = datetime.now().strftime("%Y-%m-%d %I:%M %p")
        clusters = self.semantic_cluster(raw_articles)
        final_output = []
        total_events = len(clusters)

        for event_idx, cluster in enumerate(clusters, 1):
            title_preview = cluster[0].get("title", "Untitled")[:60]
            sources_in_cluster = len(cluster)
            print(
                f"FUSION ENGINE: [CLUSTER] [{event_idx}/{total_events}] "
                f"Merging: {title_preview}... ({sources_in_cluster} source{'s' if sources_in_cluster > 1 else ''})",
                flush=True,
            )

            main_art = cluster[0]
            for art in cluster:
                if art.get("top_image"):
                    main_art = art
                    break

            main_link = main_art.get("link", "#")
            is_fresh = True
            first_seen_label = current_run_time
            if main_link != "#" and main_link in seen_registry:
                is_fresh = False
                first_seen_label = seen_registry[main_link]
            elif main_link != "#":
                seen_registry[main_link] = current_run_time

            summaries = []
            for art in cluster:
                content = (
                    art.get("full_content", "")
                    or art.get("full_contents", "")
                    or art.get("summary", "")
                    or art.get("snippet", "")
                )
                summaries.append(content[:1500])

            full_contents = " ".join([
                art.get("full_content", "") or art.get("summary", "") or art.get("snippet", "")
                for art in cluster
            ])

            if fast_mode:
                combined = " ".join([s for s in summaries if s.strip()])
                dynamic_summary = self.clean_summary(combined)
                ppt_summary = dynamic_summary
            else:
                ppt_summary = self.generate_ppt_summary(summaries)
                dynamic_summary = self.generate_dynamic_summary(summaries)

            if not dynamic_summary or len(dynamic_summary.strip()) < 10:
                dynamic_summary = main_art.get("snippet", "") or main_art.get("summary", "") or "No summary available."
            if not ppt_summary or len(ppt_summary.strip()) < 10:
                ppt_summary = dynamic_summary

            sentiment = self.get_sentiment(dynamic_summary)
            all_text = " ".join([art.get("title", "") for art in cluster])
            entities = self.extract_entities_simple(all_text)
            importance = self.calculate_importance_score(cluster, raw_articles)

            sources_list = []
            for art in cluster:
                sources_list.append({
                    "name": art.get("source", "Unknown"),
                    "link": art.get("link", "#"),
                    "date": art.get("date", ""),
                })

            final_output.append({
                "title": main_art.get("title", "Untitled"),
                "master_summary": dynamic_summary,
                "ppt_summary": ppt_summary,
                "top_image": main_art.get("top_image", ""),
                "date": main_art.get("date", ""),
                "source_count": len(cluster),
                "sources": sources_list,
                "link": main_link,
                "source": main_art.get("source", "Unknown"),
                "sentiment": sentiment,
                "importance_score": importance,
                "entities": entities,
                "keywords_found": main_art.get("keywords_found", []),
                "full_contents": full_contents,
                "is_fresh": is_fresh,
                "first_seen": first_seen_label,
            })

            bar_len = 30
            filled = int(bar_len * event_idx / total_events)
            bar = "█" * filled + "░" * (bar_len - filled)
            pct = int(100 * event_idx / total_events)
            print(f"FUSION ENGINE: [{bar}] {pct}% — {event_idx}/{total_events} events fused", flush=True)

        final_output.sort(key=lambda x: x["importance_score"], reverse=True)

        print(f"FUSION ENGINE: [CLUSTER] Saving {len(final_output)} clustered events.", flush=True)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(final_output, f, indent=4, ensure_ascii=False)
        with open(registry_file, "w", encoding="utf-8") as f:
            json.dump(seen_registry, f, indent=4)

        print(
            f"FUSION ENGINE: [CLUSTER] Complete. "
            f"{len(raw_articles)} articles → {len(final_output)} events. "
            f"Output -> {os.path.basename(output_file)}",
            flush=True,
        )

    def fuse(self, job_id=None, fast_mode=False):
        if job_id:
            input_file = os.path.join(os.getcwd(), f"ui_results_{job_id}.json")
            output_file = os.path.join(os.getcwd(), f"clustered_results_{job_id}.json")
        else:
            input_file = os.path.join(os.getcwd(), "ui_results.json")
            output_file = os.path.join(os.getcwd(), "clustered_results.json")
        registry_file = os.path.join(os.getcwd(), "seen_registry.json")

        mode_label = "FAST (no BART)" if fast_mode else "DEEP (BART enabled)"
        print(f"FUSION ENGINE: Mode -> {mode_label}", flush=True)
        print(f"FUSION ENGINE: Input -> {os.path.basename(input_file)}", flush=True)
        print(f"FUSION ENGINE: Output -> {os.path.basename(output_file)}", flush=True)

        if not os.path.exists(input_file):
            print(f"FUSION ENGINE: Input file not found: {input_file}", flush=True)
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump([], f)
            return

        with open(input_file, "r", encoding="utf-8") as f:
            raw_articles = json.load(f)

        if not raw_articles:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump([], f)
            return

        seen_registry = {}
        if os.path.exists(registry_file):
            try:
                with open(registry_file, "r", encoding="utf-8") as f:
                    seen_registry = json.load(f)
            except:
                pass

        current_run_time = datetime.now().strftime("%Y-%m-%d %I:%M %p")
        print(f"FUSION ENGINE: Processing {len(raw_articles)} raw articles...", flush=True)

        clusters = self.semantic_cluster(raw_articles)
        final_output = []
        total_events = len(clusters)

        for event_idx, cluster in enumerate(clusters, 1):
            sources_in_cluster = len(cluster)
            title_preview = cluster[0].get("title", "Untitled")[:60]
            print(
                f"FUSION ENGINE: [{event_idx}/{total_events}] "
                f"Processing: {title_preview}... "
                f"({sources_in_cluster} source{'s' if sources_in_cluster > 1 else ''})",
                flush=True,
            )

            main_art = cluster[0]
            for art in cluster:
                if art.get("top_image"):
                    main_art = art
                    break

            main_link = main_art.get("link", "#")
            is_fresh = True
            first_seen_label = current_run_time
            if main_link != "#" and main_link in seen_registry:
                is_fresh = False
                first_seen_label = seen_registry[main_link]
            elif main_link != "#":
                seen_registry[main_link] = current_run_time

            summaries = []
            for art in cluster:
                content = (
                    art.get("full_content", "")
                    or art.get("full_contents", "")
                    or art.get("summary", "")
                    or art.get("snippet", "")
                )
                summaries.append(content[:1500])

            full_contents = " ".join([
                art.get("full_content", "") or art.get("summary", "") or art.get("snippet", "")
                for art in cluster
            ])

            if fast_mode:
                combined = " ".join([s for s in summaries if s.strip()])
                dynamic_summary = self.clean_summary(combined)
                ppt_summary = dynamic_summary
                print(f"FUSION ENGINE: [{event_idx}/{total_events}] [FAST] Cleaned: {main_art.get('title', '')[:50]}", flush=True)
            else:
                print(f"FUSION ENGINE: [{event_idx}/{total_events}] BART summarizing: {title_preview[:50]}...", flush=True)
                ppt_summary = self.generate_ppt_summary(summaries)
                dynamic_summary = self.generate_dynamic_summary(summaries)

            if not dynamic_summary or len(dynamic_summary.strip()) < 10:
                dynamic_summary = main_art.get("snippet", "") or main_art.get("summary", "") or "No summary available."
            if not ppt_summary or len(ppt_summary.strip()) < 10:
                ppt_summary = dynamic_summary

            sentiment = self.get_sentiment(dynamic_summary)
            all_text = " ".join([art.get("title", "") for art in cluster])
            entities = self.extract_entities_simple(all_text)
            importance = self.calculate_importance_score(cluster, raw_articles)

            sources_list = []
            for art in cluster:
                sources_list.append({
                    "name": art.get("source", "Unknown"),
                    "link": art.get("link", "#"),
                    "date": art.get("date", ""),
                })

            final_output.append({
                "title": main_art.get("title", "Untitled"),
                "master_summary": dynamic_summary,
                "ppt_summary": ppt_summary,
                "top_image": main_art.get("top_image", ""),
                "date": main_art.get("date", ""),
                "source_count": len(cluster),
                "sources": sources_list,
                "link": main_link,
                "source": main_art.get("source", "Unknown"),
                "sentiment": sentiment,
                "importance_score": importance,
                "entities": entities,
                "keywords_found": main_art.get("keywords_found", []),
                "full_contents": full_contents,
                "is_fresh": is_fresh,
                "first_seen": first_seen_label,
            })

            bar_len = 30
            filled = int(bar_len * event_idx / total_events)
            bar = "█" * filled + "░" * (bar_len - filled)
            pct = int(100 * event_idx / total_events)
            print(f"FUSION ENGINE: [{bar}] {pct}% — {event_idx}/{total_events} events fused", flush=True)

        final_output.sort(key=lambda x: x["importance_score"], reverse=True)
        print(f"FUSION ENGINE: Saving {len(final_output)} final events.", flush=True)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(final_output, f, indent=4, ensure_ascii=False)
        with open(registry_file, "w", encoding="utf-8") as f:
            json.dump(seen_registry, f, indent=4)

        print(f"FUSION ENGINE: Complete. Output -> {os.path.basename(output_file)}", flush=True)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--job-id", default=None)
    parser.add_argument("--fast-mode", action="store_true", default=False)
    parser.add_argument(
        "--mode",
        choices=["batch", "stream", "cluster"],
        default="batch",
    )
    args = parser.parse_args()
    engine = MinimalSemanticEngine()
    if args.mode == "stream":
        for event in engine.fuse_stream(job_id=args.job_id, fast_mode=args.fast_mode):
            print(json.dumps(event, ensure_ascii=False), flush=True)
    elif args.mode == "cluster":
        engine.fuse_cluster(job_id=args.job_id, fast_mode=args.fast_mode)
    else:
        engine.fuse(job_id=args.job_id, fast_mode=args.fast_mode)