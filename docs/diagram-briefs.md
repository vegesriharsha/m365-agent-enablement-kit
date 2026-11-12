# Glossary diagram briefs

Briefs for the glossary's 40 terms, written before any code. Quality over quantity: a term gets a diagram only when
it is a relationship, a boundary or a contrast that a sentence makes hard to hold. Eight diagrams cover 18 terms;
the other 22 stay text only, each with a reason.

Every product fact below is already on the site with a source key from `src/content/sources.js`. Two items marked
**verify** need a fresh look at the cited page before they are drawn. Names, sites and placements marked
*illustrative* are Contoso's, not Microsoft's.

## Rules every diagram follows

- One insight per diagram, readable without the definition.
- One entry point and one reading direction, shown with arrowheads.
- At most seven primary elements; labels of four words or fewer; longer text goes in a caption under the drawing.
- Drawn at the measured width with `useWidth`, stacked on narrow screens, labels at 11px or more. No sideways scroll.
- Colours from the tokens in `src/index.css` (never hex, so dark mode works): navy for the primary path, gold for at
  most one highlight, good and bad only for state and always with a word.
- No new dependencies: positions come from the helpers in `src/lib/layout.js`.
- Checked with `npm run diagrams` in every state at 1280, 768 and 390px, then by eye.

## Summary

| # | Diagram | Shape | Terms it serves | Interaction |
| --- | --- | --- | --- | --- |
| 1 | Who runs the engine | stack | Declarative agent, Custom engine agent | toggle |
| 2 | What an agent identity is made of | hierarchy | Agent identity, Agent blueprint, Sponsor, Owner | hover-highlight |
| 3 | The three connector groups | boundary | Data policy (DLP), Connector classification | step-through |
| 4 | Hidden from Copilot, still open to people | before-after | Restricted Content Discovery | toggle |
| 5 | What Agent 365 gives without a licence | stack | Agent 365 foundational, Agent 365 premium | hover-highlight |
| 6 | From work to credits to money | transformation | Copilot Credits | toggle |
| 7 | What each licence step unlocks for agents | spectrum | Copilot Chat, Microsoft 365 Copilot | step-through |
| 8 | Standards close a gate, a gate opens a wave | flow | Standard, Gate, Wave, Capability | step-through |

**Built on 11 Nov 2026:** diagrams **2** (hierarchy), **3** (boundary) and **5** (stack), one per shape family. Their
specs are in `src/content/diagrams.js`, the renderers in `src/diagrams/`, and they appear in the glossary and on the
Glossary diagrams page. The other five are briefed but not built.

---

## 1. Who runs the engine

- **Terms:** Declarative agent, Custom engine agent.
- **Insight:** The two agent types differ in who runs the orchestrator and the model, not in what the agent can talk about.
- **Misconception it corrects:** "Declarative means simple" and "custom engine means written in code". Copilot Studio
  can build either kind.
- **Shape:** stack. Four layers, top to bottom, read downwards.
- **Content:**
  - Layer 1: `Where people meet it` · Copilot, Teams
  - Layer 2: `Orchestrator`
  - Layer 3: `Model`
  - Layer 4: `Knowledge and actions`
  - Tag on layers 2 and 3: `Copilot's` (declarative) or `yours` (custom engine)
  - Example agents, *illustrative*: "Loan FAQ agent" (declarative, made in Agent Builder) and "Collections assistant"
    (custom engine, made in Copilot Studio).
- **Interaction:** toggle between the two types; only the tag on layers 2 and 3 changes.
- **Caption:** A declarative agent borrows Microsoft 365 Copilot's orchestrator and models. A custom engine agent brings its own.
- **Sources:** `agentsOverviewDaCea`, `agentBuilderOverview`.

## 2. What an agent identity is made of

- **Terms:** Agent identity, Agent blueprint, Sponsor, Owner.
- **Insight:** The blueprint holds the credentials, the agent identity holds none, a sponsor is always required and an owner is optional.
- **Misconception it corrects:** "An agent identity is a service account with a password" and "sponsor and owner are the same person".
- **Shape:** hierarchy. Blueprint to identity, left to right; the two people attach beneath the identity.
- **Content:**
  - Node: `Agent blueprint` · holds credentials
  - Node: `Agent identity` · no credentials
  - Node: `Sponsor` · required, accountable
  - Node: `Owner` · optional, technical
  - Arrow: blueprint creates identity
  - Example, *illustrative* except the blueprint name: blueprint "Microsoft Copilot Studio agent identity blueprint"
    (shown in the caption, since it is seven words); identity "Branch rota agent"; sponsor "Tom, branch manager";
    owner "Maya, maker".
- **Interaction:** hover or focus a node to highlight it and show its one-line definition.
- **Caption:** Copilot Studio creates an agent identity for every agent made since May 2026. Agent Builder agents do
  not use one today. With Entra ID Governance for agents, sponsorship moves to the manager when the sponsor leaves.
