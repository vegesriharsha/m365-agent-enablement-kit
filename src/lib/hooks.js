import { useEffect, useRef, useState } from 'react';

/** True when the viewer has asked the OS to reduce motion. */
export function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

/**
 * useState that remembers its value in localStorage for this viewer.
 * Storage can be unavailable (private windows, blocked site data), so every
 * access is guarded and the component works without it.
 */
export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [key, value]);
  return [value, setValue];
}

/**
 * Drives a 0..1 progress value along a path with requestAnimationFrame.
 * Restarts whenever `runKey` changes. With reduced motion it jumps to 1.
 */
export function useProgress(runKey, durationMs = 1800, loop = false) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const frame = useRef(0);
  useEffect(() => {
    if (reduced) {
      setT(1);
      return undefined;
    }
    let start;
    const tick = (now) => {
      if (start === undefined) start = now;
      const raw = (now - start) / durationMs;
      if (loop) {
        setT(raw % 1);
        frame.current = requestAnimationFrame(tick);
      } else {
        setT(Math.min(raw, 1));
        if (raw < 1) frame.current = requestAnimationFrame(tick);
      }
    };
    setT(0);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [runKey, durationMs, loop, reduced]);
  return t;
}

/** Point at fraction t along a polyline of [x, y] points. */
export function pointOnPolyline(points, t) {
  if (points.length < 2) return points[0] ?? [0, 0];
  const segs = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segs.push({ x1, y1, x2, y2, len });
    total += len;
  }
  let d = Math.max(0, Math.min(1, t)) * total;
  for (const s of segs) {
    if (d <= s.len) {
      const f = s.len === 0 ? 0 : d / s.len;
      return [s.x1 + (s.x2 - s.x1) * f, s.y1 + (s.y2 - s.y1) * f];
    }
    d -= s.len;
  }
  const last = segs[segs.length - 1];
  return [last.x2, last.y2];
}

export const fmtUSD = (n, digits = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

export const fmtNum = (n, digits = 0) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
