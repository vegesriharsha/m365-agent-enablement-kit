import { useMemo, useState } from 'react';
import { PageHeader, Section, Insight, Segmented, Slider, Pill, Sources, Callout, Illustrative } from '../components/ui.jsx';
import { VERIFIED, src } from '../data/sources.js';
import { logs as price, PRICES_VERIFIED, PRICE_REGION } from '../data/prices.js';
import { fmtUSD } from '../lib/hooks.js';

/* ---------- 1. Telemetry flow ---------- */

const sources = [
  { id: 'activity', name: 'Activity log', how: 'Diagnostic setting on every subscription, deployed by policy', dest: 'platform', table: 'AzureActivity', note: 'Who changed what, from any tool. Policy assigns it at the intermediate root so no subscription is missed.' },
  { id: 'diag', name: 'Resource logs', how: 'Diagnostic settings deployed by policy (DeployIfNotExists)', dest: 'both', table: 'AzureDiagnostics, resource tables', note: 'Platform resources log to the platform workspace; workload teams can add their own workspace for app troubleshooting.' },
  { id: 'vm', name: 'VM and Arc guest logs', how: 'Azure Monitor Agent plus a data collection rule, both assigned by policy', dest: 'platform', table: 'Syslog, SecurityEvent, Perf', note: 'The legacy agent is retired; the agent identity and data collection rules live in the management subscription.' },
  { id: 'entra', name: 'Entra sign-ins and audit', how: 'Tenant diagnostic setting (outside ARM policy)', dest: 'platform', table: 'SigninLogs, AuditLogs', note: 'Set once at tenant level by an identity admin. It’s the input most security detections need.' },
  { id: 'app', name: 'Application telemetry', how: 'Application Insights, workspace-based', dest: 'workload', table: 'AppRequests, AppExceptions', note: 'Owned by the workload team in its own workspace, so app chatter doesn’t land in the security workspace.' },
];
const SY = (i) => 46 + i * 62;
const DEST = { platform: [640, 110], workload: [640, 270] };

