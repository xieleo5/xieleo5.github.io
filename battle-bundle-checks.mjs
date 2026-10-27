import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Worker} from 'node:worker_threads';
const records=JSON.parse(fs.readFileSync('dist/battle-roster.json')).records;
const url=new URL('./dist/vendor/showdown-worker.js',import.meta.url).href;
const worker=new Worker(`const {parentPort}=require('node:worker_threads');global.self={postMessage:data=>parentPort.postMessage(data)};parentPort.on('message',data=>self.onmessage({data}));import(${JSON.stringify(url)});`,{eval:true});
let seq=0;const pending=new Map();
const ready=new Promise((resolve,reject)=>{worker.on('error',reject);worker.on('message',data=>{if(data.ready)return resolve();const p=pending.get(data.id);if(!p)return;pending.delete(data.id);data.error?p.reject(new Error(data.error)):p.resolve(data.state);});});
const timeout=setTimeout(()=>{worker.terminate();throw new Error('Worker timed out');},30000);
const send=(type,payload)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});worker.postMessage({id,type,payload});});
try{
 await ready;
 for(const matchup of [{player:['shiny-rayquaza'],enemy:['koraidon'],doubles:false},{player:['dondozo','tatsugiri'],enemy:['kyogre','groudon'],doubles:true,playerForm:1},{player:['ditto'],enemy:['scizor'],doubles:false}]){
  const initial=await send('start',{records,matchup});assert.equal(initial.turn,1);
  const commands=initial.options.map(os=>(os.find(o=>o.mega&&o.category!=='Status')||os.find(o=>o.category!=='Status')||os[0]).command);
  const next=await send('choose',{commands});assert.ok(next.turn===2||next.ended);
  if(matchup.playerForm===1)assert.equal(initial.player[1].name,'Tatsugiri-Droopy');
 }
 console.log('PASS: bundled browser worker starts and advances singles, Commander doubles and Imposter battles.');
}finally{clearTimeout(timeout);await worker.terminate();}
