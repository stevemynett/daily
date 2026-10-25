'use client';

import { useEffect, useState } from 'react';
import type { Job, List, MissedJob, Report, SavedJob, Tracked } from './data';

type SaveState = 'idle' | 'saving' | 'saved' | 'offline';
type Row = SavedJob & { date: string; reason?: string };

const REPORT_LABELS = { yes: 'manages people', no: 'no reports', unclear: 'reports unclear' };
const CATEGORIES = ['Incident/security manager', 'Incident', 'Director', 'Manager'];
const LISTS: Record<List, { label: string; summary: string; empty: string }> = {
  saved: {
    label: 'Saved',
    summary: 'Jobs saved from any report, plus postings the search missed, newest first. A saved posting can close later.',
    empty: 'Nothing saved yet. Use the Save button on any row.',
  },
  applied: {
    label: 'Applied',
    summary: "Saved jobs you've applied for, newest first.",
    empty: 'Nothing here yet. Use the Applied button on a saved job.',
  },
  rejected: {
    label: 'Rejected',
    summary: 'Jobs you applied for and were turned down for, newest rejection first.',
    empty: 'Nothing here yet. Use the Rejected button on an applied job.',
  },
  nope: {
    label: 'Nope',
    summary: 'Saved jobs you passed on, newest first.',
    empty: 'Nothing here yet. Use the Nope button on a saved job.',
  },
};
const LIST_NAMES = Object.keys(LISTS) as List[];
// Changes not yet written by the runner
const PENDING = 'job-search-tracked';

const today = () => new Date().toLocaleDateString('en-CA');
const toSaved = (job: Job): SavedJob => ({
  company: job.company,
  space: job.spaces.join(', '),
  title: job.title,
  url: job.url,
  location: job.location,
  salary: job.salary,
  posted: job.posted,
  check: job.check,
  saved: today(),
});

// Section headings map onto the filter chips, same as the job-search HTML report
function category(heading: string) {
  const h = heading.toLowerCase();
  if (h.includes('security')) return 'Incident/security manager';
  if (h.includes('director')) return 'Director';
  if (h.includes('manager')) return 'Manager';
  return 'Incident';
}

