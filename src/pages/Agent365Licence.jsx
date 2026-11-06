import { useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Section, Insight, Segmented, Toggle, Button, Pill, Callout, Illustrative } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { useProgress } from '../lib/hooks.js';

/*
 * Pattern 3, inheritance tree. The Agent 365 licence is a property of a person
 * (sponsor, owner or manager); an agent inherits premium protection from the
 * person it hangs under. Names and agents are illustrative; the rules are not.
 */
const sponsors = [
  { id: 'priya', name: 'Priya', role: 'Head of lending operations' },
  { id: 'tom', name: 'Tom', role: 'Branch manager', manager: 'ana' },
  { id: 'ana', name: 'Ana', role: 'Regional director, Tom’s manager' },
];
const agents = [
  { id: 'a', name: 'Loan FAQ agent', kind: 'Agent Builder' },
  { id: 'b', name: 'Branch rota agent', kind: 'Copilot Studio' },
  { id: 'c', name: 'Policy finder', kind: 'Copilot Studio' },
];
const foundational = ['Agent Registry entry', 'Block, delete, assign an owner'];
const premium = ['Policy templates', 'Conditional Access for agents', 'Purview DLP and Insider Risk for agents', 'Defender detection and posture'];

const SX = { priya: 190, tom: 520, ana: 850 };
const ROOT = [520, 46];
const SY = 170;
const AY = 318;
const AW = 122;
const AGAP = 132;

