import {createModelStore} from './model-cache.mjs?v=17';
import {createModelDownloader} from './model-download.mjs?v=17';
const revision=17,cacheName=`atlas-models-v${revision}`,download=createModelDownloader();
let storage;
const store=createModelStore(async(vehicle,onProgress,signal)=>{
 const compressed=typeof DecompressionStream!=='undefined';
 const url=new URL(`../assets/atlas-3d/${vehicle}.glb${compressed?'.gz':''}?v=${vehicle==='crossover'?18:revision}`,import.meta.url).href;
 storage??=Promise.resolve().then(()=>typeof caches!=='undefined'?caches.open(cacheName):null).catch(()=>null);
 const cache=await storage;
 let response=await cache?.match(url).catch(()=>null);
 if(!response){
  const buffer=await download(url,onProgress,signal);
  response=new Response(buffer);
  if(cache)cache.put(url,response.clone()).catch(()=>{});
 }
 signal.throwIfAborted();
 const stream=compressed?response.body.pipeThrough(new DecompressionStream('gzip')):response.body;
 return new Response(stream).arrayBuffer();
});
export const requestModel=store.request;
