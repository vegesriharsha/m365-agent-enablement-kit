// Screenshot pages and report horizontal overflow and console errors.
// Usage (with `npm run preview` running in another terminal):
//   node scripts/shoot.cjs http://localhost:4173/ shots 390 dark home method sequencer
//   node scripts/shoot.cjs http://localhost:4173/ shots 1280 light all
// Needs Playwright: npm i -D playwright && npx playwright install chromium
const { chromium } = require('playwright');
(async () => {
  const [base, out, width, scheme, ...rest] = process.argv.slice(2);
  require('fs').mkdirSync(out, { recursive: true });
  let hashes = rest;
  if (rest.length === 1 && rest[0] === 'all') {
    const reg = require('fs').readFileSync('src/content/registry.js', 'utf8');
    hashes = [...reg.matchAll(/id: '([a-z0-9-]+)'/g)].map((m) => m[1]);
  }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errors.push(m.text()); });
  for (const h of hashes) {
    await page.goto(`${base}#${h}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(2600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    await page.screenshot({ path: `${out}/${h}-${width}-${scheme}.png`, fullPage: true });
    console.log(h, 'overflowX=', overflow);
  }
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
