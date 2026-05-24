// ============================================================
// Modals — Article detail, Director key, Selector name, Region edit
// ============================================================

function ArticleModal({ item, onClose, onSelect }) {
  if (!item) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <h3>Article detail</h3>
          <span className="x" onClick={onClose}><Icon name="x" /></span>
        </div>
        <div style={{aspectRatio:'16/8', borderBottom:'1px solid var(--line)'}}>
          <div className={"ph-img " + (item.tone || '')}></div>
        </div>
        <div className="body">
          <div className="row gap-8 wrap">
            <span className="tag accent">{item.category}</span>
            <span className="tag info">{item.region}</span>
            <span className="tag mono">{item.src}</span>
            <span className="tag mono">{item.date} {item.time}</span>
            {item.is_fresh && <span className="tag err">Just-in</span>}
          </div>
          <h2 className="serif mt-16" style={{fontSize:24, fontWeight:500, lineHeight:1.2}}>{item.title}</h2>
          <p className="mt-12" style={{fontSize:15, color:'var(--ink-2)', lineHeight:1.6}}>{item.summary}</p>
          <div className="kws mt-12">
            {item.keywords && item.keywords.map((k,i) => <span key={i} className="kw-tag">{k}</span>)}
          </div>
          {item.conf < 1 && (
            <div className="mt-16 row gap-12">
              <span className="muted small">Bouncer confidence</span>
              <div className="progress" style={{width:200}}><div className="fill" style={{width: (item.conf * 100) + '%'}}></div></div>
              <span className="mono small tnum">{item.conf.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="foot">
          <button className="btn ghost" onClick={onClose}>Close</button>
          <button className="btn"><Icon name="external" /> Open original</button>
          <button className="btn primary" onClick={() => { onSelect(item); onClose(); }}>
            <Icon name="check" /> Select for digest
          </button>
        </div>
      </div>
    </div>
  );
}

function DirectorKeyModal({ open, onClose, onConfirm, article }) {
  const [key, setKey] = React.useState('');
  const [err, setErr] = React.useState('');
  React.useEffect(() => { if (open) { setKey(''); setErr(''); } }, [open]);
  if (!open) return null;

  const submit = () => {
    if (key === '1357') { onConfirm(article); onClose(); }
    else setErr('Invalid director key. Try 1357 (demo).');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <Icon name="shield" />
          <h3>Director approval</h3>
          <span className="x" onClick={onClose}><Icon name="x" /></span>
        </div>
        <div className="body">
          <div className="muted small mb-12">Approving will move this article into today's digest. Director key required.</div>
          {article && (
            <div className="card" style={{padding:14, marginBottom:14}}>
              <div className="meta mono small muted">{article.src} · {article.ago}</div>
              <div className="serif mt-4" style={{fontSize:14, fontWeight:500}}>{article.title}</div>
            </div>
          )}
          <div className="field">
            <div className="lbl">Director key</div>
            <input className="input" type="password" value={key}
                   onChange={(e) => { setKey(e.target.value); setErr(''); }}
                   onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                   placeholder="••••" autoFocus />
            {err && <div className="small" style={{color:'var(--err)'}}>{err}</div>}
          </div>
        </div>
        <div className="foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn ok" onClick={submit}><Icon name="shield" /> Approve</button>
        </div>
      </div>
    </div>
  );
}

function NameModal({ open, onClose, onConfirm, article }) {
  const [name, setName] = React.useState(localStorage.getItem('initiator-name') || '');
  React.useEffect(() => { if (open) setName(localStorage.getItem('initiator-name') || ''); }, [open]);
  if (!open) return null;

  const submit = () => {
    if (!name.trim()) return;
    localStorage.setItem('initiator-name', name.trim());
    onConfirm(article, name.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <Icon name="check" />
          <h3>Add to selection</h3>
          <span className="x" onClick={onClose}><Icon name="x" /></span>
        </div>
        <div className="body">
          <div className="muted small mb-12">Tag yourself as the editor selecting this story so the director knows who picked it.</div>
          {article && (
            <div className="card" style={{padding:14, marginBottom:14}}>
              <div className="meta mono small muted">{article.src} · {article.ago}</div>
              <div className="serif mt-4" style={{fontSize:14, fontWeight:500}}>{article.title}</div>
            </div>
          )}
          <div className="field">
            <div className="lbl">Your name</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                   placeholder="e.g. Vineet" autoFocus />
          </div>
        </div>
        <div className="foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}><Icon name="check" /> Add to selected</button>
        </div>
      </div>
    </div>
  );
}

window.ArticleModal = ArticleModal;
window.DirectorKeyModal = DirectorKeyModal;
window.NameModal = NameModal;
