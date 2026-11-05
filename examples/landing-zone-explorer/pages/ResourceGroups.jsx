import { useMemo, useState } from 'react';
import { Check, Lock, Trash2, UserCog, X, Minus, MoveRight } from 'lucide-react';
import { PageHeader, Section, Insight, Segmented, Toggle, Button, Pill, Sources, Callout } from '../components/ui.jsx';
import { VERIFIED, src } from '../data/sources.js';

const W = 'loansvc';
const buckets = [
  { id: 'network', place: 'the network group', name: `rg-${W}-network-prod-cus`, role: 'Network', note: 'Created by subscription vending; changed by the network team' },
  { id: 'app', place: 'the app group', name: `rg-${W}-app-prod-cus`, role: 'App tier', note: 'Torn down and redeployed with each release' },
  { id: 'data', place: 'the data group', name: `rg-${W}-data-prod-cus`, role: 'Data and secrets', note: 'Long-lived; locked against deletion' },
  { id: 'monitor', place: 'the monitoring group', name: `rg-${W}-monitor-prod-cus`, role: 'Monitoring', note: 'Keeps history when the app is rebuilt' },
  { id: 'platform', place: 'a platform subscription', name: 'Platform subscriptions', role: 'Not in this subscription', note: 'Owned by the platform team; you request it' },
];
const bucketById = Object.fromEntries(buckets.map((b) => [b.id, b]));

const resources = [
  { id: 'vnet', noun: 'the virtual network', code: 'vnet', label: 'Virtual network and subnets', best: 'network', ok: [], why: 'Vending creates it and peers it to the hub. The network team changes it on its own schedule, and deleting the app must never take the network with it.' },
  { id: 'nsg', noun: 'the NSGs', code: 'nsg', label: 'Network security groups', best: 'network', ok: [], why: 'They are attached to the subnets, so they live and change with the network.' },
  { id: 'rt', noun: 'the route table', code: 'rt', label: 'Route table to the hub firewall', best: 'network', ok: [], why: 'It is what sends traffic through the firewall. If the app tier is rebuilt, the route has to survive.' },
  { id: 'asp', noun: 'the App Service plan', code: 'asp', label: 'App Service plan', best: 'app', ok: [], why: 'Compute for the app. It is created and deleted with the apps that run on it.' },
  { id: 'web', noun: 'the web app', code: 'app', label: 'Web app (API)', best: 'app', ok: [], why: 'Redeployed with every release. Keeping it apart from data means a rebuild can’t touch the database.' },
  { id: 'func', noun: 'the function app', code: 'func', label: 'Function app (overnight batch)', best: 'app', ok: [], why: 'Same lifecycle and owners as the API, so it sits in the same group.' },
  { id: 'id', noun: 'the managed identity', code: 'id', label: 'Managed identity for the app', best: 'app', ok: ['data'], why: 'The app signs in with it. Keeping it in the app tier is usual; in the data group it survives rebuilds, so role assignments on the database don’t need recreating.' },
  { id: 'sql', noun: 'the SQL database', code: 'sql', label: 'Azure SQL server and database', best: 'data', ok: [], why: 'The bank’s records. It outlives every release, needs a delete lock and gets its own access for the DBA team.' },
  { id: 'st', noun: 'the statements storage account', code: 'st', label: 'Storage account (customer statements)', best: 'data', ok: [], why: 'Holds data the bank must keep for years, so it belongs with the other long-lived state.' },
  { id: 'kv', noun: 'the key vault', code: 'kv', label: 'Key vault (app secrets)', best: 'data', ok: ['app'], why: 'Secrets should stay put when the app is rebuilt. In the app group it works, but each teardown soft-deletes the vault and reserves its name until it is purged.' },
  { id: 'pep', noun: 'the database’s private endpoint', code: 'pep', label: 'Private endpoint for the database', best: 'data', ok: ['network'], why: 'Private endpoints live with the resource they expose, so they are removed together. In the network group it works, but it is left behind when the database goes.' },
  { id: 'appi', noun: 'Application Insights', code: 'appi', label: 'Application Insights', best: 'monitor', ok: ['app'], why: 'Telemetry history should outlive a rebuild. In the app group you lose it each time the tier is torn down.' },
  { id: 'log', noun: 'the app’s Log Analytics workspace', code: 'log', label: 'Log Analytics workspace (app logs)', best: 'monitor', ok: [], why: 'The workload’s own workspace. Platform and security logs go to the central workspace through policy.' },
  { id: 'alert', noun: 'the alert rules', code: 'alert', label: 'Alert rules and action group', best: 'monitor', ok: [], why: 'Changed by whoever is on call, on their own schedule, and must keep working while the app is redeployed.' },
  { id: 'dns', noun: 'the private DNS zone', code: 'dns', label: 'Private DNS zone privatelink.database.windows.net', best: 'platform', ok: [], why: 'ALZ keeps private DNS zones centrally in the connectivity subscription. A policy adds the record when you create a private endpoint, so every workload resolves the same way.' },
  { id: 'fw', noun: 'the firewall rule', code: 'afwp', label: 'Firewall rule for the batch job’s outbound call', best: 'platform', ok: [], why: 'It is a rule in the hub firewall policy, owned by the platform team. You request it through the paved path; you don’t deploy it.' },
];
const resById = Object.fromEntries(resources.map((r) => [r.id, r]));

