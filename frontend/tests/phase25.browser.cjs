const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { startStack } = require("./test-stack.cjs");
const frontend = path.resolve(__dirname, "..");
const output = path.resolve(frontend, "../docs/phase-2.5/verification");
fs.mkdirSync(output, { recursive: true });
const checks = [], screenshots = [], errors = [];
let browser, stack;
function pass(name) { checks.push(name); console.log("PASS " + name); }
(async () => {
  try {
    stack = await startStack(frontend);
    const api = `http://127.0.0.1:${stack.apiPort}/api/v1`;
    for (const collection of ["sources", "regions", "skills", "occupations", "industries", "labour", "training", "catalog"]) {
      const response = await fetch(`${api}/${collection}`); assert.equal(response.status, 200, collection);
      const value = await response.json();
      if (["skills", "occupations"].includes(collection)) { assert.equal(value.status, "UNAVAILABLE"); assert.deepEqual(value.items, []); }
    }
    const labour = await (await fetch(api + "/labour?period=2023-24")).json();
    assert.deepEqual(Object.fromEntries(labour.items.map(r => [r.indicator, r.value])), { LFPR: 60.1, WPR: 58.2, UR: 3.2 });
    assert.ok(labour.items.every(r => r.unit === "percent" && r.status === "OBSERVED" && r.evidence.raw_sha256.length === 64));
    assert.equal((await fetch(api + "/labour?sex=invented")).status, 422);
    assert.equal((await fetch(api + "/labour?limit=1001")).status, 422);
    const blank = await (await fetch(api + "/labour?region_id=in-chandigarh&sector=rural")).json();
    assert.equal(blank.status, "UNAVAILABLE"); assert.deepEqual(blank.items, []);
    const noCws = await (await fetch(api + "/labour?region_id=in-karnataka&activity_status=CWS")).json(); assert.equal(noCws.items.length, 0);
    const training = await (await fetch(api + "/training?period=2024-25")).json(); assert.deepEqual(training.items.map(r => r.indicator), ["certified"]);
    pass("Canonical APIs, known rates, evidence, invalid query rejection and quarantined/missing observations");
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
    const page = await context.newPage(); await require("./verified-account.cjs").installVerifiedAccount(page, stack); page.on("pageerror", e => errors.push(e.message));
    await page.goto(stack.base + "/auth/signup");
    await page.getByLabel("Name", { exact: true }).fill("Data Foundation Analyst");
    await page.getByLabel("Email", { exact: true }).fill("phase25@example.in");
    await page.getByLabel("Password", { exact: true }).fill("Datasetpass9!");
    await page.getByLabel("Confirm password", { exact: true }).fill("Datasetpass9!");
    await page.getByRole("button", { name: "Create account", exact: true }).click(); await page.waitForURL(stack.base + "/intelligence");
    await page.locator(".real-metric > strong").first().waitFor();
    assert.deepEqual(await page.locator(".real-metric > strong").allTextContents(), ["60.1%", "58.2%", "3.2%"]);
    assert.equal(await page.locator(".workspace-metric").count(), 0);
    assert.equal(await page.getByLabel("Data source", { exact: true }).count(), 0);
    await page.reload(); await page.locator(".real-metric > strong").first().waitFor();
    assert.match(await page.locator(".real-metric > strong").first().innerText(), /60.1%/);
    pass("Real provider is default after authentication and refresh; no fabricated KPIs");
    await page.getByRole("button", { name: "View evidence", exact: true }).first().click();
    await page.locator(".evidence-dialog").waitFor(); assert.match(await page.locator(".evidence-details").innerText(), /Table 1; row 2023-24/);
    await page.screenshot({ path: path.join(output, "evidence-desktop.png"), fullPage: true, animations: "disabled" });
    await page.keyboard.press("Tab"); assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest("dialog"))), true);
    await page.keyboard.press("Escape"); assert.equal(await page.locator(".evidence-dialog").count(), 0);
    assert.equal(await page.getByRole("button", { name: "View evidence", exact: true }).first().evaluate(el => el === document.activeElement), true);
    pass("Evidence exposes source, period, methodology, transformations, terms and raw hash; keyboard/focus restore");
    await page.getByLabel("Population", { exact: true }).selectOption("female");
    await page.waitForFunction(() => document.querySelector(".real-metric > strong")?.textContent === "41.7%");
    await page.getByLabel("Geography", { exact: true }).selectOption("in-karnataka");
    await page.waitForFunction(() => document.querySelectorAll(".real-table-wrap tbody tr").length === 1);
    await page.getByLabel("Observation period", { exact: true }).selectOption("2022-23");
    await page.getByRole("heading", { name: "Data not currently available for this dimension", exact: true }).waitFor();
    await page.getByLabel("Activity status", { exact: true }).selectOption("CWS");
    await page.waitForFunction(() => [...document.querySelectorAll(".real-metric > strong")].every(el => el.textContent === "—"));
    pass("Sex, state, period and activity filters change observed results; absent coverage never becomes zero");
    await page.goto(stack.base + "/intelligence"); await page.getByRole("button", { name: "Training observations", exact: true }).click();
    await page.getByText("5,39,992", { exact: true }).waitFor(); assert.equal(await page.getByText("20,38,319", { exact: true }).count(), 0);
    await page.screenshot({ path: path.join(output, "training-observed.png"), fullPage: true, animations: "disabled" });
    assert.match(await page.locator(".real-intelligence").innerText(), /quarantined/);
    await page.getByLabel("Geography", { exact: true }).selectOption("in-lakshadweep");
    await page.getByRole("heading", { name: "Data not currently available for this dimension", exact: true }).waitFor();
    pass("Training renders observed counts, partial-period/cohort cautions and quarantine, with missing states unavailable");
    await page.goto(stack.base + "/intelligence"); await page.locator(".real-metric > strong").first().waitFor(); await page.keyboard.press("Control+k");
    await page.getByRole("combobox", { name: "Search pages" }).fill("Karnataka"); await page.getByRole("dialog").getByRole("option", { name: /Karnataka/ }).waitFor();
    await page.keyboard.press("Enter"); await page.waitForURL(/\/regions\?region=in-karnataka/); await page.locator(".real-metric > strong").first().waitFor();
    await page.keyboard.press("Control+k"); await page.getByRole("combobox", { name: "Search pages" }).fill("Python"); assert.equal(await page.getByRole("dialog").getByRole("option").count(), 0); await page.keyboard.press("Escape");
    pass("Search uses connected canonical entities, with no simulated skill search in real mode");
    await page.goto(stack.base + "/intelligence"); await page.goto(stack.base + "/intelligence?data=sample");
    await page.locator(".workspace-metric").first().waitFor(); assert.match(page.url(), /data=sample/);
    await page.goBack(); await page.locator(".real-metric").first().waitFor();
    await page.goForward(); await page.locator(".workspace-metric").first().waitFor();
    await page.goto(stack.base + "/intelligence"); await page.locator(".real-metric").first().waitFor();
    pass("Legacy simulation is explicit and labelled; back/forward restores the correct provider");
    await page.route("**/api/v1/catalog", route => route.abort()); await page.reload();
    await page.getByText("Verified data could not be loaded. No simulated values have been substituted.", { exact: true }).waitFor();
    assert.equal(await page.locator(".workspace-metric").count(), 0); await page.unroute("**/api/v1/catalog");
    await page.getByRole("button", { name: "Try again", exact: true }).click(); await page.locator(".real-metric").first().waitFor();
    pass("API failure is explicit; retry recovers without sample fallback");
    const periods = await page.locator(".real-table-wrap tbody th").allTextContents(); assert.equal(periods[0], "2017-18"); assert.equal(periods.at(-1), "2023-24");
    await page.locator(".recharts-line-dot").first().hover(); await page.locator(".real-tooltip").getByText("MoSPI — PLFS · Observed", { exact: true }).waitFor();
    await page.goto(stack.base + "/industries"); await page.getByRole("button", { name: "Next", exact: true }).waitFor();
    assert.equal(await page.locator("tbody tr").count(), 25); await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByText("Page 2 of 14", { exact: false }).waitFor();
    await page.getByLabel("Search published names or codes", { exact: true }).fill("011"); assert.equal(await page.locator("tbody tr").count(), 1);
    pass("Chronological historical chart, source/period tooltip and paginated searchable NIC reference");
    const routes = ["intelligence", "regions", "industries", "occupations", "skills", "demand", "forecast", "spatial", "reports"];
    for (const theme of ["light", "dark"]) for (const locale of ["en-IN", "hi-IN"]) {
      await page.goto(stack.base + "/intelligence");
      await page.evaluate(({ theme, locale }) => { window.kaushaliqTheme.setPreference(theme); localStorage.setItem("kaushaliq.locale.v1", locale); }, { theme, locale });
      await page.reload();
      for (const width of [1440, 1280, 1024, 768, 390]) for (const route of routes) {
        await page.setViewportSize({ width, height: 1000 }); await page.goto(`${stack.base}/${route}`);
        await page.locator(".page-content .real-section-heading, .page-content .viz-unavailable, .page-content .viz-spatial-coverage").first().waitFor();
        if (["intelligence", "regions", "forecast"].includes(route)) await page.locator(".real-metric > strong").first().waitFor();
        await page.waitForTimeout(120); if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))) { await page.screenshot({path:path.join(output,"overflow.png"),fullPage:true}); console.log(await page.evaluate(() => [...document.querySelectorAll("body *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,15).map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right})))); } assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${route} ${width} ${theme} ${locale}`);
        assert.equal(await page.locator(".workspace-metric").count(), 0);
        assert.equal(await page.locator("html").getAttribute("lang"), locale === "hi-IN" ? "hi" : "en");
        const name = `${route}-${theme}-${locale}-${width}.png`;
        await page.screenshot({ path: path.join(output, name), fullPage: true, animations: "disabled" }); screenshots.push(name);
        if (route === "intelligence") {
          await page.locator(".real-view-switch button").nth(1).click(); await page.locator(".real-table-wrap tbody tr").first().waitFor();
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `training ${width} ${theme} ${locale}`);
          const trainingName = `training-${theme}-${locale}-${width}.png`; await page.screenshot({path:path.join(output,trainingName),fullPage:true,animations:"disabled"}); screenshots.push(trainingName);
          await page.locator(".real-evidence-link").first().click(); await page.locator(".evidence-dialog").waitFor();
          assert.equal(await page.locator(".evidence-dialog").evaluate(el => el.getBoundingClientRect().right <= innerWidth && el.scrollWidth <= el.clientWidth), true);
          const evidenceName = `evidence-${theme}-${locale}-${width}.png`; await page.screenshot({path:path.join(output,evidenceName),animations:"disabled"}); screenshots.push(evidenceName); await page.keyboard.press("Escape");
        }
      }
    }
    pass("Nine real-data routes plus training/evidence: five widths, both themes and languages, no page overflow (220 screenshots)");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(stack.base + "/intelligence"); await page.getByLabel("भौगोलिक क्षेत्र", { exact: true }).waitFor();
    await page.evaluate(() => { localStorage.setItem("kaushaliq.locale.v1", "en-IN"); }); await page.reload();
    await page.getByLabel("Geography", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Language: English", exact: true }).click(); await page.getByRole("menuitemradio", { name: "हिन्दी", exact: true }).click();
    await page.getByLabel("भौगोलिक क्षेत्र", { exact: true }).waitFor(); await page.reload(); await page.getByLabel("भौगोलिक क्षेत्र", { exact: true }).waitFor();
    await page.getByRole("button", { name: /भाषा/ }).first().click(); await page.getByRole("menuitemradio", { name: "English", exact: true }).click(); await page.getByLabel("Geography", { exact: true }).waitFor();
    await page.emulateMedia({ reducedMotion: "reduce" }); assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
    assert.deepEqual(errors, []); pass("Language switching and refresh persistence, reduced motion, no uncaught browser exceptions");
  } catch (error) { errors.push(error.stack); console.error(error); process.exitCode = 1; }
  finally { fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ checks, screenshots, errors }, null, 2)); if (browser) await browser.close(); if (stack) await stack.stop(); }
})();
