import { useId, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

/* ---------- Page structure ---------- */

export function PageHeader({ eyebrow, title, deck, meta = [] }) {
  return (
    <header className="max-w-[760px]">
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h1 className="font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.025em] text-ink sm:text-[48px]">
        {title}
      </h1>
      {deck && (
        <p className="mt-4 font-display text-[20px] italic font-medium leading-[1.4] text-muted sm:text-[22px]">
          {deck}
        </p>
      )}
      {meta.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-rule py-4 sm:grid-cols-4">
          {meta.map((m) => (
            <div key={m.dt} className="min-w-0">
              <dt className="label">{m.dt}</dt>
              <dd className="mt-1 text-[14px] font-medium text-ink">{m.dd}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

export function Section({ n, title, intro, children, wide = true }) {
  return (
    <section className="mt-16 first-of-type:mt-14">
      <div className="max-w-[760px]">
        <h2 className="h2 flex items-baseline gap-4">
          {n !== undefined && (
            <span className="tabular font-mono text-[12px] font-medium text-navy">{String(n).padStart(2, '0')}</span>
          )}
          <span>{title}</span>
        </h2>
        {intro && <div className="mt-3 text-[16px] leading-[1.65] text-muted">{intro}</div>}
      </div>
      <div className={`mt-6 ${wide ? 'max-w-[1080px]' : 'max-w-[760px]'}`}>{children}</div>
    </section>
  );
}

export function Prose({ children }) {
  return <div className="max-w-[760px] space-y-4 text-[16px] leading-[1.65] text-ink [&_strong]:font-semibold">{children}</div>;
}

/* ---------- Callouts and feedback ---------- */

const toneBorder = {
  navy: 'border-navy',
  gold: 'border-gold',
  good: 'border-good',
  bad: 'border-bad',
};

export function Callout({ tone = 'navy', title, children }) {
  return (
    <div className={`border-l-2 ${toneBorder[tone]} bg-callout px-5 py-4`}>
      {title && <p className="label mb-1 !text-ink">{title}</p>}
      <div className="text-[15px] leading-[1.6] text-ink">{children}</div>
    </div>
  );
}

/** Live explanation that updates with the controls. */
export function Insight({ title = 'What this shows', children, tone = 'navy', stateKey = '' }) {
  return (
    <div aria-live="polite" className={`border-l-2 ${toneBorder[tone]} bg-callout px-5 py-4`}>
      <p className="label mb-1">{title}</p>
      <div className="fade-in space-y-2 text-[15px] leading-[1.6] text-ink" key={stateKey}>
        {children}
      </div>
    </div>
  );
}

const pillTone = {
  neutral: 'border-rule text-muted',
  navy: 'border-navy text-navy',
  gold: 'border-gold text-gold',
  good: 'border-good text-good bg-good-soft',
  bad: 'border-bad text-bad bg-bad-soft',
};

export function Pill({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-xs border px-1.5 py-[1px] text-[10.5px] font-medium uppercase tracking-[0.1em] ${pillTone[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Illustrative({ children = 'Illustrative' }) {
  return <Pill tone="gold">{children}</Pill>;
}

/* ---------- Controls ---------- */

export function Button({ variant = 'primary', className = '', children, ...props }) {
  const styles = {
    primary: 'bg-navy text-on-navy border border-navy hover:opacity-90',
    secondary: 'bg-transparent text-navy border border-navy hover:bg-navy-soft',
    quiet: 'bg-transparent text-muted border border-rule hover:border-subtle hover:text-ink',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-xs px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Segmented({ label, value, options, onChange, size = 'md' }) {
  const id = useId();
  return (
    <div className="min-w-0">
      {label && (
        <p id={id} className="label mb-1.5">
          {label}
        </p>
      )}
      <div role="radiogroup" aria-labelledby={label ? id : undefined} className="flex flex-wrap border border-rule">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={`flex-1 whitespace-nowrap px-3 ${size === 'sm' ? 'py-1 text-[12px]' : 'py-1.5 text-[13px]'} font-medium transition-colors ${
                active ? 'bg-navy text-on-navy' : 'text-muted hover:bg-faint hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-start gap-3 text-left"
    >
      <span
        className={`mt-[3px] inline-flex h-[18px] w-[32px] shrink-0 items-center border transition-colors ${
          checked ? 'border-navy bg-navy' : 'border-rule bg-surface'
        }`}
      >
        <span
          className={`h-[12px] w-[12px] transition-transform ${checked ? 'translate-x-[16px] bg-on-navy' : 'translate-x-[2px] bg-subtle'}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-medium text-ink">{label}</span>
        {hint && <span className="block text-[12.5px] leading-[1.45] text-subtle">{hint}</span>}
      </span>
    </button>
  );
}

export function Slider({ id, label, min, max, step = 1, value, onChange, format = (v) => v, hint }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="label">
          {label}
        </label>
        <span className="tabular font-mono text-[13px] text-ink">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full"
      />
      {hint && <p className="text-[12px] text-subtle">{hint}</p>}
    </div>
  );
}

export function Select({ id, label, value, options, onChange }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="label mb-1.5 block">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xs border border-rule bg-surface px-2 py-1.5 text-[14px] text-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextInput({ id, label, value, onChange, placeholder, mono = false, hint }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="label mb-1.5 block">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xs border border-rule bg-surface px-2 py-1.5 text-[14px] text-ink ${mono ? 'font-mono' : ''}`}
      />
      {hint && <p className="mt-1 text-[12px] text-subtle">{hint}</p>}
    </div>
  );
}

/* ---------- Panels ---------- */

export function Panel({ title, aside, children, className = '' }) {
  return (
    <div className={`min-w-0 border border-rule bg-surface ${className}`}>
      {(title || aside) && (
        <div className="flex items-center justify-between gap-3 border-b border-faint px-4 py-2.5">
          {title && <p className="label !text-ink">{title}</p>}
          {aside}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Code({ children, title }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="min-w-0 border border-rule bg-callout">
      <div className="flex items-center justify-between border-b border-faint px-3 py-1.5">
        <span className="label">{title}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-[12.5px] leading-[1.6] text-ink">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function Sources({ items, verified }) {
  return (
    <footer className="mt-20 max-w-[760px] border-t border-rule pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="h2">Sources</p>
        {verified && <p className="label">Last verified {verified}</p>}
      </div>
      <ul className="mt-3 space-y-1.5 text-[14px]">
        {items.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1.5 text-navy underline decoration-rule underline-offset-4 hover:decoration-navy">
              <span>{s.title}</span>
              <ExternalLink size={12} className="mt-[5px] shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-muted">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[10px] w-[10px] border" style={{ background: i.fill, borderColor: i.stroke ?? i.fill }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
