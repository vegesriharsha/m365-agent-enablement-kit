// Glossary diagrams as data. Each spec names a shape (one renderer per shape in
// src/diagrams/) and gives it content. Briefs are in docs/diagram-briefs.md.
// Labels stay at four words or fewer; anything longer goes in `caption` or a `note`.
export default {
  'agent-identity': {
    shape: 'hierarchy',
    title: 'The blueprint holds the credentials; the agent identity holds none',
    terms: ['Agent identity', 'Agent blueprint', 'Sponsor', 'Owner'],
    illustrative: 'Illustrative names',
    // The chain reads in order; `attached` hangs nodes under one member of the chain.
    chain: ['blueprint', 'identity'],
    chainLabel: 'creates',
    attached: { identity: ['sponsor', 'owner'] },
    selected: 'identity',
    nodes: {
      blueprint: { label: 'Agent blueprint', sub: 'holds credentials', example: 'Copilot Studio blueprint', note: 'The Entra object that holds the credentials and from which agent identities are created. Copilot Studio’s is named “Microsoft Copilot Studio agent identity blueprint”.' },
      identity: { label: 'Agent identity', sub: 'no credentials', example: 'Branch rota agent', note: 'A special service principal with no credentials of its own. Copilot Studio creates one for every agent made since May 2026; Agent Builder agents do not use one today.' },
      sponsor: { label: 'Sponsor', sub: 'required, accountable', example: 'Tom, manager', link: 'answers for', note: 'The user or group accountable for the agent. Every agent identity and blueprint must have one. With Entra ID Governance for agents, sponsorship moves to the manager when the sponsor leaves.' },
      owner: { label: 'Owner', sub: 'optional, technical', example: 'Maya, maker', link: 'administers', optional: true, note: 'An optional technical administrator, distinct from the sponsor. Admins can assign or reassign owners in the Microsoft 365 admin center.' },
    },
    caption: 'Select a part to see what it is. The agent identity is what policies and sign-in logs refer to; the people attached to it are who answers for it.',
  },

  'connector-groups': {
    shape: 'boundary',
    title: 'A data policy sorts connectors into three groups; a Blocked one stops Publish',
    terms: ['Data policy (DLP)', 'Connector classification'],
    illustrative: 'Illustrative placement',
    regions: [
      { id: 'business', label: 'Business', sub: 'business-use data', items: [{ label: 'SharePoint', locked: true }, { label: 'Dataverse', locked: true }, { label: 'Microsoft Teams', locked: true }] },
      { id: 'nonbusiness', label: 'Non-Business', sub: 'personal-use data', items: [], empty: 'new connectors land here' },
      { id: 'blocked', label: 'Blocked', sub: 'cannot be used', blocked: true, items: [{ label: 'HTTP' }, { label: 'Unauthenticated chat' }] },
    ],
    frame: 'Data policy',
    legend: 'cannot be blocked',
    check: 'policy check',
    outcome: { label: 'Publish', on: 'on', off: 'off' },
    steps: [
      { text: 'The agent uses SharePoint, a Business connector. Publish is on.', uses: ['SharePoint'], outcome: 'on' },
      { text: 'The maker adds the HTTP connector as a tool.', uses: ['SharePoint', 'HTTP'], outcome: 'on' },
      { text: 'HTTP is in the Blocked group, so Copilot Studio makes Publish unavailable. Enforcement is real time.', uses: ['SharePoint', 'HTTP'], outcome: 'off' },
    ],
    caption: 'An agent cannot combine connectors from two groups, and new connectors land in Non-Business by default. Some connectors cannot be blocked here; advanced connector policies can restrict any certified connector. “Unauthenticated chat” is the connector “Chat without Microsoft Entra ID authentication in Copilot Studio”.',
  },

  'agent365-layers': {
    shape: 'stack',
    title: 'Every agent gets the registry; the protective layer needs a licensed person',
    terms: ['Agent 365 foundational', 'Agent 365 premium'],
    // Bands are listed top to bottom; the stack is read from the bottom up.
    bands: [
      { id: 'premium', label: 'Premium', sub: 'licensed person', items: ['Policy templates', 'Conditional Access', 'Purview controls', 'Defender detection'], note: 'Needs an Agent 365 licence or Microsoft 365 E7. The licence is tied to the user associated with the agent: user, owner, sponsor or manager.' },
      { id: 'disputed', label: 'Sources disagree', sub: 'not stated', hatched: true, items: ['Audit and eDiscovery', 'Lifecycle rules'], note: 'The licensing FAQ lists audit and eDiscovery under both foundational and licensed capabilities; the service description lists them as licensed only. Lifecycle rules are the reverse: included per the service description, licensed per the FAQ.' },
      { id: 'foundational', label: 'Foundational', sub: 'with Microsoft 365', items: ['Registry inventory', 'Block and delete', 'Assign an owner'], note: 'Included with Microsoft 365 plans, for every agent, whoever sponsors it. Viewing the registry needs a role such as AI Reader, not a licence.' },
    ],
    caption: 'Select a band to see what it covers. Read it from the bottom up: the foundation is there for every agent, and each band above needs more.',
  },
};
