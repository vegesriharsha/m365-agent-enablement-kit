import { useMemo, useState } from 'react';
import { CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { PageHeader, Section, Insight, Segmented, Slider, Button, Pill, Sources, Callout, Illustrative } from '../components/ui.jsx';
import { VERIFIED, src } from '../data/sources.js';

const scopes = [
  { value: 'all', label: 'All' },
  { value: 'platform', label: 'Platform' },
  { value: 'corp', label: 'Internal' },
  { value: 'online', label: 'Online' },
  { value: 'sandbox', label: 'Sandbox' },
];
const resourcesIn = { platform: 420, corp: 1310, online: 640, sandbox: 180 };

const assignments = [
  { id: 'diag', name: 'Deploy diagnostic settings to the platform workspace', effect: 'DeployIfNotExists', at: 'Intermediate root', n0: 310, split: { platform: 0.2, corp: 0.45, online: 0.25, sandbox: 0.1 }, fixes: true },
  { id: 'tag', name: 'Inherit costcenter from the subscription', effect: 'Modify', at: 'Intermediate root', n0: 120, split: { platform: 0.05, corp: 0.55, online: 0.3, sandbox: 0.1 }, fixes: true },
  { id: 'loc', name: 'Allowed locations', effect: 'Deny', at: 'Intermediate root', n0: 6, fixWeeks: 3, exempt: 2, split: { platform: 0, corp: 0.5, online: 0.17, sandbox: 0.33 } },
  { id: 'pip', name: 'Deny public IPs', effect: 'Deny', at: 'Internal (Corp)', n0: 14, fixWeeks: 5, exempt: 0, split: { platform: 0, corp: 1, online: 0, sandbox: 0 } },
  { id: 'blob', name: 'Storage: no public blob access', effect: 'Deny', at: 'Workload landing zones', n0: 22, fixWeeks: 9, exempt: 0, split: { platform: 0, corp: 0.6, online: 0.4, sandbox: 0 } },
  { id: 'kv', name: 'Key vaults need purge protection', effect: 'Deny', at: 'Workload landing zones', n0: 9, fixWeeks: 11, exempt: 1, split: { platform: 0, corp: 0.67, online: 0.33, sandbox: 0 } },
];

/** Non-compliant count for one assignment, in one scope, in a given week. */
function nc(a, week, scope, enforcedAt) {
  const share = scope === 'all' ? 1 : a.split[scope];
  let total;
  if (a.fixes) {
    const e = enforcedAt[a.id];
    if (e === undefined || e > week) total = a.n0;
    else total = Math.round(a.n0 * Math.max(0, 1 - (week - e + 1) / 3));
  } else {
    const remaining = Math.max(a.exempt, Math.round(a.n0 * Math.max(0, 1 - (week - 1) / a.fixWeeks)));
    total = remaining;
  }
  return Math.round(total * share);
}

function readiness(a, week, enforcedAt) {
  if (enforcedAt[a.id] !== undefined && enforcedAt[a.id] <= week) return { key: 'enforced', label: 'Enforcing' };
  if (a.fixes) return { key: 'safe', label: 'Safe: it fixes, not blocks' };
  const now = nc(a, week, 'all', enforcedAt);
  const twoAgo = week > 2 ? nc(a, week - 2, 'all', enforcedAt) : Infinity;
  if (now <= a.exempt && twoAgo <= a.exempt) return { key: 'ready', label: a.exempt ? `Ready (${a.exempt} exempt)` : 'Ready' };
  if (now <= a.exempt) return { key: 'wait', label: 'Clean; watch two weeks' };
  return { key: 'wait', label: `${now - a.exempt} still to fix` };
}

const statusUi = {
  enforced: { tone: 'navy', Icon: ShieldCheck },
  safe: { tone: 'good', Icon: CheckCircle2 },
  ready: { tone: 'good', Icon: CheckCircle2 },
  wait: { tone: 'gold', Icon: Clock },
};

function Tile({ label, value, sub, tone = 'text-ink' }) {
  return (
    <div className="min-w-0 border border-rule bg-surface p-4">
      <p className="label">{label}</p>
      <p className={`tabular mt-1 font-mono text-[28px] leading-none ${tone}`}>{value}</p>
      {sub && <p className="mt-2 text-[12px] leading-[1.4] text-subtle">{sub}</p>}
    </div>
  );
}

function TrendChart({ series, week, onHover }) {
  const [hover, setHover] = useState(null);
  const W = 640;
  const H = 200;
  const pad = { l: 40, r: 16, t: 14, b: 26 };
  const x = (i) => pad.l + (i / (series.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - 80) / 20) * (H - pad.t - pad.b);
  const pts = series.map((v, i) => `${x(i)},${y(Math.max(80, v))}`).join(' ');
  const h = hover ?? week - 1;
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="Policy compliance by week"
        onMouseLeave={() => {
          setHover(null);
          onHover?.(null);
        }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.max(0, Math.min(series.length - 1, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (series.length - 1))));
          setHover(i);
          onHover?.(i);
        }}
      >
        {[80, 85, 90, 95, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--faint)" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--subtle)">
              {v}%
            </text>
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={y(95)} y2={y(95)} stroke="var(--gold)" strokeDasharray="4 4" />
        <text x={W - pad.r} y={y(95) - 5} textAnchor="end" fontSize="10.5" fill="var(--muted)">
          target 95%
        </text>
        {series.map((_, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--subtle)">
            {i + 1}
          </text>
        ))}
        <polyline points={pts} fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinejoin="round" />
        <line x1={x(h)} x2={x(h)} y1={pad.t} y2={H - pad.b} stroke="var(--rule)" />
        <circle cx={x(h)} cy={y(Math.max(80, series[h]))} r={5} fill="var(--navy)" stroke="var(--surface)" strokeWidth="2" />
        <circle cx={x(week - 1)} cy={y(Math.max(80, series[week - 1]))} r={4} fill="none" stroke="var(--gold)" strokeWidth="1.5" />
      </svg>
      <div
        className="pointer-events-none absolute top-1 border border-rule bg-surface px-2 py-1 text-[12px] shadow-none"
        style={{ left: `${Math.min(80, (x(h) / W) * 100)}%` }}
      >
        <span className="text-subtle">Week {h + 1} · </span>
        <span className="tabular font-mono text-ink">{series[h].toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default function Guardrails() {
  const [scope, setScope] = useState('all');
  const [week, setWeek] = useState(4);
  const [enforcedAt, setEnforcedAt] = useState({});
  const [last, setLast] = useState(null);

  const total = scope === 'all' ? Object.values(resourcesIn).reduce((a, b) => a + b, 0) : resourcesIn[scope];
  const compliance = (wk) => {
    // A resource can fail several assignments; count unique-ish by damping overlaps.
    const failing = assignments.reduce((acc, a) => acc + nc(a, wk, scope, enforcedAt), 0) * 0.55;
    return Math.max(0, 100 * (1 - failing / total));
  };
  const series = useMemo(() => Array.from({ length: 12 }, (_, i) => compliance(i + 1)), [scope, enforcedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const nowPct = series[week - 1];
  const prevPct = week > 1 ? series[week - 2] : nowPct;
  const ncNow = assignments.reduce((acc, a) => acc + nc(a, week, scope, enforcedAt), 0);
  const secure = Math.round(48 + 28 * (1 - Math.exp(-(week - 1) / 4)) + (scope === 'sandbox' ? -12 : scope === 'platform' ? 6 : 0));
  const exemptions = assignments.reduce((acc, a) => acc + (a.exempt || 0), 0);

  const enforce = (a) => {
    const r = readiness(a, week, enforcedAt);
    const outstanding = nc(a, week, 'all', enforcedAt) - (a.exempt || 0);
    setEnforcedAt((e) => ({ ...e, [a.id]: week }));
    setLast({ a, r: outstanding <= 0 && r.key === 'wait' ? { key: 'ready' } : r, outstanding });
  };

  return (
    <article>
      <PageHeader
        eyebrow="Dashboard · Compliance"
        title="Audit first, enforce when the numbers say so"
        deck="A mock platform dashboard for Contoso Bank. Scrub through a twelve-week rollout, then switch policies from audit to enforce and see who it would hurt."
        meta={[
          { dt: 'Assignments', dd: String(assignments.length) },
          { dt: 'Resources', dd: total.toLocaleString() },
          { dt: 'Data', dd: 'Mock' },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Platform health" intro="Filters apply to everything below. Hover the chart for any week; the gold ring marks the week you’re in.">
        <div className="mb-2">
          <Illustrative>Mock data</Illustrative>
        </div>
        <div className="grid items-end gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Segmented label="Scope" value={scope} onChange={setScope} options={scopes} />
          <Slider id="g-week" label="Rollout week" min={1} max={12} value={week} onChange={setWeek} format={(v) => `Week ${v}`} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile
            label="Policy compliance"
            value={`${nowPct.toFixed(1)}%`}
            sub={`${nowPct - prevPct >= 0 ? '+' : ''}${(nowPct - prevPct).toFixed(1)} pts on last week`}
            tone={nowPct >= 95 ? 'text-good' : 'text-ink'}
          />
          <Tile label="Non-compliant findings" value={ncNow.toLocaleString()} sub={`across ${assignments.length} assignments`} />
          <Tile label="Secure score" value={`${Math.max(20, Math.min(95, secure))}%`} sub="Defender for Cloud classic score, illustrative" />
          <Tile label="Active exemptions" value={String(scope === 'all' ? exemptions : '—')} sub={scope === 'all' ? 'Each with an owner and expiry date' : 'Shown for All only'} />
        </div>

        <div className="mt-4 border border-rule bg-surface p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="label !text-ink">Policy compliance by week · {scopes.find((s) => s.value === scope).label}</p>
            <p className="text-[12px] text-subtle">Single series</p>
          </div>
          <TrendChart series={series} week={week} />
        </div>
      </Section>

      <Section n={2} title="Ready to enforce?" intro="Everything starts in DoNotEnforce. Deny policies are ready when nothing is left to fix for two weeks; DeployIfNotExists and Modify fix things, so enforce them early.">
        <div className="overflow-x-auto border-y border-rule">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule">
                {['Assignment', 'Effect', 'Assigned at', 'Findings', 'Status', ''].map((h) => (
                  <th key={h || 'action'} className={`label px-3 py-2.5 font-medium ${h === 'Findings' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const r = readiness(a, week, enforcedAt);
                const ui = statusUi[r.key];
                const count = nc(a, week, scope, enforcedAt);
                return (
                  <tr key={a.id} className="border-b border-faint last:border-b-0">
                    <td className="px-3 py-2.5 text-ink">{a.name}</td>
                    <td className="px-3 py-2.5 font-mono text-[12.5px] text-muted">{a.effect}</td>
                    <td className="px-3 py-2.5 text-muted">{a.at}</td>
                    <td className="tabular px-3 py-2.5 text-right font-mono text-[13px] text-ink">{count.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <Pill tone={ui.tone}>
                        <ui.Icon size={11} /> {r.label}
                      </Pill>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {r.key !== 'enforced' && (
                        <Button variant={r.key === 'wait' ? 'quiet' : 'secondary'} onClick={() => enforce(a)}>
                          Enforce
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button variant="quiet" onClick={() => { setEnforcedAt({}); setLast(null); }}>
            Reset to DoNotEnforce
          </Button>
        </div>
        <div className="mt-4">
          {last ? (
            <Insight
              stateKey={`${last.a.id}-${week}`}
              tone={last.r.key === 'wait' ? 'bad' : 'good'}
              title={last.r.key === 'wait' ? 'Enforced too early' : 'Enforced'}
            >
              <p>
                {last.a.fixes &&
                  `${last.a.name} now acts. New resources get the setting as they’re created; for the existing findings, start a remediation task. Watch the chart: the next weeks improve.`}
                {!last.a.fixes && last.r.key === 'wait' &&
                  `${last.outstanding} existing resources still break “${last.a.name}”. Deny doesn’t remove them, but every pipeline that keeps deploying the same pattern now fails. Expect broken deployments and urgent exemption requests this week.`}
                {!last.a.fixes && last.r.key !== 'wait' &&
                  `Nothing left to fix, so no deployment that worked yesterday breaks today. From now on the policy stops new mistakes instead of reporting them.`}
              </p>
            </Insight>
          ) : (
            <Insight stateKey="none" title="Try it">
              <p>Enforce “Storage: no public blob access” in week 4, then reset and try again in week 11. Then enforce the diagnostic-settings policy and watch compliance climb.</p>
            </Insight>
          )}
        </div>
        <div className="mt-5">
          <Callout tone="gold" title="Exemptions are part of enforcement">
            An exemption names the resource, the reason, an owner and an expiry date. Waiver for a risk you accept; mitigated when
            another control covers it. Review them on a schedule, because expired exemptions quietly turn back into findings.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.policyEffects, src.policyScope, src.policyExemption, src.remediation, src.defenderCspm, src.secureScore]} />
    </article>
  );
}
