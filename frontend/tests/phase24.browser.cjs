const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { startStack } = require("./test-stack.cjs");
const frontend = path.resolve(__dirname, "..");
const output = process.env.KAUSHALIQ_TEST_OUTPUT ? path.resolve(process.env.KAUSHALIQ_TEST_OUTPUT) : path.resolve(frontend, "../docs/phase-2/implementation/phase-2.4-verification/workspace");
fs.mkdirSync(output, { recursive: true });
const checks = [], errors = [], dimensions = [];
let browser, stack;
const pass = name => { checks.push(name); console.log("PASS " + name); };
(async () => {
  try {
    stack = await startStack(frontend); const base = stack.base;
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
    const page = await context.newPage(); await require("./verified-account.cjs").installVerifiedAccount(page, stack); require("./legacy-sample.cjs").installLegacySample(page); page.on("pageerror", error => errors.push(error.message));
    await page.goto(base + "/auth/signup");
    await page.getByLabel("Name", { exact: true }).fill("Phase 2.4 Analyst");
    await page.getByLabel("Email", { exact: true }).fill("phase24-workspace@example.in");
    await page.getByLabel("Password", { exact: true }).fill("Workspacepass9!");
    await page.getByLabel("Confirm password", { exact: true }).fill("Workspacepass9!");
    await page.getByRole("button", { name: "Create account", exact: true }).click(); await page.waitForURL(base + "/intelligence");
    async function noOverflow(route, width) { const okay = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth); dimensions.push({ route, width, overflow: !okay }); assert.equal(okay, true, `Horizontal overflow at ${width}px on ${route}`); }
    const routes = ["/intelligence", "/skills", "/regions", "/industries", "/occupations", "/demand", "/forecast", "/spatial", "/reports"];
    for (const mode of ["dark", "light"]) {
      await page.goto(base + "/intelligence"); await page.evaluate(mode => window.kaushaliqTheme.setPreference(mode), mode); await page.waitForTimeout(120);
      for (const route of routes) {
        await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(base + route); await page.locator(".workspace-data-banner").waitFor(); await page.locator(".page-heading h1").waitFor();
        if (route === "/spatial") await page.locator(".spatial-node-list button").first().waitFor();
        else if (route === "/reports") await page.locator(".report-list").waitFor();
        else await page.locator(".workspace-metric").first().waitFor();
        assert.match(await page.locator(".workspace-data-banner").innerText(), /simulated|अनुकरणीय/i);
        await page.evaluate(() => document.fonts.ready); await noOverflow(route, 1440);
        if (route === "/spatial") { await page.waitForTimeout(350); await page.getByRole("button", { name: "Hyderabad", exact: true }).click(); await page.getByText("Telangana", { exact: true }).waitFor(); }
        await page.screenshot({ path: path.join(output, `${mode}-${route.slice(1)}-1440.png`), fullPage: true, animations: "disabled" });
        await page.reload(); await page.locator(".workspace-data-banner").waitFor(); await noOverflow(route, 1440);
      }
    }
    pass("All nine workspace routes render, refresh and disclose simulated data in both themes");

    await page.goto(base + "/intelligence");
    const initialDemand = await page.locator(".workspace-metric > strong").first().innerText();
    await page.getByLabel("Region", { exact: true }).selectOption("bengaluru");
    await page.waitForFunction(previous => document.querySelector(".workspace-metric > strong")?.textContent !== previous, initialDemand);
    const regionalDemand = await page.locator(".workspace-metric > strong").first().innerText();
    await page.getByLabel("Time period", { exact: true }).selectOption("6m");
    await page.waitForFunction(previous => document.querySelector(".workspace-metric > strong")?.textContent !== previous, regionalDemand);
    const chartTicks = await page.locator(".workspace-grid-primary .recharts-xAxis .recharts-cartesian-axis-tick").count();
    assert.ok(chartTicks > 0, "Filtered demand trend should render chart ticks");
    await page.screenshot({ path: path.join(output, "overview-filtered.png"), fullPage: true, animations: "disabled" });
    await page.goto(base + "/intelligence?industry=manufacturing&skill=python");
    await page.getByText("No simulated observations match these filters.", { exact: true }).waitFor();
    pass("Overview region/period filters update calculations and incompatible dimensions produce an honest empty state");

    await page.goto(base + "/skills");
    const skillsDemand = await page.locator(".workspace-metric > strong").first().innerText();
    await page.getByLabel("Skill category", { exact: true }).selectOption("engineering");
    await page.waitForFunction(previous => document.querySelector(".workspace-metric > strong")?.textContent !== previous || document.querySelector("[role=status]")?.textContent?.includes("No simulated observations"), skillsDemand);
    assert.match(page.url(), /category=engineering/);
    pass("Skill profile responds to a category filter from the shared simulated model");

    await page.goto(base + "/regions");
    const regionDemand = await page.locator(".workspace-metric > strong").first().innerText();
    await page.getByLabel("Experience level", { exact: true }).selectOption("senior");
    await page.waitForFunction(previous => document.querySelector(".workspace-metric > strong")?.textContent !== previous, regionDemand);
    assert.match(page.url(), /experience=senior/);
    pass("Regional profile responds to experience-level filters from the shared simulated model");

    await page.keyboard.press("Control+k");
    const search = page.getByRole("combobox", { name: "Search pages" }); await search.fill("Python");
    await page.getByRole("listbox").getByRole("option", { name: /Python/ }).waitFor(); await page.keyboard.press("Enter"); await page.waitForURL(/\/skills\?skill=python/);
    await page.getByLabel("Skill", { exact: true }).waitFor();
    await page.getByRole("link", { name: /Software developer/ }).click(); await page.waitForURL(/\/occupations\?occupation=softwareDeveloper/);
    await page.getByLabel("Occupation", { exact: true }).waitFor();
    pass("Command search finds a simulated skill, opens its profile, and relationship links drill into an occupation");

    await page.goto(base + "/reports"); await page.getByRole("button", { name: "View brief" }).first().click();
    await page.getByText("Derived from deterministic simulated inputs; not a real-world finding.", { exact: true }).waitFor();
    pass("Report briefs expand in-page and keep simulated evidence disclosure visible");

    await page.goto(base + "/spatial");
    await page.locator(".spatial-stage").waitFor(); await page.waitForTimeout(350);
    assert.ok(await page.locator(".spatial-canvas").count() === 1 || await page.getByText(/Interactive 3D is unavailable/).count() === 1, "3D viewer should render or show an accessible fallback");
    await page.getByRole("group", { name: "Visualization layer" }).getByRole("button", { name: "Skills", exact: true }).click();
    assert.equal(await page.getByRole("group", { name: "Visualization layer" }).getByRole("button", { name: "Skills", exact: true }).getAttribute("aria-pressed"), "true");
    await page.screenshot({ path: path.join(output, "spatial-interaction.png"), fullPage: true, animations: "disabled" });
    await page.setViewportSize({ width: 390, height: 844 }); await noOverflow("/spatial", 390);
    pass("Spatial scene layer and accessible region selector work with graceful WebGL fallback support");

    for (const width of [1440, 1280, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of routes) {
        await page.goto(base + route); await page.locator(".workspace-data-banner").waitFor();
        if (route === "/spatial") await page.locator(".spatial-node-list button").first().waitFor();
        else if (route === "/reports") await page.locator(".report-list").waitFor();
        else await page.locator(".workspace-metric").first().waitFor();
        await noOverflow(route, width);
        if (width === 390 && route === "/intelligence") await page.screenshot({ path: path.join(output, "mobile-overview-390.png"), fullPage: true, animations: "disabled" });
      }
    }
    pass("All workspace routes have no horizontal overflow at 1440, 1280, 1024, 768 and 390px");

    await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(base + "/spatial"); await page.getByRole("button", { name: "Language: English" }).click();
    await page.getByRole("menuitemradio", { name: "हिन्दी", exact: true }).click(); await page.locator(".workspace-data-banner").getByText("अनुकरणीय डेटासेट").waitFor();
    for (const route of routes) { await page.goto(base + route); await page.locator(".workspace-data-banner").waitFor(); assert.match(await page.locator(".page-heading h1").innerText(), /[\u0900-\u097f]/, route); }
    pass("New workspace routes and navigation are translated into Hindi without replacing the locale provider");
    assert.deepEqual(errors, []);
  } catch (error) { errors.push(String(error)); console.error(error); process.exitCode = 1; }
  finally { fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ checks, errors, dimensions }, null, 2)); if (browser) await browser.close(); if (stack) await stack.stop(); }
})();
