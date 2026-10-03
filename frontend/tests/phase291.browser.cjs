const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright'), { startStack } = require('./test-stack.cjs');
const frontend = path.resolve(__dirname, '..'), output = process.env.KAUSHALIQ_TEST_OUTPUT ? path.resolve(process.env.KAUSHALIQ_TEST_OUTPUT) : path.resolve(frontend, '../docs/phase-2.9.1/verification');
fs.mkdirSync(output, { recursive: true });
let stack, browser; const checks = [], screenshots = [], errors = [];
function pass(name) { checks.push(name); console.log('PASS ' + name); }
async function ready(page) {
  await page.locator('[data-snapshot-state="ready"]').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.hero-snapshot-card [data-countup-state="settled"]').length === 3);
}
async function capture(page, file) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: path.join(output, file), fullPage: true, animations: 'disabled' }); screenshots.push(file); }
(async () => { try {
  stack = await startStack(frontend, { emailDelivery: false }); browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' }), page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const api = `http://127.0.0.1:${stack.apiPort}/api/v1/intelligence/demand`;
  const actual = await (await fetch(api + '?geography_id=in&metric=active_vacancies')).json(), coverage = await (await fetch(api + '/coverage')).json();
  const observation = actual.items[0]; assert.equal(observation.value, 4005028); assert.equal(actual.version, coverage.version);
  const request = '**/api/v1/intelligence/demand?*';
  let release; const gate = new Promise(resolve => { release = resolve; });
  await page.route(request, async route => { await gate; await route.continue(); });
  await page.goto(stack.base, { waitUntil: 'domcontentloaded' }); await page.locator('[data-snapshot-state="loading"]').waitFor();
  assert.equal(await page.locator('.hero-snapshot-card').getAttribute('aria-busy'), 'true'); assert.ok(await page.locator('.hero-snapshot-card .skeleton').count() >= 6);
  assert.equal(await page.locator('[data-hero-vacancies]').count(), 0); await capture(page, 'loading-dark-en-1440.png'); release(); await ready(page); await page.unroute(request);
  pass('Skeleton loading is theme-aware, accessible and contains no substituted metric');
  assert.equal(await page.locator('[data-hero-vacancies] [data-countup-value]').innerText(), new Intl.NumberFormat('en-GB').format(observation.value));
  const regions = new Set(coverage.options.geographies.filter(r => ['state', 'ut'].includes(r.geography_level)).map(r => r.geography_id)).size;
  assert.equal(await page.locator('[data-hero-regions] [data-countup-value]').innerText(), String(regions)); assert.equal(await page.locator('[data-hero-records] [data-countup-value]').innerText(), String(coverage.quality.published_records));
  assert.match(await page.locator('.hero-snapshot-provenance').innerText(), /Observed 14 Jul 2025/); assert.match(await page.locator('.hero-snapshot-provenance').innerText(), /Published 24 Jul 2025/);
  assert.match(await page.locator('.home-hero').innerText(), /Not a live feed/); assert.equal(await page.locator('.hero-source-track ul').first().locator('li').count(), 4);
  pass('National vacancy stock, matched geographies and record count match the verified APIs with both dates and historical context');
  const evidence = page.locator('.hero-evidence-button'); await evidence.focus(); assert.notEqual(await evidence.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
  await page.keyboard.press('Enter'); await page.locator('.evidence-dialog').waitFor(); assert.match(await page.locator('.evidence-details').innerText(), /NCS|National Career Service/);
  assert.match(await page.locator('.evidence-details').innerText(), new RegExp(observation.evidence.raw_sha256)); await page.screenshot({ path: path.join(output, 'evidence-dark-en-1440.png'), animations: 'disabled' }); screenshots.push('evidence-dark-en-1440.png');
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); assert.equal(await page.locator('.evidence-dialog').evaluate(el => el.contains(document.activeElement)), true); }
  await page.keyboard.press('Escape'); assert.equal(await evidence.evaluate(el => el === document.activeElement), true);
  pass('Shared evidence, provenance hash, keyboard containment, Escape and focus restoration work on the public hero');
  await page.getByRole('button', { name: 'Pause source movement', exact: true }).click(); assert.equal(await page.locator('.hero-source-track').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
  await page.getByRole('button', { name: 'Resume source movement', exact: true }).click();
  await page.locator('.home-hero-actions').getByRole('link', { name: 'Explore Intelligence', exact: true }).click(); await page.waitForURL(stack.base + '/intelligence'); await page.goBack(); await ready(page);
  await page.locator('.home-hero-actions').getByRole('link', { name: 'View Evidence', exact: true }).click(); await page.waitForURL(stack.base + '/demand'); await page.locator('.demand-native strong').waitFor(); await page.goBack(); await ready(page);
  pass('CTA destinations and browser history reuse existing public intelligence routes; source marquee can be paused');
  await page.evaluate(() => window.__heroSentinel = 42); await page.getByRole('button', { name: 'Language: English', exact: true }).click(); await page.getByRole('menuitemradio', { name: 'हिन्दी', exact: true }).click();
  assert.match(await page.locator('h1').innerText(), /भारत का श्रम बाज़ार/); assert.match(await page.locator('.hero-snapshot-card').innerText(), /सक्रिय रिक्तियाँ/); assert.equal(await page.evaluate(() => window.__heroSentinel), 42);
  await page.reload(); await ready(page); assert.equal(await page.locator('html').getAttribute('lang'), 'hi'); await page.getByRole('button', { name: 'भाषा: हिन्दी', exact: true }).click(); await page.getByRole('menuitemradio', { name: 'English', exact: true }).click();
  assert.match(await page.locator('h1').innerText(), /India’s Labour Market/); pass('English-Hindi-English updates the hero immediately and persists on refresh');
  for (const width of [1440, 1280, 1024, 768, 390]) for (const theme of ['dark', 'light']) for (const locale of ['en-IN', 'hi-IN']) {
    await page.setViewportSize({ width, height: 1000 }); await page.evaluate(({ theme, locale }) => { localStorage.setItem('kaushaliq.theme.v1', theme); localStorage.setItem('kaushaliq.locale.v1', locale); }, { theme, locale });
    await page.goto(stack.base); await ready(page); await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${theme}/${locale}`);
    assert.equal(await page.locator('.hero-image').evaluate(el => el.complete && el.naturalWidth > 0), true);
    assert.ok((await page.locator('.hero-image').getAttribute('src')).includes(`india-workforce-${theme}`));
    for (const selector of ['.hero-snapshot-card', '.home-hero-actions', '[data-hero-vacancies]']) assert.equal(await page.locator(selector).evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }), true, selector);
    await capture(page, `hero-${theme}-${locale}-${width}.png`);
  }
  pass('20 screenshots cover five widths, both themes/languages; images load, metrics and CTAs fit without page overflow');
  await page.evaluate(() => { localStorage.setItem('kaushaliq.theme.v1', 'system'); localStorage.setItem('kaushaliq.locale.v1', 'en-IN'); });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' }); await page.goto(stack.base); await ready(page);
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light'); assert.equal(await page.locator('.home-hero-copy').evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.equal(await page.locator('.hero-source-track').evaluate(el => getComputedStyle(el).animationName), 'none'); assert.equal(await page.locator('.hero-source-duplicate').isVisible(), false);
  await page.emulateMedia({ colorScheme: 'dark' }); await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  assert.ok((await page.locator('.hero-image').getAttribute('src')).includes('india-workforce-dark')); pass('System appearance selects the matching image; reduced motion uses a static wrapped source row');
  await page.route(request, route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })); await page.reload(); await page.locator('[data-snapshot-state="error"]').waitFor();
  assert.equal(await page.locator('[data-hero-vacancies], .hero-source-card').count(), 0); await capture(page, 'api-error-dark-en-390.png'); await page.unroute(request); await page.getByRole('button', { name: 'Try again', exact: true }).click(); await ready(page);
  await page.route(request, route => route.abort()); await page.reload(); await page.locator('[data-snapshot-state="error"]').waitFor(); await page.unroute(request);
  pass('Provider/API and network failures are explicit, remove numbers and source claims, and support retry without simulation');
  await page.route(request, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...actual, items: [], total: 0, status: 'UNAVAILABLE' }) })); await page.reload(); await page.locator('[data-snapshot-state="unavailable"]').waitFor();
  assert.equal(await page.locator('[data-hero-vacancies]').count(), 0); await capture(page, 'unavailable-dark-en-390.png'); await page.unroute(request);
  await page.route('**/api/v1/intelligence/demand/coverage', async route => { const response = await route.fetch(), json = await response.json(); json.version = 'different-publication'; await route.fulfill({ response, json }); });
  await page.reload(); await page.locator('[data-snapshot-state="error"]').waitFor(); await page.unroute('**/api/v1/intelligence/demand/coverage');
  await page.route('**/api/v1/intelligence/demand/coverage', async route => { const response = await route.fetch(), json = await response.json(); json.quality.published_records = 0; json.quality.valid_records = 0; json.quality.warning_records = 0; await route.fulfill({ response, json }); });
  await page.reload(); await page.locator('[data-snapshot-state="error"]').waitFor(); await page.unroute('**/api/v1/intelligence/demand/coverage');
  await page.route(request, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...actual, items: [{ ...observation, evidence: { ...observation.evidence, raw_sha256: '0'.repeat(64) } }] }) }));
  await page.reload(); await page.locator('[data-snapshot-state="error"]').waitFor(); await page.unroute(request);
  pass('Unavailable observations, inconsistent coverage, mixed publication versions and unbound provenance fail closed, never zero/sample');
  await page.route('**/api/v1/sources', async route => { const response = await route.fetch(), json = await response.json(); json.items = json.items.map(s => s.source_id === 'nic-2008' ? { ...s, connected: false } : s); await route.fulfill({ response, json }); });
  await page.reload(); await ready(page); assert.equal(await page.locator('.hero-source-track ul').first().locator('li').count(), 3); await page.unroute('**/api/v1/sources');
  const sourceCode = fs.readFileSync(path.join(frontend, 'src/components/landing/HeroSection.tsx'), 'utf8') + fs.readFileSync(path.join(frontend, 'src/features/demand/useDemandSnapshot.ts'), 'utf8');
  assert.doesNotMatch(sourceCode, /4005028|4,005,028|Math\.random|legacy|sampleRepository/i); assert.deepEqual(errors, []);
  pass('Only API-confirmed connected sources appear; production hero contains no hardcoded measurements or sample import; no browser exceptions');
  await page.emulateMedia({ colorScheme: 'light' }); let releaseLight;
  const lightGate = new Promise(resolve => { releaseLight = resolve; });
  await page.route(request, async route => { await lightGate; await route.continue(); });
  await page.goto(stack.base, { waitUntil: 'domcontentloaded' }); await page.locator('[data-snapshot-state="loading"]').waitFor();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.equal(await page.locator('.hero-skeleton-metric').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(238, 238, 230)');
  await capture(page, 'loading-light-en-390.png'); releaseLight(); await ready(page); await page.unroute(request);
  pass('Light mobile loading uses the existing warm-paper skeleton tokens and recovers to verified observations');
} catch (error) { errors.push(error.stack); console.error(error); process.exitCode = 1; }
finally { fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, screenshots, errors }, null, 2)); if (browser) await browser.close(); if (stack) await stack.stop(); }
})();
