import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Section, Insight, Segmented, Button, Pill } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { useProgress, useWidth, pointOnPolyline } from '../lib/hooks.js';
import { arrowHead } from '../lib/layout.js';

/** Break a lane name into lines that fit a column `chars` wide. */
function wrap(name, chars) {
  const lines = [];
  name.split(' ').forEach((word) => {
    const last = lines.at(-1);
    if (last && `${last} ${word}`.length <= chars) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  });
  return lines;
}

/**
 * Where everything goes. Wide screens read left to right with lanes as rows;
 * narrow screens read top to bottom with lanes as columns, so the run never
 * needs sideways scrolling and its failure point stays on screen.
 */
function layout(width, lanes, steps, cols) {
  const nCols = cols.at(-1) + 1;
  const W = 140 + nCols * 92;
  if (width >= Math.min(W, 900)) {
    const laneY = Object.fromEntries(lanes.map((l, i) => [l.id, 46 + i * 80]));
    return {
      vertical: false,
      W,
      H: 46 + lanes.length * 80 - 20,
      at: (i) => [170 + cols.at(i) * 92, laneY[steps.at(i).lane]],
      lead: [120, laneY[steps.at(0).lane]],
      laneY,
    };
  }
  const pad = 8;
  const colW = (width - pad * 2) / lanes.length;
  const laneX = Object.fromEntries(lanes.map((l, i) => [l.id, pad + colW * (i + 0.5)]));
  const heads = Object.fromEntries(lanes.map((l) => [l.id, wrap(l.name.toUpperCase(), Math.max(6, Math.floor(colW / 7.6)))]));
  const headH = Math.max(...Object.values(heads).map((h) => h.length)) * 14 + 14;
  const rowY = (c) => headH + 34 + c * 58;
  return {
    vertical: true,
    W: width,
    H: rowY(nCols - 1) + 34,
    at: (i) => [laneX[steps.at(i).lane], rowY(cols.at(i))],
    lead: [laneX[steps.at(0).lane], headH + 6],
    laneX,
    heads,
    headH,
    colW,
    pad,
  };
}

/**
 * A process across swim lanes. A token travels the steps; a scenario can stop it
 * at one step with a log line, an explanation and a fix.
 * Steps advance one column each unless `stack: true` keeps them in the previous column.
 */
export default function Flow({ data }) {
  const { lanes, steps, scenarios, okText } = data;
  const [scenario, setScenario] = useState(Object.keys(scenarios)[0]);
  const [run, setRun] = useState(0);
  const [ref, width] = useWidth(900);
  const sc = scenarios[scenario];

  const cols = [];
  steps.forEach((s, i) => cols.push(i === 0 ? 0 : s.stack ? cols.at(-1) : cols.at(-1) + 1));
  const L = layout(width, lanes, steps, cols);

  const last = sc.fail ?? steps.length - 1;
  const t = useProgress(`${scenario}-${run}`, 900 + 420 * (last + 1));
  const pts = [L.lead, ...steps.slice(0, last + 1).map((_, i) => L.at(i))];
  const [px, py] = pointOnPolyline(pts, t);
  const reached = Math.min(last, Math.floor(t * (last + 1) - 0.0001));
  const done = t >= 1;
  const failed = done && sc.fail != null;
  const lastLane = lanes.at(-1).id;

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

        <div ref={ref} className="mt-5 border border-rule bg-paper">
          <svg viewBox={`0 0 ${L.W} ${L.H}`} className="block w-full" role="img" aria-label={`${data.header.title}: ${sc.label}`}>
            {L.vertical
              ? lanes.map((l, i) => (
                  <g key={l.id}>
                    {i > 0 && <line x1={L.pad + L.colW * i} x2={L.pad + L.colW * i} y1={0} y2={L.H} stroke="var(--faint)" />}
                    {L.heads[l.id].map((line, j) => (
                      <text key={line} x={L.laneX[l.id]} y={16 + j * 14} textAnchor="middle" fontSize="11" letterSpacing="0.8" fill="var(--subtle)">
                        {line}
                      </text>
                    ))}
                  </g>
                ))
              : lanes.map((l) => (
                  <g key={l.id}>
                    <line x1={0} x2={L.W} y1={L.laneY[l.id] + 40} y2={L.laneY[l.id] + 40} stroke="var(--faint)" />
                    <text x={14} y={L.laneY[l.id] + 4} fontSize="12" letterSpacing="1.2" fill="var(--subtle)">
                      {l.name.toUpperCase()}
                    </text>
                  </g>
                ))}
            {L.vertical && <line x1={0} x2={L.W} y1={L.headH} y2={L.headH} stroke="var(--faint)" />}

            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--rule)" strokeWidth="1.25" strokeDasharray="4 4" />
            {/* an arrowhead halfway along each hop, so the reading direction is explicit */}
            {pts.slice(1).map((p, i) => {
              const a = pts[i];
              const angle = Math.atan2(p[1] - a[1], p[0] - a[0]);
              return <path key={`${a}-${p}`} d={arrowHead((a[0] + p[0]) / 2, (a[1] + p[1]) / 2, angle, 3.5)} fill="var(--subtle)" />;
            })}

            {steps.map((s, i) => {
              const inRun = i <= last;
              const isFail = failed && i === sc.fail;
              const passed = inRun && (i < reached || (done && !isFail));
              const fill = isFail ? 'var(--bad-soft)' : passed ? 'var(--navy)' : 'var(--surface)';
              const stroke = isFail ? 'var(--bad)' : inRun ? 'var(--navy)' : 'var(--rule)';
              const [cx, cy] = L.at(i);
              // Stacked: the label sits beside its node, on the side with room.
              const left = L.vertical && s.lane === lastLane;
              const label = L.vertical ? { x: cx + (left ? -16 : 16), y: cy + 4, anchor: left ? 'end' : 'start' } : { x: cx, y: cy + 27, anchor: 'middle' };
              return (
                <g key={s.label} opacity={inRun ? 1 : 0.45}>
                  {s.gate ? (
                    <rect x={cx - 9} y={cy - 9} width={18} height={18} transform={`rotate(45 ${cx} ${cy})`} fill={fill} stroke={stroke} strokeWidth="1.5" />
                  ) : (
                    <circle cx={cx} cy={cy} r={9} fill={fill} stroke={stroke} strokeWidth="1.5" />
                  )}
                  <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize="12" fill={isFail ? 'var(--bad)' : 'var(--ink)'} stroke="var(--paper)" strokeWidth="3" paintOrder="stroke">
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
