import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Section, Insight, Segmented, Button, Pill } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { useProgress, pointOnPolyline } from '../lib/hooks.js';

/**
 * A process across swim lanes. A token travels the steps; a scenario can stop it
 * at one step with a log line, an explanation and a fix.
 * Steps advance one column each unless `stack: true` keeps them in the previous column.
 */
export default function Flow({ data }) {
  const { lanes, steps, scenarios, okText } = data;
  const [scenario, setScenario] = useState(Object.keys(scenarios)[0]);
  const [run, setRun] = useState(0);
  const sc = scenarios[scenario];

  const cols = [];
  steps.forEach((s, i) => cols.push(i === 0 ? 0 : s.stack ? cols.at(-1) : cols.at(-1) + 1));
  const nCols = cols.at(-1) + 1;
  const W = 140 + nCols * 92;
  const laneY = Object.fromEntries(lanes.map((l, i) => [l.id, 46 + i * 80]));
  const H = 46 + lanes.length * 80 - 20;
  const x = (c) => 170 + c * 92;

  const last = sc.fail ?? steps.length - 1;
  const t = useProgress(`${scenario}-${run}`, 900 + 420 * (last + 1));
  const pts = [[120, laneY[steps.at(0).lane]], ...steps.slice(0, last + 1).map((s, i) => [x(cols.at(i)), laneY[s.lane]])];
  const [px, py] = pointOnPolyline(pts, t);
  const reached = Math.min(last, Math.floor(t * (last + 1) - 0.0001));
  const done = t >= 1;
  const failed = done && sc.fail != null;

  return (
    <PageShell header={data.header} sources={data.sources} verified={data.verified} extraMeta={[{ dt: 'Steps', dd: String(steps.length) }, { dt: 'Scenarios', dd: String(Object.keys(scenarios).length) }]}>
      <Section n={1} title={data.sectionTitle ?? 'Run it'} intro="Pick a scenario and watch the token travel. The log fills in as it goes.">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <Segmented label="Scenario" value={scenario} onChange={setScenario} options={Object.entries(scenarios).map(([value, s]) => ({ value, label: s.label }))} />
          </div>
          <Button variant="secondary" onClick={() => setRun((n) => n + 1)}>
            <RotateCcw size={14} /> Run again
          </Button>
        </div>

        <div className="mt-5 overflow-x-auto border border-rule bg-paper">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ minWidth: `${Math.min(W, 900)}px` }} role="img" aria-label={`${data.header.title}: ${sc.label}`}>
            {lanes.map((l) => (
              <g key={l.id}>
                <line x1={0} x2={W} y1={laneY[l.id] + 40} y2={laneY[l.id] + 40} stroke="var(--faint)" />
                <text x={14} y={laneY[l.id] + 4} fontSize="11" letterSpacing="1.2" fill="var(--subtle)">
                  {l.name.toUpperCase()}
                </text>
              </g>
            ))}
            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--rule)" strokeWidth="1.25" strokeDasharray="4 4" />
            {steps.map((s, i) => {
              const inRun = i <= last;
              const isFail = failed && i === sc.fail;
              const passed = inRun && (i < reached || (done && !isFail));
              const fill = isFail ? 'var(--bad-soft)' : passed ? 'var(--navy)' : 'var(--surface)';
              const stroke = isFail ? 'var(--bad)' : inRun ? 'var(--navy)' : 'var(--rule)';
              const cx = x(cols.at(i));
              const cy = laneY[s.lane];
              return (
                <g key={s.label} opacity={inRun ? 1 : 0.45}>
                  {s.gate ? (
                    <rect x={cx - 9} y={cy - 9} width={18} height={18} transform={`rotate(45 ${cx} ${cy})`} fill={fill} stroke={stroke} strokeWidth="1.5" />
                  ) : (
                    <circle cx={cx} cy={cy} r={9} fill={fill} stroke={stroke} strokeWidth="1.5" />
                  )}
                  <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fill={isFail ? 'var(--bad)' : 'var(--ink)'}>
                    {s.label}
                  </text>
                  {isFail && <path d={`M${cx - 4} ${cy - 4} L${cx + 4} ${cy + 4} M${cx + 4} ${cy - 4} L${cx - 4} ${cy + 4}`} stroke="var(--bad)" strokeWidth="2" />}
                </g>
              );
            })}
            {!done && <circle cx={px} cy={py} r={6} fill="var(--gold)" stroke="var(--paper)" strokeWidth="2" />}
          </svg>
        </div>

        <div className="mt-4 border border-rule bg-callout">
          <div className="flex items-center justify-between border-b border-faint px-3 py-1.5">
            <span className="label">Log · illustrative</span>
            <Pill tone={!done ? 'neutral' : failed ? 'bad' : 'good'}>{!done ? 'Running' : failed ? 'Stopped' : 'Completed'}</Pill>
          </div>
          <ol className="space-y-0.5 px-3 py-3 font-mono text-[12px] leading-[1.6]">
            {steps.slice(0, Math.max(0, reached) + 1).map((s, i) => {
              const isFail = failed && i === sc.fail;
              return (
                <li key={s.label} className={`fade-in ${isFail ? 'text-bad' : 'text-ink'}`}>
                  <span className="text-subtle">{String(i + 1).padStart(2, '0')} </span>
                  {isFail ? sc.log : s.log}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-4">
          <Insight tone={failed ? 'bad' : 'navy'} stateKey={`${scenario}-${done}`} title={failed ? 'What went wrong' : 'What this shows'}>
            {failed ? (
              <>
                <p>{sc.why}</p>
                {sc.fix && <p className="text-muted">{sc.fix}</p>}
              </>
            ) : (
              <p>{sc.text ?? okText}</p>
            )}
          </Insight>
        </div>
      </Section>
    </PageShell>
  );
}
