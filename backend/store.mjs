import pg from 'pg';
import {readFile} from 'node:fs/promises';
export const createPool=options=>new pg.Pool({max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000,...options});
export async function initialize(pool){await pool.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));}
export function createStore(pool){
 const touch=async(c,id)=>c.query('INSERT INTO visitors(id) VALUES($1) ON CONFLICT(id) DO UPDATE SET last_seen_at=now()',[id]);
 async function transaction(fn){const c=await pool.connect();try{await c.query('BEGIN');const result=await fn(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
 return {
  health:()=>pool.query('SELECT 1'),
  visit:(id,eventId)=>transaction(async c=>{await touch(c,id);const r=await c.query('INSERT INTO visits(visitor_id,event_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING event_id',[id,eventId]);return {counted:r.rowCount===1};}),
  read:async id=>(await pool.query('SELECT pokemon_id AS "pokemonId",source,obtained_at AS "obtainedAt",recorded_at AS "recordedAt" FROM collection WHERE visitor_id=$1 ORDER BY recorded_at,pokemon_id',[id])).rows,
  save:(id,items)=>transaction(async c=>{await touch(c,id);for(const item of items)await c.query('INSERT INTO collection(visitor_id,pokemon_id,source,obtained_at) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[id,item.pokemonId,item.source,item.obtainedAt]);return {saved:items.length};})
 };
}
