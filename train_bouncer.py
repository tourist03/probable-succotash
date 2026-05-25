import argparse
import json
import pickle
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent

PROFILE_CONFIGS = {
    "default": {
        "training_file": BASE_DIR / "trainingData.json",
        "model_file": BASE_DIR / "bouncer_model.pkl",
    },
    "broadcast": {
        "training_file": BASE_DIR / "trainingData_broadcast.json",
        "model_file": BASE_DIR / "bouncer_model_broadcast.pkl",
    },
}

EMBEDDER_DIR = BASE_DIR / "local_miniLM_model"

INTERESTED_LABELS = {"interested", "like", "liked", "keep", "relevant", "up"}
NOT_INTERESTED_LABELS = {
    "not_interested",
    "not_intrested",
    "dislike",
    "irrelevant",
    "drop",
    "down",
}


def normalize_label(raw_label):
    """Convert a stored vote to 0=not_interested or 1=interested."""
    label = str(raw_label or "").strip().lower()
    if label in NOT_INTERESTED_LABELS:
        return 0
    if label in INTERESTED_LABELS:
        return 1
    return None


def normalize_keywords(keywords):
    if isinstance(keywords, list):
        return ", ".join(str(k).strip() for k in keywords if str(k).strip())
    if keywords is None:
        return ""
    return str(keywords).strip()


def build_training_text(title, keywords, summary):
    """Keep training text identical to the runtime bouncer text in main.py."""
    return (
        f"Title: {str(title or '').strip()}\n"
        f"Keywords: {normalize_keywords(keywords)}\n"
        f"Summary: {str(summary or '').strip()}"
    )


def deduplicate_training_data(data):
    """Keep the latest vote for each title and summary pair."""
    seen = {}
    for item in data:
        title = str(item.get("title", "") or "").strip().lower()
        summary = str(item.get("summary", "") or "").strip().lower()
        if not summary:
            continue
        seen[f"{title}::{summary[:200]}"] = item

    deduped = list(seen.values())
    removed = len(data) - len(deduped)
    if removed > 0:
        print(f"Removed {removed} duplicate rows. Training on {len(deduped)} unique rows.")
    return deduped


