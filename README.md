# Agents in Microsoft 365: an adoption pathway

An interactive site that explains how agents work across Microsoft 365 Copilot, Copilot Studio, Microsoft Fabric and
Copilot Cowork, how Microsoft Agent 365 governs them, and the order in which to enable them. It follows a fictional
organisation, Contoso Bank, as it opens agents wave by wave, each wave gated by the standards it needs.

**Live site:** https://vegesriharsha.github.io/m365-agent-enablement-kit/

Contoso Bank is fictional. Nothing here describes a real organisation's environment, licences or people. This is an
independent learning resource, not Microsoft documentation and not licensing advice.

## What's on the site

| Group | Page | What you do there |
| --- | --- | --- |
| Start | Adoption journey | Step through six phases from preparation to scale and tick each gate's criteria |
| Start | Glossary | Look up 40 agent, identity, governance and licensing terms, with a bank analogy |
| Plan | Standards domains | See what scope, governance, identity, ownership and observability must define |
| Plan | Capability sequencer | Tick standards and watch which of ten capabilities each of five waves can open |
| Plan | Technology register | Filter every capability by status and move the date to see what falls due for review |
| Decide | Which builder? | Answer four questions to rank Agent Builder, Copilot Studio, a Fabric data agent and an agent flow |
| Decide | Risk tier simulator | Describe an agent and see its tier, reviews, approver and re-attestation cadence |
| Decide | Who needs an Agent 365 licence | Move an agent between sponsors and watch its premium protections follow the licence |
| Decide | Whose identity does the agent use? | Send a request through six agent types and see where the identity check stops it |
| Decide | Environment strategy | Sort makers' work into four Power Platform environments and stress-test the layout |
| Decide | E5 to E7 | Compare the monthly list cost of five licence shapes against a budget line |
| Operate | Agent lifecycle | Follow one agent from request to retirement, then break it four ways |
| Practice | PowerShell, Power Platform CLI, Graph | Type 23 read-only inventory and audit commands, with hints |

## How far to trust it

- **Sources.** Every page lists the Microsoft pages it rests on. All 205 of them are in `src/content/sources.js`.
- **Dates.** Facts were last verified on 6 Nov 2026, after an independent fact-check. Each page shows its date.
- **Status.** Recommendations use generally available features only. Preview and beta features are labelled and sit
  on Hold in the register.
- **Prices.** US list prices per user per month, read on 5 Nov 2026 from Microsoft pages that carry no date of their
  own. Your agreement sets your real prices.
- **Invented content.** Contoso's numbers and names, risk weights, decision scores and cost scenarios are labelled
  illustrative on the page.
- **Open questions.** Where Microsoft's pages disagree or are silent, the site says "not stated" instead of guessing.
  Two examples: which Agent 365 features are included without a licence, and whether Fabric data agents are generally
  available.

## Run it locally

Needs Node.js 22.12 or later.

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
npm run preview  # http://localhost:4173
```

The site is static: React, Vite and Tailwind CSS, with no backend, no analytics and no cookies.

## Publishing

Every push to `main` builds and deploys the site to GitHub Pages through `.github/workflows/deploy.yml`.

## Where things live

| Path | What it holds |
| --- | --- |
| `src/content/` | One data file per page, the page registry, and the sources |
| `src/pages/` | The five simulators with their own code |
| `src/archetypes/`, `src/components/` | The shared page types and UI parts |
| `PATHWAY_SPEC.md` | The scope, waves, gates and pages this site was built to |
| `CLAUDE.md`, `docs/`, `prompts/` | The rules, page-type reference and prompts used to build and maintain the site |

## Keeping it current

Agent products change monthly. Review the register entries that fall due each month, re-check their sources, update
the verified dates, and add a line to the change log. `prompts/04-refresh.md` describes the routine, and
`prompts/03-fact-check.md` the independent review to run before a larger update.

## Change log

| Date | Change |
| --- | --- |
| 11 Nov 2026 | Published to GitHub Pages; page title, one home-page blurb and this README corrected |
| 6 Nov 2026 | Independent fact-check applied: about thirty statements reworded or re-cited, fourteen moved source URLs updated, verified date set to 6 Nov 2026 |
| 6 Nov 2026 | Added four custom simulators: Agent 365 licence, identity on the path, environment strategy, E5 to E7; adapted the risk tier simulator |
| 5 Nov 2026 | Built the site for Contoso Bank: spec, sources, nine data-driven pages and the register |
