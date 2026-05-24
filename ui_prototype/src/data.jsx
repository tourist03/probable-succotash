// ============================================================
// Mock data — represents what the real backend will eventually provide
// (briefing articles, sources, workflow, rejected, runs, archives)
// ============================================================

const ARTICLES = [
  { id:1, title:"Samsung unveils Gen-AI NPU roadmap targeting on-device TV inference by 2027",
    summary:"The chipmaker outlined a three-year plan to bring larger LLM-class models to Neo QLED and OLED sets, reducing cloud dependency for personalization and upscaling.",
    src:"reuters.com", sources:[{name:"reuters.com"},{name:"theverge.com"}], source_count:2,
    author:"Jiyoung Sohn", date:"2026-04-19", time:"09:14", ago:"2h", mins_read:2,
    keywords:["Gen-AI","NPU","TV","Samsung"], region:"Global", category:"Semiconductors",
    importance:0.92, conf:0.92, mark:"Featured", is_fresh:true, tone:"warm",
    origin:"briefing",
  },
  { id:2, title:"LG Display debuts RGB Tandem OLED panel — 40% brighter, 60% more efficient",
    summary:"A new stack structure may pressure Samsung Display's QD-OLED line for the premium TV segment through 2027.",
    src:"oled-info.com", sources:[{name:"oled-info.com"}], source_count:1,
    author:"Ron Mertens", date:"2026-04-19", time:"07:42", ago:"4h", mins_read:4,
    keywords:["OLED","display","panel","LG"], region:"Global", category:"Display Tech",
    importance:0.88, conf:0.88, tone:"cool", origin:"briefing",
  },
  { id:3, title:"MediaTek Pentonic 800 reference design adds ambient-aware HDR remapping",
    summary:"SoC partners announced three new TV platforms at a closed-door IFA preview; Samsung Tizen compatibility uncertain.",
    src:"anandtech.com", sources:[{name:"anandtech.com"},{name:"protocol.com"}], source_count:2,
    author:"Ryan Smith", date:"2026-04-19", time:"05:21", ago:"6h", mins_read:5,
    keywords:["chip","HDR","SoC","MediaTek"], region:"Global", category:"Semiconductors",
    importance:0.81, conf:0.81, mark:"New", is_fresh:true, tone:"forest", origin:"briefing",
  },
  { id:4, title:"Google pushes Gemini Nano into Google TV launchers — 3rd-party SDK in beta",
    summary:"Android TV OEMs will get access to a local voice-assistant model with 1.8B parameters, targeting 2026 holiday launches.",
    src:"9to5google.com", sources:[{name:"9to5google.com"}], source_count:1,
    author:"Ben Schoon", date:"2026-04-19", time:"02:11", ago:"9h", mins_read:3,
    keywords:["Gen-AI","TV","voice","Google"], region:"Global", category:"AI",
    importance:0.90, conf:0.90, tone:"plum", origin:"briefing",
  },
  { id:5, title:"Sony Bravia 9 teardown reveals redesigned mini-LED local-dimming controller",
    summary:"iFixit analysis shows a move away from Samsung-supplied backlight driver ICs toward in-house silicon.",
    src:"ifixit.com", sources:[{name:"ifixit.com"}], source_count:1,
    author:"Taylor Dixon", date:"2026-04-18", time:"23:47", ago:"11h", mins_read:4,
    keywords:["mini-LED","teardown","Sony"], region:"Global", category:"Display Tech",
    importance:0.76, conf:0.76, tone:"sand", origin:"briefing",
  },
  { id:6, title:"TCL announces 115-inch QD-Mini-LED at $20k — largest consumer TV in market",
    summary:"Samsung's 98-inch tier faces pricing pressure; panel sourced from CSOT rather than BOE.",
    src:"flatpanelshd.com", sources:[{name:"flatpanelshd.com"}], source_count:1,
    author:"Rasmus Larsen", date:"2026-04-18", time:"21:06", ago:"13h", mins_read:3,
    keywords:["QLED","TV","mini-LED","TCL"], region:"Global", category:"Consumer Electronics",
    importance:0.72, conf:0.72, tone:"warm", origin:"briefing",
  },
  { id:7, title:"Netflix pilots AV1 dynamic-range negotiation protocol with Samsung & LG",
    summary:"Trial on 2026 flagship sets reduces bandwidth by up to 18% at Dolby Vision parity.",
    src:"streamingmedia.com", sources:[{name:"streamingmedia.com"}], source_count:1,
    author:"Dan Rayburn", date:"2026-04-18", time:"19:18", ago:"15h", mins_read:6,
    keywords:["codec","streaming","Netflix"], region:"Global", category:"Streaming",
    importance:0.84, conf:0.84, tone:"cool", origin:"briefing",
  },
  { id:8, title:"Qualcomm Snapdragon Sound for TV — Wi-Fi 7 multi-speaker mesh spec ratified",
    summary:"Cross-OEM spec aims to replace proprietary Q-Symphony-style solutions.",
    src:"theverge.com", sources:[{name:"theverge.com"}], source_count:1,
    author:"Chris Welch", date:"2026-04-18", time:"16:05", ago:"18h", mins_read:4,
    keywords:["audio","Wi-Fi 7","Qualcomm"], region:"Global", category:"Audio",
    importance:0.80, conf:0.80, tone:"forest", origin:"briefing",
  },
  { id:9, title:"EU Energy Label tightens for >85-inch sets — December 2026 deadline",
    summary:"Class-G threshold raised; Samsung's 98\" Neo QLED models may require firmware power caps.",
    src:"ec.europa.eu", sources:[{name:"ec.europa.eu"}], source_count:1,
    author:"Official Journal", date:"2026-04-18", time:"10:32", ago:"1d", mins_read:5,
    keywords:["regulation","TV","EU"], region:"Global", category:"Regulation",
    importance:0.94, conf:0.94, tone:"sand", origin:"briefing",
  },
  { id:10, title:"Foxconn acquires minority stake in Indian FAB cluster — Sriperumbudur",
    summary:"Move extends Samsung's own Noida expansion plans; regional supply-chain implications across South Asia.",
    src:"economictimes.com", sources:[{name:"economictimes.com"},{name:"livemint.com"}], source_count:2,
    author:"Annapurna Roy", date:"2026-04-18", time:"08:40", ago:"1d", mins_read:4,
    keywords:["manufacturing","India","Foxconn"], region:"Local", category:"Supply Chain",
    importance:0.68, conf:0.68, tone:"plum", origin:"briefing",
  },
  { id:11, title:"Amazon Fire TV Soundscape — spatial audio framework with Gen-AI scene lift",
    summary:"API reference leaked on GitHub; compatible with HDMI-CEC 2.2 target devices.",
    src:"protocol.com", sources:[{name:"protocol.com"}], source_count:1,
    author:"Janko Roettgers", date:"2026-04-18", time:"04:11", ago:"1d", mins_read:5,
    keywords:["audio","Gen-AI","Amazon"], region:"Global", category:"Audio",
    importance:0.79, conf:0.79, tone:"warm", origin:"briefing",
  },
  { id:12, title:"Vizio + Walmart 'Inkwell' project leaks — in-TV retail recommender",
    summary:"Court filings describe an AI model cross-referencing viewing behavior with Walmart purchase graph.",
    src:"theinformation.com", sources:[{name:"theinformation.com"}], source_count:1,
    author:"Mark Di Stefano", date:"2026-04-17", time:"15:22", ago:"2d", mins_read:7,
    keywords:["Gen-AI","retail","Vizio"], region:"Global", category:"AI",
    importance:0.71, conf:0.71, tone:"cool", origin:"briefing",
  },
];