export default function Agent365Licence() {
  const [assign, setAssign] = useState({ a: 'priya', b: 'tom', c: 'ana' });
  const [sel, setSel] = useState('b');
  const [tomLeaves, setTomLeaves] = useState(false);
  const [anaLicensed, setAnaLicensed] = useState(true);
  const [moveKey, setMoveKey] = useState(0);
  const moveRef = useRef({ id: null, from: null });
  const t = useProgress(`move-${moveKey}`, 900);

  const licensed = { priya: true, tom: false, ana: anaLicensed };
  const effective = (s) => (s === 'tom' && tomLeaves ? 'ana' : s);

  // Lay agents out under their effective sponsor, centred and evenly spaced.
  const groups = {};
  agents.forEach((ag) => {
    const s = effective(assign[ag.id]);
    (groups[s] = groups[s] ?? []).push(ag.id);
  });
  const pos = {};
  Object.entries(groups).forEach(([s, ids]) => {
    ids.forEach((id, i) => {
      pos[id] = [SX[s] + (i - (ids.length - 1) / 2) * AGAP, AY];
    });
  });
  const drawn = (id) => {
    const m = moveRef.current;
    if (m.id === id && m.from && t < 1) return [m.from[0] + (pos[id][0] - m.from[0]) * t, m.from[1] + (pos[id][1] - m.from[1]) * t];
    return pos[id];
  };

  const move = (to) => {
    if (assign[sel] === to) return;
    moveRef.current = { id: sel, from: pos[sel] };
    setAssign((a) => ({ ...a, [sel]: to }));
    setMoveKey((k) => k + 1);
  };
  const reset = () => {
    moveRef.current = { id: null, from: null };
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

        <div className="mt-6 overflow-x-auto border border-rule bg-paper">
          <svg viewBox="0 0 1040 400" className="block w-full min-w-[720px]" role="img" aria-label={`${agent.name} under ${sponsor.name}: premium protections ${covered ? 'on' : 'off'}`}>
            {/* tenant root */}
            <rect x={ROOT[0] - 200} y={ROOT[1] - 30} width={400} height={60} fill="var(--callout)" stroke="var(--rule)" strokeWidth="1.25" />
            <text x={ROOT[0]} y={ROOT[1] - 6} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--ink)">
              Contoso tenant · Microsoft 365 E5
            </text>
            <text x={ROOT[0]} y={ROOT[1] + 14} textAnchor="middle" fontSize="11.5" fill="var(--subtle)">
              Foundational Agent 365 for every agent: registry, block, delete, assign an owner
            </text>

            {/* root to sponsors */}
            {sponsors.map((s) => (
              <path key={s.id} d={`M${ROOT[0]} ${ROOT[1] + 30} V${(ROOT[1] + SY) / 2} H${SX[s.id]} V${SY - 34}`} fill="none" stroke="var(--rule)" strokeWidth="1.25" />
            ))}

            {/* sponsors */}
            {sponsors.map((s) => {
              const lic = licensed[s.id];
              const gone = s.id === 'tom' && tomLeaves;
              return (
                <g key={s.id} opacity={gone ? 0.45 : 1}>
                  <rect x={SX[s.id] - 120} y={SY - 34} width={240} height={68} fill="var(--surface)" stroke={lic ? 'var(--navy)' : 'var(--rule)'} strokeWidth={lic ? 2 : 1.25} />
                  <text x={SX[s.id] - 106} y={SY - 10} fontSize="14" fontWeight="600" fill="var(--ink)">
                    {s.name}
                    {gone ? ' · left' : ''}
                  </text>
                  <text x={SX[s.id] - 106} y={SY + 8} fontSize="11" fill="var(--subtle)">
                    {s.role}
                  </text>
                  <rect x={SX[s.id] - 106} y={SY + 15} width={lic ? 70 : 78} height={15} fill={lic ? 'var(--navy)' : 'var(--bad-soft)'} />
                  <text x={SX[s.id] - 106 + (lic ? 35 : 39)} y={SY + 26} textAnchor="middle" fontSize="9.5" fontWeight="600" letterSpacing="0.08em" fill={lic ? 'var(--on-navy)' : 'var(--bad)'}>
                    {lic ? 'LICENSED' : 'NO LICENCE'}
                  </text>
                </g>
              );
            })}

            {/* transfer of sponsorship */}
            {tomLeaves && (
              <g>
                <path d={`M${SX.tom + 120} ${SY} H${SX.ana - 120}`} fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="5 4" />
                <text x={(SX.tom + SX.ana) / 2} y={SY - 8} textAnchor="middle" fontSize="11" fill="var(--gold)">
                  sponsorship moves to the manager
                </text>
              </g>
            )}

            {/* sponsors to agents, and agents */}
            {agents.map((ag) => {
              const [x, y] = drawn(ag.id);
              const s = effective(assign[ag.id]);
              const lic = licensed[s];
              const active = ag.id === sel;
              return (
                <g key={ag.id}>
                  <path d={`M${SX[s]} ${SY + 34} V${(SY + AY) / 2 + 20} H${x} V${y - 38}`} fill="none" stroke={active ? 'var(--navy)' : 'var(--rule)'} strokeWidth={active ? 1.75 : 1.25} />
                  <rect x={x - AW / 2} y={y - 38} width={AW} height={76} fill="var(--surface)" stroke={active ? 'var(--navy)' : 'var(--rule)'} strokeWidth={active ? 2 : 1.25} />
                  <text x={x} y={y - 20} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">
                    {ag.name}
                  </text>
                  <text x={x} y={y - 6} textAnchor="middle" fontSize="10.5" fill="var(--subtle)">
                    {ag.kind}
                  </text>
                  <circle cx={x - 44} cy={y + 12} r={4} fill="var(--good)" />
                  <text x={x - 36} y={y + 16} fontSize="10.5" fill="var(--ink)">
                    foundational
                  </text>
                  <circle cx={x - 44} cy={y + 28} r={4} fill={lic ? 'var(--navy)' : 'none'} stroke={lic ? 'var(--navy)' : 'var(--bad)'} strokeWidth="1.5" />
                  <text x={x - 36} y={y + 32} fontSize="10.5" fill={lic ? 'var(--ink)' : 'var(--bad)'}>
                    {lic ? 'premium' : 'premium off'}
                  </text>
                </g>
              );
            })}
          </svg>
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
