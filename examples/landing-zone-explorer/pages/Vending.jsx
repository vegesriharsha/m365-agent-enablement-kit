import { useMemo, useState } from 'react';
import { Check, Send } from 'lucide-react';
import { PageHeader, Section, Insight, Segmented, Select, TextInput, Toggle, Slider, Button, Pill, Sources, Callout, Code } from '../components/ui.jsx';
import { useProgress } from '../lib/hooks.js';
import { VERIFIED, src } from '../data/sources.js';

// Spoke address pool 10.20.0.0/20 split into /24 blocks; true = already allocated.
const POOL = [true, true, true, false, true, false, false, false, false, false, false, false, false, false, false, false];

function allocate(size) {
  const blocks = size === 23 ? 2 : 1;
  for (let i = 0; i + blocks <= POOL.length; i += blocks) {
    if (POOL.slice(i, i + blocks).every((u) => !u)) return { start: i, blocks };
  }
  return null;
}

const regionName = { cus: 'centralus', eus2: 'eastus2' };

export default function Vending() {
  const [w, setW] = useState('loansvc');
  const [env, setEnv] = useState('prod');
  const [lz, setLz] = useState('corp');
  const [region, setRegion] = useState('cus');
  const [cc, setCc] = useState('CC-210');
  const [budget, setBudget] = useState(1500);
  const [size, setSize] = useState(24);
  const [peer, setPeer] = useState(false);
  const [billing, setBilling] = useState('mca');
  const [submitted, setSubmitted] = useState(0);

  const name = (w || 'app').toLowerCase().replace(/[^a-z0-9]/g, '');
  const peered = lz === 'corp' || peer;
  const alloc = allocate(size);
  const cidr = alloc ? `10.20.${alloc.start}.0/${size}` : 'pool exhausted';
  const rgs = ['network', 'app', 'data', 'monitor'].map((c) => `rg-${name}-${c}-${env}-${region}`);
  const workloadType = billing === 'csp' || env === 'prod' || env === 'uat' ? 'Production' : 'DevTest';

  const steps = useMemo(
    () => [
      billing === 'csp'
        ? { k: 'sub', title: 'Adopt the subscription', detail: 'The partner creates it in your tenant and sends the ID; the module adopts it instead of creating one.' }
        : { k: 'sub', title: 'Create the subscription', detail: `sub-${name}-${env}, ${workloadType} offer, from your billing scope.` },
      { k: 'mg', title: `Place it in ${lz === 'corp' ? 'Internal (Corp)' : 'Online'}`, detail: 'It inherits that management group’s policies the moment it lands.' },
      { k: 'tags', title: 'Tag it', detail: `costcenter=${cc}, app=${name}, env=${env}, owner=<group>` },
      { k: 'budget', title: `Budget of $${budget.toLocaleString()} a month`, detail: 'Actual and forecast alerts at 50, 90 and 100 percent to the workload’s action group.' },
      { k: 'rg', title: 'Create resource groups', detail: rgs.join(', ') },
      { k: 'vnet', title: `Virtual network ${cidr}`, detail: peered ? 'Peered to the hub; DNS points at the hub resolver.' : 'Not peered: public app behind its own WAF.' },
      ...(peered ? [{ k: 'rt', title: 'Route table to the firewall', detail: '0.0.0.0/0 and private ranges go to the hub firewall.' }] : []),
      { k: 'rbac', title: 'Role assignments for Entra groups', detail: `grp-${name}-${env}-contributors and grp-${name}-${env}-readers; nobody by name.` },
      { k: 'id', title: 'Pipeline identity for the workload', detail: `id-${name}-deploy-${env}, federated to the workload repo’s ${env} environment.` },
    ],
    [billing, name, env, workloadType, lz, cc, budget, rgs, cidr, peered],
  );

  const t = useProgress(`vend-${submitted}`, 400 + steps.length * 420);
  const shown = submitted ? Math.min(steps.length, Math.floor(t * (steps.length + 0.999))) : 0;
  const finished = submitted > 0 && t >= 1;

  const hcl = `module "sub_${name}_${env}" {
  source  = "Azure/avm-ptn-alz-sub-vending/azure"
  version = "0.3.4" # latest when checked; pin what you test

  location = "${regionName[region]}"
${
  billing === 'csp'
    ? `
  # CSP: the partner created the subscription; adopt it by ID
  subscription_alias_enabled   = false
  subscription_id              = "<id from the partner>"
  subscription_update_existing = true # needed to rename and tag an adopted subscription
  subscription_display_name    = "sub-${name}-${env}"
`
    : `
  subscription_alias_enabled = true
  subscription_billing_scope = "<billing scope ID>"
  subscription_alias_name    = "sub-${name}-${env}"
  subscription_display_name  = "sub-${name}-${env}"
  subscription_workload      = "${workloadType}"
`
}
  subscription_management_group_association_enabled = true
  subscription_management_group_id                  = "contoso-${lz}"

  subscription_tags = {
    costcenter = "${cc}"
    app        = "${name}"
    env        = "${env}"
    owner      = "grp-${name}-${env}-contributors"
  }

  resource_group_creation_enabled = true
  resource_groups = {
${rgs.map((r) => `    ${r.split('-')[2]} = { name = "${r}", location = "${regionName[region]}" }`).join('\n')}
  }

  virtual_network_enabled = true
  virtual_networks = {
    primary = {
      name                = "vnet-${name}-${env}-${region}-001"
      address_space       = ["${cidr}"]
      resource_group_key  = "network"
      hub_peering_enabled = ${peered}${peered ? `\n      hub_network_resource_id = "<hub virtual network ID>"` : ''}
    }
  }

  budget_enabled = true
  budgets = {
    monthly = {
      name              = "budget-${name}-${env}"
      amount            = ${budget}
      time_grain        = "Monthly"
      time_period_start = "2026-12-01T00:00:00Z"
      time_period_end   = "2027-11-30T23:59:59Z"
      # notifications: actual and forecast at 50, 90 and 100 percent
    }
  }

  role_assignment_enabled = true
  role_assignments = {
    contributors = {
      principal_id   = "<object ID of grp-${name}-${env}-contributors>"
      definition     = "Contributor"
      relative_scope = ""
    }
  }
}`;

  return (
    <article>
      <PageHeader
        eyebrow="Simulator · Subscription vending"
        title="A subscription is a pull request, not a ticket"
        deck="Fill in a workload’s request and watch the vending module build a ready-to-use landing zone: placed, tagged, budgeted, networked and access-controlled."
        meta={[
          { dt: 'Module', dd: 'avm-ptn-alz-sub-vending' },
          { dt: 'Steps', dd: String(steps.length) },
          { dt: 'Billing', dd: billing === 'csp' ? 'CSP (adopt by ID)' : billing.toUpperCase() },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Request a landing zone" intro="These are the questions a vending form asks. Everything else comes from the platform’s defaults.">
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
          <TextInput id="v-w" label="Workload short name" value={w} onChange={setW} mono hint="Becomes part of every name" />
          <Segmented label="Environment" value={env} onChange={setEnv} options={['prod', 'uat', 'dev'].map((e) => ({ value: e, label: e }))} />
          <Segmented
            label="Landing zone type"
            value={lz}
            onChange={setLz}
            options={[
              { value: 'corp', label: 'Internal (Corp)' },
              { value: 'online', label: 'Online' },
            ]}
          />
          <Select
            id="v-region"
            label="Region"
            value={region}
            onChange={setRegion}
            options={[
              { value: 'cus', label: 'Central US' },
              { value: 'eus2', label: 'East US 2' },
            ]}
          />
          <TextInput id="v-cc" label="Cost centre" value={cc} onChange={setCc} mono />
          <Slider id="v-budget" label="Monthly budget" min={250} max={10000} step={250} value={budget} onChange={setBudget} format={(v) => `$${v.toLocaleString()}`} />
          <Segmented
            label="Network size"
            value={size}
            onChange={setSize}
            options={[
              { value: 24, label: '/24 · 256 addresses' },
              { value: 23, label: '/23 · 512' },
            ]}
          />
          <Segmented
            label="How you buy Azure"
            value={billing}
            onChange={setBilling}
            options={[
              { value: 'mca', label: 'MCA' },
              { value: 'ea', label: 'EA' },
              { value: 'csp', label: 'CSP' },
            ]}
          />
          {lz === 'online' && <Toggle label="Peer to the hub" checked={peer} onChange={setPeer} hint="Online apps may not need private connectivity" />}
        </div>

        <div className="mt-6">
          <p className="label mb-2">Spoke address pool · 10.20.0.0/20</p>
          <div className="grid grid-cols-8 gap-1 sm:grid-cols-16">
            {POOL.map((used, i) => {
              const isNew = alloc && i >= alloc.start && i < alloc.start + alloc.blocks;
              return (
                <div
                  key={i}
                  title={`10.20.${i}.0/24`}
                  className={`flex h-9 items-center justify-center border font-mono text-[10.5px] transition-colors ${
                    isNew ? 'border-navy bg-navy text-on-navy' : used ? 'border-rule bg-faint text-subtle' : 'border-rule bg-surface text-subtle'
                  }`}
                >
                  .{i}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[12.5px] text-subtle">
            Grey blocks belong to other spokes. The new network takes the first free {size === 23 ? 'aligned pair of blocks' : 'block'}: {cidr}.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => setSubmitted((n) => n + 1)}>
            <Send size={14} /> {submitted ? 'Submit again' : 'Submit request'}
          </Button>
          {billing === 'csp' && env === 'dev' && <Pill tone="gold">CSP: Dev/Test offer unavailable, uses Production</Pill>}
        </div>
      </Section>

      <Section n={2} title="What the pipeline builds" intro={submitted ? undefined : 'Submit the request to watch the steps run.'}>
        <ol className="space-y-1.5">
          {steps.map((s, i) => {
            const ok = i < shown;
            return (
              <li key={s.k} className={`flex gap-3 border px-4 py-3 transition-colors duration-300 ${ok ? 'border-navy bg-surface' : 'border-rule bg-paper opacity-60'}`}>
                <span className={`mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center border ${ok ? 'border-navy bg-navy text-on-navy' : 'border-rule'}`}>
                  {ok && <Check size={12} />}
                </span>
                <div className="min-w-0">
                  <p className="text-[14.5px] font-medium text-ink">{s.title}</p>
                  <p className="break-words text-[13px] leading-[1.5] text-muted">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {finished && (
          <div className="mt-4">
            <Insight tone="good" stateKey={String(submitted)} title="Ready for the workload team">
              <p>
                {billing === 'csp'
                  ? 'Once the partner handed over the ID, this took one pull request. Agree the partner’s turnaround in writing; with a steady estate, a day or two is fine.'
                  : 'One reviewed pull request produced a subscription that already obeys policy, reports cost to the right budget and can reach the hub. The workload team deploys into it with its own pipeline identity.'}
              </p>
            </Insight>
          </div>
        )}
      </Section>

      <Section n={3} title="The module call it generates" intro="Illustrative. Variable names follow the vending module’s documented inputs; check them against the release you pin.">
        <Code title={`landing-zones/${name}-${env}.tf`}>{hcl}</Code>
        <div className="mt-4">
          <Callout tone="gold" title={billing === 'csp' ? 'Under CSP' : 'Billing scope'}>
            {billing === 'csp'
              ? 'Only the partner can create subscriptions under a Microsoft Partner Agreement. The vending module adopts the subscription by ID and does everything else: placement, tags, budget, network, access.'
              : 'Creating subscriptions needs a role on the billing scope (an enrollment account for EA, an invoice section for MCA). Give it to the vending pipeline’s identity, not to people.'}
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.subVending, src.subVendingRepo, src.mpaSubs, src.cafCsp, src.budgets]} />
    </article>
  );
}
