// Preserve historical test assertions and artifacts; redirect only output directories in memory.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const {spawn}=require('node:child_process');
const suites=['phase1','phase15','phase22','phase22-localization','phase231','phase24','phase25','phase26','phase27','phase271','phase28','phase29','phase291','hero-countup','phase3','phase4','auth-hardening'];
const output=process.env.KAUSHALIQ_REGRESSION_OUTPUT || path.resolve(__dirname,'../../docs/phase-2.9.1.1/verification/regressions');fs.mkdirSync(output,{recursive:true});
if(process.argv[2]==='--one'){
  const suite=process.argv[3];if(!suites.includes(suite))throw new Error('Unknown regression suite');
  const file=path.join(__dirname,suite+'.browser.cjs'),destination=path.join(output,suite);
  fs.mkdirSync(destination,{recursive:true});process.env.KAUSHALIQ_TEST_OUTPUT=destination;
  let source=fs.readFileSync(file,'utf8');const match=source.match(/\boutput\s*=\s*[^;]+;/);
  if(!match)throw new Error('Suite artifact directory must be explicitly identified');
  source=source.replace(match[0],'output = '+JSON.stringify(destination)+';');
  const compiled=new Module(file,module);compiled.filename=file;compiled.paths=Module._nodeModulePaths(__dirname);compiled._compile(source,file);
}else{
  const results=[];let index=0;
  async function worker(){while(index<suites.length){const suite=suites[index++];await new Promise(resolve=>{const log=fs.createWriteStream(path.join(output,suite+'.log'));
    const env={...process.env,GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',GOOGLE_CALLBACK_URL:'',GITHUB_CLIENT_ID:'',GITHUB_CLIENT_SECRET:'',GITHUB_CALLBACK_URL:''};
    const child=spawn(process.execPath,[__filename,'--one',suite],{cwd:path.resolve(__dirname,'..'),env,windowsHide:true});
    child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});child.on('exit',code=>{log.end();results.push({suite,exitCode:code});console.log((code===0?'PASS ':'FAIL ')+suite);resolve();});
  });}}
  Promise.all([worker(),worker()]).then(()=>{fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(results,null,2));if(results.some(r=>r.exitCode!==0))process.exitCode=1;});
}
