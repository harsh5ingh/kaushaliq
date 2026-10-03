const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{startStack}=require('./test-stack.cjs');
const frontend=path.resolve(__dirname,'..'),output=path.resolve(frontend,'../docs/phase-2.8/verification');
fs.mkdirSync(output,{recursive:true});
const checks=[],screenshots=[],errors=[];let stack,browser;
function pass(name){checks.push(name);console.log('PASS '+name);}
async function capture(page,file){await page.screenshot({path:path.join(output,file),fullPage:true,animations:'disabled'});screenshots.push(file);}
async function loaded(page){await page.waitForFunction(()=>{const keys=['geography_id','geography_level','reference_period','quality_status','occupation_code','occupation_system','skill_code','sector_code','metric','source_id'];const query=new URLSearchParams([...new URLSearchParams(location.search)].filter(([key,value])=>keys.includes(key)&&value)).toString();return document.querySelector('.demand-intelligence')?.dataset.query===query;});}
(async()=>{try{
 stack=await startStack(frontend,{emailDelivery:false});browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const api=`http://127.0.0.1:${stack.apiPort}/api/v1/intelligence/demand`;
 const source=await(await fetch(api)).json();assert.equal(source.total,37);assert.equal(source.items.find(r=>r.geography_id==='in').value,4005028);
 const coverage=await(await fetch(api+'/coverage')).json();assert.equal(coverage.options.geographies.length,34);assert.equal(coverage.options.reference_period.length,1);assert.equal(coverage.options.occupation_code.length,0);
 pass('Canonical demand API publishes 37 actual source rows with 34 mapped geographies and one observation date');
 await page.goto(stack.base+'/demand');await loaded(page);assert.equal(await page.locator('.workspace-login').count(),1);assert.equal(await page.locator('.demand-native>strong').innerText(),'40,05,028');
 assert.equal(await page.locator('.workspace-metric,.spatial-canvas,.data-mode-control').count(),0);assert.match(await page.locator('.demand-caveat').innerText(),/not a live feed/);
 await page.getByRole('button',{name:'Show all 33 locations',exact:true}).click();assert.equal(await page.locator('.demand-bars button').count(),33);
 for(const row of await page.locator('.demand-bars button').all()){const label=await row.locator('span[lang=en]').innerText(),value=Number((await row.locator('strong').innerText()).replaceAll(',',''));assert.equal(value,source.items.find(r=>r.source_geography_label===label).value);}
 pass('Public demand view shows verified native vacancy counts; every regional bar matches the API, no sample mode');
 const evidence=page.locator('.demand-native button');await evidence.focus();await page.keyboard.press('Enter');await page.locator('.evidence-dialog').waitFor();
 const detail=await page.locator('.evidence-details').innerText();assert.match(detail,/NCS active vacancies/);assert.match(detail,/2025-07-14/);assert.match(detail,/Annexure TOTAL/);assert.match(detail,/PIB attribution/);
 await capture(page,'evidence-dark-en-1440.png');await page.keyboard.press('Escape');assert.equal(await evidence.evaluate(el=>el===document.activeElement),true);
 pass('Shared evidence modal exposes source, raw hash, source row, period and transformations; Escape restores focus');
 await page.getByLabel('Geography',{exact:true}).selectOption('in-karnataka');await loaded(page);assert.equal(await page.locator('.demand-native>strong').innerText(),'22,361');assert.equal(await page.locator('.demand-bars button').count(),1);
 await page.getByLabel('Geography level',{exact:true}).selectOption('country');await loaded(page);await page.getByText('No verified demand observations match these dimensions.',{exact:false}).waitFor();assert.equal(await page.locator('.demand-native,.demand-bars').count(),0);
 await page.reload();await loaded(page);assert.equal(await page.getByLabel('Geography',{exact:true}).inputValue(),'in-karnataka');assert.equal(await page.getByLabel('Geography level',{exact:true}).inputValue(),'country');
 await page.goBack();await loaded(page);assert.equal(await page.locator('.demand-native>strong').innerText(),'22,361');await page.goForward();await loaded(page);assert.equal(await page.locator('.demand-native').count(),0);
 pass('Functional geography filters, incompatible combinations, refresh and browser back/forward preserve honest unavailable states');
 await page.goto(stack.base+'/demand?geography_level=district');await loaded(page);assert.equal(await page.locator('.demand-native').count(),0);await capture(page,'district-unavailable-dark-en-1440.png');
 await page.goto(stack.base+'/demand?occupation_code=2512.0100');await loaded(page);assert.equal(await page.locator('.demand-native').count(),0);
 await page.getByRole('button',{name:'Reset filters',exact:true}).click();await loaded(page);
 await page.getByLabel('Quality',{exact:true}).selectOption('WARNING');await loaded(page);assert.equal(await page.locator('.demand-unassigned li').count(),3);assert.equal(await page.locator('.demand-bars button').count(),0);
 await page.getByRole('button',{name:'Reset filters',exact:true}).click();await loaded(page);
 pass('District, occupation and unresolved-geography selections never manufacture zeroes, relationships or assigned UT values');
 await page.getByRole('button',{name:/^Language:/}).click();await page.getByRole('menuitemradio',{name:'हिन्दी',exact:true}).click();await page.getByRole('heading',{name:'श्रम की मांग कहाँ दिखाई देती है?',exact:true}).waitFor();
 await page.reload();await loaded(page);assert.equal(await page.evaluate(()=>document.documentElement.lang),'hi');
 await page.getByRole('button',{name:/^भाषा:/}).click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();await page.getByRole('heading',{name:'Where is labour demand visible?',exact:true}).waitFor();
 await page.getByRole('button',{name:/^Appearance:/}).click();await page.getByRole('menuitemradio',{name:'Light',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');
 await page.getByRole('button',{name:/^Appearance:/}).click();await page.getByRole('menuitemradio',{name:'System',exact:true}).click();await page.emulateMedia({colorScheme:'dark'});assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
 pass('Immediate English/Hindi/English switching, persisted locale, light selection and operating-system theme behavior');
 for(const width of [1440,1280,1024,768,390])for(const theme of ['dark','light'])for(const locale of ['en-IN','hi-IN']){
  await page.setViewportSize({width,height:1000});await page.evaluate(({theme,locale})=>{window.kaushaliqTheme.setPreference(theme);localStorage.setItem('kaushaliq.locale.v1',locale);},{theme,locale});await page.goto(stack.base+'/demand');await loaded(page);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} ${theme} ${locale}`);
  assert.equal(await page.locator('.demand-native>strong').innerText(),'40,05,028');await capture(page,`demand-${theme}-${locale}-${width}.png`);
 }
 pass('20 demand screenshots cover five widths, both themes and both languages with no horizontal page overflow');
 await page.evaluate(()=>localStorage.setItem('kaushaliq.locale.v1','en-IN'));await page.goto(stack.base+'/demand');await loaded(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('.demand-bars button').first().focus();assert.equal(await page.locator('.demand-bars button').first().evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),true);
 await page.keyboard.press('Enter');await page.locator('.evidence-dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('.demand-bars button').first().evaluate(el=>el===document.activeElement),true);
 await page.locator('.viz-table-details summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.real-table-wrap tbody tr').count(),37);
 pass('Keyboard bar selection, visible focus, evidence restoration and accessible data table under reduced motion');
 await page.route('**/api/v1/intelligence/demand*',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:{code:'DEMAND_PUBLICATION_UNAVAILABLE'}})}));
 await page.reload();await page.getByText('Verified demand data could not be loaded.',{exact:false}).waitFor();assert.equal(await page.locator('.demand-native,.workspace-metric,.demand-bars').count(),0);await capture(page,'api-error-light-en-390.png');
 await page.unroute('**/api/v1/intelligence/demand*');await page.getByRole('button',{name:'Try again',exact:true}).click();await loaded(page);
 pass('Demand API failure shows retry without any simulated fallback; retry restores canonical data');
 await page.route('**/api/v1/intelligence/demand/coverage',async r=>{const response=await r.fetch();const value=await response.json();value.version='different-publication';await r.fulfill({response,json:value});});
 await page.reload();await page.getByText('Verified demand data could not be loaded.',{exact:false}).waitFor();assert.equal(await page.locator('.demand-native').count(),0);
 await page.unroute('**/api/v1/intelligence/demand/coverage');await page.getByRole('button',{name:'Try again',exact:true}).click();await loaded(page);
 await page.route('**/api/v1/intelligence/demand*',async r=>{if(new URL(r.request().url()).pathname!='/api/v1/intelligence/demand')return r.continue();const response=await r.fetch();const value=await response.json();value.items[0].evidence.raw_sha256='0'.repeat(64);await r.fulfill({response,json:value});});
 await page.reload();await page.getByText('Verified demand data could not be loaded.',{exact:false}).waitFor();assert.equal(await page.locator('.demand-native').count(),0);
 await page.unroute('**/api/v1/intelligence/demand*');await page.getByRole('button',{name:'Try again',exact:true}).click();await loaded(page);
 pass('Mismatched publication versions and unbound source evidence fail closed before displaying any count');
 await page.goto(stack.base+'/intelligence');await page.locator('.real-metric>strong').first().waitFor();assert.deepEqual(await page.locator('.real-metric>strong').allTextContents(),['60.1%','58.2%','3.2%']);
 assert.deepEqual(errors,[]);pass('Existing PLFS intelligence values preserved and no uncaught browser exceptions');
}catch(error){errors.push(error.stack);console.error(error);process.exitCode=1;}finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks,screenshots,errors},null,2));if(browser)await browser.close();if(stack)await stack.stop();}})();
