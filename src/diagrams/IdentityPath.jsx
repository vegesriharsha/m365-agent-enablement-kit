import { useProgress, useWidth, pointOnPolyline } from '../lib/hooks.js';
import { arrowHead } from '../lib/layout.js';

const WIDE = 720;
const PAD = 14;
const BOX_H = 58;

/** Station boxes, the rail the token rides, the access gate and the result, from the measured width. */
function layout(width, n) {
  if (width >= WIDE) {
    const resultW = 84;
    const gap = 28;
    const w = (width - PAD * 2 - resultW - gap * (n - 1)) / n;
    const top = 38;
    const railY = top + BOX_H / 2;
    const boxes = Array.from({ length: n }, (_, i) => ({ x: PAD + i * (w + gap), y: top, w, h: BOX_H }));
    const gateX = boxes[n - 1].x - gap / 2;
    const resX = width - PAD - 34;
    return {
      wide: true,
      boxes,
      start: [boxes[0].x + w / 2, railY],
      gate: [gateX, railY],
      end: [resX, railY],
      arrows: [
        ...boxes.slice(0, -1).map((b, i) => ({ from: [b.x + b.w, railY], to: [boxes[i + 1].x, railY] })),
        { from: [boxes[n - 1].x + w, railY], to: [resX - 12, railY] },
      ],
      ticks: [],
      gateLine: [[gateX, top - 30], [gateX, top + BOX_H + 8]],
      gateLabel: { x: gateX, y: top + BOX_H + 26, anchor: 'middle' },
      resLabel: { x: width - PAD, y: top + BOX_H + 26, anchor: 'end' },
      warn: [resX, railY + 28],
      height: top + BOX_H + 40,
    };
  }
  const railX = PAD + 30;
  const bx = PAD + 72;
  const w = width - PAD - bx;
  const gap = 34;
  const top = 34;
  const boxes = Array.from({ length: n }, (_, i) => ({ x: bx, y: top + i * (BOX_H + gap), w, h: BOX_H }));
  const cy = (b) => b.y + BOX_H / 2;
  const gateY = boxes[n - 1].y - gap / 2;
  const resY = boxes[n - 1].y + BOX_H + 30;
  return {
    wide: false,
    boxes,
    start: [railX, cy(boxes[0])],
    gate: [railX, gateY],
    end: [railX, resY],
    arrows: boxes.slice(0, -1).map((b, i) => ({ from: [bx + w / 2, b.y + BOX_H], to: [bx + w / 2, boxes[i + 1].y] })),
    ticks: boxes.map((b) => [[railX, cy(b)], [bx, cy(b)]]),
    gateLine: [[PAD, gateY], [width - PAD, gateY]],
    gateLabel: { x: width - PAD, y: gateY - 5, anchor: 'end' },
    resLabel: { x: bx, y: resY + 4, anchor: 'start' },
    warn: [width - PAD - 14, resY - 2],
    height: resY + 22,
  };
}

/**
 * Token on a path: a request carries one identity from the person (or the
 * trigger) through the agent to the data. It is checked at the gate before the
 * last station and either stops there or returns.
 * `status` is 'ok', 'stopped' or 'exposed'.
 */
