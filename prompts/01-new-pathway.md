# Prompt: start a new pathway

Paste into a new coding session opened on this repo (or a copy of it). Replace the bracketed parts.

---

You're building an interactive learning and adoption pathway for **[TECHNOLOGY]** with this repo, the Pathway Kit.

Read these first, in order: `CLAUDE.md`, `docs/archetypes.md`, `PATHWAY_SPEC.md`, then skim `src/content/` and
`src/pages/RiskTier.jsx` to see a filled-in example of every archetype.

Then work in this order and show me the result of each step before moving on:

1. **Spec.** Read `PATHWAY_SPEC.md`. Ask me up to five questions about anything blank or contradictory, then update the
   spec with my answers. Don't start research until the spec has capabilities, domains, waves and hosting filled in.
2. **Research.** For every capability and every claim the pages will make, open current primary sources (vendor docs,
   release notes, licensing pages, admin docs). Record each source in `src/content/sources.js`. Record GA or preview
   status and the date. List what you couldn't verify as open questions instead of guessing.
3. **Page plan.** Propose 10–20 pages: for each, the archetype (or custom), the one idea it must make obvious, and the
   sources it rests on. Prefer archetypes; propose a custom simulator only for the hardest ideas, naming its pattern
   from `docs/visual-patterns.md`. Build each custom simulator with `prompts/05-visualize-a-concept.md`.
4. **Build.** Replace the kit's sample content: `pathway.config.js`, `registry.js`, one data file per archetype page,
   custom pages copied from `RiskTier.jsx`. Keep the kit's sample files only if I ask.
5. **Check.** `npm run build`, then `npm run shots -- 390 dark all` and `npm run shots -- 1280 light all` with the
   preview running. Look at the screenshots of every page and fix overflow, overlaps and console errors.
6. **Fact-check.** Start an independent reviewer with `prompts/03-fact-check.md` and apply its findings.
7. **Hand-off.** Summarise what's built, what's illustrative, the open questions, and how to publish.

Rules: follow `CLAUDE.md` exactly (accuracy, writing, design, definition of done). The sequencer is the heart of the
site: capabilities and the standards that gate them must be sequenced together, wave by wave.
