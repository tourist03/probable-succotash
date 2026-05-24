import os
import csv
import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINING_FILE = os.path.join(BASE_DIR, "training_dataset.csv")

def log_search_data(user_query, results_data):
    """
    Archives search results using the 'keywords_found' tag from the scraper.
    """
    try:
        file_exists = os.path.exists(TRAINING_FILE)

        with open(TRAINING_FILE, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)

            if not file_exists:
                writer.writerow(["Timestamp", "Specific_Keyword", "Headline", "Summary", "Link", "Source", "Original_Query"])

            now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            articles_to_save = []
            if isinstance(results_data, list) and len(results_data) > 0 and isinstance(results_data[0], dict) and "articles" in results_data[0]:
                for cluster in results_data:
                    articles_to_save.extend(cluster.get("articles", []))
            elif isinstance(results_data, list):
                articles_to_save = results_data

            count = 0
            for article in articles_to_save:
                headline = article.get('title', '').strip()
                summary = article.get('summary', '').strip()
                link = article.get('link', '')
                source = article.get('source', 'Unknown')
                found_keywords = article.get('keywords_found', [])

                if found_keywords and isinstance(found_keywords, list):
                    for k in found_keywords:
                        clean_k = k.strip().title()
                        writer.writerow([now, clean_k, headline, summary, link, source, user_query])
                        count += 1
                else:
                    writer.writerow([now, user_query, headline, summary, link, source, user_query])
                    count += 1

        print(f"📝 LEARNER: Archived {count} training rows (using detected keywords).")

    except Exception as e:
        print(f"❌ LEARNER ERROR: {e}")