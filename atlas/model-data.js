// Start the selected download independently of Three.js parsing and shader compilation.
const ready=new Map(),pending=new Map();
export function requestModel(vehicle,onProgress=()=>{}){
  if(!['coupe','sedan','crossover','suv'].includes(vehicle))return Promise.reject(new Error('Unknown vehicle'));
  for(const [key,item] of pending)if(key!==vehicle){item.controller.abort();pending.delete(key);}
  if(ready.has(vehicle)){
    const buffer=ready.get(vehicle);ready.delete(vehicle);ready.set(vehicle,buffer);onProgress(1);return Promise.resolve(buffer);
  }
  if(pending.has(vehicle)){
    const item=pending.get(vehicle);item.listeners.add(onProgress);onProgress(item.progress);return item.promise;
  }
  const controller=new AbortController(),item={controller,listeners:new Set([onProgress]),progress:0};
  const compressed=typeof DecompressionStream!=='undefined';
  const url=new URL(`../assets/atlas-3d/${vehicle}.glb${compressed?'.gz':''}?v=15`,import.meta.url);
  item.promise=(async()=>{
    const response=await fetch(url,{signal:controller.signal});
    if(!response.ok)throw new Error(`Model download failed: ${response.status}`);
    const total=Number(response.headers.get('content-length'));
    let received=0;
    let stream=response.body.pipeThrough(new TransformStream({transform(chunk,sink){
      received+=chunk.byteLength;item.progress=total?Math.min(.99,received/total):0;
      item.listeners.forEach(listener=>listener(item.progress));sink.enqueue(chunk);
    }}));
    if(compressed)stream=stream.pipeThrough(new DecompressionStream('gzip'));
    const buffer=await new Response(stream).arrayBuffer();
    if(controller.signal.aborted)throw new DOMException('Model superseded','AbortError');
    ready.set(vehicle,buffer);while(ready.size>4)ready.delete(ready.keys().next().value);
    item.progress=1;item.listeners.forEach(listener=>listener(1));return buffer;
  })().finally(()=>{if(pending.get(vehicle)===item)pending.delete(vehicle);item.listeners.clear();});
  pending.set(vehicle,item);return item.promise;
}
