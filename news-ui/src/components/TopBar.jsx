import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { getAnalyticsAccess } from '../api.js';

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
    <header className={`design-header ${isBroadcast ? 'is-broadcast' : 'is-default'} fixed inset-x-0 top-0 z-40 w-full`}>
      <div className="command-header-inner flex items-center">
        <div className="header-identity flex items-center">
          <button
            className="news-wordmark"
            onClick={() => navigate('/home')}
            type="button"
          >
            <span className="news-word">News</span>
            <span className="scrapper-word">Scrapper</span>
          </button>
          <span className="profile-badge">
            {isBroadcast ? 'Broadcast Intelligence' : 'Default Intelligence'}
          </span>
        </div>

        <nav className="command-nav ml-auto flex items-center gap-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'command-nav-link',
                  isActive ? 'active' : '',
                ].join(' ')
              }
            >
              {item.label}
              {item.to === '/scan' && manualScan?.running && (
                <span className="deep-scan-dot" aria-label="Deep Scan running" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <div className="relative">
            <button
              className="command-settings-trigger"
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
                <div className="settings-language-divider" aria-hidden="true" />
                <button
                  aria-label="English to Korean translation, coming soon in beta"
                  className="settings-language-preview"
                  title="Korean interface translation is coming soon"
                  type="button"
                >
                  <span className="settings-language-orbit" aria-hidden="true">
                    <Icon name="refresh" size={18} />
                  </span>
                  <span className="settings-language-copy">
                    <span className="settings-language-title">
                      English <span aria-hidden="true">-&gt;</span> 한국어
                    </span>
                    <span className="settings-language-note">Interface translation</span>
                  </span>
                  <span className="settings-language-beta">Beta soon</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
