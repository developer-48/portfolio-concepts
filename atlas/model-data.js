import {createModelStore} from './model-cache.mjs?v=16';
const revision=16,cacheName=`atlas-models-v${revision}`;
let storage;
const store=createModelStore(async(vehicle,onProgress,priority)=>{
 const compressed=typeof DecompressionStream!=='undefined';
 const url=new URL(`../assets/atlas-3d/${vehicle}.glb${compressed?'.gz':''}?v=${revision}`,import.meta.url).href;
 storage??=Promise.resolve().then(()=>typeof caches!=='undefined'?caches.open(cacheName):null).catch(()=>null);
 const cache=await storage;
 let response=await cache?.match(url).catch(()=>null);
 if(!response){
  response=await fetch(url,{priority,cache:'force-cache'});
  if(!response.ok)throw new Error(`Model download failed: ${response.status}`);
  // Store compressed bytes independently of parsing/compilation. A page reload
  // does not force another megabyte download; quota/private-mode failures are benign.
  if(cache)cache.put(url,response.clone()).catch(()=>{});
 }
 const total=Number(response.headers.get('content-length'));let received=0;
 let stream=response.body.pipeThrough(new TransformStream({transform(chunk,sink){
  received+=chunk.byteLength;onProgress(total?Math.min(.99,received/total):0);sink.enqueue(chunk);
 }}));
 if(compressed)stream=stream.pipeThrough(new DecompressionStream('gzip'));
 return new Response(stream).arrayBuffer();
});
export const requestModel=store.request;
export const warmModels=store.warm;
