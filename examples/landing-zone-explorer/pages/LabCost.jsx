import { useMemo, useState } from 'react';
import { PageHeader, Section, Insight, Segmented, Pill, Sources, Callout, Button } from '../components/ui.jsx';
import { VERIFIED, src } from '../data/sources.js';
import { lab as p, logs, PRICES_VERIFIED, PRICE_REGION, HOURS_PER_MONTH } from '../data/prices.js';
import { fmtUSD } from '../lib/hooks.js';

const credits = [
  { value: 'vsp', label: 'Visual Studio Pro · $50/mo', amount: 50, period: 'month', after: 'Resources stop until the credit renews next month, as long as the spending limit stays on.' },
  { value: 'vse', label: 'Visual Studio Ent · $150/mo', amount: 150, period: 'month', after: 'Resources stop until the credit renews next month, as long as the spending limit stays on.' },
  { value: 'free', label: 'Free account · $200 once', amount: 200, period: '30 days', after: 'The credit expires after 30 days. Continuing means upgrading to pay-as-you-go, which has no spending limit.' },
];

const usage = [
  { value: 0, label: 'Off' },
  { value: 16, label: 'Weekend' },
  { value: 176, label: 'Workdays' },
  { value: HOURS_PER_MONTH, label: 'Always' },
];

const components = [
  { id: 'gov', name: 'Management groups, Azure Policy, RBAC', group: 'Free', fixed: 0, note: 'No charge. The whole governance layer can run for nothing.' },
  { id: 'law', name: 'Log Analytics workspace (light use)', group: 'Free', fixed: 0, note: `First ${logs.analyticsFreeGBPerMonth} GB a month of Analytics ingestion is free; a lab stays under it.` },
  { id: 'vnet', name: 'Hub and spoke networks, peering', group: 'Free', fixed: 0, note: 'Networks are free; peering charges per GB, which a lab barely moves.' },
  { id: 'cspm', name: 'Defender for Cloud foundational CSPM', group: 'Free', fixed: 0, note: 'Free posture checks and secure score.' },
  { id: 'dns', name: 'Private DNS zones (three)', group: 'Cheap', fixed: 3 * p.privateDnsZoneMonth, note: 'Per zone per month.' },
  { id: 'kv', name: 'Key vault', group: 'Cheap', fixed: 0.05, note: `${fmtUSD(p.keyVaultPer10kOps, 2)} per 10,000 operations.` },
  { id: 'vm', name: 'Test VM (B2ats v2, Linux)', group: 'Cheap', hourly: p.vmB2atsV2Hour, def: 176, note: 'Add auto-shutdown; disks cost a little even when stopped.' },
  { id: 'pe', name: 'Private endpoint (one)', group: 'Cheap', hourly: p.privateEndpointHour, def: HOURS_PER_MONTH, note: 'Per endpoint per hour, plus data processed.' },
  { id: 'pip', name: 'Standard public IP (one)', group: 'Cheap', hourly: p.publicIpHour, def: 0, note: 'Charged while it exists, attached or not.' },
  { id: 'nat', name: 'NAT gateway', group: 'Deploy and destroy', hourly: p.natGatewayHour, def: 0, note: 'Per hour plus per GB.' },
  { id: 'bas', name: 'Bastion Basic', group: 'Deploy and destroy', hourly: p.bastionBasicHour, def: 0, note: 'The Developer tier is free in supported regions; use it if yours has it.' },
  { id: 'vpn', name: 'VPN gateway (VpnGw1AZ)', group: 'Deploy and destroy', hourly: p.vpnGw1AZHour, def: 0, note: 'Zone-redundant SKUs only for new gateways. Takes 30 minutes or more to create.' },
  { id: 'afwb', name: 'Azure Firewall Basic', group: 'Deploy and destroy', hourly: p.firewallBasicHour, def: 0, note: 'Plus data processed. The cheapest way to see real firewall rules.' },
  { id: 'vwan', name: 'Virtual WAN hub (Standard)', group: 'Deploy and destroy', hourly: p.vwanStandardHubHour, def: 0, note: 'Per hub hour, plus connections and data.' },
  { id: 'res', name: 'DNS Private Resolver (inbound endpoint)', group: 'Deploy and destroy', monthlyIfOn: p.dnsResolverEndpointMonth, def: 0, note: 'Priced per endpoint per month; a lab rarely needs one.' },
  { id: 'afws', name: 'Azure Firewall Standard', group: 'Deploy and destroy', hourly: p.firewallStandardHour, def: 0, note: 'What production uses. Read about it; don’t run it on credits.' },
];

