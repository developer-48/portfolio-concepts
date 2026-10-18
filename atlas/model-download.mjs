// Resumable, bounded downloads. Partial responses stay in memory, completed
// responses may be persisted by the caller. A server ignoring Range is safe.
export function createModelDownloader(fetcher=fetch,{stallMs=15000}={}){
 const partial=new Map();
 return async function download(url,progress,signal){
  let item=partial.get(url)||{chunks:[],received:0,total:0,etag:null,ranges:false};
  partial.set(url,item);
  if(item.total&&item.received===item.total)return new Blob(item.chunks).arrayBuffer();
  const controller=new AbortController();let timer,timedOut=false;
  const abort=()=>controller.abort(signal.reason);
  signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
  const touch=()=>{clearTimeout(timer);timer=setTimeout(()=>{timedOut=true;controller.abort();},stallMs);};
  try{
   touch();
   const headers={};
   if(item.received&&item.ranges&&item.etag){headers.Range=`bytes=${item.received}-`;headers['If-Range']=item.etag;}
   const response=await fetcher(url,{signal:controller.signal,priority:'high',cache:'force-cache',headers});
   if(!response.ok)throw new Error(`Model download failed: ${response.status}`);
   const range=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('content-range')||'');
   if(response.status===206){
    if(!range||Number(range[1])!==item.received)throw new Error('Invalid model byte range');
    item.total=Number(range[3]);
   }else{
    item.chunks=[];item.received=0;item.total=Number(response.headers.get('content-length'))||0;
   }
   item.ranges=response.headers.get('accept-ranges')==='bytes'||response.status===206;
   item.etag=response.headers.get('etag');
   const reader=response.body.getReader();progress(item.total?item.received/item.total:0);
   while(true){const {done,value}=await reader.read();signal.throwIfAborted();if(done)break;item.chunks.push(value);item.received+=value.byteLength;touch();progress(item.total?Math.min(.99,item.received/item.total):0);}
   signal.throwIfAborted();
   if(item.total&&item.received!==item.total)throw new Error('Incomplete model download');
   const buffer=await new Blob(item.chunks).arrayBuffer();partial.delete(url);return buffer;
  }catch(error){
   if(timedOut)throw new Error('Model download stalled');
   throw error;
  }finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
 };
}
