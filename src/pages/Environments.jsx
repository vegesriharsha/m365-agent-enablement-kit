import { useMemo, useState } from 'react';
import { Check, Minus, X } from 'lucide-react';
import { Section, Insight, Button, Pill, Callout, Illustrative } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';

/*
 * Pattern 5, sort into buckets and stress-test. Four Power Platform environment
 * buckets, four things makers build, five what-ifs. The environment rules and
 * dates are Microsoft's; the four items and the policy layout are Contoso's.
 */
const buckets = [
  { id: 'default', name: 'Default', sub: 'renamed “Personal Productivity Environment”', managed: false, sharing: 'no limit set', dlp: 'HTTP blocked', note: 'Experiments only. Every licensed user is a maker here; no backup guarantee.' },
  { id: 'legacy', name: 'Unmanaged developer', sub: 'created before routing', managed: false, sharing: 'no limit set', dlp: 'HTTP blocked', note: 'No new ones from 15 Nov 2026; existing ones suspended from 15 Dec 2026.' },
  { id: 'dev', name: 'Routed developer', sub: 'managed, one per maker', managed: true, sharing: '5 individuals', dlp: 'HTTP blocked', note: 'Created by environment routing; solution checker set to warn.' },
  { id: 'prod', name: 'Production', sub: 'managed, promoted by pipeline', managed: true, sharing: 'security groups', dlp: 'HTTP allowed by exception', note: 'Backups, pipelines, an environment-level data policy.' },
];
const bucketById = Object.fromEntries(buckets.map((b) => [b.id, b]));

const items = [
  { id: 'proto', label: 'A maker’s prototype', best: 'dev', ok: ['default'], http: false, why: 'A routed developer environment is managed and personal. The default environment also works for a first try, but nothing should stay there.' },
  { id: 'team', label: 'Team knowledge agent, 50 viewers', best: 'prod', ok: [], http: false, why: 'Fifty viewers exceed the routed environment’s sharing limit of 5 individuals, and the default environment has no backup guarantee. Promote it to production through a solution.' },
  { id: 'http', label: 'Agent with the HTTP connector', best: 'prod', ok: [], http: true, why: 'The tenant data policy blocks HTTP, so Publish is disabled everywhere except the production environment, where an environment-level policy allows it after an exception.' },
  { id: 'flow', label: 'Agent flow on a schedule', best: 'prod', ok: ['dev'], http: false, why: 'A flow that runs on its own belongs where it is backed up and promoted by a pipeline. A routed developer environment is fine while it is being built.' },
];

const tests = [
  { id: 'cutoff', label: '15 Nov 2026 arrives' },
  { id: 'licence', label: 'Feb 2027 licence enforcement' },
  { id: 'share', label: 'Share with 50 viewers' },
  { id: 'http', label: 'Add the HTTP connector' },
  { id: 'routing', label: 'Switch environment routing on' },
];

const presets = {
  allDefault: Object.fromEntries(items.map((i) => [i.id, 'default'])),
  recommended: Object.fromEntries(items.map((i) => [i.id, i.best])),
  tray: Object.fromEntries(items.map((i) => [i.id, 'tray'])),
};

function verdict(item, where) {
  if (where === 'tray') return 'none';
  if (where === item.best) return 'good';
  if (item.ok.includes(where)) return 'ok';
  return 'bad';
}

