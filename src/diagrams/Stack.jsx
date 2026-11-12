import { useId, useState } from 'react';
import { useWidth } from '../lib/hooks.js';
import { columns, arrowHead } from '../lib/layout.js';

const WIDE = 760;
const PAD = 12;
const GUTTER = 24; // holds the arrow that says "read upwards"
const CHIP_H = 30;
const HEAD_W = 168;

/** Bands stacked top to bottom; chips sit beside the band's name on wide screens and beneath it on narrow ones. */
function layout(width, bands) {
  const wide = width >= WIDE;
  const x = PAD + GUTTER;
  const w = width - PAD * 2 - GUTTER;
  let y = 12;
  const out = bands.map((b) => {
    const n = b.items.length;
    const perRow = wide ? n : 2;
    const rows = Math.ceil(n / perRow);
    const area = wide ? { x: x + HEAD_W, w: w - HEAD_W - 12 } : { x: x + 12, w: w - 24 };
    const cols = columns(perRow, area.w, { gap: 8, pad: 0 });
    const h = wide ? 62 : 50 + rows * (CHIP_H + 8) + 4;
    const chipTop = wide ? y + (h - CHIP_H) / 2 : y + 50;
    const chips = b.items.map((label, i) => ({ label, x: area.x + cols[i % perRow].x, y: chipTop + Math.floor(i / perRow) * (CHIP_H + 8), w: cols[i % perRow].w }));
    const box = { x, y, w, h, chips };
    y += h + 8;
    return box;
  });
  return { boxes: out, height: y + 4, top: 12, bottom: y - 8 };
}

/** Stack renderer: bands read from the bottom up; select a band to read what it covers. */
export default function Stack({ spec }) {
  const [ref, width] = useWidth(760);
  const [sel, setSel] = useState(null);
  const hatch = `hatch-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { bands } = spec;
  const L = layout(width, bands);
  const band = bands.find((b) => b.id === sel);
  const ax = PAD + GUTTER / 2 - 2;

  return (
    <div>
      <div ref={ref} className="border border-rule bg-paper">
        <svg width={width} height={L.height} viewBox={`0 0 ${width} ${L.height}`} className="block" role="img" aria-label={spec.title}>
          <defs>
            <pattern id={hatch} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              <rect width="8" height="8" fill="var(--callout)" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--rule)" strokeWidth="2" />
            </pattern>
          </defs>

          {/* the stack is read from the bottom up */}
          <line x1={ax} y1={L.bottom} x2={ax} y2={L.top + 6} stroke="var(--navy)" strokeWidth="1.5" />
          <path d={arrowHead(ax, L.top, -Math.PI / 2, 4.5)} fill="var(--navy)" />

          {bands.map((b, i) => {
            const box = L.boxes[i];
            const on = b.id === sel;
            const pick = () => setSel(b.id);
            return (
              <g
                key={b.id}
                role="button"
                tabIndex={0}
                aria-label={`${b.label}: ${b.items.join(', ')}`}
                aria-pressed={on}
                onClick={pick}
                onMouseEnter={pick}
                onFocus={pick}
                onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), pick())}
                style={{ cursor: 'pointer' }}
              >
                <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={b.hatched ? `url(#${hatch})` : 'var(--callout)'} stroke={on ? 'var(--navy)' : b.hatched ? 'var(--gold)' : 'var(--rule)'} strokeWidth={on ? 2 : 1.25} />
                {/* a solid plate under the band's name keeps it readable over the hatching */}
                {b.hatched && <rect x={box.x + 6} y={box.y + 8} width={HEAD_W - 14} height={38} fill="var(--paper)" />}
                <text x={box.x + 12} y={box.y + 25} fontSize="13.5" fontWeight="600" fill="var(--ink)">
                  {b.label}
                </text>
                <text x={box.x + 12} y={box.y + 42} fontSize="11.5" fill="var(--subtle)">
                  {b.sub}
                </text>
                {box.chips.map((c) => (
                  <g key={c.label}>
                    <rect x={c.x} y={c.y} width={c.w} height={CHIP_H} fill="var(--surface)" stroke="var(--rule)" strokeWidth="1.25" />
                    <text x={c.x + c.w / 2} y={c.y + 19} textAnchor="middle" fontSize="12" fill="var(--ink)">
                      {c.label}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      {band && (
        <p aria-live="polite" className="mt-2 border-l-2 border-navy bg-callout px-3 py-2 text-[13.5px] leading-[1.55] text-ink">
          <span className="font-semibold">{band.label}.</span> {band.note}
        </p>
      )}
    </div>
  );
}
