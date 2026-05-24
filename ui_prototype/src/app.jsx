// ============================================================
// App — top-level routing, modal orchestration, mock state
// ============================================================

function App() {
  const [active, setActive] = React.useState(localStorage.getItem('sense-screen') || 'feed');
  const [sub, setSub]       = React.useState(localStorage.getItem('sense-sub') || 'triage');
  React.useEffect(() => localStorage.setItem('sense-screen', active), [active]);
  React.useEffect(() => localStorage.setItem('sense-sub', sub), [sub]);

  // Mock workflow / votes / rejected — kept in memory so user can play with them
  const [selectedItems, setSelectedItems] = React.useState(WORKFLOW_SELECTED);
  const [approvedItems, setApprovedItems] = React.useState(WORKFLOW_APPROVED);
  const [rejectedItems, setRejectedItems] = React.useState(REJECTED);
  const [votes, setVotes] = React.useState({});

  // Modal state
  const [openArticle, setOpenArticle] = React.useState(null);
  const [pendingApproval, setPendingApproval] = React.useState(null);
  const [pendingSelect, setPendingSelect] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  // ---------- Action handlers ----------
  const onSelectArticle = (item) => setPendingSelect(item);
  const confirmSelect = (item, name) => {
    if (selectedItems.find((x) => x.id === item.id)) {
      showToast('err', 'Already in selection');
      return;
    }
    setSelectedItems([{ ...item, selected_by: name, selected_at: new Date().toISOString().slice(0,16).replace('T',' ') }, ...selectedItems]);
    showToast('ok', `Added to selection by ${name}`);
  };

  const onApprove = (item) => setPendingApproval(item);
  const confirmApprove = (item) => {
    setSelectedItems(selectedItems.filter((x) => x.id !== item.id));
    setApprovedItems([{ ...item, approved_at: new Date().toISOString().slice(0,16).replace('T',' '), approved_by: 'Director' }, ...approvedItems]);
    showToast('ok', 'Approved into digest');
  };

  const onRemove = (item, listType) => {
    if (listType === 'selected') setSelectedItems(selectedItems.filter((x) => x.id !== item.id));
    if (listType === 'approved') setApprovedItems(approvedItems.filter((x) => x.id !== item.id));
    showToast('ok', 'Removed');
  };

  const onRestore = (item) => {
    setRejectedItems(rejectedItems.filter((x) => x.id !== item.id));
    showToast('ok', `Restored "${item.title.slice(0, 38)}…" — bouncer re-trained`);
  };

  const setVote = (item, v) => {
    setVotes({ ...votes, [item.id]: v });
    if (v === 'down') {
      // Simulate "not interested" effect — also drop from feed (visually we'd hide, but keep simple here)
      showToast('ok', 'Bouncer trained · article hidden for 22h');
    } else if (v === 'up') {
      showToast('ok', 'Bouncer trained · marked interesting');
    }
  };

  // ---------- Counts for sidebar ----------
  const counts = {
    feed: ARTICLES.length,
    selected: selectedItems.length,
    approved: approvedItems.length,
    rejected: rejectedItems.length,
    newBriefing: true,
  };

  // ---------- Crumb computation ----------
  const crumbMap = {
    feed:      ['Review', 'Latest feed', sub === 'triage' ? 'Triage' : sub === 'wall' ? 'Wall' : 'Pipeline'],
    scan:      ['Review', 'Manual scan'],
    selected:  ['Review', 'Selected'],
    approved:  ['Review', 'Approved'],
    rejected:  ['Review', 'Not interested'],
    sources:   ['Intelligence', 'Sources'],
    scheduler: ['Intelligence', 'Scheduler'],
    history:   ['Intelligence', 'History'],
    trends:    ['Intelligence', 'Trends'],
  };

  // ---------- Render screen ----------
  let screen = null;
  if (active === 'feed') {
    screen = <FeedScreen sub={sub} setSub={setSub}
                         votes={votes} setVote={setVote}
                         onSelect={onSelectArticle}
                         onOpen={setOpenArticle} />;
  } else if (active === 'scan') {
    screen = <ScanScreen votes={votes} setVote={setVote}
                         onSelect={onSelectArticle}
                         onOpen={setOpenArticle} />;
  } else if (active === 'selected') {
    screen = <SelectedScreen items={selectedItems}
                             onApprove={onApprove}
                             onRemove={onRemove}
                             onOpen={setOpenArticle} />;
  } else if (active === 'approved') {
    screen = <ApprovedScreen items={approvedItems} onRemove={onRemove} onOpen={setOpenArticle} />;
  } else if (active === 'rejected') {
    screen = <RejectedScreen items={rejectedItems} onRestore={onRestore} onOpen={setOpenArticle} />;
  } else if (active === 'sources') {
    screen = <SourcesScreen />;
  } else if (active === 'scheduler') {
    screen = <SchedulerScreen />;
  } else if (active === 'history') {
    screen = <HistoryScreen onOpen={setOpenArticle} />;
  } else if (active === 'trends') {
    screen = <TrendsScreen />;
  }

  return (
    <>
      <Sidebar active={active}
               counts={counts}
               onNav={(id) => { setActive(id); if (id === 'feed') setSub('triage'); }} />

      <div className="main">
        <TopBar crumb={crumbMap[active] || ['Sense']}
                onNav={setActive}
                onSearchSubmit={(q) => { setActive('scan'); showToast('ok', `Search "${q}" → manual scan`); }} />
        {screen}
      </div>

      {/* Modals */}
      <ArticleModal item={openArticle}
                    onClose={() => setOpenArticle(null)}
                    onSelect={onSelectArticle} />
      <DirectorKeyModal open={!!pendingApproval}
                        article={pendingApproval}
                        onClose={() => setPendingApproval(null)}
                        onConfirm={confirmApprove} />
      <NameModal open={!!pendingSelect}
                 article={pendingSelect}
                 onClose={() => setPendingSelect(null)}
                 onConfirm={confirmSelect} />

      {/* Toast */}
      {toast && (
        <div className={"toast " + toast.type}>
          <Icon className="ico" name={toast.type === 'ok' ? 'check2' : 'error'} />
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}

// Mount
const root = document.getElementById('app-root');
root.innerHTML = '';
ReactDOM.createRoot(root).render(<App />);
