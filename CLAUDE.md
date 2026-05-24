# SENSE — News Intelligence Platform
## Full Codebase Reference for Claude Code

This file is the complete context for the SENSE project.
Use this to understand the architecture before creating or modifying any file.

---

## Project Overview

SENSE is an internal news intelligence tool that:
- Crawls 50+ tech news RSS sources using Scrapy
- Filters articles using an ML bouncer (LogisticRegression)
- Clusters duplicate stories using semantic embeddings
- Summarizes using BART
- Presents results in a React dashboard
- Learns from thumbs up/down votes to improve filtering over time
- Tracks usage invisibly per device

---

## Directory Layout

```
C:\scrappy\                              ← BACKEND ROOT (Python)
├── main.py                              ← FastAPI server — ALL endpoints
├── semantic_clustering.py               ← AI clustering + summarization engine
├── train_bouncer.py                     ← Retrains the ML bouncer model
├── learner.py                           ← Logs search results to CSV
├── sites.json                           ← List of RSS news sources
├── trainingData.json                    ← Thumbs up/down vote history
├── bouncer_model.pkl                    ← Trained LogisticRegression model (binary)
├── not_interested_store.json            ← Rejected articles (22h expiry)
├── usage_tracker.json                   ← Per-device activity tracking
├── workflow_store.json                  ← Selected/approved articles
├── dropped_articles.json                ← Articles dropped by bouncer
├── seen_registry.json                   ← Previously seen article URLs
├── template.pptx                        ← PowerPoint export template
├── manual_search_logs.xlsx              ← Excel log of all searches
├── training_dataset.csv                 ← CSV log from learner.py
├── history_archive/                     ← JSON archives of briefings
│   ├── briefing_YYYY-MM-DD_HH-MM-SS.json
│   └── manual_{sessionId}_YYYY-MM-DD_HH-MM-SS.json
├── flan-t5-local/                       ← Flan-T5 model (opinion/insight)
├── local_bart_model/                    ← BART model (summarization)
├── local_miniLM_model/                  ← MiniLM model (bouncer embeddings)
├── semantic_model/                      ← MiniLM model (clustering embeddings)
└── news_aggregator/                     ← Scrapy project
    ├── scrapy.cfg
    └── news_aggregator/
        ├── settings.py
        ├── middlewares.py
        ├── pipelines.py
        ├── items.py
        └── spiders/
            └── universal_spider.py      ← NewsSpider class

E:\scrappy\news-ui\                      ← FRONTEND ROOT (React)
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── App.jsx                          ← Router — BrowserRouter with routes
    ├── main.jsx
    ├── App.css
    ├── index.css
    ├── pages/
    │   ├── Dashboard.jsx                ← Main dashboard (all views)
    │   └── ManageSources.jsx            ← RSS source management page
    ├── components/
    │   ├── ArticleCard.jsx              ← Individual news card
    │   ├── Badges.jsx                   ← RegionBadge, OriginBadge, ImportanceBadge
    │   ├── Cockpit.jsx                  ← Search controls (keywords, dates, sites)
    │   ├── ExitModal.jsx                ← Unsaved data warning modal
    │   ├── FilterBar.jsx                ← Source/date/region filter bar
    │   ├── Header.jsx                   ← Top nav with export dropdown
    │   ├── HistorySidebar.jsx           ← Archive file browser sidebar
    │   └── modals/
    │       └── ArticleModal.jsx         ← Article detail modal (minimal)
    └── utils/
        └── exportUtils.jsx              ← CSV, Word, PDF, PPT export functions
```

---

## Routes (App.jsx)

```
/           → redirects to /home
/home       → Dashboard (main view)
/selected   → Dashboard (selected items view)
/approved   → Dashboard (approved items view)
/history    → Dashboard (history archive view)
/manage-sources → ManageSources
```

---

## Backend: Key Files

### main.py
FastAPI server. All endpoints live here. Key facts:
- `API_BASE` is `http://127.0.0.1:8000`
- Bouncer threshold: **0.60** (not 0.80)
- `save_training_vote()` has built-in dedup — same summary+vote never saved twice
- Streaming crawl uses **direct import** of `MinimalSemanticEngine` (not subprocess)
- Scheduler uses **subprocess** with `--fast-mode` flag
- `Request` is imported from FastAPI for IP detection in `/track`
- `hashlib` is imported for device ID generation

