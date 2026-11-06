// Archetype: decision. Each answer scores every option with [score, reason].
// The reasons are sourced; the scores only order them and are illustrative.
export default {
  header: {
    eyebrow: 'Decision · Which builder?',
    title: 'Pick the builder from the need, not from the tool you know',
    deck: 'Four in-scope ways to build an agent at Contoso. Answer four questions and see which one fits and why. Pro-code agents (Foundry, custom frameworks) are out of scope for now.',
  },
  sources: ['agentBuilderVsStudio', 'agentBuilderOverview', 'agentBuilderKnowledge', 'agentBuilderShare', 'agentBuilderOrgCatalog', 'csAddTools', 'csAgentFlowsOverview', 'csBillingRates', 'fabricDataAgentConcept', 'fabricDataAgentSharing', 'fabricDataAgentCopilotStudioTool', 'agent365Requests', 'csEventTriggersOverview'],
  sectionTitle: 'Which builder fits this need',
  maxScore: 12,
  options: [
    { id: 'ab', name: 'Agent Builder', blurb: 'Inside Microsoft 365 Copilot. Instructions, web and Microsoft 365 knowledge; no external actions.' },
    { id: 'cs', name: 'Copilot Studio', blurb: 'In a Power Platform environment. Knowledge, tools, connectors, flows, triggers and channels.' },
    { id: 'fab', name: 'Fabric data agent', blurb: 'In Microsoft Fabric. Read-only questions over lakehouses, warehouses and semantic models.' },
    { id: 'flow', name: 'Agent flow', blurb: 'In Copilot Studio. A deterministic trigger and actions, billed in Copilot Credits per 100 actions.' },
  ],
  questions: [
    {
      id: 'who',
      q: 'Who will use it?',
      default: 'me',
      answers: {
        me: { label: 'Just me', s: { ab: [3, 'Built and used in Copilot by one person; sharing stays off'], cs: [1, 'Works, but needs an environment and a licence path'], fab: [1, 'Only if the question is about governed data'], flow: [0, 'Automation is rarely personal'] } },
        team: { label: 'A team', s: { ab: [2, 'Share with named people or groups; org-wide needs admin approval'], cs: [2, 'Share with viewers under managed-environment sharing limits'], fab: [2, 'Share the published version; consumers need source permissions'], flow: [1, 'A flow serves a process more than a team'] } },
        org: { label: 'The whole organisation', s: { ab: [1, 'Submit to the org catalog and wait for Agent Requests approval'], cs: [3, 'Publish to Teams and Microsoft 365 Copilot through Agent Requests'], fab: [1, 'Publish to the Agent Store; every user needs data access'], flow: [2, 'A flow can run for a whole process once approved'] } },
      },
    },
    {
      id: 'where',
      q: 'Where does the knowledge live?',
      default: 'm365',
      answers: {
        m365: { label: 'Microsoft 365 files and sites', s: { ab: [3, 'SharePoint, OneDrive, Teams and email, under the user’s permissions'], cs: [2, 'SharePoint and Dataverse knowledge with user authentication'], fab: [-2, 'Fabric reads lakehouses and models, not documents'], flow: [0, 'Flows act; they do not answer questions'] } },
        fabric: { label: 'A governed dataset in Fabric', s: { ab: [-2, 'Agent Builder cannot query Fabric'], cs: [1, 'Reach a data agent through the Fabric IQ Data MCP tool'], fab: [3, 'Built for this: SQL, DAX and KQL with row- and column-level security'], flow: [-1, 'Not a question-answering tool'] } },
        system: { label: 'A business system through a connector', s: { ab: [-3, 'No external-service actions in Agent Builder'], cs: [3, 'Connectors as tools, user or maker authentication, governed by data policies'], fab: [-2, 'Fabric sources only'], flow: [2, 'Connectors as flow actions'] } },
      },
    },
    {
      id: 'do',
      q: 'What must it do?',
      default: 'answer',
      answers: {
        answer: { label: 'Answer and draft', s: { ab: [3, 'Exactly what a declarative agent does'], cs: [2, 'Generative answers over knowledge, two credits each unless Copilot-licensed'], fab: [2, 'Answers with the query it ran'], flow: [-2, 'A flow has no conversation'] } },
        act: { label: 'Take an action in a system', s: { ab: [-3, 'Copy to Copilot Studio first; the copy is a snapshot'], cs: [3, 'Tools: connectors, MCP servers, prompts; five credits per action'], fab: [-3, 'Read-only by design'], flow: [2, 'Actions in a fixed order, no judgement'] } },
        trigger: { label: 'Run on a trigger or schedule', s: { ab: [-3, 'No triggers'], cs: [2, 'Event and recurrence triggers, under the maker’s credentials; wave 4'], fab: [-3, 'No triggers'], flow: [3, 'A trigger is what a flow starts from'] } },
      },
    },
    {
      id: 'builder',
      q: 'Who builds it?',
      default: 'business',
      answers: {
        business: { label: 'A business user in Copilot', s: { ab: [3, 'No environment, no solution, no Power Platform licence'], cs: [0, 'Needs a Copilot Studio author role or a Copilot licence and a routed environment'], fab: [-1, 'Needs Fabric workspace access and capacity'], flow: [0, 'Needs Copilot Studio'] } },
        maker: { label: 'A maker in Power Platform', s: { ab: [0, 'Simpler than they need'], cs: [3, 'Environments, solutions and pipelines are their tools'], fab: [0, 'A data engineer’s tool, not a maker’s'], flow: [2, 'Makers already build flows'] } },
        data: { label: 'A data engineer in Fabric', s: { ab: [-1, 'Wrong surface'], cs: [0, 'Only to wrap a data agent for Copilot'], fab: [3, 'Built in the Fabric workspace next to the data'], flow: [-1, 'Wrong surface'] } },
      },
    },
  ],
  verdicts: {
    ab: 'Build it in Copilot and keep sharing to named people. If it ever needs an action, copy it to Copilot Studio and treat the copy as a new agent: the copy is a snapshot, not a sync.',
    cs: 'Build it in a routed developer environment with user authentication, then promote through a solution. Publishing to everyone goes through Agent Requests in the Microsoft 365 admin center.',
    fab: 'Needs a paid F2 or higher Fabric capacity, or a P1 or higher Power BI Premium capacity with Fabric enabled, and the Fabric tenant settings on. Consumers need read access to the sources; sharing the agent grants nothing. Reach Copilot Studio through the Fabric IQ Data MCP tool, which needs a Microsoft 365 Copilot licence.',
    flow: 'Build it as an agent flow in Copilot Studio. Actions are billed in Copilot Credits per 100 actions, with no charge for Copilot-licensed users when an agent calls the flow. New runs are blocked when the environment has no credits left; runs in progress finish.',
  },
};