// Preview body content for the active article in Triage view
const PREVIEW_BODY = (
  <>
    <p>The chipmaker outlined a <span className="hl">three-year plan</span> to bring larger LLM-class models to Neo QLED and OLED sets, reducing cloud dependency for personalization and upscaling.</p>
    <p>Speaking at an investor briefing in Seoul, Samsung Semiconductor's EVP of Custom SoC said the company's next-generation NPU — codenamed <span className="hl">"Exynos Auto-V Lite"</span> — will target <span className="hl">18 TOPS</span> of sustained inference capacity with under 4W of envelope, enough to run quantized 3B-parameter assistants on-device.</p>
    <p>The move comes as Google pushes Gemini Nano into Android TV and as MediaTek's Pentonic line adds ambient-aware HDR remapping. Samsung has told partners it will publish an SDK preview in Q3, with first silicon sampling to premium-tier Tizen devices in the second half of 2026.</p>
  </>
);

const SIMILAR = [
  { t:"Google pushes Gemini Nano into Google TV launchers", src:"9to5google.com" },
  { t:"MediaTek Pentonic 800 adds ambient-aware HDR remapping", src:"anandtech.com" },
  { t:"Amazon Fire TV Soundscape — Gen-AI scene lift", src:"protocol.com" },
];

const HOT_KEYWORDS = [
  { k:"Gen-AI", n:14, up:true },
  { k:"OLED", n:9 },
  { k:"NPU", n:7, up:true },
  { k:"TV", n:17 },
  { k:"chip", n:6, up:true },
  { k:"regulation", n:3, up:false },
  { k:"mini-LED", n:5 },
  { k:"codec", n:4 },
  { k:"India", n:3, up:true },
];

