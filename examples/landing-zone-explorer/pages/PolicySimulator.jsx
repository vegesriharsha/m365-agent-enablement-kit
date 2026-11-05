import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, Ban, Check, CircleSlash, FileWarning, Play, Plus, RotateCcw, Shuffle, Wand2, X } from 'lucide-react';
import {
  PageHeader, Section, Insight, Pill, Button, Select, Segmented, Toggle, Code, Panel, Sources, Callout, Prose,
} from '../components/ui.jsx';
import { useReducedMotion } from '../lib/hooks.js';
import {
  policies, effectTone, actions, mgTree, initialSubs, initialAssignments,
} from '../data/policies.js';
import { VERIFIED, src } from '../data/sources.js';

/* ---------- tree helpers ---------- */
const parentOf = {};
const nameOf = {};
const depthOf = {};
(function walk(node, parent, depth) {
  parentOf[node.id] = parent;
  nameOf[node.id] = node.name;
  depthOf[node.id] = depth;
  node.children.forEach((c) => walk(c, node.id, depth + 1));
})(mgTree, null, 0);
const allMgs = Object.keys(nameOf);

function ancestors(mg) {
  const out = [];
  let cur = mg;
  while (cur) {
    out.push(cur);
    cur = parentOf[cur];
  }
  return out;
}

const scopeName = (scope) => nameOf[scope] ?? `subscription ${scope}`;

function effective(sub, assignments) {
  const scopes = [sub.id, ...ancestors(sub.mg)];
  return assignments
    .filter((a) => scopes.includes(a.scope))
    .sort((x, y) => (depthOf[x.scope] ?? 99) - (depthOf[y.scope] ?? 99));
}

function evaluate(sub, request, assignments, exemptions) {
  const eff = effective(sub, assignments);
  const exempt = eff.filter((a) => exemptions.some((e) => e.assignmentId === a.id && e.sub === sub.id));
  const active = eff.filter((a) => !exempt.includes(a));
  const req = { ...request, tags: { ...request.tags } };
  const by = (effect) => active.filter((a) => policies[a.policy].effect === effect);

  const modify = by('Modify').map((a) => {
    const hit = policies[a.policy].applies(req, sub);
    if (hit && a.mode === 'Default') {
      req.tags.costCenter = sub.tags.costCenter;
      return { a, state: 'changed' };
    }
    return { a, state: hit ? 'would' : 'na' };
  });
  const deny = by('Deny').map((a) => {
    const hit = policies[a.policy].applies(req, sub);
    return { a, state: !hit ? 'pass' : a.mode === 'Default' ? 'blocked' : 'noncompliant' };
  });
  const denied = deny.some((d) => d.state === 'blocked');
  const audit = by('Audit').map((a) => ({ a, state: denied ? 'skipped' : policies[a.policy].applies(req, sub) ? 'noncompliant' : 'pass' }));
  const dine = by('DeployIfNotExists').map((a) => {
    if (denied) return { a, state: 'skipped' };
    const hit = policies[a.policy].applies(req, sub);
    return { a, state: !hit ? 'na' : a.mode === 'Default' ? 'deploys' : 'noncompliant' };
  });
  return { eff, exempt, modify, deny, audit, dine, denied, finalTags: req.tags };
}

