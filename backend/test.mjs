import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes,randomUUID} from 'node:crypto';
import {createApp,validateItems} from './app.mjs';
import {createPool,createStore,initialize} from './store.mjs';

test('reject unknown IDs, invalid acquisition modes, duplicates and timestamps',()=>{
 for(const items of [[{pokemonId:'missing',source:'guess'}],[{pokemonId:'cat-elu',source:'battle'}],[{pokemonId:'eevee',source:'guess',obtainedAt:'bad'}],[{pokemonId:'eevee',source:'guess'},{pokemonId:'eevee',source:'guess'}]])assert.throws(()=>validateItems(items));
 assert.equal(validateItems([{pokemonId:'eevee',source:'legacy',obtainedAt:null}])[0].obtainedAt,null);
});

test('real Postgres: idempotent visits, private collections and append-only concurrent writes',{skip:!process.env.PGHOST},async()=>{
 const admin=createPool();const schema='test_'+randomBytes(8).toString('hex');
 await admin.query(`CREATE SCHEMA ${schema}`);
 const pool=createPool({options:`-c search_path=${schema}`});let server;
 try{
  await initialize(pool);server=createServer(createApp(createStore(pool),{onError:()=>{}}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const alice=randomBytes(32).toString('hex'),bob=randomBytes(32).toString('hex');
  const call=(path,{token=alice,origin='https://xieleo5.github.io',method='GET',data}={})=>fetch(base+path,{method,headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  assert.equal((await call('/collection',{origin:'https://wrong.example'})).status,403);
  assert.equal((await call('/collection',{token:'bad'})).status,401);
  const pre=await call('/collection',{method:'OPTIONS'});assert.equal(pre.status,204);assert.equal(pre.headers.get('access-control-allow-origin'),'https://xieleo5.github.io');
  const eventId=randomUUID();
  const visits=await Promise.all([call('/visit',{method:'POST',data:{eventId}}),call('/visit',{method:'POST',data:{eventId}})]);
  assert.deepEqual((await Promise.all(visits.map(r=>r.json()))).map(x=>x.counted).sort(),[false,true]);
  assert.equal((await pool.query('SELECT count(*) FROM visits')).rows[0].count,'1');
  const item={pokemonId:'eevee',source:'guess',obtainedAt:new Date().toISOString()};
  assert.equal((await call('/collection',{method:'PUT',data:{items:[item]}})).status,200);
  assert.deepEqual((await(await call('/collection',{token:bob})).json()).items,[]);
  await Promise.all([
   call('/collection',{method:'PUT',data:{items:[{pokemonId:'rowlet',source:'arm'}]}}),
   call('/collection',{method:'PUT',data:{items:[{pokemonId:'eevee',source:'legacy'}]}})
  ]);
  await call('/collection',{method:'PUT',data:{items:[]}});
  const items=(await(await call('/collection')).json()).items;
  assert.equal(items.length,2);assert.equal(items.find(x=>x.pokemonId==='eevee').source,'guess');
  assert.equal((await call('/collection',{method:'PUT',data:{items:[{pokemonId:'fake',source:'guess'}]}})).status,400);
  assert.equal((await call('/collection',{method:'PUT',data:{items:[],padding:'x'.repeat(17000)}})).status,413);
  assert.equal((await call('/stats')).status,404);
 }finally{
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();
 }
});
