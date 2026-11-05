import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { PageHeader, Section, Insight, Segmented, Toggle, Button, Pill, Sources, Callout, Code } from '../components/ui.jsx';
import { useProgress } from '../lib/hooks.js';
import { VERIFIED, src } from '../data/sources.js';

// Timelines on a 0–100 scale. Each bar: [start, end, kind].
function timeline(backend, timeout) {
  const a = [[5, 60, 'run']];
  if (backend === 'azure' && !timeout)
    return { a, b: [[25, 28, 'fail']], lock: [[5, 60, 'A']], outcome: 'fail' };
  if (backend === 'azure') return { a, b: [[25, 60, 'wait'], [60, 95, 'run']], lock: [[5, 60, 'A'], [60, 95, 'B']], outcome: 'ok' };
  if (backend === 'hcp') return { a, b: [[25, 60, 'queue'], [60, 95, 'run']], lock: [[5, 60, 'A'], [60, 95, 'B']], outcome: 'ok' };
  return { a, b: [[25, 80, 'run']], lock: [], outcome: 'clobber' };
}

const barFill = { run: 'var(--navy)', wait: 'var(--gold-soft)', queue: 'var(--navy-soft)', fail: 'var(--bad)' };
const barLabel = { run: 'Plan and apply', wait: 'Waiting for lock', queue: 'Queued', fail: 'Lock error' };

const messages = {
  azure: {
    fail: {
      tone: 'bad',
      log: 'Error: Error acquiring the state lock\nstate blob is already locked\nLock Info: ID: 6f1c…  Who: runner@actions  Operation: OperationTypeApply',
      text: 'The backend takes a lease on the state blob. Run B finds it held by run A and stops at once, before touching anything. Safe, but someone has to re-run it.',
    },
    ok: {
      tone: 'good',
      log: 'Acquiring state lock. This may take a few moments...\n(waiting while run A holds the lease)\nAcquired state lock.',
      text: 'With -lock-timeout, run B waits for the lease instead of failing, then plans against the state run A just wrote. In a pipeline, a concurrency group per state file does the same job.',
    },
  },
  hcp: {
    ok: {
      tone: 'good',
      log: 'Run B: Pending (waiting for run A in workspace alz-platform)\nRun A: Applied\nRun B: Planning...',
      text: 'HCP Terraform queues runs per workspace. Run B waits its turn and plans against the latest state, with no flags or pipeline settings needed.',
    },
  },
  none: {
    clobber: {
      tone: 'bad',
      log: 'Run A: Apply complete! Resources: 1 added.\nRun B: Apply complete! Resources: 1 added.\n(run B saved state without run A’s resource)',
      text: 'Without a lock both runs read the same old state. Run B writes last and its state doesn’t know about run A’s resource: it still exists in Azure, but Terraform has forgotten it.',
    },
  },
};

const rows = [
  ['Where state lives', 'A storage account in your management subscription', 'HashiCorp’s cloud (US by default; an EU region is a separate account)', 'Your own Kubernetes or container hosts'],
  ['Locking', 'Blob lease', 'Run queue per workspace', 'Run queue per workspace'],
  ['History and recovery', 'Blob versioning and soft delete', 'State versions in the workspace', 'State versions in the workspace'],
  ['How runs reach Azure', 'GitHub or Azure DevOps OIDC to managed identities', 'Dynamic provider credentials (OIDC)', 'Dynamic provider credentials (OIDC)'],
  ['Policy before apply', 'Add Conftest in the pipeline', 'Sentinel or OPA policy sets (full enforcement on Standard and Premium)', 'Sentinel or OPA policy sets'],
  ['Drift detection', 'Scheduled plan in the pipeline', 'Built in (Standard plan and up)', 'Built in'],
  ['Cost', 'Cents a month for storage', 'Per managed resource per hour', 'Licence plus your hosting'],
  ['ALZ accelerator', 'Default; supported', 'Wire it in yourself; not supported', 'Wire it in yourself; not supported'],
];