const presets = {
  gov: { label: 'Governance only', on: { vm: 0, pe: 0 } },
  hub: { label: 'Hub weekend test', on: { vm: 16, pe: HOURS_PER_MONTH, afwb: 16, bas: 16 } },
  replica: { label: 'Full replica, always on', on: { vm: HOURS_PER_MONTH, pe: HOURS_PER_MONTH, pip: HOURS_PER_MONTH, afwb: HOURS_PER_MONTH, vpn: HOURS_PER_MONTH, bas: HOURS_PER_MONTH, res: HOURS_PER_MONTH } },
};

function monthly(c, hours) {
  if (c.hourly !== undefined) return c.hourly * hours;
  if (c.monthlyIfOn !== undefined) return c.monthlyIfOn * (hours / HOURS_PER_MONTH);
  return c.fixed;
}

export default function LabCost() {
  const [credit, setCredit] = useState('vsp');
  const [hours, setHours] = useState(Object.fromEntries(components.map((c) => [c.id, c.def ?? HOURS_PER_MONTH])));
  const C = credits.find((c) => c.value === credit);

  const rows = useMemo(() => components.map((c) => ({ ...c, cost: monthly(c, hours[c.id]) })), [hours]);
  const burn = rows.reduce((a, r) => a + r.cost, 0);
  const pct = burn / C.amount;
  const days = burn > 0 ? Math.min(99, (C.amount / burn) * 30) : Infinity;
  const top = [...rows].sort((a, b) => b.cost - a.cost).filter((r) => r.cost > 0).slice(0, 3);

  const applyPreset = (k) => {
    const on = presets[k].on;
    setHours(Object.fromEntries(components.map((c) => [c.id, c.hourly !== undefined || c.monthlyIfOn !== undefined ? on[c.id] ?? 0 : HOURS_PER_MONTH])));
  };

  const W = 640;
  const H = 150;
  const pad = { l: 44, r: 16, t: 12, b: 24 };
  const x = (d) => pad.l + (d / 30) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / C.amount) * (H - pad.t - pad.b);
  const zeroDay = Math.min(30, days);

  return (
    <article>
      <PageHeader
        eyebrow="Dashboard · Lab cost meter"
        title="How far can free credits take you?"
        deck="Plan a personal landing-zone lab that never touches your card. Switch components on, choose how long they run, and watch the credit burn."
        meta={[
          { dt: 'Credit', dd: `${fmtUSD(C.amount)} / ${C.period}` },
          { dt: 'Monthly burn', dd: fmtUSD(burn, 2) },
          { dt: 'Prices', dd: `${PRICE_REGION}, ${PRICES_VERIFIED}` },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Your credit" intro="Credits with a spending limit are the only way to guarantee $0 out of pocket: when they run out, resources stop instead of billing your card.">
        <div className="grid items-end gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Segmented label="Credit" value={credit} onChange={setCredit} options={credits} />
          <div className="flex flex-wrap gap-2">
            <span className="label w-full">Start from</span>
            {Object.entries(presets).map(([k, v]) => (
              <Button key={k} variant="secondary" onClick={() => applyPreset(k)}>
                {v.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 border border-rule bg-surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="label !text-ink">Monthly burn against credit</p>
            <p className="tabular font-mono text-[14px] text-ink">
              {fmtUSD(burn, 2)} / {fmtUSD(C.amount)}
            </p>
          </div>
          <div className="mt-2 h-[14px] w-full bg-faint">
            <div
              className={`h-full transition-all duration-500 ${pct > 1 ? 'bg-bad' : pct > 0.8 ? 'bg-gold' : 'bg-navy'}`}
              style={{ width: `${Math.min(100, pct * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill tone={pct > 1 ? 'bad' : pct > 0.8 ? 'gold' : 'good'}>{pct > 1 ? 'Runs out early' : pct > 0.8 ? 'Tight' : 'Fits'}</Pill>
            <span className="text-[13px] text-muted">
              {pct > 1 ? `Credit gone on about day ${Math.floor(days)}.` : `${Math.round(pct * 100)}% of the credit used each ${C.period === 'month' ? 'month' : '30 days'}.`}
            </span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 block w-full" role="img" aria-label="Credit remaining over 30 days">
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line x1={pad.l} x2={W - pad.r} y1={y(C.amount * f)} y2={y(C.amount * f)} stroke="var(--faint)" />
                <text x={pad.l - 8} y={y(C.amount * f) + 4} textAnchor="end" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--subtle)">
                  {fmtUSD(C.amount * f)}
                </text>
              </g>
            ))}
            {[0, 10, 20, 30].map((d) => (
              <text key={d} x={x(d)} y={H - 6} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--subtle)">
                day {d}
              </text>
            ))}
            <polyline
              points={`${x(0)},${y(C.amount)} ${x(zeroDay)},${y(Math.max(0, C.amount - (burn / 30) * zeroDay))}${zeroDay < 30 ? ` ${x(30)},${y(0)}` : ''}`}
              fill="none"
              stroke={pct > 1 ? 'var(--bad)' : 'var(--navy)'}
              strokeWidth="2"
            />
            {zeroDay < 30 && (
              <g>
                <circle cx={x(zeroDay)} cy={y(0)} r={5} fill="var(--bad)" stroke="var(--surface)" strokeWidth="2" />
                <text x={x(zeroDay) + 8} y={y(0) - 8} fontSize="11" fill="var(--bad)">
                  stops here
                </text>
              </g>
            )}
          </svg>
        </div>
        <div className="mt-4">
          <Insight stateKey={`${credit}-${Math.round(burn)}`} tone={pct > 1 ? 'bad' : pct > 0.8 ? 'gold' : 'good'}>
            <p>
              {pct > 1
                ? `${top.map((r) => r.name).join(', ')} ${top.length === 1 ? 'is' : 'are'} the expensive part. Run them for a weekend, learn, then destroy them with Terraform. ${C.after}`
                : `This lab fits. The governance layer, which is most of what a landing zone is, costs nothing; the network appliances are what eat credit. ${C.after}`}
            </p>
          </Insight>
        </div>
      </Section>

      <Section n={2} title="Switch components on and off" intro="Weekend is 16 hours a month, workdays 176, always 730. Fixed-price items are always on.">
        {['Free', 'Cheap', 'Deploy and destroy'].map((g) => (
          <div key={g} className="mb-6">
            <p className="label mb-2">{g}</p>
            <div className="border-y border-rule">
              {rows
                .filter((r) => r.group === g)
                .map((r) => (
                  <div key={r.id} className="grid items-center gap-2 border-b border-faint py-2.5 last:border-b-0 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_90px]">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-ink">{r.name}</p>
                      <p className="text-[12px] leading-[1.4] text-subtle">{r.note}</p>
                    </div>
                    <div>
                      {r.hourly !== undefined || r.monthlyIfOn !== undefined ? (
                        <Segmented size="sm" value={hours[r.id]} onChange={(v) => setHours((h) => ({ ...h, [r.id]: v }))} options={usage} />
                      ) : (
                        <span className="text-[12.5px] text-muted">Always on</span>
                      )}
                    </div>
                    <span className={`tabular text-right font-mono text-[13px] ${r.cost > C.amount * 0.5 ? 'text-bad' : 'text-ink'}`}>{fmtUSD(r.cost, 2)}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
        <p className="text-[12.5px] leading-[1.5] text-subtle">
          {PRICE_REGION} retail list prices from the Azure Retail Prices API, {PRICES_VERIFIED}. Excludes data processing, disks and
          taxes. Credits are consumed at these list prices.
        </p>
      </Section>

      <Section n={3} title="Rules for a $0 lab" wide={false}>
        <ul className="space-y-2.5 text-[15px] leading-[1.6] text-ink">
          {[
            'Use a credit with a spending limit, and never remove the limit or add a card for overage.',
            'Build everything with Terraform, so the expensive parts are one apply to create and one destroy to remove.',
            'Put a budget with an alert at 50% on the subscription on day one.',
            'Keep one subscription for the lab; the accelerator expects several, so map platform roles onto resource groups instead.',
            'Delete resource groups you’re done with the same day; a forgotten gateway is the usual way credit disappears.',
          ].map((x) => (
            <li key={x} className="flex gap-3">
              <span className="mt-[10px] h-[5px] w-[5px] shrink-0 bg-navy" />
              {x}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Callout tone="gold" title="Check the offer terms yourself">
            Credit amounts and spending-limit rules belong to the offer you sign up for. Read them on Microsoft’s pages before you
            build, and check your remaining credit in the portal, not here.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.freeAccount, src.vsCredits, src.spendingLimit, src.budgets, src.retailPrices, src.pricingCalc]} />
    </article>
  );
}
