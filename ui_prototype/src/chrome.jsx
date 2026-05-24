// ============================================================
// Chrome — Sidebar + TopBar
// ============================================================

function Sidebar({ active, onNav, counts }) {
  const reviewItems = [
    { id:'feed',     label:'Latest feed',    icon:'inbox',   count: counts.feed },
    { id:'scan',     label:'Manual scan',    icon:'search' },
    { id:'selected', label:'Selected',       icon:'check',   count: counts.selected },
    { id:'approved', label:'Approved',       icon:'star',    count: counts.approved },
    { id:'rejected', label:'Not interested', icon:'trash',   count: counts.rejected },
  ];
  const intelItems = [
    { id:'sources',   label:'Sources',   icon:'globe' },
    { id:'scheduler', label:'Scheduler', icon:'clock' },
    { id:'history',   label:'History',   icon:'history' },
    { id:'trends',    label:'Trends',    icon:'trend' },
  ];

  const NavBtn = (it) => (
    <div key={it.id}
         className={"nav-item" + (active === it.id ? " active" : "")}
         onClick={() => onNav(it.id)}>
      <Icon name={it.icon} />
      <span>{it.label}</span>
      {it.count != null && <span className="count tnum">{it.count}</span>}
      {it.id === 'feed' && counts.newBriefing && <span className="badge-new">New</span>}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">S</div>
        <div>
          <div className="name">SENSE</div>
          <div className="sub">News intelligence</div>
        </div>
      </div>

      <div className="nav-section">Review</div>
      <div className="col gap-4">{reviewItems.map(NavBtn)}</div>

      <div className="nav-section">Intelligence</div>
      <div className="col gap-4">{intelItems.map(NavBtn)}</div>

      <div className="sidebar-foot">
        <div className="crawler-chip">
          <div className="row">
            <span className="label">Autonomous engine</span>
            <span className="status"><span className="pulse"></span>live</span>
          </div>
          <div className="bar"><div className="fill" style={{width:'62%'}}></div></div>
          <div className="next">Next run · 16:00 IST · in 3h 47m</div>
        </div>

        <div className="user-chip">
          <div className="avatar">VS</div>
          <div className="col gap-4" style={{gap:0}}>
            <div className="n">Vineet Singh</div>
            <div className="r">Editor</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ crumb, onSearchSubmit, onNav }) {
  const [q, setQ] = React.useState('');
  return (
    <div className="topbar">
      <div className="crumb">
        {crumb.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {i === crumb.length - 1 ? <b>{c}</b> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="search-bar">
        <Icon name="search" />
        <input
          placeholder="Search news, keywords, sources… or type a new query"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { onSearchSubmit?.(q); setQ(''); } }}
        />
        <span className="kbd">⌘K</span>
      </div>

      <div className="top-actions">
        <button className="btn ghost icon" title="Refresh"><Icon name="refresh" /></button>
        <button className="btn ghost icon" title="Filters"><Icon name="filter" /></button>
        <button className="btn primary" onClick={() => onNav('scan')}>
          <Icon name="plus" /> New scan
        </button>
        <span className="vr" style={{height:'24px', margin:'0 4px'}}></span>
        <button className="btn ghost icon" title="Notifications"><Icon name="bell" /></button>
        <button className="btn ghost icon" title="Settings"><Icon name="settings" /></button>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.TopBar = TopBar;