function TelemetryFlow() {
  const [sel, setSel] = useState('activity');
  const S = sources.find((s) => s.id === sel);
  const targets = (s) => (s.dest === 'both' ? ['platform', 'workload'] : [s.dest]);
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto border border-rule bg-paper">
        <svg viewBox="0 0 820 340" className="block w-full min-w-[600px]" role="img" aria-label="Telemetry flow from sources to workspaces">
          {sources.map((s, i) =>
            targets(s).map((d) => {
              const [tx, ty] = DEST[d];
              const on = s.id === sel;
              const path = `M210 ${SY(i)} C 420 ${SY(i)}, 430 ${ty}, ${tx} ${ty}`;
              return (
                <g key={`${s.id}-${d}`}>
                  <path d={path} fill="none" stroke={on ? 'var(--navy)' : 'var(--rule)'} strokeWidth={on ? 2 : 1.25} />
                  {on && <path d={path} fill="none" stroke="var(--gold)" strokeWidth="2.5" className="flowing" />}
                </g>
              );
            }),
          )}
          {sources.map((s, i) => (
            <g key={s.id} role="button" tabIndex={0} onClick={() => setSel(s.id)} onKeyDown={(e) => e.key === 'Enter' && setSel(s.id)} style={{ cursor: 'pointer' }}>
              <rect x={20} y={SY(i) - 21} width={190} height={42} fill={s.id === sel ? 'var(--navy)' : 'var(--surface)'} stroke={s.id === sel ? 'var(--navy)' : 'var(--rule)'} />
              <text x={34} y={SY(i) + 5} fontSize="13.5" fontWeight="500" fill={s.id === sel ? 'var(--on-navy)' : 'var(--ink)'}>
                {s.name}
              </text>
            </g>
          ))}
          {[
            ['platform', 'Platform workspace', 'log-platform-prod-cus-001', 'Management subscription'],
            ['workload', 'Workload workspace', 'log-loansvc-prod-cus-001', 'Workload subscription'],
          ].map(([id, title, name, where]) => {
            const [x, y] = DEST[id];
            const lit = targets(S).includes(id);
            return (
              <g key={id}>
                <rect x={x} y={y - 46} width={170} height={92} fill="var(--surface)" stroke={lit ? 'var(--navy)' : 'var(--rule)'} strokeWidth={lit ? 2 : 1.25} />
                <text x={x + 12} y={y - 22} fontSize="13.5" fontWeight="600" fill="var(--ink)">
                  {title}
                </text>
                <text x={x + 12} y={y - 4} fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--navy)">
                  {name}
                </text>
                <text x={x + 12} y={y + 14} fontSize="11" fill="var(--subtle)">
                  {where}
                </text>
                {id === 'platform' && (
                  <text x={x + 12} y={y + 32} fontSize="11" fill="var(--gold)">
                    + Microsoft Sentinel
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="fade-in grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]" key={sel}>
        <div>
          <p className="label">Source</p>
          <h3 className="mt-1 font-display text-[26px] font-semibold leading-[1.1] text-ink">{S.name}</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="label">How it’s collected</p>
            <p className="mt-1 text-[14px] text-ink">{S.how}</p>
          </div>
          <div>
            <p className="label">Lands in</p>
            <p className="mt-1 font-mono text-[12.5px] text-ink">{S.table}</p>
          </div>
        </div>
        <p className="text-[14.5px] leading-[1.6] text-muted">{S.note}</p>
      </div>
    </div>
  );
}

/* ---------- 2. Cost estimator ---------- */

const logTypes = [
  { id: 'sec', name: 'Sign-ins and security events', gb: 1.5, plan: 'analytics', needsAlerts: 'full', keep: 'audit' },
  { id: 'act', name: 'Activity log and policy', gb: 0.3, plan: 'analytics', needsAlerts: 'full', keep: 'audit' },
  { id: 'audit', name: 'Key vault and storage audit', gb: 0.5, plan: 'analytics', needsAlerts: 'simple', keep: 'audit' },
  { id: 'fw', name: 'Firewall logs', gb: 6, plan: 'basic', needsAlerts: 'simple', keep: 'audit' },
  { id: 'app', name: 'VM and container logs', gb: 4, plan: 'basic', needsAlerts: 'simple', keep: 'ops' },
  { id: 'verbose', name: 'Verbose debug and flow logs', gb: 8, plan: 'auxiliary', needsAlerts: 'none', keep: 'ops' },
];
const planRate = { analytics: price.analyticsPerGB, basic: price.basicPerGB, auxiliary: price.auxiliaryPerGB };
const planTone = { analytics: 'var(--seq-1)', basic: 'var(--seq-2)', auxiliary: 'var(--seq-3)' };

function estimate(types, gbs, plans, interactiveDays, years) {
  const rows = types.map((t) => {
    const monthly = gbs[t.id] * 30;
    const plan = plans[t.id];
    return { ...t, plan, monthly };
  });
  const analyticsGB = rows.filter((r) => r.plan === 'analytics').reduce((a, r) => a + r.monthly, 0);
  const freeShare = Math.min(price.analyticsFreeGBPerMonth, analyticsGB);
  const interactiveMonths = Math.max(0, (interactiveDays - 30) / 30);
  const longTermMonths = Math.max(0, years * 12 - Math.max(1, interactiveDays / 30));
  const out = rows.map((r) => {
    let ingest = r.monthly * planRate[r.plan];
    if (r.plan === 'analytics' && analyticsGB > 0) ingest -= (freeShare * (r.monthly / analyticsGB)) * price.analyticsPerGB;
    const interactive = r.plan === 'analytics' ? r.monthly * interactiveMonths * price.interactiveRetentionPerGBMonth : 0;
    const longTerm = r.keep === 'audit' ? r.monthly * longTermMonths * price.longTermPerGBMonth : 0;
    return { ...r, ingest, retention: interactive + longTerm, total: ingest + interactive + longTerm };
  });
  return { rows: out, total: out.reduce((a, r) => a + r.total, 0), ingest: out.reduce((a, r) => a + r.ingest, 0), retention: out.reduce((a, r) => a + r.retention, 0) };
}

function CostEstimator() {
  const [gbs, setGbs] = useState(Object.fromEntries(logTypes.map((t) => [t.id, t.gb])));
  const [plans, setPlans] = useState(Object.fromEntries(logTypes.map((t) => [t.id, t.plan])));
  const [days, setDays] = useState(90);
  const [years, setYears] = useState(7);

  const mine = useMemo(() => estimate(logTypes, gbs, plans, days, years), [gbs, plans, days, years]);
  const allAnalytics = useMemo(() => estimate(logTypes, gbs, Object.fromEntries(logTypes.map((t) => [t.id, 'analytics'])), days, years), [gbs, days, years]);
  const saving = allAnalytics.total - mine.total;
  const blind = logTypes.filter((t) => plans[t.id] === 'auxiliary' && t.needsAlerts !== 'none');
  const limited = logTypes.filter((t) => plans[t.id] === 'basic' && t.needsAlerts === 'full');
  const maxTotal = Math.max(allAnalytics.total, 1);

  return (
    <>
      <div className="space-y-2">
        {logTypes.map((t) => (
          <div key={t.id} className="grid items-center gap-3 border-b border-faint pb-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_90px]">
            <span className="text-[14px] font-medium text-ink">{t.name}</span>
            <Slider id={`gb-${t.id}`} label="GB a day" min={0} max={20} step={0.1} value={gbs[t.id]} onChange={(v) => setGbs((g) => ({ ...g, [t.id]: v }))} format={(v) => v.toFixed(1)} />
            <Segmented
              size="sm"
              value={plans[t.id]}
              onChange={(v) => setPlans((p) => ({ ...p, [t.id]: v }))}
              options={[
                { value: 'analytics', label: 'Analytics' },
                { value: 'basic', label: 'Basic' },
                { value: 'auxiliary', label: 'Auxiliary' },
              ]}
            />
            <span className="tabular text-right font-mono text-[13px] text-ink">{fmtUSD(mine.rows.find((r) => r.id === t.id).total)}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Slider id="ret-days" label="Interactive retention (Analytics)" min={30} max={730} step={30} value={days} onChange={setDays} format={(v) => `${v} days`} hint="First 30 days included; longer is charged per GB-month" />
        <Slider id="ret-years" label="Total retention for security and audit logs" min={1} max={12} step={1} value={years} onChange={setYears} format={(v) => `${v} year${v === 1 ? '' : 's'}`} hint="Moves to low-cost long-term retention; operational logs aren’t kept past interactive retention" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Your mix, per month', fmtUSD(mine.total), 'text-ink'],
          ['Everything on Analytics', fmtUSD(allAnalytics.total), 'text-muted'],
          ['Difference', saving >= 0 ? `−${fmtUSD(saving)}` : `+${fmtUSD(-saving)}`, saving >= 0 ? 'text-good' : 'text-bad'],
        ].map(([l, v, c]) => (
          <div key={l} className="border-l border-rule pl-3">
            <p className="label">{l}</p>
            <p className={`tabular font-mono text-[24px] leading-tight ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {[
          ['Your mix', mine],
          ['All Analytics', allAnalytics],
        ].map(([label, est]) => (
          <div key={label} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
            <span className="text-[12.5px] text-muted">{label}</span>
            <div className="flex h-[18px] w-full bg-faint" style={{ width: `${Math.max(4, (est.total / maxTotal) * 100)}%` }}>
              {est.rows.map((r) => (
                <div
                  key={r.id}
                  title={`${r.name}: ${fmtUSD(r.total)}`}
                  className="h-full border-r-2 border-paper transition-all duration-500 last:border-r-0"
                  style={{ width: `${est.total ? (r.total / est.total) * 100 : 0}%`, background: planTone[r.plan] }}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-x-5 gap-y-1 pl-[108px] text-[12px] text-muted">
          {Object.entries(planTone).map(([k, c]) => (
            <span key={k} className="inline-flex items-center gap-1.5 capitalize">
              <span className="inline-block h-[10px] w-[10px]" style={{ background: c }} />
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Insight
          tone={blind.length ? 'bad' : limited.length ? 'gold' : 'navy'}
          stateKey={JSON.stringify(plans)}
          title={blind.length ? 'You can’t alert on this' : limited.length ? 'Simpler alerts only' : 'What this shows'}
        >
          <p>
            {blind.length
              ? `${blind.map((t) => t.name).join(', ')} ${blind.length === 1 ? 'is' : 'are'} on Auxiliary, which doesn’t support alerts. Keep anything you detect or alert on in Analytics or Basic.`
              : limited.length
                ? `${limited.map((t) => t.name).join(', ')} ${limited.length === 1 ? 'is' : 'are'} on Basic: alerts are limited to simple log alerts, queries are charged per GB scanned, and Insights don’t work. Security detections usually need Analytics.`
                : 'Put high-value data that drives detections and alerts on Analytics, troubleshooting data on Basic, and verbose or audit-only data on Auxiliary. The plan is per table, so one workspace can mix them.'}
          </p>
        </Insight>
      </div>
      <p className="mt-3 text-[12.5px] leading-[1.5] text-subtle">
        {PRICE_REGION} retail list prices from the Azure Retail Prices API, {PRICES_VERIFIED}: Analytics {fmtUSD(price.analyticsPerGB, 2)}/GB after{' '}
        {price.analyticsFreeGBPerMonth} GB free each month, Basic {fmtUSD(price.basicPerGB, 2)}/GB, Auxiliary {fmtUSD(price.auxiliaryPerGB, 2)}/GB, extra interactive
        retention {fmtUSD(price.interactiveRetentionPerGBMonth, 2)}/GB-month, long-term {fmtUSD(price.longTermPerGBMonth, 2)}/GB-month. Steady state, once
        retention has filled. Excludes Microsoft Sentinel, query charges and commitment tiers.
      </p>
    </>
  );
}

/* ---------- 3. Alert routing ---------- */

const alerts = [
  { id: 'health', name: 'Service Health: incident in East US 2', from: 'Service Health alert (AMBA)', groups: ['ag-platform'], people: ['Platform on-call', 'Workload on-call'], why: 'An Azure-side incident affects everyone in the region. The platform team triages; each affected workload’s own Service Health alert pages its team too.' },
  { id: 'snat', name: 'Firewall SNAT ports near exhaustion', from: 'Metric alert on the hub firewall (AMBA)', groups: ['ag-connectivity'], people: ['Network team'], why: 'Shared network capacity belongs to the network team, not to whichever workload noticed it first.' },
  { id: 'budget', name: 'Budget forecast at 90%: loan servicing', from: 'Cost Management budget', groups: ['ag-loansvc'], people: ['Workload owner', 'FinOps'], why: 'Budgets are per subscription, set at vending. The workload owner acts; FinOps watches the trend across all subscriptions.' },
  { id: 'breakglass', name: 'Emergency-access account signed in', from: 'Sentinel analytics rule on SigninLogs', groups: ['Sentinel incident'], people: ['Security operations'], why: 'Any use of a break-glass account is a security event. It goes to the SOC as an incident, not to an email inbox.' },
  { id: 'kv', name: 'Key vault availability below 99%', from: 'Metric alert on the workload’s vault', groups: ['ag-loansvc'], people: ['Workload on-call'], why: 'The workload owns its vault. Platform alerts cover shared services; workload alerts cover what the team deploys.' },
];
const allGroups = ['ag-platform', 'ag-connectivity', 'ag-loansvc', 'Sentinel incident'];
const allPeople = ['Platform on-call', 'Network team', 'Workload on-call', 'Workload owner', 'FinOps', 'Security operations'];

function AlertRouting() {
  const [sel, setSel] = useState('health');
  const A = alerts.find((a) => a.id === sel);
  const gy = (g) => 40 + allGroups.indexOf(g) * 64;
  const py = (p) => 30 + allPeople.indexOf(p) * 44;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div role="radiogroup" aria-label="Alert" className="flex flex-col border border-rule">
        {alerts.map((a) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={a.id === sel}
            onClick={() => setSel(a.id)}
            className={`border-b border-faint px-3 py-2.5 text-left text-[13.5px] last:border-b-0 ${a.id === sel ? 'bg-navy text-on-navy' : 'text-ink hover:bg-faint'}`}
          >
            {a.name}
          </button>
        ))}
      </div>
      <div className="min-w-0 space-y-4">
        <div className="overflow-x-auto border border-rule bg-paper">
          <svg viewBox="0 0 640 290" className="block w-full min-w-[520px]" role="img" aria-label={`Routing for ${A.name}`}>
            <rect x={14} y={120} width={170} height={50} fill="var(--navy)" />
            <text x={26} y={141} fontSize="11" fill="var(--on-navy)">
              {A.from.length > 28 ? `${A.from.slice(0, 27)}…` : A.from}
            </text>
            <text x={26} y={158} fontSize="10.5" fill="var(--on-navy)" opacity="0.8">
              alert fires
            </text>
            {allGroups.map((g) => {
              const on = A.groups.includes(g);
              return (
                <g key={g}>
                  {on && <path d={`M184 145 C 230 145, 230 ${gy(g)}, 270 ${gy(g)}`} fill="none" stroke="var(--gold)" strokeWidth="2" className="flowing" />}
                  <rect x={270} y={gy(g) - 17} width={150} height={34} fill="var(--surface)" stroke={on ? 'var(--navy)' : 'var(--rule)'} strokeWidth={on ? 2 : 1} opacity={on ? 1 : 0.55} />
                  <text x={282} y={gy(g) + 4} fontSize="12" fontFamily="var(--font-mono)" fill={on ? 'var(--ink)' : 'var(--subtle)'}>
                    {g}
                  </text>
                </g>
              );
            })}
            {allPeople.map((p) => {
              const on = A.people.includes(p);
              return (
                <g key={p}>
                  {on &&
                    A.groups.map((g) => (
                      <path key={g} d={`M420 ${gy(g)} C 450 ${gy(g)}, 450 ${py(p)}, 480 ${py(p)}`} fill="none" stroke="var(--gold)" strokeWidth="2" className="flowing" />
                    ))}
                  <rect x={480} y={py(p) - 15} width={146} height={30} fill={on ? 'var(--navy-soft)' : 'var(--surface)'} stroke={on ? 'var(--navy)' : 'var(--rule)'} opacity={on ? 1 : 0.55} />
                  <text x={492} y={py(p) + 4} fontSize="12" fill={on ? 'var(--ink)' : 'var(--subtle)'}>
                    {p}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <Insight stateKey={sel}>
          <p>{A.why}</p>
        </Insight>
      </div>
    </div>
  );
}

export default function Observability() {
  return (
    <article>
      <PageHeader
        eyebrow="Simulator · Observability"
        title="Collect on purpose, keep what you need, page the right person"
        deck="Follow telemetry from source to workspace, price a log mix across table plans, and route five alerts to the people who should act on them."
        meta={[
          { dt: 'Workspaces', dd: 'Platform + workload' },
          { dt: 'Table plans', dd: 'Analytics, Basic, Auxiliary' },
          { dt: 'Prices', dd: `${PRICE_REGION}, list` },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Follow the telemetry" intro="Select a source. Policy does most of the wiring, so a new subscription starts logging without anyone remembering to switch it on.">
        <TelemetryFlow />
      </Section>

      <Section n={2} title="Price your log mix" intro="Set the daily volume and table plan for each kind of log. Watch what moving verbose data off Analytics saves, and what it costs you in alerting.">
        <div className="mb-3">
          <Illustrative>Estimate, list prices</Illustrative>
        </div>
        <CostEstimator />
      </Section>

      <Section n={3} title="Route the alert" intro="Five alerts, four action groups, six audiences. The baseline alerts (AMBA) deploy most of these with policy; who receives them is your decision.">
        <AlertRouting />
        <div className="mt-5">
          <Callout title="Rule of thumb">
            Platform alerts go to platform action groups; workload alerts go to the workload’s own. Security detections become
            Sentinel incidents. Nobody should be on an email list for an alert they can’t act on.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.logsOverview, src.tablePlans, src.retention, src.amba, src.actionGroups, src.amaMigration, src.sentinel, src.retailPrices, src.monitorPricing]} />
    </article>
  );
}
