// Small layout helpers so diagrams compute positions from their data and the
// measured width instead of typed-in coordinates.

/** `n` equal columns across `width`: [{ x, w, cx }]. */
export function columns(n, width, { gap = 16, pad = 16 } = {}) {
  const w = (width - pad * 2 - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => {
    const x = pad + i * (w + gap);
    return { x, w, cx: x + w / 2 };
  });
}

/** Rows of the given heights stacked from `top`: [{ y, h, cy }] plus the bottom edge. */
export function stack(heights, { gap = 10, top = 0 } = {}) {
  let y = top;
  const rows = heights.map((h) => {
    const row = { y, h, cy: y + h / 2 };
    y += h + gap;
    return row;
  });
  return { rows, bottom: heights.length ? y - gap : top };
}

/** Point a fraction `t` of the way from `a` to `b`. */
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** A small arrowhead at `[x, y]` pointing along `angle` (radians). Returns an SVG path. */
export function arrowHead(x, y, angle, size = 5) {
  const p = (dx, dy) => [x + dx * Math.cos(angle) - dy * Math.sin(angle), y + dx * Math.sin(angle) + dy * Math.cos(angle)];
  const [ax, ay] = p(0, 0);
  const [bx, by] = p(-size * 1.6, -size);
  const [cx, cy] = p(-size * 1.6, size);
  return `M${ax} ${ay} L${bx} ${by} L${cx} ${cy} Z`;
}
