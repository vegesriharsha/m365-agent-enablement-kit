# Pathway spec: agents in Microsoft 365 Copilot

Pre-filled for the first run, reviewed against the kit on 5 Nov 2026 and updated the same day from the research in
`notes/research.md`. Everything here uses the fictional Contoso Bank and is safe for a public repo. The real
organisation's context lives in `notes/context.md` (git-ignored) and never on the site. Every product fact below has a
dated source in `src/content/sources.js`; "GA" means the page carried no preview label on 5 Nov 2026.

## 1. The technology and the outcome

- **Technology:** agents across Microsoft 365 Copilot, Copilot Studio, Power Platform, Fabric and Copilot Cowork,
  governed with Microsoft Agent 365.
- **Why now:** Contoso Bank switched Microsoft 365 Copilot on with agents disabled, is moving from Microsoft 365 E5
  to E7, and is starting with 25 licences to pilot Agent 365.
- **Outcome in one sentence:** Contoso enables agents wave by wave, each wave opening only when the standards it needs
  exist, with the 25 pilot licences proving the governance model before it scales.
- **Contoso Bank (fictional, illustrative):** a small regional lender with about 350 Microsoft 365 users and about 20 IT
  staff, a small platform team and a regulator that expects change control. "At scale" means all 350 users.

## 2. Audience and their decisions

| Audience | Decisions they need to make | What they already know |
| --- | --- | --- |
| Platform team and architects | Which capabilities open when; environment strategy; registry and identity model; who gets the 25 licences | M365 admin, Entra, Purview basics |
| Risk and compliance | Risk tiers; approval and exception rules; what evidence is enough; how agents are classified | Model risk and EUC policies; little about agent types |
| Makers and business teams | Which builder to use; what they must register; what they own | Copilot Chat; maybe Power Platform |
| Executives | Licence decision (E5 to E7); pace and scope of the rollout | The business goal |

## 3. Hosting

- [x] **Private while testing.** Git repository initialised on `main`, no remote yet. Run locally (`npm run dev`); no
  GitHub Pages. Keep `.github/workflows/deploy.yml`; it only runs on a push to `main`.
- [ ] **Public** (GitHub Pages): fictional Contoso Bank only, generic content.
- [ ] **Internal**: real names allowed; host the organisation approves.

Decide public or internal before the first publish. Fictional organisation: Contoso Bank.

## 4. Capabilities in scope

