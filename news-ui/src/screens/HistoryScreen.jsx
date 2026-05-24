import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import ArticleCard, { SignalVisual } from '../components/ArticleCard.jsx';
import ArticleModal from '../components/modals/ArticleModal.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import { correctRegion, getHistoryFile, getHistoryList } from '../api.js';
import { normalizeList } from '../utils/normalize.js';
import { cardVariant, groupedByDate, scoreOf } from '../utils/intelligence.js';

const TODAY = new Date().toISOString().slice(0, 10);

function dateAddDays(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function parseRun(file) {
  const filename = file.filename || '';
  const match = filename.match(/(\d{4}-\d{2}-\d{2})[_-](\d{2})-(\d{2})/);
  const date = match?.[1] || TODAY;
  const time = match ? `${match[2]}:${match[3]}` : '00:00';
  const d = new Date(`${date}T${time}:00`);
  return {
    ...file,
    date,
    time,
    timestamp: Number.isNaN(d.getTime()) ? 0 : d.getTime(),
    label: Number.isNaN(d.getTime())
      ? file.display || filename
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  };
}

function groupRuns(runs) {
  return runs.reduce((acc, run) => {
    const d = new Date(`${run.date}T00:00:00`);
    const key = Number.isNaN(d.getTime())
      ? 'Unknown'
      : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(run);
    return acc;
  }, {});
}

function topKeywords(items) {
  const map = new Map();
  items.forEach((item) => (item.keywords || []).forEach((k) => map.set(k, (map.get(k) || 0) + 1)));
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
}

function runSummary(items) {
  return {
    articles: items.length,
    clusters: items.filter((item) => (item.source_count || 1) > 1).length,
    high: items.filter((item) => scoreOf(item) >= 80).length,
    keywords: topKeywords(items).slice(0, 3),
  };
}

function ArchiveMosaic({ items, onOpen }) {
  const lead = [...items].sort((a, b) => scoreOf(b) - scoreOf(a))[0];
  const support = items.filter((a) => a.id !== lead?.id).sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 3);
  if (!lead) return null;

  return (
    <section className="space-y-4">
      <button
        className="group relative block min-h-[360px] w-full overflow-hidden rounded-[28px] border border-amber-300/20 bg-[#101827] text-left shadow-cockpit"
        onClick={() => onOpen(lead)}
        type="button"
      >
        <SignalVisual item={lead} className="visual-layer" label={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/55 to-transparent" />
        <div className="relative flex min-h-[360px] flex-col justify-end p-7">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="signal-chip selected">Archived Lead Signal</span>
            <span className="source-chip">Score {scoreOf(lead)}</span>
            <span className="source-chip">{lead.source_count || 1} sources</span>
          </div>
          <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-5xl">{lead.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{lead.summary}</p>
        </div>
      </button>
      <div className="grid gap-4 md:grid-cols-3">
        {support.map((item) => (
          <button
            key={item.id}
            className="relative min-h-[190px] overflow-hidden rounded-[22px] border border-white/10 bg-[#101827] p-4 text-left transition hover:border-amber-300/25"
            onClick={() => onOpen(item)}
            type="button"
          >
            <SignalVisual item={item} className="visual-layer" label={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/92 via-[#070b14]/50 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100">Score {scoreOf(item)} · {item.source_count || 1} sources</div>
              <div className="mt-2 line-clamp-3 text-base font-semibold text-slate-100">{item.title}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function HistoryScreen() {
  const [from, setFrom] = useState(dateAddDays(TODAY, -6));
  const [to, setTo] = useState(TODAY);
  const [runs, setRuns] = useState([]);
  const [loading, setLoad] = useState(true);
  const [err, setErr] = useState('');
  const [openRun, setOpenRun] = useState(null);
  const [runItems, setRunItems] = useState([]);
  const [runLoading, setRunLoading] = useState(false);
  const [openArticle, setOpenArticle] = useState(null);
  const [runMetrics, setRunMetrics] = useState({});
  const [expandedDays, setExpandedDays] = useState({});

  const refresh = () => {
    setLoad(true);
    setErr('');
    setExpandedDays({});
    getHistoryList()
      .then(async (list) => {
        const archiveRuns = (Array.isArray(list) ? list : [])
          .filter((file) => String(file.filename || '').endsWith('.json'))
          .map(parseRun)
          .filter((run) => run.date >= from && run.date <= to)
          .sort((a, b) => b.timestamp - a.timestamp);
        setRuns(archiveRuns);
        const summaries = await Promise.all(archiveRuns.map(async (run) => {
          try {
            const data = await getHistoryFile(run.filename);
            const items = normalizeList(data?.results || data?.articles || data || []);
            return [run.filename, runSummary(items)];
          } catch {
            return [run.filename, null];
          }
        }));
        setRunMetrics(Object.fromEntries(summaries));
      })
      .catch((e) => setErr(e.message || String(e)))
      .finally(() => setLoad(false));
  };

  useEffect(refresh, [from, to]);

  const openBriefing = async (run) => {
    setOpenRun(run);
    setRunItems([]);
    setRunLoading(true);
    try {
      const data = await getHistoryFile(run.filename);
      setRunItems(normalizeList(data?.results || data?.articles || data || []));
    } finally {
      setRunLoading(false);
    }
  };

  const onCorrectRegion = async (item, correction) => {
    const result = await correctRegion(item, correction.region, correction.keywords, correction.reason);
    const patch = { region: result.region, region_basis: 'User corrected' };
    setRunItems((arr) => arr.map((article) => (article.title === item.title ? { ...article, ...patch } : article)));
    setOpenArticle((article) => (article?.title === item.title ? { ...article, ...patch } : article));
    return result;
  };

  const runGroups = useMemo(() => groupRuns(runs), [runs]);
  useEffect(() => {
    const mostRecentDay = Object.keys(runGroups)[0];
    if (mostRecentDay) {
      setExpandedDays((current) => (Object.keys(current).length ? current : { [mostRecentDay]: true }));
    }
  }, [runGroups]);
  const archiveTotals = useMemo(() => Object.values(runMetrics).filter(Boolean).reduce((totals, summary) => ({
    articles: totals.articles + summary.articles,
    high: totals.high + summary.high,
  }), { articles: 0, high: 0 }), [runMetrics]);
  const totalArticles = runItems.length;
  const highSignals = runItems.filter((a) => scoreOf(a) >= 80).length;
  const articleGroups = useMemo(() => groupedByDate(runItems), [runItems]);
  const keywords = topKeywords(runItems);

  if (openRun) {
    return (
      <div className="workflow-page archive-page space-y-6">
        <section className="workflow-console archive-snapshot-console">
          <button className="btn-dark-secondary mb-5" onClick={() => setOpenRun(null)} type="button">
            <Icon name="chevL" /> Back to Archive
          </button>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="eyebrow archive-accent">Archived Briefing</div>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">{openRun.label}</h1>
              <p className="mt-3 text-slate-400">Historical snapshot · {totalArticles} articles · {highSignals} high-signal items</p>
            </div>
            <div className="flex flex-wrap gap-2">{keywords.map((k) => <span className="signal-chip selected" key={k}>{k}</span>)}</div>
          </div>
        </section>

        {runLoading ? (
          <div className="rounded-[24px] border border-white/10 bg-[#101827]/80 p-10 text-center">
            <h2 className="text-xl font-semibold text-white">Opening archived briefing</h2>
          </div>
        ) : (
          <>
            <ArchiveMosaic items={runItems} onOpen={setOpenArticle} />
            <section className="space-y-8">
              {Object.entries(articleGroups).map(([day, items]) => (
                <div key={day} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-white">{day}</h2>
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-sm text-slate-500">{items.length} archived signals</span>
                  </div>
                  <div className="article-grid grid gap-8 2xl:grid-cols-2">
                    {items.map((item) => (
                      <ArticleCard key={item.id} item={item} variant={cardVariant(item)} onOpen={setOpenArticle} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
        <ArticleModal item={openArticle} onClose={() => setOpenArticle(null)} onCorrectRegion={onCorrectRegion} />
      </div>
    );
  }

  return (
    <div className="workflow-page archive-page space-y-6">
      <section className="workflow-console archive-console">
        <div className="archive-console-copy">
          <div>
            <div className="eyebrow">Briefing Archive / Run History</div>
            <h1>Browse past briefings.</h1>
            <p>Retrieve briefing snapshots by date and open individual scheduler or retained manual runs when available.</p>
          </div>
        </div>
        <aside className="archive-fetch-panel">
          <div className="workflow-status-head"><span className="workflow-beacon archive" /> Archive Range</div>
          <DateRangePicker
            from={from}
            to={to}
            label="Date Range"
            onChange={({ from: nextFrom, to: nextTo }) => {
              setFrom(nextFrom);
              setTo(nextTo);
            }}
          />
          <button className="btn-dark-primary h-11 justify-center" onClick={refresh} type="button"><Icon name="refresh" /> Fetch Briefings</button>
        </aside>
      </section>

      <section className="workflow-metric-row archive">
        <div className="workflow-metric"><Icon name="calendar" /><span>Dates loaded</span><strong>{Object.keys(runGroups).length}</strong></div>
        <div className="workflow-metric"><Icon name="history" /><span>Briefing runs</span><strong>{runs.length}</strong></div>
        <div className="workflow-metric"><Icon name="layers" /><span>Total signals</span><strong>{archiveTotals.articles}</strong></div>
        <div className="workflow-metric"><Icon name="trend" /><span>High signal</span><strong>{archiveTotals.high}</strong></div>
      </section>

      {loading ? (
        <div className="workflow-empty archive"><Icon name="refresh" size={25} /><h2>Loading archive</h2></div>
      ) : err ? (
        <div className="rounded-[24px] border border-red-300/20 bg-red-950/20 p-10 text-center"><h2 className="text-xl font-semibold text-white">Failed to load archive</h2><p className="mt-2 text-red-200">{err}</p></div>
      ) : runs.length === 0 ? (
        <div className="workflow-empty archive">
          <Icon name="archive" size={27} />
          <h2 className="text-xl font-semibold text-white">No scheduler briefings found for this date range.</h2>
          <p className="mt-2 text-slate-400">Try expanding the range.</p>
        </div>
      ) : (
        <section className="space-y-8">
          {Object.entries(runGroups).map(([day, group]) => (
            <div key={day} className="archive-day">
              <button
                className="archive-day-toggle"
                onClick={() => setExpandedDays((current) => ({ ...current, [day]: !current[day] }))}
                type="button"
              >
                <span>
                  <span className="block text-xl font-semibold text-white">{day}</span>
                  <span className="mt-1 block text-sm text-slate-400">{group.length} briefing run{group.length === 1 ? '' : 's'} available</span>
                </span>
                <Icon name={expandedDays[day] ? 'chevD' : 'chevR'} size={18} />
              </button>
              {expandedDays[day] && (
                <div className="archive-run-grid">
                  {group.map((run) => {
                    const summary = runMetrics[run.filename];
                    return (
                      <button
                        key={run.filename}
                        className="archive-run-card"
                        onClick={() => openBriefing(run)}
                        type="button"
                      >
                        <div className="archive-run-identity">
                          <div className="text-xl font-semibold text-white">{run.time} Briefing</div>
                          <span className="signal-chip">{run.type === 'scheduler' ? 'Scheduler' : 'Manual'}</span>
                        </div>
                        {summary && (
                          <>
                            <div className="archive-run-metrics">
                              <div><div className="archive-stat-value">{summary.articles}</div><div className="archive-stat-label">Signals</div></div>
                              <div><div className="archive-stat-value">{summary.clusters}</div><div className="archive-stat-label">Clusters</div></div>
                              <div><div className="archive-stat-value">{summary.high}</div><div className="archive-stat-label">High Signal</div></div>
                            </div>
                            {summary.keywords.length > 0 && (
                              <div className="archive-run-keywords">{summary.keywords.map((keyword) => <span className="source-chip" key={keyword}>{keyword}</span>)}</div>
                            )}
                          </>
                        )}
                        <div className="archive-open-action">
                          Open Briefing <Icon name="chevR" size={14} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
