import assert from 'node:assert/strict';
const {readFileSync}=await import('node:fs');
const {matchesPokemonAnswer,normalizePokemonAnswer}=await import('./dist/arcade-model.mjs');
const roster=JSON.parse(readFileSync('./pokemon-roster.json','utf8'));
const runtimeRoster=JSON.parse(readFileSync('./dist/pokemon.js','utf8').match(/const companions=(\[[\s\S]*?\]);/)[1]);
assert.deepEqual(runtimeRoster,roster,'Bilingual test fixture must match the roster used in the page');
assert.ok(roster.length>=59);
for(const p of roster){
 assert.ok(matchesPokemonAnswer(p,p.zh),p.name+' must accept Chinese');
 assert.ok(matchesPokemonAnswer(p,p.name.toUpperCase()),p.name+' must accept uppercase');
 assert.ok(matchesPokemonAnswer(p,'  '+p.name.toLowerCase()+'  '),p.name+' must trim whitespace');
 for(const alias of p.aliases)assert.ok(matchesPokemonAnswer(p,alias));
 assert.equal(matchesPokemonAnswer(p,''),false);assert.equal(matchesPokemonAnswer(p,'wrong pokemon'),false);
}
assert.equal(normalizePokemonAnswer('ＥＥＶＥＥ'),'eevee');
assert.ok(matchesPokemonAnswer(roster.find(p=>p.id==='shiny-rayquaza'),'裂空座'));
assert.ok(matchesPokemonAnswer(roster.find(p=>p.id==='tatsugiri'),'米粒龙'));
const {canAcquire}=await import('./dist/collection-rules.mjs');
const homeCats=JSON.parse(readFileSync('./dist/pokemon.js','utf8').match(/const homeCats=(\[[\s\S]*?\]);/)[1]);
for(const c of homeCats){
 assert.ok(!roster.some(p=>p.id===c.id),c.id+' must not collide with a Pokémon ID');
 assert.ok(readFileSync('./dist/assets/menu-icons/'+c.id+'.png').length,c.id+' needs shelf art');
 for(const answer of [c.zh,c.name.toUpperCase(),...c.aliases])assert.ok(matchesPokemonAnswer(c,answer),c.id+' must accept '+answer);
 assert.ok(canAcquire(c,'guess'));for(const mode of ['arm','battle'])assert.equal(canAcquire(c,mode),false,c.id+' is only collected in Guess who?');
}
console.log('PASS: all roster Pokémon accept Chinese, mixed-case English, whitespace and configured aliases; empty and incorrect answers rejected. Home cats are Guess-who only.');
