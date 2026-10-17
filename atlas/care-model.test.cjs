const {test}=require('node:test');
const assert=require('node:assert/strict');
const Care=require('./care-model.js');
const choose=(state,type,value,checked)=>Care.change(state,{type,value,checked});

test('all 96 class / program / extra combinations charge included work once',()=>{
  const factors={coupe:100,sedan:100,crossover:120,suv:140};
  const bases={refresh:11000,restore:38000,protect:85000};
  const amounts={glass:3500,wheels:6000,interior:12000};
  for(const [vehicle,factor] of Object.entries(factors))for(const [program,base] of Object.entries(bases))for(let bits=0;bits<8;bits++){
    let state=choose(Care.initial(),'vehicle',vehicle);
    const selected=Object.keys(amounts).filter((key,index)=>bits&(1<<index));
    selected.forEach(key=>{state=choose(state,'extra',key,true);});
    state=choose(state,'program',program);
    const result=Care.calculate(state);
    const paid=selected.filter(key=>!(program==='refresh'&&key==='interior'));
    const expected=base*factor/100+paid.reduce((sum,key)=>sum+amounts[key]*factor/100,0);
    assert.equal(result.total,expected,`${vehicle} ${program} ${selected}`);
    assert.deepEqual(result.paid,paid);
    assert.equal(new Set(result.effective).size,result.effective.length);
    assert.equal(result.effective.includes('interior'),program==='refresh'||selected.includes('interior'));
  }
});

test('switching through an inclusive program retains explicit salon preference',()=>{
  let state=choose(Care.initial(),'extra','interior',true);
  assert.equal(Care.calculate(state).total,50000);
  state=choose(state,'program','refresh');
  assert.equal(Care.calculate(state).total,11000);
  assert.equal(Care.calculate(state).chosen.length,0);
  state=choose(state,'extra','interior',false);
  assert.deepEqual(state.extras,['interior'],'included checkbox cannot erase remembered choice');
  state=choose(state,'program','protect');
  assert.equal(Care.calculate(state).total,97000);
  state=choose(state,'extra','interior',false);
  assert.equal(Care.calculate(state).total,85000);
});

test('a program does not create an extra that the visitor never selected',()=>{
  const state=choose(Care.initial('refresh'),'program','restore');
  assert.deepEqual(Care.calculate(state).effective,[]);
  assert.equal(Care.calculate(state).total,38000);
});

test('repeated input events are idempotent and changing class preserves choices',()=>{
  let state=Care.initial('protect');
  for(const key of ['glass','glass','wheels','interior','interior'])state=choose(state,'extra',key,true);
  state=choose(state,'vehicle','suv');
  assert.equal(Care.calculate(state).total,149100);
  assert.equal(state.extras.length,3);
  state=choose(state,'program','refresh');
  assert.equal(Care.calculate(state).total,28700);
  state=choose(state,'vehicle','coupe');
  assert.equal(Care.calculate(state).total,20500);
});