const SOURCES = [
  { name:"reuters.com",         type:"RSS",  enabled:true,  health:"ok",   last:"2m ago",  count:312 },
  { name:"theverge.com",        type:"RSS",  enabled:true,  health:"ok",   last:"4m ago",  count:287 },
  { name:"oled-info.com",       type:"RSS",  enabled:true,  health:"ok",   last:"7m ago",  count:96  },
  { name:"anandtech.com",       type:"HTML", enabled:true,  health:"warn", last:"31m ago", count:142 },
  { name:"9to5google.com",      type:"RSS",  enabled:true,  health:"ok",   last:"3m ago",  count:201 },
  { name:"ifixit.com",          type:"HTML", enabled:false, health:"ok",   last:"2h ago",  count:54  },
  { name:"flatpanelshd.com",    type:"RSS",  enabled:true,  health:"ok",   last:"12m ago", count:178 },
  { name:"streamingmedia.com",  type:"RSS",  enabled:true,  health:"ok",   last:"22m ago", count:64  },
  { name:"economictimes.com",   type:"HTML", enabled:true,  health:"err",  last:"3h ago",  count:401 },
  { name:"protocol.com",        type:"RSS",  enabled:true,  health:"ok",   last:"6m ago",  count:87  },
  { name:"theinformation.com",  type:"HTML", enabled:true,  health:"warn", last:"1h ago",  count:38  },
  { name:"ec.europa.eu",        type:"RSS",  enabled:true,  health:"ok",   last:"45m ago", count:12  },
];

const REJECTED = [
  { id:101, title:"Apple iPhone 17 rumored to drop USB-C in favor of new MagSafe",
    summary:"Latest leak from supply chain sources is unsubstantiated and conflicts with EU regulation.",
    src:"macrumors.com", date:"2026-04-19", time:"08:14",
    rejected_by:"Vineet", rejected_at:"2026-04-19 11:20", hours_remaining:18.4,
    tone:"plum", keywords:["Apple","leak"],
  },
  { id:102, title:"Crypto exchange Bitstop adds 12 new altcoins for Indian customers",
    summary:"Off-topic for our coverage scope; finance/crypto desk handles this beat.",
    src:"coindesk.com", date:"2026-04-19", time:"06:30",
    rejected_by:"Pooja", rejected_at:"2026-04-19 09:45", hours_remaining:16.9,
    tone:"sand", keywords:["crypto","Bitstop"],
  },
  { id:103, title:"Tesla Cybertruck recall over windshield wiper assembly",
    summary:"Automotive — not in our briefing scope.",
    src:"electrek.co", date:"2026-04-18", time:"19:00",
    rejected_by:"Vineet", rejected_at:"2026-04-19 02:11", hours_remaining:9.3,
    tone:"cool", keywords:["Tesla","recall"],
  },
];

