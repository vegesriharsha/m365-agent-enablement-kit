import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, Section, Insight, Button, Pill, Sources, Callout, Code } from '../components/ui.jsx';
import { VERIFIED, src } from '../data/sources.js';

const steps = [
  { title: 'Take stock', text: 'Everything was built by hand. It works, but nobody can say exactly how, and every change is a risk.' },
  { title: 'Decide: adopt or replace', text: 'Go component by component. Adopt keeps the resource and brings it under code; replace builds a new one in code and retires the old. Change the choices below and watch the plan shift.' },
  { title: 'Bootstrap beside it', text: 'Run the accelerator to the end of its bootstrap: repos, pipelines, identities, state. Give the new hierarchy its own management-group IDs and set move_subscriptions_to_target_management_group to false, so nothing moves yet.' },
  { title: 'Build the new hierarchy, audit-only', text: 'Create the ALZ management groups beside the old ones with every policy assignment in DoNotEnforce. They report compliance without blocking anyone.' },
  { title: 'Map what exists', text: 'Microsoft’s terraform-state-importer needs only Reader. It finds existing resources with Resource Graph, runs a plan and writes issues.csv. Mark each line Use, Ignore, Replace or Destroy and it generates imports.tf and destroy.tf.' },
  { title: 'Converge', text: 'Adjust the tfvars until the plan shows no unwanted changes, then apply. Plan and apply once more to catch edge cases, then delete imports.tf and destroy.tf. There is no rollback: rehearse in a test tenant.' },
  { title: 'Move subscriptions in, audit-only', text: 'Move workload subscriptions under the audit-only groups. New requests are checked at once; existing resources are only reported. Fix them, or run remediation tasks for Modify and DeployIfNotExists.' },
  { title: 'Promote and enforce', text: 'Move each compliant subscription to the production groups, where assignments enforce. Policy now blocks what it used to report.' },
  { title: 'Lock it down', text: 'Remove the standing access that let drift happen. People get Reader plus a PIM-eligible role for emergencies; only the apply identity writes. A scheduled plan alerts whenever it isn’t empty.' },
];

