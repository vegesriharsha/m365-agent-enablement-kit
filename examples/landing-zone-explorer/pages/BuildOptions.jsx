import { useState } from 'react';
import { Play } from 'lucide-react';
import { PageHeader, Section, Insight, Segmented, Button, Pill, Sources, Callout } from '../components/ui.jsx';
import { useProgress } from '../lib/hooks.js';
import { VERIFIED, src } from '../data/sources.js';

const options = [
  { id: 'clickops', name: 'Click-ops in the portal', short: 'Click-ops', blurb: 'Build it by hand from the portal. Fast for one subscription, impossible to repeat exactly.' },
  { id: 'custom', name: 'Your own Terraform or Bicep', short: 'Custom code', blurb: 'Write every resource yourself. Full control, and every policy update is yours to make.' },
  { id: 'avm', name: 'AVM modules, wired by you', short: 'AVM modules', blurb: 'Use Microsoft’s verified pattern modules and assemble the pipelines, state and identities yourself.' },
  { id: 'accel', name: 'The ALZ IaC accelerator', short: 'Accelerator', blurb: 'Bootstraps repos, pipelines, identities and state, then deploys starter code built on the AVM modules.' },
];

// [score, reason] for each option, per answer.
const questions = [
  {
    id: 'scale',
    q: 'How many subscriptions in three years?',
    answers: {
      few: { label: 'A handful', s: { clickops: [1, 'Manageable by hand at this size'], custom: [0, 'Code pays off slowly at this size'], avm: [1, 'Modules still save design time'], accel: [2, 'Same setup effort whatever the size'] } },
      dozens: { label: 'Dozens', s: { clickops: [-2, 'Every new subscription is configured by hand'], custom: [1, 'Repeatable once written'], avm: [2, 'Vending module makes subscriptions repeatable'], accel: [2, 'Vending and pipelines included'] } },
      hundreds: { label: 'Hundreds', s: { clickops: [-3, 'Can’t keep hundreds consistent by hand'], custom: [1, 'Repeatable, but you maintain all of it'], avm: [2, 'Scales through the vending module'], accel: [3, 'Built for this, with vending as code'] } },
    },
  },
  {
    id: 'audit',
    q: 'Do changes need approvals and an audit trail?',
    answers: {
      regulated: { label: 'Yes, we’re regulated', s: { clickops: [-3, 'No review before a change; only the activity log after'], custom: [1, 'Possible, once you build the pipeline'], avm: [1, 'Possible, once you build the pipeline'], accel: [3, 'Pull requests, approvals and split plan/apply identities from day one'] } },
      light: { label: 'Nice to have', s: { clickops: [0, ''], custom: [1, 'Git history comes free'], avm: [1, 'Git history comes free'], accel: [1, 'Approvals are there if you want them'] } },
    },
  },
  {
    id: 'skills',
    q: 'How much Terraform experience does the team have?',
    answers: {
      none: { label: 'None yet', s: { clickops: [1, 'No new skills needed to start'], custom: [-3, 'Writing a platform from scratch is a steep first project'], avm: [-1, 'Wiring modules and pipelines needs experience'], accel: [1, 'Generates working code to learn from'] } },
      some: { label: 'Some', s: { clickops: [0, ''], custom: [-1, 'Large surface to get right alone'], avm: [1, 'Reasonable with good examples'], accel: [2, 'You change inputs, not the plumbing'] } },
      strong: { label: 'Strong', s: { clickops: [-1, 'Wastes the team’s skills'], custom: [2, 'The team can own it'], avm: [2, 'The team can own the wiring'], accel: [2, 'Fast start, still fully editable'] } },
    },
  },
  {
    id: 'design',
    q: 'How close is your design to the ALZ reference?',
    answers: {
      close: { label: 'Close', s: { clickops: [0, ''], custom: [-1, 'Rewrites what Microsoft already maintains'], avm: [1, 'Fits the modules'], accel: [3, 'The defaults are your design'] } },
      some: { label: 'Some changes', s: { clickops: [0, ''], custom: [0, ''], avm: [2, 'Modules take your overrides'], accel: [2, 'Library overrides and tfvars cover most changes'] } },
      far: { label: 'Very different', s: { clickops: [0, ''], custom: [2, 'Only code you write fits a design this different'], avm: [2, 'Use the modules you need, skip the rest'], accel: [0, 'You’d fight the starter module'] } },
    },
  },
];

