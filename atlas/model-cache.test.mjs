import test from 'node:test';import assert from 'node:assert/strict';
import{createModelStore}from'./model-cache.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
test('selection cancels the obsolete transfer; repeated current selection shares one request',async()=>{
 const jobs=new Map(),calls=[];const store=createModelStore((key,progress,signal)=>{calls.push(key);const job=deferred();jobs.set(key,{...job,progress,signal});signal.addEventListener('abort',()=>job.reject(signal.reason));return job.promise;});
 const a=store.request('coupe');const canceled=assert.rejects(a,{name:'AbortError'});await Promise.resolve();
 const b=store.request('sedan'),again=store.request('sedan');assert.equal(b,again);await Promise.resolve();
 assert.ok(jobs.get('coupe').signal.aborted);jobs.get('sedan').resolve(new ArrayBuffer(4));await canceled;assert.equal((await b).byteLength,4);
 assert.equal((await store.request('sedan')).byteLength,4);assert.deepEqual(calls,['coupe','sedan']);
});
test('rapid A to B to A cannot let an old request overwrite or remove the new one',async()=>{
 const jobs=[];const store=createModelStore((key,_p,signal)=>{const job=deferred();jobs.push({key,signal,...job});signal.addEventListener('abort',()=>job.reject(signal.reason));return job.promise;});
 const a=store.request('coupe');const canceled=assert.rejects(a,{name:'AbortError'});await Promise.resolve();
 const b=store.request('sedan');const skipped=assert.rejects(b,{name:'AbortError'});
 const again=store.request('coupe');await Promise.resolve();await canceled;await skipped;
 assert.equal(store.request('coupe'),again);jobs.at(-1).resolve(new ArrayBuffer(2));assert.equal((await again).byteLength,2);
});
test('cached selection also stops an in-flight unused model; failures may retry',async()=>{
 let fail=true;const store=createModelStore(async(key,_p,signal)=>{if(key==='sedan'){await new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason)));}if(key==='suv'&&fail){fail=false;throw new Error('offline');}return new ArrayBuffer(1);});
 await store.request('coupe');const sedan=store.request('sedan');const canceled=assert.rejects(sedan,{name:'AbortError'});await Promise.resolve();await store.request('coupe');await canceled;
 await assert.rejects(store.request('suv'),/offline/);assert.equal((await store.request('suv')).byteLength,1);await assert.rejects(store.request('unknown'),/Unknown vehicle/);
});