- **Sources:** `entraAgentIdentitiesOverview`, `entraAgentOwnersSponsors`, `entraAgentIdGovernance`, `csEntraAgentIds`,
  `csAgentIdentitiesFaq`.

## 3. The three connector groups

- **Terms:** Data policy (DLP), Connector classification.
- **Insight:** A Power Platform data policy sorts connectors into three groups, and an agent that uses a Blocked connector cannot be published.
- **Misconception it corrects:** "DLP here scans content for sensitive data." That is Microsoft Purview DLP. This
  policy decides which connectors a maker may use at all.
- **Shape:** boundary. Three regions side by side, read left to right from allowed to blocked.
- **Content:**
  - Region: `Business` · SharePoint, Dataverse, Microsoft Teams
  - Region: `Non-Business` · new connectors land here
  - Region: `Blocked` · HTTP, "Chat without Entra ID sign-in"
  - Marker on SharePoint, Dataverse and Teams: `cannot be blocked`
  - Outcome node: `Publish` · on or off
  - The placement is Contoso's and *illustrative*. The connector names are Microsoft's; "Chat without Microsoft Entra
    ID authentication in Copilot Studio" is shortened in the label and given in full in the caption.
- **Interaction:** step-through in three steps. Step 1: the agent uses SharePoint, Publish is on. Step 2: the maker
  adds the HTTP connector. Step 3: Publish switches off, because Copilot Studio enforces the policy in real time.
- **Caption:** Some connectors cannot be blocked in a data policy; advanced connector policies can restrict any certified connector.
- **Verified on 11 Nov 2026:** data cannot be shared among connectors in different groups, so one agent cannot
  combine Business and Non-Business connectors; new connectors default to Non-Business; a violation makes Publish
  unavailable in real time (`ppDlpConnectorClassification`, `csDataPolicies`). As built, the three groups sit inside
  a dashed "data policy" frame so the outcome reads as the policy's decision, not one group's.
- **Sources:** `ppDlpConnectorClassification`, `ppDlpOverview`, `csDataPolicies`, `ppAdvancedConnectorPolicies`.

## 4. Hidden from Copilot, still open to people

- **Terms:** Restricted Content Discovery.
- **Insight:** The setting changes what Copilot and agents can find, not who can open the site.
- **Misconception it corrects:** "Turning it on removes people's access." Permissions do not change.
- **Shape:** before-after. Two questions, each answered before and after the setting.
- **Content:**
  - Subject: SharePoint site "Board papers 2026" and Priya, who has access (*illustrative*)
  - Row: `Priya opens the site` · yes, then yes
  - Row: `Copilot finds it` · yes, then no (the caption says this covers agents too)
  - Setting label in monospace: `-RestrictContentOrgWideSearch`
- **Interaction:** toggle the setting off and on; only the second row changes.
- **Caption:** The site disappears from Copilot and from agents, and stays open to everyone who had access. A
  site-level SharePoint Advanced Management setting, included with a Microsoft 365 Copilot licence. Large sites can
  take about a week to update.
- **Sources:** `spoRestrictedContentDiscovery`, `samCopilotLicenseFeatures`.

## 5. What Agent 365 gives without a licence

- **Terms:** Agent 365 foundational, Agent 365 premium.
- **Insight:** Every agent gets the registry and basic control with Microsoft 365; the protective layer on top needs a licensed person behind the agent.
- **Misconception it corrects:** "No Agent 365 licence means no registry" and "Agent 365 is all or nothing".
- **Shape:** stack. Three bands, read from the bottom up.
- **Content:**
  - Bottom band: `Foundational` · with Microsoft 365 · Registry inventory; Block and delete; Assign an owner
  - Middle band, hatched: `Sources disagree` · Audit and eDiscovery; Lifecycle rules
  - Top band: `Premium` · licensed person · Policy templates; Conditional Access; Purview controls; Defender detection
- **Interaction:** hover or focus the middle band to see which Microsoft page says what.
- **Caption:** The licensing FAQ lists audit and eDiscovery under both foundational and licensed capabilities; the
  service description lists them as licensed only. Lifecycle rules are the reverse. The licence is tied to the user
  associated with the agent: user, owner, sponsor or manager.
- **Sources:** `agent365ServiceDescription`, `agent365LicensingFaq`.

## 6. From work to credits to money

