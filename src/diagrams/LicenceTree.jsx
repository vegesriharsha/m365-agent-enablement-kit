import { useEffect, useRef, useState } from 'react';
import { useProgress, useWidth } from '../lib/hooks.js';
import { columns, stack, lerp, arrowHead } from '../lib/layout.js';

const WIDE = 620;
const PAD = 14;
const SPONSOR_H = 72;
const AGENT_H = 52;

/** Positions for the tenant, its sponsors and the agents under each, from the measured width. */
function layout(width, sponsors, agents) {
  const wide = width >= WIDE;
  const under = (id) => agents.filter((a) => a.sponsor === id);
  const out = { wide, sponsors: {}, agents: {}, notes: {}, lines: [] };

  if (wide) {
    const cols = columns(sponsors.length, width, { gap: 16, pad: PAD });
    const rootW = Math.min(280, width - PAD * 2);
    out.root = { x: width / 2 - rootW / 2, y: 12, w: rootW, h: 50 };
    const busY = out.root.y + out.root.h + 18;
    const sTop = busY + 20;
    const aTop = sTop + SPONSOR_H + 22;
    let bottom = aTop + 30;
    sponsors.forEach((s, i) => {
      const c = cols[i];
      out.sponsors[s.id] = { x: c.x, y: sTop, w: c.w, h: SPONSOR_H };
      out.lines.push(`M${width / 2} ${out.root.y + out.root.h} V${busY} H${c.cx} V${sTop}`);
      const list = under(s.id);
      const rows = stack(list.map(() => AGENT_H), { gap: 10, top: aTop });
      list.forEach((a, j) => {
        out.agents[a.id] = { x: c.x + 22, y: rows.rows[j].y, w: c.w - 22, h: AGENT_H, trunk: `M${c.x + 8} ${sTop + SPONSOR_H} V${rows.rows[j].cy} H${c.x + 22}` };
      });
      out.notes[s.id] = { x: c.x + 8, y: aTop + 14 };
      bottom = Math.max(bottom, rows.bottom);
    });
    out.height = bottom + 14;
    return out;
  }

  out.root = { x: PAD, y: 12, w: width - PAD * 2, h: 46 };
  let y = out.root.y + out.root.h + 14;
  sponsors.forEach((s) => {
    const sx = PAD + 24;
    const sw = width - PAD * 2 - 24;
    out.sponsors[s.id] = { x: sx, y, w: sw, h: SPONSOR_H };
    out.lines.push(`M${PAD + 8} ${out.root.y + out.root.h} V${y + SPONSOR_H / 2} H${sx}`);
    let cursor = y + SPONSOR_H + 10;
    out.notes[s.id] = { x: sx + 8, y: cursor + 12 };
    const list = under(s.id);
    list.forEach((a) => {
      out.agents[a.id] = { x: sx + 24, y: cursor, w: sw - 24, h: AGENT_H, trunk: `M${sx + 8} ${y + SPONSOR_H} V${cursor + AGENT_H / 2} H${sx + 24}` };
      cursor += AGENT_H + 10;
    });
    if (s.gone && list.length === 0) cursor += 24; // room for the transfer note
    y = cursor + 6;
  });
  out.height = y + 6;
  return out;
}

/**
 * Inheritance tree: the tenant, the sponsors under it and the agents under each
 * sponsor. An agent's premium state comes from its sponsor's licence.
 * Drawn at the measured width, stacked as an indented tree on narrow screens.
 */