const WORKFLOW_SELECTED = [
  { ...ARTICLES[4], selected_by:"Vineet", selected_at:"2026-04-19 10:14" },
  { ...ARTICLES[7], selected_by:"Pooja", selected_at:"2026-04-19 10:42" },
  { ...ARTICLES[8], selected_by:"Vineet", selected_at:"2026-04-19 11:08" },
];

const WORKFLOW_APPROVED = [
  { ...ARTICLES[0], selected_by:"Vineet", approved_at:"2026-04-19 11:30", approved_by:"Director" },
  { ...ARTICLES[3], selected_by:"Pooja",  approved_at:"2026-04-19 11:35", approved_by:"Director" },
];

const RUNS = [
  { id:"r-2026-04-19-12", started:"2026-04-19 12:00", duration:"6m 12s", status:"ok",   articles:47, kept:21, rejected:26, mode:"scheduled" },
  { id:"r-2026-04-19-08", started:"2026-04-19 08:00", duration:"5m 51s", status:"ok",   articles:53, kept:24, rejected:29, mode:"scheduled" },
  { id:"r-2026-04-19-04", started:"2026-04-19 04:00", duration:"7m 02s", status:"warn", articles:38, kept:14, rejected:24, mode:"scheduled" },
  { id:"r-2026-04-19-00", started:"2026-04-19 00:00", duration:"5m 33s", status:"ok",   articles:41, kept:19, rejected:22, mode:"scheduled" },
  { id:"r-2026-04-18-20", started:"2026-04-18 20:00", duration:"4m 58s", status:"ok",   articles:36, kept:16, rejected:20, mode:"scheduled" },
  { id:"r-2026-04-18-16", started:"2026-04-18 16:00", duration:"6m 49s", status:"err",  articles:0,  kept:0,  rejected:0,  mode:"scheduled", note:"Spider crashed: timeout on economictimes.com" },
];

const ARCHIVES = [
  { filename:"briefing_2026-04-19_12-00.json", date:"2026-04-19", time:"12:00", articles:21 },
  { filename:"briefing_2026-04-19_08-00.json", date:"2026-04-19", time:"08:00", articles:24 },
  { filename:"briefing_2026-04-19_04-00.json", date:"2026-04-19", time:"04:00", articles:14 },
  { filename:"briefing_2026-04-19_00-00.json", date:"2026-04-19", time:"00:00", articles:19 },
  { filename:"briefing_2026-04-18_20-00.json", date:"2026-04-18", time:"20:00", articles:16 },
  { filename:"briefing_2026-04-18_16-00.json", date:"2026-04-18", time:"16:00", articles:23 },
  { filename:"briefing_2026-04-18_12-00.json", date:"2026-04-18", time:"12:00", articles:28 },
  { filename:"briefing_2026-04-18_08-00.json", date:"2026-04-18", time:"08:00", articles:31 },
];