const presets = {
  empty: Object.fromEntries(resources.map((r) => [r.id, 'tray'])),
  single: Object.fromEntries(resources.map((r) => [r.id, 'app'])),
  recommended: Object.fromEntries(resources.map((r) => [r.id, r.best])),
};

function verdict(r, where) {
  if (where === 'tray') return 'none';
  if (where === r.best) return 'good';
  if (r.ok.includes(where)) return 'ok';
  return 'bad';
}

const markIcon = { good: Check, ok: Minus, bad: X };
const markClass = { good: 'text-good', ok: 'text-gold', bad: 'text-bad' };

/** Run one of the stress tests against the current layout. */
function whatIf(kind, layout) {
  const inBucket = (b) => resources.filter((r) => layout[r.id] === b);
  if (kind === 'teardown') {
    const gone = inBucket('app');
    const harmed = gone.filter((r) => r.best !== 'app' && !r.ok.includes('app'));
    const soft = gone.filter((r) => r.best !== 'app' && r.ok.includes('app'));
    const tone = harmed.length ? 'bad' : soft.length ? 'gold' : 'good';
    const lines = [];
    lines.push(gone.length ? `Deleting ${bucketById.app.name} removes ${gone.length} resource${gone.length === 1 ? '' : 's'}.` : 'The app group is empty, so nothing is deleted.');
    if (harmed.length) lines.push(`Lost with it: ${harmed.map((r) => r.noun).join(', ')}. That is data, network or platform that should have outlived the release.`);
    if (soft.length) lines.push(`Also caught: ${soft.map((r) => r.noun).join(', ')}. Survivable, but you lose history or reserve names.`);
    if (!harmed.length && !soft.length && gone.length) lines.push('Only the app tier went. The pipeline can recreate it and nothing else noticed.');
    return { tone, title: 'Tear down and redeploy the app tier', lines, affected: gone.map((r) => r.id), bad: harmed.map((r) => r.id) };
  }
  if (kind === 'dba') {
    const visible = inBucket('data');
    const extra = visible.filter((r) => r.best !== 'data' && !r.ok.includes('data'));
    const missing = resources.filter((r) => ['sql', 'st'].includes(r.id) && layout[r.id] !== 'data');
    const tone = extra.length || missing.length ? 'bad' : 'good';
    const lines = [`Contributor on ${bucketById.data.name} reaches ${visible.length} resource${visible.length === 1 ? '' : 's'}.`];
    if (missing.length) lines.push(`The DBAs can’t reach ${missing.map((r) => r.noun).join(' or ')}: they’re in another group, so you’d grant a second, wider role.`);
    if (extra.length) lines.push(`They can also change ${extra.map((r) => r.noun).join(', ')}. That is more than their job needs.`);
    if (tone === 'good') lines.push('One role assignment, on one group, gives exactly the access the job needs.');
    return { tone, title: 'Give the DBA team access', lines, affected: visible.map((r) => r.id), bad: [...extra, ...missing].map((r) => r.id) };
  }
  const locked = inBucket('data');
  const blocked = locked.filter((r) => r.best === 'app');
  const exposed = resources.filter((r) => ['sql', 'st', 'kv'].includes(r.id) && layout[r.id] !== 'data');
  const tone = blocked.length || exposed.length ? 'bad' : 'good';
  const lines = [`A CanNotDelete lock on ${bucketById.data.name} protects ${locked.length} resource${locked.length === 1 ? '' : 's'}.`];
  if (exposed.length) lines.push(`Not protected: ${exposed.map((r) => r.noun).join(', ')}. One mistaken delete removes them.`);
  if (blocked.length) lines.push(`The lock also blocks deleting ${blocked.map((r) => r.noun).join(', ')}, so app releases that recreate them will fail.`);
  if (tone === 'good') lines.push('The lock covers the bank’s data and nothing the release pipeline needs to delete.');
  return { tone, title: 'Lock the data group', lines, affected: locked.map((r) => r.id), bad: [...blocked, ...exposed].map((r) => r.id) };
}

