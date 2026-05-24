// ============================================================
// Workflow — Selected & Approved screens
// ============================================================

function SelectedScreen({ onApprove, onRemove, onOpen, items }) {
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Selected for digest</h1>
          <div className="page-sub">{items.length} articles awaiting director approval. Director key required to approve.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn ghost"><Icon name="download" /> Export as draft</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing selected yet</h3>
          <div>Pick stories from the Latest feed or Manual scan — they'll appear here for director sign-off.</div>
        </div>
      ) : (
        <div className="card-grid">
          {items.map((a) => (
            <div key={a.id} className="card">
              <div className="hero">
                <div className={"ph-img " + (a.tone || '')}></div>
                <div className="mark">Selected by {a.selected_by}</div>
              </div>
              <div className="body">
                <div className="meta">
                  <span className="src">{a.src}</span>
                  <span className="sep">·</span>
                  <span>{a.selected_at}</span>
                </div>
                <div className="title" onClick={() => onOpen(a)}>{a.title}</div>
                <div className="summary">{a.summary}</div>
                <div className="kws">
                  {a.keywords.slice(0,4).map((k,i) => <span key={i} className="kw-tag">{k}</span>)}
                </div>
              </div>
              <div className="actions">
                <button className="btn ok sm" onClick={() => onApprove(a)}>
                  <Icon name="shield" /> Approve
                </button>
                <button className="btn sm ghost" onClick={() => onRemove(a, 'selected')}>
                  <Icon name="x" /> Remove
                </button>
                <span className="conf mono" style={{marginLeft:'auto'}}>conf {a.conf.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovedScreen({ items, onRemove, onOpen }) {
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Approved digest</h1>
          <div className="page-sub">{items.length} articles signed off · ready for distribution.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn"><Icon name="download" /> Excel</button>
          <button className="btn"><Icon name="download" /> Word</button>
          <button className="btn primary"><Icon name="download" /> PowerPoint</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>No approvals yet today</h3>
          <div>Director needs to sign off on Selected items before they appear here.</div>
        </div>
      ) : (
        <div className="card-grid">
          {items.map((a) => (
            <div key={a.id} className="card">
              <div className="hero">
                <div className={"ph-img " + (a.tone || '')}></div>
                <div className="mark" style={{background:'var(--ok)', color:'#fff'}}>Approved · {a.approved_by}</div>
              </div>
              <div className="body">
                <div className="meta">
                  <span className="src">{a.src}</span>
                  <span className="sep">·</span>
                  <span>by {a.selected_by}</span>
                  <span className="sep">·</span>
                  <span>{a.approved_at}</span>
                </div>
                <div className="title" onClick={() => onOpen(a)}>{a.title}</div>
                <div className="summary">{a.summary}</div>
                <div className="kws">
                  {a.keywords.slice(0,4).map((k,i) => <span key={i} className="kw-tag">{k}</span>)}
                </div>
              </div>
              <div className="actions">
                <button className="btn sm ghost" onClick={() => onRemove(a, 'approved')}><Icon name="x" /> Remove</button>
                <button className="btn sm ghost"><Icon name="external" /> Open</button>
                <span className="tag ok" style={{marginLeft:'auto'}}><span className="dot"></span>In digest</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.SelectedScreen = SelectedScreen;
window.ApprovedScreen = ApprovedScreen;