const stack = [
  { id: 'you', name: 'Your configuration', who: 'You', items: ['platform-landing-zone.tfvars', 'inputs.yaml', 'lib/ overrides (archetypes, policy assignments)'], update: 'You change inputs in a pull request. The plan shows exactly what moves.' },
  { id: 'starter', name: 'Accelerator starter module', who: 'Microsoft (ALZ team)', items: ['platform_landing_zone starter', 'bootstrap modules for GitHub, Azure DevOps or local'], update: 'New accelerator releases arrive as a new starter version. Re-run the accelerator or merge the change into your repo.' },
  { id: 'ptn', name: 'AVM pattern modules', who: 'Microsoft (AVM owners)', items: ['avm-ptn-alz (management groups, policy, roles)', 'avm-ptn-alz-management', 'connectivity: hub-and-spoke or Virtual WAN', 'avm-ptn-alz-sub-vending'], update: 'Semantic versions on the Terraform Registry. Pin them; read release notes before bumping.' },
  { id: 'res', name: 'AVM resource modules', who: 'Microsoft (AVM owners)', items: ['avm-res-network-virtualnetwork', 'avm-res-network-azurefirewall', 'avm-res-operationalinsights-workspace', '…one per resource type'], update: 'Pulled in by the pattern modules. You rarely touch them directly.' },
  { id: 'prov', name: 'Providers', who: 'HashiCorp and Microsoft', items: ['AzureRM ~> 4.x (starter, management, connectivity)', 'AzAPI (avm-ptn-alz, vending)', 'alz (reads the library)'], update: 'Constraints are set by the modules above. A provider major version only works once every module allows it.' },
  { id: 'lib', name: 'ALZ library', who: 'Microsoft (ALZ team)', items: ['Policy definitions and initiatives', 'Archetypes per management group', 'Release 2026.10.0'], update: 'Dated releases. The alz provider reads the version you pin, so new policies arrive only when you choose.' },
];

