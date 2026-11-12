import { useState } from 'react';
import { useWidth } from '../lib/hooks.js';
import { arrowHead } from '../lib/layout.js';

const WIDE = 620;
const PAD = 12;
const NODE_H = 78;

/**
 * A chain of nodes read in order, with other nodes attached beneath one of them.
 * Wide screens run the chain left to right; narrow screens run it top to bottom.
 */
function layout(width, spec) {
  const { chain, attached = {} } = spec;
  const kids = (id) => attached[id] ?? [];
  const boxes = {};
  const edges = [];

  if (width >= WIDE) {
    const gap = 76; // room for the label on a chain arrow
    const inner = 16;
    const units = chain.map((id) => Math.max(1, kids(id).length));
    const total = units.reduce((a, b) => a + b, 0);
    const unitW = (width - PAD * 2 - gap * (chain.length - 1) - inner * (total - chain.length)) / total;
    const top = 14;
    const row2 = top + NODE_H + 50;
    let x = PAD;
    chain.forEach((id, i) => {
      const w = units[i] * unitW + (units[i] - 1) * inner;
      boxes[id] = { x, y: top, w, h: NODE_H };
      kids(id).forEach((kid, j) => {
        const kx = x + j * (unitW + inner);
        boxes[kid] = { x: kx, y: row2, w: unitW, h: NODE_H };
        const cx = kx + unitW / 2;
        edges.push({ from: [cx, row2], to: [cx, top + NODE_H], label: spec.nodes[kid].link, at: [cx + 8, (row2 + top + NODE_H) / 2 + 4], anchor: 'start' });
      });
      if (i > 0) {
        const prev = boxes[chain[i - 1]];
        const cy = top + NODE_H / 2;
        edges.push({ from: [prev.x + prev.w, cy], to: [x, cy], label: spec.chainLabel, at: [(prev.x + prev.w + x) / 2, cy - 9], anchor: 'middle', primary: true });
      }
      x += w + gap;
    });
    const anyKids = chain.some((id) => kids(id).length);
    return { boxes, edges, height: (anyKids ? row2 + NODE_H : top + NODE_H) + 12 };
  }

  const gap = 46;
  const inner = 10;
  const w = width - PAD * 2;
  let y = 14;
  chain.forEach((id, i) => {
    if (i > 0) {
      const cx = PAD + w / 2;
      edges.push({ from: [cx, y - gap], to: [cx, y], label: spec.chainLabel, at: [cx + 8, y - gap / 2 + 4], anchor: 'start', primary: true });
    }
    boxes[id] = { x: PAD, y, w, h: NODE_H };
    y += NODE_H;
    const list = kids(id);
    if (list.length) {
      const kw = (w - inner * (list.length - 1)) / list.length;
      // Each attachment label gets its own line, on the side of its arrow that has room.
      const drop = 26 + list.length * 17;
      const ky = y + drop;
      list.forEach((kid, j) => {
        const kx = PAD + j * (kw + inner);
        const cx = kx + kw / 2;
        const right = cx > width / 2;
        boxes[kid] = { x: kx, y: ky, w: kw, h: NODE_H };
        edges.push({ from: [cx, ky], to: [cx, y], label: spec.nodes[kid].link, at: [cx + (right ? -8 : 8), y + 22 + j * 17], anchor: right ? 'end' : 'start' });
      });
      y = ky + NODE_H;
    }
    y += gap;
  });
  return { boxes, edges, height: y - gap + 12 };
}

/** Hierarchy renderer for a glossary diagram spec with `chain`, `attached` and `nodes`. */
export default function Hierarchy({ spec }) {
  const [ref, width] = useWidth(720);
  const [sel, setSel] = useState(spec.selected ?? spec.chain[0]);
  const L = layout(width, spec);
  const node = spec.nodes[sel];

  return (
    <div>
      <div ref={ref} className="border border-rule bg-paper">
        <svg width={width} height={L.height} viewBox={`0 0 ${width} ${L.height}`} className="block" role="img" aria-label={spec.title}>
          {L.edges.map((e) => {
            const color = e.primary ? 'var(--navy)' : 'var(--subtle)';
            const angle = Math.atan2(e.to[1] - e.from[1], e.to[0] - e.from[0]);
            return (
              <g key={`${e.from}-${e.to}`}>
                <line x1={e.from[0]} y1={e.from[1]} x2={e.to[0]} y2={e.to[1]} stroke={color} strokeWidth={e.primary ? 1.5 : 1.25} />
                <path d={arrowHead(e.to[0], e.to[1], angle, 4.5)} fill={color} />
                {e.label && (
                  <text x={e.at[0]} y={e.at[1]} textAnchor={e.anchor} fontSize="11" letterSpacing="0.08em" fill="var(--subtle)">
                    {e.label.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}
          {Object.entries(spec.nodes).map(([id, n]) => {
            const b = L.boxes[id];
            const on = id === sel;
            const pick = () => setSel(id);
            return (
              <g
                key={id}
                role="button"
                tabIndex={0}
                aria-label={`${n.label}: ${n.sub}`}
                aria-pressed={on}
                onClick={pick}
                onMouseEnter={pick}
                onFocus={pick}
                onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), pick())}
                style={{ cursor: 'pointer' }}
              >
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--surface)" stroke={on ? 'var(--navy)' : 'var(--rule)'} strokeWidth={on ? 2 : 1.25} strokeDasharray={n.optional ? '5 4' : undefined} />
                <text x={b.x + 12} y={b.y + 23} fontSize="13.5" fontWeight="600" fill="var(--ink)">
                  {n.label}
                </text>
                <text x={b.x + 12} y={b.y + 41} fontSize="11.5" fill="var(--subtle)">
                  {n.sub}
                </text>
                <text x={b.x + 12} y={b.y + 62} fontSize="11" style={{ fontFamily: 'var(--font-mono)' }} fill="var(--muted)">
                  {n.example}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p aria-live="polite" className="mt-2 border-l-2 border-navy bg-callout px-3 py-2 text-[13.5px] leading-[1.55] text-ink">
        <span className="font-semibold">{node.label}.</span> {node.note}
      </p>
    </div>
  );
}