- **Terms:** Copilot Credits.
- **Insight:** Different kinds of agent work burn credits at different rates, and a Copilot-licensed user working under their own identity burns none for most of it.
- **Misconception it corrects:** "One message costs one credit" and "a Copilot licence covers every agent run".
- **Shape:** transformation. Work on the left, credits in the middle, money on the right.
- **Content:**
  - Work items with their rates: `Classic answer` 1 · `Generative answer` 2 · `Agent action` 5 · `Graph grounding` 10
  - Middle: `Credits used` · 17 in the example
  - Right: `USD 0.17` at pay-as-you-go
  - Example, arithmetic *illustrative* on list rates: one generative answer, one agent action and one tenant graph
    grounding come to 17 credits, or USD 0.17 at USD 0.01 per credit.
- **Interaction:** toggle "user holds Microsoft 365 Copilot". On, the three items show "no charge". A marker stays on
  autonomous runs and computer use, which are always charged.
- **Caption:** A capacity pack is 25,000 credits for USD 200 a month. No-charge use is within fair-use limits. Rates
  and prices are list values read on 5 Nov 2026.
- **Sources:** `csBillingRates`, `csBillingLicensing`, `msCopilotStudioLicensingGuidance`.

## 7. What each licence step unlocks for agents

- **Terms:** Copilot Chat, Microsoft 365 Copilot.
- **Insight:** People without a Copilot licence can still build and use agents; each licence step widens what those agents may be grounded on.
- **Misconception it corrects:** "No Copilot licence means no agents." This is why switching agents off takes admin
  settings, not just withholding the licence.
- **Shape:** spectrum. Three steps, read left to right.
- **Content:**
  - Step 1: `Copilot Chat` · no charge · instructions, web grounding
  - Step 2: `Plus credits` · pay-as-you-go · SharePoint, Copilot connectors, Dataverse
  - Step 3: `Microsoft 365 Copilot` · licence · email, people, Teams chats
- **Interaction:** step-through; each step adds its knowledge sources to the ones before.
- **Caption:** Pay-as-you-go needs an Azure subscription and a billing policy in the Microsoft 365 admin center, and
  is off by default.
- **Verify before build:** re-open `copilotExtPrerequisites` and confirm the three-column matrix is unchanged since
  it was read on 5 Nov 2026.
- **Sources:** `copilotExtPrerequisites`, `manageAgentsCopilotChat`, `copilotExtensibilityCost`.

## 8. Standards close a gate, a gate opens a wave

- **Terms:** Standard, Gate, Wave, Capability.
- **Insight:** A wave opens when its standards exist, not when its date arrives.
- **Misconception it corrects:** "Wave 1 starts in Q1 2027." The window is a guess; the gate is the rule.
- **Shape:** flow. Left to right: standards, gate, wave, capability.
- **Content, all Contoso's own and taken from the sequencer:**
  - Standards: `Intake and triage` · `Licensed sponsor` · `Owners named`
  - Gate: `Gate 1`
  - Wave: `Wave 1 opens`
  - Capability: `Agent Builder, creator-only`
- **Interaction:** step-through. Each step ticks one standard; on the third the gate closes, the wave opens and the capability lights.
- **Caption:** Later waves need every earlier standard too.
- **Sources:** none needed; this is the site's own vocabulary.
- **Priority:** lowest. The sequencer page already teaches this interactively.

---

## Text only

| Term | Why no diagram |
| --- | --- |
| Agent Builder agent, Copilot Studio agent, Agent flow, Fabric data agent | Compared side by side on the Which builder page |
| Autonomous agent, User authentication, Maker-provided credentials | Shown moving on the identity path page; a second picture would repeat it |
| Copilot Cowork, Computer use | One behaviour each, already a state on the identity path page |
| Child and connected agents, MCP server | Single nouns; the definition is enough |
| Conditional Access for agents | A licensing sentence, not a relationship |
| Agent Registry, Agent Requests | Steps in the lifecycle flow page |
| Environment routing, Managed environment | The environment strategy page shows both with stress tests |
| Spending policy | A rule with two numbers; text carries it |
| Microsoft 365 E7 | The E5 to E7 page shows its parts and price |
| Domain, Register, Verified date, GA-only | The site's own words; each has a page that is the picture |

## Link fixes the review turned up

Five glossary entries point at a page that no longer shows the idea best. These are one-line data changes:

- User authentication, Maker-provided credentials, Autonomous agent: link to the identity path page.
- Environment routing, Managed environment: link to the environment strategy page.
- Microsoft 365 E7: link to the E5 to E7 page.

## Not briefed: three terms the glossary lacks

Grounding, Semantic index and Permission trimming are core Microsoft 365 Copilot ideas and would each suit a diagram.
They are not in the glossary today, and no source for them is in `sources.js`. Adding them means researching and
citing each first, then briefing it here.

## How these would be built

- One renderer per shape in `src/diagrams/` (stack, hierarchy, boundary, before-after, transformation, spectrum, flow),
  each driven by a `diagram` object on the glossary entry.
- A `diagrams` page that renders every glossary diagram on its own, so each can be checked in isolation.
- The states above added to `scripts/audit-diagrams.cjs`.
