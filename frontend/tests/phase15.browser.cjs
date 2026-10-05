const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { startStack } = require("./test-stack.cjs");
const frontend = path.resolve(__dirname, "..");
const output = process.env.KAUSHALIQ_TEST_OUTPUT ? path.resolve(process.env.KAUSHALIQ_TEST_OUTPUT) : path.resolve(frontend, "../docs/phase-1.5/verification");
fs.mkdirSync(output, { recursive: true });
const checks = [], errors = [];
let browser, stack;
const pass = text => { checks.push(text); console.log("PASS " + text); };
(async () => {
  try {
    stack = await startStack(frontend);
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const context = await browser.newContext(); const page = await context.newPage(); await require("./verified-account.cjs").installVerifiedAccount(page, stack); require("./legacy-sample.cjs").installLegacySample(page);
    page.on("pageerror", error => errors.push(error.message));
    for (const width of [1440, 1280, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 960 }); await page.goto(stack.base);
      await page.getByRole("heading", { name: "India’s Labour Market Intelligence Layer" }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const logo = page.locator(".public-navbar .brand-image"); assert.equal(await logo.evaluate(element => element.complete && element.naturalWidth > 0), true);
      await page.screenshot({ path: path.join(output, `homepage-${width}.png`), fullPage: true, animations: "disabled" });
    }
    pass("Public homepage and official responsive logo variants fit all required viewport widths");
    for (const route of ["/product", "/how-it-works", "/about", "/contact", "/documentation", "/privacy", "/terms"]) {
      await page.goto(stack.base + route); await page.locator("h1").waitFor(); await page.reload(); await page.locator("h1").waitFor();
    }
    pass("Existing public pages render directly and survive refresh");
    await page.goto(stack.base + "/intelligence"); await page.locator('.workspace-header').waitFor();
    await page.goto(stack.base + "/profile"); await page.waitForURL(/\/auth\/signin/);
    assert.match(page.url(), /auth\/signin/);
    pass("Public intelligence is open; private profile keeps authentication and requested destination");

    await page.setViewportSize({ width: 1440, height: 960 }); await page.goto(stack.base + "/");
    const signInLink = page.getByRole("link", { name: "Sign in", exact: true }); await signInLink.focus(); await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog"); await dialog.waitFor();
    await page.getByLabel("Email", { exact: true }).waitFor();
    for (let i = 0; i < 15; i++) { await page.keyboard.press("Tab"); assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true); }
    for (let i = 0; i < 15; i++) { await page.keyboard.press("Shift+Tab"); assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true); }
    await page.screenshot({ path: path.join(output, "auth-login.png"), fullPage: true, animations: "disabled" });
    await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
    assert.equal(await signInLink.evaluate(el => el === document.activeElement), true);
    pass("Auth dialog keyboard trap, Escape and focus restoration work");

    await page.goto(stack.base + "/auth/signup");
    await page.getByRole("button", { name: "Continue with Google" }).waitFor();
    for (const provider of ["Google", "GitHub"]) assert.equal(await page.getByRole("button", { name: `Continue with ${provider}` }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: /Facebook/i }).count(), 0);
    assert.equal(await page.locator(".social-auth svg").count(), 2);
    await page.getByLabel("Name", { exact: true }).fill("Preview User"); await page.getByLabel("Email", { exact: true }).fill("phase15@example.in");
    await page.getByLabel("Password", { exact: true }).fill("weak"); await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByText("Use 8+ characters with uppercase, lowercase, a number and a special character.", { exact: true }).waitFor();
    await page.getByLabel("Password", { exact: true }).fill("Productpass9!"); await page.getByLabel("Confirm password", { exact: true }).fill("mismatchpass9");
    await page.getByText("Passwords do not match.", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, "auth-validation.png"), fullPage: true, animations: "disabled" });
    await page.getByLabel("Confirm password", { exact: true }).fill("Productpass9!"); await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.waitForURL(stack.base + "/intelligence"); await page.locator(".workspace-data-banner").getByText("Simulated", { exact: false }).waitFor();
    const cookies = await context.cookies(stack.base); assert.equal(cookies.find(value => value.name === "kaushaliq_session")?.httpOnly, true);
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    pass("Real email account creation enters the workspace without exposing session tokens or persisting passwords in browser storage");

    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(stack.base);
    const menu = page.getByRole("button", { name: "Open product navigation" }); await menu.click();
    const mobile = page.getByRole("dialog", { name: "Explore KaushalIQ" }); await mobile.waitFor();
    await page.keyboard.press("Escape"); await mobile.waitFor({ state: "hidden" }); assert.equal(await menu.evaluate(el => el === document.activeElement), true);
    await page.getByRole("button", { name: "Open account menu" }).click(); await page.getByRole("link", { name: "Settings", exact: true }).click(); await page.waitForURL(/\/settings/);
    await page.goto(stack.base + "/intelligence"); await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator(".page-content").evaluate(el => getComputedStyle(el).animationName), "none");
    await page.screenshot({ path: path.join(output, "workspace-mobile.png"), fullPage: true, animations: "disabled" });
    await page.setViewportSize({ width: 1440, height: 960 }); await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click(); await page.waitForURL(stack.base + "/");
    await page.goto(stack.base + "/profile"); await page.waitForURL(/\/auth\/signin/);
    assert.deepEqual(errors, []);
    pass("Responsive navigation, account menu routes, reduced motion, sign-out and protected-route behavior work without uncaught browser errors");
  } catch (error) { errors.push(String(error)); console.error(error); process.exitCode = 1; }
  finally { fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ checks, errors }, null, 2)); if (browser) await browser.close(); if (stack) await stack.stop(); }
})();
