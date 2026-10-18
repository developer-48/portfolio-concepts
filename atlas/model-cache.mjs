export const VEHICLES=['coupe','sedan','crossover','suv'];

// A class change never discards a partially downloaded model. Returning A → B → A
// joins A's original request; completed bytes are reused by both prefetch and 3D.
export function createModelStore(fetchModel){
 const ready=new Map(),pending=new Map();let warming;
 function request(vehicle,onProgress=()=>{},priority='high'){
  if(!VEHICLES.includes(vehicle))return Promise.reject(new Error('Unknown vehicle'));
  if(ready.has(vehicle)){onProgress(1);return Promise.resolve(ready.get(vehicle));}
  if(pending.has(vehicle)){const item=pending.get(vehicle);item.listeners.add(onProgress);onProgress(item.progress);return item.promise;}
  const item={listeners:new Set([onProgress]),progress:0};
  item.promise=Promise.resolve().then(()=>fetchModel(vehicle,ratio=>{item.progress=ratio;item.listeners.forEach(listener=>listener(ratio));},priority)).then(buffer=>{
   ready.set(vehicle,buffer);item.progress=1;item.listeners.forEach(listener=>listener(1));return buffer;
  }).finally(()=>{pending.delete(vehicle);item.listeners.clear();});
  pending.set(vehicle,item);return item.promise;
 }
 function warm(selected,allowed=()=>true){
  if(warming)return warming;
  warming=(async()=>{for(const vehicle of VEHICLES){if(!allowed())break;if(vehicle===selected()||ready.has(vehicle))continue;await request(vehicle,()=>{},'low').catch(()=>{});}})().finally(()=>{warming=null;});
  return warming;
 }
 return{request,warm};
}
