const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { startStack } = require("./test-stack.cjs");
const frontend = path.resolve(__dirname, "..");
const output = process.env.KAUSHALIQ_TEST_OUTPUT ? path.resolve(process.env.KAUSHALIQ_TEST_OUTPUT) : path.resolve(frontend, "../docs/phase-2/implementation/phase-2.2-fixes-verification/localization");
fs.mkdirSync(output, { recursive: true });
const resource = name => {
 const source=fs.readFileSync(path.join(frontend,"src/app/i18n/locales/"+name+".ts"),"utf8");
 const entries=source.split(/\r?\n/).flatMap(line=>{const match=line.match(/^\s*("(?:\\.|[^"])*")\s*:\s*("(?:\\.|[^"])*")\s*,?\s*$/);return match?[[JSON.parse(match[1]),JSON.parse(match[2])]]:[];});
 return Object.fromEntries(entries);
};
const en = resource("en-IN"), hi = resource("hi-IN");
const checks = [], errors = [], dimensions = [];
let browser, stack;
const pass = name => {checks.push(name); console.log("PASS "+name);};
(async()=>{
 try {
  assert.deepEqual(Object.keys(en).sort(),Object.keys(hi).sort());
  for(const key of Object.keys(en)){assert.ok(hi[key].trim(),key);assert.deepEqual(en[key].match(/\{\w+\}/g),hi[key].match(/\{\w+\}/g),key);}
  pass("English/Hindi key and interpolation parity");
  stack=await startStack(frontend); const base=stack.base;
  browser=await chromium.launch({channel:"msedge",headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:"light"});
  const page=await context.newPage(); await require("./verified-account.cjs").installVerifiedAccount(page, stack);require("./legacy-sample.cjs").installLegacySample(page);page.on("pageerror",e=>errors.push(e.message));
  // Use accessible bilingual names so tests also validate localized ARIA labels.
  async function selectLanguage(label){await page.getByRole("button",{name:/^(Language|भाषा):/}).click();await page.getByRole("menuitemradio",{name:label,exact:true}).click();}
  async function noOverflow(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,page.url());}
  await page.goto(base);
  assert.equal(await page.locator("html").getAttribute("lang"),"en");
  assert.ok((await page.locator("h1").innerText()).includes(en["hero.title"]));
  await page.evaluate(()=>window.__localeNavigationSentinel=42);
  await selectLanguage("हिन्दी");
  assert.ok((await page.locator("h1").innerText()).includes(hi["hero.title"]));
  assert.equal(await page.locator("html").getAttribute("lang"),"hi");
  assert.equal(await page.evaluate(()=>window.__localeNavigationSentinel),42);
  assert.equal(await page.evaluate(()=>localStorage.getItem("kaushaliq.locale.v1")),"hi-IN");
  await page.reload();await page.getByRole("button",{name:"भाषा: हिन्दी"}).waitFor();
  assert.ok((await page.locator("h1").innerText()).includes(hi["hero.title"]));
  await selectLanguage("English");
  assert.ok((await page.locator("h1").innerText()).includes(en["hero.title"]));
  assert.equal(await page.evaluate(()=>localStorage.getItem("kaushaliq.locale.v1")),"en-IN");
  pass("English → Hindi → English updates content without reload; Hindi survives refresh");
  const regionLayer=page.getByRole("button",{name:en["hero.region"],exact:true});await regionLayer.click();assert.equal(await regionLayer.getAttribute("aria-pressed"),"true");await page.keyboard.press("Tab");pass("Hero relationship dimensions respond to click and remain keyboard accessible");
  await selectLanguage("हिन्दी");
  for(const route of ["/","/product","/how-it-works","/about","/contact","/documentation","/privacy","/terms"]){
   await page.goto(base+route);await page.locator("h1").waitFor();await page.reload();await page.locator("h1").waitFor();
   assert.match(await page.locator("h1").innerText(),/[\u0900-\u097f]/,route);
   // Remaining Latin prose indicates missed translation; brands and conventional key names are allowed.
   const text=await page.locator("body").innerText();
   const words=text.match(/[A-Za-z][A-Za-z -]{8,}/g)||[];
   assert.deepEqual(words.filter(v=>!["KaushalIQ","GitHub"].includes(v.trim())),[],route+" untranslated text");
   await noOverflow();
  }
  await page.goto(base+"/auth/signup");await page.getByLabel(hi["auth.name"],{exact:true}).fill("Hindi Test Analyst");await page.getByLabel(hi["auth.email"],{exact:true}).fill("localization-workspace@example.in");await page.getByLabel(hi["auth.password"],{exact:true}).fill("Workspacepass9!");await page.getByLabel(hi["auth.confirm"],{exact:true}).fill("Workspacepass9!");await page.getByRole("button",{name:hi["auth.create"],exact:true}).click();await page.waitForURL(base+"/intelligence");
  for(const route of ["/intelligence","/skills","/regions","/occupations","/industries","/demand","/forecast","/spatial","/reports"]){
   await page.goto(base+route);await page.locator("h1").waitFor();await page.reload();await page.locator("h1").waitFor();assert.match(await page.locator("h1").innerText(),/[\u0900-\u097f]/,route);const text=await page.locator("body").innerText();const words=text.match(/[A-Za-z][A-Za-z -]{8,}/g)||[];assert.deepEqual(words.filter(v=>!["KaushalIQ","GitHub","Hindi Test Analyst"].includes(v.trim())),[],route+" untranslated text");await noOverflow();
  }
  pass("All public and workspace routes have Hindi content, direct loads and refresh");
  await page.goto(base+"/?auth=signup");
  await page.getByRole("button",{name:hi["auth.create"]||hi["common.create"],exact:true}).count().catch(()=>{});
  await page.locator(".auth-submit").click();
  assert.match(await page.locator(".field-error").first().innerText(),/[\u0900-\u097f]/);
  // Cross-tab preference sync must also translate existing errors, without erasing entered values.
  await page.locator('input[name="email"]').fill("preview@example.com");
  await page.locator(".auth-submit").click();
  const other=await context.newPage();await other.goto(base);
  await other.getByRole("button",{name:"भाषा: हिन्दी"}).click();await other.getByRole("menuitemradio",{name:"English",exact:true}).click();
  await page.getByLabel("Email",{exact:true}).waitFor();
  assert.equal(await page.getByLabel("Email",{exact:true}).inputValue(),"preview@example.com");
  assert.match(await page.locator(".field-error").first().innerText(),/[A-Za-z]/);
  await other.getByRole("button",{name:"Language: English"}).click();await other.getByRole("menuitemradio",{name:"हिन्दी",exact:true}).click();
  await page.getByLabel(hi["auth.email"],{exact:true}).waitFor();
  await page.screenshot({path:path.join(output,"hindi-auth-errors.png"),animations:"disabled"});
  await other.close();await page.keyboard.press("Escape");
  await page.goto(base+"/intelligence");await page.locator("h1").waitFor();await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: hi["search.pages"] }).fill(hi["common.skills"]);
  await page.keyboard.press("Enter");await page.waitForURL(base+"/skills");
  await page.goBack();await page.waitForURL(base+"/intelligence");await page.goForward();await page.waitForURL(base+"/skills");
  pass("Auth fields/errors react to language without resetting values; Hindi command search and history");
  for(const locale of ["hi","en"]){
   await page.goto(base);if(locale==="en")await selectLanguage("English");
   for(const mode of ["dark","light"]){
    await page.evaluate(mode=>window.kaushaliqTheme.setPreference(mode),mode);
    for(const width of [1440,1280,1024,768,390]){
     await page.setViewportSize({width,height:1000});await page.goto(base);await page.evaluate(()=>document.fonts.ready);await noOverflow();
     const footer=page.locator(".public-footer");await footer.scrollIntoViewIfNeeded();
     const box=await footer.boundingBox();dimensions.push({locale,mode,width,height:box.height});
     const maxFooterHeight = width >= 1280 ? 390 : width === 768 || width === 1024 ? 540 : 610;
     assert.ok(box.height < maxFooterHeight, `Footer is too tall at ${width}px (${locale}/${mode}): ${box.height}px`);
     
     await footer.screenshot({path:path.join(output,locale+"-"+mode+"-footer-"+width+".png"),animations:"disabled"});
     await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,locale+"-"+mode+"-public-"+width+".png"),animations:"disabled"});
    }
   }
   await page.setViewportSize({width:1440,height:1000});
  }
  pass("Compact footer and public layout in both languages/themes at 1440, 768, 390; no overflow");
  await page.goto(base);const social=page.locator(".footer-connect");
  const github=social.getByRole("link",{name:/GitHub/});assert.equal(await github.getAttribute("href"),"https://github.com/harsh5ingh/kaushaliq");
  assert.equal(await social.locator("a[target=\"_blank\"]").count(),1);
  assert.equal(await github.getAttribute("rel"),"noopener noreferrer");
  assert.notEqual(await github.locator(".social-icon").evaluate(e=>getComputedStyle(e).maskImage),"none");
  // Verify activation without making an external request.
  await context.route("https://github.com/**",route=>route.fulfill({status:200,contentType:"text/plain",body:"External destination intercepted by test"}));
  await github.focus();assert.equal(await github.evaluate(e=>e===document.activeElement),true);
  const popupPromise=context.waitForEvent("page");await page.keyboard.press("Enter");const popup=await popupPromise;await popup.waitForLoadState();
  assert.equal(popup.url(),"https://github.com/harsh5ingh/kaushaliq");await popup.close();
  pass("Only configured GitHub shown, official icon rendered, keyboard opens safe external destination");
  await selectLanguage("हिन्दी");
  for(const width of [1440,1280,1024,768,390]){
   await page.setViewportSize({width,height:1000});await page.goto(base+"/intelligence");await noOverflow();
   await page.screenshot({path:path.join(output,"hindi-workspace-"+width+".png"),animations:"disabled"});
  }
  await page.goto(base);
  await page.getByRole("button",{name:hi["navigation.openProduct"]}).click();
  const dialog=page.getByRole("dialog");await dialog.waitFor();
  await page.getByRole("button",{name:"भाषा: हिन्दी"}).click();await page.keyboard.press("ArrowUp");await page.keyboard.press("Enter");
  await page.getByRole("button",{name:"Language: English"}).waitFor();
  await page.getByRole("button",{name:/^Appearance:/}).click();await page.getByRole("menuitemradio",{name:"System",exact:true}).click();
  await page.emulateMedia({colorScheme:"dark"});await page.waitForFunction(()=>document.documentElement.dataset.theme==="dark");
  await page.emulateMedia({colorScheme:"light"});await page.waitForFunction(()=>document.documentElement.dataset.theme==="light");
  for(let i=0;i<18;i++){await page.keyboard.press("Tab");assert.equal(await dialog.evaluate(e=>e.contains(document.activeElement)),true);}
  await page.screenshot({path:path.join(output,"mobile-menu.png"),animations:"disabled"});
  await page.keyboard.press("Escape");await dialog.waitFor({state:"hidden"});
  assert.equal(await page.getByRole("button",{name:"Open product navigation"}).evaluate(e=>e===document.activeElement),true);
  await page.emulateMedia({reducedMotion:"reduce"});await page.reload();
  assert.equal(await page.locator(".home-hero-copy").evaluate(e=>getComputedStyle(e).animationName),"none");
  pass("Hindi workspace five widths, mobile language keyboard, focus trap/restoration, System OS updates and reduced motion");
  assert.deepEqual(errors,[]);
 }catch(e){errors.push(String(e));console.error(e);process.exitCode=1;}
 finally{fs.writeFileSync(path.join(output,"results.json"),JSON.stringify({checks,errors,dimensions},null,2));if(browser)await browser.close();if(stack)await stack.stop();}
})();
