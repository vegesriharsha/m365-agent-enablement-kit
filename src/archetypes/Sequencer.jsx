import { useMemo, useState } from 'react';
import { Check, Lock, RotateCcw } from 'lucide-react';
import { Section, Insight, Segmented, Button, Pill } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { useLocalState } from '../lib/hooks.js';
import config from '../pathway.config.js';

/**
 * Capabilities released in waves, each wave gated by the standards it needs.
 * Standards are cumulative: a wave needs every standard introduced at or before it.
 */
export default function Sequencer({ page, data }) {
  const { domains, waves, standards, capabilities } = data;
  const [done, setDone] = useLocalState(`${config.storagePrefix}.${page.id}.v1`, {});
  const [focus, setFocus] = useState('all');

  const required = (w) => standards.filter((s) => s.wave <= w);
  const gateClosed = (w) => required(w).every((s) => done[s.id]);
  const openWave = waves.find((w) => !gateClosed(w.id));
  const doneCount = standards.filter((s) => done[s.id]).length;
  const readyCaps = capabilities.filter((c) => gateClosed(c.wave));
  const domainName = Object.fromEntries(domains.map((d) => [d.id, d.name]));

  const next = useMemo(() => {
    if (!openWave) return null;
    const missing = required(openWave.id).filter((s) => !done[s.id]);
    const unlocks = capabilities.filter((c) => c.wave === openWave.id);
    return { wave: openWave, missing, unlocks };
  }, [done, openWave]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) => setDone((d) => ({ ...d, [id]: !d[id] }));
  const fillThrough = (w) => setDone(Object.fromEntries(standards.filter((s) => s.wave <= w).map((s) => [s.id, true])));

  return (
    <PageShell
      header={data.header}
      sources={data.sources}
      verified={data.verified}
      extraMeta={[
        { dt: 'Standards in place', dd: `${doneCount} of ${standards.length}` },
        { dt: 'Capabilities ready', dd: `${readyCaps.length} of ${capabilities.length}` },
      ]}
    >
      <Section n={1} title="Waves and gates" intro={data.intro ?? 'Each wave opens only when the standards it needs are in place. Tick standards below and watch the gates close.'}>
        <div className="overflow-x-auto pb-2">
          <ol className="grid min-w-[640px] gap-3" style={{ gridTemplateColumns: `repeat(${waves.length}, minmax(0, 1fr))` }}>
            {waves.map((w) => {
              const req = required(w.id);
              const have = req.filter((s) => done[s.id]).length;
              const closed = gateClosed(w.id);
              const caps = capabilities.filter((c) => c.wave === w.id);
              return (
                <li key={w.id} className={`flex flex-col border p-3 ${closed ? 'border-navy bg-surface' : w.id === openWave?.id ? 'border-gold bg-gold-soft' : 'border-rule bg-paper'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-[22px] w-[22px] rotate-45 items-center justify-center border-2 ${closed ? 'border-navy bg-navy' : 'border-rule bg-paper'}`}>
                      <span className={`-rotate-45 ${closed ? 'text-on-navy' : 'text-subtle'}`}>{closed ? <Check size={11} /> : <Lock size={10} />}</span>
                    </span>
                    <span className="font-mono text-[11.5px] text-navy">WAVE {w.id}</span>
                  </div>
                  <p className="mt-2 text-[14px] font-semibold leading-[1.3] text-ink">{w.name}</p>
                  {w.window && <p className="text-[12px] text-subtle">{w.window}</p>}
                  <div className="mt-2 h-[4px] w-full bg-faint">
                    <div className="h-full bg-navy transition-all duration-500" style={{ width: `${req.length ? (have / req.length) * 100 : 100}%` }} />
                  </div>
                  <p className="tabular mt-1 font-mono text-[11px] text-muted">
                    {have}/{req.length} standards
                  </p>
                  <ul className="mt-2 space-y-1">
                    {caps.map((c) => (
                      <li key={c.id} className={`text-[12.5px] leading-[1.35] ${closed ? 'text-ink' : 'text-subtle'}`}>
                        {closed ? '✓' : '·'} {c.name}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="mt-4">
          <Insight tone={next ? 'gold' : 'good'} stateKey={`${doneCount}`} title={next ? 'Next best step' : 'Every gate is closed'}>
            {next ? (
              <>
                <p>
                  <strong>Wave {next.wave.id}: {next.wave.name}</strong> opens when {next.missing.length} more standard{next.missing.length === 1 ? ' is' : 's are'} in place:{' '}
                  {next.missing.map((s) => s.name).join('; ')}.
                </p>
                {next.unlocks.length > 0 && <p className="text-muted">That unlocks {next.unlocks.map((c) => c.name).join(', ')}.</p>}
              </>
            ) : (
              <p>Every capability can be enabled. Keep the review cadence going so the standards stay true.</p>
            )}
          </Insight>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="label mr-1">Try it</span>
          {waves.map((w) => (
            <Button key={w.id} variant="quiet" onClick={() => fillThrough(w.id)}>
              Standards through wave {w.id}
            </Button>
          ))}
          <Button variant="quiet" onClick={() => setDone({})}>
            <RotateCcw size={14} /> Reset
          </Button>
        </div>
      </Section>

      <Section n={2} title="Standards by wave and domain" intro="Each row adds the standards a wave newly needs; earlier rows still apply. Highlight a domain to follow one thread through every wave.">
        <div className="mb-4 overflow-x-auto">
          <Segmented size="sm" label="Highlight" value={focus} onChange={setFocus} options={[{ value: 'all', label: 'All' }, ...domains.map((d) => ({ value: d.id, label: d.short ?? d.name }))]} />
        </div>
        <div className="space-y-4">
          {waves.map((w) => {
            const closed = gateClosed(w.id);
            return (
              <div key={w.id} className="border border-rule bg-paper">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-faint px-4 py-2.5">
                  <p className="text-[14.5px] font-semibold text-ink">
                    <span className="mr-2 font-mono text-[12px] text-navy">WAVE {w.id}</span>
                    {w.name}
                  </p>
                  <Pill tone={closed ? 'good' : 'neutral'}>{closed ? 'Gate closed' : 'Gate open'}</Pill>
                  {w.goal && <p className="w-full text-[13px] text-muted">{w.goal}</p>}
                </div>
                <div className="grid gap-px bg-faint sm:grid-cols-2 lg:grid-cols-5">
                  {domains.map((d) => {
                    const items = standards.filter((s) => s.wave === w.id && s.domain === d.id);
                    const dim = focus !== 'all' && focus !== d.id;
                    return (
                      <div key={d.id} className={`bg-paper p-3 transition-opacity ${dim ? 'opacity-35' : ''}`}>
                        <p className="label mb-1.5">{d.short ?? d.name}</p>
                        {items.length === 0 ? (
                          <p className="text-[12.5px] text-subtle">Nothing new</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {items.map((s) => (
                              <li key={s.id}>
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={!!done[s.id]}
                                  onClick={() => toggle(s.id)}
                                  title={s.detail}
                                  className={`flex w-full items-start gap-2 border px-2 py-1.5 text-left text-[13px] leading-[1.35] transition-colors ${
                                    done[s.id] ? 'border-navy bg-navy-soft text-ink' : 'border-rule bg-surface text-ink hover:border-subtle'
                                  }`}
                                >
                                  <span className={`mt-[2px] flex h-[13px] w-[13px] shrink-0 items-center justify-center border ${done[s.id] ? 'border-navy bg-navy text-on-navy' : 'border-rule'}`}>
                                    {done[s.id] && <Check size={10} />}
                                  </span>
                                  <span>{s.name}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section n={3} title="Capabilities and what blocks them">
        <ul className="grid gap-3 md:grid-cols-2">
          {capabilities.map((c) => {
            const req = required(c.wave);
            const missing = req.filter((s) => !done[s.id]);
            const ready = missing.length === 0;
            return (
              <li key={c.id} className={`border p-4 ${ready ? 'border-navy bg-surface' : 'border-rule bg-paper'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11.5px] text-navy">WAVE {c.wave}</span>
                  {c.risk && <Pill tone={c.risk === 'High' ? 'bad' : c.risk === 'Medium' ? 'gold' : 'neutral'}>{c.risk} risk</Pill>}
                  <Pill tone={ready ? 'good' : 'neutral'}>{ready ? 'Ready to enable' : `Blocked by ${missing.length}`}</Pill>
                </div>
                <p className="mt-2 text-[15px] font-semibold text-ink">{c.name}</p>
                {c.platform && <p className="text-[12.5px] text-subtle">{c.platform}</p>}
                {c.value && <p className="mt-1 text-[13.5px] leading-[1.5] text-muted">{c.value}</p>}
                <div className="mt-2 h-[4px] w-full bg-faint">
                  <div className="h-full bg-navy transition-all duration-500" style={{ width: `${((req.length - missing.length) / Math.max(1, req.length)) * 100}%` }} />
                </div>
                {!ready && (
                  <p className="mt-2 text-[12.5px] leading-[1.45] text-muted">
                    Waiting on: {missing.slice(0, 4).map((s) => `${s.name} (${domainName[s.domain]})`).join('; ')}
                    {missing.length > 4 ? `; and ${missing.length - 4} more` : ''}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Section>
    </PageShell>
  );
}
