// Requires Playwright. Optional CHROMIUM_EXECUTABLE and THREE_JS_FILE for offline CI.
const {chromium}=require('playwright');const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');const shots=process.env.SCREENSHOT_DIR;
const types={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 if(process.env.THREE_JS_FILE)await context.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',r=>r.fulfill({path:process.env.THREE_JS_FILE,contentType:'text/javascript'}));
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/topics.html');await p.evaluate(()=>localStorage.setItem('nvr:v1:student',JSON.stringify({key:'topic25-browser-test',name:'Trial learner',cls:'Test class',school:'DEMO'})));
 async function shot(name){if(shots){fs.mkdirSync(shots,{recursive:true});await p.screenshot({path:path.join(shots,name+'.png'),fullPage:true});}}
 async function click(name){await p.getByRole('button',{name,exact:true}).click();}
 async function activity(t){
  await p.locator('.programming-access summary').click();
  const b=id=>p.locator('.programming-access button[data-action="'+id+'"]');
  const act=async id=>b(id).click();
  if(t.t==='language'){await act('level'+(t.brief==='device'?1:0));await act('reason0');}
  if(t.t==='machine'){
   const wanted=['SET 3','ADD 4','EMIT','HALT'];
   for(let i=0;i<4;i++){for(let tries=0;tries<7;tries++){const current=await p.evaluate(i=>window.__board.board.snapshot().program[i],i);if(current===wanted[i])break;await act('slot'+i);}}
   for(let i=0;i<4;i++)await act('step');
  }
  if(t.t==='translator'){
   await act('build');await act('interpreter');for(let i=0;i<3;i++)await act('run');await act('fix');for(let i=0;i<4;i++)await act('run');await act('compiler');await act('build');await act('run');
  }
  if(t.t==='ide'){await act('diagnose');await act('break');await act('run');await act('watch');await act('step');await act('edit');await act('tests');}
  assert.equal(await p.evaluate(()=>window.__board.board.filled()),true);await click('Check my answer');
 }
 for(let n=1;n<=4;n++){
  const id='pl-l0'+n;const exp=JSON.parse(fs.readFileSync(path.join(root,'experiences',id+'.json')));
  await p.goto(base+'/experience.html?id='+id);await p.waitForFunction(()=>window.NVR);await p.waitForFunction(()=>NVRCore.mat.map?.image?.complete);await shot(id+'-front');
  // Screenshot an aligned pair of station panels by looking at their wall.
  await p.keyboard.press('ArrowRight');
  for(let k=0;k<7;k++){
   await p.evaluate(k=>NVR.openStation(k),k);
   for(let i=0;i<exp.scenes[0].stations[k].tasks.length;i++){
    const t=exp.scenes[0].stations[k].tasks[i];
    if(['language','machine','translator','ide'].includes(t.t)){await shot(id+'-'+t.t);await activity(t);}
    else if(t.t==='mcq')await p.locator('.opt').filter({hasText:t.a[0]}).filter({hasNot:p.locator('select')}).first().click();
    else if(t.t==='multi'){for(const a of t.correct)await p.getByRole('button',{name:a,exact:true}).click();await click('Check my answer');}
    else if(t.t==='order'){for(const a of t.steps)await p.getByRole('button',{name:a,exact:true}).click();await click('Check my order');}
    else if(t.t==='match'||t.t==='sort'){
     const pairs=t.pairs||t.items;
     for(const [left,right] of pairs){ if(t.t==='match')await p.getByRole('combobox',{name:left,exact:true}).selectOption({label:right});else await p.locator('.item').filter({has:p.getByText(left,{exact:true})}).getByRole('button',{name:right,exact:true}).click(); }
     await click('Check my answers');
    }
    await p.waitForSelector('#fb.show');assert.equal(await p.locator('#fb').evaluate(e=>e.classList.contains('ok')),true,JSON.stringify(t));
    await click(i===exp.scenes[0].stations[k].tasks.length-1?'Finish':'Next question');
   }
  }
  const summary=await p.evaluate(()=>Store.summarise(NVRCore.exp,NVRCore.prog));assert.equal(summary.score,summary.total);assert.equal(summary.done,7);
  await p.reload();await p.waitForFunction(()=>window.NVR);const saved=await p.evaluate(()=>Store.summarise(NVRCore.exp,NVRCore.prog));assert.equal(saved.score,summary.total);assert.equal(saved.done,7);
  console.log('PASS browser complete/reload',id,summary.score+'/'+summary.total);
 }
 await p.goto(base+'/topics.html?topic=2.5');await p.waitForSelector('.learning-list');assert.equal(await p.locator('.exp').count(),5);assert.equal(await p.locator('text=Could not load this experience.').count(),0);await shot('topic25-list');
 const links=await p.locator('.learning-list a[download]').evaluateAll(es=>es.map(e=>e.href));for(const url of links)assert.equal((await p.request.get(url)).status(),200);
 await p.setViewportSize({width:390,height:844});await p.goto(base+'/experience.html?id=pl-l04');await p.waitForFunction(()=>window.NVR);await p.evaluate(()=>{NVRCore.prog.scenes.main={ans:{},done:{}};NVR.openStation(4);});await p.locator('.programming-access summary').click();await p.locator('[data-action="break"]').focus();await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>__board.board.snapshot().breakpoint),true);await shot('mobile-ide-controls');
 // A previous-format lesson still opens with the extended player and scoring.
 await p.goto(base+'/experience.html?id=sa-l01');await p.waitForFunction(()=>window.NVR);assert(Number.isFinite(await p.evaluate(()=>Store.summarise(NVRCore.exp,NVRCore.prog).total)));
 assert.deepEqual(errors,[]);console.log('PASS downloads, mobile keyboard controls, existing lesson and no page errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
