// One entry per page. `id` is the URL hash (#id): letters, digits and hyphens only.
// Use `archetype` + `data` for data-driven pages, or `component` for a custom page.
import journey from './journey.js';
import glossary from './glossary.js';
import explorer from './explorer.js';
import sequencer from './sequencer.js';
import decision from './decision.js';
import flow from './flow.js';
import practicePowershell from './practice-powershell.js';
import practicePac from './practice-pac.js';
import practiceGraph from './practice-graph.js';
import register from './register.js';
import RiskTier from '../pages/RiskTier.jsx';
import Agent365Licence from '../pages/Agent365Licence.jsx';
import WhoseIdentity from '../pages/WhoseIdentity.jsx';
import Environments from '../pages/Environments.jsx';
import E5ToE7 from '../pages/E5ToE7.jsx';

export const groups = [
  {
    name: 'Start',
    pages: [
      { id: 'home', title: 'Overview', kind: 'Index', archetype: 'home' },
      { id: 'journey', title: 'Adoption journey', kind: 'Stepper', archetype: 'journey', data: journey, blurb: 'Six phases from preparation to scale, each closed by a gate you can tick.' },
      { id: 'glossary', title: 'Glossary', kind: 'Explorer', archetype: 'glossary', data: glossary, blurb: 'Every agent type and governance word in plain language, with a bank analogy you can switch on.' },
    ],
  },
  {
    name: 'Plan',
    pages: [
      { id: 'domains', title: 'Standards domains', kind: 'Explorer', archetype: 'explorer', data: explorer, blurb: 'Scope, governance, identity, ownership and observability: what each must define before agents open.' },
      { id: 'sequencer', title: 'Capability sequencer', kind: 'Sequencer', archetype: 'sequencer', data: sequencer, blurb: 'Ten capabilities in five waves, each gated by the standards it needs. Tick standards and watch gates close.' },
      { id: 'register', title: 'Technology register', kind: 'Dashboard', archetype: 'register', data: register, blurb: 'Every product capability and site dependency, its status, and when it was last checked.' },
    ],
  },
  {
    name: 'Decide',
    pages: [
      { id: 'which-builder', title: 'Which builder?', kind: 'Decision', archetype: 'decision', data: decision, blurb: 'Agent Builder, Copilot Studio, a Fabric data agent or an agent flow: four questions and a ranked answer.' },
      { id: 'risk-tier', title: 'Risk tier simulator', kind: 'Custom simulator', component: RiskTier, blurb: 'Describe an agent and see its tier, the reviews it needs and who approves it.' },
      { id: 'agent365-licence', title: 'Who needs an Agent 365 licence', kind: 'Custom simulator', component: Agent365Licence, blurb: 'Move an agent between sponsors and watch its premium protections follow the licence, not the agent.' },
      { id: 'whose-identity', title: 'Whose identity does the agent use?', kind: 'Custom simulator', component: WhoseIdentity, blurb: 'Send a request through six kinds of agent and see where the identity check stops it, or does not.' },
      { id: 'environments', title: 'Environment strategy', kind: 'Custom simulator', component: Environments, blurb: 'Sort makers’ work into four environments, then stress-test the layout with the dates that are coming.' },
      { id: 'e5-to-e7', title: 'E5 to E7', kind: 'Custom simulator', component: E5ToE7, blurb: 'Monthly list cost of each licence shape against a budget line, and the waves each one opens.' },
    ],
  },
  {
    name: 'Operate',
    pages: [
      { id: 'lifecycle', title: 'Agent lifecycle', kind: 'Animated flow', archetype: 'flow', data: flow, blurb: 'One agent from request to retirement through real product steps, and the four ways it breaks.' },
    ],
  },
  {
    name: 'Practice',
    pages: [
      { id: 'practice-powershell', title: 'PowerShell practice', kind: 'Practice', archetype: 'practice', data: practicePowershell, blurb: 'Nine read-only inventory and audit commands, typed until they stick.' },
      { id: 'practice-pac', title: 'Power Platform CLI practice', kind: 'Practice', archetype: 'practice', data: practicePac, blurb: 'List environments, data policies and the Copilot Studio agents in each environment: seven levels and one preview query.' },
      { id: 'practice-graph', title: 'Graph practice', kind: 'Practice', archetype: 'practice', data: practiceGraph, blurb: 'Six Microsoft Graph requests for agents, usage and audit, with the permission each needs.' },
    ],
  },
];

export const allPages = groups.flatMap((g) => g.pages.map((p) => ({ ...p, group: g.name })));
export const pageById = Object.fromEntries(allPages.map((p) => [p.id, p]));
