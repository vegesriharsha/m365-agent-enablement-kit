import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { PageHeader, Section, Insight, Segmented, Slider, Pill, Sources, Callout, Illustrative } from '../components/ui.jsx';
import { VERIFIED, src } from '../data/sources.js';
import { fmtUSD } from '../lib/hooks.js';

/* ---------- 1. Billing hierarchies ---------- */

const trees = {
  ea: {
    label: 'Enterprise Agreement',
    levels: [
      { id: 'enroll', name: 'Enrollment', owner: 'you', note: 'The contract. Enterprise administrators manage it.' },
      { id: 'dept', name: 'Departments', owner: 'you', note: 'Optional grouping with its own spending quota and cost view.' },
      { id: 'acct', name: 'Enrollment accounts', owner: 'you', note: 'Account owners create subscriptions here; give this role to the vending pipeline.' },
      { id: 'sub', name: 'Subscriptions', owner: 'you', note: 'The cost unit the landing zone is built around.' },
      { id: 'rg', name: 'Resource groups', owner: 'you', note: 'Finer cost view inside a subscription.' },
    ],
  },
  mca: {
    label: 'Microsoft Customer Agreement',
    levels: [
      { id: 'ba', name: 'Billing account', owner: 'you', note: 'The agreement, managed in the Azure portal.' },
      { id: 'bp', name: 'Billing profiles', owner: 'you', note: 'One invoice and one payment method each. Most organisations need one.' },
      { id: 'is', name: 'Invoice sections', owner: 'you', note: 'Group costs on the invoice; subscription creators work here.' },
      { id: 'sub', name: 'Subscriptions', owner: 'you', note: 'The cost unit the landing zone is built around.' },
      { id: 'rg', name: 'Resource groups', owner: 'you', note: 'Finer cost view inside a subscription.' },
    ],
  },
  csp: {
    label: 'Cloud Solution Provider',
    levels: [
      { id: 'pba', name: 'Partner’s billing account', owner: 'partner', note: 'Under a Microsoft Partner Agreement. You never see it.' },
      { id: 'cust', name: 'Customer (your organisation)', owner: 'partner', note: 'The partner’s record of you. The partner’s invoice is your bill.' },
      { id: 'sub', name: 'Subscriptions', owner: 'you', note: 'Created by the partner in your tenant. Your main cost scope, once cost visibility is on.' },
      { id: 'rg', name: 'Resource groups', owner: 'you', note: 'Finer cost view inside a subscription.' },
    ],
  },
};

const capabilities = [
  { name: 'Create subscriptions', ea: 'Enrollment account owner', mca: 'Invoice section role', csp: 'Partner only; you adopt by ID' },
  { name: 'See costs in the portal', ea: true, mca: true, csp: 'After the partner turns on cost visibility; shown at retail prices' },
  { name: 'Budgets and cost views at management-group scope', ea: true, mca: 'Not supported; use billing profile or invoice section scopes', csp: false },
  { name: 'Budgets per subscription', ea: true, mca: true, csp: true },
  { name: 'Cost allocation rules', ea: true, mca: true, csp: false },
  { name: 'Tag inheritance in Cost Management', ea: true, mca: true, csp: true },
  { name: 'Dev/Test subscription offer', ea: true, mca: true, csp: false },
  { name: 'Buy reservations and savings plans', ea: true, mca: true, csp: 'Partner buys, or grants you permission per subscription' },
];

function Cell({ v }) {
  if (v === true) return <span className="inline-flex items-center gap-1 text-good"><Check size={14} /> Yes</span>;
  if (v === false) return <span className="inline-flex items-center gap-1 text-bad"><X size={14} /> No</span>;
  return <span className="text-ink">{v}</span>;
}

