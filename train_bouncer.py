import json
import numpy as np
import pickle
import os
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

print("Loading AI model from local folder './local_miniLM_model'...")
try:
    embedder = SentenceTransformer('./local_miniLM_model')
except Exception as e:
    print(f"ERROR: Could not load the model. {e}")
    print("Make sure you have a folder named 'local_miniLM_model' with the downloaded files inside it!")
    exit()


def deduplicate_training_data(data):
    """
    Remove duplicate entries based on summary content.
    Keeps the LATEST entry for each unique summary.
    """
    seen = {}
    for item in data:
        summary = item.get("summary", "").strip().lower()[:150]
        if not summary:
            continue
        seen[summary] = item
    deduped = list(seen.values())
    removed = len(data) - len(deduped)
    if removed > 0:
        print(f"   Removed {removed} duplicate entries. Training on {len(deduped)} unique articles.")
    return deduped


def train_initial_model():
    json_path = "trainingData.json"
    model_path = "bouncer_model.pkl"

    if not os.path.exists(json_path):
        print(f"ERROR: Cannot find {json_path}.")
        return

    print(f"Reading {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    data = deduplicate_training_data(data)

    texts = []
    labels = []

    for item in data:
        summary = item.get('summary', '')
        keywords = item.get('keyword', [])
        if isinstance(keywords, list):
            keyword_str = ", ".join(keywords)
        else:
            keyword_str = str(keywords)

        combined_text = f"Keywords: {keyword_str}. Summary: {summary}"
        raw_label = str(item.get('label', '')).strip().lower()

        if raw_label in ["not_interested", "not_intrested"]:
            target = 0
        else:
            target = 1

        if not summary.strip():
            continue

        texts.append(combined_text)
        labels.append(target)

    if not texts:
        print("ERROR: No valid data found.")
        return

    print(f"Converting {len(texts)} articles into vectors...")
    X = embedder.encode(texts)
    y = np.array(labels)

    interested_count = sum(1 for l in labels if l == 1)
    not_interested_count = sum(1 for l in labels if l == 0)
    print(f"   Interested: {interested_count}")
    print(f"   Not Interested: {not_interested_count}")

    if len(set(labels)) < 2:
        print("Not enough variety to train!")
        return

    print("Training Logistic Regression Bouncer...")
    clf = LogisticRegression(
        class_weight='balanced',
        max_iter=2000,
        C=1.0,
        solver='lbfgs',
    )
    clf.fit(X, y)

    predictions = clf.predict(X)
    accuracy = accuracy_score(y, predictions)

    print(f"\n✅ Training Complete!")
    print(f"🎯 Accuracy on {len(texts)} records: {accuracy * 100:.2f}%")
    print(f"   Interested kept: {sum(1 for p in predictions if p == 1)}")
    print(f"   Not interested dropped: {sum(1 for p in predictions if p == 0)}")

    print("\n📊 Detailed Report:")
    print(classification_report(y, predictions, target_names=["not_interested", "interested"]))

    if hasattr(clf, "predict_proba"):
        probas = clf.predict_proba(X)
        not_int_confs = probas[y == 0][:, 0]
        int_confs = probas[y == 1][:, 0]

        print("📈 Threshold Analysis (after retraining):")
        for t in [0.50, 0.55, 0.60, 0.65, 0.70]:
            blocked_junk = sum(1 for c in not_int_confs if c >= t)
            false_blocks = sum(1 for c in int_confs if c >= t)
            print(f"   Threshold {t:.2f}: blocks {blocked_junk}/{len(not_int_confs)} junk, "
                  f"false-blocks {false_blocks}/{len(int_confs)} good")

    with open(model_path, 'wb') as f:
        pickle.dump(clf, f)
    print(f"\n🧠 Brain saved to {model_path}.")


if __name__ == "__main__":
    train_initial_model()