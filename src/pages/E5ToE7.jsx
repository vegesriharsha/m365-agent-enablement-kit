import { useState } from 'react';
import { Section, Insight, Segmented, Toggle, Slider, Pill, Callout, Illustrative } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { fmtUSD } from '../lib/hooks.js';

/*
 * Pattern 13, meter against a limit. Monthly list cost of each licence
 * configuration against a budget line the reader sets, and the waves each
 * configuration unlocks. Unit prices are US list prices read on 5 Nov 2026;
 * every scenario total is illustrative.
 */
const PRICE_DATE = '5 Nov 2026';
const PRICE = { e5: 60, e7: 99, copilot: 30, a365: 15, pack: 200 };

const configs = [
  { id: 'e5', label: 'E5', perUser: PRICE.e5, copilot: false, a365: false, parts: ['Microsoft 365 E5'] },
  { id: 'e5a', label: 'E5 + Agent 365', perUser: PRICE.e5 + PRICE.a365, copilot: false, a365: true, parts: ['Microsoft 365 E5', 'Agent 365'] },
  { id: 'e5c', label: 'E5 + Copilot', perUser: PRICE.e5 + PRICE.copilot, copilot: true, a365: false, parts: ['Microsoft 365 E5', 'Microsoft 365 Copilot'] },
  { id: 'e5ca', label: 'E5 + Copilot + Agent 365', perUser: PRICE.e5 + PRICE.copilot + PRICE.a365, copilot: true, a365: true, parts: ['Microsoft 365 E5', 'Microsoft 365 Copilot', 'Agent 365'] },
  { id: 'e7', label: 'E7', perUser: PRICE.e7, copilot: true, a365: true, entra: true, parts: ['Microsoft 365 E5', 'Microsoft 365 Copilot', 'Agent 365', 'Entra Suite'] },
];
const userOptions = [
  { value: 25, label: '25 sponsors' },
  { value: 100, label: '100 users' },
  { value: 350, label: 'All 350' },
];
const waves = [
  { id: 0, name: 'Foundations', needs: () => true, why: 'Foundational Agent 365 comes with Microsoft 365 plans.' },
  { id: 1, name: 'Personal agents', needs: (c) => c.a365, why: 'Pilot agents need a licensed sponsor for premium protection.' },
  { id: 2, name: 'Shared agents', needs: (c) => c.copilot, why: 'Managed environments need a standalone licence or meter per active user; the Copilot Studio entitlement in Microsoft 365 Copilot qualifies for Copilot Studio features only.' },
  { id: 3, name: 'Actions and flows', needs: (c) => c.copilot, why: 'Agent use under the user’s identity is uncharged with a Copilot licence, within fair-use limits; computer use and flows on other triggers are still charged.' },
  { id: 4, name: 'Autonomous', needs: (c, pack) => c.copilot && pack, why: 'Cowork needs a Copilot licence plus credits; autonomous runs are always charged.' },
];

