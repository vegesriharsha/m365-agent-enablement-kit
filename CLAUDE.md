# Pathway Kit — instructions for coding sessions

This repo builds an interactive **pathway** for one technology: a static React site of explainers, simulators,
sequencers and dashboards, published to GitHub Pages. Most pages are **archetypes** filled with data from
`src/content/`; a few are **custom pages** with their own code. Read this file before changing anything.

## Tech stack (follow it; don't change it without asking)

| Layer | Use | Version (pinned in package.json) |
| --- | --- | --- |
| Runtime for builds | Node.js | 22.12 or later (CI uses 22) |
| UI | React, function components and hooks only | react and react-dom 19.3.1 |
| Build and dev server | Vite with `@vitejs/plugin-react` | vite 8.3.4, plugin 6.1.2 |
| Styling | Tailwind CSS v4 through `@tailwindcss/vite`; tokens in `src/index.css` via `@theme inline` | tailwindcss 4.3.3 |
| Icons | lucide-react, imported one icon at a time | 1.59.0 |
| Language | JavaScript (ES modules, `.js` / `.jsx`) | — |
| Fonts | Google Fonts link in `index.html`: Cormorant Garamond, Geist, JetBrains Mono | — |
| Checks | Playwright, via `scripts/shoot.cjs` (dev-time only, not a site dependency) | current |
| Publishing | GitHub Actions to GitHub Pages | checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5 |

Rules the stack implies:

- **No new runtime dependencies without asking.** No router (hash routing is in `App.jsx`), no state library, no UI
  kit, no chart or diagram library, no animation library, no CSS-in-JS. Charts and diagrams are hand-built SVG
  using the tokens; motion uses `useProgress`.
- **No TypeScript conversion**, no `tailwind.config.js` (Tailwind v4 is configured in CSS), no PostCSS config, no
  server code. The site is static: no backend, no API keys, no analytics, no cookies, no calls to external services
  at runtime other than Google Fonts.
- **Keep `base: './'`** in `vite.config.js` and hash links (`#page-id`), so the site works under any GitHub Pages
  path.
- **Pin exact versions** (no `^` or `~`) and commit `package-lock.json`. Upgrades are their own pull request: check
  the release notes, update the version here and in `src/content/register.js`, build, run the screenshot checks.
- **Code style**: 2-space indent, single quotes, semicolons, trailing commas, one component per file, data in
  `src/content/` rather than inside components. Comments say why, not what.

## Commands

```bash
npm ci              # install exactly what package-lock.json says
npm run dev         # http://localhost:5173, rebuilds on save
npm run build       # static site in dist/
npm run preview     # serve dist/ at http://localhost:4173
npm run shots -- 390 dark all     # screenshots + overflow + console-error check (preview must be running)
npm run shots -- 1280 light all
```

`npm run shots` needs Playwright (`npm i -D playwright && npx playwright install chromium`) unless it is already installed.

## Where things live

| Path | What it holds |
| --- | --- |
| `src/pathway.config.js` | Site name, edition, fictional-org disclaimer, home page text |
| `src/content/registry.js` | Every page: id, title, nav group, archetype + data, or a custom component |
| `src/content/*.js` | One data file per archetype page |
| `src/content/sources.js` | Every source a page cites, and the site-wide `VERIFIED` date |
| `src/archetypes/` | The nine data-driven page types (see `docs/archetypes.md`) |
| `src/pages/` | Custom pages; `RiskTier.jsx` is the template |
| `src/components/ui.jsx` | Shared parts: PageHeader, Section, Insight, Callout, Pill, Segmented, Toggle, Slider, Select, TextInput, Button, Panel, Code, Sources |
| `src/components/PageShell.jsx` | Header + sources wrapper every page uses |
| `src/lib/hooks.js` | `useProgress` (animation), `pointOnPolyline`, `useLocalState`, `useReducedMotion`, formatters |
| `src/index.css` | Design tokens (light and dark) and base styles |
| `PATHWAY_SPEC.md` | The spec for this pathway. Fill it in before building. |
| `prompts/` | Prompts for the whole architect workflow: learn, understand, test, decide, challenge, share, refresh. Index in `prompts/README.md` |
| `notes/` | Working output from the prompts (git-ignored; keep internal details here, never in the site) |
| `docs/visual-patterns.md` | Fifteen proven visual patterns, when to use each, and reference code |
| `examples/landing-zone-explorer/` | Read-only reference simulators from Landing Zone Explorer (not built) |

