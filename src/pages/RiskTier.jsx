import { useState } from 'react';
import { Check } from 'lucide-react';
import { Section, Insight, Segmented, Pill, Callout, Illustrative } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';

/*
 * A custom page: an idea that needs its own simulator gets its own component.
 * Copy this file as a starting point, then register it in src/content/registry.js
 * with `component: YourPage` instead of an archetype.
 */
const factors = [
  { id: 'reach', label: 'Who can use it', options: [['me', 'Just the maker', 0], ['team', 'A team', 1], ['org', 'Whole organisation', 2], ['ext', 'External users', 3]] },
  { id: 'data', label: 'Most sensitive data it reads', options: [['public', 'Public', 0], ['internal', 'Internal', 1], ['conf', 'Confidential', 2], ['restricted', 'Restricted', 3]] },
  { id: 'act', label: 'What it can do', options: [['answer', 'Answers only', 0], ['draft', 'Drafts for a person', 1], ['act', 'Writes to systems', 3]] },
  { id: 'auto', label: 'How it runs', options: [['ask', 'When asked', 0], ['trigger', 'On a trigger or schedule', 2]] },
];

const tiers = [
  { max: 2, name: 'Low', tone: 'good', reviews: ['Intake record', 'Registration in the agent registry'], approver: 'Platform team', access: 'Annual', logs: 'Default activity logs' },
  { max: 5, name: 'Medium', tone: 'gold', reviews: ['Intake record', 'Registration in the agent registry', 'Risk review', 'Data owner sign-off'], approver: 'Business owner and platform lead', access: 'Twice a year', logs: 'Activity logs retained to the evidence schedule' },
  { max: 99, name: 'High', tone: 'bad', reviews: ['Intake record', 'Registration in the agent registry', 'Risk review', 'Data owner sign-off', 'Security review', 'Testing evidence before release'], approver: 'Risk committee', access: 'Quarterly', logs: 'Full activity and action logs, monitored with alerts' },
];

export default function RiskTier() {
  const [v, setV] = useState({ reach: 'team', data: 'internal', act: 'answer', auto: 'ask' });
  const score = factors.reduce((n, f) => n + f.options.find((o) => o.at(0) === v[f.id]).at(2), 0);
  const tier = tiers.find((t) => score <= t.max);

  return (
    <PageShell
      header={{
        eyebrow: 'Custom page · Simulator',
        title: 'Tier the risk before you review it',
        deck: 'Describe an agent in four answers and see its tier, the reviews it needs and who approves it. A template for building your own simulators.',
        meta: [{ dt: 'Factors', dd: String(factors.length) }, { dt: 'Tiers', dd: String(tiers.length) }],
      }}
    >
      <Section n={1} title="Describe the agent" intro="The weights are illustrative; your risk framework sets the real ones.">
        <div className="mb-3">
          <Illustrative>Illustrative weights</Illustrative>
        </div>
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {factors.map((f) => (
            <Segmented key={f.id} label={f.label} value={v[f.id]} onChange={(x) => setV((s) => ({ ...s, [f.id]: x }))} options={f.options.map(([value, label]) => ({ value, label }))} />
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="border border-rule bg-surface p-4">
            <p className="label">Risk tier</p>
            <p className="mt-1 font-display text-[40px] font-semibold leading-none text-ink">{tier.name}</p>
            <div className="mt-3">
              <Pill tone={tier.tone}>Score {score}</Pill>
            </div>
          </div>
          <div className="border border-rule bg-surface p-4">
            <p className="label mb-2">Before it goes live</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {tier.reviews.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[14px] text-ink">
                  <Check size={14} className="mt-[3px] shrink-0 text-navy" /> {r}
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid gap-3 border-t border-faint pt-3 sm:grid-cols-3">
              {[
                ['Approves', tier.approver],
                ['Access review', tier.access],
                ['Evidence', tier.logs],
              ].map(([dt, dd]) => (
                <div key={dt}>
                  <dt className="label">{dt}</dt>
                  <dd className="mt-0.5 text-[13.5px] text-ink">{dd}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="mt-4">
          <Insight stateKey={`${tier.name}-${score}`} tone={tier.tone === 'bad' ? 'bad' : tier.tone === 'gold' ? 'gold' : 'navy'}>
            <p>
              {v.act === 'act' && 'Writing to systems is the biggest jump in risk: the agent acts with someone’s permissions, so its identity and access rules matter most. '}
              {v.auto === 'trigger' && 'Running without a person asking means nobody reviews each result; monitoring and escalation have to do that job. '}
              {v.act !== 'act' && v.auto !== 'trigger' && 'An agent that only answers when asked is the easiest place to start: most of the risk is in what data it can read.'}
            </p>
          </Insight>
        </div>
        <div className="mt-5">
          <Callout tone="gold" title="Make it yours">
            Replace the factors and tiers with the ones your risk team approves, and link each review to the standard that defines it.
          </Callout>
        </div>
      </Section>
    </PageShell>
  );
}
