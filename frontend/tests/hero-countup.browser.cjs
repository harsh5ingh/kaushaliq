const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright'), { startStack } = require('./test-stack.cjs');
const frontend = path.resolve(__dirname, '..');
const output = path.resolve(frontend, '../docs/phase-2.9.1/count-up/verification');
fs.mkdirSync(output, { recursive: true });
const checks = [], errors = [], screenshots = [], timeline = [];
let stack, browser;
const selectors = ['[data-hero-vacancies]', '[data-hero-regions]', '[data-hero-records]'];
const numbers = page => page.locator('.hero-snapshot-card [data-countup-value]').allTextContents();
function pass(name) { checks.push(name); console.log('PASS ' + name); }
async function states(page) { return page.locator('.hero-snapshot-card [data-countup-state]').evaluateAll(els => els.map(el => el.dataset.countupState)); }
async function geometry(page) {
  return page.locator('.hero-snapshot-card, .hero-snapshot-card .metric-count-up, .hero-snapshot-provenance').evaluateAll(els => els.map(el => {
    const { x, y, width, height } = el.getBoundingClientRect(); return { x, y, width, height };
  }));
}
async function capture(page, file) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const clip = await page.locator('.home-hero').boundingBox();
  await page.screenshot({ path: path.join(output, file), clip, fullPage: true, animations: 'disabled' }); screenshots.push(file);
}
async function sample(page, stage) { timeline.push({ stage, values: await numbers(page), states: await states(page), geometry: await geometry(page) }); }
async function holdSnapshot(page, base) {
  let release; const gate = new Promise(resolve => { release = resolve; });
  const pattern = '**/api/v1/intelligence/demand?*';
  await page.route(pattern, async route => { await gate; await route.continue(); });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-snapshot-state="loading"]').waitFor();
  // Isolate count-up geometry from the existing, unrelated CSS entrance translation.
  await page.addStyleTag({ content: '.hero-intelligence-column { animation: none !important; }' });
  // Freeze only after page initialization; no metric exists yet.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  return async () => {
    release(); await page.locator('[data-snapshot-state="ready"]').waitFor(); await page.unroute(pattern);
  };
}
(async () => { try {
  stack = await startStack(frontend, { emailDelivery: false });
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  const api = `http://127.0.0.1:${stack.apiPort}/api/v1/intelligence/demand`;
  const actual = await (await fetch(api + '?geography_id=in&metric=active_vacancies')).json();
  const coverage = await (await fetch(api + '/coverage')).json();
  const target = [actual.items[0].value, new Set(coverage.options.geographies.filter(r => ['state', 'ut'].includes(r.geography_level)).map(r => r.geography_id)).size, coverage.quality.published_records];
  assert.deepEqual(target, [4005028, 33, 37]); // Verified publication expectations, isolated to tests.
  const formatted = (locale = 'en-GB') => target.map(value => new Intl.NumberFormat(locale).format(value));
  let apiRequests = 0; page.on('request', request => { if (request.url().includes('/api/v1/intelligence/demand')) apiRequests++; });
  const release = await holdSnapshot(page, stack.base);
  assert.ok(await page.locator('.hero-snapshot-card .skeleton').count() >= 6);
  assert.equal(await page.locator('.hero-snapshot-card .metric-count-up').count(), 0);
  assert.equal(await page.locator('.hero-snapshot-card').getAttribute('aria-busy'), 'true');
  await release(); await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(await numbers(page), ['0', '0', '0']); assert.deepEqual(await states(page), ['animating', 'animating', 'animating']);
  assert.deepEqual(await page.locator('.hero-snapshot-card [data-countup-final]').allTextContents(), formatted());
  assert.equal(await page.locator('.hero-snapshot-card [data-countup-value][aria-hidden="true"]').count(), 3);
  assert.equal(await page.locator('.metric-count-up [aria-live], .metric-count-up[aria-live]').count(), 0);
  const initialGeometry = await geometry(page); await sample(page, 'desktop: API ready, before first frame'); await capture(page, 'desktop-dark-en-start.png');
  pass('Skeleton transitions to zero only after valid API data; final accessible values are exposed without tick announcements');

  await page.clock.runFor(400); await sample(page, 'desktop: 400ms'); await capture(page, 'desktop-dark-en-midpoint.png');
  const intermediate = (await numbers(page)).map(value => Number(value.replaceAll(',', '')));
  intermediate.forEach((value, index) => assert.ok(value > 0 && value < target[index]));
  assert.deepEqual(await geometry(page), initialGeometry);
  const requestsBefore = apiRequests, beforePreference = await numbers(page);
  await page.getByRole('button', { name: /^Appearance:/ }).click({ force: true });
  await page.getByRole('menuitemradio', { name: 'Light', exact: true }).click({ force: true });
  assert.deepEqual(await numbers(page), beforePreference); assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.getByRole('button', { name: 'Language: English', exact: true }).click({ force: true });
  await page.getByRole('menuitemradio', { name: 'हिन्दी', exact: true }).click({ force: true });
  assert.deepEqual((await numbers(page)).map(n => Number(n.replaceAll(',', ''))), intermediate);
  assert.deepEqual(await page.locator('.hero-snapshot-card [data-countup-final]').allTextContents(), formatted('hi-IN'));
  await page.locator('.hero-evidence-button').click({ force: true }); await page.locator('.evidence-dialog').waitFor();
  await page.keyboard.press('Escape'); assert.deepEqual((await numbers(page)).map(n => Number(n.replaceAll(',', ''))), intermediate);
  assert.equal(apiRequests, requestsBefore);
  await page.clock.runFor(650); assert.deepEqual(await states(page), ['animating', 'settled', 'settled']);
  await page.clock.runFor(550); assert.deepEqual(await numbers(page), formatted('hi-IN')); assert.deepEqual(await states(page), ['settled', 'settled', 'settled']);
  await page.getByRole('button', { name: 'भाषा: हिन्दी', exact: true }).click({ force: true }); await page.getByRole('menuitemradio', { name: 'English', exact: true }).click({ force: true });
  assert.deepEqual(await numbers(page), formatted()); await page.clock.runFor(1700); assert.deepEqual(await numbers(page), formatted());
  await sample(page, 'desktop: settled after theme, locale and parent changes'); await capture(page, 'desktop-light-en-final.png');
  pass('All three values finish exactly; shorter secondary timing, easing, stable layout and uninterrupted theme/language/parent updates verified');

  // Exercise actual target changes in an isolated component; never alter canonical API data.
  await page.evaluate(async value => { const fixture = await import('/tests/countup.fixture.tsx'); window.__counter = fixture.mountCountUp(value); }, target[0]);
  await page.locator('#count-up-fixture [data-countup-state="animating"]').waitFor();
  await page.clock.runFor(400);
  const fixtureValue = () => page.locator('#count-up-fixture [data-countup-value]').textContent();
  const from = Number((await fixtureValue()).replaceAll(',', ''));
  await page.evaluate(value => window.__counter.render(value, 'hi-IN'), target[0]);
  assert.equal(Number((await fixtureValue()).replaceAll(',', '')), from);
  await page.clock.runFor(1200); assert.equal(await fixtureValue(), formatted('hi-IN')[0]);
  // A changed target must retain the currently displayed value at the start.
  await page.evaluate(value => window.__counter.render(value), target[1]);
  await page.locator('#count-up-fixture [data-countup-state="animating"]').waitFor();
  assert.equal(Number((await fixtureValue()).replaceAll(',', '')), target[0]);
  await page.clock.runFor(300); const descending = Number((await fixtureValue()).replaceAll(',', '')); assert.ok(descending < target[0] && descending > target[1]);
  await page.evaluate(value => window.__counter.render(value), target[0]);
  assert.equal(Number((await fixtureValue()).replaceAll(',', '')), descending);
  await page.clock.runFor(1600); assert.equal(await fixtureValue(), formatted()[0]);
  await page.evaluate(() => window.__counter.render(0)); await page.clock.runFor(1600); assert.equal(await fixtureValue(), '0');
  await page.evaluate(value => window.__counter.render(value), target[0]); await page.locator('#count-up-fixture [data-countup-state="animating"]').waitFor();
  assert.ok(await page.evaluate(() => window.__counter.pendingFrames()) > 0);
  assert.equal(await page.evaluate(() => window.__counter.unmount()), 0);
  await page.clock.runFor(1600); assert.equal(await page.locator('#count-up-fixture').count(), 0);
  pass('StrictMode, recreated formatter/parent JSX, increasing/decreasing/interrupted/zero targets and unmount RAF cancellation work in isolated tests');

  await page.setViewportSize({ width: 390, height: 1000 });
  await page.evaluate(() => { localStorage.setItem('kaushaliq.theme.v1', 'light'); localStorage.setItem('kaushaliq.locale.v1', 'hi-IN'); });
  const releaseMobile = await holdSnapshot(page, stack.base); await releaseMobile(); await page.evaluate(() => document.fonts.ready);
  const mobileGeometry = await geometry(page); await sample(page, 'mobile: API ready'); await capture(page, 'mobile-light-hi-start.png');
  await page.clock.runFor(500); assert.deepEqual(await geometry(page), mobileGeometry); await sample(page, 'mobile: 500ms'); await capture(page, 'mobile-light-hi-midpoint.png');
  await page.clock.runFor(1100); assert.deepEqual(await numbers(page), formatted('hi-IN')); assert.deepEqual(await geometry(page), mobileGeometry);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  for (const selector of selectors) assert.equal(await page.locator(selector).evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }), true);
  await sample(page, 'mobile: final'); await capture(page, 'mobile-light-hi-final.png');
  pass('Mobile Hindi/light count-up has unchanged metric/card geometry and no horizontal overflow');

  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload(); await page.locator('[data-snapshot-state="ready"]').waitFor();
  assert.deepEqual(await numbers(page), formatted('hi-IN')); assert.deepEqual(await states(page), ['settled', 'settled', 'settled']);
  await capture(page, 'mobile-light-hi-reduced-motion.png');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const releaseAgain = await holdSnapshot(page, stack.base); await releaseAgain(); await page.clock.runFor(200);
  assert.equal((await states(page))[0], 'animating');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Media-query notifications arrive asynchronously from the browser.
  await page.locator('[data-hero-vacancies] [data-countup-state="settled"]').waitFor();
  assert.deepEqual(await numbers(page), formatted('hi-IN')); assert.deepEqual(await states(page), ['settled', 'settled', 'settled']);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.clock.runFor(1600); assert.deepEqual(await states(page), ['settled', 'settled', 'settled']);
  pass('Reduced motion shows final values immediately, cancels in-flight animation and does not restart when preference is restored');

  const pattern = '**/api/v1/intelligence/demand?*';
  await page.route(pattern, route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.reload(); await page.locator('[data-snapshot-state="error"]').waitFor(); assert.equal(await page.locator('.hero-snapshot-card .metric-count-up').count(), 0);
  await page.unroute(pattern); await page.getByRole('button', { name: 'फिर कोशिश करें', exact: true }).click({ force: true }); await page.locator('[data-snapshot-state="ready"]').waitFor(); await page.clock.runFor(1600); assert.deepEqual(await numbers(page), formatted('hi-IN'));
  for (const response of [{ ...actual, items: [], total: 0, status: 'UNAVAILABLE' }, { ...actual, items: [{ ...actual.items[0], value: null }] }]) {
    await page.route(pattern, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }));
    await page.reload(); await page.locator('[data-snapshot-state="unavailable"], [data-snapshot-state="error"]').waitFor();
    assert.equal(await page.locator('.hero-snapshot-card .metric-count-up').count(), 0); await page.unroute(pattern);
  }
  pass('API failure/retry, missing observation and null measurement retain truthful states with no fabricated counters');
  const source = fs.readFileSync(path.join(frontend, 'src/components/ui/CountUp.tsx'), 'utf8') + fs.readFileSync(path.join(frontend, 'src/components/landing/HeroSection.tsx'), 'utf8');
  assert.doesNotMatch(source, /4005028|4,005,028|Math\.random/); assert.deepEqual(errors, []);
  pass('No production target literals, random values, API mutation or uncaught browser exceptions');
} catch (error) { errors.push(error.stack); console.error(error); process.exitCode = 1; }
finally {
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, screenshots, timeline, errors }, null, 2));
  if (browser) await browser.close(); if (stack) await stack.stop();
} })();
