// Share in-flight downloads across close/reopen, and report actual received bytes.
const downloads=new Map();
export async function downloadBuffer(url,onProgress=()=>{}){
 const key=String(url);let entry=downloads.get(key);
 if(!entry){
  entry={loaded:0,total:0,listeners:new Set()};downloads.set(key,entry);
  const report=()=>{for(const listener of entry.listeners)listener({loaded:entry.loaded,total:entry.total});};
  entry.promise=(async()=>{
   if(key.startsWith('file:')){const {readFile}=await import('node:fs/promises');const bytes=await readFile(new URL(key));entry.loaded=entry.total=bytes.length;report();return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);}
   const response=await fetch(url);if(!response.ok)throw Error('Download failed: '+response.status+' '+new URL(key,location.href).pathname);
   // Content-Length may describe compressed bytes rather than the decoded stream.
   const encoding=response.headers.get('content-encoding');entry.total=(!encoding||encoding==='identity')?Number(response.headers.get('content-length'))||0:0;report();
   if(!response.body){const buffer=await response.arrayBuffer();entry.loaded=entry.total=buffer.byteLength;report();return buffer;}
   const reader=response.body.getReader(),chunks=[];
   try{while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);entry.loaded+=value.byteLength;report();}}finally{reader.releaseLock();}
   const bytes=new Uint8Array(entry.loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
   entry.total=entry.loaded;report();return bytes.buffer;
  })().catch(error=>{downloads.delete(key);throw error;});
 }
 entry.listeners.add(onProgress);onProgress({loaded:entry.loaded,total:entry.total});
 try{return await entry.promise;}finally{entry.listeners.delete(onProgress);}
}
