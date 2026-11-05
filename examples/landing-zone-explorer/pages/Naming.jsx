import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { PageHeader, Section, Insight, Segmented, Select, TextInput, Pill, Sources, Callout, Code } from '../components/ui.jsx';
import { VERIFIED, src } from '../data/sources.js';

const regions = [
  { value: 'cus', label: 'Central US (cus)', name: 'centralus' },
  { value: 'eus2', label: 'East US 2 (eus2)', name: 'eastus2' },
  { value: 'eus', label: 'East US (eus)', name: 'eastus' },
  { value: 'wus3', label: 'West US 3 (wus3)', name: 'westus3' },
];
const envs = ['prod', 'uat', 'dev', 'sbx'];

/*
 * Azure rules (Microsoft Learn, "Naming rules and restrictions") and the
 * house pattern for each type. `chars` is the allowed character class,
 * `start`/`end` the allowed first and last characters.
 */
const types = [
  { id: 'mg', abbr: 'mg', name: 'Management group ID', min: 1, max: 90, chars: /^[A-Za-z0-9\-_.()]+$/, charsText: 'letters, digits, - _ . ( )', start: /^[A-Za-z0-9]/, startText: 'a letter or digit', end: /[^.]$/, endText: 'not a period', fixed: true, pattern: '<org>-<name>', make: (v) => `${v.org}-platform` },
  { id: 'sub', abbr: 'sub', house: true, name: 'Subscription (display name)', min: 1, max: 64, chars: /^[A-Za-z0-9-]+$/, charsText: 'house rule: letters, digits, -', pattern: 'sub-<workload>-<env>', make: (v) => `sub-${v.w}-${v.env}`, note: 'Can be renamed later; Azure publishes no naming rule, so these limits are a house rule' },
  { id: 'rg', abbr: 'rg', name: 'Resource group', min: 1, max: 90, chars: /^[A-Za-z0-9\-_.()]+$/, charsText: 'letters, digits, - _ . ( )', end: /[^.]$/, endText: 'not a period', pattern: 'rg-<workload>-<component>-<env>-<region>', make: (v) => `rg-${v.w}-app-${v.env}-${v.region}` },
  { id: 'vnet', abbr: 'vnet', name: 'Virtual network', min: 2, max: 64, chars: /^[A-Za-z0-9\-_.]+$/, charsText: 'letters, digits, - _ .', start: /^[A-Za-z0-9]/, startText: 'a letter or digit', end: /[A-Za-z0-9_]$/, endText: 'a letter, digit or _', pattern: 'vnet-<workload>-<env>-<region>-<nnn>', make: (v) => `vnet-${v.w}-${v.env}-${v.region}-${v.n3}` },
  { id: 'snet', abbr: 'snet', name: 'Subnet', min: 1, max: 80, chars: /^[A-Za-z0-9\-_.]+$/, charsText: 'letters, digits, - _ .', start: /^[A-Za-z0-9]/, startText: 'a letter or digit', end: /[A-Za-z0-9_]$/, endText: 'a letter, digit or _', pattern: 'snet-<purpose>', make: () => 'snet-app', note: 'Unique within its network' },
  { id: 'kv', abbr: 'kv', name: 'Key vault', min: 3, max: 24, chars: /^[A-Za-z0-9-]+$/, charsText: 'letters, digits, -', start: /^[A-Za-z]/, startText: 'a letter', end: /[A-Za-z0-9]$/, endText: 'a letter or digit', noDoubleHyphen: true, global: true, pattern: 'kv-<short>-<env>-<region>-<nn>', make: (v) => `kv-${v.short}-${v.env}-${v.region}-${v.n2}` },
  { id: 'st', abbr: 'st', name: 'Storage account', min: 3, max: 24, chars: /^[a-z0-9]+$/, charsText: 'lowercase letters and digits only', global: true, pattern: 'st<short><env><region><nn>', make: (v) => `st${v.short}${v.env}${v.region}${v.n2}` },
  { id: 'log', abbr: 'log', name: 'Log Analytics workspace', min: 4, max: 63, chars: /^[A-Za-z0-9-]+$/, charsText: 'letters, digits, -', start: /^[A-Za-z0-9]/, startText: 'a letter or digit', end: /[A-Za-z0-9]$/, endText: 'a letter or digit', pattern: 'log-<workload>-<env>-<region>-<nnn>', make: (v) => `log-${v.w}-${v.env}-${v.region}-${v.n3}` },
  { id: 'id', abbr: 'id', name: 'Managed identity', min: 3, max: 128, chars: /^[A-Za-z0-9\-_]+$/, charsText: 'letters, digits, - _', start: /^[A-Za-z0-9]/, startText: 'a letter or digit', pattern: 'id-<workload>-<purpose>-<env>', make: (v) => `id-${v.w}-app-${v.env}` },
  { id: 'app', abbr: 'app', name: 'Web app', min: 2, max: 60, chars: /^[A-Za-z0-9-]+$/, charsText: 'letters, digits, -', start: /^[A-Za-z0-9]/, startText: 'a letter or digit', end: /[A-Za-z0-9]$/, endText: 'a letter or digit', global: true, pattern: 'app-<workload>-<env>-<region>-<nnn>', make: (v) => `app-${v.w}-${v.env}-${v.region}-${v.n3}` },
  { id: 'sql', abbr: 'sql', name: 'Azure SQL server', min: 1, max: 63, chars: /^[a-z0-9-]+$/, charsText: 'lowercase letters, digits, -', start: /^[a-z0-9]/, startText: 'a letter or digit', end: /[a-z0-9]$/, endText: 'a letter or digit', global: true, pattern: 'sql-<workload>-<env>-<region>-<nnn>', make: (v) => `sql-${v.w}-${v.env}-${v.region}-${v.n3}` },
  { id: 'pep', abbr: 'pep', name: 'Private endpoint', min: 2, max: 64, chars: /^[A-Za-z0-9\-_.]+$/, charsText: 'letters, digits, - _ .', start: /^[A-Za-z0-9]/, startText: 'a letter or digit', end: /[A-Za-z0-9_]$/, endText: 'a letter, digit or _', pattern: 'pep-<target resource name>', make: (v) => `pep-kv-${v.short}-${v.env}-${v.region}-${v.n2}` },
  { id: 'afw', abbr: 'afw', name: 'Azure Firewall', min: 1, max: 80, chars: /^[A-Za-z0-9\-_.]+$/, charsText: 'letters, digits, - _ .', start: /^[A-Za-z0-9]/, startText: 'a letter or digit', end: /[A-Za-z0-9_]$/, endText: 'a letter, digit or _', pattern: 'afw-hub-<env>-<region>-<nnn>', make: (v) => `afw-hub-${v.env}-${v.region}-${v.n3}` },
];
const typeById = Object.fromEntries(types.map((t) => [t.id, t]));

