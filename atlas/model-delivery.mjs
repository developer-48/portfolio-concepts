// Mirror only the rebuilt cars. A pinned commit guarantees identical bytes;
// the canonical same-origin URL remains the persistent-cache key.
export function createModelDelivery({download,downloadMirror,mirrorBase}){
 return async(vehicle,url,onProgress,signal)=>{
  if(vehicle!=='coupe'&&mirrorBase){
   const file=new URL(url).pathname.split('/').pop();
   try{return await downloadMirror(`${mirrorBase}/${file}`,onProgress,signal);}
   catch{signal.throwIfAborted();} // A new selection must not start a fallback.
  }
  return download(url,onProgress,signal);
 };
}
