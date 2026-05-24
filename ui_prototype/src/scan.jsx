// ============================================================
// Scan — Manual scan screen with chip-input query builder + terminal
// ============================================================

function ScanScreen({ onSelect, onOpen, votes, setVote }) {
  const [keywords, setKeywords] = React.useState(['Samsung','OLED','NPU','Gemini']);
  const [kwInput, setKwInput] = React.useState('');
  const [from, setFrom] = React.useState('2026-04-17');
  const [to, setTo]     = React.useState('2026-04-19');
  const [running, setRunning] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const [logIdx, setLogIdx] = React.useState(0);
  const [resultIdx, setResultIdx] = React.useState(0);

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTick((x) => x + 1), 1500);
    return () => clearInterval(t);
  }, [running]);

  // Animate log lines and streamed results when running
  React.useEffect(() => {
    if (!running) { setLogIdx(0); setResultIdx(0); return; }
    if (logIdx < SCAN_LOG.length) {
      const t = setTimeout(() => setLogIdx(logIdx + 1), 380);
      return () => clearTimeout(t);
    }
  }, [running, logIdx]);

  React.useEffect(() => {
    if (!running) return;
    if (resultIdx < 6) {
      const t = setTimeout(() => setResultIdx(resultIdx + 1), 900);
      return () => clearTimeout(t);
    }
  }, [running, resultIdx]);

  const addKw = () => {
    const v = kwInput.trim();
    if (v && !keywords.includes(v)) setKeywords([...keywords, v]);
    setKwInput('');
  };
  const removeKw = (k) => setKeywords(keywords.filter((x) => x !== k));

  const QUICK_RANGES = ['24h','48h','7d','30d','90d'];
  const SOURCES_ACTIVE = SOURCES.slice(0,5);

  const PageHead = () => (
    <div className="page-head">
      <div>
        <h1>Manual scan</h1>
        <div className="page-sub">Run an on-demand crawl. Results stream live as they come in.</div>
      </div>
      <div className="page-head-actions">
        {running && <span className="tag accent"><span className="dot"></span>job manual_91a7</span>}
      </div>
    </div>
  );

  if (!running) {
    return (
      <div className="content" style={{maxWidth: 1100}}>
        <PageHead />

        <div className="card" style={{padding:24}}>
          <div className="col gap-20">
            <div className="field">
              <div className="lbl">Keywords <span className="muted" style={{textTransform:'none', letterSpacing:0}}>· press Enter to add</span></div>
              <div className="chip-input">
                {keywords.map((k) => (
                  <span key={k} className="chip">{k} <span className="x" onClick={() => removeKw(k)}>×</span></span>
                ))}
                <input value={kwInput}
                       onChange={(e) => setKwInput(e.target.value)}
                       onKeyDown={(e) => { if (e.key === 'Enter') addKw(); }}
                       placeholder={keywords.length === 0 ? "Type a keyword and press Enter" : ""} />
              </div>
            </div>

            <div className="row gap-16" style={{alignItems:'flex-end'}}>
              <div className="field grow">
                <div className="lbl">From</div>
                <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="field grow">
                <div className="lbl">To</div>
                <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="row gap-8">
                {QUICK_RANGES.map((q) => (
                  <button key={q} className="btn sm">{q}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <div className="lbl">Sources <span className="muted" style={{textTransform:'none', letterSpacing:0}}>· {SOURCES.length} available</span></div>
              <div className="row gap-8 wrap">
                <button className="btn sm">All sources</button>
                <button className="btn sm">RSS only</button>
                <button className="btn sm">HTML only</button>
                <button className="btn sm ghost"><Icon name="filter" /> Pick sources</button>
              </div>
              <div className="row gap-8 wrap mt-8">
                {SOURCES_ACTIVE.map((s) => (
                  <span key={s.name} className="chip">{s.name}</span>
                ))}
                <span className="muted small">+ {SOURCES.length - SOURCES_ACTIVE.length} more</span>
              </div>
            </div>

            <hr className="hr" />

            <div className="row between">
              <div className="muted small mono">
                Estimate: ~{keywords.length * 8} candidates · ~5m runtime
              </div>
              <button className="btn primary lg" onClick={() => setRunning(true)}>
                <Icon name="play" /> Execute scan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Running state
  const visibleResults = ARTICLES.slice(0, resultIdx);
  const progressPct = Math.min(100, Math.round((logIdx / SCAN_LOG.length) * 100));

  return (
    <div className="content">
      <PageHead />
      <div style={{display:'grid', gridTemplateColumns:'minmax(360px,1fr) minmax(0,1.4fr)', gap:20, alignItems:'start'}}>
        {/* Left: terminal + progress */}
        <div className="col gap-16">
          <div className="terminal">
            <div className="bar">
              <div className="dots">
                <div className="dot r"></div><div className="dot y"></div><div className="dot g"></div>
              </div>
              <div className="t">crawler — manual_91a7</div>
              <div className="right">
                <span>{Math.floor(tick * 1.5)}s elapsed</span>
                <button className="btn sm err" onClick={() => setRunning(false)}><Icon name="stop" /> Stop</button>
              </div>
            </div>
            <div className="body">
              {SCAN_LOG.slice(0, logIdx).map((l, i) => (
                <div key={i} className={"ln " + l.t}>{l.ln}</div>
              ))}
              {logIdx >= SCAN_LOG.length && <div className="ln dim">[12:14:17] ▸ awaiting more results<span className="cursor"></span></div>}
              {logIdx < SCAN_LOG.length && <span className="cursor"></span>}
            </div>
          </div>

          <div className="card" style={{padding:16}}>
            <div className="row between mb-8">
              <div className="mono small muted">Progress</div>
              <div className="mono small tnum">{progressPct}%</div>
            </div>
            <div className="progress"><div className="fill" style={{width: progressPct + '%'}}></div></div>
            <div className="col gap-8 mt-12">
              {SOURCES.slice(0,8).map((s, i) => {
                const status = i < Math.floor(logIdx * 0.6) ? 'done' : i === Math.floor(logIdx * 0.6) ? 'active' : 'queue';
                return (
                  <div key={s.name} className={"sc-tile " + status}>
                    <span className="d"></span>
                    <span className="n">{s.name}</span>
                    <span className="v">{status === 'done' ? Math.floor(Math.random()*10+2) + ' kept' : status === 'active' ? 'running…' : 'queued'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: streamed results */}
        <div className="col gap-12">
          <div className="row between">
            <div className="serif" style={{fontSize:18, fontWeight:500}}>Streaming results</div>
            <div className="mono small muted">{visibleResults.length} cards · live</div>
          </div>
          <div className="card-grid">
            {visibleResults.map((a) => (
              <ArticleCard key={a.id}
                           item={a}
                           vote={votes[a.id]}
                           onVote={setVote}
                           onSelect={onSelect}
                           onOpen={onOpen} />
            ))}
            {visibleResults.length === 0 && (
              <div className="empty-state" style={{gridColumn:'1/-1'}}>
                <h3>Waiting on first card…</h3>
                <div>Bouncer is filtering candidates. Cards appear here as soon as they pass.</div>
              </div>
            )}
            {resultIdx > 0 && resultIdx < 6 && (
              <div className="card" style={{minHeight:240, display:'flex', alignItems:'center', justifyContent:'center', borderStyle:'dashed', color:'var(--ink-3)', fontSize:13}}>
                <div className="col center">
                  <Icon name="sparkle" size={18} />
                  <div className="mt-8">Waiting on next card…</div>
                </div>
              </div>
            )}
          </div>

          {logIdx >= SCAN_LOG.length && (
            <div className="row gap-8">
              <button className="btn" onClick={() => { setRunning(false); }}><Icon name="check" /> Mark scan complete</button>
              <button className="btn ghost" onClick={() => { setLogIdx(0); setResultIdx(0); setTick(0); }}>
                <Icon name="refresh" /> Re-run
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.ScanScreen = ScanScreen;
