// ============================================================
// Lists — Not Interested, Sources, Scheduler, History, Trends
// ============================================================

// ---------------- Not Interested (22h trash bin) ----------------
function RejectedScreen({ items, onRestore, onOpen }) {
  const Countdown = ({ h }) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    const tone = h < 4 ? 'err' : h < 12 ? 'warn' : 'ok';
    return <span className={"tag " + tone}><Icon name="clock" size={11} /> {hh}h {mm}m left</span>;
  };

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Not interested</h1>
          <div className="page-sub">22-hour trash bin · {items.length} articles · auto-cleared after expiry. Restoring also re-trains the bouncer.</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing rejected today</h3>
          <div>Articles you thumbs-down will land here for 22 hours in case you change your mind.</div>
        </div>
      ) : (
        <div className="card-grid">
          {items.map((a) => (
            <div key={a.id} className="card" style={{opacity: 0.92}}>
              <div className="hero">
                <div className={"ph-img " + (a.tone || '')} style={{filter:'grayscale(0.4)'}}></div>
                <div className="mark">Rejected by {a.rejected_by}</div>
              </div>
              <div className="body">
                <div className="meta">
                  <span className="src">{a.src}</span>
                  <span className="sep">·</span>
                  <span>{a.rejected_at}</span>
                </div>
                <div className="title" onClick={() => onOpen(a)}>{a.title}</div>
                <div className="summary">{a.summary}</div>
                <div className="kws mt-12">
                  <Countdown h={a.hours_remaining} />
                  {a.keywords.slice(0,2).map((k,i) => <span key={i} className="kw-tag">{k}</span>)}
                </div>
              </div>
              <div className="actions">
                <button className="btn ok sm" onClick={() => onRestore(a)}>
                  <Icon name="rotate" /> Restore
                </button>
                <button className="btn sm ghost"><Icon name="external" /> Open</button>
                <span className="muted small mono" style={{marginLeft:'auto'}}>permanently in {Math.floor(a.hours_remaining)}h</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Sources ----------------
function SourcesScreen() {
  const [filter, setFilter] = React.useState('all');
  const filtered = SOURCES.filter((s) =>
    filter === 'all' ? true :
    filter === 'rss' ? s.type === 'RSS' :
    filter === 'html' ? s.type === 'HTML' :
    filter === 'issues' ? s.health !== 'ok' :
    filter === 'disabled' ? !s.enabled : true
  );

  const HealthPill = ({ h }) => {
    const map = { ok: ['ok','Healthy'], warn: ['warn','Slow'], err: ['err','Failing'] };
    const [cls, lbl] = map[h];
    return <span className={"tag " + cls}><span className="dot"></span>{lbl}</span>;
  };

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Sources</h1>
          <div className="page-sub">{SOURCES.length} sources configured · {SOURCES.filter((s) => s.enabled).length} active · {SOURCES.filter((s) => s.health !== 'ok').length} need attention.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn"><Icon name="upload" /> Import OPML</button>
          <button className="btn primary"><Icon name="plus" /> Add source</button>
        </div>
      </div>

      <div className="row gap-8 mb-16">
        {[
          ['all','All'],['rss','RSS'],['html','HTML'],['issues','Needs attention'],['disabled','Disabled'],
        ].map(([k, lbl]) => (
          <button key={k}
                  className={"btn sm" + (filter === k ? " primary" : " ghost")}
                  onClick={() => setFilter(k)}>{lbl}</button>
        ))}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th style={{width:32}}></th>
            <th>Source</th>
            <th>Type</th>
            <th>Health</th>
            <th>Last seen</th>
            <th className="text-center">Articles (30d)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.name}>
              <td><input type="checkbox" defaultChecked={s.enabled} /></td>
              <td>
                <div className="row gap-8">
                  <Icon name={s.type === 'RSS' ? 'rss' : 'globe'} size={14} />
                  <span style={{fontWeight:500}}>{s.name}</span>
                </div>
              </td>
              <td><span className="tag">{s.type}</span></td>
              <td><HealthPill h={s.health} /></td>
              <td className="mono muted">{s.last}</td>
              <td className="text-center mono">{s.count}</td>
              <td>
                <div className="row gap-4" style={{justifyContent:'flex-end'}}>
                  <button className="btn ghost icon sm"><Icon name="settings" /></button>
                  <button className="btn ghost icon sm"><Icon name="trash" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Scheduler runs ----------------
function SchedulerScreen() {
  const StatusPill = ({ s }) => {
    const map = { ok: ['ok','Success'], warn: ['warn','Partial'], err: ['err','Failed'] };
    const [cls, lbl] = map[s];
    return <span className={"tag " + cls}><span className="dot"></span>{lbl}</span>;
  };

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Scheduler</h1>
          <div className="page-sub">Autonomous engine runs every 4 hours. Next run: 16:00 IST · in 3h 47m.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn"><Icon name="pause" /> Pause schedule</button>
          <button className="btn primary"><Icon name="play" /> Run now</button>
        </div>
      </div>

      <div className="ribbon">
        <div className="cell"><div className="label">Runs today</div><div className="big tnum">5</div><div className="sub">4 ok · 1 partial</div></div>
        <div className="cell"><div className="label">Articles processed</div><div className="big tnum">215</div><div className="sub">94 kept · 121 dropped</div></div>
        <div className="cell"><div className="label">Avg duration</div><div className="big tnum">5m 51s</div><div className="sub">trend stable</div></div>
        <div className="cell"><div className="label">Bouncer threshold</div><div className="big tnum">0.60</div><div className="sub">retrained 3× today</div></div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Run</th>
            <th>Started</th>
            <th>Duration</th>
            <th>Status</th>
            <th className="text-center">Articles</th>
            <th className="text-center">Kept</th>
            <th className="text-center">Dropped</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {RUNS.map((r) => (
            <tr key={r.id}>
              <td className="mono small">{r.id}</td>
              <td className="mono">{r.started}</td>
              <td className="mono">{r.duration}</td>
              <td><StatusPill s={r.status} /></td>
              <td className="text-center mono">{r.articles}</td>
              <td className="text-center mono" style={{color:'var(--ok)'}}>{r.kept}</td>
              <td className="text-center mono" style={{color:'var(--ink-3)'}}>{r.rejected}</td>
              <td className="muted small">{r.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- History ----------------
// Two views inside one screen:
//   - Timeline:  default = today; user can aggregate any range. Cards
//                grouped under day headers. Within a day, dedupe (one
//                card per story, with "seen 3× · 04:00 → 12:00" hint).
//                Across days, NO dedup — same story can appear under
//                multiple day headers if it persisted in coverage.
//   - Snapshots: per-briefing-run table (the old archive list view).

const TODAY_STR = "2026-04-19";

function dateAddDays(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(TODAY_STR + 'T00:00:00');
  const diff = Math.round((today - d) / 86400000);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const long = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  let prefix = '';
  if (diff === 0) prefix = 'Today · ';
  else if (diff === 1) prefix = 'Yesterday · ';
  return `${prefix}${weekday} ${long}`;
}

function MiniCalendar({ from, to, onPick }) {
  const max = Math.max(...DAILY_VOLUME.map((d) => d.count));
  const inRange = (d) => d >= from && d <= to;
  return (
    <div className="mini-cal">
      <div className="mini-cal-grid">
        {DAILY_VOLUME.map((d) => {
          const dayNum = parseInt(d.date.slice(8, 10), 10);
          const heightPct = Math.round((d.count / max) * 100);
          const active = inRange(d.date);
          return (
            <div key={d.date}
                 className={"mini-cal-cell" + (active ? " active" : "") + (d.date === TODAY_STR ? " today" : "")}
                 onClick={() => onPick(d.date, d.date)}
                 title={`${d.date} · ${d.count} articles`}>
              <div className="bar" style={{height: heightPct + '%'}}></div>
              <div className="dnum tnum">{dayNum}</div>
            </div>
          );
        })}
      </div>
      <div className="mini-cal-legend muted small">
        <span>Last 21 days · click a day to focus · drag-select coming soon</span>
      </div>
    </div>
  );
}

function HistoryRow({ item, onOpen }) {
  return (
    <div className="hist-row" onClick={() => onOpen(item)}>
      <div className="thumb"><div className={"ph-img " + (item.tone || '')}></div></div>
      <div className="body">
        <div className="meta">
          <span className="src">{item.src}</span>
          <span className="sep">·</span>
          <span>{item.time}</span>
          {item.source_count > 1 && (
            <><span className="sep">·</span><span><Icon name="layers" size={11} /> {item.source_count} sources</span></>
          )}
          {item.seen_today > 1 && (
            <><span className="sep">·</span>
              <span className="seen">seen {item.seen_today}× · {item.first_today} → {item.last_today}</span>
            </>
          )}
          {item.region === 'Local' && <span className="tag accent" style={{height:18, fontSize:10}}>Local</span>}
        </div>
        <div className="ttl">{item.title}</div>
        <div className="summary">{item.summary}</div>
        <div className="kws">
          {item.keywords.slice(0, 4).map((k, i) => <span key={i} className="kw-tag">{k}</span>)}
          <span className="conf mono small muted" style={{marginLeft:'auto'}}>conf {item.conf.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function HistoryScreen({ onOpen }) {
  const [view, setView]   = React.useState('timeline');     // timeline | snapshots
  const [from, setFrom]   = React.useState(TODAY_STR);
  const [to, setTo]       = React.useState(TODAY_STR);
  const [preset, setPreset] = React.useState('today');
  const [filterSrc, setFilterSrc] = React.useState('all');
  const [filterKw,  setFilterKw]  = React.useState('');

  const applyPreset = (id) => {
    setPreset(id);
    if (id === 'today')     { setFrom(TODAY_STR); setTo(TODAY_STR); }
    else if (id === 'yest') { const y = dateAddDays(TODAY_STR, -1); setFrom(y); setTo(y); }
    else if (id === '7d')   { setFrom(dateAddDays(TODAY_STR, -6)); setTo(TODAY_STR); }
    else if (id === '30d')  { setFrom(dateAddDays(TODAY_STR, -29)); setTo(TODAY_STR); }
    // 'custom' leaves dates alone
  };

  // Filter HISTORY by date range + source + keyword
  const filtered = HISTORY.filter((h) => {
    if (h.day < from || h.day > to) return false;
    if (filterSrc !== 'all' && h.src !== filterSrc) return false;
    if (filterKw && !(h.title + ' ' + h.summary + ' ' + h.keywords.join(' '))
                      .toLowerCase().includes(filterKw.toLowerCase())) return false;
    return true;
  });

  // Group by day, sort days desc
  const byDay = {};
  filtered.forEach((h) => { (byDay[h.day] = byDay[h.day] || []).push(h); });
  const days = Object.keys(byDay).sort().reverse();

  // Unique sources across HISTORY for the filter dropdown
  const uniqueSources = Array.from(new Set(HISTORY.map((h) => h.src))).sort();

  const totalInRange = filtered.length;
  const daySpan = days.length;

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>History</h1>
          <div className="page-sub">
            Browse archived briefings. Same story can appear under multiple day headers if coverage persisted.
          </div>
        </div>
        <div className="page-head-actions">
          <div className="screens">
            <div className={"s" + (view === 'timeline' ? " active" : "")} onClick={() => setView('timeline')}>Timeline</div>
            <div className={"s" + (view === 'snapshots' ? " active" : "")} onClick={() => setView('snapshots')}>Snapshots</div>
          </div>
          <button className="btn"><Icon name="download" /> Export</button>
        </div>
      </div>

      {view === 'timeline' && (
        <div className="hist-layout">
          {/* ---------- LEFT RAIL ---------- */}
          <aside className="hist-rail">
            <div className="field mb-12">
              <div className="lbl">Range</div>
              <div className="row gap-4 wrap">
                {[['today','Today'],['yest','Yesterday'],['7d','7 days'],['30d','30 days'],['custom','Custom']].map(([id, lbl]) => (
                  <button key={id}
                          className={"btn sm" + (preset === id ? " primary" : " ghost")}
                          onClick={() => applyPreset(id)}>{lbl}</button>
                ))}
              </div>
            </div>
            <div className="row gap-8 mb-16" style={{alignItems:'flex-end'}}>
              <div className="field grow"><div className="lbl">From</div>
                <input className="input" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset('custom'); }} />
              </div>
              <div className="field grow"><div className="lbl">To</div>
                <input className="input" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset('custom'); }} />
              </div>
            </div>

            <div className="field mb-16">
              <div className="lbl">Daily volume</div>
              <MiniCalendar from={from} to={to} onPick={(f, t) => { setFrom(f); setTo(t); setPreset('custom'); }} />
            </div>

            <div className="field mb-12">
              <div className="lbl">Source</div>
              <select className="select" value={filterSrc} onChange={(e) => setFilterSrc(e.target.value)}>
                <option value="all">All sources</option>
                {uniqueSources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="field mb-12">
              <div className="lbl">Keyword</div>
              <input className="input" placeholder="filter by keyword…"
                     value={filterKw} onChange={(e) => setFilterKw(e.target.value)} />
            </div>

            <div className="hist-summary">
              <div className="big tnum">{totalInRange}</div>
              <div className="sub">articles in range · {daySpan} {daySpan === 1 ? 'day' : 'days'}</div>
            </div>
          </aside>

          {/* ---------- MAIN: Day-grouped timeline ---------- */}
          <div className="hist-main">
            {days.length === 0 ? (
              <div className="empty-state">
                <h3>No articles in this range</h3>
                <div>Try widening the date range, or clear the source/keyword filter.</div>
              </div>
            ) : days.map((day) => (
              <div key={day} className="day-bucket">
                <div className="day-header">
                  <span className="serif">{formatDayHeader(day)}</span>
                  <span className="muted small mono">· {byDay[day].length} {byDay[day].length === 1 ? 'article' : 'articles'}</span>
                  <div style={{flex:1}}></div>
                  <button className="btn ghost sm"><Icon name="download" /> Day</button>
                </div>
                <div className="hist-list">
                  {byDay[day].map((item, i) => (
                    <HistoryRow key={day + '-' + item.id + '-' + i} item={item} onOpen={onOpen} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'snapshots' && (
        <>
          <div className="muted small mb-12">
            One row per scheduler briefing run. Click to inspect that exact frozen-in-time briefing.
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Briefing</th>
                <th>Date</th>
                <th>Time</th>
                <th className="text-center">Articles</th>
                <th>Filename</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ARCHIVES.map((a) => (
                <tr key={a.filename}
                    onClick={() => onOpen({title:a.filename, summary:`${a.articles} articles archived at ${a.time}`, src:'archive', tone:'sand', keywords:['archive'], conf:1, region:'Global', mins_read:0, ago:'archive', date:a.date, time:a.time, category:'Briefing archive'})}
                    style={{cursor:'pointer'}}>
                  <td>
                    <div className="row gap-8">
                      <Icon name="file" size={14} />
                      <span style={{fontFamily:'Fraunces, serif', fontSize:14, fontWeight:500}}>Morning briefing</span>
                    </div>
                  </td>
                  <td className="mono">{a.date}</td>
                  <td className="mono">{a.time}</td>
                  <td className="text-center mono">{a.articles}</td>
                  <td className="muted mono small">{a.filename}</td>
                  <td>
                    <div className="row gap-4" style={{justifyContent:'flex-end'}}>
                      <button className="btn ghost icon sm"><Icon name="eye" /></button>
                      <button className="btn ghost icon sm"><Icon name="download" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// ---------------- Trends ----------------
function TrendsScreen() {
  return (
    <div className="content" style={{maxWidth: 1100}}>
      <div className="page-head">
        <div>
          <h1>Trends</h1>
          <div className="page-sub">What the desk is paying attention to right now. Last 7 days.</div>
        </div>
      </div>

      <div className="card mb-20" style={{padding:20}}>
        <div className="serif mb-12" style={{fontSize:18, fontWeight:500}}>Hot keywords</div>
        <div className="hot-kw-row" style={{margin:0}}>
          {HOT_KEYWORDS.map((h, i) => (
            <div key={i} className="hot">
              <span>{h.k}</span>
              <span className="n">{h.n}</span>
              {h.up != null && <span className={"arrow" + (h.up ? "" : " dn")}>{h.up ? "▲" : "▼"}</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        <div className="card" style={{padding:20}}>
          <div className="serif mb-12" style={{fontSize:16, fontWeight:500}}>Sources by volume</div>
          {SOURCES.slice(0,8).map((s) => (
            <div key={s.name} className="row gap-12 mt-8">
              <span className="small" style={{minWidth:160}}>{s.name}</span>
              <div className="progress grow"><div className="fill" style={{width: Math.min(100, s.count/4) + '%'}}></div></div>
              <span className="mono small tnum">{s.count}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{padding:20}}>
          <div className="serif mb-12" style={{fontSize:16, fontWeight:500}}>Bouncer activity</div>
          <div className="ribbon" style={{margin:0, gridTemplateColumns:'1fr 1fr'}}>
            <div className="cell"><div className="label">Trained samples</div><div className="big tnum">142</div><div className="sub">+18 this week</div></div>
            <div className="cell"><div className="label">Model accuracy</div><div className="big tnum">87%</div><div className="sub">on hold-out set</div></div>
          </div>
          <div className="muted small mt-16">Bouncer threshold currently 0.60 · last retrain 1h ago after 3 thumbs-downs.</div>
        </div>
      </div>
    </div>
  );
}

window.RejectedScreen = RejectedScreen;
window.SourcesScreen = SourcesScreen;
window.SchedulerScreen = SchedulerScreen;
window.HistoryScreen = HistoryScreen;
window.TrendsScreen = TrendsScreen;
