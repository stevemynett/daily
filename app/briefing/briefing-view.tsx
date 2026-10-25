'use client';

import { useEffect, useRef, useState } from 'react';
import type { Briefing, Feedback, Vote } from './data';

type SaveState = 'idle' | 'saving' | 'saved' | 'offline';

const up = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7a2 2 0 0 1-1.9 1.4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9z" />
  </svg>
);

const down = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-7A2 2 0 0 1 6.5 3H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9z" />
  </svg>
);

function VoteButtons({ current, onVote }: { current?: 1 | -1; onVote: (v: 1 | -1) => void }) {
  return (
    <span className="vote">
      <button type="button" data-v="1" aria-pressed={current === 1} title="More like this" onClick={() => onVote(1)}>
        {up}
      </button>
      <button type="button" data-v="-1" aria-pressed={current === -1} title="Less like this" onClick={() => onVote(-1)}>
        {down}
      </button>
    </span>
  );
}

// Votes save to ~/briefings/feedback/<stamp>.json through the runner, which the
// next `briefing` run reads. localStorage keeps them if the runner is off.
export default function BriefingView({ briefing }: { briefing: Briefing }) {
  const key = `briefing-feedback:${briefing.stamp}`;
  const [votes, setVotes] = useState<Record<string, Vote>>(() =>
    Object.fromEntries((briefing.feedback?.votes ?? []).map((v) => [v.id, v])),
  );
  const [notes, setNotes] = useState(briefing.feedback?.notes ?? '');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function save(nextVotes: Record<string, Vote>, nextNotes: string) {
    const data: Feedback = { briefing: briefing.stamp, votes: Object.values(nextVotes), notes: nextNotes };
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
    setSaveState('saving');
    const res = await fetch('/api/briefing/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => null);
    setSaveState(res?.ok ? 'saved' : 'offline');
  }

  // Votes made while the runner was off live in localStorage; push them now
  useEffect(() => {
    let stored: Feedback | null = null;
    try {
      stored = JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {}
    if (!stored) return;
    const restored = Object.fromEntries(stored.votes.map((v) => [v.id, v]));
    setVotes(restored);
    setNotes(stored.notes);
    save(restored, stored.notes);
  }, []);

  function vote(data: Omit<Vote, 'vote'>, v: 1 | -1) {
    const next = { ...votes };
    if (next[data.id]?.vote === v) delete next[data.id];
    else next[data.id] = { ...data, vote: v };
    setVotes(next);
    save(next, notes);
  }

  function editNotes(value: string) {
    setNotes(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(votes, value), 600);
  }

  const count = Object.keys(votes).length;
  const sections = briefing.sections.filter((s) => s.items.length > 0 || s.note);

  return (
    <>
      {briefing.title && <p className="muted briefing-subtitle">{briefing.title.replace(/^Briefing for /, '')}</p>}

      <nav className="filter-bar" aria-label="Sections">
        {sections.map((s, i) => (
          <a key={s.heading} className="tag" href={`#s${i}`}>
            {s.heading}
          </a>
        ))}
      </nav>

      {sections.map((section, i) => {
        const sectionId = `section:${section.heading}`;
        return (
          <section key={section.heading} id={`s${i}`} className="listing-section">
            <h2 className="briefing-heading">
              {section.heading}
              <VoteButtons
                current={votes[sectionId]?.vote}
                onVote={(v) => vote({ id: sectionId, kind: 'section', section: section.heading }, v)}
              />
            </h2>
            {section.items.length === 0 ? (
              <p className="muted">{section.note}</p>
            ) : (
              <ul className="event-list">
                {section.items.map((item) => (
                  <li key={item.url}>
                    <span>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="event-name">
                        {item.headline}
                      </a>
                      <VoteButtons
                        current={votes[item.url]?.vote}
                        onVote={(v) =>
                          vote(
                            {
                              id: item.url,
                              kind: 'item',
                              section: section.heading,
                              headline: item.headline,
                              meta: item.meta,
                              url: item.url,
                            },
                            v,
                          )
                        }
                      />
                    </span>
                    <span className="event-when">{item.meta}</span>
                    <span>{item.summary}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <section className="listing-section">
        <h2>Notes for the next briefing</h2>
        <textarea
          className="notes-input"
          value={notes}
          placeholder="What to add, drop or change"
          onChange={(e) => editNotes(e.target.value)}
        />
      </section>

      {briefing.footer && <p className="caption">{briefing.footer}</p>}

      <div className="feedback-bar" data-state={saveState}>
        <span>{count === 1 ? '1 vote' : `${count} votes`}</span>
        <span>
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Saved for the next briefing'
              : saveState === 'offline'
                ? 'Runner is off, kept in this browser. Start it with `make runner`.'
                : ''}
        </span>
      </div>
    </>
  );
}