function Hierarchy() {
  const [ag, setAg] = useState('csp');
  const [sel, setSel] = useState('sub');
  const T = trees[ag];
  const L = T.levels.find((l) => l.id === sel) ?? T.levels[T.levels.length - 2];
  return (
    <>
      <div className="max-w-[560px]">
        <Segmented
          label="How you buy Azure"
          value={ag}
          onChange={(v) => {
            setAg(v);
            setSel('sub');
          }}
          options={[
            { value: 'ea', label: 'EA' },
            { value: 'mca', label: 'MCA' },
            { value: 'csp', label: 'CSP' },
          ]}
        />
      </div>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ol className="space-y-0">
          {T.levels.map((l, i) => (
            <li key={l.id} className="relative" style={{ paddingLeft: `${i * 22}px` }}>
              {i > 0 && <span className="absolute top-0 h-[14px] w-px bg-rule" style={{ left: `${(i - 1) * 22 + 12}px` }} />}
              <button
                type="button"
                aria-pressed={sel === l.id}
                onClick={() => setSel(l.id)}
                className={`mt-[14px] flex w-full items-center justify-between gap-3 border px-3 py-2.5 text-left transition-colors ${
                  sel === l.id ? 'border-navy bg-navy text-on-navy' : l.owner === 'partner' ? 'border-dashed border-rule bg-callout text-ink' : 'border-rule bg-surface text-ink hover:border-subtle'
                }`}
              >
                <span className="text-[14px] font-medium">{l.name}</span>
                <Pill tone={l.owner === 'partner' ? 'gold' : 'navy'} className={sel === l.id ? '!border-on-navy !text-on-navy' : ''}>
                  {l.owner === 'partner' ? 'Partner' : 'You'}
                </Pill>
              </button>
            </li>
          ))}
        </ol>
        <div className="fade-in border border-rule bg-paper p-5" key={`${ag}-${L.id}`}>
          <p className="label">{T.label}</p>
          <h3 className="mt-1 font-display text-[28px] font-semibold leading-[1.1] text-ink">{L.name}</h3>
          <p className="mt-3 text-[15px] leading-[1.6] text-ink">{L.note}</p>
          {ag === 'csp' && (
            <p className="mt-3 text-[14px] leading-[1.6] text-muted">
              Under CSP the subscription is the highest scope you control, so let it carry the cost boundary: one per workload and
              environment, tagged, with its own budget.
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 overflow-x-auto border-y border-rule">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-rule">
              {['Capability', 'EA', 'MCA', 'CSP'].map((h) => (
                <th key={h} className={`label px-3 py-2.5 font-medium ${h.toLowerCase() === ag ? '!text-navy' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capabilities.map((c) => (
              <tr key={c.name} className="border-b border-faint align-top last:border-b-0">
                <td className="px-3 py-2.5 text-ink">{c.name}</td>
                {['ea', 'mca', 'csp'].map((k) => (
                  <td key={k} className={`px-3 py-2.5 text-[13.5px] ${k === ag ? 'bg-navy-soft' : ''}`}>
                    <Cell v={c[k]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- 2. Commitments on a steady estate ---------- */

// Deterministic wobble so the chart is the same on every load.
const wobble = (i) => Math.sin(i * 1.7) * 0.04 + Math.sin(i * 0.6) * 0.03;

function Commitments() {
  const [shape, setShape] = useState('flat');
  const [coverage, setCoverage] = useState(70);
  const [discount, setDiscount] = useState(30);
  const [hover, setHover] = useState(null);
  const base = 40000;

  const months = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const trend = shape === 'flat' ? 1 : shape === 'grow' ? 1 + i * 0.02 : 1 - i * 0.02;
        const usage = base * trend * (1 + wobble(i));
        const commit = base * (coverage / 100);
        const committedCost = commit * (1 - discount / 100);
        const overflow = Math.max(0, usage - commit);
        const unused = Math.max(0, commit - usage);
        return { i, usage, cost: committedCost + overflow, unused };
      }),
    [shape, coverage, discount],
  );
  const payg = months.reduce((a, m) => a + m.usage, 0);
  const withC = months.reduce((a, m) => a + m.cost, 0);
  const unused = months.reduce((a, m) => a + m.unused, 0);
  const saving = payg - withC;

  const W = 640;
  const H = 220;
  const pad = { l: 52, r: 16, t: 14, b: 26 };
  const maxV = Math.max(...months.map((m) => Math.max(m.usage, m.cost))) * 1.08;
  const x = (i) => pad.l + (i / 23) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / maxV) * (H - pad.t - pad.b);
  const line = (key) => months.map((m) => `${x(m.i)},${y(m[key])}`).join(' ');
  const h = hover ?? 23;

  return (
    <>
      <div className="mb-3">
        <Illustrative>Illustrative discounts</Illustrative>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Segmented
          label="Usage over two years"
          value={shape}
          onChange={setShape}
          options={[
            { value: 'flat', label: 'Flat' },
            { value: 'grow', label: 'Growing' },
            { value: 'shrink', label: 'Shrinking' },
          ]}
        />
        <Slider id="b-cov" label="Commit to (share of today’s baseline)" min={0} max={110} step={5} value={coverage} onChange={setCoverage} format={(v) => `${v}%`} />
        <Slider id="b-disc" label="Discount on committed spend" min={10} max={60} step={5} value={discount} onChange={setDiscount} format={(v) => `${v}%`} hint="Depends on product, term and region" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          ['Pay as you go, 24 months', fmtUSD(payg), 'text-muted'],
          ['With commitment', fmtUSD(withC), 'text-ink'],
          ['Saved', `${saving >= 0 ? '' : '−'}${fmtUSD(Math.abs(saving))}`, saving >= 0 ? 'text-good' : 'text-bad'],
        ].map(([l, v, c]) => (
          <div key={l} className="border-l border-rule pl-3">
            <p className="label">{l}</p>
            <p className={`tabular font-mono text-[22px] leading-tight ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="relative mt-4 border border-rule bg-surface p-4">
        <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-[2px] w-[16px] bg-subtle" /> Pay as you go</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-[2px] w-[16px] bg-navy" /> With commitment</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-[10px] w-[10px] bg-bad-soft border border-bad" /> Paid but unused</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          role="img"
          aria-label="Monthly cost, pay as you go against commitment"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            setHover(Math.max(0, Math.min(23, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * 23))));
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={W - pad.r} y1={y(maxV * f)} y2={y(maxV * f)} stroke="var(--faint)" />
              <text x={pad.l - 8} y={y(maxV * f) + 4} textAnchor="end" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--subtle)">
                {`$${Math.round((maxV * f) / 1000)}k`}
              </text>
            </g>
          ))}
          {months.map((m) =>
            m.unused > 0 ? (
              <rect key={m.i} x={x(m.i) - 6} y={y(m.usage + m.unused)} width={12} height={Math.max(1, y(m.usage) - y(m.usage + m.unused))} fill="var(--bad-soft)" stroke="var(--bad)" strokeWidth="0.75" />
            ) : null,
          )}
          <polyline points={line('usage')} fill="none" stroke="var(--subtle)" strokeWidth="2" />
          <polyline points={line('cost')} fill="none" stroke="var(--navy)" strokeWidth="2" />
          {[0, 6, 12, 18, 23].map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--subtle)">
              {`M${i + 1}`}
            </text>
          ))}
          <line x1={x(h)} x2={x(h)} y1={pad.t} y2={H - pad.b} stroke="var(--rule)" />
          <circle cx={x(h)} cy={y(months[h].usage)} r={4} fill="var(--subtle)" stroke="var(--surface)" strokeWidth="2" />
          <circle cx={x(h)} cy={y(months[h].cost)} r={4} fill="var(--navy)" stroke="var(--surface)" strokeWidth="2" />
        </svg>
        <div className="pointer-events-none absolute top-12 border border-rule bg-surface px-2 py-1 text-[12px]" style={{ left: `${Math.min(70, (x(h) / W) * 100)}%` }}>
          <span className="text-subtle">Month {h + 1} · </span>
          <span className="tabular font-mono text-muted">{fmtUSD(months[h].usage)}</span>
          <span className="text-subtle"> → </span>
          <span className="tabular font-mono text-ink">{fmtUSD(months[h].cost)}</span>
        </div>
      </div>
      <div className="mt-4">
        <Insight tone={unused > payg * 0.03 ? 'bad' : saving > 0 ? 'good' : 'navy'} stateKey={`${shape}-${coverage}-${discount}`}>
          <p>
            {unused > payg * 0.03
              ? `You’d pay ${fmtUSD(unused)} for commitment you didn’t use. Commit to the floor of your usage, not the average, and never above it when usage may shrink.`
              : shape === 'flat'
                ? 'A flat estate is the easy case: usage barely moves, so committing to most of the baseline pays off with almost no waste. Wait two or three months to learn the baseline first.'
                : shape === 'grow'
                  ? 'With growth, the commitment covers a shrinking share. Add more commitment later rather than buying ahead of demand.'
                  : 'A shrinking estate punishes long commitments. Keep coverage low or choose shorter terms.'}
          </p>
        </Insight>
      </div>
    </>
  );
}