Risk tier is Low, Medium or High (the sequencer's values). Enablers carry no risk tier and show no risk pill. Each
capability belongs to exactly one wave.

| Capability | Platform | Risk tier | Wave | Status (5 Nov 2026) |
| --- | --- | --- | --- | --- |
| Agent 365 foundational: Agent Registry inventory, basic governance actions, lifecycle rules, included with Microsoft 365 plans | Microsoft 365 admin centre, Entra | — (enabler) | 0 | GA 1 May 2026 (`agent365ServiceDescription`) |
| Agent 365 premium for the 25 licensed sponsors' agents: policy templates, observability, Conditional Access for agents, Purview and Defender agent controls | Agent 365, Entra, Purview, Defender | — (enabler) | 1 | GA 1 May 2026; registry sync to AWS/Google, Defender runtime blocking and the Graph registry API are preview |
| Agent Builder in Microsoft 365 Copilot, creator use only (admin "Sharing" setting: No users) | Microsoft 365 Copilot | Low | 1 | GA (Oct 2024 for Copilot users, Feb 2025 for Copilot Chat users) |
| Agent Builder agents shared with teams and submitted to the org catalog | Microsoft 365 Copilot | Medium | 2 | GA; org-wide publishing needs admin approval in Agent Requests |
| Copilot Studio agents, knowledge only, in managed environments | Copilot Studio, Power Platform | Medium | 2 | GA; every active user of a managed environment needs a qualifying licence (Microsoft 365 Copilot qualifies) |
| Fabric data agents, consumed in Fabric or through the Fabric IQ Data MCP tool in Copilot Studio | Microsoft Fabric | Medium | 2 | Conflict: concept page says GA, release-status table says preview. Register: Watch |
| Copilot Studio agents with tools: connectors, MCP servers, prompts | Copilot Studio | High | 3 | GA; REST API tools and real-time connector knowledge are preview |
| Agent flows and Power Automate with AI Builder | Copilot Studio, Power Platform | High | 3 | GA; AI Builder credits end (no seeded credits from 1 Nov 2026) |
| Copilot Cowork | Microsoft 365 Copilot | High | 4 | GA 16 June 2026; needs a Copilot licence and a spending policy; Purview DLP for labelled files is GA, for sensitive-info types in prompts preview |
| Autonomous agents: event and recurrence triggers | Copilot Studio | High | 4 | GA; triggers run only under the maker's credentials |

Out of scope for now: pro-code agents (Foundry, custom frameworks), third-party agents, external-facing agents,
computer use in Copilot Studio (GA, but it acts with the maker's access by default and is not covered by the Copilot
licence's no-charge inclusion).

Dates that move the roadmap, from the research: unmanaged developer environments cannot be created from 15 Nov 2026
and are suspended from 15 Dec 2026; users without a qualifying licence are blocked in managed environments from
February 2027; Restricted SharePoint Search takes no new enablements from 31 July 2026.

## 5. Standards domains

| Domain | Group (business value) | What its standards must define |
| --- | --- | --- |
| Scope | Consistent governance | Agent types and platform boundaries in scope; who the licensed sponsors are and why; current practices and gaps reviewed against M365 Copilot scenarios |
| Governance | Consistent governance | Intake, risk review, approval and exception procedures, Power Platform environment strategy and data policies, lifecycle controls, spend limits, the maker-credential decision for autonomous agents |
| Identity | Controlled access | Which registry counts for each agent type (Entra Agent ID for Copilot Studio, the Microsoft 365 Agent Registry for Agent Builder), registry metadata and a required sponsor, identity and permission rules, periodic re-attestation of agent access |
| Ownership | Clear accountability | Business and technical owner responsibilities, approval authority by tier, ownership transfer and retirement procedures |
| Observability | Reviewable evidence | Minimum activity logs, monitoring measures, evidence retention, review cadence, incident escalation responsibilities |

The explorer page uses the four groups as its highlight groups; each group's business value is the item's callout.

## 6. Waves

Every gate names its domain so it maps straight onto a sequencer standard. Standards are cumulative.

| Wave | Name | Window | Capabilities | Gate (standards that must exist) |
| --- | --- | --- | --- | --- |
| 0 | Foundations and Agent 365 pilot | Now to Dec 2026 | Agent 365 foundational capabilities; agents still off for everyone else (Agent Builder "User access" and Copilot Studio authors group restricted) | Scope: in-scope capabilities signed off. Scope: existing agents inventoried (Agent Registry, Power Platform inventory). Scope: the 25 licensed sponsors named, and why. Governance: environment strategy decided before 15 Nov 2026 (default environment secured, environment routing on, developer environments managed). Ownership: platform owner and decision forum named |
| 1 | Personal agents | Q1 2027 | Agent 365 premium for the 25 pilot sponsors; Agent Builder, creator use only | Governance: intake and triage. Identity: every pilot agent has a licensed sponsor and appears in the Agent Registry before use. Ownership: business and technical owner per agent. Observability: Purview audit of Copilot interactions confirmed on |
| 2 | Shared agents | Q2 2027 | Shared Agent Builder agents; Copilot Studio knowledge agents; Fabric data agents | Scope: use-case catalogue with risk tiers. Governance: risk review by tier; approval and exception procedure; managed environments with sharing limits and a tenant data policy that classifies Copilot Studio connectors. Identity: registry metadata standard (Entra Agent ID for Copilot Studio, Agent Registry for Agent Builder); identity and permission rules (user authentication by default). Ownership: approval authority by tier. Observability: monitoring measures; evidence retention |
| 3 | Actions and flows | Q3 2027 | Copilot Studio tools (connectors, MCP, prompts); agent flows; Power Automate with AI Builder | Governance: lifecycle controls (promote, version, retire). Identity: agent access re-attested on a cadence (access-package expiry and sponsor attestation; Entra access reviews cannot target agents). Ownership: ownership transfer and retirement. Observability: review cadence and incident escalation |
| 4 | Autonomous | Q4 2027 or later | Copilot Cowork; autonomous triggers | Scope: autonomy boundaries. Governance: spend limits (Copilot credit policies, per-agent limits); maker-credential decision recorded (PPAC > Features > "Control maker credential options"). Observability: continuous evaluation of behaviour |

"DLP coverage of Copilot Cowork confirmed" is a test result, not a standard: it goes in the test plan (prompt 10) and
the preview parts of Cowork DLP sit on Hold in the register. Windows are illustrative.

## 7. Pages wanted

Fifteen pages. Build order: archetype pages and the register first, from the research; then each custom page through
`prompts/05-visualize-a-concept.md`, brief before code, pattern confirmed from the sourced rules.

| Page | Archetype or custom | The idea it must make obvious |
| --- | --- | --- |
| Adoption journey | journey | The phases from pilot to scale, and what closes each |
| Glossary | glossary | Every agent type in plain words for the risk team, plus the site's own words (wave, gate, standard), split by category |
| Standards domains | explorer | What each of the five domains must define, in four business-value groups |
| Capability sequencer | sequencer | Which capabilities open when, and what gates them |
| Which builder? | decision | Agent Builder, Copilot Studio, Fabric data agent or agent flow, by need. Pro-code is not an option; the page intro says it is out of scope for now. Copying from Agent Builder to Copilot Studio is a snapshot, not a sync |
| Agent lifecycle | flow | Request to retirement, and how it breaks |
| Risk tier simulator | custom (adapt `src/pages/RiskTier.jsx`) | How Contoso classifies an agent, and which reviews and approver each tier needs |
| Who needs an Agent 365 licence | custom (pattern 3, inheritance tree) | The licence binds to the agent's sponsor or owner; move an agent to an unlicensed sponsor and its premium protections fall away |
| Whose identity does the agent use? | custom (pattern 1, token on a path) | Copilot and Agent Builder run as the user; Copilot Studio tools choose user or maker authentication; triggers and computer use run as the maker; Fabric data agents honour row- and column-level security |
| Environment strategy | custom (pattern 5, buckets and stress tests) | Default, routed developer, sandbox and production environments; which data policy, sharing limit and licence each applies; what the 15 Nov 2026 change breaks |
| E5 to E7 | custom (pattern 13, meter) | US list prices read 5 Nov 2026: E5 60, Copilot 30, Agent 365 15, E7 99 USD per user per month; credits are extra in both. For 25 sponsors and for 350 users |
| PowerShell practice | practice | Read-only agent inventory and audit with Microsoft Graph PowerShell and the Power Platform modules |
| Power Platform CLI practice | practice | Read-only environment and agent inventory with `pac` |
| Graph practice | practice | Read-only agent inventory and audit queries as Microsoft Graph requests |
| Technology register | register | Status and review dates of everything the pathway relies on: product capabilities and the site's own stack |

## 8. Practice

Three practice pages, one per tool, each with its own data file and the prompt that tool really uses: `PS>` for
PowerShell (Microsoft Graph PowerShell, Microsoft Entra PowerShell, Exchange Online and the Power Platform admin
module), `$` for the Power Platform CLI (`pac`), and an empty prompt for Microsoft Graph, where the reader types the
request line such as `GET /v1.0/...`. All read-only inventory and audit queries. Every command comes from
`notes/research/inventory-commands.md`, where each one was matched to its reference page; no PowerShell cmdlet lists
Copilot Studio agents, so that level uses `pac copilot list`. The same commands feed the inventory method in prompt 09.

## 9. Documents

All written to `notes/` (git-ignored). Fact-check (03) and pre-mortem (14) run in a separate session.

- [ ] How it really works (prompt 06)
- [ ] Threats and controls (prompt 07)
- [ ] Licensing and cost: E5, E7, standalone Agent 365, 25 users and 350 (prompt 08)
- [ ] Current state and gaps, including partner-built agents (prompt 09)
- [ ] Pilot test plan for the 25 licences, including the Cowork DLP test (prompt 10)
- [ ] Evaluation plan for the first knowledge agents (prompt 11)
- [ ] Decision records: E7 versus standalone; registry; environment strategy (prompt 12)
- [ ] Strategy brief for the architecture review board and CISO (prompt 13)
- [ ] Pre-mortem of the strategy (prompt 14)
- [ ] Stakeholder briefs, FAQ and training plan per audience (prompt 15)
- [ ] Standards pack: one page per domain

## 10. Sources to trust

Microsoft Learn (Agent 365, Copilot Studio, Power Platform admin, Purview, Entra, Fabric), the Microsoft licensing
FAQs and product terms, Microsoft 365 message center and roadmap, the Microsoft 365 and Copilot Studio blogs.
Partner and community blogs only to find official pages, never as the source.

## 11. Constraints

- GA-only for recommendations; previews labelled and kept on Hold.
- Lab budget: $0 beyond licences already held.
- Must not appear on the site: anything from `notes/context.md`.
- Open questions from the research (section 4 of `notes/research.md`) stay off the site; a page says "not stated"
  rather than guessing.
