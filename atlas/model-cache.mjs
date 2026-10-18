export const VEHICLES=['coupe','sedan','crossover','suv'];

// Only the selected car may consume bandwidth. The transport retains partial
// bytes on abort, so returning to a previous selection can resume with HTTP Range.
export function createModelStore(fetchModel){
 const ready=new Map(),pending=new Map();let active;
 function request(vehicle,onProgress=()=>{}){
  if(!VEHICLES.includes(vehicle))return Promise.reject(new Error('Unknown vehicle'));
  if(active&&active.vehicle!==vehicle){active.controller.abort();active=null;}
  if(ready.has(vehicle)){onProgress(1);return Promise.resolve(ready.get(vehicle));}
  const existing=pending.get(vehicle);
  if(existing&&!existing.controller.signal.aborted){existing.listeners.add(onProgress);onProgress(existing.progress);return existing.promise;}
  const item={vehicle,controller:new AbortController(),listeners:new Set([onProgress]),progress:0};active=item;
  item.promise=Promise.resolve().then(()=>{
   item.controller.signal.throwIfAborted();
   return fetchModel(vehicle,ratio=>{item.progress=ratio;item.listeners.forEach(listener=>listener(ratio));},item.controller.signal);
  }).then(buffer=>{
   item.controller.signal.throwIfAborted();ready.set(vehicle,buffer);item.listeners.forEach(listener=>listener(1));return buffer;
  }).finally(()=>{if(pending.get(vehicle)===item)pending.delete(vehicle);if(active===item)active=null;item.listeners.clear();});
  pending.set(vehicle,item);return item.promise;
 }
 return{request};
}
