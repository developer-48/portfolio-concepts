import test from 'node:test';import assert from 'node:assert/strict';import{createModelDownloader}from'./model-download.mjs';
function interruptedResponse(options,onChunk){
 return new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([1,2,3]));options.signal.addEventListener('abort',()=>c.error(options.signal.reason));onChunk();}}),{headers:{'content-length':'6','accept-ranges':'bytes',etag:'"model-v17"'}});
}
test('an interrupted car resumes from the received bytes using Range and If-Range',async()=>{
 let calls=0;const ctrl=new AbortController();const download=createModelDownloader(async(_url,options)=>{
  if(++calls===1)return interruptedResponse(options,()=>{});
  assert.equal(options.headers.Range,'bytes=3-');assert.equal(options.headers['If-Range'],'"model-v17"');
  return new Response(new Uint8Array([4,5,6]),{status:206,headers:{'content-range':'bytes 3-5/6','content-length':'3',etag:'"model-v17"'}});
 });
 await assert.rejects(download('car',p=>{if(p>.1)ctrl.abort();},ctrl.signal),{name:'AbortError'});
 const result=await download('car',()=>{},new AbortController().signal);assert.deepEqual([...new Uint8Array(result)],[1,2,3,4,5,6]);
});
test('a server ignoring Range safely replaces partial bytes, rather than duplicating them',async()=>{
 let calls=0;const ctrl=new AbortController();const download=createModelDownloader(async(_url,options)=>++calls===1?interruptedResponse(options,()=>{}):new Response(new Uint8Array([7,8,9,10]),{headers:{'content-length':'4'}}));
 await assert.rejects(download('car',p=>{if(p>.1)ctrl.abort();},ctrl.signal),{name:'AbortError'});
 assert.deepEqual([...new Uint8Array(await download('car',()=>{},new AbortController().signal))],[7,8,9,10]);
});
test('stalled downloads time out and remain retryable',async()=>{
 const download=createModelDownloader(async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason))),{stallMs:10});
 await assert.rejects(download('car',()=>{},new AbortController().signal),/stalled/);
});
test('truncated and misaligned responses are never returned as complete models',async()=>{
 const truncated=createModelDownloader(async()=>new Response(new Uint8Array([1]),{headers:{'content-length':'5'}}));
 await assert.rejects(truncated('car',()=>{},new AbortController().signal),/Incomplete/);
 const invalid=createModelDownloader(async()=>new Response(new Uint8Array([1]),{status:206,headers:{'content-range':'bytes 3-3/4'}}));
 await assert.rejects(invalid('car',()=>{},new AbortController().signal),/Invalid/);
});