## Adding a page

1. Decide the archetype with the **Choose an archetype** page or `docs/archetypes.md`. Prefer an archetype; write a
   custom page only when the idea needs its own rules (a simulator, a calculator, a bespoke diagram).
2. Archetype page: add `src/content/<name>.js` following the schema in `docs/archetypes.md`, import it in
   `registry.js`, add `{ id, title, kind, archetype, data, blurb }`.
3. Custom page: copy `src/pages/RiskTier.jsx`, keep `PageShell`, register it with `component: YourPage`. For a concept
   that needs a dynamic visual, follow `prompts/05-visualize-a-concept.md` and pick a pattern from
   `docs/visual-patterns.md` first.
4. Every page: an `Insight` panel that explains the current state in plain words, sources listed by key, a verified date.

## Accuracy rules (non-negotiable)

- **Look it up.** Anything that describes a product today (names, licences, limits, prices, GA or preview status,
  dates, defaults, setting names, module inputs) is checked against a primary source in this session: vendor docs,
  official blogs, release notes, the repo itself. A search snippet is not a source; open the page.
- **Cite it.** Add the source to `sources.js` and list its key on the page. Update the verified date when you re-check.
- **GA-only.** Anything in preview, experimental, beta or without a support statement is labelled as such and sits on
  Hold in the register. Never present a preview feature as the recommended path.
- **No invention.** Don't invent numbers, product behaviour, error text or setting names. If you can't verify it,
  leave it out or label it *illustrative*. Code shown on a page is labelled *illustrative* unless you ran it.
- **Fictional organisation on public sites.** Examples use Contoso Bank. No real company names, internal system names,
  tenant details, people, IP plans or policies in this repo if it is public.
- **Prices** come from the vendor price list or API, with region and date stated, and are labelled as list prices.

## Writing rules

- First sentence of a page, section or panel is the point. No “this page explains”.
- Plain words, sentences under about 25 words, sentence case headings, no marketing adjectives, no emoji.
- Numbers with units; dates as 1 Nov 2026 in prose, YYYY-MM-DD in data.
- Name the thing: the setting, the role, the command. Don't say “configure appropriately”.

## Design rules (house style: Quiet Boardroom)

- Tokens only, from `src/index.css`: paper, surface, ink, muted, subtle, navy (accent), gold (sparingly), rule, faint,
  callout, good, bad, and the `seq-1..3` chart ramp. Never hard-code hex in components. Dark mode comes from the tokens.
- Type: Cormorant Garamond for display and decks, Geist for body and labels, JetBrains Mono for code and numbers.
- Hairline rules, no shadows, no gradients, corner radius at most 2px, generous whitespace.
- Status colours (good, bad) only for state, always with a word or icon, never colour alone.
- Charts: one axis, a single-hue ramp for ordered categories, a legend when there are two or more series, hover values.
- Layout: content max 1080px; 16px side gutter on phones; **no horizontal page scroll** at 390px. Wide SVGs sit inside
  `overflow-x-auto` with a `min-w-[…]`.
- Motion: animations use `useProgress`, which respects reduced-motion. Nothing animates forever.
- Browser storage only through `useLocalState` (already try/catch-guarded) and only for per-viewer conveniences.

## Definition of done for any change

1. `npm run build` passes.
2. `npm run shots -- 390 dark all` and `npm run shots -- 1280 light all` report `overflowX= false` and `errors: none`.
3. You looked at the screenshots of the pages you changed.
4. New facts are cited and dated; illustrative content is labelled.
5. For a release: an independent fact-check (`prompts/03-fact-check.md`) has been run and its findings applied.

## Publishing

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`. In the repository,
Settings → Pages → Source must be **GitHub Actions**. Hash routing (`#page-id`) and relative asset paths mean it
works at `https://<user>.github.io/<repo>/` with no extra configuration.