def load_training_data(training_file):
    if not training_file.exists():
        print(f"ERROR: Cannot find {training_file}")
        return []
    try:
        with open(training_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            print(f"ERROR: {training_file.name} should contain a list.")
            return []
        return data
    except json.JSONDecodeError as e:
        print(f"ERROR: {training_file.name} is invalid JSON: {e}")
        return []
    except Exception as e:
        print(f"ERROR: Could not read {training_file.name}: {e}")
        return []


def prepare_dataset(data):
    texts = []
    labels = []
    skipped_unknown_label = 0
    skipped_empty_summary = 0

    for item in data:
        title = item.get("title", "")
        summary = item.get("summary", "")
        keywords = item.get("keyword", item.get("keywords", []))
        target = normalize_label(item.get("label", ""))

        if not str(summary or "").strip():
            skipped_empty_summary += 1
            continue
        if target is None:
            skipped_unknown_label += 1
            continue

        texts.append(build_training_text(title, keywords, summary))
        labels.append(target)

    if skipped_empty_summary:
        print(f"Skipped {skipped_empty_summary} rows with empty summary.")
    if skipped_unknown_label:
        print(f"Skipped {skipped_unknown_label} rows with unknown labels.")
    return texts, labels


def print_threshold_analysis(clf, X, y):
    if not hasattr(clf, "predict_proba"):
        return

    probas = clf.predict_proba(X)
    class_list = list(clf.classes_)
    if 0 not in class_list:
        print("Cannot run threshold analysis: class 0 missing.")
        return

    not_interested_confidence = probas[:, class_list.index(0)]
    not_interested_rows = not_interested_confidence[y == 0]
    interested_rows = not_interested_confidence[y == 1]

    print("\nThreshold Analysis")
    for threshold in [0.50, 0.60, 0.70, 0.80, 0.90]:
        blocked_junk = int(np.sum(not_interested_rows >= threshold))
        false_blocked_good = int(np.sum(interested_rows >= threshold))
        print(
            f"Threshold {threshold:.2f}: blocks {blocked_junk}/{len(not_interested_rows)} "
            f"not_interested, false-blocks {false_blocked_good}/{len(interested_rows)} interested"
        )


def load_embedder():
    print(f"Loading AI embedding model from: {EMBEDDER_DIR}")
    try:
        embedder = SentenceTransformer(str(EMBEDDER_DIR))
        print("Embedding model loaded.")
        return embedder
    except Exception as e:
        print(f"ERROR: Could not load MiniLM model: {e}")
        raise SystemExit(1)


def create_classifier():
    return LogisticRegression(
        class_weight="balanced",
        max_iter=2000,
        C=1.0,
        solver="lbfgs",
        random_state=42,
    )


def train_model(profile="default", training_file=None, model_file=None):
    profile = str(profile or "default").strip().lower()
    if profile not in PROFILE_CONFIGS:
        print(f"ERROR: Unknown profile: {profile}")
        return False

    config = PROFILE_CONFIGS[profile]
    training_file = Path(training_file) if training_file else config["training_file"]
    model_file = Path(model_file) if model_file else config["model_file"]

    print(f"\nTraining Bouncer Profile: {profile}")
    print(f"Reading training data from: {training_file}")
    print(f"Will save model to:        {model_file}")

    data = deduplicate_training_data(load_training_data(training_file))
    if not data:
        print("ERROR: No training data found.")
        return False

    texts, labels = prepare_dataset(data)
    if not texts:
        print("ERROR: No valid training rows after cleaning.")
        return False
    if len(set(labels)) < 2:
        print("ERROR: At least one interested and one not_interested example is required.")
        return False

    print(f"Total usable rows: {len(texts)}")
    print(f"Interested: {sum(1 for label in labels if label == 1)}")
    print(f"Not Interested: {sum(1 for label in labels if label == 0)}")

    X = load_embedder().encode(texts, show_progress_bar=False)
    y = np.array(labels)
    interested_count = int(np.sum(y == 1))
    not_interested_count = int(np.sum(y == 0))

    if len(y) >= 10 and min(interested_count, not_interested_count) >= 3:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.25,
            stratify=y,
            random_state=42,
        )
        validation_clf = create_classifier()
        validation_clf.fit(X_train, y_train)
        validation_predictions = validation_clf.predict(X_test)
        print(
            f"Held-out accuracy on {len(y_test)} rows: "
            f"{accuracy_score(y_test, validation_predictions) * 100:.2f}%"
        )
        print(
            classification_report(
                y_test,
                validation_predictions,
                labels=[0, 1],
                target_names=["not_interested", "interested"],
                zero_division=0,
            )
        )
    else:
        print("Held-out validation skipped until each label has at least 3 samples and 10 rows exist.")

    clf = create_classifier()
    clf.fit(X, y)

    predictions = clf.predict(X)
    print(f"Final-fit accuracy on {len(texts)} rows: {accuracy_score(y, predictions) * 100:.2f}%")
    print(
        classification_report(
            y,
            predictions,
            labels=[0, 1],
            target_names=["not_interested", "interested"],
            zero_division=0,
        )
    )
    print_threshold_analysis(clf, X, y)

    with open(model_file, "wb") as f:
        pickle.dump(clf, f)
    print(f"Bouncer model saved to: {model_file}")
    return True


def parse_args():
    parser = argparse.ArgumentParser(description="Train profile-specific bouncer model.")
    parser.add_argument("--profile", default="default", choices=["default", "broadcast"])
    parser.add_argument("--training-file", default=None)
    parser.add_argument("--model-file", default=None)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train_model(profile=args.profile, training_file=args.training_file, model_file=args.model_file)