/* ---------- small pieces ---------- */
function AssignmentChip({ a, onRemove }) {
  const p = policies[a.policy];
  const dne = a.mode === 'DoNotEnforce';
  return (
    <span
      className={`inline-flex items-center gap-1 border px-1.5 py-[1px] text-[11px] ${dne ? 'border-dashed' : ''} ${
        { bad: 'border-bad text-bad', navy: 'border-navy text-navy', gold: 'border-gold text-gold', good: 'border-good text-good' }[effectTone[p.effect]]
      }`}
      title={`${p.name} (${p.effect}${dne ? ', DoNotEnforce' : ''})`}
    >
      {p.short}
      {dne && <span className="font-mono text-[10px]">DNE</span>}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${p.name}`} className="opacity-60 hover:opacity-100">
          <X size={11} />
        </button>
      )}
    </span>
  );
}

function TreeNode({ node, depth, assignments, subs, path, target, onRemove, onPickSub }) {
  const onPath = path.includes(node.id);
  const here = assignments.filter((a) => a.scope === node.id);
  const subsHere = subs.filter((s) => s.mg === node.id);
  return (
    <li>
      <div
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 border-l-2 py-1.5 pr-2 transition-colors ${onPath ? 'border-navy bg-navy-soft' : 'border-transparent'}`}
        style={{ paddingLeft: 8 + depth * 18 }}
      >
        <span className={`text-[13.5px] ${onPath ? 'font-semibold text-ink' : 'text-ink'}`}>{node.name}</span>
        {here.map((a) => (
          <AssignmentChip key={a.id} a={a} onRemove={() => onRemove(a.id)} />
        ))}
      </div>
      {subsHere.map((s) => {
        const sel = s.id === target;
        const subAssign = assignments.filter((a) => a.scope === s.id);
        return (
          <div
            key={s.id}
            className={`fade-in flex flex-wrap items-center gap-x-2 gap-y-1 border-l-2 py-1 pr-2 ${sel ? 'border-gold bg-gold-soft' : 'border-transparent'}`}
            style={{ paddingLeft: 8 + (depth + 1) * 18 }}
          >
            <button type="button" onClick={() => onPickSub(s.id)} className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-ink hover:text-navy">
              <span className="inline-block h-[8px] w-[8px] border border-gold" style={{ background: sel ? 'var(--gold)' : 'transparent' }} />
              {s.id}
            </button>
            <span className="text-[11px] text-subtle">{s.tags.costCenter ? `costCenter=${s.tags.costCenter}` : 'no costCenter tag'}</span>
            {subAssign.map((a) => (
              <AssignmentChip key={a.id} a={a} onRemove={() => onRemove(a.id)} />
            ))}
          </div>
        );
      })}
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} depth={depth + 1} assignments={assignments} subs={subs} path={path} target={target} onRemove={onRemove} onPickSub={onPickSub} />
          ))}
        </ul>
      )}
    </li>
  );
}

const stateText = {
  changed: { t: 'Changed the request', tone: 'navy', Icon: Wand2 },
  would: { t: 'Would change it, but DoNotEnforce', tone: 'gold', Icon: FileWarning },
  na: { t: 'Not applicable', tone: 'neutral', Icon: CircleSlash },
  pass: { t: 'Compliant', tone: 'good', Icon: Check },
  blocked: { t: 'Blocked the request', tone: 'bad', Icon: Ban },
  noncompliant: { t: 'Recorded as non-compliant', tone: 'gold', Icon: FileWarning },
  skipped: { t: 'Not reached', tone: 'neutral', Icon: CircleSlash },
  deploys: { t: 'Deploys the missing setting', tone: 'good', Icon: Wand2 },
};

