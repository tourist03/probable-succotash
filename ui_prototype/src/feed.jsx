// ============================================================
// Feed — Latest briefing screen
// Three sub-views: Triage (list+preview), Wall (card grid), Pipeline (kanban)
// ============================================================

function Bouncer({ vote, onVote }) {
  return (
    <div className="bouncer" onClick={(e) => e.stopPropagation()}>
      <div className={"b up" + (vote === 'up' ? " on" : "")}
           onClick={() => onVote(vote === 'up' ? null : 'up')}
           title="Interesting (trains bouncer)">
        <Icon name="thumbsUp" />
      </div>
      <div className={"b down" + (vote === 'down' ? " on" : "")}
           onClick={() => onVote(vote === 'down' ? null : 'down')}
           title="Not interested (trains bouncer + hides)">
        <Icon name="thumbsDown" />
      </div>
    </div>
  );
}

function ArticleCard({ item, vote, onVote, onSelect, onOpen, isSelected }) {
  return (
    <div className={"card" + (isSelected ? " selected-ring" : "")}>
      <div className="hero">
        <div className={"ph-img " + (item.tone || '')}></div>
        {item.mark && <div className="mark">{item.mark}</div>}
        {item.is_fresh && <div className="just-in">Just in · {item.ago}</div>}
        <div className={"region-flag " + (item.region === 'Local' ? 'local' : '')}>
          {item.region}
        </div>
      </div>
      <div className="body">
        <div className="meta">
          <span className="src">{item.src}</span>
          {item.source_count > 1 && <><span className="sep">·</span><span><Icon name="layers" size={11} /> {item.source_count} sources</span></>}
          <span className="sep">·</span>
          <span>{item.ago}</span>
          <span className="sep">·</span>
          <span>{item.mins_read} min read</span>
        </div>
        <div className="title" onClick={() => onOpen(item)}>{item.title}</div>
        <div className="summary">{item.summary}</div>
        <div className="kws">
          {item.keywords.slice(0,4).map((k,i) => <span key={i} className="kw-tag">{k}</span>)}
          {item.keywords.length > 4 && <span className="kw-tag">+{item.keywords.length-4}</span>}
        </div>
      </div>
      <div className="actions">
        <button className="btn primary sm" onClick={() => onSelect(item)}>
          <Icon name="check" /> Select
        </button>
        <button className="btn ghost sm">
          <Icon name="external" /> Open
        </button>
        <Bouncer vote={vote} onVote={(v) => onVote(item, v)} />
        <span className="conf mono">conf {item.conf.toFixed(2)}</span>
      </div>
    </div>
  );
}