// Saved, Applied, Rejected and Nope live in output/saved-jobs.json, written through the
// runner. localStorage keeps changes if the runner is off.
export default function Jobs({
  report,
  tracked: initial,
  missed,
}: {
  report: Report | null;
  tracked: Tracked;
  missed: MissedJob[];
}) {
  const tabs = report?.tabs ?? [];
  const [tabName, setTabName] = useState<string>(tabs[0]?.name ?? 'saved');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [hideCheck, setHideCheck] = useState(false);
  const [tracked, setTracked] = useState(initial);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  async function save(next: Tracked) {
    const body = JSON.stringify(next);
    setTracked(next);
    try {
      localStorage.setItem(PENDING, body);
    } catch {}
    setSaveState('saving');
    const res = await fetch('/api/jobs/saved', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }).catch(() => null);
    setSaveState(res?.ok ? 'saved' : 'offline');
    try {
      if (res?.ok && localStorage.getItem(PENDING) === body) localStorage.removeItem(PENDING);
    } catch {}
  }

  // Push changes made while the runner was off, otherwise pick up anything saved since the build
  useEffect(() => {
    let pending: Tracked | null = null;
    try {
      pending = JSON.parse(localStorage.getItem(PENDING) ?? 'null');
    } catch {}
    if (pending) {
      save(pending);
      return;
    }
    fetch('/api/jobs/saved')
      .then((res) => (res.ok ? res.json() : null))
      .then((latest: Tracked | null) => latest && setTracked(latest))
      .catch(() => {});
  }, []);

  const listOf = (url: string): List => tracked.status[url]?.status ?? 'saved';

  function mark(url: string, to: List) {
    const status = { ...tracked.status };
    const prev = status[url];
    if (to === 'saved') delete status[url];
    else if (to === 'rejected') status[url] = { status: 'rejected', date: today(), applied: prev?.date };
    else if (to === 'applied' && prev?.applied) status[url] = { status: 'applied', date: prev.applied };
    else status[url] = { status: to, date: today() };
    save({ ...tracked, status });
  }

  // Unsaving a missed job only hides it; missed.py remove deletes it for good
  function toggleSave(job: SavedJob, isMissed = false) {
    const status = { ...tracked.status };
    delete status[job.url];
    if (isMissed) return save({ ...tracked, status, unsavedMissed: { ...tracked.unsavedMissed, [job.url]: today() } });
    const saved = { ...tracked.saved };
    if (saved[job.url]) delete saved[job.url];
    else saved[job.url] = job;
    save({ ...tracked, status, saved });
  }

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text: string, check: boolean) =>
    (!hideCheck || !check) && words.every((word) => text.toLowerCase().includes(word));
  const keep = (job: Job) => matches([job.company, job.title, job.location, ...job.spaces].join(' '), job.check);

  const trackedJobs: (SavedJob & { reason?: string })[] = [
    ...Object.values(tracked.saved),
    ...missed
      .filter((m) => !tracked.unsavedMissed[m.url] && !tracked.saved[m.url])
      .map((m) => ({ ...m, check: false, saved: m.added })),
  ];
  const listRows = (list: List): Row[] =>
    trackedJobs
      .filter((job) => listOf(job.url) === list)
      .map((job) => ({ ...job, date: list === 'saved' ? job.saved : tracked.status[job.url].date }))
      .filter((job) => matches([job.company, job.space, job.title, job.location].join(' '), job.check))
      .sort((a, b) => b.date.localeCompare(a.date));
  const sections = (tab: Report['tabs'][number]) =>
    tab.sections
      .filter((section) => !cat || category(section.heading) === cat)
      .map((section) => ({ ...section, shown: section.jobs.filter(keep) }));
  const count = (tab: Report['tabs'][number]) => sections(tab).reduce((n, s) => n + s.shown.length, 0);
  const list = LIST_NAMES.find((l) => l === tabName);
  const tab = list ? undefined : (tabs.find((t) => t.name === tabName) ?? tabs[0]);
  const rows = list ? listRows(list) : [];

  return (
    <div className="wide">
      <div className="job-tabs" role="tablist" aria-label="Report tabs">
        {tabs.map((t) => (
          <button
            key={t.name}
            type="button"
            role="tab"
            className="job-tab"
            aria-selected={t.name === tab?.name}
            onClick={() => setTabName(t.name)}
          >
            {t.name}
            <span className="job-tab-count">{count(t)}</span>
          </button>
        ))}
        {LIST_NAMES.map((l) => (
          <button key={l} type="button" role="tab" className="job-tab" aria-selected={l === list} onClick={() => setTabName(l)}>
            {LISTS[l].label}
            <span className="job-tab-count">{listRows(l).length}</span>
          </button>
        ))}
      </div>

      <div className="job-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Filter by company, space, title, or location (e.g. fintech remote)"
          aria-label="Filter jobs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!list && (
          <>
            <button type="button" className="tag" aria-pressed={cat === null} onClick={() => setCat(null)}>
              All
            </button>
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className="tag" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>
                {c}
              </button>
            ))}
          </>
        )}
        <button type="button" className="tag" aria-pressed={hideCheck} onClick={() => setHideCheck(!hideCheck)}>
          Hide CHECK
        </button>
        <span className="job-bar-count">{tab ? count(tab) : rows.length} shown</span>
      </div>

      {saveState === 'offline' && (
        <p className="job-offline">Runner is off, changes are kept in this browser. Start it with `make runner`.</p>
      )}

      {list && (
        <>
          <p className="muted job-summary">{LISTS[list].summary}</p>
          {rows.length === 0 ? (
            <p className="muted">{trackedJobs.some((j) => listOf(j.url) === list) ? 'No roles match.' : LISTS[list].empty}</p>
          ) : (
            <table className="job-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Space</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Salary</th>
                  <th>Posted</th>
                  <th>{LISTS[list].label}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((job) => (
                  <tr key={job.url}>
                    <td className="job-co">{job.company}</td>
                    <td className="job-space">{job.space}</td>
                    <td>
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        {job.title}
                      </a>
                      {job.check && (
                        <span className="badge" data-check title="Confirm you can apply from BC">
                          CHECK location
                        </span>
                      )}
                      {job.reason && <div className="job-note">Missed by the search. {job.reason}</div>}
                    </td>
                    <td className="job-loc" title={job.location}>
                      {job.location}
                    </td>
                    <td className="job-pay">{job.salary || <span className="muted">not listed</span>}</td>
                    <td className="job-date">{job.posted}</td>
                    <td className="job-date">{job.date}</td>
                    <td className="job-act">
                      {list === 'saved' && (
                        <>
                          <button type="button" className="tag" data-mark="applied" onClick={() => mark(job.url, 'applied')}>
                            Applied
                          </button>
                          <button type="button" className="tag" data-mark="nope" onClick={() => mark(job.url, 'nope')}>
                            Nope
                          </button>
                          <button type="button" className="tag" aria-pressed onClick={() => toggleSave(job, !!job.reason)}>
                            Saved
                          </button>
                        </>
                      )}
                      {list === 'applied' && (
                        <>
                          <button type="button" className="tag" data-mark="rejected" onClick={() => mark(job.url, 'rejected')}>
                            Rejected
                          </button>
                          <button type="button" className="tag" onClick={() => mark(job.url, 'saved')}>
                            Back to saved
                          </button>
                        </>
                      )}
                      {list === 'rejected' && (
                        <button type="button" className="tag" onClick={() => mark(job.url, 'applied')}>
                          Back to applied
                        </button>
                      )}
                      {list === 'nope' && (
                        <button type="button" className="tag" onClick={() => mark(job.url, 'saved')}>
                          Back to saved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab?.summary && <p className="muted job-summary">{tab.summary}</p>}

      {!list && !tab && report && <p className="muted">The report has no roles.</p>}

      {tab && sections(tab).map((section) => (
        <section key={section.heading}>
          <h2 className="job-heading">
            {section.heading} <span className="job-heading-count">{section.shown.length}</span>
          </h2>
          {section.shown.length === 0 ? (
            <p className="muted">{section.jobs.length ? 'No roles match.' : 'None found.'}</p>
          ) : (
            <table className="job-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Space</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Salary</th>
                  <th>Posted</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {section.shown.map((job) => (
                  <tr key={job.url + job.title}>
                    <td className="job-co">{job.company}</td>
                    <td className="job-space">{job.spaces.join(', ')}</td>
                    <td>
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        {job.title}
                      </a>
                      {job.check && (
                        <span className="badge" data-check title="Confirm you can apply from BC">
                          CHECK location
                        </span>
                      )}
                      {job.postings > 1 && <span className="job-via">{job.postings} postings</span>}
                      {job.source && <span className="job-via">from {job.source}</span>}
                      {job.reports && (
                        <span className="badge" data-reports={job.reports}>
                          {REPORT_LABELS[job.reports]}
                        </span>
                      )}
                      {job.note && <div className="job-note">{job.note}</div>}
                    </td>
                    <td className="job-loc" title={job.location}>
                      {job.location}
                    </td>
                    <td className="job-pay">{job.salary || <span className="muted">not listed</span>}</td>
                    <td className="job-date">{job.posted}</td>
                    <td className="job-act">
                      <button
                        type="button"
                        className="tag"
                        aria-pressed={!!tracked.saved[job.url]}
                        onClick={() => toggleSave(toSaved(job))}
                      >
                        {tracked.saved[job.url] ? LISTS[listOf(job.url)].label : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}

      {!list && report && report.companies.length > 0 && (
        <details className="job-companies">
          <summary>Companies checked ({report.companies.length})</summary>
          <table className="job-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Open jobs</th>
                <th>Matches (location OK)</th>
                <th>New</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.companies.map((company) => (
                <tr key={company.name}>
                  <td className="job-co">{company.name}</td>
                  <td className="job-date">{company.open}</td>
                  <td className="job-date">{company.matches}</td>
                  <td className="job-date">{company.fresh}</td>
                  <td className="job-space">{company.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