export default function BuildOptions() {
  const [ans, setAns] = useState({ scale: 'dozens', audit: 'regulated', skills: 'some', design: 'close' });
  const [layer, setLayer] = useState('ptn');
  const [trace, setTrace] = useState(0);
  const [provider, setProvider] = useState('4');
  const t = useProgress(`trace-${trace}`, 3200);

  const scored = options
    .map((o) => {
      const parts = questions.map((q) => {
        const [score, reason] = q.answers[ans[q.id]].s[o.id];
        return { score, reason };
      });
      return { ...o, total: parts.reduce((a, p) => a + p.score, 0), parts };
    })
    .sort((a, b) => b.total - a.total);
  const best = scored[0];
  const max = 11;
  const tracing = trace > 0 && t < 1;
  const traceIndex = tracing ? stack.length - 1 - Math.min(stack.length - 1, Math.floor(t * stack.length)) : -1;
  const L = stack.find((s) => s.id === layer);

  return (
    <article>
      <PageHeader
        eyebrow="Explorer · Build options"
        title="Four ways to build it, one that usually wins"
        deck="Answer four questions about your organisation and watch the options re-rank. Then look inside the stack the accelerator gives you."
        meta={[
          { dt: 'Options', dd: '4' },
          { dt: 'Questions', dd: '4' },
          { dt: 'Default pick', dd: 'Accelerator' },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Which fits you" intro="The scores are a teaching aid, not a formula. Read the reasons; they are what to argue about.">
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {questions.map((q) => (
            <Segmented
              key={q.id}
              label={q.q}
              value={ans[q.id]}
              onChange={(v) => setAns((a) => ({ ...a, [q.id]: v }))}
              options={Object.entries(q.answers).map(([value, a]) => ({ value, label: a.label }))}
            />
          ))}
        </div>

        <ol className="mt-8 space-y-3">
          {scored.map((o, i) => (
            <li key={o.id} className={`border ${i === 0 ? 'border-navy' : 'border-rule'} bg-surface p-4 transition-all`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="tabular font-mono text-[12px] text-navy">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[16px] font-semibold text-ink">{o.name}</span>
                  {i === 0 && <Pill tone="navy">Best fit</Pill>}
                </div>
                <span className={`tabular font-mono text-[14px] ${o.total < 0 ? 'text-bad' : 'text-ink'}`}>{o.total > 0 ? `+${o.total}` : o.total}</span>
              </div>
              <div className="mt-2 h-[6px] w-full bg-faint">
                <div
                  className={`h-full transition-all duration-500 ${o.total < 0 ? 'bg-bad' : i === 0 ? 'bg-navy' : 'bg-subtle'}`}
                  style={{ width: `${Math.max(2, (Math.max(0, o.total) / max) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[14px] leading-[1.55] text-muted">{o.blurb}</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {o.parts
                  .filter((p) => p.reason)
                  .map((p) => (
                    <li key={p.reason} className={`text-[12.5px] ${p.score > 0 ? 'text-good' : p.score < 0 ? 'text-bad' : 'text-subtle'}`}>
                      {p.score > 0 ? '+' : p.score < 0 ? '−' : '·'} {p.reason}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ol>
        <div className="mt-4">
          <Insight stateKey={JSON.stringify(ans)} tone={best.id === 'clickops' ? 'gold' : 'navy'}>
            <p>
              {best.id === 'accel' && 'The accelerator fits. Start with it even if you expect to customise: it is plain Terraform in your own repo, so nothing stops you editing it later.'}
              {best.id === 'avm' && 'Assemble the AVM modules yourself. You keep Microsoft-maintained building blocks but own the pipelines, state and identities.'}
              {best.id === 'custom' && 'Your own code fits a design this different, but budget for maintaining the policy set yourself; still borrow AVM resource modules where they fit.'}
              {best.id === 'clickops' && 'Click-ops can work for a short trial. Plan the move to code before the second workload arrives; the Brownfield page shows what that costs.'}
            </p>
          </Insight>
        </div>
      </Section>

      <Section n={2} title="Inside the accelerator’s stack" intro="Select a layer to see who maintains it and how updates reach you. Trace an update to watch a new policy travel up from the library.">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-1.5">
            {stack.map((s, i) => {
              const lit = traceIndex !== -1 && i >= traceIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={layer === s.id}
                  onClick={() => setLayer(s.id)}
                  className={`flex w-full items-center justify-between gap-3 border px-4 py-3 text-left transition-colors duration-300 ${
                    layer === s.id ? 'border-navy bg-navy text-on-navy' : lit ? 'border-gold bg-gold-soft text-ink' : 'border-rule bg-surface text-ink hover:border-subtle'
                  }`}
                >
                  <span className="text-[14.5px] font-medium">{s.name}</span>
                  <span className={`text-[12px] ${layer === s.id ? 'text-on-navy' : 'text-subtle'}`}>{s.who}</span>
                </button>
              );
            })}
            <div className="pt-2">
              <Button variant="secondary" onClick={() => setTrace((n) => n + 1)}>
                <Play size={14} /> Trace an update
              </Button>
            </div>
          </div>
          <div className="fade-in min-w-0 border border-rule bg-paper p-5" key={layer}>
            <p className="label">{L.who}</p>
            <h3 className="mt-1 font-display text-[28px] font-semibold leading-[1.1] text-ink">{L.name}</h3>
            <ul className="mt-3 space-y-1.5">
              {L.items.map((it) => (
                <li key={it} className="flex gap-2.5 font-mono text-[12.5px] text-ink">
                  <span className="mt-[7px] h-[4px] w-[4px] shrink-0 bg-gold" />
                  {it}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] leading-[1.6] text-muted">{L.update}</p>
          </div>
        </div>
        {trace > 0 && (
          <div className="mt-4">
            <Insight title="An update, start to finish" stateKey={String(tracing)}>
              <p>
                Microsoft publishes a new ALZ library release. Nothing changes in your estate until you bump the version you pin; the alz
                provider reads it, the pattern module turns it into policy objects, and your pull request shows the plan for review. That
                pin is why upgrades are a decision, not a surprise.
              </p>
            </Insight>
          </div>
        )}
      </Section>

      <Section n={3} title="Provider versions" intro="A provider’s new major version works only when every module in the stack allows it. Try it.">
        <div className="max-w-[360px]">
          <Segmented
            label="AzureRM version you pin"
            value={provider}
            onChange={setProvider}
            options={[
              { value: '4', label: '~> 4.0' },
              { value: '5', label: '~> 5.0' },
            ]}
          />
        </div>
        <div className="mt-4 border border-rule bg-callout">
          <div className="flex items-center justify-between border-b border-faint px-3 py-1.5">
            <span className="label">terraform init · illustrative output</span>
            <Pill tone={provider === '4' ? 'good' : 'bad'}>{provider === '4' ? 'Succeeds' : 'Fails'}</Pill>
          </div>
          <pre className="fade-in overflow-x-auto px-3 py-3 font-mono text-[12.5px] leading-[1.6] text-ink" key={provider}>
            {provider === '4'
              ? `Initializing provider plugins...
- Finding hashicorp/azurerm versions matching "~> 4.0"...
- Installing hashicorp/azurerm v4.x...
- Installing azure/azapi...
- Installing azure/alz...

Terraform has been successfully initialized!`
              : `Initializing provider plugins...
- Finding hashicorp/azurerm versions matching "~> 5.0, ~> 4.0"...

Error: Failed to query available provider packages

Could not retrieve the list of available versions for provider
hashicorp/azurerm: no available releases match the given constraints
~> 5.0, ~> 4.0`}
          </pre>
        </div>
        <div className="mt-4">
          <Insight tone={provider === '4' ? 'navy' : 'bad'} stateKey={provider}>
            <p>
              {provider === '4'
                ? 'The starter, management and connectivity modules constrain AzureRM to 4.x; avm-ptn-alz and the vending module use only AzAPI. Stay on 4.x until their release notes say otherwise.'
                : 'AzureRM 5.0 has been generally available since July 2026, but the starter, management and connectivity modules still constrain it to 4.x, so Terraform can’t find a version that satisfies both. Wait for the modules to move, then upgrade in one pull request.'}
            </p>
          </Insight>
        </div>
        <div className="mt-5">
          <Callout tone="gold" title="Check before you rely on this">
            Module constraints change with each release. Look at the required_providers block in the module versions you pin; the
            Technology register page records when this was last checked.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.accelerator, src.moduleIndex, src.avm, src.avmPattern, src.alzLibrary, src.azurermV5]} />
    </article>
  );
}
