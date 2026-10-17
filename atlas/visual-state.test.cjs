const test=require('node:test');
const assert=require('node:assert/strict');
const state=(key='restore',extras=[],vehicle='coupe')=>({key,extras,vehicle});
test('new program never replays persisted interior extras',async()=>{
 const{resolveVisualEffect:effect}=await import('./visual-state.mjs');
 for(const vehicle of ['coupe','sedan','crossover','suv'])for(const key of ['restore','protect','refresh']){
  const next=state(key,['interior','glass','wheels'],vehicle);
  assert.equal(effect(state(key==='restore'?'refresh':'restore',next.extras,vehicle),next,'interior'),key);
 }
});
test('model change previews the primary treatment, not the previous extra',async()=>{
 const{resolveVisualEffect:effect}=await import('./visual-state.mjs');
 assert.equal(effect(state('protect',['interior']),state('protect',['interior'],'suv'),'interior'),'protect');
});
test('explicit extra takes focus immediately; removing it returns to primary program',async()=>{
 const{resolveVisualEffect:effect}=await import('./visual-state.mjs');
 for(const extra of ['interior','glass','wheels']){
  assert.equal(effect(state(),state('restore',[extra]),'restore'),extra);
  assert.equal(effect(state('restore',[extra]),state(),extra),'restore');
 }
 assert.equal(effect(state('restore',['interior']),state('restore',['interior','glass']),'interior'),'glass');
 assert.equal(effect(state('restore',['interior','glass']),state('restore',['glass']),'glass'),null);
});
test('repeated snapshots and included interior do not restart the animation',async()=>{
 const{resolveVisualEffect:effect}=await import('./visual-state.mjs');
 assert.equal(effect(state('restore',['interior']),state('restore',['interior']),'restore'),null);
 assert.equal(effect(state('refresh'),state('refresh',['interior']),'refresh'),null);
});
