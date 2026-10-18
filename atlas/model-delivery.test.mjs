import test from 'node:test';import assert from 'node:assert/strict';import{createModelDelivery}from'./model-delivery.mjs';
const origin='https://example.com/assets/crossover.glb.gz?v=19',mirrorBase='https://cdn.example.com/pinned/assets';
test('rebuilt models prefer the pinned mirror; Porsche keeps its original transport',async()=>{
 const calls=[],delivery=createModelDelivery({mirrorBase,download:async url=>{calls.push(['origin',url]);return 'local'},downloadMirror:async url=>{calls.push(['mirror',url]);return 'cdn'}}),signal=new AbortController().signal;
 assert.equal(await delivery('crossover',origin,()=>{},signal),'cdn');assert.deepEqual(calls,[['mirror',mirrorBase+'/crossover.glb.gz']]);
 assert.equal(await delivery('coupe',origin,()=>{},signal),'local');assert.equal(calls[1][0],'origin');
});
test('a blocked or stalled mirror falls back to the canonical origin, once',async()=>{
 const calls=[],delivery=createModelDelivery({mirrorBase,downloadMirror:async()=>{calls.push('mirror');throw new Error('unavailable')},download:async url=>{calls.push(url);return 'local'}});
 assert.equal(await delivery('sedan',origin,()=>{},new AbortController().signal),'local');assert.deepEqual(calls,['mirror',origin]);
});
test('switching away during mirror loading never starts an obsolete fallback',async()=>{
 const ctrl=new AbortController();let fallback=false;
 const delivery=createModelDelivery({mirrorBase,downloadMirror:async()=>{ctrl.abort();throw ctrl.signal.reason},download:async()=>{fallback=true}});
 await assert.rejects(delivery('suv',origin,()=>{},ctrl.signal),{name:'AbortError'});assert.equal(fallback,false);
});
test('local development stays entirely local without a configured mirror',async()=>{
 let mirror=false;const delivery=createModelDelivery({download:async()=>1,downloadMirror:async()=>{mirror=true}});
 assert.equal(await delivery('suv',origin,()=>{},new AbortController().signal),1);assert.equal(mirror,false);
});
