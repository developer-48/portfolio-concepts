import {createModelStore} from './model-cache.mjs?v=17';
import {createModelDownloader} from './model-download.mjs?v=17';
import {createModelDelivery} from './model-delivery.mjs?v=19.1';
const revision=17,cacheName=`atlas-models-v${revision}`;
const deliver=createModelDelivery({
 download:createModelDownloader(),
 downloadMirror:createModelDownloader(fetch,{stallMs:3500}),
 mirrorBase:location.hostname==='developer-48.github.io'?'https://cdn.jsdelivr.net/gh/developer-48/portfolio-concepts@6a868f7e5894e88849637b2d35fad271cd915344/assets/atlas-3d':null
});
let storage;
const store=createModelStore(async(vehicle,onProgress,signal)=>{
 const compressed=typeof DecompressionStream!=='undefined';
 const url=new URL(`../assets/atlas-3d/${vehicle}.glb${compressed?'.gz':''}?v=${vehicle==='coupe'?revision:19}`,import.meta.url).href;
 storage??=Promise.resolve().then(()=>typeof caches!=='undefined'?caches.open(cacheName):null).catch(()=>null);
 const cache=await storage;
 let response=await cache?.match(url).catch(()=>null);
 if(!response){
  const buffer=await deliver(vehicle,url,onProgress,signal);
  response=new Response(buffer);
  if(cache)cache.put(url,response.clone()).catch(()=>{});
 }
 signal.throwIfAborted();
 const stream=compressed?response.body.pipeThrough(new DecompressionStream('gzip')):response.body;
 return new Response(stream).arrayBuffer();
});
export const requestModel=store.request;
