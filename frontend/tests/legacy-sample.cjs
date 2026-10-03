// Earlier suites validate the retained Phase2.4 simulation, now explicitly opt-in.
// Authentication redirects are verified first, then the fixture selects sample mode.
const workspace = new Set(["/intelligence", "/skills", "/regions", "/occupations", "/industries", "/demand", "/forecast", "/spatial", "/reports"]);
function sampleUrl(value) { const url = new URL(value); if (workspace.has(url.pathname)) url.searchParams.set("data", "sample"); return url.href; }
function withoutMode(value) { const url = new URL(value); url.searchParams.delete("data"); return url.href; }
function installLegacySample(page, { selectAfterAuth = true } = {}) {
  const goto = page.goto.bind(page), wait = page.waitForURL.bind(page);
  page.goto = (url, options) => goto(sampleUrl(url), options);
  page.waitForURL = async (expected, options) => {
    const result = await wait(url => { const value = withoutMode(url.href); return typeof expected === "string" ? value === withoutMode(expected) : expected instanceof RegExp ? expected.test(value) : expected(new URL(value)); }, options);
    const url = new URL(page.url());
    if (selectAfterAuth && workspace.has(url.pathname) && !url.searchParams.has("data")) await goto(sampleUrl(url.href));
    return result;
  };
}
module.exports = { installLegacySample };
