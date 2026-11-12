import { useWidth } from '../lib/hooks.js';

const WIDE = 520;
const VALUE_W = 78;
const BAR_H = 22;

/**
 * Meter against a limit: one bar per row, one dashed line for the limit.
 * On wide screens labels sit beside the bars; on narrow screens above them,
 * so the values and the limit line always stay on screen.
 */
export default function CostMeter({ rows, activeId, limit, max, format, limitLabel = 'budget', backing = 'var(--surface)', label }) {
  const [ref, width] = useWidth(640);
  const wide = width >= WIDE;
  const x0 = wide ? 186 : 0;
  const x1 = width - VALUE_W;
  const rowH = wide ? 34 : 50;
  const barTop = wide ? 6 : 22;
  const bottom = rows.length * rowH;
  const height = bottom + 20;
  const x = (v) => x0 + (Math.min(v, max) / max) * (x1 - x0);
  const lx = x(limit);

  return (
    <div ref={ref}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={label}>
        {rows.map((r, i) => {
          const top = i * rowH;
          const active = r.id === activeId;
          const over = r.value > limit;
          return (
            <g key={r.id}>
              <text
                x={wide ? x0 - 10 : 0}
                y={wide ? top + barTop + 15 : top + 14}
                textAnchor={wide ? 'end' : 'start'}
                fontSize="12.5"
                fontWeight={active ? 700 : 500}
                fill={active ? 'var(--ink)' : 'var(--muted)'}
              >
                {r.label}
              </text>
              <rect x={x0} y={top + barTop} width={Math.max(2, x(r.value) - x0)} height={BAR_H} fill={active ? (over ? 'var(--bad)' : 'var(--navy)') : 'var(--faint)'} stroke={active ? 'none' : 'var(--rule)'} />
            </g>
          );
        })}
        <line x1={lx} x2={lx} y1={0} y2={bottom + 2} stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="5 4" />
        {/* values go on top of the limit line, on a solid backing so the line never runs through a number */}
        {rows.map((r, i) => {
          const text = format(r.value);
          const vx = x(r.value) + 8;
          const vy = i * rowH + barTop;
          return (
            <g key={r.id}>
              {/* monospace, so the width is the character count times the advance */}
              <rect x={vx - 4} y={vy + 2} width={text.length * 7 + 8} height={18} fill={backing} />
              <text x={vx} y={vy + 15} fontSize="11.5" fontFamily="var(--font-mono)" fill={r.id === activeId ? 'var(--ink)' : 'var(--subtle)'}>
                {text}
              </text>
            </g>
          );
        })}
        <text x={Math.max(x0 + 22, Math.min(x1 - 4, lx))} y={height - 4} textAnchor="middle" fontSize="11" fill="var(--gold)">
          {limitLabel}
        </text>
      </svg>
    </div>
  );
}
