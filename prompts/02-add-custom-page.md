# Prompt: add a custom simulator

---

Add a custom page to this pathway: **[IDEA THE PAGE MUST MAKE OBVIOUS]**.

1. Read `CLAUDE.md` and `src/pages/RiskTier.jsx`.
2. Check whether an archetype in `docs/archetypes.md` can show this idea with data alone. If it can, tell me and use it.
3. Otherwise, write a brief first: who reads it, what they change, what they should notice, and the rules the
   simulator follows, each rule with its source. Show me the brief before writing code.
4. Build it from `RiskTier.jsx`: `PageShell`, controls above results, an `Insight` that explains the current state,
   `Illustrative` on anything invented, sources by key. Register it in `registry.js` with `component`.
5. Run the build and the screenshot checks at 390 dark and 1280 light; look at the screenshots and fix what's wrong.
