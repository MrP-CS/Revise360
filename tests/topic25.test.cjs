// Run with node tests/topic25.test.cjs. No browser/package dependencies.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={fillRect(){},strokeRect(){},fillText(){},measureText(s){return {width:s.length*12};}};
const storage=new Map();
const document={createElement(tag){assert.equal(tag,'canvas');return {setAttribute(){},getContext(){return ctx;}};}};
const window={addEventListener(){},APP_CONFIG:{secure:1,revise:.6}};
const sandbox={window,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console,setTimeout,clearTimeout,TextEncoder};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('js/programming.js','utf8'),sandbox);const P=window.R360Programming;
let tests=0;function test(name,fn){fn();console.log('PASS',name);tests++;}
const tap=(b,x,y)=>b.down(x,y);
const step=b=>tap(b,70,552);
test('Incomplete boards cannot award marks',()=>{for(const t of P.TYPES){const b=P.make({t});assert.equal(b.filled(),false);assert.equal(b.check().incomplete,true);}});
test('Language choice grades both the level and justification and locks submission',()=>{let b=P.make({t:'language',brief:'museum'});tap(b,80,350);tap(b,80,490);assert.equal(b.check().got,1);const snap=JSON.stringify(b.snapshot());b.clear();tap(b,400,350);assert.equal(JSON.stringify(b.snapshot()),snap);b=P.make({t:'language',brief:'device'});tap(b,400,350);tap(b,80,550);assert.equal(b.check().got,0);});
test('Teaching processor runs correct sum and emits exactly once',()=>{const b=P.make({t:'machine',mode:'sum'});tap(b,80,270);tap(b,80,270);for(let i=0;i<4;i++)step(b);assert.equal(b.snapshot().acc,7);assert.equal(JSON.stringify(b.snapshot().output),'[7]');assert.equal(b.check().got,1);assert.equal(P.codeFor('ADD 4'),'0010 0100');});
test('Wrong sequence is not accepted; editing invalidates a previous trace',()=>{const b=P.make({t:'machine',mode:'repair'});for(let i=0;i<4;i++)step(b);assert.equal(JSON.stringify(b.snapshot().output),'[3]');tap(b,80,270);assert.equal(b.filled(),false);assert.equal(b.snapshot().trace.length,0);const bad=P.make({t:'machine',mode:'sum'});for(let i=0;i<4;i++)step(bad);assert.equal(bad.check().got,0);});
test('Compiler requires a successful build; interpreter preserves earlier output at the error',()=>{const b=P.make({t:'translator'});tap(b,700,490);assert.equal(b.snapshot().fixed,false);tap(b,80,490);assert.equal(b.snapshot().seen.compileError,true);tap(b,400,490);assert.equal(b.snapshot().output.length,0);tap(b,400,145);for(let i=0;i<3;i++)tap(b,400,490);assert.equal(b.snapshot().seen.interpretError,true);assert.equal(JSON.stringify(b.snapshot().output),'[6]');tap(b,700,490);assert.equal(b.snapshot().fixed,true);for(let i=0;i<4;i++)tap(b,400,490);tap(b,80,145);tap(b,80,490);tap(b,400,490);assert.equal(b.filled(),true);assert.equal(b.check().got,1);});
test('IDE requires investigation and corrected source passes both tests',()=>{const b=P.make({t:'ide'});tap(b,80,485);assert.equal(b.snapshot().output,7);tap(b,360,410);tap(b,80,485);assert.equal(b.snapshot().paused,true);tap(b,270,485);tap(b,500,485);assert.equal(b.snapshot().total,7);tap(b,740,485);assert.equal(b.filled(),false);tap(b,80,410);tap(b,740,485);assert.equal(b.filled(),true);assert.equal(b.check().got,1);});
vm.runInContext(fs.readFileSync('js/store.js','utf8'),sandbox);
const reg=JSON.parse(fs.readFileSync('experiences/registry.json'));
const taskTypes=new Set(['mcq','multi','match','sort','order',...P.TYPES]);
test('All four lessons load, have six stations plus plenary and existing downloads/artwork',()=>{
 for(let n=1;n<=4;n++){
  const id='pl-l0'+n,e=JSON.parse(fs.readFileSync('experiences/'+id+'.json'));assert.equal(e.scenes[0].stations.length,7);assert.equal(e.scenes[0].info.length,6);
  const row=reg.experiences.find(r=>r.id===id);assert(row);assert(fs.existsSync(row.worksheet));const sc=e.scenes[0];assert(fs.existsSync('experiences/'+sc.img));assert(fs.existsSync('experiences/'+sc.imgHi));
  for(const st of sc.stations)for(const t of st.tasks){assert(taskTypes.has(t.t));if(t.a)assert.equal(new Set(t.a).size,t.a.length);if(t.pairs)assert(t.pairs.every(p=>p.length===2));if(t.items)assert(t.items.every(p=>t.cats.includes(p[1])));}
  const s=window.Store.summarise(e,{scenes:{main:{ans:{},done:{}}},review:{},info:[]});assert(Number.isFinite(s.total)&&s.total>10);assert.equal(s.count,7);
 }
});
test('Board marks remain finite in completed saved progress and review does not inflate totals',()=>{const e=JSON.parse(fs.readFileSync('experiences/pl-l03.json'));const p={scenes:{main:{ans:{'3-0':1},done:{3:true}}},review:{},info:[]};const s=window.Store.summarise(e,p);assert(Number.isFinite(s.score));assert.equal(s.score,1);assert.equal(s.done,1);});
console.log(tests+' checks passed.');
