import { useState } from 'react';
import { Section, Insight, Segmented, Pill } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';

/**
 * Answer a few questions; options re-rank with their reasons shown.
 * Each answer gives every option [score, reason]; an empty reason is hidden.
 */
export default function Decision({ data }) {
  const { options, questions, verdicts = {} } = data;
  const [ans, setAns] = useState(Object.fromEntries(questions.map((q) => [q.id, q.default ?? Object.keys(q.answers)[0]])));

  const scored = options
    .map((o) => {
      const parts = questions.map((q) => {
        const [score, reason] = q.answers[ans[q.id]].s[o.id] ?? [0, ''];
        return { score, reason };
      });
      return { ...o, total: parts.reduce((a, p) => a + p.score, 0), parts };
    })
    .sort((a, b) => b.total - a.total);
  const best = scored.at(0);
  const max = data.maxScore ?? questions.length * 3;

  return (
    <PageShell header={data.header} sources={data.sources} verified={data.verified} extraMeta={[{ dt: 'Options', dd: String(options.length) }, { dt: 'Questions', dd: String(questions.length) }]}>
      <Section n={1} title={data.sectionTitle ?? 'Which fits you'} intro="The scores are a teaching aid, not a formula. Read the reasons; they are what to argue about.">
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {questions.map((q) => (
            <Segmented
              key={q.id}
              label={q.q}
              value={ans[q.id]}
              onChange={(v) => setAns((a) => ({ ...a, [q.id]: v }))}
              options={Object.entries(q.answers).map(([value, a]) => ({ value, label: a.label }))}
            />
          ))}
        </div>
        <ol className="mt-8 space-y-3">
          {scored.map((o, i) => (
            <li key={o.id} className={`border ${i === 0 ? 'border-navy' : 'border-rule'} bg-surface p-4`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="tabular font-mono text-[12px] text-navy">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[16px] font-semibold text-ink">{o.name}</span>
                  {i === 0 && <Pill tone="navy">Best fit</Pill>}
                </div>
                <span className={`tabular font-mono text-[14px] ${o.total < 0 ? 'text-bad' : 'text-ink'}`}>{o.total > 0 ? `+${o.total}` : o.total}</span>
              </div>
              <div className="mt-2 h-[6px] w-full bg-faint">
                <div
                  className={`h-full transition-all duration-500 ${o.total < 0 ? 'bg-bad' : i === 0 ? 'bg-navy' : 'bg-subtle'}`}
                  style={{ width: `${Math.max(2, (Math.max(0, o.total) / max) * 100)}%` }}
                />
              </div>
              {o.blurb && <p className="mt-2 text-[14px] leading-[1.55] text-muted">{o.blurb}</p>}
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {o.parts
                  .filter((p) => p.reason)
                  .map((p) => (
                    <li key={p.reason} className={`text-[12.5px] ${p.score > 0 ? 'text-good' : p.score < 0 ? 'text-bad' : 'text-subtle'}`}>
                      {p.score > 0 ? '+' : p.score < 0 ? '−' : '·'} {p.reason}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ol>
        {verdicts[best.id] && (
          <div className="mt-4">
            <Insight stateKey={JSON.stringify(ans)}>
              <p>{verdicts[best.id]}</p>
            </Insight>
          </div>
        )}
      </Section>
    </PageShell>
  );
}