export default function E5ToE7() {
  const [users, setUsers] = useState(25);
  const [cfgId, setCfgId] = useState('e5ca');
  const [pack, setPack] = useState(false);
  const [budget, setBudget] = useState(25 * PRICE.e7);
  const cfg = configs.find((c) => c.id === cfgId);
  const monthly = (c) => c.perUser * users + (pack ? PRICE.pack : 0);
  const total = monthly(cfg);
  const pct = total / budget;
  const e7Total = monthly(configs.find((c) => c.id === 'e7'));
  const maxBar = Math.max(budget, ...configs.map(monthly)) * 1.08;

  const changeUsers = (u) => {
    setUsers(u);
    setBudget(u * PRICE.e7);
  };

  const W = 680;
  const ROW = 34;
  const pad = { l: 190, r: 90, t: 8, b: 8 };
  const H = pad.t + configs.length * ROW + pad.b;
  const x = (v) => pad.l + (v / maxBar) * (W - pad.l - pad.r);

  let tone = 'navy';
  let text;
  if (cfg.id === 'e5') text = 'No Copilot and no Agent 365 premium. Only wave 0 opens, with the foundational registry. Copilot Chat users can still build lightweight agents, so “agents off” needs the admin settings, not just the licence.';
  else if (cfg.id === 'e5a') text = 'The pilot shape: Agent 365 for the sponsors without Copilot for everyone. Pilot agents get premium protection, but managed environments and agent use at scale still need Copilot or a Copilot Studio licence.';
  else if (cfg.id === 'e5c') text = 'Waves 1 to 3 open for makers and users, but Agent 365 premium is missing, so pilot agents get foundational protection only: registry, block and delete, no policy templates or Conditional Access.';
  else if (cfg.id === 'e5ca') {
    tone = total > e7Total ? 'bad' : 'gold';
    text = `Everything E7 brings except the Entra Suite, at ${fmtUSD(cfg.perUser)} per user against E7’s ${fmtUSD(PRICE.e7)}. At ${users} users that is ${fmtUSD(total - e7Total)} a month more than E7. Choose this shape only for a subset, such as the 25 sponsors.`;
  } else text = `All five waves can open at ${fmtUSD(PRICE.e7)} per user, with the Entra Suite included. Copilot Studio credits are still extra: no Microsoft page says E7 includes a capacity pack.`;
  if (pct > 1) tone = 'bad';
  const over = pct > 1 ? ` This configuration is ${fmtUSD(total - budget)} a month over the budget line.` : '';

  return (
    <PageShell
      header={{
        eyebrow: 'Custom page · E5 to E7',
        title: 'What each licence adds, wave by wave, and what it costs at list price',
        deck: 'Choose a user count and a licence configuration, then watch the monthly list cost against a budget line and the waves that open.',
        meta: [{ dt: 'Prices', dd: `US list, ${PRICE_DATE}` }, { dt: 'Users', dd: String(users) }],
      }}
      sources={['msSecurityEnterprisePlansPricing', 'agent365ProductPage', 'msCopilotEnterprisePricing', 'compareE3E5E7', 'agent365LicensingFaq', 'agent365GaM365Blog', 'msCopilotStudioPricing', 'msCopilotStudioLicensingGuidance', 'copilotCreditsOverview', 'copilotSpendingPolicies', 'coworkAdminGovernance', 'ppManagedEnvironmentLicensing', 'csBillingRates']}
    >
      <Section n={1} title="Pick a configuration" intro="Unit prices are US list prices per user per month, paid yearly, as read on the dates shown. Microsoft says prices may vary by agreement.">
        <div className="mb-3 flex flex-wrap gap-2">
          <Illustrative>Illustrative scenarios</Illustrative>
          <Pill tone="neutral">Unit prices: US list, {PRICE_DATE}</Pill>
        </div>
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          <Segmented label="Users" value={users} onChange={changeUsers} options={userOptions} />
          <Segmented label="Configuration" value={cfgId} onChange={setCfgId} options={configs.map((c) => ({ value: c.id, label: c.label }))} />
          <Toggle label="Add a Copilot credit capacity pack" hint={`${fmtUSD(PRICE.pack)} a month for 25,000 credits, tenant-wide, billed annually; pay-as-you-go is USD 0.01 per credit instead`} checked={pack} onChange={setPack} />
          <Slider id="budget" label="Budget line per month" min={0} max={Math.ceil((users * 120 + PRICE.pack) / 100) * 100} step={50} value={budget} onChange={setBudget} format={(v) => fmtUSD(v)} hint="Defaults to E7 for the chosen users" />
        </div>

        <div className="mt-6 border border-rule bg-surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="label !text-ink">Monthly list cost against the budget line</p>
            <p className="font-mono text-[14px] tabular-nums text-ink">
              {fmtUSD(total)} / {fmtUSD(budget)}
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="block w-full min-w-[560px]" role="img" aria-label={`${cfg.label} costs ${fmtUSD(total)} a month against a budget of ${fmtUSD(budget)}`}>
              {configs.map((c, i) => {
                const v = monthly(c);
                const yTop = pad.t + i * ROW + 6;
                const active = c.id === cfgId;
                const overBudget = v > budget;
                return (
                  <g key={c.id}>
                    <text x={pad.l - 10} y={yTop + 15} textAnchor="end" fontSize="12" fontWeight={active ? 700 : 500} fill={active ? 'var(--ink)' : 'var(--muted)'}>
                      {c.label}
                    </text>
                    <rect x={pad.l} y={yTop} width={Math.max(2, x(v) - pad.l)} height={22} fill={active ? (overBudget ? 'var(--bad)' : 'var(--navy)') : 'var(--faint)'} stroke={active ? 'none' : 'var(--rule)'} />
                    <text x={x(v) + 8} y={yTop + 15} fontSize="11.5" fontFamily="var(--font-mono)" fill={active ? 'var(--ink)' : 'var(--subtle)'}>
                      {fmtUSD(v)}
                    </text>
                  </g>
                );
              })}
              <line x1={x(budget)} x2={x(budget)} y1={pad.t} y2={H - pad.b} stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="5 4" />
              <text x={x(budget)} y={H - 1} textAnchor="middle" fontSize="10" fill="var(--gold)">
                budget
              </text>
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill tone={pct > 1 ? 'bad' : pct > 0.95 ? 'gold' : 'good'}>{pct > 1 ? 'Over the line' : pct > 0.95 ? 'At the line' : 'Under the line'}</Pill>
            <span className="text-[13px] text-muted">
              {fmtUSD(cfg.perUser)} per user per month for {cfg.parts.join(' + ')}
              {pack ? `, plus ${fmtUSD(PRICE.pack)} for the credit pack` : ''}. About {fmtUSD(total * 12)} a year at list.
            </span>
          </div>
        </div>

        <div className="mt-4 border border-rule bg-surface p-4">
          <p className="label mb-2">Waves this configuration can open</p>
          <ol className="grid gap-2 sm:grid-cols-5">
            {waves.map((w) => {
              const open = w.needs(cfg, pack);
              return (
                <li key={w.id} className={`border p-2.5 ${open ? 'border-navy bg-navy-soft' : 'border-rule bg-paper'}`}>
                  <p className="font-mono text-[11px] text-navy">WAVE {w.id}</p>
                  <p className="text-[13px] font-semibold text-ink">{w.name}</p>
                  <Pill tone={open ? 'good' : 'neutral'} className="mt-1.5">{open ? 'Opens' : 'Blocked'}</Pill>
                  <p className="mt-1.5 text-[11.5px] leading-[1.4] text-subtle">{w.why}</p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-4">
          <Insight stateKey={`${cfgId}-${users}-${pack}-${budget}`} tone={tone}>
            <p>
              {text}
              {over}
            </p>
          </Insight>
        </div>
      </Section>

      <Section n={2} title="The unit prices" intro="Each figure is on the Microsoft page it is cited from, as read on the date shown. Taxes, agreements and regional prices change them.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="label py-2 pr-3 font-medium">Licence</th>
                <th className="label py-2 pr-3 font-medium">USD per user per month</th>
                <th className="label py-2 font-medium">What it adds for agents</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Microsoft 365 E5', PRICE.e5, 'Entra ID P2, Defender XDR, advanced Purview. Foundational Agent 365 registry. No Copilot.'],
                ['Microsoft 365 Copilot add-on', PRICE.copilot, 'Copilot in apps and chat, agent use under the user’s identity at no charge within fair-use limits, SharePoint Advanced Management.'],
                ['Agent 365 add-on', PRICE.a365, 'Premium protection for agents whose sponsor or owner holds it. Needs Microsoft 365 E5, or E3 with the Defender and Purview suites. Not in E3, E5 or the Copilot add-on; included in E7.'],
                ['Microsoft 365 E7', PRICE.e7, 'E5 + Copilot + Agent 365 + Entra Suite. No Teams version USD 90.45. GA 1 May 2026.'],
                ['Copilot credit capacity pack', `${fmtUSD(PRICE.pack)} per tenant`, '25,000 credits a month. Pay-as-you-go is USD 0.01 per credit. Not included in any suite.'],
              ].map(([name, price, note]) => (
                <tr key={name} className="border-b border-faint align-top">
                  <td className="py-2 pr-3 font-medium text-ink">{name}</td>
                  <td className="py-2 pr-3 font-mono tabular-nums text-ink">{typeof price === 'number' ? fmtUSD(price) : price}</td>
                  <td className="py-2 text-muted">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5">
          <Callout tone="gold" title="Not a quote">
            List prices read on {PRICE_DATE} from US pages that carry no date of their own. Contoso’s real numbers come from its agreement. Cowork access is granted only through a spending policy, and Microsoft’s guidance sets the monthly budget limit for users at a minimum of 2,000 credits per user per month.
          </Callout>
        </div>
      </Section>
    </PageShell>
  );
}
