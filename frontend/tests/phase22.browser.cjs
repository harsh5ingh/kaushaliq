const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { startStack } = require("./test-stack.cjs");
const frontend = path.resolve(__dirname, "..");
const output = process.env.KAUSHALIQ_TEST_OUTPUT ? path.resolve(process.env.KAUSHALIQ_TEST_OUTPUT) : path.resolve(frontend, "../docs/phase-2/implementation/phase-2.2-fixes-verification/preferences");
fs.mkdirSync(output, { recursive: true });
const checks = [], errors = [];
let browser, stack;
function pass(name) { checks.push(name); console.log("PASS " + name); }
(async () => {
 try {
  stack=await startStack(frontend); const base=stack.base;
  browser=await chromium.launch({channel:"msedge",headless:true});
  const context=await browser.newContext({colorScheme:"light",viewport:{width:1440,height:1000}});
  const page=await context.newPage(); await require("./verified-account.cjs").installVerifiedAccount(page, stack);require("./legacy-sample.cjs").installLegacySample(page);
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base+"/auth/signup");await page.getByLabel("Name",{exact:true}).fill("Phase 2.2 Analyst");await page.getByLabel("Email",{exact:true}).fill("phase22-workspace@example.in");await page.getByLabel("Password",{exact:true}).fill("Workspacepass9!");await page.getByLabel("Confirm password",{exact:true}).fill("Workspacepass9!");await page.getByRole("button",{name:"Create account",exact:true}).click();await page.waitForURL(base+"/intelligence");
  const theme=()=>page.evaluate(()=>window.kaushaliqTheme.getSnapshot());
  const appearance=()=>page.getByRole("button",{name:/^Appearance:/});
  async function choose(name){await appearance().click();await page.getByRole("menuitemradio",{name,exact:true}).click();}
  await page.goto(base);
  assert.deepEqual(await theme(),{preference:"system",resolved:"light"});
  assert.equal(await page.evaluate(()=>localStorage.length),0);
  assert.equal(await page.getByRole("button",{name:"Language: English"}).count(),1);
  pass("First visit defaults to System and English without writing storage");
  await choose("Dark"); assert.deepEqual(await theme(),{preference:"dark",resolved:"dark"});
  assert.equal(await page.evaluate(()=>localStorage.getItem("kaushaliq.theme.v1")),"dark");
  await page.reload();assert.equal((await theme()).resolved,"dark");
  await page.emulateMedia({colorScheme:"light"});assert.equal((await theme()).resolved,"dark");
  await choose("Light");await page.emulateMedia({colorScheme:"dark"});assert.deepEqual(await theme(),{preference:"light",resolved:"light"});
  await choose("System");assert.deepEqual(await theme(),{preference:"system",resolved:"dark"});
  await page.emulateMedia({colorScheme:"light"});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==="light");
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute("content"),"#F7F5EF");
  pass("Light/Dark/System selection, persistence, refresh, explicit override and live OS updates");

  await appearance().focus();await page.keyboard.press("ArrowDown");
  assert.equal(await page.getByRole("menuitemradio",{name:"System",exact:true}).evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press("Home");await page.keyboard.press("ArrowDown");await page.keyboard.press("Enter");
  assert.equal((await theme()).preference,"dark");
  assert.equal(await appearance().evaluate(e=>e===document.activeElement),true);
  await appearance().click();await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("menu").count(),0);
  assert.equal(await appearance().evaluate(e=>e===document.activeElement),true);
  await appearance().click();await page.keyboard.press("Tab");assert.equal(await page.getByRole("menu").count(),0);
  await appearance().click();await page.locator("h1").click();assert.equal(await page.getByRole("menu").count(),0);
  await appearance().focus();await page.keyboard.press("Tab");await page.keyboard.press("Shift+Tab");assert.notEqual(await appearance().evaluate(e=>getComputedStyle(e).outlineStyle),"none");
  pass("Preference keyboard arrows/Home/Enter, Tab exit, Escape, outside dismissal and focus");

  await page.getByRole("button",{name:"Language: English"}).click();
  await page.getByRole("menuitemradio",{name:"हिन्दी",exact:true}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem("kaushaliq.locale.v1")),"hi-IN");
  await page.reload();await page.getByRole("button",{name:"भाषा: हिन्दी"}).waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"),"hi");
  await page.getByRole("button",{name:"भाषा: हिन्दी"}).click();
  await page.getByText("इंटरफ़ेस की भाषा चुनें।",{exact:true}).waitFor();
  await page.screenshot({animations:"disabled",path:path.join(output,"language-open.png")});
  await page.keyboard.press("Escape");
  pass("Hindi persists and updates html language, native names and translated disclosure");

  const other=await context.newPage();await other.goto(base);
  await other.evaluate(()=>window.kaushaliqTheme.setPreference("light"));
  await page.waitForFunction(()=>document.documentElement.dataset.theme==="light");
  await other.evaluate(()=>localStorage.removeItem("kaushaliq.theme.v1"));
  await page.waitForFunction(()=>window.kaushaliqTheme.getSnapshot().preference==="system");
  await other.evaluate(()=>localStorage.setItem("kaushaliq.locale.v1","en-IN"));
  await page.getByRole("button",{name:"Language: English"}).waitFor();
  await other.close();
  pass("Cross-tab theme/locale synchronization and theme deletion fallback");

  await choose("Dark");await appearance().click();
  await page.screenshot({animations:"disabled",path:path.join(output,"theme-open.png")});await page.keyboard.press("Escape");
  for(const mode of ["dark","light"]){
    await page.evaluate(mode=>window.kaushaliqTheme.setPreference(mode),mode);
    for(const width of [1440,1280,1024,768,390]){
      await page.setViewportSize({width,height:1000});
      for(const route of ["/","/intelligence"]){
        await page.goto(base+route);await page.locator("h1").waitFor();await page.evaluate(()=>document.fonts.ready);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,mode+" "+width+" "+route);
        if(route==="/"){
          const boxes=await page.locator(".public-nav-inner > *").evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=="none").map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right};}));
          for(let i=1;i<boxes.length;i++)assert.ok(boxes[i].left>=boxes[i-1].right,"Navbar collision at "+width);
        }
        await page.screenshot({animations:"disabled",path:path.join(output,mode+"-"+(route==="/"?"public":"workspace")+"-"+width+".png")});
      }
    }
  }
  pass("Public and workspace chrome screenshots, collision and overflow checks at five widths in both themes");
  await page.setViewportSize({width:390,height:844});await page.goto(base);
  const menu=page.getByRole("button",{name:"Open product navigation"});
  const before=await page.locator(".public-nav-inner").boundingBox();await menu.click();
  const dialog=page.getByRole("dialog");await dialog.waitFor();
  assert.deepEqual(await page.locator(".public-nav-inner").boundingBox(),before);
  await appearance().click();await page.keyboard.press("Escape");
  assert.equal(await dialog.count(),1);assert.equal(await page.getByRole("menu").count(),0);
  await page.getByRole("button",{name:"Language: English"}).click();
  await page.getByRole("menuitemradio",{name:"हिन्दी",exact:true}).click();
  for(let i=0;i<18;i++){await page.keyboard.press("Tab");assert.equal(await dialog.evaluate(e=>e.contains(document.activeElement)),true);}
  await page.screenshot({animations:"disabled",path:path.join(output,"mobile-navigation-open.png")});
  await page.keyboard.press("Escape");await dialog.waitFor({state:"hidden"});
  assert.equal(await page.getByRole("button",{name:"उत्पाद नेविगेशन खोलें"}).evaluate(e=>e===document.activeElement),true);
  await page.setViewportSize({width:1440,height:1000});await page.getByRole("button",{name:"भाषा: हिन्दी"}).click();await page.getByRole("menuitemradio",{name:"English",exact:true}).click();
  pass("Mobile preferences, nested Escape, focus containment/restoration and stable header geometry");

  await page.setViewportSize({width:1440,height:1000});await page.goto(base+"/product");
  assert.equal(await page.locator(".public-desktop-links").getByRole("link",{name:"Product",exact:true}).getAttribute("aria-current"),"page");
  await page.goto(base+"/skills");
  assert.equal(await page.getByRole("link",{name:"Skills",exact:true}).getAttribute("aria-current"),"page");
  await page.getByRole("link",{name:"KaushalIQ home",exact:true}).click();await page.waitForURL(base+"/");
  await page.goBack();await page.waitForURL(base+"/skills");await page.goForward();await page.waitForURL(base+"/");
  await page.goto(base+"/?auth=login");const email=page.getByLabel("Email",{exact:true});await email.fill("preview@example.com");await email.focus();
  await page.evaluate(()=>window.kaushaliqTheme.setPreference("dark"));
  assert.equal(await email.inputValue(),"preview@example.com");assert.equal(await email.evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press("Escape");
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto(base);
  assert.equal(await page.locator(".home-hero-copy").evaluate(e=>getComputedStyle(e).animationName),"none");
  pass("Active links, Website utility, history, auth field/focus preservation across themes and reduced motion");

  for(const stored of [null,"dark","light","invalid"]){
    const boot=await browser.newContext({colorScheme:"light"});
    await boot.addInitScript(value=>{if(value!==null)localStorage.setItem("kaushaliq.theme.v1",value);},stored);
    const p=await boot.newPage();await p.route("**/src/main.tsx*",r=>r.abort());await p.goto(base);
    assert.equal(await p.locator("html").getAttribute("data-theme"),stored==="dark"?"dark":"light");
    assert.equal(await p.locator("#root").innerHTML(),"");
    await boot.close();
  }
  pass("Early theme bootstrap resolves stored/default/invalid preferences before React loads");
  const blocked=await browser.newContext({colorScheme:"dark"});
  await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException("Blocked","SecurityError");};Storage.prototype.setItem=()=>{throw new DOMException("Blocked","SecurityError");};});
  const p=await blocked.newPage();p.on("pageerror",e=>errors.push(e.message));await p.goto(base);
  await p.getByRole("button",{name:"Appearance: System"}).click();await p.getByRole("menuitemradio",{name:"Light",exact:true}).click();
  assert.equal(await p.locator("html").getAttribute("data-theme"),"light");
  await p.getByRole("button",{name:"Language: English"}).click();await p.getByRole("menuitemradio",{name:"हिन्दी",exact:true}).click();
  await p.getByRole("button",{name:"भाषा: हिन्दी"}).waitFor();await blocked.close();
  pass("Blocked storage retains working in-memory theme and language preferences");
  assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).sort()),["kaushaliq.locale.v1","kaushaliq.theme.v1"]);
  assert.equal(await page.evaluate(()=>sessionStorage.length),0);
  assert.deepEqual(errors,[]);pass("Only named preference keys stored; no session writes or uncaught exceptions");
 } catch(e){errors.push(String(e));console.error(e);process.exitCode=1;}
 finally {fs.writeFileSync(path.join(output,"results.json"),JSON.stringify({checks,errors},null,2));if(browser)await browser.close();if(stack)await stack.stop();}
})();
