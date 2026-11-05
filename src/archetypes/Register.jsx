import { useMemo, useState } from 'react';
import { Search, Copy, Check } from 'lucide-react';
import { Section, Insight, Segmented, Slider, Pill, Callout } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { src } from '../content/sources.js';

const statuses = ['Adopt', 'Hold', 'Watch', 'Decide', 'Retiring'];
const tone = { Adopt: 'good', Hold: 'neutral', Watch: 'gold', Decide: 'navy', Retiring: 'bad' };
const DAY = 86400000;
const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Components with a status and a review cadence; move the date forward to see what falls due. */
export default function Register({ data }) {
  const { register, cadence, statusInfo } = data;
  const [status, setStatus] = useState('All');
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [weeks, setWeeks] = useState(0);
  const [dueOnly, setDueOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const asOf = new Date(today.getTime() + weeks * 7 * DAY);
  const cats = ['All', ...Array.from(new Set(register.map((r) => r.cat)))];

  const rows = register
    .map((r) => {
      const verified = new Date(`${r.verified}T00:00:00`);
      const next = new Date(verified.getTime() + cadence[r.status] * DAY);
      return { ...r, verifiedDate: verified, next, due: next <= asOf };
    })
    .filter((r) => (status === 'All' || r.status === status) && (cat === 'All' || r.cat === cat))
    .filter((r) => !q.trim() || `${r.name} ${r.note} ${r.version}`.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((r) => !dueOnly || r.due)
    .sort((a, b) => a.next - b.next);

  const counts = Object.fromEntries(statuses.map((s) => [s, register.filter((r) => r.status === s).length]));
  const dueCount = register.filter((r) => new Date(new Date(`${r.verified}T00:00:00`).getTime() + cadence[r.status] * DAY) <= asOf).length;

  const copyCsv = async () => {
    const lines = ['name,category,status,version,verified,next_review,note'];
    rows.forEach((r) => lines.push([r.name, r.cat, r.status, r.version, r.verified, r.next.toISOString().slice(0, 10), r.note].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')));
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <PageShell
      header={data.header}
      sources={data.sources}
      verified={data.verified}
      extraMeta={[
        { dt: 'Entries', dd: String(register.length) },
        { dt: 'Due by date', dd: String(dueCount) },
      ]}
    >
      <Section n={1} title="The register" intro={data.intro ?? 'Click a status tile to filter. Updating an entry is a one-line pull request to the data file.'}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus((x) => (x === s ? 'All' : s))}
              className={`border p-3 text-left transition-colors ${status === s ? 'border-navy bg-navy-soft' : 'border-rule bg-surface hover:border-subtle'}`}
            >
              <Pill tone={tone[s]}>{s}</Pill>
              <p className="tabular mt-2 font-mono text-[24px] leading-none text-ink">{counts[s]}</p>
              <p className="mt-1.5 text-[11.5px] leading-[1.35] text-subtle">{statusInfo[s]}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <label htmlFor="reg-q" className="label mb-1.5 block">
              Search
            </label>
            <div className="flex items-center gap-2 border border-rule bg-surface px-2">
              <Search size={15} className="text-subtle" />
              <input id="reg-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try ‘azurerm’ or ‘policy’" className="w-full bg-transparent py-1.5 text-[14px] text-ink outline-none" />
            </div>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <Segmented size="sm" label="Category" value={cat} onChange={setCat} options={cats.map((c) => ({ value: c, label: c }))} />
          </div>
          <Slider id="reg-weeks" label="Review as of" min={0} max={26} value={weeks} onChange={setWeeks} format={(v) => (v === 0 ? `Today · ${fmtDate(asOf)}` : `+${v} wk · ${fmtDate(asOf)}`)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={dueOnly}
            onClick={() => setDueOnly((v) => !v)}
            className={`border px-3 py-1.5 text-[13px] ${dueOnly ? 'border-gold bg-gold-soft text-ink' : 'border-rule text-muted hover:border-subtle'}`}
          >
            Due for review only · {dueCount}
          </button>
          <button type="button" onClick={copyCsv} className="inline-flex items-center gap-1.5 border border-rule px-3 py-1.5 text-[13px] text-muted hover:border-subtle hover:text-ink">
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : `Copy ${rows.length} rows as CSV`}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto border-y border-rule">
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule">
                {['Component', 'Status', 'Version', 'Verified', 'Next review', 'Note'].map((h) => (
                  <th key={h} className="label px-3 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className={`border-b border-faint align-top last:border-b-0 ${r.due ? 'bg-gold-soft' : ''}`}>
                  <td className="px-3 py-2.5">
                    <a href={src[r.src]?.url} target="_blank" rel="noreferrer" className="text-ink underline decoration-rule underline-offset-4 hover:decoration-navy">
                      {r.name}
                    </a>
                    <p className="text-[12px] text-subtle">{r.cat}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill tone={tone[r.status]}>{r.status}</Pill>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12.5px] text-muted">{r.version}</td>
                  <td className="tabular px-3 py-2.5 font-mono text-[12.5px] text-muted">{r.verified}</td>
                  <td className={`tabular px-3 py-2.5 font-mono text-[12.5px] ${r.due ? 'text-ink' : 'text-muted'}`}>
                    {r.next.toISOString().slice(0, 10)}
                    {r.due && <span className="ml-2"><Pill tone="gold">Due</Pill></span>}
                  </td>
                  <td className="px-3 py-2.5 text-[13.5px] leading-[1.5] text-ink">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="mt-4 text-[14px] text-muted">Nothing matches. Clear a filter.</p>}
        <div className="mt-4">
          <Insight stateKey={`${weeks}-${dueCount}`} tone={dueCount ? 'gold' : 'navy'}>
            <p>
              {dueCount
                ? `${dueCount} ${dueCount === 1 ? 'entry falls' : 'entries fall'} due by ${fmtDate(asOf)}. Watch and Decide items come round monthly, Hold quarterly, Adopt twice a year.`
                : 'Nothing is due yet. Move the date forward: Watch and Decide items come round first, monthly.'}
            </p>
          </Insight>
        </div>
      </Section>

      <Section n={2} title="How to keep it current" wide={false}>
        <ol className="space-y-3 text-[15px] leading-[1.6] text-ink">
          {[
            'Filter for “Due for review”. Each row links to the page that decides it.',
            'Check the source. If nothing changed, update the verified date; if it changed, update status, version and note too.',
            'Open one pull request for the review, so the history of every decision lives in Git.',
            'Update the “Last verified” date at the top of any page whose facts you rechecked.',
          ].map((s, i) => (
            <li key={s} className="flex gap-4">
              <span className="tabular w-6 shrink-0 font-mono text-[12px] leading-[1.9] text-navy">{String(i + 1).padStart(2, '0')}</span>
              {s}
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <Callout title="GA-only by default">
            Anything in preview, experimental or without a support statement sits on Hold, however useful it looks. It moves to
            Adopt when it’s generally available and supported.
          </Callout>
        </div>
      </Section>

    </PageShell>
  );
}