export default function IdentityPath({ stations, identity, status, gateLabel, runKey, label }) {
  const [ref, width] = useWidth(760);
  const L = layout(width, stations.length);
  const stopped = status === 'stopped';
  const route = [L.start, stopped ? L.gate : L.end];
  const t = useProgress(runKey, 2000);
  const [px, py] = pointOnPolyline(route, t);
  const done = t >= 1;
  const color = status === 'ok' ? 'var(--navy)' : stopped ? 'var(--good)' : 'var(--bad)';
  const soft = stopped ? 'var(--good-soft)' : 'var(--bad-soft)';
  // The identity flag rides above the boxes on wide screens and above the token on the rail when stacked.
  const flag = L.wide ? [px, L.boxes[0].y - 26] : [px, py - 34];

  return (
    <div ref={ref} className="border border-rule bg-paper">
      <svg width={width} height={L.height} viewBox={`0 0 ${width} ${L.height}`} className="block" role="img" aria-label={label}>
        {/* rail and the part travelled */}
        <line x1={L.start[0]} y1={L.start[1]} x2={L.end[0]} y2={L.end[1]} stroke="var(--rule)" strokeWidth="1.25" />
        <line x1={L.start[0]} y1={L.start[1]} x2={px} y2={py} stroke={color} strokeWidth="3" strokeOpacity="0.4" />
        {L.ticks.map(([a, b]) => (
          <line key={a[1]} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--rule)" strokeWidth="1.25" />
        ))}

        {/* arrows between stations give the reading direction */}
        {L.arrows.map(({ from, to }) => {
          const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
          return (
            <g key={`${from}-${to}`}>
              <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="var(--subtle)" strokeWidth="1.25" />
              <path d={arrowHead(to[0], to[1], angle, 4)} fill="var(--subtle)" />
            </g>
          );
        })}

        {/* where a returned request ends up */}
        <circle cx={L.end[0]} cy={L.end[1]} r={5} fill="var(--paper)" stroke="var(--subtle)" strokeWidth="1.25" />

        {/* on wide screens the token is drawn under the boxes, so it passes through each station */}
        {L.wide && (
          <>
            <line x1={px} y1={flag[1] + 18} x2={px} y2={py} stroke={color} strokeWidth="1" />
            <circle cx={px} cy={py} r={8} fill={color} stroke="var(--paper)" strokeWidth="2" />
          </>
        )}

        {/* stations */}
        {stations.map((s, i) => {
          const b = L.boxes[i];
          const last = i === stations.length - 1;
          const tx = L.wide ? b.x + b.w / 2 : b.x + 14;
          const anchor = L.wide ? 'middle' : 'start';
          return (
            <g key={s.title + i}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={last ? 'var(--callout)' : 'var(--surface)'} stroke={last ? color : 'var(--rule)'} strokeWidth={last ? 2 : 1.25} />
              <text x={tx} y={b.y + 24} textAnchor={anchor} fontSize="12.5" fontWeight="600" fill="var(--ink)">
                {s.title}
              </text>
              <text x={tx} y={b.y + 42} textAnchor={anchor} fontSize="11.5" fontFamily={s.mono ? 'var(--font-mono)' : undefined} fill="var(--subtle)">
                {s.sub}
              </text>
            </g>
          );
        })}

        {/* the access gate */}
        <line x1={L.gateLine[0][0]} y1={L.gateLine[0][1]} x2={L.gateLine[1][0]} y2={L.gateLine[1][1]} stroke={color} strokeWidth="1.25" strokeDasharray="4 3" />
        <text x={L.gateLabel.x} y={L.gateLabel.y} textAnchor={L.gateLabel.anchor} fontSize="11" letterSpacing="0.08em" fill="var(--subtle)">
          {gateLabel.toUpperCase()}
        </text>

        {/* result */}
        <text x={L.resLabel.x} y={L.resLabel.y} textAnchor={L.resLabel.anchor} fontSize="11.5" fill={done && !stopped ? color : 'var(--subtle)'}>
          {stopped ? 'nothing returned' : 'returned'}
        </text>

        {/* stacked: the token rides the rail beside the boxes, so it is drawn on top */}
        {!L.wide && <circle cx={px} cy={py} r={8} fill={color} stroke="var(--paper)" strokeWidth="2" />}
        {/* the identity the request carries */}
        <rect x={flag[0] - 28} y={flag[1]} width={56} height={18} fill="var(--surface)" stroke={color} strokeWidth="1" />
        <text x={flag[0]} y={flag[1] + 13} textAnchor="middle" fontSize="11" fontWeight="600" fill={color}>
          {identity}
        </text>

        {done && stopped && (
          <g transform={`translate(${L.gate[0]} ${L.gate[1]})`}>
            <circle r={13} fill={soft} stroke={color} strokeWidth="1.5" />
            <path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke={color} strokeWidth="2" />
          </g>
        )}
        {done && status === 'exposed' && (
          <g transform={`translate(${L.warn[0]} ${L.warn[1]})`}>
            <path d="M-11 9 L0 -10 L11 9 Z" fill={soft} stroke={color} strokeWidth="1.5" />
            <text y={6} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
              !
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