// ============================================================
// HISTORY — articles bucketed by day, with seen-counts within day.
// Same story can repeat across days (no cross-day dedup) so you can
// see when something persisted in coverage.
// ============================================================
const HISTORY = [
  // ---- Today: Friday 2026-04-19 ----
  { ...ARTICLES[0], day:"2026-04-19", seen_today:3, first_today:"04:00", last_today:"12:00" },
  { ...ARTICLES[1], day:"2026-04-19", seen_today:2, first_today:"08:00", last_today:"12:00" },
  { ...ARTICLES[2], day:"2026-04-19", seen_today:2, first_today:"08:00", last_today:"12:00" },
  { ...ARTICLES[3], day:"2026-04-19", seen_today:1, first_today:"12:00", last_today:"12:00" },
  { ...ARTICLES[4], day:"2026-04-19", seen_today:1, first_today:"00:00", last_today:"00:00" },

  // ---- Thursday 2026-04-18 ----
  { ...ARTICLES[0], day:"2026-04-18", seen_today:2, first_today:"16:00", last_today:"20:00" },
  { ...ARTICLES[5], day:"2026-04-18", seen_today:3, first_today:"08:00", last_today:"20:00" },
  { ...ARTICLES[6], day:"2026-04-18", seen_today:2, first_today:"12:00", last_today:"16:00" },
  { ...ARTICLES[7], day:"2026-04-18", seen_today:1, first_today:"16:00", last_today:"16:00" },
  { ...ARTICLES[8], day:"2026-04-18", seen_today:4, first_today:"08:00", last_today:"20:00" },
  { ...ARTICLES[9], day:"2026-04-18", seen_today:1, first_today:"12:00", last_today:"12:00" },
  { id:201, title:"Apple Vision Pro 2 — internal cost target leaked at $1,800",
    summary:"Bloomberg reports Apple is targeting a sub-$2k pricepoint for the second-gen headset, with foldable optics from Largan.",
    src:"bloomberg.com", sources:[{name:"bloomberg.com"}], source_count:1, author:"Mark Gurman",
    date:"2026-04-18", time:"14:22", ago:"1d", mins_read:5,
    keywords:["Apple","VR","leak"], region:"Global", category:"Consumer Electronics",
    importance:0.74, conf:0.74, tone:"plum",
    day:"2026-04-18", seen_today:2, first_today:"16:00", last_today:"20:00" },

  // ---- Wednesday 2026-04-17 ----
  { ...ARTICLES[5], day:"2026-04-17", seen_today:2, first_today:"12:00", last_today:"20:00" },
  { ...ARTICLES[10], day:"2026-04-17", seen_today:1, first_today:"08:00", last_today:"08:00" },
  { ...ARTICLES[11], day:"2026-04-17", seen_today:3, first_today:"00:00", last_today:"16:00" },
  { id:202, title:"Roku open-sources its Streamfont rendering engine for set-top boxes",
    summary:"Released under Apache 2.0 to woo Tizen and webOS partners away from Samsung's Voyager.",
    src:"theverge.com", sources:[{name:"theverge.com"}], source_count:1, author:"Sean Hollister",
    date:"2026-04-17", time:"15:11", ago:"2d", mins_read:4,
    keywords:["Roku","open-source","streaming"], region:"Global", category:"Streaming",
    importance:0.66, conf:0.66, tone:"forest",
    day:"2026-04-17", seen_today:1, first_today:"16:00", last_today:"16:00" },
  { id:203, title:"Indian Govt notifies fresh BIS guidelines for >55-inch TV imports",
    summary:"Mandates safety + radio compliance lab certification within 90 days for all imported flatpanels.",
    src:"livemint.com", sources:[{name:"livemint.com"},{name:"economictimes.com"}], source_count:2, author:"Surabhi Agarwal",
    date:"2026-04-17", time:"09:48", ago:"2d", mins_read:3,
    keywords:["regulation","India","BIS","TV"], region:"Local", category:"Regulation",
    importance:0.81, conf:0.81, tone:"warm",
    day:"2026-04-17", seen_today:2, first_today:"12:00", last_today:"16:00" },

  // ---- Tuesday 2026-04-16 ----
  { ...ARTICLES[8], day:"2026-04-16", seen_today:2, first_today:"08:00", last_today:"16:00" },
  { ...ARTICLES[11], day:"2026-04-16", seen_today:1, first_today:"20:00", last_today:"20:00" },
  { id:204, title:"Samsung Display invests $1.6B in 8.6G OLED Gen-2 line in Asan",
    summary:"Targets MacBook and iPad lineups; production qualifies in late 2027 per company filings.",
    src:"oled-info.com", sources:[{name:"oled-info.com"},{name:"flatpanelshd.com"}], source_count:2, author:"Ron Mertens",
    date:"2026-04-16", time:"11:30", ago:"3d", mins_read:5,
    keywords:["OLED","Samsung","investment"], region:"Global", category:"Display Tech",
    importance:0.83, conf:0.83, tone:"cool",
    day:"2026-04-16", seen_today:3, first_today:"12:00", last_today:"20:00" },
  { id:205, title:"Apple TV+ to bundle with iCloud One for India launch in Q3",
    summary:"Repackaging signals push for India ARPU growth after slow rollout.",
    src:"reuters.com", sources:[{name:"reuters.com"}], source_count:1, author:"Aditya Kalra",
    date:"2026-04-16", time:"04:18", ago:"3d", mins_read:3,
    keywords:["Apple","India","streaming"], region:"Local", category:"Streaming",
    importance:0.69, conf:0.69, tone:"sand",
    day:"2026-04-16", seen_today:1, first_today:"08:00", last_today:"08:00" },

  // ---- Monday 2026-04-15 ----
  { id:206, title:"NVIDIA pushes Jetson Thor reference for next-gen smart-TV gaming sticks",
    summary:"Targeting cloud-bridge form factor with 1100 TOPS for AI upscaling at 8K60.",
    src:"anandtech.com", sources:[{name:"anandtech.com"}], source_count:1, author:"Ryan Smith",
    date:"2026-04-15", time:"09:05", ago:"4d", mins_read:6,
    keywords:["NVIDIA","Jetson","TV","gaming"], region:"Global", category:"Semiconductors",
    importance:0.78, conf:0.78, tone:"forest",
    day:"2026-04-15", seen_today:2, first_today:"12:00", last_today:"16:00" },
  { id:207, title:"YouTube TV bundles Premium tier with Apple Music for Premier subscribers",
    summary:"Cross-promo blurs streaming bundles in the US — Samsung+Spotify deal seen as response.",
    src:"protocol.com", sources:[{name:"protocol.com"}], source_count:1, author:"Janko Roettgers",
    date:"2026-04-15", time:"15:42", ago:"4d", mins_read:4,
    keywords:["YouTube","streaming","bundles"], region:"Global", category:"Streaming",
    importance:0.65, conf:0.65, tone:"plum",
    day:"2026-04-15", seen_today:1, first_today:"16:00", last_today:"16:00" },
  { ...ARTICLES[8], day:"2026-04-15", seen_today:1, first_today:"00:00", last_today:"00:00" },

  // ---- Sunday 2026-04-14 ----
  { id:208, title:"Hisense + Tata partnership rumored for Indian premium TV co-branding",
    summary:"Tata's Croma channel exclusivity in negotiation; ULED platforms first.",
    src:"economictimes.com", sources:[{name:"economictimes.com"}], source_count:1, author:"Annapurna Roy",
    date:"2026-04-14", time:"11:00", ago:"5d", mins_read:4,
    keywords:["Hisense","Tata","India","TV"], region:"Local", category:"Consumer Electronics",
    importance:0.77, conf:0.77, tone:"warm",
    day:"2026-04-14", seen_today:2, first_today:"12:00", last_today:"20:00" },
  { id:209, title:"FCC clarifies AI-watermarking obligations for set-top devices",
    summary:"Manufacturers must support C2PA tags by mid-2027.",
    src:"reuters.com", sources:[{name:"reuters.com"}], source_count:1, author:"David Shepardson",
    date:"2026-04-14", time:"04:00", ago:"5d", mins_read:5,
    keywords:["FCC","regulation","AI","watermark"], region:"Global", category:"Regulation",
    importance:0.82, conf:0.82, tone:"cool",
    day:"2026-04-14", seen_today:1, first_today:"08:00", last_today:"08:00" },

  // ---- Saturday 2026-04-13 ----
  { id:210, title:"Sony rumored to spin off mini-LED IP into a licensable IP block",
    summary:"Move would let Sony Pictures business compete with Samsung Display services.",
    src:"flatpanelshd.com", sources:[{name:"flatpanelshd.com"}], source_count:1, author:"Rasmus Larsen",
    date:"2026-04-13", time:"10:14", ago:"6d", mins_read:5,
    keywords:["Sony","mini-LED","IP","licensing"], region:"Global", category:"Display Tech",
    importance:0.71, conf:0.71, tone:"sand",
    day:"2026-04-13", seen_today:2, first_today:"12:00", last_today:"16:00" },
];