function whatIf(kind, layout) {
  const placed = items.filter((i) => layout[i.id] !== 'tray');
  const inBucket = (b) => items.filter((i) => layout[i.id] === b);
  const names = (list) => list.map((i) => i.label.toLowerCase()).join(', ');
  if (kind === 'cutoff') {
    const hit = inBucket('legacy');
    return {
      tone: hit.length ? 'bad' : 'good',
      title: '15 Nov 2026 arrives',
      lines: hit.length
        ? [`No new unmanaged developer environments can be created from 15 Nov 2026, and existing ones are suspended from 15 Dec 2026. Stopped: ${names(hit)}.`, 'Routed developer environments are managed, so they keep working. Move the work there before the date.']
        : ['Nothing is in an unmanaged developer environment, so the cutoff changes nothing here. Routed developer environments are managed and unaffected.'],
      affected: hit.map((i) => i.id),
      bad: hit.map((i) => i.id),
    };
  }
  if (kind === 'licence') {
    const hit = placed.filter((i) => bucketById[layout[i.id]].managed);
    return {
      tone: hit.length ? 'gold' : 'navy',
      title: 'February 2027 licence enforcement',
      lines: hit.length
        ? [`Every active user of a managed environment needs a standalone licence or meter; from February 2027 users without one can no longer open apps in the environment. In managed environments: ${names(hit)}.`, 'The Copilot Studio rights in Microsoft 365 Copilot qualify, but only for Copilot Studio features; apps and flows need their own premium licence. Check anyone still on E5 without Copilot.']
        : ['Nothing is in a managed environment, so no user needs a licence for it. That also means no sharing limits, usage insights or group rules apply.'],
      affected: hit.map((i) => i.id),
      bad: [],
    };
  }
  if (kind === 'share') {
    const capped = placed.filter((i) => layout[i.id] === 'dev');
    const loose = placed.filter((i) => !bucketById[layout[i.id]].managed);
    const fine = placed.filter((i) => layout[i.id] === 'prod');
    const lines = [];
    if (capped.length) lines.push(`Blocked: ${names(capped)}. The routed developer environment caps sharing at 5 individuals.`);
    if (loose.length) lines.push(`Allowed but ungoverned: ${names(loose)}. Unmanaged environments set no sharing limit, keep no usage insights and the default environment has no backup guarantee.`);
    if (fine.length) lines.push(`Fine: ${names(fine)}. Production allows security groups and is where shared agents belong.`);
    if (!placed.length) lines.push('Place something first.');
    return { tone: capped.length ? 'bad' : loose.length ? 'gold' : 'good', title: 'Share with 50 viewers', lines, affected: placed.map((i) => i.id), bad: capped.map((i) => i.id) };
  }
  if (kind === 'http') {
    const targets = placed.filter((i) => i.http || i.id === 'flow');
    const blocked = targets.filter((i) => layout[i.id] !== 'prod');
    const allowed = targets.filter((i) => layout[i.id] === 'prod');
    const lines = [];
    if (blocked.length) lines.push(`Publish disabled: ${names(blocked)}. Copilot Studio enforces the data policy in real time and the HTTP connector is in the Blocked group here.`);
    if (allowed.length) lines.push(`Publishes: ${names(allowed)}. The production environment’s policy allows HTTP after an approved exception.`);
    if (!targets.length) lines.push('Place the HTTP agent or the flow to see the data policy act on it.');
    return { tone: blocked.length ? 'bad' : allowed.length ? 'good' : 'navy', title: 'Add the HTTP connector', lines, affected: targets.map((i) => i.id), bad: blocked.map((i) => i.id) };
  }
  const inDefault = inBucket('default');
  const inLegacy = inBucket('legacy');
  const lines = ['Environment routing is a tenant setting, off by default. On, it sends each new maker into their own managed developer environment instead of the default.'];
  if (inDefault.length) lines.push(`${names(inDefault)}: with routing on, new work like this lands in a routed developer environment instead.`);
  if (inLegacy.length) lines.push(`${names(inLegacy)}: routing does not rescue existing unmanaged environments; they are still suspended from 15 Dec 2026.`);
  return { tone: 'navy', title: 'Switch environment routing on', lines, affected: [...inDefault, ...inLegacy].map((i) => i.id), bad: [] };
}

const markIcon = { good: Check, ok: Minus, bad: X };
const markClass = { good: 'text-good', ok: 'text-gold', bad: 'text-bad' };

function Chip({ item, where, selected, highlight, onSelect }) {
  const v = verdict(item, where);
  const Icon = markIcon[v];
  const ring = highlight === 'bad' ? 'outline outline-2 outline-bad' : highlight === 'hit' ? 'outline outline-2 outline-navy' : '';
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(item.id)}
      className={`flex w-full items-center gap-2 border px-2.5 py-1.5 text-left text-[13px] leading-[1.35] transition-colors ${ring} ${selected ? 'border-navy bg-navy text-on-navy' : 'border-rule bg-surface text-ink hover:border-subtle'}`}
    >
      <span className="min-w-0 flex-1">{item.label}</span>
      {Icon && <Icon size={14} aria-label={v} className={selected ? 'text-on-navy' : markClass[v]} />}
    </button>
  );
}