Config constants:
```python
MORNING_KEYWORDS = "OpenAI , Robot , Samsung , LG , Sony , Nvidia , TCL , OLED , QNED , Artificial Intelligence, chatGPT , Anthropic , Claude , Gemini , LED , Robotics , Television , TV , display , Grok , GPU , Processor , Jio , TPU"
DIRECTOR_KEY = "1357"
NOT_INTERESTED_EXPIRY_HOURS = 22
```

Locks used:
- `scheduler_lock`, `file_lock`, `train_lock`, `not_interested_lock`, `tracker_lock`

### semantic_clustering.py
`MinimalSemanticEngine` class with these methods:
- `load_models()` — loads semantic_model, sentiment (DistilBERT), BART
- `clean_summary()` — fast 3-sentence cleaner, no ML
- `generate_ppt_summary()` — BART, strict, for exports
- `generate_dynamic_summary()` — BART, scales by article length
- `get_sentiment()` — positive/negative/neutral
- `extract_entities_simple()` — regex-based entity extraction
- `calculate_importance_score()` — based on source count, diversity, recency
- `semantic_cluster()` — AgglomerativeClustering, distance_threshold=0.6
- `_build_event()` — helper, builds a single card dict from one article
- `fuse_stream()` — **Phase 1**: generator, yields one card at a time (used by /crawl)
- `fuse_cluster()` — **Phase 2**: re-clusters after streaming, writes clustered JSON
- `fuse()` — original batch mode, used by scheduler subprocess

### train_bouncer.py
- `deduplicate_training_data()` — dedupes by summary[:150] before training
- `train_initial_model()` — LogisticRegression, C=1.0, solver='lbfgs', class_weight='balanced'
- Prints threshold analysis table after every retrain (0.50 to 0.70)
- Loads from `./local_miniLM_model`, saves to `bouncer_model.pkl`

### learner.py
- `log_search_data(user_query, results_data)` — appends to `training_dataset.csv`
- Saves one row per keyword_found per article
- Called after every crawl (manual and scheduler)

### universal_spider.py
- Spider name: `news_spider`
- Reads sources from `sites.json` (looks one level up `../sites.json` first)
- Parses RSS feeds via `parse_rss()`
- Falls back to `trigger_deep_extraction()` using `newspaper.build()`
- Full content via `parse_full_content()` using `newspaper.Article`
- **No BART/summarization** — just raw text collection, delegated to Fusion Engine
- Quick summary = first 4 sentences only
- Max 50 RSS matches per site, max 25 deep extraction articles per site

---

## All API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /crawl | SSE stream — manual search |
| GET | /latest-briefing | Latest scheduler briefing |
| GET | /briefing/meta | Poll for new briefings (lightweight) |
| POST | /briefing/remove | Remove article from briefing JSON on disk |
| POST | /briefing/restore | Add article back to briefing JSON on disk |
| GET | /status | Scheduler + job status |
| POST | /train | Save vote + trigger bouncer retrain |
| POST | /not-interested | Move article to rejected tab + save vote |
| GET | /not-interested | Get rejected articles (auto-expires 22h) |
| POST | /not-interested/restore | Restore article + save counter-vote |
| GET | /workflow | Get selected + approved items |
| POST | /workflow/select | Add to selection basket |
| POST | /workflow/approve | Director approval (needs key=1357) |
| POST | /workflow/remove | Remove from workflow |
| POST | /export-ppt | PowerPoint export (uses template.pptx) |
| POST | /export-excel | Excel export |
| POST | /export-word | Word document export |
| GET | /history/list | List archive files (session-aware) |
| GET | /history/range | Merge archives by date range |
| GET | /history/{filename} | Load specific archive file |
| GET | /sites | Get all news sources |
| POST | /sites | Add new news source |
| POST | /track | Log activity (invisible tracking) |
| GET | /analytics | Usage analytics (key=1357) |

API_ROUTES set (used by catch-all to prevent frontend routing conflicts):
```python
{"crawl", "train", "status", "briefing", "export-excel", "export-ppt",
 "export-word", "sites", "latest-briefing", "workflow", "history",
 "not-interested", "track", "analytics"}
```

