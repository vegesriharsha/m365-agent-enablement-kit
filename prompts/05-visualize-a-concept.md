# Prompt: turn a concept into a dynamic visualization

Use this when a concept is hard to grasp from text: a mechanism, a sequence, a trade-off, a failure mode. It produces
a custom page with an interactive visual, built and checked. Fill in the brackets; leave a bracket empty and the
session will ask.

---

Build an interactive visualization that makes this concept click: **[CONCEPT, e.g. “why a Copilot Studio agent
using maker credentials can expose data the user shouldn't see”]**.

- **Who it's for:** [AUDIENCE, e.g. risk team, makers, platform engineers]
- **The misconception it should fix:** [WHAT PEOPLE WRONGLY BELIEVE TODAY]
- **The moment it should click:** [ONE SENTENCE: “When I change X, I see Y, because Z.”]
- **Sources the rules must follow:** [VENDOR DOCS, OR “find them”]

Read `CLAUDE.md`, `docs/visual-patterns.md` and `src/pages/RiskTier.jsx` first. Then work in these steps and show me
steps 1 to 3 before writing code.

1. **The mechanism.** State the concept as three to six rules the visual will obey, each with its source URL.
   Rules you can't source are left out or marked illustrative. List the edge cases and failure states the rules
   produce.
2. **The pattern.** Pick one pattern from `docs/visual-patterns.md` (or propose a new one) and say why its shape
   matches the concept's shape. Name the reference file you'll learn from. If two patterns fit, say which you
   rejected and why.
3. **The interaction design.**
   - Controls: at most four, each one a variable in the rules. Defaults show the interesting case.
   - What moves or changes when each control changes, and what animates (only things that move in reality).
   - At least one failure state the reader can trigger on purpose.
   - The **state → Insight table**: every meaningful combination of controls, and the one or two plain sentences
     the Insight panel shows for it. This table is the teaching; write it before any code.
   - Three “try this” scenarios that walk a reader to the click moment.
4. **Build** a custom page from `RiskTier.jsx`: `PageShell`, controls above the visual, the Insight panel, a short
   “What to take away” list of three or four points, `Illustrative` labels on invented values, sources by key.
   SVG for diagrams (tokens only, no hex), `useProgress` for motion, `useLocalState` only for conveniences.
   Register it in `src/content/registry.js` with `component`.
5. **Check.** `npm run build`; with the preview running, screenshot the page at 390 dark and 1280 light, plus one
   screenshot per “try this” scenario (`scripts/shoot.cjs` or a short Playwright script that clicks the controls).
   Look at every screenshot: overlapping labels, text under 11px, lines through text, controls off-screen, colour as
   the only signal. Fix and re-shoot.
6. **Self-review as a sceptical expert.** Would someone who knows this product say the visual is right? Would a
   newcomer get the click moment from the three scenarios alone? Change what fails either test, then summarise
   what you built, what's illustrative and what you couldn't verify.