export default function Environments() {
  const [layout, setLayout] = useState(presets.allDefault);
  const [sel, setSel] = useState('team');
  const [test, setTest] = useState(null);

  const counts = useMemo(() => {
    const c = { good: 0, ok: 0, bad: 0, none: 0 };
    items.forEach((i) => (c[verdict(i, layout[i.id])] += 1));
    return c;
  }, [layout]);
  const result = test ? whatIf(test, layout) : null;
  const highlight = (id) => (result ? (result.bad.includes(id) ? 'bad' : result.affected.includes(id) ? 'hit' : '') : '');
  const place = (to) => {
    if (!sel) return;
    setLayout((l) => ({ ...l, [sel]: to }));
    setTest(null);
  };
  const selItem = items.find((i) => i.id === sel);
  const tray = items.filter((i) => layout[i.id] === 'tray');

  return (
    <PageShell
      header={{
        eyebrow: 'Custom page · Environment strategy',
        title: 'Where makers build decides what they can share, connect and keep',
        deck: 'Sort four things makers build into four Power Platform environments, then stress-test the layout with the dates and rules that are coming.',
        meta: [{ dt: 'Buckets', dd: String(buckets.length) }, { dt: 'Stress tests', dd: String(tests.length) }],
      }}
      sources={['ppEnvironmentsOverview', 'ppEnvironmentStrategy', 'ppSecureDefaultEnvironment', 'ppEnvironmentRouting', 'ppEnvironmentGroups', 'ppEnvironmentGroupRules', 'ppManagedEnvironmentsOverview', 'ppManagedEnvironmentLicensing', 'ppSharingLimits', 'ppDlpConnectorClassification', 'csDataPolicies', 'csSecurityFaq']}
    >
      <Section n={1} title="Place the work" intro="Select an item, then choose the environment it belongs in. Everything starts in the default environment, which is how most tenants look before a strategy exists.">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Illustrative>Illustrative items and policy layout</Illustrative>
          <Pill tone="neutral">Rules and dates from Microsoft Learn</Pill>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => { setLayout(presets.allDefault); setTest(null); }}>All in Default</Button>
            <Button variant="secondary" onClick={() => { setLayout(presets.recommended); setTest(null); }}>Recommended</Button>
            <Button variant="quiet" onClick={() => { setLayout(presets.tray); setTest(null); }}>Clear</Button>
          </div>
        </div>

        {tray.length > 0 && (
          <div className="mb-4 border border-dashed border-rule bg-paper p-3">
            <p className="label mb-2">Not placed yet</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {tray.map((i) => (
                <Chip key={i.id} item={i} where="tray" selected={sel === i.id} highlight="" onSelect={setSel} />
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {buckets.map((b) => {
            const here = items.filter((i) => layout[i.id] === b.id);
            return (
              <div key={b.id} className="flex min-w-0 flex-col border border-rule bg-surface">
                <button
                  type="button"
                  onClick={() => place(b.id)}
                  className={`border-b border-faint p-3 text-left transition-colors ${sel && layout[sel] !== b.id ? 'hover:bg-navy-soft' : ''}`}
                  aria-label={`Place the selected item in ${b.name}`}
                >
                  <p className="text-[14px] font-semibold text-ink">{b.name}</p>
                  <p className="text-[11.5px] text-subtle">{b.sub}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Pill tone={b.managed ? 'navy' : 'neutral'}>{b.managed ? 'Managed' : 'Unmanaged'}</Pill>
                    <Pill tone="neutral">Sharing: {b.sharing}</Pill>
                    <Pill tone={b.dlp.includes('allowed') ? 'gold' : 'neutral'}>{b.dlp}</Pill>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-[1.4] text-subtle">{b.note}</p>
                  {sel && layout[sel] !== b.id && <p className="mt-2 text-[11.5px] font-medium text-navy">Place here</p>}
                </button>
                <div className="flex-1 space-y-2 p-3">
                  {here.length === 0 && <p className="text-[12px] text-subtle">Empty</p>}
                  {here.map((i) => (
                    <Chip key={i.id} item={i} where={b.id} selected={sel === i.id} highlight={highlight(i.id)} onSelect={setSel} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <p className="label mb-2">Stress-test the layout</p>
          <div className="flex flex-wrap gap-2">
            {tests.map((x) => (
              <Button key={x.id} variant={test === x.id ? 'primary' : 'secondary'} onClick={() => setTest(x.id)}>
                {x.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          {result ? (
            <Insight title={result.title} tone={result.tone} stateKey={`${test}-${JSON.stringify(layout)}`}>
              {result.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </Insight>
          ) : (
            <Insight title={selItem ? selItem.label : 'Select an item'} tone={verdict(selItem, layout[sel]) === 'bad' ? 'bad' : verdict(selItem, layout[sel]) === 'ok' ? 'gold' : 'navy'} stateKey={`${sel}-${layout[sel]}`}>
              <p>{selItem ? selItem.why : 'Pick an item to see where it belongs and why.'}</p>
              <p className="mt-1 text-[12.5px] text-subtle">
                Placed well: {counts.good} · acceptable: {counts.ok} · wrong: {counts.bad} · unplaced: {counts.none}
              </p>
            </Insight>
          )}
        </div>
      </Section>

      <Section n={2} title="What to take away" wide={false}>
        <ul className="space-y-2.5 text-[15px] leading-[1.6] text-ink">
          {[
            'The default environment is for experiments: no backup guarantee, every licensed user a maker. Rename it, secure it with a data policy, and route makers away from it.',
            'Environment routing is off by default. On, each maker gets a managed developer environment with a sharing limit of 5 and solution checker warnings.',
            'Unmanaged developer environments cannot be created from 15 Nov 2026 and are suspended from 15 Dec 2026. The strategy has to land before then.',
            'Once an environment is managed, every active user needs a standalone licence or meter; the Copilot Studio rights in Microsoft 365 Copilot qualify for Copilot Studio features only. From February 2027 unlicensed users can no longer open apps there.',
            'Data policies act in real time on Copilot Studio: a blocked connector disables Publish. Exceptions belong in an environment-level policy on production.',
          ].map((x) => (
            <li key={x} className="flex gap-3">
              <span className="mt-[10px] h-[5px] w-[5px] shrink-0 bg-navy" />
              {x}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Callout tone="gold" title="Simplified here">
            Real tenants also have sandbox and trial environments, environment groups with 28 rules, and tenant isolation (which Copilot Studio does not support). The four buckets are the ones a first strategy must decide.
          </Callout>
        </div>
      </Section>
    </PageShell>
  );
}
