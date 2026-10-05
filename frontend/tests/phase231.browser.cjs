const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { startStack } = require("./test-stack.cjs");

const frontend = path.resolve(__dirname, "..");
const output = path.resolve(frontend, "../docs/phase-2.3.1-verification");
fs.mkdirSync(output, { recursive: true });
const checks = [], errors = [];
let browser, stack;
const pass = (message) => { checks.push(message); console.log("PASS " + message); };
const noOverflow = async (page, width) => { const ok = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth); assert.equal(ok, true, `horizontal overflow at ${width}px`); };

(async () => {
  try {
    stack = await startStack(frontend);
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
    const page = await context.newPage(); await require("./verified-account.cjs").installVerifiedAccount(page, stack); require("./legacy-sample.cjs").installLegacySample(page, { selectAfterAuth: false }); page.on("pageerror", error => errors.push(error.message));

    await page.goto(`${stack.base}/profile`);
    await page.waitForURL(/\/auth\/signin/);
    await page.getByLabel("Email", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    await noOverflow(page, 1440);
    await page.screenshot({ path: path.join(output, "signin-desktop-dark.png"), fullPage: true, animations: "disabled" });
    pass("Protected private account routes send unauthenticated visitors to sign-in with the original route retained");

    await page.goto(`${stack.base}/auth/signup`);
    await page.getByRole("button", { name: "Continue with Google" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Continue with Google" }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Continue with GitHub" }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: /Facebook/i }).count(), 0);
    assert.equal(await page.locator(".social-auth svg").count(), 2);
    await page.getByLabel("Name", { exact: true }).fill("SIH Test Analyst");
    await page.getByLabel("Email", { exact: true }).fill("sih-test@example.in");
    await page.getByLabel("Password", { exact: true }).fill("weak");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByText("Use 8+ characters with uppercase, lowercase, a number and a special character.", { exact: true }).waitFor();
    await page.getByLabel("Password", { exact: true }).fill("Workforcepass9!");
    await page.getByLabel("Confirm password", { exact: true }).fill("doesnotmatch9");
    await page.getByText("Passwords do not match.", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, "signup-validation.png"), fullPage: true, animations: "disabled" });
    await page.getByLabel("Confirm password", { exact: true }).fill("Workforcepass9!");
    await page.screenshot({ path: path.join(output, "signup-desktop-dark.png"), fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.waitForURL(`${stack.base}/intelligence`); await page.goto(stack.base + "/intelligence");
    await page.locator(".workspace-data-banner").getByText("simulated", { exact: false }).waitFor();
    const cookies = await context.cookies(stack.base);
    const sessionCookie = cookies.find(cookie => cookie.name === "kaushaliq_session");
    assert.ok(sessionCookie?.httpOnly, "session cookie must be HttpOnly");
    assert.equal(sessionCookie?.secure, false, "local HTTP test should not set Secure");
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    const userRecord = execFileSync(process.env.PYTHON || "python", ["-c", "import sqlite3,sys; r=sqlite3.connect(sys.argv[1]).execute('select password_hash from users where email=?',(sys.argv[2],)).fetchone(); print(bytes(r[0]).decode())", stack.database, "sih-test@example.in"], { encoding: "utf8" }).trim();
    assert.match(userRecord, /^\$2b\$12\$/); assert.notEqual(userRecord, "Workforcepass9!");
    pass("Signup applies server-side validation, BCrypt-12 stores only a password hash, and an HttpOnly session cookie authenticates the user");

    const session = await page.evaluate(async () => (await fetch("/api/auth/session", { credentials: "include" })).json());
    assert.equal(session.authenticated, true); assert.equal(session.user.email, "sih-test@example.in");
    const more = page.locator(".workspace-more > summary"); await more.focus(); await page.keyboard.press("Enter");
    await page.getByRole("link", { name: "Forecast", exact: true }).waitFor();
    await page.getByRole("link", { name: "Forecast", exact: true }).click(); await page.waitForURL(/\/forecast$/);
    await page.reload(); await page.locator(".workspace-data-banner").waitFor();
    for (const route of ["/intelligence", "/skills", "/regions", "/occupations", "/industries", "/demand", "/forecast", "/spatial", "/reports", "/profile", "/settings", "/help"]) {
      await page.goto(stack.base + route); await page.locator(".workspace-header").waitFor(); await page.locator(".page-heading h1").waitFor();
      await noOverflow(page, 1440);
    }
    pass("All existing intelligence routes and new account routes render through the top application shell");

    await page.goto(stack.base + "/intelligence");
    const avatar = page.getByRole("button", { name: "Open account menu" });
    await avatar.click(); await page.getByRole("link", { name: "Profile", exact: true }).waitFor();
    await page.keyboard.press("Escape"); assert.equal(await avatar.evaluate(element => element === document.activeElement), true);
    await avatar.click(); await page.getByRole("link", { name: "Profile", exact: true }).click(); await page.waitForURL(/\/profile$/);
    await page.getByText("sih-test@example.in", { exact: true }).waitFor();
    await page.goto(stack.base + "/settings"); const settingsPreferences = page.locator(".account-settings .product-preferences").first();
    await settingsPreferences.getByRole("button", { name: "Appearance: System" }).waitFor();
    await settingsPreferences.getByRole("button", { name: "Appearance: System" }).click(); await page.getByRole("menuitemradio", { name: "Light", exact: true }).last().click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
    await settingsPreferences.getByRole("button", { name: "Language: English" }).click(); await page.getByRole("menuitemradio", { name: "हिन्दी", exact: true }).last().click();
    await page.getByRole("heading", { name: "सेटिंग्स", exact: true }).waitFor(); await page.reload();
    await page.getByRole("heading", { name: "सेटिंग्स", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
    assert.equal(await page.locator("html").getAttribute("lang"), "hi");
    await page.screenshot({ path: path.join(output, "settings-hindi-light.png"), fullPage: true, animations: "disabled" });
    await page.goto(stack.base + "/help"); await page.getByRole("link", { name: "दस्तावेज़" }).waitFor();
    await page.goto(stack.base + "/intelligence"); await noOverflow(page, 1440);
    pass("Profile menu supports Escape/focus restoration and Profile/Settings/Help; theme and Hindi preference persist through refresh");

    for (const width of [1440, 1280, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(stack.base + "/intelligence"); await page.locator(".workspace-data-banner").waitFor(); await page.locator(".workspace-metric").first().waitFor(); await noOverflow(page, width);
      if (width < 1200) {
        const menu = page.locator(".workspace-header .mobile-menu");
        await menu.click(); const drawer = page.getByRole("dialog", { name: "कार्यक्षेत्र नेविगेशन" }); await drawer.waitFor();
        // Phase 5 adds two public intelligence destinations; all eleven Phase 3 destinations remain.
        assert.equal(await drawer.locator(".nav-link").count(), 13);
        assert.equal(await drawer.locator('.nav-link[href^="/early-warning"]').count(), 1);
        assert.equal(await drawer.locator('.nav-link[href^="/scenarios"]').count(), 1);
        assert.equal(await drawer.locator('.nav-link[href="/supply?data=sample"]').count(), 1);
        await page.keyboard.press("Escape"); await drawer.waitFor({ state: "hidden" });
        assert.equal(await menu.evaluate(element => element === document.activeElement), true);
      }
      await page.screenshot({ path: path.join(output, `workspace-${width}-light-hi.png`), fullPage: true, animations: "disabled" });
    }
    pass("Workspace shell is usable without a permanent sidebar at 1440, 1280, 1024, 768 and 390px; mobile drawer closes with Escape");

    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(stack.base + "/auth/signin"); await noOverflow(page, 390);
    await page.screenshot({ path: path.join(output, "signin-mobile-light-hi.png"), fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "भाषा: हिन्दी" }).click(); await page.getByRole("menuitemradio", { name: "English", exact: true }).click();
    await page.getByLabel("Email", { exact: true }).fill("sih-test@example.in"); await page.getByLabel("Password", { exact: true }).fill("wrongpass9");
    await page.getByRole("button", { name: "Sign in", exact: true }).click(); await page.getByText("Email or password is incorrect.", { exact: true }).waitFor();
    await page.getByLabel("Password", { exact: true }).fill("Workforcepass9!");
    await page.route("**/api/auth/login", async route => {
      const response = await route.fetch(); const json = await response.json(); json.expiresAt = new Date(Date.now() + 2500).toISOString();
      await route.fulfill({ response, body: JSON.stringify(json) });
    });
    await page.getByRole("button", { name: "Sign in", exact: true }).click(); await page.waitForURL(/\/intelligence$/);
    await page.getByRole("button", { name: "Open account menu" }).click(); await page.getByRole("link", { name: "Profile", exact: true }).click();
    await page.getByText("Your session has expired. Please sign in again.", { exact: true }).waitFor({ timeout: 5000 });
    assert.match(page.url(), /reason=expired/);
    pass("Login rejects invalid credentials; eight-hour session timeout UX redirects with an explicit expiry message");

    // Sign in once more to validate backend logout revocation and route protection.
    await page.unroute("**/api/auth/login");
    await page.goto(stack.base+"/auth/signin");
    await page.getByLabel("Email", { exact: true }).fill("sih-test@example.in"); await page.getByLabel("Password", { exact: true }).fill("Workforcepass9!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click(); await page.waitForURL(/\/intelligence$/);
    execFileSync(process.env.PYTHON || "python", ["-c", "import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); db.execute(\"update sessions set expires_at='2000-01-01T00:00:00+00:00' where revoked_at is null\"); db.commit()", stack.database], { encoding: "utf8" });
    await page.goto(stack.base+'/profile'); await page.waitForURL(/\/auth\/signin\?reason=expired/);
    await page.getByText("Your session has expired. Please sign in again.", { exact: true }).waitFor();
    pass("Server-side expiry rejects a still-signed JWT when its tracked session has expired");
    await page.goto(stack.base+'/auth/signin'); await page.getByLabel("Email", { exact: true }).fill("sih-test@example.in"); await page.getByLabel("Password", { exact: true }).fill("Workforcepass9!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click(); await page.waitForURL(/\/intelligence$/);
    await page.getByRole("button", { name: "Open account menu" }).click(); await page.getByRole("button", { name: "Sign out", exact: true }).click(); await page.waitForURL(`${stack.base}/`);
    const signedOut = await page.evaluate(async () => (await fetch("/api/auth/session", { credentials: "include" })).json()); assert.equal(signedOut.authenticated, false);
    await page.goto(stack.base + "/profile"); await page.waitForURL(/\/auth\/signin/);
    await page.setViewportSize({ width: 1440, height: 960 }); await page.goto(stack.base + "/?auth=login"); const dialog = page.getByRole("dialog"); await dialog.waitFor();
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), "hidden");
    await page.getByRole("button", { name: "Forgot password?" }).click(); await page.getByText("Password recovery is not available yet.", { exact: false }).waitFor();
    const backToLogin = page.getByRole("button", { name: "Back to sign in", exact: true }); await backToLogin.waitFor(); assert.equal(await backToLogin.evaluate(element => element === document.activeElement), true);
    await backToLogin.click(); await page.getByLabel("Email", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, "auth-modal-desktop.png"), fullPage: true, animations: "disabled" });
    assert.equal(await page.locator(".auth-modal").evaluate(el => getComputedStyle(el).overflowY), "hidden");
    await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), "hidden");
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(stack.base + "/?auth=signup"); await page.getByLabel("Confirm password", { exact: true }).waitFor();
    await noOverflow(page, 390); await page.screenshot({ path: path.join(output, "auth-modal-mobile.png"), fullPage: true, animations: "disabled" });
    assert.equal(await page.locator(".auth-modal").evaluate(el => getComputedStyle(el).overflowY), "hidden");
    await page.keyboard.press("Escape"); await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.deepEqual(errors, []);
    pass("Logout revokes backend session, clears cookie, and protected routes require sign-in; auth modal keeps header visible without nested scrolling");
  } catch (error) { errors.push(String(error)); console.error(error); process.exitCode = 1; }
  finally {
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ checks, errors }, null, 2));
    if (browser) await browser.close(); if (stack) await stack.stop();
  }
})();