function azureChecks(t, name) {
  const c = [];
  c.push({ ok: name.length >= t.min && name.length <= t.max, text: `${t.min}–${t.max} characters (has ${name.length})` });
  c.push({ ok: name.length > 0 && t.chars.test(name), text: `Allowed: ${t.charsText}` });
  if (t.start) c.push({ ok: t.start.test(name), text: `Starts with ${t.startText}` });
  if (t.end) c.push({ ok: name.length > 0 && t.end.test(name), text: `Ends with ${t.endText}` });
  if (t.noDoubleHyphen) c.push({ ok: !name.includes('--'), text: 'No consecutive hyphens' });
  return c;
}

function conventionChecks(t, name, v) {
  const c = [];
  const hyphenless = t.id === 'st';
  c.push({ ok: hyphenless ? name.startsWith(t.abbr) : name.startsWith(`${t.abbr}-`) || (t.id === 'mg' && name.startsWith(`${v.org}-`)), text: t.id === 'mg' ? `Starts with your org prefix (${v.org}-)` : t.house ? `Starts with the house prefix (${t.abbr}-); CAF defines none` : `Starts with the CAF abbreviation (${t.abbr}${hyphenless ? '' : '-'})` });
  c.push({ ok: name === name.toLowerCase(), text: 'All lowercase' });
  if (!['mg', 'snet', 'pep', 'afw'].includes(t.id)) c.push({ ok: envs.some((e) => name.includes(e)), text: `Includes an environment code (${envs.join(', ')})` });
  if (!['mg', 'sub', 'snet', 'id'].includes(t.id)) c.push({ ok: regions.some((r) => name.includes(r.value)), text: 'Includes a region code' });
  const changing = ['team', 'owner', 'cc', 'test2', 'new', 'old', 'temp'];
  const hit = changing.find((w) => name.split(/[-_.]/).includes(w));
  c.push({ ok: !hit, text: hit ? `“${hit}” changes over time; put it in a tag` : 'Nothing that changes (teams, owners, cost centres)' });
  return c;
}

