// Thin API wrappers. In dev, vite proxies these paths to the backend.
import { getSessionId } from './utils/session.js';

const BASE = import.meta.env.VITE_API_BASE || '';

function selectedProfile() {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem('news-profile') === 'broadcast' ? 'broadcast' : 'default';
}

async function jsonFetch(url, opts = {}) {
  const res = await fetch(BASE + url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Sense-Profile': selectedProfile(),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// ---------- Briefing / feed ----------
export const getLatestBriefing = () => jsonFetch('/latest-briefing');
export const getBriefingMeta   = () => jsonFetch('/briefing/meta');
export const removeFromBriefing  = (title)   => jsonFetch('/briefing/remove',  { method:'POST', body: JSON.stringify({ title }) });
export const restoreToBriefing   = (article) => jsonFetch('/briefing/restore', { method:'POST', body: JSON.stringify({ article }) });
export const getInsight = (article) => jsonFetch('/insight', { method:'POST', body: JSON.stringify(article) });

// ---------- Crawl (SSE) ----------
export function streamCrawl(params, onEvent) {
  const u = new URLSearchParams();
  if (params.keywords)     u.set('keywords', params.keywords);
  if (params.from_date)    u.set('from_date', params.from_date);
  if (params.to_date)      u.set('to_date', params.to_date);
  if (params.target_sites) u.set('target_sites', params.target_sites);
  u.set('session_id', params.session_id || getSessionId());
  u.set('profile', selectedProfile());
  const url = `${BASE}/crawl?${u.toString()}`;
  const es = new EventSource(url);

  const handle = (type) => (ev) => {
    let data = ev.data;
    try { data = JSON.parse(ev.data); } catch {}
    onEvent({ type, data });
  };
  ['job_started','status','card','data','error'].forEach((t) => {
    es.addEventListener(t, handle(t));
  });
  // Some servers emit unnamed messages
  es.onmessage = (ev) => {
    let data = ev.data;
    try { data = JSON.parse(ev.data); } catch {}
    onEvent({ type: 'message', data });
  };
  es.onerror = (e) => { onEvent({ type: 'error', data: { error: 'SSE connection lost' } }); };
  return () => es.close();
}

// ---------- Train / votes ----------
export const trainVote = (keywords, summary, vote, title = '') =>
  jsonFetch('/train', { method:'POST', body: JSON.stringify({ keywords, summary, vote, title }) });
export const correctRegion = (article, region, keywords, reason) =>
  jsonFetch('/region/correct', {
    method: 'POST',
    body: JSON.stringify({
      title: article.title,
      previous_region: article.region || 'Global',
      region,
      keywords,
      reason,
    }),
  });

// ---------- Not interested ----------
export const getNotInterested  = () => jsonFetch('/not-interested');
export const markNotInterested = (article) =>
  jsonFetch('/not-interested', { method:'POST', body: JSON.stringify(article) });
export const restoreNotInterested = (title) =>
  jsonFetch('/not-interested/restore', { method:'POST', body: JSON.stringify({ title }) });

// Convenience: full not-interested flow (also removes from briefing)
export async function rejectArticle(article) {
  const res = await markNotInterested(article);
  try { await removeFromBriefing(article.title); } catch {}
  return res;
}
export async function unrejectArticle(article) {
  const res = await restoreNotInterested(article.title);
  try { await restoreToBriefing(article); } catch {}
  return res;
}

// ---------- Workflow ----------
export const getWorkflow = () => jsonFetch('/workflow');
export const selectWorkflow = (article) =>
  jsonFetch('/workflow/select', { method:'POST', body: JSON.stringify(article) });
export const approveWorkflow = (title, key='1357') =>
  jsonFetch('/workflow/approve', { method:'POST', body: JSON.stringify({ title, key }) });
export const removeWorkflow = (title, list_type) =>
  jsonFetch('/workflow/remove', { method:'POST', body: JSON.stringify({ title, list_type }) });

// ---------- Sources ----------
export const getSites = () => jsonFetch('/sites');
export const addSite  = (site) => jsonFetch('/sites', { method:'POST', body: JSON.stringify(site) });

// ---------- History ----------
export function getHistoryList() {
  const u = new URLSearchParams({ session_id: getSessionId() });
  return jsonFetch('/history/list?' + u.toString());
}

export function getHistoryFile(filename) {
  return jsonFetch('/history/' + encodeURIComponent(filename));
}

export function getHistoryRange(from_date, to_date) {
  const u = new URLSearchParams({ from_date, to_date, session_id: getSessionId() });
  return jsonFetch('/history/range?' + u.toString());
}

// ---------- Tracking ----------
export const trackEvent = (fingerprint, action, detail) =>
  jsonFetch('/track', { method:'POST', body: JSON.stringify({ fingerprint, action, detail }) });

// ---------- Status ----------
export const getStatus = () => jsonFetch('/status');

// ---------- Analytics ----------
export const getAnalyticsAccess = () => jsonFetch('/analytics/access');
export const getAnalytics = (key) => {
  const u = new URLSearchParams({ key });
  return jsonFetch('/analytics?' + u.toString());
};

// ---------- Exports (binary) ----------
async function exportBinary(path, items, filename) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sense-Profile': selectedProfile(),
    },
    body: JSON.stringify({ items, filename }),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
export const exportPpt   = (items, filename='digest.pptx') => exportBinary('/export-ppt',   items, filename);
export const exportExcel = (items, filename='digest.xlsx') => exportBinary('/export-excel', items, filename);
export const exportWord  = (items, filename='digest.docx') => exportBinary('/export-word',  items, filename);
