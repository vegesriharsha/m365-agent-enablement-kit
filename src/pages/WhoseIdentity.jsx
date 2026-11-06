import { useState } from 'react';
import { Send } from 'lucide-react';
import { Section, Insight, Segmented, Button, Pill, Callout, Illustrative } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { useProgress, pointOnPolyline } from '../lib/hooks.js';

/*
 * Pattern 1, token on a path. A request carries an identity from the person
 * (or the trigger) through the agent to the data, and is checked at the data
 * boundary. The identity on the token is what the product documentation says
 * each agent type uses; the loan file and the names are illustrative.
 */
const types = [
  { id: 'builder', label: 'Agent Builder', identity: 'user', stations: ['Priya asks', 'Copilot orchestrator', 'Knowledge: SharePoint site', 'Loan file 4471'] },
  { id: 'cs-user', label: 'Copilot Studio, user auth', identity: 'user', stations: ['Priya asks', 'Copilot Studio agent', 'Tool: connector, user authentication', 'Loan system record'] },
  { id: 'cs-author', label: 'Copilot Studio, author auth', identity: 'maker', stations: ['Priya asks', 'Copilot Studio agent', 'Tool: connector, agent author authentication', 'Loan system record'] },
  { id: 'trigger', label: 'Autonomous trigger', identity: 'maker', noUser: true, stations: ['Event trigger fires', 'Copilot Studio agent', 'Tool: connector, maker credentials', 'Loan system record'] },
  { id: 'fabric', label: 'Fabric data agent', identity: 'user', stations: ['Priya asks', 'Fabric data agent', 'Query: SQL under RLS and CLS', 'Lakehouse rows'] },
  { id: 'cowork', label: 'Copilot Cowork', identity: 'user', stations: ['Priya delegates', 'Cowork planner', 'Skill: read files, send mail', 'Loan file 4471'] },
];

const X = [90, 330, 570, 830];
const Y = 96;
const STOP = [735, Y];
const END = [955, Y];

function outcome(type, access) {
  const user = type.identity === 'user';
  if (type.id === 'cs-author' || type.id === 'trigger') {
    const who = type.id === 'trigger' ? 'The run never asks who the reader is: a trigger can only use the maker’s credentials.' : 'The connector ran under the agent author’s connection, so the identity on the path was the maker’s, not Priya’s.';
    return access
      ? { status: 'ok', label: 'Returned, as the maker', text: `Returned the record. ${who} Priya could read it anyway, so nothing leaked this time.` }
      : { status: 'exposed', label: 'Returned a record the user cannot open', text: `Passed and returned a record Priya cannot open herself. ${who} This is the exposure the Copilot Studio documentation warns about; admins can block maker-provided credentials, which also stops autonomous agents.` };
  }
  if (type.id === 'fabric') {
    return access
      ? { status: 'ok', label: 'Rows the user can read', text: 'The query ran under Priya’s identity. Row-level and column-level security applied, so she got the rows she can already read in the lakehouse.' }
      : { status: 'stopped', label: 'No rows for this user', text: 'With no permission on the lakehouse, the query fails or returns nothing. With access but row-level or column-level security, the rows and columns Priya cannot read are filtered out. Sharing the data agent grants no access to its sources.' };
  }
  if (type.id === 'cowork') {
    return access
      ? { status: 'ok', label: 'Acted as the user, with approval', text: 'Cowork works under Priya’s Microsoft 365 identity and inherits her permissions. Sensitive steps such as sending mail pause for her approval.' }
      : { status: 'stopped', label: 'Stopped: no access', text: 'Cowork inherits Priya’s permissions, so a file she cannot open stays closed to it. Nothing about delegation widens what she can reach.' };
  }
  if (type.id === 'cs-user') {
    return access
      ? { status: 'ok', label: 'Returned, as the user', text: 'The connector call ran under Priya’s own token. User authentication means every user of the agent sees only their own data.' }
      : { status: 'stopped', label: 'Refused: no access', text: 'The connector refused the call because it ran as Priya and she has no access to that record. The agent cannot do what its user cannot.' };
  }
  return access
    ? { status: 'ok', label: 'Returned, as the user', text: `Returned the content. ${user ? 'All Microsoft 365 Copilot prompts run in the security context of the user who sends them.' : ''}` }
    : { status: 'stopped', label: 'Left out of the answer', text: 'The site is outside Priya’s permissions, so its content was not used. The agent itself never grants access; the only way access changes is if the owner chooses to share the SharePoint files when sharing the agent.' };
}

