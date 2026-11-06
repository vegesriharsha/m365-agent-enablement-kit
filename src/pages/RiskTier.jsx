import { useState } from 'react';
import { Check } from 'lucide-react';
import { Section, Insight, Segmented, Pill, Callout, Illustrative } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';

/*
 * Contoso's agent risk tiering. The factors follow documented product behaviour
 * (who the agent runs as, what it can reach); the weights, thresholds and
 * cadences are Contoso's and are labelled illustrative.
 */
const factors = [
  { id: 'reach', label: 'Who can use it', options: [['me', 'Just the maker', 0], ['team', 'A team', 1], ['org', 'Whole organisation', 2]] },
  { id: 'data', label: 'Most sensitive data it reads', options: [['public', 'Public', 0], ['internal', 'Internal', 1], ['conf', 'Confidential', 2], ['restricted', 'Restricted', 3]] },
  { id: 'where', label: 'Where the knowledge lives', options: [['m365', 'Microsoft 365, user permissions', 0], ['fabric', 'Fabric, row-level security', 1], ['system', 'A system through a connector', 2]] },
  { id: 'act', label: 'What it can do', options: [['answer', 'Answers only', 0], ['draft', 'Drafts for a person', 1], ['act', 'Acts through a connector', 3]] },
  { id: 'run', label: 'How it runs', options: [['ask', 'When asked', 0], ['trigger', 'On a trigger, as the maker', 3]] },
];

const tiers = [
  {
    max: 2,
    name: 'Low',
    tone: 'good',
    reviews: ['Intake record', 'Licensed sponsor and Agent Registry entry'],
    approver: 'Platform team',
    attest: 'Yearly sponsor attestation',
    logs: 'Purview audit of Copilot interactions',
  },
  {
    max: 6,
    name: 'Medium',
    tone: 'gold',
    reviews: ['Intake record', 'Licensed sponsor and Agent Registry entry', 'Risk review', 'Data owner sign-off'],
    approver: 'Business owner and platform lead',
    attest: 'Sponsor attestation twice a year',
    logs: 'Audit retained to the evidence schedule; usage reviewed monthly',
  },
  {
    max: 99,
    name: 'High',
    tone: 'bad',
    reviews: ['Intake record', 'Licensed sponsor and Agent Registry entry', 'Risk review', 'Data owner sign-off', 'Security review', 'Testing evidence before release', 'Maker-credential decision recorded'],
    approver: 'Risk committee',
    attest: 'Quarterly access-package expiry',
    logs: 'Full audit and action logs; Defender agent protection on',
  },
];

export default function RiskTier() {
  const [v, setV] = useState({ reach: 'team', data: 'internal', where: 'm365', act: 'answer', run: 'ask' });
  const score = factors.reduce((n, f) => n + f.options.find((o) => o.at(0) === v[f.id]).at(2), 0);
  const tier = tiers.find((t) => score <= t.max);

  return (
    <PageShell
      header={{
        eyebrow: 'Custom page · Risk tier simulator',
        title: 'Tier the agent before you review it',
        deck: 'Describe an agent in five answers and see its tier, the reviews it needs, who approves it and how often its access is re-attested.',
        meta: [{ dt: 'Factors', dd: String(factors.length) }, { dt: 'Tiers', dd: String(tiers.length) }],
      }}
      sources={['csEventTriggersOverview', 'csToolAuthentication', 'csMakerCredentials', 'agent365LicensingFaq', 'entraAgentIdBestPractices', 'purviewAuditCopilot', 'defenderSecurityForAi']}
    >
      <Section n={1} title="Describe the agent" intro="The factors follow how the products work; the weights, thresholds and cadences are Contoso’s own.">
        <div className="mb-3">
          <Illustrative>Illustrative weights, tiers and cadences</Illustrative>
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
                ['Re-attestation', tier.attest],
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
          <Insight stateKey={`${tier.name}-${score}-${v.run}-${v.act}-${v.where}`} tone={tier.tone === 'bad' ? 'bad' : tier.tone === 'gold' ? 'gold' : 'navy'}>
            <p>
              {v.run === 'trigger' && 'A trigger runs the agent under the maker’s credentials, with nobody reviewing each run. The maker-credential decision and monitoring do the job a person would. '}
              {v.act === 'act' && 'Acting through a connector is the biggest jump: the agent changes a system with someone’s permissions, so which identity it uses matters most. '}
              {v.where === 'system' && v.act !== 'act' && 'Reading a business system through a connector means the connection’s identity, not the user’s, may decide what comes back. Prefer user authentication. '}
              {v.where === 'fabric' && 'A Fabric data agent honours row- and column-level security, so the data owner’s security model is the control to review. '}
              {v.run !== 'trigger' && v.act !== 'act' && v.where === 'm365' && 'An agent that answers when asked, from Microsoft 365 content, runs as the user and never widens their access. Most of the risk is in what the user can already see.'}
            </p>
          </Insight>
        </div>
        <div className="mt-5">
          <Callout tone="gold" title="Tiers change the reviews, not the registration">
            Every agent, even Low, has a licensed sponsor and a registry entry before anyone uses it. The tier adds reviews, a stricter approver and a shorter re-attestation cadence.
          </Callout>
        </div>
      </Section>
    </PageShell>
  );
}
