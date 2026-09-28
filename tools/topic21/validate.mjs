import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root='Revise360/';const values=new Map();
const context={window:{APP_CONFIG:{backendUrl:'',secure:1,revise:.6},addEventListener(){}},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},setTimeout,clearTimeout,console};
vm.createContext(context);vm.runInContext(fs.readFileSync(root+'js/store.js','utf8'),context);
const Store=context.window.Store,lessons=JSON.parse(fs.readFileSync(root+'tools/topic21/lessons.json'));
const reg=JSON.parse(fs.readFileSync(root+'experiences/registry.json')).experiences;
const marks=t=>t.t==='mcq'?1:t.t==='order'?t.steps.length:t.t==='sort'?t.items.length:t.pairs.length;
const result=[];
for(const l of lessons){
 const exp=JSON.parse(fs.readFileSync(root+'experiences/'+l.id+'.json'));
 assert.equal(exp.scenes.length,1);const sc=exp.scenes[0];assert.equal(sc.stations.length,7);assert.equal(sc.info.length,6);assert.ok(!sc.faces);
 for(const key of ['img','imgHi'])assert.ok(fs.existsSync(root+'experiences/'+sc[key]));
 const entries=reg.filter(x=>x.id===l.id);assert.equal(entries.length,1);
 for(const key of ['worksheet','powerpoint'])assert.ok(fs.existsSync(root+entries[0][key].split('?')[0]));
 let total=0;const prog={scenes:{main:{ans:{},done:{}}},info:sc.info.map(x=>x.id),review:{}};
 sc.stations.forEach((s,k)=>{assert.equal(s.tasks.length,2);prog.scenes.main.done[k]=true;s.tasks.forEach((t,i)=>{
  assert.ok(['mcq','match','sort','order'].includes(t.t));assert.ok(t.q&&t.fb);
  if(t.t==='mcq'){assert.ok(t.a.length>=3);assert.equal(new Set(t.a).size,t.a.length);}
  if(t.t==='sort')for(const pair of t.items)assert.ok(t.cats.includes(pair[1]));
  if(t.t==='order')assert.equal(new Set(t.steps).size,t.steps.length);
  total+=marks(t);prog.scenes.main.ans[k+'-'+i]=marks(t);
 });});
 const blank=Store.summarise(exp,null);assert.equal(blank.total,total);assert.equal(blank.score,0);assert.equal(blank.count,7);
 const full=Store.summarise(exp,prog);assert.equal(full.score,total);assert.ok(full.complete);assert.equal(full.infoSeen,6);
 prog.scenes.main.ans['0-0']=0;prog.review['main:0-0']=true;
 const reviewed=Store.summarise(exp,prog);assert.equal(reviewed.score,total-marks(sc.stations[0].tasks[0]));assert.equal(reviewed.stations[0].fixed,1);
 result.push({id:l.id,tasks:14,marks:total,resources:true,completion:true,reviewPreservesScore:true});
}
fs.writeFileSync('build/validation.json',JSON.stringify(result,null,2));console.log(result);