function StepRow({ items, emptyText }) {
  if (items.length === 0) return <p className="text-[13px] text-subtle">{emptyText}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map(({ a, state }) => {
        const s = stateText[state];
        return (
          <li key={a.id} className="flex flex-wrap items-center gap-2 text-[13.5px]">
            <s.Icon size={14} className={{ navy: 'text-navy', gold: 'text-gold', neutral: 'text-subtle', good: 'text-good', bad: 'text-bad' }[s.tone]} />
            <span className="text-ink">{policies[a.policy].name}</span>
            <span className="text-[12px] text-subtle">at {scopeName(a.scope)}</span>
            <Pill tone={s.tone}>{s.t}</Pill>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- page ---------- */
export default function PolicySimulator() {
  const reduced = useReducedMotion();
  const [subs, setSubs] = useState(initialSubs);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [exemptions, setExemptions] = useState([]);
  const [target, setTarget] = useState('payments-prod');
  const [actionId, setActionId] = useState('pip');
  const [tagInRequest, setTagInRequest] = useState(false);
  const [run, setRun] = useState(1);
  const [shown, setShown] = useState(5);
  const [moveSub, setMoveSub] = useState('lab-sandbox-01');
  const [moveTo, setMoveTo] = useState('corp');
  const [lastMove, setLastMove] = useState(null);
  const [newScope, setNewScope] = useState('sandbox');
  const [newPolicy, setNewPolicy] = useState('denyPip');
  const [newMode, setNewMode] = useState('Default');
  const [codePolicy, setCodePolicy] = useState('denyPip');
  const [nextId, setNextId] = useState(100);

  const sub = subs.find((s) => s.id === target);
  const action = actions.find((a) => a.id === actionId);
  const request = useMemo(
    () => ({ ...action.req, tags: tagInRequest ? { costCenter: 'CC-999' } : {} }),
    [action, tagInRequest],
  );
  const result = useMemo(() => evaluate(sub, request, assignments, exemptions), [sub, request, assignments, exemptions]);
  const path = ancestors(sub.mg);

  // Staggered reveal of the evaluation steps each time the request runs.
  useEffect(() => {
    if (reduced) {
      setShown(5);
      return undefined;
    }
    setShown(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= 5) clearInterval(t);
    }, 380);
    return () => clearInterval(t);
  }, [run, reduced]);

  const rerun = () => setRun((r) => r + 1);

  const removeAssignment = (id) => {
    setAssignments((as) => as.filter((a) => a.id !== id));
    setExemptions((es) => es.filter((e) => e.assignmentId !== id));
    rerun();
  };

  const addAssignment = () => {
    setAssignments((as) => [...as, { id: `a${nextId}`, policy: newPolicy, scope: newScope, mode: newMode }]);
    setNextId((n) => n + 1);
    rerun();
  };

  const doMove = () => {
    const s = subs.find((x) => x.id === moveSub);
    if (!s || s.mg === moveTo) return;
    const before = effective(s, assignments).map((a) => a.id);
    const moved = { ...s, mg: moveTo };
    const after = effective(moved, assignments).map((a) => a.id);
    const byId = Object.fromEntries(assignments.map((a) => [a.id, a]));
    setLastMove({
      sub: s.id,
      from: s.mg,
      to: moveTo,
      gained: after.filter((x) => !before.includes(x)).map((x) => byId[x]),
      lost: before.filter((x) => !after.includes(x)).map((x) => byId[x]),
    });
    setSubs((ss) => ss.map((x) => (x.id === s.id ? moved : x)));
    rerun();
  };

  const toggleExempt = (assignmentId) => {
    setExemptions((es) =>
      es.some((e) => e.assignmentId === assignmentId && e.sub === target)
        ? es.filter((e) => !(e.assignmentId === assignmentId && e.sub === target))
        : [...es, { assignmentId, sub: target }],
    );
    rerun();
  };

  const reset = () => {
    setSubs(initialSubs);
    setAssignments(initialAssignments);
    setExemptions([]);
    setLastMove(null);
    setTarget('payments-prod');
    setActionId('pip');
    setTagInRequest(false);
    rerun();
  };

  /* narrative */
  const blocking = result.deny.filter((d) => d.state === 'blocked');
  const changed = result.modify.filter((m) => m.state === 'changed');
  const requirePassedThanksToModify =
    changed.length > 0 && result.deny.some((d) => d.a.policy === 'requireCostCenter' && d.state === 'pass') && !request.tags.costCenter;

  const insight = (() => {
    const lines = [];
    if (result.denied) {
      const b = blocking[0];
      const above = b.a.scope !== sub.id;
      lines.push(
        <p key="d">
          <strong>Denied</strong> by “{policies[b.a.policy].name}”, assigned at <strong>{scopeName(b.a.scope)}</strong>.
          {above &&
            ` That assignment sits above ${sub.id}, so nothing assigned lower down can allow it. The ways out are an exemption on this subscription, a change to the assignment, or a different design.`}
        </p>,
      );
      if (b.a.policy === 'requireCostCenter' && !sub.tags.costCenter)
        lines.push(
          <p key="r">
            The subscription has no costCenter tag, so the inherit policy had nothing to copy. Tag the subscription at vending
            time and this request would pass.
          </p>,
        );
    } else {
      lines.push(
        <p key="c">
          <strong>Created.</strong> No enforced Deny matched {result.exempt.length ? 'after exemptions' : ''}.
        </p>,
      );
    }
    if (requirePassedThanksToModify)
      lines.push(
        <p key="m">
          Modify ran first and copied <span className="font-mono">costCenter={result.finalTags.costCenter}</span> from the
          subscription, so “Require costCenter” passed. Azure Policy evaluates Modify before Deny.
        </p>,
      );
    if (result.deny.some((d) => d.state === 'noncompliant'))
      lines.push(<p key="n">A Deny assignment in DoNotEnforce mode matched. It was recorded as non-compliant instead of blocking.</p>);
    if (result.exempt.length)
      lines.push(
        <p key="e">
          {result.exempt.length} assignment{result.exempt.length > 1 ? 's were' : ' was'} skipped because of an exemption on
          this subscription.
        </p>,
      );
    return lines;
  })();

  const steps = [
    {
      title: 'Request arrives at Azure Resource Manager',
      body: (
        <p className="font-mono text-[12.5px] text-ink">
          {action.req.type} · {action.req.location} · tags {Object.keys(request.tags).length ? JSON.stringify(request.tags) : '{}'}
        </p>
      ),
    },
    { title: 'Modify and Append', body: <StepRow items={result.modify} emptyText="No Modify assignments apply here." /> },
    { title: 'Deny', body: <StepRow items={result.deny} emptyText="No Deny assignments apply here." /> },
    { title: 'Audit', body: <StepRow items={result.audit} emptyText="No Audit assignments apply here." /> },
    {
      title: result.denied ? 'Resource provider: not reached' : 'Resource created, then DeployIfNotExists',
      body: <StepRow items={result.dine} emptyText="No DeployIfNotExists assignments apply here." />,
    },
  ];

  return (
    <article>
      <PageHeader
        eyebrow="Simulator · Hierarchy and policy"
        title="Policy flows down the tree"
        deck="Assign policies to management groups, move subscriptions between them and try deployments. Watch Azure Policy decide, in the order it really evaluates."
        meta={[
          { dt: 'Management groups', dd: String(allMgs.length) },
          { dt: 'Subscriptions', dd: String(subs.length) },
          { dt: 'Assignments', dd: String(assignments.length) },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section
        n={1}
        title="Try a deployment"
        intro="Pick a subscription and a resource, then deploy. Click any subscription in the tree to select it. Remove an assignment with its ×."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_auto_auto]">
          <Select id="ps-target" label="Deploy into subscription" value={target} onChange={(v) => { setTarget(v); rerun(); }} options={subs.map((s) => ({ value: s.id, label: `${s.id} (${nameOf[s.mg]})` }))} />
          <Select id="ps-action" label="Resource to create" value={actionId} onChange={(v) => { setActionId(v); rerun(); }} options={actions.map((a) => ({ value: a.id, label: a.label }))} />
          <div className="self-end sm:col-span-1">
            <Toggle label="Tag it myself" hint="costCenter=CC-999 in the request" checked={tagInRequest} onChange={(v) => { setTagInRequest(v); rerun(); }} />
          </div>
          <div className="flex gap-2 self-end">
            <Button onClick={rerun}>
              <Play size={14} /> Deploy
            </Button>
            <Button variant="quiet" onClick={reset} aria-label="Reset the simulator">
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <Panel title="Management groups and subscriptions" aside={<span className="label">Path highlighted</span>}>
            <ul className="-mx-2 overflow-x-auto">
              <TreeNode node={mgTree} depth={0} assignments={assignments} subs={subs} path={path} target={target} onRemove={removeAssignment} onPickSub={(id) => { setTarget(id); rerun(); }} />
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-faint pt-3">
              {Object.entries(effectTone).map(([effect, tone]) => (
                <Pill key={effect} tone={tone}>
                  {effect}
                </Pill>
              ))}
              <span className="text-[11px] text-subtle">Dashed = DoNotEnforce</span>
            </div>
          </Panel>

          <div className="min-w-0 space-y-4">
            <Panel title="Evaluation, in Azure Policy order" aside={<Pill tone={result.denied ? 'bad' : 'good'}>{result.denied ? 'Denied' : 'Created'}</Pill>}>
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li
                    key={`${run}-${i}`}
                    className={`border-l-2 pl-3 transition-opacity duration-300 ${i < shown ? 'opacity-100' : 'opacity-25'} ${
                      i === 2 && result.denied ? 'border-bad' : 'border-rule'
                    }`}
                  >
                    <p className="label mb-1 flex items-center gap-2 !text-ink">
                      <span className="font-mono text-navy">{i + 1}</span> {s.title}
                    </p>
                    {s.body}
                    {i < steps.length - 1 && i < shown - 1 && (
                      <ArrowDown size={12} className="mt-1 text-subtle" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            </Panel>
            <Insight stateKey={`${run}`} tone={result.denied ? 'bad' : 'good'}>
              {insight}
            </Insight>
          </div>
        </div>
      </Section>

      <Section n={2} title="Change the tree" intro="Move subscriptions, add assignments and record exemptions. The deployment above re-runs after every change.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Move a subscription">
            <div className="space-y-3">
              <Select id="mv-sub" label="Subscription" value={moveSub} onChange={setMoveSub} options={subs.map((s) => ({ value: s.id, label: s.id }))} />
              <Select id="mv-to" label="To management group" value={moveTo} onChange={setMoveTo} options={allMgs.map((m) => ({ value: m, label: nameOf[m] }))} />
              <Button onClick={doMove}>
                <Shuffle size={14} /> Move
              </Button>
              {lastMove && (
                <div className="fade-in border-t border-faint pt-3 text-[13px]" key={`${lastMove.sub}-${lastMove.to}`}>
                  <p className="text-ink">
                    <span className="font-mono">{lastMove.sub}</span> moved from {nameOf[lastMove.from]} to {nameOf[lastMove.to]}.
                  </p>
                  <p className="label mt-2">Gained</p>
                  <div className="mt-1 flex flex-wrap gap-1">{lastMove.gained.length ? lastMove.gained.map((a) => <AssignmentChip key={a.id} a={a} />) : <span className="text-subtle">Nothing</span>}</div>
                  <p className="label mt-2">Lost</p>
                  <div className="mt-1 flex flex-wrap gap-1">{lastMove.lost.length ? lastMove.lost.map((a) => <AssignmentChip key={a.id} a={a} />) : <span className="text-subtle">Nothing</span>}</div>
                  <p className="mt-2 text-[12.5px] text-muted">
                    New requests are judged against the new assignments straight away. Role assignments inherited from the old
                    group are lost too, so check access before moving production subscriptions.
                  </p>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Assign a policy">
            <div className="space-y-3">
              <Select
                id="as-scope"
                label="Scope"
                value={newScope}
                onChange={setNewScope}
                options={[
                  ...allMgs.map((m) => ({ value: m, label: nameOf[m] })),
                  ...subs.map((s) => ({ value: s.id, label: `Subscription: ${s.id}` })),
                ]}
              />
              <Select id="as-policy" label="Policy" value={newPolicy} onChange={setNewPolicy} options={Object.entries(policies).map(([k, p]) => ({ value: k, label: `${p.name} (${p.effect})` }))} />
              <Segmented size="sm" label="Enforcement mode" value={newMode} onChange={setNewMode} options={[{ value: 'Default', label: 'Default' }, { value: 'DoNotEnforce', label: 'DoNotEnforce' }]} />
              <Button onClick={addAssignment}>
                <Plus size={14} /> Assign
              </Button>
            </div>
          </Panel>

          <Panel title={`Exemptions on ${target}`}>
            {result.eff.length === 0 ? (
              <p className="text-[13px] text-subtle">No assignments reach this subscription.</p>
            ) : (
              <ul className="space-y-2.5">
                {result.eff.map((a) => {
                  const on = exemptions.some((e) => e.assignmentId === a.id && e.sub === target);
                  return (
                    <li key={a.id}>
                      <Toggle checked={on} onChange={() => toggleExempt(a.id)} label={policies[a.policy].short} hint={`From ${scopeName(a.scope)} · ${on ? 'Waiver recorded' : 'Applies'}`} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </Section>

      <Section n={3} title="Rules this simulator follows" wide={false}>
        <ul className="space-y-2.5 text-[15px] leading-[1.6]">
          {[
            'An assignment applies to its scope and everything below it. Subscriptions inherit from every management group above them.',
            'A lower scope cannot override a Deny from above. The only escapes are an exemption, an exclusion on the assignment, or changing the assignment.',
            'Azure Policy evaluates Modify and Append before Deny, then Audit. DeployIfNotExists and AuditIfNotExists run after the resource provider succeeds.',
            'DoNotEnforce mode evaluates and reports compliance but never blocks, changes or deploys anything on its own; you can still start remediation tasks by hand.',
            'Moving a subscription changes which policies and inherited role assignments apply to it.',
          ].map((r) => (
            <li key={r} className="flex gap-3">
              <span className="mt-[10px] h-[5px] w-[5px] shrink-0 bg-navy" />
              {r}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Callout tone="gold" title="Simplified here">
            Real policies have parameters and many resource types; the diagnostics policy here stands in for Microsoft’s
            per-type built-ins. Exemptions are shown at subscription scope only. Compliance scans of existing resources and
            remediation tasks aren’t simulated.
          </Callout>
        </div>
      </Section>

      <Section
        n={4}
        title="Can Azure Policy be written in OPA?"
        intro="No. Azure Policy definitions are JSON rules that Azure Resource Manager evaluates. Rego (Open Policy Agent’s language) runs elsewhere: in your pipeline against a Terraform plan, and inside AKS through Azure Policy for Kubernetes. Pick a policy to compare."
      >
        <div className="mb-4 max-w-[480px]">
          <Select id="code-policy" label="Policy" value={codePolicy} onChange={setCodePolicy} options={Object.entries(policies).map(([k, p]) => ({ value: k, label: `${p.name} (${p.effect})` }))} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Code title="Azure Policy rule (JSON)">{policies[codePolicy].json}</Code>
          <Code title="Rego for Conftest on a Terraform plan">{policies[codePolicy].rego}</Code>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="label py-2 pr-4 font-medium" />
                <th className="label py-2 pr-4 font-medium">Azure Policy</th>
                <th className="label py-2 font-medium">OPA / Rego on a plan</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Where it runs', 'Azure Resource Manager, on every request', 'Your pipeline, before apply'],
                ['Catches portal and CLI changes', 'Yes', 'No: only what goes through the pipeline'],
                ['Can change or deploy things', 'Yes: Modify, DeployIfNotExists', 'No: pass, warn or fail'],
                ['Reports on existing resources', 'Yes, continuously', 'No: only what is in the plan'],
                ['Feedback speed', 'At deploy time', 'Seconds, on the pull request'],
                ['Kubernetes', 'Azure Policy for Kubernetes runs Gatekeeper; custom rules are Rego templates', 'Gatekeeper or OPA directly'],
              ].map(([k, a, b]) => (
                <tr key={k} className="border-b border-faint align-top">
                  <td className="py-2 pr-4 font-medium text-ink">{k}</td>
                  <td className="py-2 pr-4 text-ink">{a}</td>
                  <td className="py-2 text-ink">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 max-w-[760px]">
          <Prose>
            <p>
              <strong>Use both.</strong> Azure Policy is the guardrail of record because nothing gets past Resource Manager.
              Rego in the pipeline gives fast feedback on the pull request and covers rules about the code itself, such as
              pinned module versions, naming and required inputs, that Azure Policy can't see.
            </p>
          </Prose>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.policyEffects, src.policyScope, src.policyExemption, src.policyK8s, src.conftest, src.opa, src.alzLibrary]} />
    </article>
  );
}
