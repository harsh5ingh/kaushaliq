const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const os = require("node:os");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const frontend = path.resolve(__dirname, "..");
const root = path.dirname(frontend);
const output = process.env.KAUSHALIQ_TEST_OUTPUT ? path.resolve(process.env.KAUSHALIQ_TEST_OUTPUT) : path.join(root, "docs", "phase-1.5", "workspace-regression");
fs.mkdirSync(output, { recursive: true });
const checks = [];
const errors = [];
const servers = [];
const logs = [];
const authTestDir = fs.mkdtempSync(path.join(os.tmpdir(), "kaushaliq-phase1-auth-"));
let browser;
async function port() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.on("error", reject);
    socket.listen(0, "127.0.0.1", () => { const result = socket.address().port; socket.close(() => resolve(result)); });
  });
}
function server(command, args, cwd, name, env = {}) {
  const log = fs.openSync(path.join(output, name + ".log"), "w");
  logs.push(log);
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ["ignore", log, log], windowsHide: true });
  child.on("error", error => errors.push(name + ": " + error.message));
  servers.push(child);
  return child;
}
async function waitFor(url) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Server did not become ready: " + url);
}
function record(name, details = {}) { checks.push({ name, passed: true, ...details }); console.log("PASS " + name); }
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null || child.killed) return;
  await new Promise(resolve => { child.once("exit", resolve); child.kill(); });
}
(async () => {
  try {
    const apiPort = await port();
    const webPort = await port();
    const python = process.env.KAUSHALIQ_PYTHON || "python";
    const base = "http://127.0.0.1:" + webPort;
    const backend = server(python, ["tests/provider_server.py", String(apiPort)], path.join(root, "backend"), "backend", { FRONTEND_URL: base, AUTH_SESSION_TTL: "8h", JWT_SECRET: "phase1-test-secret-more-than-32-characters", AUTH_DATABASE_PATH: path.join(authTestDir, "auth.sqlite3") });
    server(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort), "--strictPort"], frontend, "frontend", { API_PROXY_TARGET: "http://127.0.0.1:" + apiPort });
    await Promise.all([waitFor(base), waitFor("http://127.0.0.1:" + apiPort + "/api/health")]);
    for (const endpoint of ["/", "/api/health", "/openapi.json"]) {
      const response = await fetch("http://127.0.0.1:" + apiPort + endpoint);
      assert.equal(response.status, 200);
      const data = await response.json();
      if (endpoint === "/api/health") assert.equal(data.status, "ok");
      record("Backend GET " + endpoint + " returns 200");
    }
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const context = await browser.newContext();
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      return url.hostname === "127.0.0.1" || url.protocol === "data:" ? route.continue() : route.abort();
    });
    const page = await context.newPage(); await require("./verified-account.cjs").installVerifiedAccount(page, { base, apiPort }); require("./legacy-sample.cjs").installLegacySample(page);
  // Exercise actual system resolution instead of overriding production theme state.
  if (process.env.KAUSHALIQ_TEST_THEME) await page.emulateMedia({ colorScheme: process.env.KAUSHALIQ_TEST_THEME });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base + "/auth/signup");
    await page.getByLabel("Name", { exact: true }).fill("Phase 1 Analyst");
    await page.getByLabel("Email", { exact: true }).fill("phase1-workspace@example.in");
    await page.getByLabel("Password", { exact: true }).fill("Workspacepass9!");
    await page.getByLabel("Confirm password", { exact: true }).fill("Workspacepass9!");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.waitForURL(base + "/intelligence");
    for (const width of [1440, 1280, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + "/intelligence");
      await page.getByRole("heading", { name: "Labour Market Intelligence", exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "Horizontal page overflow at " + width);
      assert.equal(await page.evaluate(() => document.fonts.check('400 14px "Inter Variable"')), true);
      await page.screenshot({ animations: "disabled", path: path.join(output, "overview-" + width + ".png"), fullPage: true });
      record("Overview viewport " + width + "px", { horizontalOverflow: false, localFontLoaded: true });
    }
    for (const route of ["skills", "regions", "occupations", "industries", "demand", "forecast", "spatial", "reports"]) {
      await page.goto(base + "/" + route);
      await page.locator(".workspace-data-banner").waitFor();
      await page.reload();
      await page.locator(".workspace-data-banner").waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      record("Direct route and refresh /" + route);
    }
    await page.goto(base + "/missing");
    await page.getByRole("heading", { name: "This page is not available" }).waitFor();
    await page.getByRole("link", { name: "Return to overview" }).click();
    record("Unknown route recovery");
    await page.goto(base + "/intelligence"); // explicitly resume the legacy workflow after real-default recovery
    await page.setViewportSize({ width: 1440, height: 1000 });
    const search = page.getByRole("button", { name: "Search KaushalIQ", exact: true });
    await search.click();
    const input = page.getByRole("combobox", { name: "Search pages" });
    await input.waitFor();
    assert.equal(await input.evaluate(element => element === document.activeElement), true);
    await input.fill("nothingmatches");
    await page.getByText("No matching entities in the local demo catalog.", { exact: false }).waitFor();
    await input.fill("");
    await input.press("ArrowDown");
    await input.press("Enter");
    await page.waitForURL(base + "/skills");
    await page.getByRole("heading", { name: "Skill Intelligence", exact: true }).waitFor();
    await page.waitForFunction(() => document.activeElement === document.querySelector("h1"));
    assert.equal(await page.locator("h1").evaluate(element => element === document.activeElement), true);
    record("Palette empty results, arrows, Enter and route focus");
    await search.click();
    await page.getByRole("combobox", { name: "Search pages" }).press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(await search.evaluate(element => element === document.activeElement), true);
    record("Palette Escape restores trigger focus");
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox", { name: "Search pages" }).waitFor();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Meta+k");
    await page.getByRole("combobox", { name: "Search pages" }).waitFor();
    await page.getByRole("combobox", { name: "Search pages" }).fill("Regions");
    await page.screenshot({ animations: "disabled", path: path.join(output, "command-palette.png") });
    await page.keyboard.press("Enter");
    await page.waitForURL(base + "/regions");
    record("Ctrl/Cmd+K shortcuts and filtered navigation");
    await page.goBack();
    await page.waitForURL(base + "/skills");
    await page.goForward();
    await page.waitForURL(base + "/regions");
    record("Browser back and forward navigation");
    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.getByRole("button", { name: "Open navigation" });
    await menu.click();
    const drawer = page.getByRole("dialog");
    await drawer.waitFor();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      assert.equal(await drawer.evaluate(element => element.contains(document.activeElement)), true);
    }
    await page.screenshot({ animations: "disabled", path: path.join(output, "mobile-drawer.png") });
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(await menu.evaluate(element => element === document.activeElement), true);
    await menu.click();
    await drawer.getByRole("link", { name: "Forecast", exact: true }).click();
    await page.waitForURL(base + "/forecast");
    assert.equal(await page.getByRole("dialog").count(), 0);
    record("Mobile drawer focus containment, Escape, focus return and navigation");
    await page.goto(base + "/intelligence");
    await page.getByRole("button", { name: "About this preview" }).click();
    await page.getByText("No forecasting or AI engine is running.", { exact: false }).waitFor();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      assert.equal(await page.getByRole("dialog").evaluate(element => element.contains(document.activeElement)), true);
    }
    await page.screenshot({ animations: "disabled", path: path.join(output, "sample-disclosure.png"), fullPage: true });
    await page.getByRole("button", { name: "Got it" }).click();
    record("Sample disclosure dialog and focus containment");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.route("**/api/health", async route => {
      await new Promise(resolve => setTimeout(resolve, 400));
      await route.continue();
    });
    await page.getByRole("button", { name: "Check connection", exact: true }).click();
    await page.getByText("Checking the API service…").waitFor();
    record("Loading skeleton during actual health request");
    await page.getByText("KaushalIQ is reachable").waitFor();
    record("Real backend health via frontend proxy");
    await stop(backend);
    await page.getByRole("button", { name: "Check again" }).click();
    await page.getByRole("heading", { name: "Unable to reach the API" }).waitFor();
    await page.screenshot({ animations: "disabled", path: path.join(output, "connection-error.png"), fullPage: true });
    await page.getByRole("button", { name: "Try again" }).click();
    await page.getByRole("heading", { name: "Unable to reach the API" }).waitFor();
    record("Real unavailable-backend error and retry");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator(".page-content").evaluate(element => getComputedStyle(element).animationName), "none");
    record("Reduced motion disables entrance animation");
    assert.equal(await page.getByText("91.6%", { exact: false }).count(), 0);
    assert.equal(await page.getByText("Forecast Accuracy", { exact: false }).count(), 0);
    record("Unsupported accuracy claim absent");
    assert.deepEqual(errors, []);
    record("No uncaught browser exceptions");
    fs.writeFileSync(path.join(output, "browser-results.json"), JSON.stringify({ checks, errors }, null, 2));
  } catch (error) {
    fs.writeFileSync(path.join(output, "browser-results.json"), JSON.stringify({ checks, errors, failure: String(error) }, null, 2));
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    for (const child of servers) await stop(child);
    for (const log of logs) fs.closeSync(log);
    fs.rmSync(authTestDir, { recursive: true, force: true });
  }
})();