export default function StateBackends() {
  const [backend, setBackend] = useState('azure');
  const [timeout, setTimeoutOn] = useState(false);
  const [run, setRun] = useState(0);
  const [versioning, setVersioning] = useState(true);
  const [broken, setBroken] = useState(false);
  const [restored, setRestored] = useState(false);

  const tl = timeline(backend, timeout);
  const t = useProgress(`${backend}-${timeout}-${run}`, 4200);
  const now = t * 100;
  const done = t >= 1;
  const msg = messages[backend][tl.outcome];
  const x = (v) => 110 + (v / 100) * 600;

  const bar = (list, y) =>
    list.map(([s, e, kind]) => {
      const visibleEnd = Math.min(e, now);
      if (visibleEnd <= s) return null;
      return (
        <g key={`${y}-${s}`}>
          <rect x={x(s)} y={y} width={Math.max(2, x(visibleEnd) - x(s))} height={22} fill={barFill[kind]} stroke={kind === 'wait' ? 'var(--gold)' : 'none'} />
          {visibleEnd - s > 14 && (
            <text x={x(s) + 8} y={y + 15} fontSize="11" fill={kind === 'run' || kind === 'fail' ? 'var(--on-navy)' : 'var(--ink)'}>
              {barLabel[kind]}
            </text>
          )}
        </g>
      );
    });

  const versions = [
    { v: 41, when: '09:12', note: 'Firewall rule added', ok: true },
    { v: 42, when: '14:30', note: 'Spoke for loan servicing', ok: true },
    { v: 43, when: '16:05', note: broken ? 'Bad write: half the resources missing' : 'Budget alerts', ok: !broken },
  ];

  return (
    <article>
      <PageHeader
        eyebrow="Explorer · Terraform state"
        title="State is the platform’s memory; guard it"
        deck="Terraform remembers what it built in one state file. Run two changes at once, break the file, and see how each backend protects you."
        meta={[
          { dt: 'Accelerator default', dd: 'Azure Storage' },
          { dt: 'Alternative', dd: 'HCP Terraform' },
          { dt: 'Supported path', dd: 'Azure Storage' },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Two runs at once" intro="Run A starts a change. A moment later run B starts another against the same state. What happens depends on the backend.">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Segmented
            label="Backend"
            value={backend}
            onChange={setBackend}
            options={[
              { value: 'azure', label: 'Azure Storage' },
              { value: 'hcp', label: 'HCP Terraform' },
              { value: 'none', label: 'Shared file, no lock' },
            ]}
          />
          <Button variant="secondary" onClick={() => setRun((n) => n + 1)}>
            <RotateCcw size={14} /> Run again
          </Button>
        </div>
        {backend === 'azure' && (
          <div className="mt-4 max-w-[420px]">
            <Toggle label="Run B uses -lock-timeout=10m" checked={timeout} onChange={setTimeoutOn} hint="Wait for the lock instead of failing" />
          </div>
        )}

        <div className="mt-5 overflow-x-auto border border-rule bg-paper">
          <svg viewBox="0 0 740 170" className="block w-full min-w-[560px]" role="img" aria-label={`Two runs with ${backend} backend`}>
            {[['Run A', 24], ['Run B', 62], ['Lock', 112]].map(([label, y]) => (
              <g key={label}>
                <text x={16} y={y + 15} fontSize="12" fontWeight="500" fill="var(--ink)">
                  {label}
                </text>
                <rect x={110} y={y} width={600} height={22} fill="var(--faint)" opacity="0.5" />
              </g>
            ))}
            {bar(tl.a, 24)}
            {bar(tl.b, 62)}
            {tl.lock.map(([s, e, who]) => {
              const visibleEnd = Math.min(e, now);
              if (visibleEnd <= s) return null;
              return (
                <g key={who}>
                  <rect x={x(s)} y={112} width={x(visibleEnd) - x(s)} height={22} fill="none" stroke="var(--navy)" strokeDasharray="3 3" />
                  <text x={x(s) + 8} y={127} fontSize="11" fill="var(--navy)">
                    held by run {who}
                  </text>
                </g>
              );
            })}
            {tl.lock.length === 0 && now > 5 && (
              <text x={x(6)} y={127} fontSize="11" fill="var(--bad)">
                No lock: both runs read and write freely
              </text>
            )}
            {backend === 'none' && now >= 60 && <text x={x(60) + 4} y={20} fontSize="10.5" fill="var(--muted)">A saves state</text>}
            {backend === 'none' && now >= 80 && <text x={x(80) + 4} y={100} fontSize="10.5" fill="var(--bad)">B overwrites it</text>}
            <line x1={x(now)} x2={x(now)} y1={14} y2={146} stroke="var(--gold)" strokeWidth="1.5" />
            <text x={110} y={162} fontSize="10.5" fill="var(--subtle)">
              time →
            </text>
          </svg>
        </div>

        {done && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <pre className="fade-in overflow-x-auto border border-rule bg-callout px-3 py-3 font-mono text-[12px] leading-[1.6] text-ink">{msg.log}</pre>
            <Insight tone={msg.tone} stateKey={`${backend}-${timeout}-${run}`} title={msg.tone === 'good' ? 'Both changes land' : tl.outcome === 'fail' ? 'Run B stopped safely' : 'State is now wrong'}>
              <p>{msg.text}</p>
            </Insight>
          </div>
        )}
      </Section>

      <Section n={2} title="Break the state, then recover it" intro="A bad write happens: a crashed run, a wrong command, a manual edit. Recovery depends on whether old versions were kept.">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="w-[300px]">
            <Toggle
              label="Blob versioning and soft delete"
              checked={versioning}
              onChange={(v) => {
                setVersioning(v);
                setRestored(false);
              }}
              hint="The accelerator turns both on for its state account"
            />
          </div>
          <Button
            variant={broken ? 'quiet' : 'primary'}
            onClick={() => {
              setBroken(true);
              setRestored(false);
            }}
            disabled={broken}
          >
            Corrupt version 43
          </Button>
          <Button
            variant="secondary"
            disabled={!broken || restored}
            onClick={() => setRestored(true)}
          >
            Restore previous version
          </Button>
          <Button
            variant="quiet"
            onClick={() => {
              setBroken(false);
              setRestored(false);
            }}
          >
            Reset
          </Button>
        </div>
        <ol className="mt-5 space-y-1.5">
          {versions.map((ver, i) => {
            const hidden = !versioning && i < versions.length - 1;
            const isCurrent = restored ? ver.v === 42 : ver.v === 43;
            return (
              <li
                key={ver.v}
                className={`flex flex-wrap items-center gap-3 border px-4 py-2.5 transition-opacity ${hidden ? 'opacity-30' : ''} ${
                  !ver.ok ? 'border-bad bg-bad-soft' : isCurrent ? 'border-navy bg-surface' : 'border-rule bg-surface'
                }`}
              >
                <span className="tabular font-mono text-[12.5px] text-navy">v{ver.v}</span>
                <span className="tabular font-mono text-[12.5px] text-subtle">{ver.when}</span>
                <span className={`flex-1 text-[14px] ${ver.ok ? 'text-ink' : 'text-bad'}`}>{hidden ? 'Not kept: overwritten' : ver.note}</span>
                {isCurrent && <Pill tone={ver.ok ? 'navy' : 'bad'}>Current</Pill>}
              </li>
            );
          })}
        </ol>
        <div className="mt-4">
          <Insight
            stateKey={`${versioning}-${broken}-${restored}`}
            tone={!broken ? 'navy' : restored ? 'good' : versioning ? 'gold' : 'bad'}
            title={!broken ? 'What this shows' : restored ? 'Recovered' : versioning ? 'Recoverable' : 'Unrecoverable from storage'}
          >
            <p>
              {!broken && 'Each apply saves a new state version. Corrupt the latest one to see what you can get back.'}
              {broken && !versioning && 'Only the latest blob exists, and it is wrong. You would rebuild state by importing every resource the platform manages, which for a landing zone means hundreds of policy and role objects.'}
              {broken && versioning && !restored && 'Version 42 is still there. Restore it, then run a plan: anything run 43 really created shows up as a change to re-import.'}
              {broken && restored && 'State is back at version 42. Run terraform plan before anything else and reconcile the difference before the next apply.'}
            </p>
          </Insight>
        </div>
      </Section>

      <Section n={3} title="Side by side" intro="The accelerator’s default and the two HashiCorp-run options. HCP Terraform plan names and prices change; get a written quote.">
        <div className="overflow-x-auto border-y border-rule">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule">
                {['', 'Azure Storage backend', 'HCP Terraform', 'Terraform Enterprise'].map((h) => (
                  <th key={h || 'k'} className="label px-3 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]} className="border-b border-faint last:border-b-0 align-top">
                  <td className="px-3 py-2.5 font-medium text-ink">{r[0]}</td>
                  <td className="px-3 py-2.5 text-ink">{r[1]}</td>
                  <td className="px-3 py-2.5 text-muted">{r[2]}</td>
                  <td className="px-3 py-2.5 text-muted">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n={4} title="If you choose HCP Terraform" intro="The accelerator has no built-in option for it. It can be wired in by hand; that path is yours to support." wide={false}>
        <ol className="space-y-3 text-[15px] leading-[1.6] text-ink">
          {[
            'Bootstrap with the local option (alz_local), so nothing assumes GitHub Actions runs the code.',
            'Replace the backend block with a cloud block naming your organisation and a CLI-driven workspace.',
            'Turn on dynamic provider credentials with separate plan and apply client IDs, keeping the read-only plan and write apply split.',
            'Add federated credentials on each identity for the workspace’s plan and apply run phases.',
            'Prove it in a test tenant first: the starter also uses the AzAPI and alz providers, which HashiCorp doesn’t document for dynamic credentials.',
          ].map((s, i) => (
            <li key={s} className="flex gap-4">
              <span className="tabular w-6 shrink-0 font-mono text-[12px] leading-[1.9] text-navy">{String(i + 1).padStart(2, '0')}</span>
              {s}
            </li>
          ))}
        </ol>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Code title="Default · backend block">{`terraform {
  backend "azurerm" {
    resource_group_name  = "rg-alz-mgmt-state-cus-001"
    storage_account_name = "stalzmgmtstatecus001"
    container_name       = "mgmt-tfstate"
    key                  = "terraform.tfstate"
    use_azuread_auth     = true
    use_oidc             = true
  }
}`}</Code>
          <Code title="HCP Terraform · cloud block">{`terraform {
  cloud {
    organization = "contoso"
    workspaces {
      name = "alz-platform"
    }
  }
}

# Workspace variables
# TFC_AZURE_PROVIDER_AUTH   = true
# TFC_AZURE_PLAN_CLIENT_ID  = <plan identity>
# TFC_AZURE_APPLY_CLIENT_ID = <apply identity>`}</Code>
        </div>
        <div className="mt-5">
          <Callout tone="gold" title="Decide once, for the whole organisation">
            A run platform is a company-wide choice, not a landing-zone one. If it isn’t made yet, keep the landing zone on the
            supported default and migrate later; moving state between backends is a planned, one-off job.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.azurermBackend, src.bootstrap, src.hcpDynamic, src.hcpOverview, src.hcpPolicy, src.tfeReleases]} />
    </article>
  );
}