export default function WhoseIdentity() {
  const [typeId, setTypeId] = useState('cs-author');
  const [access, setAccess] = useState(false);
  const [run, setRun] = useState(0);
  const type = types.find((x) => x.id === typeId);
  const r = outcome(type, access);
  const stopped = r.status === 'stopped';
  const pts = stopped ? [[X[0], Y], STOP] : [[X[0], Y], END];
  const t = useProgress(`${run}-${typeId}-${access}`, 2000);
  const [px, py] = pointOnPolyline(pts, t);
  const color = r.status === 'ok' ? 'var(--navy)' : r.status === 'stopped' ? 'var(--good)' : 'var(--bad)';
  const pillTone = r.status === 'ok' ? 'navy' : r.status === 'stopped' ? 'good' : 'bad';
  const who = type.identity === 'user' ? 'Priya' : 'Maker';

  return (
    <PageShell
      header={{
        eyebrow: 'Custom page · Identity on the path',
        title: 'The identity an agent runs as decides what it can reach',
        deck: 'Send a request through six kinds of agent. Watch which identity the token carries and where the check at the data boundary stops it, or does not.',
        meta: [{ dt: 'Agent types', dd: String(types.length) }, { dt: 'Checked at', dd: 'the data boundary' }],
      }}
      sources={['purviewDlpCopilot', 'agentBuilderShare', 'csUserAuthentication', 'csToolAuthentication', 'csEventTriggersOverview', 'csMakerCredentials', 'fabricDataAgentSharing', 'coworkFaq', 'coworkAdminGovernance', 'csAgentIdentitiesFaq', 'agent365Registry']}
    >
      <Section n={1} title="Send a request" intro="Priya is a loan officer. Pick the agent type and whether she can open the target herself, then send. Green means the request was stopped as it should be; red means it returned something she cannot open.">
        <div className="mb-3">
          <Illustrative>Illustrative file, record and names</Illustrative>
        </div>
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Segmented label="Agent type" value={typeId} onChange={setTypeId} options={types.map((x) => ({ value: x.id, label: x.label }))} />
          <div className="space-y-4">
            <Segmented
              label="Priya’s own access to the target"
              value={access ? 'has' : 'lacks'}
              onChange={(v) => setAccess(v === 'has')}
              options={[
                { value: 'has', label: 'Can open it' },
                { value: 'lacks', label: 'Cannot open it' },
              ]}
            />
            <Button onClick={() => setRun((n) => n + 1)}>
              <Send size={14} /> Send again
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto border border-rule bg-paper">
          <svg viewBox="0 0 990 200" className="block w-full min-w-[680px]" role="img" aria-label={`${type.label}: ${r.label}`}>
            <line x1={X[0]} x2={END[0]} y1={Y} y2={Y} stroke="var(--rule)" strokeWidth="1.25" />
            <text x={END[0]} y={Y + 28} textAnchor="middle" fontSize="10.5" fill="var(--subtle)">
              returned
            </text>
            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="3" strokeOpacity="0.35" />
            {type.stations.map((label, i) => {
              const boundary = i === 3;
              return (
                <g key={label}>
                  <rect x={X[i] - 85} y={Y - 34} width={170} height={68} fill={boundary ? 'var(--callout)' : 'var(--surface)'} stroke={boundary ? color : 'var(--rule)'} strokeWidth={boundary ? 2 : 1.25} />
                  <text x={X[i]} y={Y - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">
                    {label.split(': ')[0]}
                  </text>
                  {label.includes(': ') && (
                    <text x={X[i]} y={Y + 10} textAnchor="middle" fontSize="10.5" fill="var(--subtle)">
                      {label.split(': ')[1]}
                    </text>
                  )}
                  {boundary && (
                    <text x={X[i]} y={Y + 26} textAnchor="middle" fontSize="10" fill="var(--subtle)">
                      access check
                    </text>
                  )}
                </g>
              );
            })}
            {/* the boundary mark */}
            <line x1={STOP[0]} x2={STOP[0]} y1={Y - 52} y2={Y + 52} stroke={color} strokeWidth="1.25" strokeDasharray="4 3" />
            <text x={STOP[0] - 6} y={Y - 56} textAnchor="end" fontSize="10.5" fill="var(--subtle)">
              {type.id === 'fabric' ? 'RLS and CLS' : 'can this identity read it?'}
            </text>
            {/* the token */}
            <g transform={`translate(${px} ${py})`}>
              <circle r={9} fill={color} stroke="var(--paper)" strokeWidth="2" />
              <rect x={-30} y={-38} width={60} height={18} fill="var(--surface)" stroke={color} strokeWidth="1" />
              <text y={-25} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={color}>
                {who}
              </text>
            </g>
            {t >= 1 && stopped && (
              <g transform={`translate(${STOP[0]} ${STOP[1]})`}>
                <circle r={15} fill="var(--good-soft)" stroke="var(--good)" strokeWidth="1.5" />
                <path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="var(--good)" strokeWidth="2" />
              </g>
            )}
            {t >= 1 && r.status === 'exposed' && (
              <g transform={`translate(${X[3]} ${Y + 48})`}>
                <path d="M-12 10 L0 -10 L12 10 Z" fill="var(--bad-soft)" stroke="var(--bad)" strokeWidth="1.5" />
                <text y={8} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--bad)">
                  !
                </text>
              </g>
            )}
          </svg>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[14px] font-medium text-ink">{type.label}</span>
          <Pill tone={pillTone}>{r.label}</Pill>
          <Pill tone="neutral">Identity on the token: {who}</Pill>
          {type.noUser && <Pill tone="gold">No user on the path</Pill>}
        </div>
        <div className="mt-4">
          <Insight stateKey={`${typeId}-${access}`} tone={pillTone === 'navy' ? 'navy' : pillTone}>
            <p>{r.text}</p>
          </Insight>
        </div>
      </Section>

      <Section n={2} title="What to take away" wide={false}>
        <ul className="space-y-2.5 text-[15px] leading-[1.6] text-ink">
          {[
            'Microsoft 365 Copilot and Agent Builder agents run as the person asking. The agent never widens what that person can see; access changes only if the owner shares the SharePoint files along with the agent.',
            'Copilot Studio tools choose: user authentication keeps each user inside their own data; agent author authentication gives everyone the maker’s reach.',
            'Event triggers can only use the maker’s credentials. An autonomous agent has no user to run as, so the maker-credential decision is the control.',
            'Fabric data agents query as the user and honour row-level and column-level security; sharing the agent grants no access to the data.',
            'Copilot Studio agents created since May 2026 get an Entra Agent ID; older ones keep an app registration until migrated. Agent Builder agents do not use or require one today; the Microsoft 365 Agent Registry is where they are governed.',
          ].map((x) => (
            <li key={x} className="flex gap-3">
              <span className="mt-[10px] h-[5px] w-[5px] shrink-0 bg-navy" />
              {x}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Callout tone="gold" title="Simplified here">
            Real requests pass through more steps: orchestration, grounding, Purview checks, connector throttling. The one check shown is the one that decides exposure.
          </Callout>
        </div>
      </Section>
    </PageShell>
  );
}