function FeedScreen({ sub, setSub, onSelect, onOpen, votes, setVote }) {
  const [activeId, setActiveId] = React.useState(ARTICLES[0].id);
  const active = ARTICLES.find((a) => a.id === activeId) || ARTICLES[0];

  const PageHead = () => (
    <div className="page-head">
      <div>
        <h1>Today on the desk</h1>
        <div className="page-sub">Friday · 19 April 2026 · 47 articles after bouncer · last crawl 12:00 IST</div>
      </div>
      <div className="page-head-actions">
        <div className="screens">
          <div className={"s" + (sub === 'triage' ? " active" : "")} onClick={() => setSub('triage')}>Triage</div>
          <div className={"s" + (sub === 'wall' ? " active" : "")} onClick={() => setSub('wall')}>Wall</div>
          <div className={"s" + (sub === 'pipeline' ? " active" : "")} onClick={() => setSub('pipeline')}>Pipeline</div>
        </div>
      </div>
    </div>
  );

  const Ribbon = () => (
    <div className="ribbon">
      <div className="cell">
        <div className="label">Since last visit</div>
        <div className="big tnum">47<span className="trend">+12</span></div>
        <div className="sub">12 marked Just-in</div>
      </div>
      <div className="cell">
        <div className="label">Last crawl</div>
        <div className="big tnum">02:14<span className="muted small mono"> ago</span></div>
        <div className="sub">21 kept · 26 dropped</div>
      </div>
      <div className="cell">
        <div className="label">Selected</div>
        <div className="big tnum">12</div>
        <div className="sub">3 awaiting director</div>
      </div>
      <div className="cell">
        <div className="label">Approved today</div>
        <div className="big tnum">4<span className="trend neg">-1</span></div>
        <div className="sub">Ready for digest</div>
      </div>
    </div>
  );

  const HotKw = () => (
    <div className="hot-kw-row">
      <span className="lbl">Trending</span>
      {HOT_KEYWORDS.map((h, i) => (
        <div key={i} className="hot">
          <span>{h.k}</span>
          <span className="n">{h.n}</span>
          {h.up != null && <span className={"arrow" + (h.up ? "" : " dn")}>{h.up ? "▲" : "▼"}</span>}
        </div>
      ))}
    </div>
  );

  // -------- Triage view --------
  if (sub === 'triage') {
    return (
      <div className="content">
        <PageHead />
        <Ribbon />
        <HotKw />
        <div className="triage">
          <div className="list-card">
            <div className="list-head">
              <span className="count">47</span> articles · Friday 19 April
              <div className="list-head-actions">
                <button className="btn ghost sm"><Icon name="sort" /> Sort</button>
                <button className="btn ghost sm"><Icon name="filter" /> Filter</button>
              </div>
            </div>
            {ARTICLES.map((a) => (
              <div key={a.id}
                   className={"list-row" + (a.id === activeId ? " active" : "") + (a.id !== 5 && a.id !== 8 && a.id !== 9 ? " unread" : "")}
                   onClick={() => setActiveId(a.id)}>
                <div className="dot-wrap"><span className="dot"></span></div>
                <div className="thumb"><div className={"ph-img " + (a.tone || '')}></div></div>
                <div>
                  <div className="top">
                    <span>{a.src}</span>
                    <span className="muted">·</span>
                    <span>{a.ago}</span>
                    {a.is_fresh && <span className="tag accent" style={{height:18, fontSize:10}}>Just-in</span>}
                    {votes[a.id] === 'up' && <span className="tag ok" style={{height:18, fontSize:10}}>Trained+</span>}
                  </div>
                  <div className={"ttl" + (a.id === 5 || a.id === 8 || a.id === 9 ? " read" : "")}>{a.title}</div>
                  <div className="kws">
                    {a.keywords.slice(0,3).map((k,i) => <span key={i} className="kw-tag">{k}</span>)}
                  </div>
                </div>
                <div className="right">
                  <span className="mono small muted tnum">conf {a.conf.toFixed(2)}</span>
                  {a.region === 'Local' && <span className="tag accent" style={{height:18, fontSize:10}}>Local</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="preview">
            <div className="hero">
              <div className={"ph-img " + (active.tone || '')}></div>
              {active.mark && <div className="mark">{active.mark}</div>}
              {active.is_fresh && <div className="just-in">Just in · {active.ago}</div>}
            </div>
            <div className="body">
              <div className="eyebrow">
                <span>{active.category}</span>
                <span className="muted">·</span>
                <span className="mono">{active.src}</span>
                <span className="muted">·</span>
                <span className="mono">{active.date} {active.time}</span>
              </div>
              <h2>{active.title}</h2>
              <div className="lede">{active.id === 1 ? PREVIEW_BODY : <p>{active.summary}</p>}</div>
              <div className="kws mt-16">
                {active.keywords.map((k,i) => <span key={i} className="kw-tag">{k}</span>)}
                <span className="tag info">{active.region}</span>
              </div>
            </div>
            <div className="similar">
              <h4>Related · same cluster</h4>
              {SIMILAR.map((s, i) => (
                <div key={i} className="mini">
                  <span className="d"></span>
                  <span>{s.t}</span>
                  <span className="src">{s.src}</span>
                </div>
              ))}
            </div>
            <div className="actions">
              <button className="btn primary" onClick={() => onSelect(active)}>
                <Icon name="check" /> Select for digest <span className="kbd" style={{marginLeft:6}}>S</span>
              </button>
              <button className="btn"><Icon name="archive" /> Skip <span className="kbd" style={{marginLeft:6}}>A</span></button>
              <span className="vr" style={{height:24}}></span>
              <Bouncer vote={votes[active.id]} onVote={(v) => setVote(active, v)} />
              <span className="muted small">trains bouncer</span>
              <div style={{marginLeft:'auto'}} className="row">
                <button className="btn ghost icon" title="Previous"><Icon name="chevL" /></button>
                <button className="btn ghost icon" title="Next"><Icon name="chevR" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------- Wall view --------
  if (sub === 'wall') {
    return (
      <div className="content">
        <PageHead />
        <Ribbon />
        <HotKw />
        <div className="card-grid cols-3">
          {ARTICLES.map((a) => (
            <ArticleCard key={a.id}
                         item={a}
                         vote={votes[a.id]}
                         onVote={setVote}
                         onSelect={onSelect}
                         onOpen={onOpen} />
          ))}
        </div>
      </div>
    );
  }

  // -------- Pipeline view (kanban) --------
  if (sub === 'pipeline') {
    const crawled = ARTICLES.slice(3, 9);
    return (
      <div className="content">
        <PageHead />
        <div className="kanban">
          <div className="kcol">
            <div className="head">
              <div className="ttl">Crawled</div>
              <div className="n">{crawled.length}</div>
            </div>
            <div className="desc">Bouncer-passed, awaiting editorial review.</div>
            {crawled.map((a) => (
              <div key={a.id} className="kcard" onClick={() => onOpen(a)}>
                <div className="meta">{a.src} · {a.ago}</div>
                <div className="ttl">{a.title}</div>
                <div className="foot">
                  <span className="kw-tag">{a.keywords[0]}</span>
                  <span className="muted small mono" style={{marginLeft:'auto'}}>conf {a.conf.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="kcol">
            <div className="head">
              <div className="ttl">Selected</div>
              <div className="n">{WORKFLOW_SELECTED.length}</div>
            </div>
            <div className="desc">Picked by editors, awaiting director sign-off.</div>
            {WORKFLOW_SELECTED.map((a) => (
              <div key={a.id} className="kcard">
                <div className="meta">{a.src} · by {a.selected_by}</div>
                <div className="ttl">{a.title}</div>
                <div className="foot">
                  <span className="tag accent">Awaiting</span>
                </div>
              </div>
            ))}
          </div>
          <div className="kcol">
            <div className="head">
              <div className="ttl">Approved</div>
              <div className="n">{WORKFLOW_APPROVED.length}</div>
            </div>
            <div className="desc">Director-approved, in today's digest.</div>
            {WORKFLOW_APPROVED.map((a) => (
              <div key={a.id} className="kcard">
                <div className="meta">{a.src} · {a.approved_at}</div>
                <div className="ttl">{a.title}</div>
                <div className="foot">
                  <span className="tag ok">Approved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

window.FeedScreen = FeedScreen;
window.ArticleCard = ArticleCard;
window.Bouncer = Bouncer;
