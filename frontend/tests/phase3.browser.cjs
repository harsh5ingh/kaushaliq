// Compatible numbers below are isolated response fixtures; never canonical data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{startStack}=require('./test-stack.cjs');
const output=path.resolve(__dirname,'../../docs/phase-3/verification/browser');fs.mkdirSync(output,{recursive:true});
const checks=[],screenshots=[],errors=[];let stack,browser;
function pass(s){checks.push(s);console.log('PASS '+s);}
async function capture(page,file){await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:path.join(output,file),fullPage:true,animations:'disabled'});screenshots.push(file);}
async function loaded(page){await page.locator('.gap-intelligence').waitFor();}
function fixture(real,state){
  const value=structuredClone(real), a=value.items[0];
  const ev={source_id:'TEST-ONLY',locator:'Isolated browser fixture',raw_sha256:'a'.repeat(64),transformations:['Test normalization']};
  value.sources=[{source_id:'TEST-ONLY',publisher:'TEST ONLY',dataset_name:'Isolated browser fixture, not real intelligence',url:'https://example.invalid/test-only',license:'TEST ONLY',version:'test-1',geography:'test geography',granularity:'test',methodology:'Test only',notes:'Synthetic test fixture',connected:true,sha256:'a'.repeat(64)}];
  for(const [side,n] of [['demand',100],['supply',64]])Object.assign(a[side],{signal_id:'test-'+side,source_id:'TEST-ONLY',source_version:'test-1',publication_version:'test-publication',value:n,normalized_value:n,
    metric:'TEST-ONLY-'+side,unit:'test-persons',original_value:String(n),original_unit:'test-persons',population:'test population',status:'OBSERVED',quality_status:'VALID',
    geography_id:'test-geography',geography_level:'state',geography_version:'test-geo',source_geography_label:'TEST ONLY',period_start:'2024-01-01',period_end:'2024-12-31',period_type:'CALENDAR_YEAR',reference_period:'2024',partial:false,
    coverage_fraction:1,coverage_population:'test population',coverage_evidence:ev,evidence:ev,classifications:{skill:{code:'TEST-SKILL',system:'TEST-TAXONOMY',version:'test-1',mapping_status:'EXACT',evidence:ev}}});
  Object.assign(a,{readiness:state,gap_status:state==='READY'?'DERIVED':'UNAVAILABLE',compatibility_status:state==='READY'?'COMPATIBLE':'PARTIAL',gap_value:state==='READY'?36:null,
    uncovered_amount:state==='READY'?36:null,coverage_ratio:state==='READY'?.64:null,gap_direction:state==='READY'?'SHORTFALL':null,quality_status:state==='READY'?'VALID':'WARNING',
    method_id:'TEST-ONLY-METHOD',method_version:'test-1',methodology:'Isolated test only',evidence:[ev],transformations:['TEST ONLY'],limitations:['TEST ONLY']});
  a.checks=a.checks.map(c=>({...c,status:state==='READY'?'COMPATIBLE':c.dimension==='coverage'?'INSUFFICIENT_EVIDENCE':'COMPATIBLE'}));
  a.reason_codes=state==='READY'?[]:['COVERAGE_INSUFFICIENT'];
  if(state==='PARTIAL')a.supply.coverage_fraction=.8;
  Object.assign(value,{status:state,readiness:state,gap_status:a.gap_status,total:1,calculated_total:state==='READY'?1:0,items:[a]});return value;
}
(async()=>{try{
  stack=await startStack(path.resolve(__dirname,'..'),{emailDelivery:false});browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(stack.base+'/skill-gaps');await loaded(page);
  const real=await(await fetch(`http://127.0.0.1:${stack.apiPort}/api/v1/intelligence/gaps?geography_id=in&dimension=skill`)).json();
  assert.equal(real.status,'NOT_READY');assert.equal(real.calculated_total,0);assert.ok(real.items.every(r=>r.gap_value===null));
  assert.equal(await page.locator('.gap-calculation').count(),0);assert.match(await page.locator('.gap-gate').innerText(),/cannot yet be compared/);
  assert.equal(await page.getByLabel('Common observation period',{exact:true}).isDisabled(),true);
  pass('Real public gap page respects NOT_READY, with no subtraction, zero substitute or sample fallback');
  await page.getByRole('button',{name:'View compatibility assessment',exact:true}).click();
  assert.equal(await page.locator('.gap-checks li').count(),13);assert.match(await page.locator('.gap-checks').innerText(),/vacancy stock|Vacancies/);
  assert.equal(await page.locator('.gap-assessment summary').evaluate(e=>e===document.activeElement),true);
  await page.getByRole('button',{name:'View evidence · Demand measure',exact:true}).click();await page.locator('.evidence-dialog').waitFor();assert.match(await page.locator('.evidence-details').innerText(),/NCS|National Career|Vacancies/);await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('button',{name:'View evidence · Demand measure',exact:true}).evaluate(e=>e===document.activeElement),true);
  pass('Thirteen checks, safe source evidence, keyboard focus, modal Escape and focus restoration');
  await page.getByLabel('Geography',{exact:true}).selectOption('in-karnataka');await page.waitForFunction(()=>document.querySelector('.gap-intelligence')?.dataset.query.includes('in-karnataka'));
  assert.match(await page.locator('.gap-source-grid').innerText(),/Karnataka/);
  await page.getByLabel('Geography',{exact:true}).selectOption('');await page.waitForFunction(()=>document.querySelector('.gap-intelligence')?.dataset.query==='dimension=skill');
  const first=await page.locator('.gap-pair-select select').inputValue();await page.getByRole('button',{name:'Next assessments',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.gap-intelligence')?.dataset.query.includes('offset=50'));
  assert.notEqual(await page.locator('.gap-pair-select select').inputValue(),first);await page.getByRole('button',{name:'Previous assessments',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.gap-intelligence')?.dataset.query.includes('offset=0'));
  await page.goto(stack.base+'/skill-gaps?geography_level=district');await loaded(page);assert.match(await page.locator('.empty-state').innerText(),/No matching/);assert.equal(await page.locator('.gap-source-grid').count(),0);
  await page.getByRole('button',{name:'Reset filters',exact:true}).click();await loaded(page);await page.reload();await loaded(page);
  await page.goto(stack.base+'/skill-gaps?data=sample');await loaded(page);assert.equal(await page.locator('.workspace-metric,.data-mode-control,.gap-calculation').count(),0);
  pass('Source-aware geography filtering, district empty state, reset, refresh and exclusion of legacy simulation');
  for(const width of [1440,1280,1024,768,390])for(const theme of ['dark','light'])for(const locale of ['en-IN','hi-IN']){
    await page.setViewportSize({width,height:1000});await page.evaluate(({theme,locale})=>{localStorage.setItem('kaushaliq.theme.v1',theme);localStorage.setItem('kaushaliq.locale.v1',locale);},{theme,locale});
    await page.goto(stack.base+'/skill-gaps');await loaded(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}/${theme}/${locale}`);
    assert.equal(await page.locator('html').getAttribute('lang'),locale==='hi-IN'?'hi':'en');await capture(page,`gaps-${theme}-${locale}-${width}.png`);
  }
  pass('20 real-data screenshots: five widths × two themes × two languages, no page overflow');
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{localStorage.setItem('kaushaliq.locale.v1','en-IN');localStorage.setItem('kaushaliq.theme.v1','system');});
  await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});await page.goto(stack.base+'/skill-gaps');await loaded(page);await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  await page.getByRole('button',{name:'Language: English',exact:true}).click();await page.getByRole('menuitemradio',{name:'हिन्दी',exact:true}).click();await page.getByRole('heading',{name:'अंतर की गणना अनुपलब्ध',exact:true}).waitFor();
  await page.reload();await loaded(page);assert.equal(await page.locator('html').getAttribute('lang'),'hi');
  await page.getByRole('button',{name:'भाषा: हिन्दी',exact:true}).click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();await page.getByRole('heading',{name:'Gap calculation unavailable',exact:true}).waitFor();
  pass('Live English-Hindi-English, persisted locale, system appearance changes and reduced motion');
  let release;const held=new Promise(resolve=>release=resolve);await page.route('**/api/v1/intelligence/gaps?**',async r=>{await held;await r.continue();});
  await page.reload();await page.getByText('Checking verified demand and supply evidence…',{exact:true}).waitFor();assert.ok(await page.locator('.skeleton').count());release();await loaded(page);await page.unroute('**/api/v1/intelligence/gaps?**');
  pass('Pending API displays the existing Skeleton/Loader, never a provisional gap value');
  await page.route('**/api/v1/intelligence/gaps?**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"detail":{"code":"GAP_PUBLICATION_UNAVAILABLE"}}'}));
  await page.reload();await page.getByText('Verified gap evidence could not be loaded.',{exact:false}).waitFor();assert.equal(await page.locator('.gap-calculation,.gap-source-grid').count(),0);await capture(page,'error-light-en-1440.png');
  await page.unroute('**/api/v1/intelligence/gaps?**');await page.getByRole('button',{name:'Try again',exact:true}).click();await loaded(page);
  pass('API error state, honest failure and successful retry');
  for(const state of ['READY','PARTIAL','UNAVAILABLE','EMPTY']){
    const value=state==='READY'||state==='PARTIAL'?fixture(real,state):{...real,status:state,total:0,items:[]};
    await page.route('**/api/v1/intelligence/gaps?**',r=>r.fulfill({json:value}));await page.reload();await loaded(page);
    if(state==='READY'){assert.equal(await page.locator('.gap-calculation dd').nth(2).innerText(),'36');assert.equal(await page.locator('.gap-calculation dd').nth(3).innerText(),'64%');}
    else assert.equal(await page.locator('.gap-calculation').count(),0);
    await capture(page,`test-only-${state.toLowerCase()}-1440.png`);await page.unroute('**/api/v1/intelligence/gaps?**');
  }
  pass('Isolated fixtures exercise READY arithmetic, PARTIAL/no arithmetic, UNAVAILABLE and EMPTY presentation');
  for(const kind of ['forged-gap','mixed-version']){
    const value=structuredClone(real);if(kind==='forged-gap')value.items[0].gap_value=42;else value.version='changed-publication';
    await page.route('**/api/v1/intelligence/gaps?**',r=>r.fulfill({json:value}));await page.reload();await page.getByText('Verified gap evidence could not be loaded.',{exact:false}).waitFor();await page.unroute('**/api/v1/intelligence/gaps?**');
  }
  pass('Forged non-ready values and mixed publication versions fail closed');
  await page.setViewportSize({width:390,height:1000});await page.goto(stack.base+'/skill-gaps');await loaded(page);
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByRole('link',{name:'Demand × supply',exact:true}).waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
  await page.getByRole('button',{name:'View compatibility assessment',exact:true}).focus();assert.equal(await page.locator(':focus').evaluate(e=>getComputedStyle(e).outlineStyle!=='none'),true);
  await page.keyboard.press('Enter');await capture(page,'assessment-expanded-light-en-390.png');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.goto(stack.base+'/demand');await page.locator('.demand-native strong').waitFor();await page.goBack();await loaded(page);
  assert.deepEqual(errors,[]);pass('Mobile navigation/Escape, visible focus, expanded assessment and browser history');
}catch(e){errors.push(e.stack);console.error(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks,screenshots,errors},null,2));if(browser)await browser.close();if(stack)await stack.stop();}})();