const segTone = {
  type: 'text-navy',
  workload: 'text-ink',
  component: 'text-muted',
  env: 'text-gold',
  region: 'text-good',
  inst: 'text-subtle',
};

/** Split a generated name into labelled parts for the anatomy view. */
function anatomy(t, v) {
  if (t.id === 'st') return [['type', 'st'], ['workload', v.short], ['env', v.env], ['region', v.region], ['inst', v.n2]];
  if (t.id === 'kv') return [['type', 'kv'], ['workload', v.short], ['env', v.env], ['region', v.region], ['inst', v.n2]];
  if (t.id === 'rg') return [['type', 'rg'], ['workload', v.w], ['component', 'app'], ['env', v.env], ['region', v.region]];
  if (['vnet', 'log', 'app', 'sql'].includes(t.id)) return [['type', t.abbr], ['workload', v.w], ['env', v.env], ['region', v.region], ['inst', v.n3]];
  return null;
}

const broken = [
  { label: 'Key vault: too long', type: 'kv', name: 'kv-loanservicing-prod-centralus-01' },
  { label: 'Storage: hyphens', type: 'st', name: 'st-lnsvc-prod-cus-01' },
  { label: 'Key vault: double hyphen', type: 'kv', name: 'kv-lnsvc--prod-cus' },
  { label: 'Group: team name', type: 'rg', name: 'rg-payments-team-prod-cus' },
  { label: 'SQL: uppercase', type: 'sql', name: 'sql-LoanSvc-prod-cus-001' },
];

const accelDefaults = [
  ['Platform workspace', 'law-management-<region>', 'log-platform-prod-cus-001'],
  ['Hub firewall', 'fw-hub-<region>', 'afw-hub-prod-cus-001'],
  ['Firewall policy', 'fwp-hub-<region>', 'afwp-hub-prod-cus-001'],
  ['Monitoring agent identity', 'uami-management-ama-<region>', 'id-ama-platform-prod-cus'],
  ['DNS Private Resolver', 'pdr-hub-dns-<region>', 'dnspr-hub-prod-cus-001'],
  ['Hub virtual network', 'vnet-hub-<region>', 'vnet-hub-prod-cus-001'],
  ['Hub resource group', 'rg-hub-<region>', 'rg-hub-network-prod-cus'],
];

