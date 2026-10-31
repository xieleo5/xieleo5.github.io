import {createPool} from './store.mjs';
const pool=createPool();
try{
 const totals=(await pool.query(`SELECT (SELECT count(*)::int FROM visits) AS pageviews,(SELECT count(DISTINCT visitor_id)::int FROM visits) AS visitors,(SELECT count(*)::int FROM collection) AS collectibles,(SELECT count(DISTINCT visitor_id)::int FROM collection) AS collectors`)).rows[0];
 const daily=(await pool.query(`SELECT (visited_at AT TIME ZONE 'America/Los_Angeles')::date::text AS date,count(*)::int AS pageviews,count(DISTINCT visitor_id)::int AS visitors FROM visits WHERE visited_at>=now()-interval '30 days' GROUP BY 1 ORDER BY 1 DESC`)).rows;
 const popular=(await pool.query('SELECT pokemon_id,count(*)::int AS collectors FROM collection GROUP BY 1 ORDER BY 2 DESC,1')).rows;
 const result={timezone:'America/Los_Angeles',totals,daily,popular};
 if(process.argv.includes('--visitors'))result.visitors=(await pool.query(`SELECT left(v.id,16) AS visitor,v.created_at,v.last_seen_at,(SELECT count(*)::int FROM visits WHERE visitor_id=v.id) AS pageviews,coalesce((SELECT json_agg(json_build_object('pokemon',pokemon_id,'source',source,'obtainedAt',obtained_at,'recordedAt',recorded_at) ORDER BY recorded_at) FROM collection WHERE visitor_id=v.id),'[]') AS collection FROM visitors v ORDER BY v.last_seen_at DESC LIMIT 1000`)).rows;
 console.log(JSON.stringify(result,null,2));
}finally{await pool.end();}