function Chip({ r, where, selected, feedback, highlight, onSelect }) {
  const v = verdict(r, where);
  const Icon = markIcon[v];
  const ring = highlight === 'bad' ? 'outline outline-2 outline-bad' : highlight === 'hit' ? 'outline outline-2 outline-navy' : '';
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(r.id)}
      className={`flex w-full items-center gap-2 border px-2.5 py-1.5 text-left text-[13px] leading-[1.35] transition-colors ${ring} ${
        selected ? 'border-navy bg-navy text-on-navy' : 'border-rule bg-surface text-ink hover:border-subtle'
      }`}
    >
      <span className={`w-[42px] shrink-0 font-mono text-[11px] ${selected ? 'text-on-navy' : 'text-navy'}`}>{r.code}</span>
      <span className="min-w-0 flex-1">{r.label}</span>
      {feedback && Icon && <Icon size={14} aria-label={v} className={selected ? 'text-on-navy' : markClass[v]} />}
    </button>
  );
}

function Stat({ label, value, tone }) {
  const c = { good: 'text-good', gold: 'text-gold', bad: 'text-bad', neutral: 'text-ink' }[tone];
  return (
    <div className="min-w-0 border-l border-rule pl-3">
      <p className="label">{label}</p>
      <p className={`tabular font-mono text-[22px] leading-tight ${c}`}>{value}</p>
    </div>
  );
}