export default function Naming() {
  const [org, setOrg] = useState('contoso');
  const [w, setW] = useState('loansvc');
  const [short, setShort] = useState('lnsvc');
  const [env, setEnv] = useState('prod');
  const [region, setRegion] = useState('cus');
  const [inst, setInst] = useState(1);
  const [focus, setFocus] = useState('kv');
  const [checkType, setCheckType] = useState('kv');
  const [candidate, setCandidate] = useState('kv-loanservicing-prod-centralus-01');

  const v = useMemo(
    () => ({
      org: org.trim().toLowerCase() || 'contoso',
      w: w.trim() || 'app',
      short: short.trim() || w.trim().slice(0, 6),
      env,
      region,
      n3: String(inst).padStart(3, '0'),
      n2: String(inst).padStart(2, '0'),
    }),
    [org, w, short, env, region, inst],
  );

  const rows = types.map((t) => {
    const name = t.make(v);
    const az = azureChecks(t, name);
    return { t, name, valid: az.every((c) => c.ok), az };
  });
  const invalid = rows.filter((r) => !r.valid);
  const ft = typeById[focus];
  const fname = ft.make(v);
  const parts = anatomy(ft, v);

  const ct = typeById[checkType];
  const az = azureChecks(ct, candidate);
  const conv = conventionChecks(ct, candidate, v);
  const azOk = az.every((c) => c.ok);
  const convOk = conv.every((c) => c.ok);

  return (
    <article>
      <PageHeader
        eyebrow="Tool · Naming studio"
        title="Names you can live with for years"
        deck="Generate names from one convention, watch Azure's length and character rules bite, and check names someone else wrote."
        meta={[
          { dt: 'Pattern', dd: 'type-workload-env-region-nnn' },
          { dt: 'Resource types', dd: String(types.length) },
          { dt: 'Source', dd: 'CAF abbreviations' },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Generate" intro="Change the inputs and every name updates. Names that break an Azure rule turn red; the short form exists for the types with tight limits.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextInput id="nm-org" label="Organisation prefix" value={org} onChange={setOrg} mono hint="Used in management-group IDs" />
          <TextInput id="nm-w" label="Workload" value={w} onChange={(x) => setW(x.toLowerCase().replace(/[^a-z0-9]/g, ''))} mono hint="Short, stable, from a registered list" />
          <TextInput id="nm-short" label="Short form" value={short} onChange={(x) => setShort(x.toLowerCase().replace(/[^a-z0-9]/g, ''))} mono hint="For key vaults and storage (24-char limit)" />
          <Segmented label="Environment" value={env} onChange={setEnv} options={envs.map((e) => ({ value: e, label: e }))} />
          <Select id="nm-region" label="Region" value={region} onChange={setRegion} options={regions} />
          <Segmented label="Instance" value={inst} onChange={setInst} options={[1, 2, 3].map((n) => ({ value: n, label: String(n).padStart(3, '0') }))} />
        </div>

        <div className="mt-6 border border-rule bg-surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="label">Anatomy · {ft.name}</p>
            <p className="font-mono text-[12px] text-subtle">{ft.pattern}</p>
          </div>
          {parts ? (
            <div className="mt-3 flex flex-wrap items-start gap-y-3 font-mono text-[22px] sm:text-[26px]">
              {parts.map(([k, val], i) => (
                <span key={k} className="flex items-start">
                  <span className="flex flex-col items-start">
                    <span className={segTone[k]}>{val}</span>
                    <span className="mt-1 whitespace-nowrap font-sans text-[10px] uppercase tracking-[0.12em] text-subtle">
                      {k === 'inst' ? 'instance' : k === 'env' ? 'env' : k}
                    </span>
                  </span>
                  {i < parts.length - 1 && <span className="px-1 text-subtle">{ft.id === 'st' ? '' : '-'}</span>}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 break-all font-mono text-[22px] text-ink">{fname}</p>
          )}
          <div className="mt-4">
            <div className="flex justify-between text-[12px] text-subtle">
              <span>Length</span>
              <span className="tabular font-mono">
                {fname.length} / {ft.max}
              </span>
            </div>
            <div className="mt-1 h-[6px] w-full bg-faint">
              <div
                className={`h-full transition-all ${fname.length > ft.max ? 'bg-bad' : fname.length > ft.max * 0.85 ? 'bg-gold' : 'bg-navy'}`}
                style={{ width: `${Math.min(100, (fname.length / ft.max) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto border-y border-rule">
          <table className="w-full min-w-[620px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule">
                {['Type', 'Generated name', 'Length', 'Azure rules'].map((h) => (
                  <th key={h} className="label px-3 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ t, name, valid, az: checks }) => (
                <tr
                  key={t.id}
                  onClick={() => setFocus(t.id)}
                  className={`cursor-pointer border-b border-faint last:border-b-0 ${focus === t.id ? 'bg-navy-soft' : 'hover:bg-faint'}`}
                >
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => setFocus(t.id)} className="text-left text-ink">
                      {t.name}
                    </button>
                    {t.global && <span className="ml-2 align-middle"><Pill>Global</Pill></span>}
                  </td>
                  <td className={`break-all px-3 py-2 font-mono text-[12.5px] ${valid ? 'text-ink' : 'text-bad'}`}>{name}</td>
                  <td className="tabular px-3 py-2 font-mono text-[12.5px] text-muted">
                    {name.length}/{t.max}
                  </td>
                  <td className="px-3 py-2">
                    {valid ? (
                      <Pill tone="good">Valid</Pill>
                    ) : (
                      <span className="text-[12.5px] text-bad">{checks.filter((c) => !c.ok).map((c) => c.text).join('; ')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Insight tone={invalid.length ? 'bad' : 'navy'} stateKey={invalid.map((r) => r.t.id).join(',') || 'ok'} title={invalid.length ? 'Some names break the rules' : 'Every name is valid'}>
            <p>
              {invalid.length
                ? `${invalid.map((r) => r.t.name).join(', ')} ${invalid.length === 1 ? 'fails' : 'fail'} Azure's rules. Shorten the short form, or drop the instance to two digits where the limit is tight.`
                : 'Types marked Global must also be unique across all of Azure, because the name becomes part of a public DNS name. Check availability before you commit.'}
            </p>
          </Insight>
        </div>
      </Section>

      <Section n={2} title="Check a name" intro="Paste a name someone else wrote. Azure's rules decide whether it deploys; the convention decides whether it fits.">
        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <Select id="nm-ctype" label="Resource type" value={checkType} onChange={setCheckType} options={types.map((t) => ({ value: t.id, label: t.name }))} />
          <TextInput id="nm-candidate" label="Name" value={candidate} onChange={setCandidate} mono />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="label self-center">Try</span>
          {broken.map((b) => (
            <button
              key={b.name}
              type="button"
              onClick={() => {
                setCheckType(b.type);
                setCandidate(b.name);
              }}
              className="border border-rule px-2 py-1 text-[12px] text-muted hover:border-navy hover:text-navy"
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ['Azure rules', az, azOk, azOk ? 'Deploys' : 'Rejected by Azure'],
            ['House convention', conv, convOk, convOk ? 'Fits' : 'Needs work'],
          ].map(([title, list, ok, verdict]) => (
            <div key={title} className="border border-rule bg-surface">
              <div className="flex items-center justify-between border-b border-faint px-4 py-2.5">
                <p className="label !text-ink">{title}</p>
                <Pill tone={ok ? 'good' : 'bad'}>{verdict}</Pill>
              </div>
              <ul className="space-y-1.5 p-4">
                {list.map((c) => (
                  <li key={c.text} className="flex items-start gap-2 text-[13.5px] leading-[1.45]">
                    {c.ok ? <Check size={14} className="mt-[2px] shrink-0 text-good" /> : <X size={14} className="mt-[2px] shrink-0 text-bad" />}
                    <span className={c.ok ? 'text-ink' : 'text-bad'}>{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {ct.global && (
          <p className="mt-3 text-[13px] text-muted">
            A {ct.name.toLowerCase()} name must be unique across all of Azure. This page can’t check that; the deployment will.
          </p>
        )}
      </Section>

      <Section n={3} title="Override the accelerator’s defaults first" wide={false}>
        <p className="text-[15.5px] leading-[1.65] text-ink">
          Several of the accelerator’s default names (law-, fw-, fwp-, pdr-, uami-) don’t use CAF abbreviations. Change them before the first
          deployment: renaming later means recreating the resource. Management-group IDs can’t be changed at all.
        </p>
        <div className="mt-4 overflow-x-auto border-y border-rule">
          <table className="w-full min-w-[540px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule">
                {['Resource', 'Accelerator default', 'With this convention'].map((h) => (
                  <th key={h} className="label px-3 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accelDefaults.map(([r, d, n]) => (
                <tr key={r} className="border-b border-faint last:border-b-0">
                  <td className="px-3 py-2 text-ink">{r}</td>
                  <td className="px-3 py-2 font-mono text-[12.5px] text-muted">{d}</td>
                  <td className="px-3 py-2 font-mono text-[12.5px] text-ink">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-4">
          <Code title="platform-landing-zone.tfvars · illustrative excerpt">{`custom_replacements = {
  names = {
    # resource names the starter module uses
    management_resource_group_name          = "rg-management-prod-cus"
    log_analytics_workspace_name            = "log-platform-prod-cus-001"
    # ...one entry per name you override
  }
}`}</Code>
          <Callout tone="gold" title="Check the key names against your version">
            The exact keys under custom_replacements.names vary by starter-module release. Copy them from the tfvars file your
            bootstrap generated rather than from this excerpt. Management-group IDs and display names are set separately, in the
            alz_custom architecture definition under lib/architecture_definitions/; then update subscription_placement and
            policy_assignments_to_modify to the new IDs.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.naming, src.abbreviations, src.namingRules, src.mgOptions]} />
    </article>
  );
}