// Tone codes: c click-ops, d decided, a audit, m mapped, i in code, e enforced, w warning, n not yet.
const P = (s) => s.split('|').map((x) => x.trim().split(':'));
const components = [
  {
    id: 'mg',
    name: 'Management groups',
    choice: true,
    def: 'replace',
    why: { adopt: 'Only if the old hierarchy already has the ALZ shape. IDs can’t be renamed.', replace: 'Build the new hierarchy with new IDs and move subscriptions across; moving a subscription is low-risk.' },
    adopt: P('c:Click-ops | d:Adopt | d:Adopt | d:Adopt | m:Mapped: Use | i:In code | i:In code | e:Enforcing | e:Code-owned'),
    replace: P('c:Click-ops | d:Replace | d:Replace | a:New groups, audit-only | a:New groups, audit-only | i:In code | i:In code | e:Enforcing | e:Old groups removed'),
  },
  {
    id: 'policy',
    name: 'Policy assignments',
    def: 'replace',
    why: { replace: 'Replace with the ALZ library set, versioned and maintained by Microsoft, then delete the hand-made ones.' },
    replace: P('c:Hand-made | d:Replace | d:Replace | a:ALZ set, DoNotEnforce | a:ALZ set, DoNotEnforce | a:In code, reporting | a:Reporting | e:Enforced | e:Hand-made deleted'),
  },
  {
    id: 'rbac',
    name: 'Role assignments',
    def: 'replace',
    why: { replace: 'Hand-made assignments are where drift starts. Recreate them for groups, in code, then remove the manual ones.' },
    replace: P('c:Named users | d:Replace | d:Replace | d:Replace | m:Mapped: Replace | i:Groups in code | i:Groups in code | i:Groups in code | e:Manual removed; PIM'),
  },
  {
    id: 'law',
    name: 'Log Analytics workspace',
    choice: true,
    def: 'adopt',
    why: { adopt: 'Keeps the history. Workspaces can’t be renamed and data can’t be moved.', replace: 'Run a new one beside it until the old data’s retention expires.' },
    adopt: P('c:Click-ops | d:Adopt | d:Adopt | d:Adopt | m:Mapped: Use | i:In code | i:In code | i:In code | e:Code-owned'),
    replace: P('c:Click-ops | d:Replace | d:Replace | d:Replace | m:Mapped: Ignore | i:New one beside | i:New one beside | i:New one beside | w:Old kept for retention'),
  },
  {
    id: 'hub',
    name: 'Hub network and peerings',
    choice: true,
    def: 'adopt',
    why: { adopt: 'Adopt it if it already sits in the connectivity subscription.', replace: 'A network can move, but peering must be off during the move; plan an outage window.' },
    adopt: P('c:Click-ops | d:Adopt | d:Adopt | d:Adopt | m:Mapped: Use | i:In code | i:In code | i:In code | e:Code-owned'),
    replace: P('c:Click-ops | d:Replace | d:Replace | d:Replace | m:Mapped: Replace | w:New hub; cut-over planned | i:Spokes re-peered | i:Spokes re-peered | e:Old hub removed'),
  },
  {
    id: 'fw',
    name: 'Azure Firewall and its policy',
    choice: true,
    def: 'adopt',
    why: { adopt: 'Adopt in place. Firewalls can’t move between resource groups or subscriptions.', replace: 'Only with a planned cut-over: every rule is re-created and tested first.' },
    adopt: P('c:Click-ops | d:Adopt | d:Adopt | d:Adopt | m:Mapped: Use | i:In code | i:In code | i:In code | e:Code-owned'),
    replace: P('c:Click-ops | d:Replace | d:Replace | d:Replace | m:Mapped: Replace | w:New firewall; rules re-tested | i:Traffic cut over | i:Traffic cut over | e:Old removed'),
  },
  {
    id: 'dns',
    name: 'Private DNS zones',
    def: 'adopt',
    why: { adopt: 'Adopt, moving them into the connectivity subscription if needed. Every private endpoint depends on them.' },
    adopt: P('c:Click-ops | d:Adopt | d:Adopt | d:Adopt | m:Mapped: Use | i:In code | i:In code | i:In code | e:Code-owned'),
  },
  {
    id: 'diag',
    name: 'Diagnostics and alerts',
    def: 'replace',
    why: { replace: 'They can’t move. Let policy and the baseline alerts recreate them consistently.' },
    replace: P('c:Ad hoc | d:Replace | d:Replace | a:Policy assigned, DoNotEnforce | m:Mapped: Ignore | a:Policy reporting | a:Remediation tasks | e:Policy-managed | e:Consistent everywhere'),
  },
  {
    id: 'subs',
    name: 'Workload subscriptions',
    def: 'move',
    why: { move: 'Moved, not rebuilt. Check pipeline and break-glass access first: inherited role assignments change with the parent.' },
    move: P('c:Old hierarchy | d:Move later | d:Move later | d:Move later | d:Move later | d:Move later | a:Audit-only group | e:Production group | e:Compliant'),
  },
  {
    id: 'pipe',
    name: 'Pipeline and state',
    def: 'new',
    why: { new: 'Created by the accelerator bootstrap: repos, environments, identities and the state storage account.' },
    new: P('n:Not yet | n:Not yet | i:Bootstrapped | i:Ready | i:Planning | i:Applied | i:Applied | i:Applied | e:Nightly drift check'),
  },
];

const toneClass = {
  c: 'border-gold text-gold',
  d: 'border-rule text-muted',
  a: 'border-gold text-gold bg-gold-soft',
  m: 'border-navy text-navy',
  i: 'border-navy bg-navy text-on-navy',
  e: 'border-good bg-good-soft text-good',
  w: 'border-bad bg-bad-soft text-bad',
  n: 'border-faint text-subtle',
};

