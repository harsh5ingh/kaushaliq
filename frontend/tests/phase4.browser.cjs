// Model-ready values exist only in isolated intercepted TEST ONLY responses.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{startStack}=require('./test-stack.cjs');
const output=process.env.KAUSHALIQ_TEST_OUTPUT||path.resolve(__dirname,'../../docs/phase-4/verification/browser');fs.mkdirSync(output,{recursive:true});
const checks=[],screenshots=[],errors=[];let stack,browser;
function pass(s){checks.push(s);console.log('PASS '+s);}
async function loaded(page){await page.locator('.forecast-summary').waitFor();}
async function capture(page,file){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,file),fullPage:true,animations:'disabled'});screenshots.push(file);}
(async()=>{try{
  stack=await startStack(path.resolve(__dirname,'..'),{emailDelivery:false});browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const query='family=labour&metric=LFPR&geography_id=in&sex=persons&sector=combined&activity_status=US';
  const real=await(await fetch(`http://127.0.0.1:${stack.apiPort}/api/v1/intelligence/forecast?${query}`)).json();
  await page.goto(stack.base+'/forecast');await loaded(page);
  assert.equal(real.status,'UNAVAILABLE');assert.equal(real.items[0].forecasts.length,0);
  assert.equal(await page.locator('.real-metric > strong').innerText(),'60.1%');assert.match(await page.locator('.forecast-delta').innerText(),/2.2/);
  assert.match(await page.locator('.forecast-gate').innerText(),/January 2025/);assert.equal(await page.locator('.forecast-model-key').count(),0);
  assert.match(await page.locator('.forecast-errors').innerText(),/1.733/);pass('Real observations and derived changes render; historical diagnostics never imply prospective permission');
  await page.getByRole('button',{name:'View evidence 2023-24',exact:true}).first().click();await page.locator('.evidence-dialog').waitFor();assert.match(await page.locator('.evidence-details').innerText(),/PLFS|Periodic Labour/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.viz-inspector button').evaluate(e=>e===document.activeElement),true);
  await page.getByLabel('Observation timeline',{exact:true}).focus();await page.keyboard.press('Home');assert.equal(await page.locator('.viz-inspector > strong').innerText(),'49.8%');
  await page.getByLabel('Inspect historical period',{exact:true}).selectOption({label:'2020-21'});assert.equal(await page.locator('.viz-inspector > strong').innerText(),'54.9%');
  await page.getByText('Historical values and derived changes',{exact:true}).click();
  assert.deepEqual(await page.locator('.viz-table-details tbody th').allTextContents(),['2017-18','2018-19','2019-20','2020-21','2021-22','2022-23','2023-24']);
  pass('Genuine-period timeline, chronological table, keyboard point selection and evidence Escape/focus restoration');
  await page.getByLabel('Requested annual horizon',{exact:true}).selectOption('2');await page.waitForFunction(()=>document.querySelector('.forecast-backtest')?.textContent.includes('Insufficient compatible'));
  assert.equal(await page.locator('.forecast-errors').count(),0);
  await page.getByLabel('Requested annual horizon',{exact:true}).selectOption('1');await page.locator('.forecast-errors').waitFor();
  await page.getByLabel('Geography',{exact:true}).selectOption('in-karnataka');await page.waitForFunction(()=>document.querySelector('.forecast-summary')?.textContent.includes('Karnataka'));
  await page.locator('.recharts-line-dot').first().waitFor();assert.equal(await page.locator('.recharts-line-dot').count(),1);assert.match(await page.locator('.forecast-gate').innerText(),/four complete training/);
  await page.getByLabel('Activity status',{exact:true}).selectOption('CWS');await page.locator('.empty-state').waitFor();assert.equal(await page.locator('.forecast-summary').count(),0);
  await page.getByRole('button',{name:'Reset trend filters',exact:true}).click();await loaded(page);
  await page.getByLabel('Evidence family',{exact:true}).selectOption('demand');await page.waitForFunction(()=>document.querySelector('.forecast-intelligence')?.dataset.query.includes('family=demand')&&document.querySelector('.forecast-summary'));
  const demand=await(await fetch(`http://127.0.0.1:${stack.apiPort}/api/v1/intelligence/trends?family=demand&geography_id=in`)).json();assert.equal(await page.locator('.real-metric > strong').innerText(),new Intl.NumberFormat('en-IN').format(demand.items[0].series.observations[0].value));
  assert.match(await page.locator('.forecast-gate').innerText(),/isolated point stocks/);assert.equal(await page.locator('.forecast-errors').count(),0);
  await page.getByLabel('Evidence family',{exact:true}).selectOption('supply');await page.waitForFunction(()=>document.querySelector('.forecast-summary')?.textContent.includes('Partial period'));
  assert.match(await page.locator('.forecast-delta').innerText(),/No compatible/);assert.match(await page.locator('.forecast-gate').innerText(),/warnings and quarantine/);
  await page.getByText('Historical values and derived changes',{exact:true}).click();assert.ok(!(await page.locator('.viz-table-details tbody th').allTextContents()).includes('2024-25'));
  pass('Data-aware family/geography/metric/horizon filters; sparse regional history, incompatible classification EMPTY, NCS single stock and quarantined/partial training');
  for(const width of [1440,1280,1024,768,390])for(const theme of ['dark','light'])for(const locale of ['en-IN','hi-IN']){
    await page.setViewportSize({width,height:1000});await page.evaluate(({theme,locale})=>{localStorage.setItem('kaushaliq.theme.v1',theme);localStorage.setItem('kaushaliq.locale.v1',locale);},{theme,locale});
    await page.goto(stack.base+'/forecast');await loaded(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}/${theme}/${locale}`);
    assert.equal(await page.locator('html').getAttribute('lang'),locale==='hi-IN'?'hi':'en');await capture(page,`forecast-${theme}-${locale}-${width}.png`);
  }pass('20 real-data screenshots: five widths, light/dark, English/Hindi and no horizontal overflow');
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{localStorage.setItem('kaushaliq.locale.v1','en-IN');localStorage.setItem('kaushaliq.theme.v1','system');});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  await page.goto(stack.base+'/forecast');await loaded(page);await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  await page.getByRole('button',{name:'Language: English',exact:true}).click();await page.getByRole('menuitemradio',{name:'हिन्दी',exact:true}).click();await page.getByRole('heading',{name:'श्रम बाज़ार रुझान और पूर्वानुमान',exact:true}).waitFor();
  await page.reload();await loaded(page);assert.equal(await page.locator('html').getAttribute('lang'),'hi');
  await page.getByRole('button',{name:'भाषा: हिन्दी',exact:true}).click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();await page.getByRole('heading',{name:'Labour market trends & forecasting',exact:true}).waitFor();
  assert.equal(await page.locator('.viz-frame').evaluate(e=>getComputedStyle(e).animationName),'none');pass('Live English-Hindi-English, persistence, system theme changes and reduced-motion rendering');
  let release;const hold=new Promise(r=>release=r);await page.route('**/api/v1/intelligence/trends?**',async r=>{await hold;await r.continue();});await page.reload();await page.getByText('Checking verified history and forecast readiness…',{exact:true}).waitFor();assert.ok(await page.locator('.skeleton').count());release();await loaded(page);await page.unroute('**/api/v1/intelligence/trends?**');
  pass('Loading uses existing Skeleton/Loader without provisional intelligence');
  await page.route('**/api/v1/intelligence/forecast?**',r=>r.fulfill({status:503,json:{detail:{code:'TREND_PUBLICATION_UNAVAILABLE'}}}));await page.reload();await page.getByText('Verified history could not be loaded. No forecast or sample values have been substituted.',{exact:true}).waitFor();assert.equal(await page.locator('.forecast-summary').count(),0);await capture(page,'error-light-en-1440.png');
  await page.unroute('**/api/v1/intelligence/forecast?**');await page.getByRole('button',{name:'Try again',exact:true}).click();await loaded(page);pass('API failure fails closed and retry restores verified history');
  for(const kind of ['forged-values','mixed-version','null-backtest']){
    const v=structuredClone(real);if(kind==='forged-values')v.items[0].forecasts=[{status:'FORECAST',value:42,lower:40,upper:44}];else if(kind==='null-backtest')v.items[0].backtest.mae=null;else v.version='different-publication';
    await page.route('**/api/v1/intelligence/forecast?**',r=>r.fulfill({json:v}));await page.reload();await page.getByText('Verified history could not be loaded. No forecast or sample values have been substituted.',{exact:true}).waitFor();await page.unroute('**/api/v1/intelligence/forecast?**');
  }pass('Forged unavailable predictions, null measured backtest errors and mixed publication versions rejected before charting');
  const fixture=structuredClone(real),f=fixture.items[0];f.status='FORECAST';fixture.status='FORECAST';f.generated_at='2026-10-04T00:00:00Z';f.quality_status='VALID';f.readiness.status='READY';f.readiness.reason_codes=[];f.readiness.checks=f.readiness.checks.map(c=>({...c,passed:true}));
  f.series.geography_name='TEST ONLY — isolated model fixture';f.series.applicability_end=null;f.series.applicability_evidence_url=null;f.forecasts=[{status:'FORECAST',period:'2024-25',period_start:'2024-07-01',period_end:'2025-06-30',value:60.1,lower:57,upper:63,interval_level:.95}];
  const historyFixture=await(await fetch(`http://127.0.0.1:${stack.apiPort}/api/v1/intelligence/trends?${query}`)).json();historyFixture.items[0].series.geography_name='TEST ONLY — isolated model fixture';
  await page.route('**/api/v1/intelligence/trends?**',r=>r.fulfill({json:historyFixture}));
  await page.route('**/api/v1/intelligence/forecast?**',r=>r.fulfill({json:fixture}));await page.reload();await loaded(page);await page.locator('.forecast-model-key').waitFor();assert.match(await page.locator('.forecast-gate').innerText(),/Baseline model output/);
  assert.equal(await page.locator('.recharts-area').count(),1);await page.locator('.recharts-errorBars').first().waitFor();assert.match(await page.locator('.forecast-summary').innerText(),/TEST ONLY/);await capture(page,'test-only-model-output-1440.png');await page.unroute('**/api/v1/intelligence/forecast?**');await page.unroute('**/api/v1/intelligence/trends?**');pass('Isolated TEST ONLY fixture exercises distinct dashed model output, conditional interval and forecast table');
  await page.goto(stack.base+'/forecast?region=not-connected');await page.locator('.empty-state').waitFor();await page.getByRole('button',{name:'Reset trend filters',exact:true}).click();await loaded(page);await page.reload();await loaded(page);
  await page.goto(stack.base+'/forecast/');await loaded(page);assert.equal(await page.locator('.workspace-metric').count(),0);await page.reload();await loaded(page);
  await page.setViewportSize({width:390,height:1000});await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByRole('link',{name:'Forecast',exact:true}).waitFor();await page.keyboard.press('Escape');
  await page.getByLabel('Inspect historical period',{exact:true}).focus();assert.equal(await page.locator(':focus').evaluate(e=>getComputedStyle(e).outlineStyle!=='none'),true);
  await page.goto(stack.base+'/skill-gaps');await page.locator('.gap-intelligence').waitFor();await page.goBack();await loaded(page);
  assert.deepEqual(errors,[]);pass('Unsupported geography EMPTY, reset/refresh, mobile navigation/Escape, visible focus and Phase 3 route/history preservation');
}catch(e){errors.push(e.stack);console.error(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks,screenshots,errors},null,2));if(browser)await browser.close();if(stack)await stack.stop();}})();
