import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Section, Insight, Pill, Segmented } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { pageById } from '../content/registry.js';

const CX = 210;
const CY = 210;
const R1 = 78;
const R2 = 196;

function wedge(i, n) {
  const gap = 0.012;
  const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + gap;
  const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - gap;
  const p = (r, a) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  const [x0, y0] = p(R2, a0);
  const [x1, y1] = p(R2, a1);
  const [x2, y2] = p(R1, a1);
  const [x3, y3] = p(R1, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [lx, ly] = p((R1 + R2) / 2, (a0 + a1) / 2);
  return { d: `M${x0} ${y0} A${R2} ${R2} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${R1} ${R1} 0 ${large} 0 ${x3} ${y3} Z`, lx, ly };
}

/** A wheel of 3 to 10 parts that make up a whole; select one to see what it decides. */
export default function Explorer({ data }) {
  const { items, groups = [], center = ['', ''], labels = {} } = data;
  const [sel, setSel] = useState(0);
  const [view, setView] = useState('all');
  const a = items.at(sel);

  return (
    <PageShell header={data.header} sources={data.sources} verified={data.verified} extraMeta={[{ dt: 'Parts', dd: String(items.length) }]}>
      <Section n={1} title={data.sectionTitle ?? 'The map'} intro={data.intro ?? 'Select a part to see its decisions.'}>
        {groups.length > 1 && (
          <div className="mb-4 max-w-[420px]">
            <Segmented label="Highlight" value={view} onChange={setView} options={[{ value: 'all', label: 'All' }, ...groups.map((g) => ({ value: g, label: g }))]} />
          </div>
        )}
        <div className="grid items-start gap-8 lg:grid-cols-[420px_1fr]">
          <svg viewBox="0 0 420 420" role="img" aria-label={data.header.title} className="mx-auto w-full max-w-[420px]">
            {items.map((ar, i) => {
              const w = wedge(i, items.length);
              const on = i === sel;
              const dim = view !== 'all' && ar.group !== view;
              return (
                <g
                  key={ar.name}
                  role="button"
                  tabIndex={0}
                  aria-label={ar.name}
                  aria-pressed={on}
                  onClick={() => setSel(i)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(i))}
                  style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1, transition: 'opacity .3s' }}
                >
                  <path
                    d={w.d}
                    fill={on ? 'var(--navy)' : groups.indexOf(ar.group) % 2 === 1 ? 'var(--callout)' : 'var(--surface)'}
                    stroke={on ? 'var(--navy)' : 'var(--rule)'}
                    strokeWidth="1.25"
                    style={{ transition: 'fill .25s' }}
                  />
                  <text x={w.lx} y={w.ly - 6} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={on ? 'var(--on-navy)' : 'var(--navy)'}>
                    {i + 1}
                  </text>
                  <text x={w.lx} y={w.ly + 10} textAnchor="middle" fontSize="11.5" fontWeight="500" fill={on ? 'var(--on-navy)' : 'var(--ink)'}>
                    {ar.short}
                  </text>
                </g>
              );
            })}
            <circle cx={CX} cy={CY} r={R1 - 8} fill="var(--paper)" stroke="var(--rule)" />
            <text x={CX} y={CY - 4} textAnchor="middle" fontFamily="var(--font-display)" fontSize="20" fontWeight="600" fill="var(--ink)">
              {center[0]}
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" fontFamily="var(--font-display)" fontSize="20" fontWeight="600" fill="var(--ink)">
              {center[1]}
            </text>
          </svg>

          <div className="fade-in min-w-0 space-y-5" key={sel}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] text-navy">PART {sel + 1}</span>
              {a.group && <Pill tone="navy">{a.group}</Pill>}
              {a.tag && <Pill>{a.tag}</Pill>}
            </div>
            <h3 className="font-display text-[30px] font-semibold leading-[1.1] text-ink">{a.name}</h3>
            {a.summary && <p className="text-[15px] leading-[1.6] text-muted">{a.summary}</p>}
            <div>
              <p className="label mb-2">{labels.list ?? 'What it decides'}</p>
              <ul className="space-y-2">
                {a.points.map((d) => (
                  <li key={d} className="flex gap-3 text-[15px] leading-[1.55] text-ink">
                    <span className="mt-[9px] h-[5px] w-[5px] shrink-0 bg-gold" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            {a.callout && (
              <Insight title={labels.callout ?? 'Minimum to start'} stateKey={String(sel)}>
                <p>{a.callout}</p>
              </Insight>
            )}
            {a.explore?.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {a.explore.map((id) => (
                  <a key={id} href={`#${id}`} className="inline-flex items-center gap-1 text-[14px] text-navy underline decoration-rule underline-offset-4 hover:decoration-navy">
                    {pageById[id]?.title ?? id} <ArrowRight size={13} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
