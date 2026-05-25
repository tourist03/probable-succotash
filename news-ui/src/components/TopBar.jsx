import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { getAnalyticsAccess, getStatus } from '../api.js';

const mainNav = [
  { to: '/scan', label: 'Deep Scan' },
  { to: '/selected', label: 'Review Queue' },
  { to: '/approved', label: 'Approved Briefing' },
];

const baseSettingsNav = [
  { to: '/home', label: 'Intelligence Briefing' },
  { to: '/history', label: 'Briefing Archive' },
  { to: '/rejected', label: 'Hidden Signals' },
  { to: '/sources', label: 'Source Control' },
  { to: '/scheduler', label: 'System Status' },
  { to: '/trends', label: 'Profile Settings' },
  { to: '/voc', label: 'Voice of Customer' },
];

function isLocalDevHost() {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

export default function TopBar({ manualScan }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(localStorage.getItem('news-profile') || 'default');
  const [schedulerActive, setSchedulerActive] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(isLocalDevHost());

  useEffect(() => {
    const onProfile = () => setProfile(localStorage.getItem('news-profile') || 'default');
    window.addEventListener('news-profile-change', onProfile);
    window.addEventListener('storage', onProfile);
    return () => {
      window.removeEventListener('news-profile-change', onProfile);
      window.removeEventListener('storage', onProfile);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refreshStatus = async () => {
      try {
        const status = await getStatus();
        if (!cancelled) setSchedulerActive(Boolean(status?.is_active));
      } catch {
        if (!cancelled) setSchedulerActive(false);
      }
    };

    refreshStatus();
    const timer = window.setInterval(refreshStatus, 10_000);
    window.addEventListener('focus', refreshStatus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshStatus);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getAnalyticsAccess()
      .then((result) => {
        if (!cancelled) setAnalyticsAllowed(Boolean(result?.allowed) || isLocalDevHost());
      })
      .catch(() => {
        if (!cancelled) setAnalyticsAllowed(isLocalDevHost());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isBroadcast = profile === 'broadcast';
  const settingsNav = analyticsAllowed
    ? [...baseSettingsNav, { to: '/director-analytics', label: 'Analytics' }]
    : baseSettingsNav;

  return (
    <header className={`design-header ${isBroadcast ? 'is-broadcast' : 'is-default'} fixed left-0 top-0 z-40 w-[1920px]`}>
      <div className="command-header-inner flex h-[82px] items-center gap-8 px-12">
        <div className="brand-status header-brand group relative">
          <button
            className="flex items-center gap-4 text-left"
            onClick={() => navigate('/home')}
            aria-describedby={schedulerActive ? 'scheduler-live-tooltip' : undefined}
            type="button"
          >
            <span className={[
              'app-logo flex h-12 w-12 items-center justify-center rounded-2xl border shadow-glow',
              isBroadcast
                ? 'border-amber-300/25 bg-amber-400/10 text-amber-200'
                : 'border-sky-300/25 bg-sky-400/10 text-sky-200',
              schedulerActive ? (isBroadcast ? 'scheduler-glow is-broadcast' : 'scheduler-glow') : '',
            ].join(' ')}
            >
              <span className="sense-lens-mark" aria-hidden="true">
                <span className="sense-lens-ring" />
                <span className="sense-lens-core" />
                <span className="sense-lens-ray" />
              </span>
            </span>
            <span>
              <span className="block text-lg font-semibold text-white">
                NewsScrapper
              </span>
              <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-slate-400">
                Sense.AI / Signal Desk
                {schedulerActive && <span className="scheduler-live-dot" aria-hidden="true" />}
              </span>
            </span>
          </button>
          {schedulerActive && (
            <div id="scheduler-live-tooltip" className="scheduler-tooltip" role="status">
              <span className="scheduler-live-dot" aria-hidden="true" />
              <span>
                <strong>Scheduler scan active</strong>
                <small>Fresh briefing data is being prepared.</small>
              </span>
            </div>
          )}
        </div>

        {manualScan?.running && (
          <button className="manual-scan-live" onClick={() => navigate('/scan')} type="button">
            <span className="scheduler-live-dot" aria-hidden="true" />
            <span>
              <strong>Deep Scan running</strong>
              <small>Results continue in this session</small>
            </span>
          </button>
        )}

        <nav className="command-nav ml-auto flex items-center gap-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'rounded-xl px-6 py-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-sky-400/12 text-sky-100 ring-1 ring-sky-300/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions flex items-center gap-3">
          <span className={isBroadcast
            ? 'inline-flex rounded-full border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-100'
            : 'inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-xs font-semibold text-sky-100'}
          >
            {isBroadcast ? 'Broadcast Intelligence' : 'Default Intelligence'}
          </span>
          <div className="relative">
            <button
              className="command-settings-trigger flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-sky-300/30 hover:text-white"
              onClick={() => setOpen((v) => !v)}
              title="Settings"
              type="button"
            >
              <Icon name="settings" />
            </button>
            {open && (
              <div className="command-settings-menu absolute right-0 mt-4 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#101827] p-3 shadow-cockpit">
                {settingsNav.map((item) => (
                  <button
                    key={item.to}
                    className="command-settings-item flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                    onClick={() => {
                      setOpen(false);
                      navigate(item.to);
                    }}
                    type="button"
                  >
                    {item.label}
                    <Icon name="chevR" size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
