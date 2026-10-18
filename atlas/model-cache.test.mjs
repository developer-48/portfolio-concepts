import test from 'node:test';import assert from 'node:assert/strict';
import{createModelStore}from'./model-cache.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
test('A to B to A keeps both downloads and returns the same in-flight A request',async()=>{
 const jobs=new Map(),calls=[];const store=createModelStore((key,progress)=>{calls.push(key);const job=deferred();jobs.set(key,{...job,progress});return job.promise;});
 const updates=[];const a=store.request('coupe'),b=store.request('sedan'),again=store.request('coupe',p=>updates.push(p));
 assert.equal(a,again);await Promise.resolve();assert.deepEqual(calls,['coupe','sedan']);
 jobs.get('coupe').progress(.5);jobs.get('coupe').resolve(new ArrayBuffer(8));jobs.get('sedan').resolve(new ArrayBuffer(4));
 const [av,bv]=await Promise.all([a,b]);assert.equal(av.byteLength,8);assert.equal(bv.byteLength,4);assert.ok(updates.includes(.5));assert.equal(updates.at(-1),1);
 assert.equal(await store.request('coupe'),av);assert.equal(calls.length,2,'cached selection must not fetch again');
});
test('foreground request joins prefetch and failed download can be retried',async()=>{
 let calls=0;const task=deferred();const store=createModelStore(()=>{calls++;return calls===1?task.promise:Promise.resolve(new ArrayBuffer(2));});
 const prefetch=store.request('crossover',()=>{},'low'),foreground=store.request('crossover');assert.equal(prefetch,foreground);
 task.reject(new Error('offline'));await assert.rejects(prefetch,/offline/);assert.equal((await store.request('crossover')).byteLength,2);assert.equal(calls,2);
});
test('background warmup is sequential and skips the current and already cached models',async()=>{
 const calls=[],store=createModelStore(async(key,_progress,priority)=>{calls.push([key,priority]);return new ArrayBuffer(1);});
 await store.request('coupe');await store.warm(()=> 'coupe');assert.deepEqual(calls,[['coupe','high'],['sedan','low'],['crossover','low'],['suv','low']]);
 await store.warm(()=> 'sedan');assert.equal(calls.length,4);await assert.rejects(store.request('unknown'),/Unknown vehicle/);
});
test('save-data or hidden-page gate prevents speculative downloads',async()=>{
 let calls=0;const store=createModelStore(async()=>{calls++;return new ArrayBuffer(1);});await store.warm(()=> 'coupe',()=>false);assert.equal(calls,0);
});
