// Put each diagram into its scenario states, measure its labels and save a close-up.
// Usage (with `npm run preview` running):
//   node scripts/audit-diagrams.cjs http://localhost:4173/ shots/diagrams
// Fails (exit 1) if any label renders under 11px, labels overlap, a label leaves the
// drawing, or the diagram needs sideways scrolling. Needs Playwright, like shoot.cjs.
const { chromium } = require('playwright');
const fs = require('fs');

const radio = (name) => async (page) => page.getByRole('radio', { name, exact: true }).click();
const toggle = (name) => async (page) => page.getByRole('switch', { name }).click();
const press = (name) => async (page) => page.getByRole('button', { name }).first().click();

// page id -> states; each state is a list of actions applied in order to a fresh page,
// or { nth, actions } to check the nth diagram on a page that has several.
const plan = {
  diagrams: {
    'identity-default': { nth: 0, actions: [] },
    'identity-sponsor': { nth: 0, actions: [press(/^Sponsor:/)] },
    'connectors-step-1': { nth: 1, actions: [] },
    'connectors-step-3': { nth: 1, actions: [press('Next step'), press('Next step')] },
    'layers-default': { nth: 2, actions: [] },
    'layers-disputed': { nth: 2, actions: [press(/^Sources disagree:/)] },
  },
  glossary: { 'identity-diagram-open': [press('Show diagram')] },
  domains: { default: [] },
  lifecycle: { normal: [], 'changed-after-approval': [radio('Changed after approval')] },
  'agent365-licence': {
    default: [],
    'moved-to-priya': [radio(/^Priya/)],
    'tom-leaves': [toggle(/Tom leaves/)],
    'tom-leaves-ana-unlicensed': [toggle(/Tom leaves/), toggle(/Ana holds/)],
    'all-under-ana': [radio(/^Ana/), radio('Loan FAQ agent'), radio(/^Ana/)],
  },
  'whose-identity': {
    'author-auth-exposed': [],
    'builder-stopped': [radio('Agent Builder')],
    'trigger-exposed': [radio('Autonomous trigger')],
    'fabric-returned': [radio('Fabric data agent'), radio('Can open it')],
    'cowork-stopped': [radio('Copilot Cowork')],
  },
  'e5-to-e7': { default: [], 'all-350': [radio('All 350')], 'e7-with-pack': [radio('E7'), toggle(/credit capacity pack/)] },
};

const measure = (el) => {
  const r = el.getBoundingClientRect();
  const vb = el.viewBox.baseVal;
  const scale = r.width / vb.width;
  const boxes = [...el.querySelectorAll('text')]
    .filter((t) => t.textContent.trim())
    .map((t) => ({ s: t.textContent.trim(), b: t.getBoundingClientRect(), px: parseFloat(getComputedStyle(t).fontSize) * scale }));
  const overlaps = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i].b;
      const b = boxes[j].b;
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      // Stacked lines of one label touch by a pixel or two; only real collisions count.
      if (w > 3 && h > 5) overlaps.push(`"${boxes[i].s}" x "${boxes[j].s}"`);
    }
  }
  const parent = el.parentElement;
  return {
    labels: boxes.length,
    minPx: +Math.min(...boxes.map((x) => x.px)).toFixed(1),
    small: boxes.filter((x) => x.px < 10.95).map((x) => x.s),
    long: boxes.filter((x) => x.s.split(/\s+/).length > 4).map((x) => x.s),
    outside: boxes.filter((x) => x.b.left < r.left - 1 || x.b.right > r.right + 1 || x.b.top < r.top - 1 || x.b.bottom > r.bottom + 1).map((x) => x.s),
    overlaps,
    scrolls: parent.scrollWidth > parent.clientWidth + 1,
  };
};

(async () => {
  const [base = 'http://localhost:4173/', out = 'shots/diagrams'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  let failures = 0;
  for (const width of [1280, 768, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: width === 390 ? 'dark' : 'light', deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    for (const [id, states] of Object.entries(plan)) {
      for (const [state, def] of Object.entries(states)) {
        const { nth = 0, actions } = Array.isArray(def) ? { actions: def } : def;
        await page.goto(`${base}#${id}`, { waitUntil: 'networkidle' });
        await page.reload({ waitUntil: 'networkidle' });
        for (const act of actions) await act(page);
        await page.waitForTimeout(id === 'lifecycle' ? 5600 : 2600);
        const svg = page.locator('article svg[role="img"]').nth(nth);
        const m = await svg.evaluate(measure);
        await svg.scrollIntoViewIfNeeded();
        await svg.screenshot({ path: `${out}/${id}--${state}--${width}.png` });
        const bad = m.small.length || m.outside.length || m.overlaps.length || m.scrolls;
        if (bad) failures += 1;
        console.log(`${bad ? 'FAIL' : 'ok  '} ${id} / ${state} @${width}: ${m.labels} labels, min ${m.minPx}px, long ${m.long.length}${m.scrolls ? ', scrolls sideways' : ''}`);
        if (m.small.length) console.log(`       under 11px: ${m.small.join(' | ')}`);
        if (m.outside.length) console.log(`       outside the drawing: ${m.outside.join(' | ')}`);
        if (m.overlaps.length) console.log(`       overlapping: ${m.overlaps.join(' | ')}`);
        if (m.long.length) console.log(`       over four words: ${m.long.join(' | ')}`);
      }
    }
    await ctx.close();
  }
  await browser.close();
  console.log(failures ? `${failures} state(s) failed` : 'all states pass');
  process.exit(failures ? 1 : 0);
})();
