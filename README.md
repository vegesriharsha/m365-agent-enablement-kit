# Pathway Kit

A reusable kit for building interactive **technology pathways**: static sites that teach a technology and sequence its
adoption, with simulators, sequencers, flows, practice levels and a review register. It was extracted from
*Landing Zone Explorer* (Azure landing zones) so the next pathway starts from data, not from scratch.

The sample content documents the kit itself: open any page to see what its archetype can do.

## What's in it

- **A fixed tech stack**: React 19, Vite 8, Tailwind CSS 4 and lucide-react, pinned, static, no backend. The rules for
  coding agents are in `CLAUDE.md` under *Tech stack*.
- **Nine archetypes** driven by data files: journey, glossary, explorer, sequencer, decision, flow, practice, register,
  plus the home index. See `docs/archetypes.md`.
- **A custom page template** (`src/pages/RiskTier.jsx`) for ideas that need their own simulator.
- **A house style** (Quiet Boardroom) as CSS tokens with a dark theme, and shared UI parts.
- **Guardrails for accuracy**: sources by key on every page, verified dates, a register with review cadences,
  GA-only labelling, a fictional organisation for public sites.
- **Session tooling**: `CLAUDE.md` for coding sessions, `PATHWAY_SPEC.md` to fill in first, prompts for starting,
  adding simulators, visualizing a concept, fact-checking and refreshing, and a screenshot checker.
- **Architect prompts**: fifteen prompts covering how it works, threats and controls, licensing and cost, current
  state, tests, evaluations, decision records, strategy, pre-mortem, stakeholder briefs and refresh
  (`prompts/README.md`).
- **Visual patterns**: fifteen proven ways to make a concept move (`docs/visual-patterns.md`), with reference code
  from Landing Zone Explorer in `examples/`.

## Start a new pathway

1. Copy this repo (use it as a GitHub template, or copy the folder).
2. Fill in `PATHWAY_SPEC.md`.
3. Open a coding session on the copy and paste `prompts/01-new-pathway.md`.

## Run it

Needs Node.js 22.12 or later.

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
npm run preview  # http://localhost:4173
```

## Publish to GitHub Pages

Push to `main` on GitHub, then in Settings → Pages set **Source** to **GitHub Actions**. The workflow in
`.github/workflows/deploy.yml` builds and deploys on every push.

## Change log

| Date | Change |
| --- | --- |
| 6 Nov 2026 | Independent fact-check applied: about thirty statements reworded or re-cited, fourteen moved source URLs updated, verified date set to 6 Nov 2026 |
| 6 Nov 2026 | Added four custom simulators: Agent 365 licence, identity on the path, environment strategy, E5 to E7; adapted the risk tier simulator |
| 5 Nov 2026 | Built the agents-in-Microsoft-365 pathway for Contoso Bank: spec, 212 sources, nine archetype pages and the register |
| 4 Nov 2026 | Added prompts 06–15 for learning, testing, deciding and challenging, and the prompts index |
| 4 Nov 2026 | Added the tech-stack rules for coding agents to CLAUDE.md |
| 4 Nov 2026 | Added the concept-visualization prompt, the visual patterns catalogue and reference simulators |
| 4 Nov 2026 | First version, extracted from Landing Zone Explorer rev 2026.11 |