// Daily volume for the mini calendar (last 21 days)
const DAILY_VOLUME = [
  { date:"2026-03-30", count: 38 }, { date:"2026-03-31", count: 41 },
  { date:"2026-04-01", count: 29 }, { date:"2026-04-02", count: 47 }, { date:"2026-04-03", count: 52 },
  { date:"2026-04-04", count: 18 }, { date:"2026-04-05", count: 12 }, { date:"2026-04-06", count: 35 },
  { date:"2026-04-07", count: 49 }, { date:"2026-04-08", count: 51 }, { date:"2026-04-09", count: 43 },
  { date:"2026-04-10", count: 38 }, { date:"2026-04-11", count: 21 }, { date:"2026-04-12", count: 16 },
  { date:"2026-04-13", count: 27 }, { date:"2026-04-14", count: 33 }, { date:"2026-04-15", count: 44 },
  { date:"2026-04-16", count: 39 }, { date:"2026-04-17", count: 41 }, { date:"2026-04-18", count: 53 },
  { date:"2026-04-19", count: 47 },
];

// Mock streaming-scan log lines (used by Scan screen terminal)
const SCAN_LOG = [
  { t:"ok",   ln:"[12:14:02] ▸ scan started · job=manual_91a7" },
  { t:"dim",  ln:"[12:14:02] ▸ keywords: Samsung, OLED, NPU, Gemini" },
  { t:"dim",  ln:"[12:14:02] ▸ window: last 48h · 12 sources selected" },
  { t:"hi",   ln:"[12:14:03] ▸ spawning scrapy subprocess (pid 8841)" },
  { t:"ok",   ln:"[12:14:04] ✓ reuters.com — 12 candidates" },
  { t:"ok",   ln:"[12:14:05] ✓ theverge.com — 9 candidates" },
  { t:"ok",   ln:"[12:14:07] ✓ 9to5google.com — 6 candidates" },
  { t:"warn", ln:"[12:14:09] ! anandtech.com — slow response (3.8s)" },
  { t:"ok",   ln:"[12:14:11] ✓ anandtech.com — 4 candidates" },
  { t:"ok",   ln:"[12:14:12] ✓ oled-info.com — 7 candidates" },
  { t:"hi",   ln:"[12:14:13] ▸ bouncer filter (threshold=0.60) — 38 → 17 kept" },
  { t:"ok",   ln:"[12:14:14] ✓ semantic_clustering: fuse_stream open" },
  { t:"dim",  ln:"[12:14:15]   → card #1 emitted (Samsung NPU roadmap)" },
  { t:"dim",  ln:"[12:14:15]   → card #2 emitted (LG RGB Tandem OLED)" },
  { t:"dim",  ln:"[12:14:16]   → card #3 emitted (Pentonic 800)" },
  { t:"dim",  ln:"[12:14:16]   → card #4 emitted (Gemini Nano on Google TV)" },
];

window.ARTICLES = ARTICLES;
window.PREVIEW_BODY = PREVIEW_BODY;
window.SIMILAR = SIMILAR;
window.HOT_KEYWORDS = HOT_KEYWORDS;
window.SOURCES = SOURCES;
window.REJECTED = REJECTED;
window.WORKFLOW_SELECTED = WORKFLOW_SELECTED;
window.WORKFLOW_APPROVED = WORKFLOW_APPROVED;
window.RUNS = RUNS;
window.ARCHIVES = ARCHIVES;
window.SCAN_LOG = SCAN_LOG;
window.HISTORY = HISTORY;
window.DAILY_VOLUME = DAILY_VOLUME;