export default function LicenceTree({ sponsors, agents, movedId, moveKey, label }) {
  const [ref, width] = useWidth(720);
  const L = layout(width, sponsors, agents);

  // Animate only the agent that was just moved, from where it last settled.
  const settled = useRef({});
  const from = useRef({ key: moveKey, at: null });
  const [armed, setArmed] = useState(moveKey);
  if (from.current.key !== moveKey) {
    const was = movedId ? settled.current[movedId] : null;
    from.current = { key: moveKey, at: was ? [was.x, was.y] : null };
  }
  const raw = useProgress(`move-${moveKey}`, 700);
  const t = armed !== moveKey ? 0 : raw;
  useEffect(() => setArmed(moveKey), [moveKey]);
  useEffect(() => {
    settled.current = L.agents;
  });

  const nameOf = Object.fromEntries(sponsors.map((s) => [s.id, s.name]));

  return (
    <div ref={ref} className="border border-rule bg-paper">
      <svg width={width} height={L.height} viewBox={`0 0 ${width} ${L.height}`} className="block" role="img" aria-label={label}>
        {/* tenant */}
        <rect x={L.root.x} y={L.root.y} width={L.root.w} height={L.root.h} fill="var(--callout)" stroke="var(--rule)" strokeWidth="1.25" />
        <text x={L.root.x + L.root.w / 2} y={L.root.y + 21} textAnchor="middle" fontSize="13.5" fontWeight="600" fill="var(--ink)">
          Contoso tenant
        </text>
        <text x={L.root.x + L.root.w / 2} y={L.root.y + 38} textAnchor="middle" fontSize="11.5" fill="var(--subtle)">
          Microsoft 365 E5
        </text>

        {L.lines.map((d) => (
          <path key={d} d={d} fill="none" stroke="var(--rule)" strokeWidth="1.25" />
        ))}

        {/* sponsors */}
        {sponsors.map((s) => {
          const b = L.sponsors[s.id];
          const note = L.notes[s.id];
          return (
            <g key={s.id}>
              <g opacity={s.gone ? 0.5 : 1}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--surface)" stroke={s.licensed ? 'var(--navy)' : 'var(--rule)'} strokeWidth={s.licensed ? 2 : 1.25} />
                <text x={b.x + 12} y={b.y + 22} fontSize="14" fontWeight="600" fill="var(--ink)">
                  {s.name}
                  {s.gone ? ' · left' : ''}
                </text>
                <text x={b.x + 12} y={b.y + 39} fontSize="11.5" fill="var(--subtle)">
                  {s.role}
                </text>
                <rect x={b.x + 12} y={b.y + 50} width={9} height={9} fill={s.licensed ? 'var(--navy)' : 'none'} stroke={s.licensed ? 'var(--navy)' : 'var(--bad)'} strokeWidth="1.5" />
                <text x={b.x + 27} y={b.y + 59} fontSize="11" fontWeight="600" letterSpacing="0.08em" fill={s.licensed ? 'var(--navy)' : 'var(--bad)'}>
                  {s.licensed ? 'LICENSED' : 'NO LICENCE'}
                </text>
              </g>
              {s.gone && s.transferTo && (
                <g>
                  <path d={`M${note.x} ${note.y - 4} h18`} stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
                  <path d={arrowHead(note.x + 24, note.y - 4, 0, 4)} fill="var(--gold)" />
                  <text x={note.x + 30} y={note.y} fontSize="11.5" fill="var(--gold)">
                    sponsorship moves to {nameOf[s.transferTo]}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* agents */}
        {agents.map((a) => {
          const b = L.agents[a.id];
          const moving = a.id === movedId && from.current.at && t < 1;
          const [x, y] = moving ? lerp(from.current.at, [b.x, b.y], t) : [b.x, b.y];
          return (
            <g key={a.id}>
              {!moving && <path d={b.trunk} fill="none" stroke={a.active ? 'var(--navy)' : 'var(--rule)'} strokeWidth={a.active ? 1.75 : 1.25} />}
              <rect x={x} y={y} width={b.w} height={b.h} fill="var(--surface)" stroke={a.active ? 'var(--navy)' : 'var(--rule)'} strokeWidth={a.active ? 2 : 1.25} />
              <text x={x + 12} y={y + 21} fontSize="12.5" fontWeight="600" fill="var(--ink)">
                {a.name}
              </text>
              <circle cx={x + 16} cy={y + 36} r={4} fill={a.licensed ? 'var(--navy)' : 'none'} stroke={a.licensed ? 'var(--navy)' : 'var(--bad)'} strokeWidth="1.5" />
              <text x={x + 27} y={y + 40} fontSize="11.5" fill={a.licensed ? 'var(--ink)' : 'var(--bad)'}>
                {a.licensed ? 'premium on' : 'premium off'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
