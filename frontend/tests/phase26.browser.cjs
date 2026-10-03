const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict"), net = require("node:net");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");
const { startStack } = require("./test-stack.cjs");
const frontend = path.resolve(__dirname, ".."), output = path.resolve(frontend, "../docs/phase-2.6/verification");
fs.mkdirSync(output, { recursive: true });
const checks = [], screenshots = [], errors = [];
let stack, browser, preview;
function pass(text) { checks.push(text); console.log("PASS " + text); }
async function port() { return new Promise(resolve => { const server = net.createServer(); server.listen(0, "127.0.0.1", () => { const number = server.address().port; server.close(() => resolve(number)); }); }); }
(async () => {
  try {
    const docs = path.resolve(frontend, "../docs/phase-2.6");
    for (const file of ["PHASE_2_6_AUDIT.md", "VISUALIZATION_RESEARCH.md", "VISUALIZATION_SYSTEM.md", "SPATIAL_INTELLIGENCE.md", "DATA_VISUALIZATION_RULES.md"]) assert.ok(fs.existsSync(path.join(docs, file)), file);
    const research = fs.readFileSync(path.join(docs, "VISUALIZATION_RESEARCH.md"), "utf8");
    for (const source of ["MIT", "React Flow", "deck.gl", "21st.dev", "Three Fiber", "Recharts"]) assert.ok(research.includes(source), source);
    for (const directory of ["src/features/real-intelligence", "src/components/visualization"]) for (const file of fs.readdirSync(path.join(frontend, directory))) if (/\.tsx?$/.test(file)) assert.ok(!/Math\.random\(|queryObservations\(|demandIndex/.test(fs.readFileSync(path.join(frontend, directory, file), "utf8")), file);
    const canonical = path.resolve(frontend, "../data/canonical/labour-market.json");
    assert.equal(require("node:crypto").createHash("sha256").update(fs.readFileSync(canonical)).digest("hex"), "c85d2e9e26d103803d2419b7f2f95110130a3063636cceaf03c5d81211841eae");
    pass("Research/source licences documented, verified components contain no simulation generator and Phase2.5 canonical hash unchanged");
    stack = await startStack(frontend); browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); const page = await context.newPage(); await require("./verified-account.cjs").installVerifiedAccount(page, stack);
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(stack.base + "/auth/signup");
    for (const [name, value] of [["Name", "Verified Analyst"], ["Email", "phase26@example.in"], ["Password", "Observations9!"], ["Confirm password", "Observations9!"]]) await page.getByLabel(name, { exact: true }).fill(value);
    await page.getByRole("button", { name: "Create account", exact: true }).click(); await page.waitForURL(stack.base + "/intelligence");
    await page.locator(".viz-inspector > strong").waitFor();
    assert.deepEqual(await page.locator(".real-metric > strong").allTextContents(), ["60.1%", "58.2%", "3.2%"]);
    assert.equal(await page.locator(".data-mode-control,.workspace-metric,.spatial-canvas").count(), 0);
    assert.match(await page.locator(".workspace-data-banner").innerText(), /Verified public data/);
    pass("Real observations are default, verified banner has no sample selector and published values unchanged");
    const periods = await page.locator(".real-table-wrap tbody th").allTextContents();
    assert.deepEqual(periods, ["2017-18", "2018-19", "2019-20", "2020-21", "2021-22", "2022-23", "2023-24"]);
    await page.getByLabel("Inspect observation", { exact: true }).selectOption({ label: "2020-21" });
    assert.equal(await page.locator(".viz-inspector > strong").innerText(), "54.9%");
    await page.getByLabel("Inspect observation", { exact: true }).focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Enter");
    await page.locator(".evidence-dialog").waitFor(); assert.match(await page.locator(".evidence-details").innerText(), /2020-21/);
    await page.keyboard.press("Escape"); assert.equal(await page.locator(".viz-inspector button").evaluate(el => el === document.activeElement), true);
    await page.locator(".recharts-line-dot").first().hover(); await page.locator(".real-tooltip").getByText("MoSPI — PLFS · Observed", { exact: true }).waitFor();
    assert.match(await page.locator(".viz-annotation").innerText(), /January 2025/);
    pass("Chronological published series, keyboard point inspector, source tooltip, evidence Escape/focus restoration and methodology boundary");
    await page.goto(stack.base + "/regions"); await page.locator(".viz-dot-row").first().waitFor();
    assert.equal(await page.locator(".viz-dot-row").count(), 36);
    const api = `http://127.0.0.1:${stack.apiPort}/api/v1`;
    const catalog = await (await fetch(api + "/catalog")).json();
    const observed = await Promise.all(catalog.regions.filter(r => r.region_type !== "country").map(async r => [r.name, (await (await fetch(`${api}/labour?region_id=${r.region_id}&indicator=LFPR&period=2023-24`)).json()).items[0].value]));
    const sourceValues = new Map(observed);
    for (const row of await page.locator(".viz-dot-row").all()) {
      const name = await row.locator("span[lang=en]").innerText(), value = Number((await row.locator("strong").innerText()).replace("%", ""));
      assert.equal(value, sourceValues.get(name), name);
      const position = await row.locator("i").evaluate(el => parseFloat(el.style.insetInlineStart)); assert.equal(position, value);
    }
    await page.getByLabel("Comparison order", { exact: true }).selectOption("ascending");
    const values = (await page.locator(".viz-dot-row strong").allTextContents()).map(value => parseFloat(value));
    assert.deepEqual(values, [...values].sort((a, b) => a - b));
    const alignment = await page.evaluate(() => {
      const axis = document.querySelector(".viz-dot-scale > div").getBoundingClientRect();
      const track = document.querySelector(".viz-dot-track").getBoundingClientRect();
      return Math.abs(axis.left - track.left) < 1 && Math.abs(axis.width - track.width) < 1;
    }); assert.equal(alignment, true, "Regional scale aligns with the measured dot domain");
    await page.locator(".viz-dot-row").last().focus(); assert.ok(await page.locator(".viz-comparison-list").evaluate(el => el.scrollTop) > 0);
    await page.locator(".viz-dot-row").first().focus(); await page.keyboard.press("Enter"); await page.locator(".evidence-dialog").waitFor(); await page.keyboard.press("Escape");
    await page.getByLabel("Rural / urban", { exact: true }).selectOption("rural");
    await page.waitForFunction(() => document.querySelectorAll(".viz-dot-row").length === 35);
    assert.match(await page.locator(".viz-frame").last().innerText(), /Chandigarh/);
    await page.getByLabel("Activity status", { exact: true }).selectOption("CWS");
    await page.locator(".viz-frame .viz-unavailable").waitFor(); assert.equal(await page.locator(".viz-dot-row").count(), 0);
    pass("All regional marks match API records; ordering, keyboard evidence and unsupported combinations never invent or zero-fill values");
    await page.goto(stack.base + "/regions?sex=invalid");
    await page.getByText("Verified data could not be loaded. No simulated values have been substituted.", { exact: true }).first().waitFor();
    assert.equal(await page.locator(".viz-dot-row,.recharts-surface,.workspace-metric").count(), 0);
    await page.route("**/api/v1/labour?*", async route => {
      const response = await route.fetch(); const body = await response.json();
      body.items = body.items.map(row => ({ ...row, methodology_version: "PLFS post-2025" }));
      await route.fulfill({ response, json: body });
    });
    await page.goto(stack.base + "/intelligence");
    await page.getByText("Verified data could not be loaded. No simulated values have been substituted.", { exact: true }).waitFor();
    assert.equal(await page.locator(".recharts-surface").count(), 0); await page.unroute("**/api/v1/labour?*");
    pass("Invalid filters fail honestly and incompatible methodology responses are rejected before charting");
    await page.goto(stack.base + "/spatial"); await page.getByRole("heading", { name: "Regional evidence & spatial coverage" }).waitFor();
    assert.equal(await page.locator("canvas,.spatial-canvas,.spatial-index").count(), 0);
    assert.equal(await page.getByRole("button", { name: /sample simulation/ }).count(), 0);
    assert.match(await page.locator(".viz-coverage-columns").innerText(), /37/);
    await page.getByRole("link", { name: "Compare regional observations", exact: true }).click(); await page.waitForURL(stack.base + "/regions");
    await page.goto(stack.base + "/skills"); await page.getByRole("heading", { name: "Relationship intelligence unavailable", exact: true }).waitFor();
    assert.equal(await page.locator(".workspace-heatmap,.workspace-chart,canvas").count(), 0);
    pass("Spatial and relationships disclose missing inputs without fake coordinates, cylinders or edges; regional evidence remains reachable");
    await page.route("**/api/v1/catalog", route => route.abort()); await page.goto(stack.base + "/intelligence");
    await page.getByText("Verified data could not be loaded. No simulated values have been substituted.", { exact: true }).waitFor();
    assert.equal(await page.locator(".workspace-metric,.real-metric,.recharts-surface").count(), 0);
    await page.unroute("**/api/v1/catalog"); await page.getByRole("button", { name: "Try again", exact: true }).click(); await page.locator(".viz-inspector > strong").waitFor();
    pass("API failure and retry keep evidence boundary and never fall back to simulation");
    for (const theme of ["light", "dark"]) for (const locale of ["en-IN", "hi-IN"]) {
      await page.evaluate(({ theme, locale }) => { window.kaushaliqTheme.setPreference(theme); localStorage.setItem("kaushaliq.locale.v1", locale); }, { theme, locale });
      for (const width of [1440, 1280, 1024, 768, 390]) for (const route of ["intelligence", "regions", "spatial", "skills", "demand", "forecast"]) {
        await page.setViewportSize({ width, height: 1000 }); await page.goto(`${stack.base}/${route}`);
        await page.locator(".page-content .viz-frame,.page-content .viz-unavailable,.page-content .viz-spatial-coverage").first().waitFor();
        if (route === "regions") await page.locator(".viz-dot-row").first().waitFor();
        if (route === "regions") assert.equal(await page.evaluate(() => {
          const axis = document.querySelector(".viz-dot-scale > div").getBoundingClientRect(), track = document.querySelector(".viz-dot-track").getBoundingClientRect();
          return Math.abs(axis.left - track.left) < 1 && Math.abs(axis.width - track.width) < 1;
        }), true, `Comparison domain alignment ${width}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${theme}/${locale}/${width}/${route}`);
        assert.equal(await page.locator(".workspace-metric,.data-mode-control,canvas").count(), 0);
        const filename = `${route}-${theme}-${locale}-${width}.png`; await page.screenshot({ path: path.join(output, filename), fullPage: true, animations: "disabled" }); screenshots.push(filename);
      }
    }
    pass("120 real-mode captures: six views, five widths, both themes/languages, no overflow or legacy visuals");
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(stack.base + "/intelligence");
    await page.getByRole("button", { name: /भाषा/ }).click(); await page.getByRole("menuitemradio", { name: "English", exact: true }).click();
    await page.getByLabel("Inspect observation").waitFor();
    await page.getByRole("button", { name: "Language: English", exact: true }).click(); await page.getByRole("menuitemradio", { name: "हिन्दी", exact: true }).click();
    await page.getByLabel("अवलोकन जाँचें").waitFor(); await page.reload(); await page.getByLabel("अवलोकन जाँचें").waitFor();
    await page.getByRole("button", { name: /भाषा/ }).click(); await page.getByRole("menuitemradio", { name: "English", exact: true }).click();
    await page.getByLabel("Inspect observation").waitFor(); await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator(".viz-frame").evaluate(el => getComputedStyle(el).animationName), "none");
    pass("Immediate English/Hindi switching, persistence and reduced-motion chart presentation");
    const previewPort = await port();
    preview = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", String(previewPort), "--strictPort"], { cwd: frontend, env: { ...process.env, API_PROXY_TARGET: `http://127.0.0.1:${stack.apiPort}` }, stdio: "ignore", windowsHide: true });
    const production = `http://127.0.0.1:${previewPort}`;
    for (let i = 0; i < 100; i++) { try { if ((await fetch(production)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
    await page.goto(production + "/intelligence?data=sample"); await page.locator(".real-metric > strong").first().waitFor();
    assert.equal(await page.locator(".workspace-metric").count(), 0);
    await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
    await page.goto(production + "/spatial?data=sample"); await page.locator(".viz-spatial-coverage").waitFor(); assert.equal(await page.locator("canvas").count(), 0);
    const bundles = fs.readdirSync(path.join(frontend, "dist/assets")).filter(file => file.endsWith(".js"));
    assert.ok(!bundles.some(file => /SpatialIntelligence|OverviewPage|EntityIntelligence|DemandForecastReports/.test(file)));
    assert.ok(!bundles.some(file => fs.readFileSync(path.join(frontend, "dist/assets", file), "utf8").includes("WebGLRenderer")));
    pass("Production ignores sample URLs and excludes legacy chunks/Three.js; spatial disclosure works with WebGL unavailable");
    assert.deepEqual(errors, []);
  } catch (error) { errors.push(error.stack); console.error(error); process.exitCode = 1; }
  finally {
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ checks, screenshots, errors }, null, 2));
    if (preview) preview.kill(); if (browser) await browser.close(); if (stack) await stack.stop();
  }
})();
