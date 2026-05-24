import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { trackAction } from '../utils/tracking.js';

const FEEDBACK_KEY = 'news-voc-submitted';
const ACTION_KEY = 'news-voc-action-count';
const STARTED_KEY = 'news-voc-started-at';
const FEEDBACK_EVENT = 'news-voc-completed';
const ACTION_THRESHOLD = 60;
const TIME_THRESHOLD_MS = 60 * 60 * 1000;

function feedbackWasSubmitted() {
  return localStorage.getItem(FEEDBACK_KEY) === 'true' || sessionStorage.getItem(FEEDBACK_KEY) === 'true';
}

export function FeedbackForm({ mandatory = false, onComplete }) {
  const [rating, setRating] = useState('');
  const [focus, setFocus] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!rating || !message.trim()) {
      setError('Rating and feedback are required.');
      return;
    }
    const detail = JSON.stringify({ rating, focus, message: message.trim(), mandatory });
    localStorage.setItem(FEEDBACK_KEY, 'true');
    sessionStorage.setItem(FEEDBACK_KEY, 'true');
    window.dispatchEvent(new Event(FEEDBACK_EVENT));
    trackAction('voc_feedback', detail);
    onComplete?.();
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="field-label">Experience rating</div>
        <div className="mt-3 flex gap-2">
          {['1', '2', '3', '4', '5'].map((value) => (
            <button
              className={rating === value ? 'rating-button active' : 'rating-button'}
              key={value}
              onClick={() => { setRating(value); setError(''); }}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="field-label">What should improve most?</span>
        <select className="dark-input mt-3" value={focus} onChange={(event) => setFocus(event.target.value)}>
          <option value="">Select an area</option>
          <option value="briefing">Intelligence Briefing</option>
          <option value="search">Deep Scan</option>
          <option value="workflow">Review and Approval Workflow</option>
          <option value="archive">Briefing Archive</option>
          <option value="sources">Source Control</option>
        </select>
      </label>
      <label className="block">
        <span className="field-label">Voice of customer</span>
        <textarea
          className="dark-textarea mt-3"
          value={message}
          onChange={(event) => { setMessage(event.target.value); setError(''); }}
          placeholder="What would make this intelligence experience genuinely better?"
        />
      </label>
      {error && <div className="text-sm font-medium text-rose-300">{error}</div>}
      <button className="btn-dark-primary w-full justify-center" onClick={submit} type="button">
        <Icon name="check" size={15} /> Submit Feedback
      </button>
    </div>
  );
}

export default function VocFeedback() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(feedbackWasSubmitted);

  useEffect(() => {
    if (submitted || feedbackWasSubmitted()) return undefined;

    let actions = Number(sessionStorage.getItem(ACTION_KEY) || 0);
    const startedAt = Number(sessionStorage.getItem(STARTED_KEY) || Date.now());
    sessionStorage.setItem(STARTED_KEY, String(startedAt));
    const registerClick = (event) => {
      if (event.target.closest('[data-voc-panel]')) return;
      if (!event.target.closest('button, a, article')) return;
      actions += 1;
      sessionStorage.setItem(ACTION_KEY, String(actions));
      if (actions >= ACTION_THRESHOLD) setOpen(true);
    };
    const completeFeedback = () => {
      setSubmitted(true);
      setOpen(false);
    };
    const remaining = Math.max(0, TIME_THRESHOLD_MS - (Date.now() - startedAt));
    const timer = window.setTimeout(() => setOpen(true), remaining);
    document.addEventListener('click', registerClick, true);
    window.addEventListener(FEEDBACK_EVENT, completeFeedback);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('click', registerClick, true);
      window.removeEventListener(FEEDBACK_EVENT, completeFeedback);
    };
  }, [submitted]);

  if (!open) return null;

  return (
    <div className="modal-overlay voc-overlay">
      <section className="voc-modal" data-voc-panel>
        <div className="voc-head">
          <div>
            <div className="eyebrow">Voice Of Customer</div>
            <h2>Help shape the intelligence briefing.</h2>
            <p>Your session has reached a feedback checkpoint. Submit a quick review to continue.</p>
          </div>
          <div className="voc-required">Required</div>
        </div>
        <FeedbackForm mandatory onComplete={() => {
          setSubmitted(true);
          setOpen(false);
        }} />
      </section>
    </div>
  );
}
