import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui.jsx';
import { useWidth } from '../lib/hooks.js';
import { columns, arrowHead } from '../lib/layout.js';

const WIDE = 620;
const PAD = 12;
const HEAD = 50;
const CHIP_H = 28;
const CHIP_GAP = 8;

const regionHeight = (n) => HEAD + Math.max(1, n) * (CHIP_H + CHIP_GAP) + 4;

/**
 * A frame for the policy as a whole, with its regions side by side on wide
 * screens and stacked on narrow ones, and the outcome the policy decides beneath.
 */
function layout(width, regions) {
  const wide = width >= WIDE;
  const boxes = {};
  const frame = { x: PAD, y: 10, w: width - PAD * 2 };
  const inset = 10;
  const top = frame.y + 28; // room for the frame's label
  let bottom;
  if (wide) {
    const cols = columns(regions.length, frame.w, { gap: 12, pad: inset });
    const h = regionHeight(Math.max(...regions.map((r) => r.items.length)));
    regions.forEach((r, i) => {
      boxes[r.id] = { x: frame.x + cols[i].x, y: top, w: cols[i].w, h };
    });
    bottom = top + h;
  } else {
    let y = top;
    regions.forEach((r) => {
      const h = regionHeight(r.items.length);
      boxes[r.id] = { x: frame.x + inset, y, w: frame.w - inset * 2, h };
      y += h + 10;
    });
    bottom = y - 10;
  }
  frame.h = bottom + inset - frame.y;
  const outW = Math.min(220, width - PAD * 2);
  const out = { x: width / 2 - outW / 2, y: frame.y + frame.h + 46, w: outW, h: 46 };
  return { boxes, frame, bottom: frame.y + frame.h, out, height: out.y + out.h + 30 };
}

/**
 * Boundary renderer: regions that hold items, a step-through that marks which
 * items are in use, and one outcome that the regions decide.
 */
export default function Boundary({ spec }) {
  const [ref, width] = useWidth(720);
  const [step, setStep] = useState(0);
  const { regions, steps, outcome } = spec;
  const s = steps[step];
  const L = layout(width, regions);
  const off = s.outcome === 'off';
  const cx = width / 2;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0} aria-label="Previous step">
          <ChevronLeft size={14} /> Back
        </Button>
        <Button variant="secondary" onClick={() => setStep((n) => Math.min(steps.length - 1, n + 1))} disabled={step === steps.length - 1} aria-label="Next step">
          Next <ChevronRight size={14} />
        </Button>
        <span className="label">
          Step {step + 1} of {steps.length}
        </span>
      </div>
      <p aria-live="polite" className="mb-2 border-l-2 border-navy bg-callout px-3 py-2 text-[13.5px] leading-[1.55] text-ink">
        {s.text}
      </p>
      <div ref={ref} className="border border-rule bg-paper">
        <svg width={width} height={L.height} viewBox={`0 0 ${width} ${L.height}`} className="block" role="img" aria-label={`${spec.title}. ${s.text}`}>
          {/* the policy as a whole: its regions together decide the outcome */}
          <rect x={L.frame.x} y={L.frame.y} width={L.frame.w} height={L.frame.h} fill="none" stroke="var(--subtle)" strokeWidth="1.25" strokeDasharray="5 4" />
          {spec.frame && (
            <text x={L.frame.x + 12} y={L.frame.y + 18} fontSize="11" letterSpacing="0.08em" fill="var(--subtle)">
              {spec.frame.toUpperCase()}
            </text>
          )}
          {regions.map((r) => {
            const b = L.boxes[r.id];
            const hit = r.blocked && r.items.some((it) => s.uses.includes(it.label));
            return (
              <g key={r.id}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--callout)" stroke={hit && off ? 'var(--bad)' : 'var(--rule)'} strokeWidth={hit && off ? 2 : 1.25} />
                <text x={b.x + 12} y={b.y + 22} fontSize="13.5" fontWeight="600" fill="var(--ink)">
                  {r.label}
                </text>
                <text x={b.x + 12} y={b.y + 39} fontSize="11.5" fill="var(--subtle)">
                  {r.sub}
                </text>
                {r.items.length === 0 && r.empty && (
                  <text x={b.x + 12} y={b.y + HEAD + 19} fontSize="11.5" fill="var(--muted)">
                    {r.empty}
                  </text>
                )}
                {r.items.map((it, j) => {
                  const y = b.y + HEAD + j * (CHIP_H + CHIP_GAP);
                  const used = s.uses.includes(it.label);
                  const bad = used && r.blocked;
                  const stroke = bad ? 'var(--bad)' : used ? 'var(--navy)' : 'var(--rule)';
                  const tx = b.x + 10 + (it.locked ? 22 : 10);
                  const mx = b.x + b.w - 26;
                  return (
                    <g key={it.label}>
                      <rect x={b.x + 10} y={y} width={b.w - 20} height={CHIP_H} fill="var(--surface)" stroke={stroke} strokeWidth={used ? 2 : 1.25} />
                      {it.locked && <rect x={b.x + 20} y={y + CHIP_H / 2 - 3} width={6} height={6} fill="var(--subtle)" />}
                      <text x={tx} y={y + 18} fontSize="12" fill="var(--ink)">
                        {it.label}
                      </text>
                      {/* in use: a tick, or a cross when the connector is blocked */}
                      {used && !bad && <path d={`M${mx} ${y + 14} l4 4 l7 -8`} fill="none" stroke="var(--navy)" strokeWidth="2" />}
                      {bad && <path d={`M${mx} ${y + 9} l10 10 M${mx + 10} ${y + 9} l-10 10`} fill="none" stroke="var(--bad)" strokeWidth="2" />}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* the regions decide the outcome */}
          <line x1={cx} y1={L.bottom + 4} x2={cx} y2={L.out.y - 2} stroke="var(--subtle)" strokeWidth="1.25" />
          <path d={arrowHead(cx, L.out.y - 2, Math.PI / 2, 4.5)} fill="var(--subtle)" />
          <text x={cx + 10} y={(L.bottom + L.out.y) / 2 + 5} fontSize="11" letterSpacing="0.08em" fill="var(--subtle)">
            {spec.check.toUpperCase()}
          </text>
          <rect x={L.out.x} y={L.out.y} width={L.out.w} height={L.out.h} fill="var(--surface)" stroke={off ? 'var(--bad)' : 'var(--good)'} strokeWidth="2" />
          <text x={L.out.x + 14} y={L.out.y + 28} fontSize="13.5" fontWeight="600" fill="var(--ink)">
            {outcome.label}
          </text>
          <text x={L.out.x + L.out.w - 14} y={L.out.y + 28} textAnchor="end" fontSize="12" fontWeight="600" letterSpacing="0.08em" fill={off ? 'var(--bad)' : 'var(--good)'}>
            {(off ? outcome.off : outcome.on).toUpperCase()}
          </text>

          {spec.legend && (
            <g>
              <rect x={PAD} y={L.height - 16} width={6} height={6} fill="var(--subtle)" />
              <text x={PAD + 12} y={L.height - 9} fontSize="11" fill="var(--subtle)">
                {spec.legend}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
