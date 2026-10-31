import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const catalog=new Map(JSON.parse(readFileSync(new URL('./catalog.json',import.meta.url))).map(p=>[p.id,p]));
const tokenPattern=/^Bearer ([a-f0-9]{64})$/;
const uuidPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function fail(status,message){return Object.assign(new Error(message),{status});}
async function body(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw fail(415,'JSON required');
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>16384)throw fail(413,'Request too large');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw fail(400,'Invalid JSON');}
}
export function validateItems(items){
 if(!Array.isArray(items)||items.length>catalog.size)throw fail(400,'Invalid collection');
 const seen=new Set();
 return items.map(item=>{
  const p=catalog.get(item?.pokemonId),source=item?.source;
  if(!p||seen.has(p.id)||!['guess','arm','battle','legacy','unknown'].includes(source))throw fail(400,'Invalid collectible');
  if((source==='guess'&&!['starter','home'].includes(p.acquisition))||(source==='arm'&&p.acquisition!=='starter')||(source==='battle'&&p.acquisition==='home'))throw fail(400,'Invalid game for collectible');
  seen.add(p.id);let obtainedAt=null;
  if(item.obtainedAt!=null){const ms=Date.parse(item.obtainedAt);if(typeof item.obtainedAt!=='string'||!Number.isFinite(ms)||ms<Date.UTC(2020,0)||ms>Date.now()+300000)throw fail(400,'Invalid collection date');obtainedAt=new Date(ms).toISOString();}
  return {pokemonId:p.id,source,obtainedAt};
 });
}
export function createApp(store,{origin='https://xieleo5.github.io',onError=()=>console.error('Homepage API request failed')}={}){
 return async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try{
   if(req.url==='/health'&&req.method==='GET'){await store.health();return send(200,{status:'ok'});}
   if(req.headers.origin!==origin)return send(403,{error:'Origin not allowed'});
   res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
   if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Max-Age','600');res.writeHead(204);return res.end();}
   const match=tokenPattern.exec(req.headers.authorization||'');if(!match)return send(401,{error:'Visitor token required'});
   const id=createHash('sha256').update(match[1]).digest('hex');
   if(req.url==='/visit'&&req.method==='POST'){const data=await body(req);if(!uuidPattern.test(data?.eventId||''))throw fail(400,'Invalid event ID');return send(200,await store.visit(id,data.eventId));}
   if(req.url==='/collection'&&req.method==='GET')return send(200,{items:await store.read(id)});
   if(req.url==='/collection'&&req.method==='PUT'){const data=await body(req);return send(200,await store.save(id,validateItems(data?.items)));}
   return send(404,{error:'Not found'});
  }catch(error){if(!error.status)onError();if(!res.headersSent)send(error.status||503,{error:error.status?error.message:'Service temporarily unavailable'});else res.end();}
 };
}
