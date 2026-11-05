import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { PageHeader, Section, Insight, Segmented, Button, Pill, Sources, Callout } from '../components/ui.jsx';
import { useProgress } from '../lib/hooks.js';
import { VERIFIED, src } from '../data/sources.js';

const LANES = [
  { id: 'gh', name: 'GitHub Actions', y: 46 },
  { id: 'entra', name: 'Microsoft Entra ID', y: 126 },
  { id: 'az', name: 'Azure', y: 206 },
];
const laneY = Object.fromEntries(LANES.map((l) => [l.id, l.y]));

const steps = [
  { lane: 'gh', x: 190, label: 'Pull request', log: 'Pull request #42 opened: add policy assignment to Internal (Corp)' },
  { lane: 'gh', x: 280, label: 'Plan job', log: 'Job "plan" started in environment alz-plan; requesting OIDC token' },
  { lane: 'entra', x: 280, label: 'Plan identity', log: 'Token exchanged for id-alz-plan (Reader on the intermediate root)' },
  { lane: 'az', x: 370, label: 'terraform plan', log: 'terraform plan: 1 to add, 0 to change, 0 to destroy' },
  { lane: 'gh', x: 460, label: 'Review, merge', log: 'Plan posted to the pull request; approved by a reviewer and merged' },
  { lane: 'gh', x: 560, label: 'Approval gate', log: 'Job "apply" waiting: environment alz-apply needs platform-approvers' },
  { lane: 'gh', x: 650, label: 'Apply job', log: 'Approved by a platform approver; requesting OIDC token' },
  { lane: 'entra', x: 650, label: 'Apply identity', log: 'Token exchanged for id-alz-apply (Owner on the intermediate root)' },
  { lane: 'az', x: 740, label: 'terraform apply', log: 'terraform apply: 1 added, 0 changed, 0 destroyed' },
  { lane: 'gh', x: 830, label: 'Done', log: 'Run succeeded. State saved with a lock and a new blob version' },
];

const scenarios = {
  ok: { label: 'Normal change', fail: null },
  renamed: {
    label: 'Repo was renamed',
    fail: 2,
    log: "AADSTS70021: No matching federated identity record found for presented assertion. Assertion Subject: 'repo:contoso@1048576/alz-platform-v2@73400320:environment:alz-plan'",
    why: 'Entra compares the token’s subject with the federated credential exactly. The repo is now alz-platform-v2, so the subject carries the new name (and, for renames after 15 July 2026, GitHub’s immutable format). It no longer matches, so no token is issued. Nothing in Azure was touched.',
    fix: 'Add a credential for the new subject before a rename, confirm a run signs in, then delete the old one. Section 2 shows what changes with immutable subjects.',
  },
  applyInPr: {
    label: 'Apply from the PR job',
    fail: 3,
    log: "AuthorizationFailed (403): id-alz-plan does not have authorization to perform action 'Microsoft.Authorization/policyAssignments/write'",
    why: 'Someone added terraform apply to the pull-request job. That job signs in as the plan identity, which only has Reader, so Azure refuses the write.',
    fix: 'This is the design working: code nobody has reviewed can read Azure but never change it. Keep the plan identity read-only.',
  },
  rejected: {
    label: 'Approver rejects',
    fail: 5,
    log: 'Deployment to alz-apply rejected by a platform approver; job "apply" skipped',
    why: 'The change was merged, but the apply job needs approval in the alz-apply environment. The approver rejected it, so it never ran.',
    fix: 'Fix the code in a new pull request. The approval gate is the last human check before the apply identity, with Owner, does anything.',
  },
};

function path(upTo) {
  const pts = [[110, laneY.gh]];
  steps.slice(0, upTo + 1).forEach((s) => pts.push([s.x, laneY[s.lane]]));
  return pts;
}