export default function Brownfield() {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState(Object.fromEntries(components.map((c) => [c.id, c.def])));
  const S = steps[step];

  const stateOf = (c) => {
    const path = c[choice[c.id]];
    return path[step];
  };
  const counts = components.reduce((acc, c) => {
    const [tone] = stateOf(c);
    acc[tone] = (acc[tone] || 0) + 1;
    return acc;
  }, {});
  const replaced = components.filter((c) => c.choice && choice[c.id] === 'replace');
  const risky = replaced.filter((c) => ['hub', 'fw'].includes(c.id));

  const csvAction = {
    mg: { adopt: 'Use', replace: 'Ignore (new IDs)' },
    policy: { replace: 'Ignore (delete later)' },
    rbac: { replace: 'Replace' },
    law: { adopt: 'Use', replace: 'Ignore (keep for retention)' },
    hub: { adopt: 'Use', replace: 'Replace' },
    fw: { adopt: 'Use', replace: 'Replace' },
    dns: { adopt: 'Use' },
    diag: { replace: 'Ignore (policy recreates)' },
  };
  const csv = components
    .filter((c) => csvAction[c.id])
    .map((c) => `${c.id.padEnd(8)} ${c.name.padEnd(30)} ${csvAction[c.id][choice[c.id]]}`)
    .join('\n');

  return (
    <article>
      <PageHeader
        eyebrow="Stepper · Brownfield migration"
        title="Bring a hand-built platform under code"
        deck="Don’t rebuild in place. Build the coded landing zone beside the old one, adopt or replace each piece, land subscriptions in audit-only groups, then enforce."
        meta={[
          { dt: 'Steps', dd: String(steps.length) },
          { dt: 'Components', dd: String(components.length) },
          { dt: 'Approach', dd: 'Beside, then move' },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Walk the migration" intro="Step through it. Each component shows its state; change adopt or replace at any step and see the consequences.">
        <div className="flex items-center gap-1" role="tablist" aria-label="Migration steps">
          {steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={i === step}
              aria-label={`Step ${i + 1}: ${s.title}`}
              onClick={() => setStep(i)}
              className={`h-[6px] flex-1 transition-colors ${i <= step ? 'bg-navy' : 'bg-faint hover:bg-rule'}`}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-[640px]">
            <p className="tabular font-mono text-[12px] text-navy">
              STEP {String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
            </p>
            <h3 className="mt-1 font-display text-[30px] font-semibold leading-[1.1] text-ink">{S.title}</h3>
            <p className="fade-in mt-2 text-[15.5px] leading-[1.65] text-ink" key={step}>
              {S.text}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft size={14} /> Back
            </Button>
            <Button disabled={step === steps.length - 1} onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-muted">
          {[
            ['c', 'Click-ops'],
            ['a', 'Reporting only'],
            ['i', 'In code'],
            ['e', 'Enforced or done'],
            ['w', 'Needs care'],
          ].map(([k, l]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-[10px] w-[10px] border ${toneClass[k]}`} />
              {l} <span className="tabular font-mono text-ink">{counts[k] || 0}</span>
            </span>
          ))}
        </div>

        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {components.map((c) => {
            const [tone, label] = stateOf(c);
            return (
              <li key={c.id} className="flex min-w-0 flex-col gap-2 border border-rule bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[14.5px] font-medium text-ink">{c.name}</span>
                  <span key={`${step}-${choice[c.id]}`} className={`fade-in whitespace-nowrap border px-2 py-[2px] text-[11.5px] font-medium ${toneClass[tone]}`}>
                    {label}
                  </span>
                </div>
                {c.choice ? (
                  <div className="flex items-center gap-2">
                    <div role="radiogroup" aria-label={`${c.name}: adopt or replace`} className="flex border border-rule">
                      {['adopt', 'replace'].map((o) => (
                        <button
                          key={o}
                          type="button"
                          role="radio"
                          aria-checked={choice[c.id] === o}
                          onClick={() => setChoice((x) => ({ ...x, [c.id]: o }))}
                          className={`px-2.5 py-0.5 text-[12px] capitalize ${choice[c.id] === o ? 'bg-navy text-on-navy' : 'text-muted hover:bg-faint'}`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                    <span className="min-w-0 text-[12px] leading-[1.4] text-subtle">{c.why[choice[c.id]]}</span>
                  </div>
                ) : (
                  <span className="text-[12px] leading-[1.4] text-subtle">{c.why[choice[c.id]]}</span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-4">
          {step === 4 ? (
            <Code title="issues.csv · simplified">{`id       component                      action\n${csv}`}</Code>
          ) : (
            <Insight tone={risky.length && step >= 1 && step <= 6 ? 'gold' : 'navy'} stateKey={`${step}-${replaced.map((c) => c.id).join()}`}>
              {step === 0 && <p>Ten components, all hand-built. The goal is not a rebuild: it is the same platform, owned by code, with policy enforcing what people used to remember.</p>}
              {step > 0 && step < 8 && (
                <>
                  <p>
                    {step === 1 && `Adopting ${components.filter((c) => choice[c.id] === 'adopt').length}, replacing ${components.filter((c) => choice[c.id] === 'replace').length}. Policy, role assignments and diagnostics are always replaced; subscriptions are moved, never rebuilt.`}
                    {step === 2 && 'Nothing in the old estate has changed. The pipeline exists, with its identities and state, but it hasn’t deployed anything.'}
                    {step === 3 && 'The new groups exist and report, but no subscription sits under them yet, so nothing is affected.'}
                    {step === 5 && 'After converging, a fresh plan should be empty. Anything still in it is a decision you haven’t made yet.'}
                    {step === 6 && 'Workload subscriptions now report against the ALZ policies. Expect a long list on day one: that list is the backlog, not a failure.'}
                    {step === 7 && 'Promote one subscription at a time, least critical first, and watch for denied deployments in its pipeline.'}
                  </p>
                  {risky.length > 0 && <p className="text-muted">Replacing the {risky.map((c) => c.name.toLowerCase()).join(' and ')} means a planned cut-over with an outage window; most teams adopt them in place.</p>}
                </>
              )}
              {step === 8 && <p>Every component is owned by code or by policy. People read; the pipeline writes; drift shows up in the morning instead of in an audit.</p>}
            </Insight>
          )}
        </div>
      </Section>

      <Section n={2} title="Before you move a subscription" wide={false}>
        <ul className="space-y-2.5 text-[15px] leading-[1.6] text-ink">
          {[
            'You need Owner on the subscription and write access on both the old and new parent groups.',
            'Role assignments inherited from the old group stop applying; the new group’s start. Check pipeline and break-glass access first.',
            'Hierarchy changes can take up to 30 minutes to show everywhere.',
            'Deny doesn’t remove existing resources, and Modify and DeployIfNotExists don’t fix them until you run remediation.',
          ].map((x) => (
            <li key={x} className="flex gap-3">
              <span className="mt-[10px] h-[5px] w-[5px] shrink-0 bg-navy" />
              {x}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Callout tone="gold" title="Known rough edges">
            The ALZ migration guide warns there’s no rollback, that Replace deletes and recreates, and that role assignments created
            for policy remediation are always recreated. The bootstrap flag doesn’t cover apply: the starter’s subscription_placement
            still moves platform subscriptions unless you edit it. Rehearse in a test tenant first.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.transition, src.duplicateAudit, src.alzMigration, src.stateImporter, src.mgManage, src.moveSupport, src.tfImport, src.remediation]} />
    </article>
  );
}