export default function ResourceGroups() {
  const [layout, setLayout] = useState(presets.empty);
  const [preset, setPreset] = useState('empty');
  const [sel, setSel] = useState(null);
  const [feedback, setFeedback] = useState(true);
  const [test, setTest] = useState(null);

  const counts = useMemo(() => {
    const c = { good: 0, ok: 0, bad: 0, none: 0 };
    resources.forEach((r) => (c[verdict(r, layout[r.id])] += 1));
    return c;
  }, [layout]);

  const result = test ? whatIf(test, layout) : null;
  const highlight = (id) => (result ? (result.bad.includes(id) ? 'bad' : result.affected.includes(id) ? 'hit' : '') : '');

  const move = (to) => {
    if (!sel) return;
    setLayout((l) => ({ ...l, [sel]: to }));
    setPreset('custom');
    setTest(null);
  };
  const pick = (id) => {
    setSel((s) => (s === id ? null : id));
    setTest(null);
  };
  const applyPreset = (p) => {
    setLayout(presets[p]);
    setPreset(p);
    setSel(null);
    setTest(null);
  };

  const selR = sel ? resById[sel] : null;
  const selV = selR ? verdict(selR, layout[selR.id]) : null;
  const tray = resources.filter((r) => layout[r.id] === 'tray');

  return (
    <article>
      <PageHeader
        eyebrow="Simulator · Resource groups"
        title="Group by what lives and dies together"
        deck="Sort a fictional loan-servicing app into resource groups, then stress-test the layout: tear down a release, grant the DBAs access, lock the data."
        meta={[
          { dt: 'Workload', dd: 'Loan servicing (Internal)' },
          { dt: 'Resources', dd: String(resources.length) },
          { dt: 'Rule of thumb', dd: 'Shared lifecycle' },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section
        n={1}
        title="Sort the workload"
        intro="Select a resource, then choose Move here on a group. Two resources don’t belong in this subscription at all."
      >
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="w-full max-w-[460px]">
            <Segmented
              label="Start from"
              value={preset}
              onChange={applyPreset}
              options={[
                { value: 'empty', label: 'Unsorted' },
                { value: 'single', label: 'One big group' },
                { value: 'recommended', label: 'Recommended' },
              ]}
            />
          </div>
          <div className="w-[230px]">
            <Toggle label="Show feedback" checked={feedback} onChange={setFeedback} hint="Mark each placement" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Placed well" value={counts.good} tone="good" />
          <Stat label="Acceptable" value={counts.ok} tone="gold" />
          <Stat label="Needs a move" value={counts.bad} tone="bad" />
          <Stat label="Unsorted" value={counts.none} tone="neutral" />
        </div>

        <div className="mt-6 space-y-3">
          <p className="label">Stress-test the layout</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={test === 'teardown' ? 'primary' : 'secondary'} onClick={() => { setTest('teardown'); setSel(null); }}>
              <Trash2 size={14} /> Tear down the app tier
            </Button>
            <Button variant={test === 'dba' ? 'primary' : 'secondary'} onClick={() => { setTest('dba'); setSel(null); }}>
              <UserCog size={14} /> Give DBAs access
            </Button>
            <Button variant={test === 'lock' ? 'primary' : 'secondary'} onClick={() => { setTest('lock'); setSel(null); }}>
              <Lock size={14} /> Lock the data group
            </Button>
          </div>
        </div>

        <div className="mt-5">
          {result ? (
            <Insight title={result.title} tone={result.tone} stateKey={`${test}-${JSON.stringify(layout)}`}>
              {result.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </Insight>
          ) : selR ? (
            <Insight
              title={selR.label}
              tone={selV === 'good' ? 'good' : selV === 'ok' ? 'gold' : selV === 'bad' ? 'bad' : 'navy'}
              stateKey={`${sel}-${layout[sel]}`}
            >
              {!feedback ? (
                <p>
                  {selV === 'none' ? 'Not placed yet.' : `In ${bucketById[layout[sel]].place}.`} Turn on feedback to check it.
                </p>
              ) : selV === 'none' ? (
                <p>Not placed yet. Think about who changes it and what should survive a release.</p>
              ) : (
                <p>
                  {selV === 'good' && 'Good place for it. '}
                  {selV === 'ok' && 'This works, with a cost. '}
                  {selV === 'bad' && `Not the best place: it belongs in ${bucketById[selR.best].place}. `}
                  {selR.why}
                </p>
              )}
            </Insight>
          ) : (
            <Insight title="How to play" stateKey="idle">
              <p>Select a resource below, then pick the group it belongs in. Run a stress test whenever you like.</p>
            </Insight>
          )}
        </div>

        {tray.length > 0 && (
          <div className="mt-6 border border-dashed border-rule p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="label">Unsorted · {tray.length}</p>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {tray.map((r) => (
                <Chip key={r.id} r={r} where="tray" selected={sel === r.id} feedback={false} highlight="" onSelect={pick} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {buckets.map((b) => {
            const items = resources.filter((r) => layout[r.id] === b.id);
            const canMove = sel && layout[sel] !== b.id;
            return (
              <div key={b.id} className={`flex min-w-0 flex-col border ${b.id === 'platform' ? 'border-dashed border-rule bg-callout' : 'border-rule bg-paper'}`}>
                <div className="border-b border-faint px-3 py-2.5">
                  <p className="label !text-navy">{b.role}</p>
                  <p className="mt-0.5 break-all font-mono text-[12.5px] text-ink">{b.name}</p>
                  <p className="mt-0.5 text-[12px] leading-[1.4] text-subtle">{b.note}</p>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                  {items.map((r) => (
                    <Chip key={r.id} r={r} where={b.id} selected={sel === r.id} feedback={feedback} highlight={highlight(r.id)} onSelect={pick} />
                  ))}
                  {items.length === 0 && <p className="px-1 py-2 text-[12.5px] text-subtle">Empty</p>}
                  <button
                    type="button"
                    disabled={!canMove}
                    onClick={() => move(b.id)}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 border border-dashed border-rule px-2 py-1.5 text-[12.5px] text-muted transition-colors enabled:hover:border-navy enabled:hover:text-navy disabled:opacity-40"
                  >
                    <MoveRight size={13} /> {sel ? `Move here` : 'Select a resource first'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {counts.good === resources.length && (
          <div className="mt-4 flex items-center gap-2">
            <Pill tone="good">All placed well</Pill>
            <span className="text-[13.5px] text-muted">Now run the three stress tests and compare with “One big group”.</span>
          </div>
        )}
      </Section>

      <Section n={2} title="Examples across the estate" intro="Names follow the convention on the Naming studio page: rg-<workload>-<component>-<env>-<region>.">
        <div className="overflow-x-auto border-y border-rule">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule">
                {['Subscription', 'Resource group', 'Contains', 'Why it stands alone'].map((h) => (
                  <th key={h} className="label px-3 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Management', 'rg-management-prod-cus', 'Platform Log Analytics workspace, monitoring agent identity, data collection rules', 'Long-lived; security logs need tight access'],
                ['Management', 'rg-alerts-platform-prod-cus', 'Service Health alerts, platform action groups', 'Changed by operations on its own schedule'],
                ['Management', 'rg-alz-mgmt-state-cus-001', 'Terraform state storage made by the accelerator bootstrap', 'Only the pipeline should touch it'],
                ['Connectivity', 'rg-hub-network-prod-cus', 'Hub network, Azure Firewall and its policy, gateways, Bastion', 'Shared by everything; network change control'],
                ['Connectivity', 'rg-hub-dns-prod-cus', 'Private DNS zones, DNS Private Resolver', 'Every private endpoint depends on it'],
                ['Identity', 'rg-identity-prod-cus', 'Domain controllers, if you need them', 'Tier-0 access boundary'],
                ['Workload', `rg-${W}-data-prod-cus`, 'SQL, storage, key vault, their private endpoints', 'Outlives releases; locked; DBA access'],
                ['Sandbox', 'rg-jsmith-try-aks-sbx-cus', 'One person’s experiment', 'Deleted in one go when the trial ends'],
              ].map((row) => (
                <tr key={row[1]} className="border-b border-faint last:border-b-0">
                  <td className="px-3 py-2.5 text-muted">{row[0]}</td>
                  <td className="px-3 py-2.5 font-mono text-[12.5px] text-ink">{row[1]}</td>
                  <td className="px-3 py-2.5 text-ink">{row[2]}</td>
                  <td className="px-3 py-2.5 text-muted">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12.5px] text-subtle">
          The accelerator’s bootstrap uses the full region name by default (centralus); the short code here assumes you override it.
        </p>
      </Section>

      <Section n={3} title="Patterns to avoid" wide={false}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['One group per resource type', '“All key vaults”, “all databases”. Access and lifecycle follow the workload, not the type.'],
            ['One group for everything', 'One delete or one broad role assignment reaches it all. Try the stress tests with “One big group”.'],
            ['Environments side by side', 'Production and development belong in different subscriptions, so policy and access can differ.'],
            ['Group in another region', 'Keep resources in their group’s region. The group’s region is where its metadata lives.'],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-rule pt-3">
              <p className="text-[15px] font-semibold text-ink">{t}</p>
              <p className="mt-1 text-[14px] leading-[1.55] text-muted">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Callout title="Who creates the groups">
            Subscription vending creates the network group and any others your paved path standardises, with tags, budgets and
            role assignments already in place. Workload pipelines then deploy into them.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.organize, src.naming, src.locks, src.subVending]} />
    </article>
  );
}