function pointAt(pts, t) {
  if (pts.length < 2) return pts[0];
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let target = t * total;
  for (let i = 0; i < segs.length; i += 1) {
    if (target <= segs[i]) {
      const f = segs[i] === 0 ? 0 : target / segs[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    target -= segs[i];
  }
  return pts[pts.length - 1];
}

const OWNER = 'contoso';
const OWNER_ID = '1048576';
const REPO_ID = '73400320';

export default function Pipeline() {
  const [scenario, setScenario] = useState('ok');
  const [run, setRun] = useState(0);
  const sc = scenarios[scenario];
  const last = sc.fail ?? steps.length - 1;
  const t = useProgress(`${scenario}-${run}`, 900 + 450 * (last + 1));
  const pts = path(last);
  const [px, py] = pointAt(pts, t);
  const reached = Math.min(last, Math.floor(t * (last + 1) - 0.0001));
  const done = t >= 1;
  const failed = done && sc.fail !== null;

  // Subject comparison
  const [event, setEvent] = useState('none');
  const ENV = 'environment:alz-apply';
  const credName = `repo:${OWNER}/alz-platform:${ENV}`;
  const credImm = `repo:${OWNER}@${OWNER_ID}/alz-platform@${REPO_ID}:${ENV}`;
  const worlds = {
    none: {
      name: { token: credName, match: true, tone: 'good', text: 'Same repository, same name: the subjects match and Entra issues a token.' },
      imm: { token: credImm, match: true, tone: 'good', text: 'Same repository, same IDs: the subjects match and Entra issues a token.' },
    },
    renamed: {
      name: { token: `repo:${OWNER}@${OWNER_ID}/alz-platform-v2@${REPO_ID}:${ENV}`, match: false, tone: 'bad', text: 'The name changed and, after 15 July 2026, a renamed repository switches to the immutable format. The credential no longer matches.' },
      imm: { token: `repo:${OWNER}@${OWNER_ID}/alz-platform-v2@${REPO_ID}:${ENV}`, match: false, tone: 'bad', text: 'The IDs stay the same, but the subject still contains the name, so an exact credential stops matching. Plan renames: add the new credential first.' },
    },
    reused: {
      name: { token: credName, match: true, tone: 'bad', text: 'A different repository now has the old name. A subject made only of names can’t tell them apart, so the stranger’s workflow can match your credential.' },
      imm: { token: `repo:${OWNER}@${OWNER_ID}/alz-platform@99887766:${ENV}`, match: false, tone: 'good', text: 'The new repository has a new ID. IDs are never reused, so it can’t match a credential written for the original. This is what immutable subjects are for.' },
    },
  };
  const w = worlds[event];

  return (
    <article>
      <PageHeader
        eyebrow="Animated flow · Pipeline and identities"
        title="Two identities, one approval, no secrets"
        deck="Follow a change from pull request to apply. Then break it on purpose and read the error the way you would at 2 a.m."
        meta={[
          { dt: 'Identities', dd: 'Plan, apply' },
          { dt: 'Secrets stored', dd: 'None (OIDC)' },
          { dt: 'Human gate', dd: 'Environment approval' },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Run the pipeline" intro="Pick a scenario. The token travels across GitHub, Entra and Azure; the run log fills in as it goes.">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <Segmented
              label="Scenario"
              value={scenario}
              onChange={setScenario}
              options={Object.entries(scenarios).map(([value, s]) => ({ value, label: s.label }))}
            />
          </div>
          <Button variant="secondary" onClick={() => setRun((n) => n + 1)}>
            <RotateCcw size={14} /> Run again
          </Button>
        </div>

        <div className="mt-5 overflow-x-auto border border-rule bg-paper">
          <svg viewBox="0 0 880 250" className="block w-full min-w-[640px]" role="img" aria-label={`Pipeline run: ${sc.label}`}>
            {LANES.map((l) => (
              <g key={l.id}>
                <line x1={0} x2={880} y1={l.y + 40} y2={l.y + 40} stroke="var(--faint)" />
                <text x={14} y={l.y + 4} fontSize="11" letterSpacing="1.2" fill="var(--subtle)">
                  {l.name.toUpperCase()}
                </text>
              </g>
            ))}
            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--rule)" strokeWidth="1.25" strokeDasharray="4 4" />
            {steps.map((s, i) => {
              const inRun = i <= last;
              const isFail = failed && i === sc.fail;
              const passed = inRun && (i < reached || (done && !isFail));
              const isGate = i === 5;
              const fill = isFail ? 'var(--bad-soft)' : passed ? 'var(--navy)' : 'var(--surface)';
              const stroke = isFail ? 'var(--bad)' : inRun ? 'var(--navy)' : 'var(--rule)';
              const y = laneY[s.lane];
              return (
                <g key={s.label} opacity={inRun ? 1 : 0.45}>
                  {isGate ? (
                    <rect x={s.x - 9} y={y - 9} width={18} height={18} transform={`rotate(45 ${s.x} ${y})`} fill={fill} stroke={stroke} strokeWidth="1.5" />
                  ) : (
                    <circle cx={s.x} cy={y} r={9} fill={fill} stroke={stroke} strokeWidth="1.5" />
                  )}
                  <text x={s.x} y={y + 26} textAnchor="middle" fontSize="11.5" fill={isFail ? 'var(--bad)' : 'var(--ink)'}>
                    {s.label}
                  </text>
                  {isFail && <path d={`M${s.x - 4} ${y - 4} L${s.x + 4} ${y + 4} M${s.x + 4} ${y - 4} L${s.x - 4} ${y + 4}`} stroke="var(--bad)" strokeWidth="2" />}
                </g>
              );
            })}
            {!done && <circle cx={px} cy={py} r={6} fill="var(--gold)" stroke="var(--paper)" strokeWidth="2" />}
          </svg>
        </div>

        <div className="mt-4 border border-rule bg-callout">
          <div className="flex items-center justify-between border-b border-faint px-3 py-1.5">
            <span className="label">Run log · illustrative</span>
            <Pill tone={!done ? 'neutral' : failed ? 'bad' : 'good'}>{!done ? 'Running' : failed ? 'Failed' : 'Succeeded'}</Pill>
          </div>
          <ol className="space-y-0.5 px-3 py-3 font-mono text-[12px] leading-[1.6]">
            {steps.slice(0, Math.max(0, reached) + 1).map((s, i) => {
              const isFail = failed && i === sc.fail;
              return (
                <li key={s.label} className={`fade-in ${isFail ? 'text-bad' : 'text-ink'}`}>
                  <span className="text-subtle">{String(i + 1).padStart(2, '0')} </span>
                  {isFail ? sc.log : s.log}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-4">
          <Insight tone={failed ? 'bad' : 'navy'} stateKey={`${scenario}-${done}`} title={failed ? 'What went wrong' : 'What this shows'}>
            {failed ? (
              <>
                <p>{sc.why}</p>
                <p className="text-muted">{sc.fix}</p>
              </>
            ) : (
              <p>
                The pull-request job can only read: its identity has Reader. Only the apply job, after a person approves it in the
                alz-apply environment, gets an identity that can write. Neither job holds a password; each asks GitHub for a short-lived
                OIDC token and trades it with Entra.
              </p>
            )}
          </Insight>
        </div>
      </Section>

      <Section n={2} title="What the subject protects" intro="Entra trusts a token only if its subject matches a federated credential exactly. Compare a name-based credential with an immutable one when the repository changes.">
        <div className="max-w-[620px]">
          <Segmented
            label="What happens to the repository"
            value={event}
            onChange={setEvent}
            options={[
              { value: 'none', label: 'Nothing' },
              { value: 'renamed', label: 'Renamed' },
              { value: 'reused', label: 'Name reused' },
            ]}
          />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ['Name-based credential', credName, w.name],
            ['Immutable credential', credImm, w.imm],
          ].map(([title, cred, r]) => (
            <div key={title} className="fade-in min-w-0 border border-rule bg-surface">
              <div className="flex items-center justify-between gap-2 border-b border-faint px-4 py-2.5">
                <p className="label !text-ink">{title}</p>
                <Pill tone={r.tone}>{r.match ? 'Token issued' : 'No match'}</Pill>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="label">Credential subject</p>
                  <p className="mt-1 break-all font-mono text-[12.5px] text-ink">{cred}</p>
                </div>
                <div>
                  <p className="label">Token subject</p>
                  <p className={`mt-1 break-all font-mono text-[12.5px] ${r.match ? 'text-ink' : 'text-bad'}`}>{r.token}</p>
                </div>
                <p className="text-[13.5px] leading-[1.55] text-muted">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Callout tone="gold" title="Dates and scope">
            On GitHub.com, repositories created, renamed or transferred after 15 July 2026 use the immutable format; existing
            repositories keep name-based subjects until you opt in at the organisation or repository. GitHub Enterprise Server
            doesn’t offer it. Microsoft Entra documents the migration: add the new credential, opt in, confirm a run, then delete
            the old one. New accelerator bootstraps already write immutable subjects with a custom claim template that adds the
            calling workflow (job_workflow_ref); the subjects here are simplified.
          </Callout>
        </div>
      </Section>

      <Section n={3} title="Who can do what" wide={false}>
        <div className="overflow-x-auto border-y border-rule">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule">
                {['Identity', 'Trusted from', 'Azure role', 'State'].map((h) => (
                  <th key={h} className="label px-3 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-faint">
                <td className="px-3 py-2.5 font-mono text-[12.5px] text-ink">id-alz-plan</td>
                <td className="px-3 py-2.5 text-ink">alz-plan environment</td>
                <td className="px-3 py-2.5 text-ink">Reader on the intermediate root</td>
                <td className="px-3 py-2.5 text-muted">Storage Blob Data Contributor on the state container</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-mono text-[12.5px] text-ink">id-alz-apply</td>
                <td className="px-3 py-2.5 text-ink">alz-apply environment, after approval</td>
                <td className="px-3 py-2.5 text-ink">Owner on the intermediate root</td>
                <td className="px-3 py-2.5 text-muted">Storage Blob Data Contributor on the state container</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.6] text-muted">
          The accelerator’s bootstrap creates both identities as user-assigned managed identities, their federated credentials, the
          two environments with an approver group, and the state storage account. Names here are illustrative.
        </p>
      </Section>

      <Sources verified={VERIFIED} items={[src.bootstrap, src.permissionsFaq, src.wif, src.ghOidc, src.ghImmutable, src.entraImmutable, src.ghEnvironments]} />
    </article>
  );
}
