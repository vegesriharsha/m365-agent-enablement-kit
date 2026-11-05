import { useState } from 'react';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { Section, Insight, Button, Pill } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { useLocalState } from '../lib/hooks.js';
import config from '../pathway.config.js';
import { pageById } from '../content/registry.js';

/** Phases closed by gates; criteria are ticked and kept in the browser. */
export default function Journey({ page, data }) {
  const { phases } = data;
  const [active, setActive] = useState(0);
  const [done, setDone] = useLocalState(`${config.storagePrefix}.${page.id}.v1`, {});
  const phase = phases.at(active);

  const phaseDone = (p) => p.criteria.every((_, i) => done[`${p.id}:${i}`]);
  const doneCount = phases.reduce((n, p) => n + p.criteria.filter((_, i) => done[`${p.id}:${i}`]).length, 0);
  const total = phases.reduce((n, p) => n + p.criteria.length, 0);
  const firstOpen = phases.findIndex((p) => !phaseDone(p));
  const toggle = (key) => setDone((d) => ({ ...d, [key]: !d[key] }));
  const width = 100 / phases.length;

  return (
    <PageShell
      header={data.header}
      sources={data.sources}
      verified={data.verified}
      extraMeta={[
        { dt: 'Phases', dd: String(phases.length) },
        { dt: 'Your progress', dd: `${doneCount} of ${total}` },
      ]}
    >
      <Section n={1} title={data.sectionTitle ?? 'The roadmap'} intro="Select a phase to see what happens in it and what closes it. Your ticks are kept in this browser only.">
        <div className="relative overflow-x-auto pb-2">
          <ol className="relative flex min-w-[560px] items-start justify-between">
            <div className="absolute top-[15px] h-[2px] bg-faint" style={{ left: `${width / 2}%`, right: `${width / 2}%` }} aria-hidden="true" />
            <div
              className="absolute top-[15px] h-[2px] bg-navy transition-all duration-500"
              style={{ left: `${width / 2}%`, width: `${(Math.max(0, firstOpen === -1 ? phases.length - 1 : firstOpen) / Math.max(1, phases.length - 1)) * (100 - width)}%` }}
              aria-hidden="true"
            />
            {phases.map((p, i) => {
              const closed = phaseDone(p);
              const isActive = i === active;
              return (
                <li key={p.id} className="relative z-10 flex flex-col items-center text-center" style={{ width: `${width}%` }}>
                  <button type="button" onClick={() => setActive(i)} aria-pressed={isActive} className="flex flex-col items-center gap-2">
                    <span
                      className={`flex h-[32px] w-[32px] rotate-45 items-center justify-center border-2 transition-colors ${
                        closed ? 'border-navy bg-navy' : isActive ? 'border-navy bg-navy-soft' : 'border-rule bg-paper'
                      }`}
                    >
                      <span className={`-rotate-45 font-mono text-[12px] ${closed ? 'text-on-navy' : 'text-navy'}`}>{closed ? <Check size={14} /> : i + 1}</span>
                    </span>
                    <span className={`text-[14px] ${isActive ? 'font-semibold text-ink' : 'text-muted'}`}>{p.name}</span>
                    {p.sub && <span className="text-[12px] text-subtle">{p.sub}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="fade-in min-w-0 border border-rule bg-surface p-5" key={phase.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] text-navy">PHASE {active + 1}</span>
              <Pill tone={phaseDone(phase) ? 'good' : 'neutral'}>{phaseDone(phase) ? 'Gate closed' : 'Gate open'}</Pill>
            </div>
            <h3 className="mt-2 font-display text-[30px] font-semibold leading-[1.1] text-ink">{phase.name}</h3>
            <p className="mt-2 text-[15px] text-muted">{phase.what}</p>
            {phase.team && (
              <>
                <p className="label mt-5">Who</p>
                <p className="text-[14px] text-ink">{phase.team}</p>
              </>
            )}
            <p className="label mt-5">Exit gate</p>
            <p className="text-[15px] font-medium text-ink">{phase.gate}</p>
            <ul className="mt-3 space-y-2">
              {phase.criteria.map((c, i) => {
                const key = `${phase.id}:${i}`;
                return (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-3 text-[14px] text-ink">
                      <input type="checkbox" checked={!!done[key]} onChange={() => toggle(key)} className="mt-1 accent-[var(--navy)]" />
                      <span className={done[key] ? 'text-subtle line-through' : ''}>{c}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="quiet" onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0}>
                Previous phase
              </Button>
              <Button onClick={() => setActive((a) => Math.min(phases.length - 1, a + 1))} disabled={active === phases.length - 1}>
                Next phase <ArrowRight size={14} />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Insight stateKey={`${phase.id}-${phaseDone(phase)}`}>
              {phaseDone(phase) ? (
                <p>
                  The <strong>{phase.name}</strong> gate is closed. Everything after it can rely on what this phase produced.
                </p>
              ) : active > firstOpen && firstOpen !== -1 ? (
                <p>
                  You’re looking ahead: <strong>{phases.at(firstOpen).name}</strong> still has open criteria. Starting this phase early means building on
                  something that hasn’t been proven yet.
                </p>
              ) : (
                <p>
                  {phase.criteria.filter((_, i) => !done[`${phase.id}:${i}`]).length} criteria left before the <strong>{phase.name}</strong> gate closes.
                </p>
              )}
            </Insight>
            {phase.explore?.length > 0 && (
              <div className="border border-rule p-4">
                <p className="label mb-2">Explore for this phase</p>
                <ul className="space-y-1.5">
                  {phase.explore.map((id) => (
                    <li key={id}>
                      <a href={`#${id}`} className="inline-flex items-center gap-1.5 text-[14px] text-navy underline decoration-rule underline-offset-4 hover:decoration-navy">
                        {pageById[id]?.title ?? id} <ArrowRight size={13} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button variant="quiet" onClick={() => setDone({})}>
              <RotateCcw size={14} /> Clear my ticks
            </Button>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