---

## SSE Event Types (/crawl)

| type | Meaning |
|------|---------|
| job_started | Job ID assigned |
| status | Status message to show user |
| card | Single article card (streaming, real-time) |
| data | Final clustered results (reclustered: true) |
| error | Something went wrong |

---

## Frontend: Key Details

### API_BASE
```javascript
const API_BASE = 'http://127.0.0.1:8000';
```

### Dashboard.jsx — State
| State | Purpose |
|-------|---------|
| currentView | 'main' / 'selected' / 'approved' / 'history' |
| liveResults | Current feed results (scheduler or manual) |
| liveLabel | Label shown above feed |
| historyResults | Loaded archive results |
| selectedItems | Workflow basket |
| approvedItems | Director-approved items |
| votes | Map of title → vote status |
| feedMode | Not in current version — single data lane |
| sessionId | Not in current version |

### Dashboard.jsx — Key Functions
- `startSensing()` — fires SSE, handles card/data/status/error events
- `handleVote()` — POST /train
- `openRegionModal()` / `handleRegionSave()` — manual region override
- `handleWorkflowAction()` — add/remove/approve workflow items
- `loadHistoryItem()` — load archive from sidebar
- `renderGrid()` — renders ArticleCard grid (no date grouping)

### exportUtils.jsx — Functions
- `exportToCSV()` — client-side CSV generation
- `exportToWord()` — POST /export-word
- `exportToPDF()` — client-side jsPDF
- `exportToPPT()` — POST /export-ppt

Note: Header.jsx calls these as `onExportCSV` (not onExportExcel)

---

## Key Flows

### Scheduler (every 4 hours)
Spider subprocess → Bouncer filter (0.60) → `semantic_clustering.py --fast-mode` subprocess → Archive to `history_archive/briefing_*.json`

### Manual Search (streaming)
Spider subprocess → Bouncer filter → `engine.fuse_stream()` yields cards via SSE one by one → `engine.fuse_cluster()` merges duplicates → Final `type:'data'` event with `reclustered: True`

### Thumbs Down Flow
`POST /train` → save vote to trainingData.json (deduped) → trigger retrain → bouncer reloaded in memory

### Not Interested Flow
`POST /not-interested` → save to not_interested_store.json + save vote + trigger retrain
`POST /briefing/remove` → remove from briefing JSON on disk (prevents hard-refresh resurrection)

### Restore Flow
`POST /not-interested/restore` → remove from store + save "interested" counter-vote + trigger retrain
`POST /briefing/restore` → add back to briefing JSON on disk

### Usage Tracking (invisible)
`POST /track` with `{fingerprint, action, detail}` → log to usage_tracker.json per device per day
`GET /analytics?key=1357` → returns per-device engagement sorted lowest first

---

## Important Rules — Never Break These

1. Bouncer threshold is **0.60** — never change back to 0.80
2. `train_bouncer.py` always deduplicates before training
3. Manual crawl uses **direct import** of `MinimalSemanticEngine` — never subprocess
4. Scheduler uses **subprocess** with `--fast-mode`
5. `DIRECTOR_KEY` = `"1357"`
6. Always call `/briefing/remove` alongside `/not-interested` so hard refresh doesn't bring back rejected articles
7. Frontend must be rebuilt (`npm run build`) after any JSX/CSS changes
8. `not_interested_store.json` auto-expires entries older than 22 hours on every read
9. History files: `briefing_*` = shared/public, `manual_{sessionId}_*` = private per tab
10. Frontend is on `E:\` drive, backend is on `C:\` drive — different drives on same machine

---

## AI Models (Binary — must be copied, cannot be recreated from code)

| Folder | Size | Purpose |
|--------|------|---------|
| `local_miniLM_model/` | ~90MB | Bouncer embeddings (SentenceTransformer) |
| `semantic_model/` | ~90MB | Clustering embeddings (SentenceTransformer) |
| `local_bart_model/` | ~1.2GB | Summarization (AutoModelForSeq2SeqLM) |
| `flan-t5-local/` | ~300MB | Opinion/insight generation (AutoModelForSeq2SeqLM) |

These must be physically copied from the production machine. They cannot be pasted as code.
