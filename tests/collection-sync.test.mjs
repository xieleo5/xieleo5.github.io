import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {startCollectionSync} from '../dist/collection-sync.mjs';
function fixture(){
 const win=new EventTarget();win.document=new EventTarget();win.document.visibilityState='visible';
 const owned=new Set(['eevee']);
 win.PokemonCollection={list:()=>[{id:'eevee'},{id:'rowlet'},{id:'spheal'}],cats:()=>[],has:id=>owned.has(id),merge:ids=>ids.forEach(id=>owned.add(id))};
 const data=new Map();const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 return {win,owned,data,storage};
}
test('offline retry retains visit ID, imports old saves and quietly merges server progress',async()=>{
 const f=fixture(),calls=[];let offline=true;
 const request=async(url,options)=>{calls.push({url,...options});if(offline)throw new Error('offline');return {ok:true,json:async()=>url.endsWith('/collection')&&options.method==='GET'?{items:[{pokemonId:'rowlet'}]}:{}};};
 const sync=startCollectionSync({...f,request,cryptoAPI:webcrypto});
 try{
  await sync.flush();assert.equal(f.owned.has('eevee'),true);assert.ok(JSON.parse(f.data.get('yuqi-collection-upload-v1')).eevee);
  offline=false;await sync.flush();assert.equal(f.owned.has('rowlet'),true);
  const visits=calls.filter(c=>c.url.endsWith('/visit'));assert.equal(visits.length,2);assert.equal(visits[0].body,visits[1].body);
  const uploaded=JSON.parse(calls.find(c=>c.method==='PUT').body).items;assert.deepEqual(uploaded,[{pokemonId:'eevee',source:'legacy',obtainedAt:null}]);
  assert.deepEqual(JSON.parse(f.data.get('yuqi-collection-upload-v1')),{});
  assert.match(JSON.parse(f.data.get('yuqi-visitor-token-v1')),/^[a-f0-9]{64}$/);
 }finally{sync.stop();}
});
test('awards made during upload remain queued with source and time',async()=>{
 const f=fixture();let release,uploadStarted;const started=new Promise(r=>uploadStarted=r);let first=true;
 const uploads=[];
 const request=async(url,options)=>{
  if(options.method==='PUT'){uploads.push(JSON.parse(options.body).items);if(first){first=false;uploadStarted();await new Promise(r=>release=r);}}
  return {ok:true,json:async()=>({items:[]})};
 };
 const sync=startCollectionSync({...f,request,cryptoAPI:webcrypto});
 try{
  const flushing=sync.flush();await started;
  const event=new Event('pokemon-collection-change');event.detail={id:'spheal',source:'arm',fresh:true};f.owned.add('spheal');f.win.dispatchEvent(event);
  release();await flushing;
  assert.equal(JSON.parse(f.data.get('yuqi-collection-upload-v1')).spheal.source,'arm');
  await sync.flush();assert.equal(uploads[1][0].pokemonId,'spheal');assert.ok(uploads[1][0].obtainedAt);
 }finally{sync.stop();}
});
