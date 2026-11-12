import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Section, Insight, Segmented, Toggle, Button, Pill, Callout, Illustrative } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import LicenceTree from '../diagrams/LicenceTree.jsx';

/*
 * Pattern 3, inheritance tree. The Agent 365 licence is a property of a person
 * (sponsor, owner or manager); an agent inherits premium protection from the
 * person it hangs under. Names and agents are illustrative; the rules are not.
 */
const sponsors = [
  { id: 'priya', name: 'Priya', role: 'Head of lending' },
  { id: 'tom', name: 'Tom', role: 'Branch manager', manager: 'ana' },
  { id: 'ana', name: 'Ana', role: 'Tom’s manager' },
];
const agents = [
  { id: 'a', name: 'Loan FAQ agent', kind: 'Agent Builder' },
  { id: 'b', name: 'Branch rota agent', kind: 'Copilot Studio' },
  { id: 'c', name: 'Policy finder', kind: 'Copilot Studio' },
];
const foundational = ['Agent Registry entry', 'Block, delete, assign an owner'];
const premium = ['Policy templates', 'Conditional Access for agents', 'Purview DLP and Insider Risk for agents', 'Defender detection and posture'];

export default function Agent365Licence() {
  const [assign, setAssign] = useState({ a: 'priya', b: 'tom', c: 'ana' });
  const [sel, setSel] = useState('b');
  const [tomLeaves, setTomLeaves] = useState(false);
  const [anaLicensed, setAnaLicensed] = useState(true);
  const [moved, setMoved] = useState({ id: null, key: 0 });

  const licensed = { priya: true, tom: false, ana: anaLicensed };
  const effective = (s) => (s === 'tom' && tomLeaves ? 'ana' : s);

  const move = (to) => {
    if (assign[sel] === to) return;
    setAssign((a) => ({ ...a, [sel]: to }));
    setMoved((m) => ({ id: sel, key: m.key + 1 }));
  };
  const reset = () => {
    setMoved((m) => ({ id: null, key: m.key + 1 }));
    setAssign({ a: 'priya', b: 'tom', c: 'ana' });
    setSel('b');
    setTomLeaves(false);
    setAnaLicensed(true);
  };

  const agent = agents.find((x) => x.id === sel);
  const named = assign[sel];
  const eff = effective(named);
  const covered = licensed[eff];
  const sponsor = sponsors.find((s) => s.id === eff);
  const transferred = named === 'tom' && tomLeaves;

  let insight;
  let tone;
  if (transferred && covered) {
    tone = 'navy';
    insight = `Sponsorship moved to Tom’s manager, Ana, when Tom left. ${agent.name} regained premium protection without anyone touching it, because Ana holds a licence. The automatic transfer is an Entra ID Governance feature for agents; Microsoft does not state whether it applies when the leaver held no licence.`;
  } else if (transferred && !covered) {
    tone = 'bad';
    insight = `Sponsorship moved to Tom’s manager, Ana, but Ana holds no licence, so the gap did not close. The pilot standard: every sponsor and their manager hold a licence. Whether the transfer runs at all when the leaver was unlicensed is not stated.`;
  } else if (covered) {
    tone = 'navy';
    insight = `Premium protections apply to ${agent.name} because ${sponsor.name} is licensed. The agent itself holds no licence: Agent 365 is licensed per user, never per agent.`;
  } else {
    tone = 'bad';
    insight = `Registry, block and delete still work for ${agent.name}: those are foundational. Policy templates, Conditional Access, Purview DLP and Defender detection do not apply, because the licence binds to the sponsor and ${sponsor.name} has none.`;
  }

  return (
    <PageShell
      header={{
        eyebrow: 'Custom page · Agent 365 licensing',
        title: 'The licence belongs to the sponsor, so the agent inherits it',
        deck: 'Move an agent between sponsors and watch its premium protections switch on and off. The registry entry never moves, because that part comes with Microsoft 365.',
        meta: [{ dt: 'Pilot', dd: '25 licences' }, { dt: 'Licensed per', dd: 'user, not agent' }],
      }}
      sources={['agent365LicensingFaq', 'agent365ServiceDescription', 'entraAgentOwnersSponsors', 'entraAgentIdGovernance', 'entraAgentRegistryConvergence', 'agent365ProductPage']}
    >
      <Section n={1} title="Move an agent" intro="Three sponsors, three agents that run with their own access. Pick an agent, give it a sponsor, then let Tom leave and see where sponsorship goes. Agents that act on a user’s behalf follow a second rule: that user must be licensed too.">
        <div className="mb-3 flex flex-wrap gap-2">
          <Illustrative>Illustrative names</Illustrative>
          <Pill tone="neutral">Rules from Microsoft licensing pages</Pill>
        </div>
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          <Segmented label="Agent to move" value={sel} onChange={setSel} options={agents.map((ag) => ({ value: ag.id, label: ag.name }))} />
          <Segmented label="Its sponsor" value={assign[sel]} onChange={move} options={sponsors.map((s) => ({ value: s.id, label: `${s.name} · ${licensed[s.id] ? 'licensed' : 'no licence'}` }))} />
          <Toggle label="Tom leaves Contoso" hint="Entra ID Governance for agents moves sponsorship to the manager (needs Agent 365 or E7)" checked={tomLeaves} onChange={setTomLeaves} />
          <Toggle label="Ana holds an Agent 365 licence" hint="Switch off to see a transfer that does not close the gap" checked={anaLicensed} onChange={setAnaLicensed} />
        </div>

        <div className="mt-6">
          <LicenceTree
            label={`${agent.name} under ${sponsor.name}: premium protections ${covered ? 'on' : 'off'}`}
            sponsors={sponsors.map((s) => ({ ...s, licensed: licensed[s.id], gone: s.id === 'tom' && tomLeaves, transferTo: s.manager }))}
            agents={agents.map((ag) => ({ id: ag.id, name: ag.name, sponsor: effective(assign[ag.id]), licensed: licensed[effective(assign[ag.id])], active: ag.id === sel }))}
            movedId={moved.id}
            moveKey={moved.key}
          />
          <p className="mt-2 text-[12.5px] leading-[1.5] text-subtle">
            Every agent in the tenant gets foundational Agent 365: a registry entry, block, delete and assign an owner. Premium follows the sponsor’s licence.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="border border-rule bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold text-ink">{agent.name}</p>
              <Pill tone={covered ? 'good' : 'bad'}>{covered ? 'Premium on' : 'Premium off'}</Pill>
              <Pill tone="neutral">Sponsor: {sponsor.name}</Pill>
            </div>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="label">Foundational, always</dt>
                <dd className="mt-1 space-y-1 text-[13.5px] text-ink">
                  {foundational.map((f) => (
                    <p key={f}>{f}</p>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="label">Premium, with a licensed sponsor</dt>
                <dd className={`mt-1 space-y-1 text-[13.5px] ${covered ? 'text-ink' : 'text-subtle line-through'}`}>
                  {premium.map((f) => (
                    <p key={f}>{f}</p>
                  ))}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[12.5px] leading-[1.5] text-subtle">
              Not stated, because Microsoft’s pages disagree: the licensing FAQ lists audit and eDiscovery of agent activity under both foundational and licensed capabilities, while the service description lists them as licensed only. Rule-based lifecycle actions are the reverse: included per the service description, licensed per the FAQ.
            </p>
          </div>
          <div className="space-y-3">
            <Insight stateKey={`${sel}-${named}-${tomLeaves}-${anaLicensed}`} tone={tone}>
              <p>{insight}</p>
            </Insight>
            <Button variant="quiet" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </Button>
          </div>
        </div>
      </Section>

      <Section n={2} title="What to take away" wide={false}>
        <ul className="space-y-2.5 text-[15px] leading-[1.6] text-ink">
          {[
            'Agent 365 is licensed per user. Agents, blueprints and instances need no licence and there is no per-agent charge.',
            'The licence is tied to the user associated with the agent: user, owner, sponsor or manager. An agent tied to an unlicensed user gets no Agent 365 protections.',
            'Users who delegate access to an agent must be licensed for their own activity. For an agent with its own access, the owner, sponsor or manager must be.',
            'Every agent identity needs a sponsor. With Entra ID Governance for agents (Agent 365 or E7), sponsorship transfers to the manager when the sponsor leaves, so the manager’s licence matters too.',
            'Viewing the Agent Registry needs a role (AI Reader), not a licence. Applying Conditional Access or governance to agents does.',
          ].map((x) => (
            <li key={x} className="flex gap-3">
              <span className="mt-[10px] h-[5px] w-[5px] shrink-0 bg-navy" />
              {x}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Callout tone="gold" title="What this means for the 25 licences">
            Give them to the sponsors and managers of pilot agents that run with their own access, and to every user whose agent acts on their behalf. Microsoft recommends a licence for anyone who interacts with, owns, manages or sponsors a managed agent. Price: Agent 365 USD 15 per user per month, paid yearly with an annual commitment, US list, read 5 Nov 2026.
          </Callout>
        </div>
      </Section>
    </PageShell>
  );
}