export default function Billing() {
  return (
    <article>
      <PageHeader
        eyebrow="Explorer · Billing and cost"
        title="Make the subscription the unit of cost"
        deck="How each way of buying Azure is structured, what you can and can’t see under each, and how a steady estate earns its discounts."
        meta={[
          { dt: 'Agreements', dd: 'EA, MCA, CSP' },
          { dt: 'Cost unit', dd: 'Subscription' },
          { dt: 'Required tags', dd: '4' },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Who controls what" intro="Pick how you buy Azure and select a level. Dashed levels belong to the partner.">
        <Hierarchy />
      </Section>

      <Section n={2} title="Commitments on a steady estate" intro="Reservations and savings plans trade a commitment for a discount. Usage that stays flat is exactly what they reward; usage that falls is what they punish.">
        <Commitments />
        <div className="mt-5">
          <Callout tone="gold" title="Read the terms before you buy">
            Savings plans can’t be cancelled or exchanged. Reservations bought from 1 February 2027 for services that savings plans
            cover can’t be exchanged; ones bought before then keep a final exchange. Under CSP, the partner buys or grants permission
            per subscription and sets the price, so confirm the terms with the partner first.
          </Callout>
        </div>
      </Section>

      <Section n={3} title="Showback in four tags" wide={false}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['costcenter', 'Who pays. Inherited from the subscription by policy, and by Cost Management tag inheritance.'],
            ['app', 'Which workload. Stable short name from the register, same as in resource names.'],
            ['env', 'prod, uat, dev or sbx. Lets finance separate run cost from build cost.'],
            ['owner', 'An Entra group, never a person, so it survives people moving on.'],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-rule pt-3">
              <p className="font-mono text-[14px] text-navy">{t}</p>
              <p className="mt-1 text-[14px] leading-[1.55] text-muted">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[15px] leading-[1.65] text-ink">
          Budget every subscription when it’s vended, with actual and forecast alerts. Export cost data daily from each subscription
          into one report and roll it up by tag; under CSP and MCA, Cost Management doesn’t offer management-group views.
        </p>
      </Section>

      <Sources verified={VERIFIED} items={[src.cafCsp, src.cafMca, src.cafEa, src.partnerCost, src.costScopes, src.tagInheritance, src.savingsPlan, src.reservationExchange, src.lighthouseCsp, src.finopsAllocation]} />
    </article>
  );
}
