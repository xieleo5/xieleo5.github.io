import assert from 'node:assert/strict';
import fs from 'node:fs';
import {starterPool,canAcquire} from './dist/collection-rules.mjs';
import {validatePlayerSet,effectiveSpecies} from './battle-src/sets.mjs';
import {availablePartners,eligibleOpponents,makeMatchup,TIER_ORDER} from './battle-src/rules.mjs';
import {ShelfBattle,chooseBotAction,slotOptions} from './battle-src/engine.mjs';
const roster=JSON.parse(fs.readFileSync('pokemon-roster.json'));
const records=JSON.parse(fs.readFileSync('dist/battle-roster.json')).records;
const ai=JSON.parse(fs.readFileSync('dist/battle-ai-sets.json')).records;
const get=id=>records.find(p=>p.id===id);
assert.equal(starterPool(roster).length,24);
assert.deepEqual(starterPool(roster).map(p=>p.id),roster.slice(0,24).map(p=>p.id));
for(const p of roster){for(const mode of ['guess','arm'])assert.equal(canAcquire(p,mode),p.acquisition==='starter');assert.equal(canAcquire(p,'battle'),true);}
assert.equal(canAcquire({id:'future'},'guess'),false);
assert.equal(canAcquire({id:'future'},'arm'),false);
for(const target of eligibleOpponents(records,get('eevee'))){const m=makeMatchup(records,'eevee',['eevee'],()=>0,0,{opponentId:target.id,enemyForm:2});assert.equal(m.primaryEnemy,target.id);assert.equal(m.enemyForm,2);assert.equal(m.revealOpponent,false);}
assert.throws(()=>makeMatchup(records,'koraidon',['koraidon'],Math.random,0,{opponentId:'eevee'}),/tier/);
const clone=id=>structuredClone(get(id).set);
let set=clone('shiny-rayquaza');set.moves=['Dragon Dance','Outrage','Extreme Speed','Earthquake'];
const ordinary=validatePlayerSet(get('shiny-rayquaza'),set);assert.equal(ordinary.tier,'Uber');
set.moves[1]='Dragon Ascent';assert.equal(validatePlayerSet(get('shiny-rayquaza'),set).tier,'AG');
set=clone('charizard');set.item='Charizardite X';assert.equal(validatePlayerSet(get('charizard'),set).form,'Charizard-Mega-X');
for(const [patch,message]of [[{moves:['Spore']},/learn/],[{ability:'Wonder Guard'},/Wonder Guard/],[{evs:{hp:252,atk:252,def:252}},/510/],[{ivs:{hp:32}},/IVs/],[{moves:['Return','Return']},/different/]]){assert.throws(()=>validatePlayerSet(get('eevee'),{...clone('eevee'),...patch}),message);}
assert.throws(()=>validatePlayerSet(get('tatsugiri'),{...clone('tatsugiri'),ability:'Storm Drain'}),/Commander/);
const custom=clone('eevee');custom.moves=['Protect','Return','Quick Attack','Wish'];custom.level=100;
const checked=validatePlayerSet(get('eevee'),custom);assert.equal(checked.set.level,50);
const match=makeMatchup(records,'eevee',['eevee'],()=>0,0,{opponentId:'espeon',playerRecord:checked});match.playerSets={eevee:checked.set};match.enemySets=[ai.espeon[1].set];
const game=new ShelfBattle(records,match,[3,2,1,4]);assert.equal(game.snapshot().options[0][0].move,'Protect');assert.equal(game.battle.p2.pokemon[0].item,ai.espeon[1].set.item.toLowerCase().replace(/[^a-z0-9]/g,''));game.destroy();
let variants=0;
for(const [id,sets]of Object.entries(ai))for(const preset of sets){const checked=validatePlayerSet(get(id),preset.set);assert.equal(checked.tier,get(id).tier,id+' AI tier');variants++;}
const duo=new ShelfBattle(records,{player:['eevee','pikachu'],enemy:['dondozo','tatsugiri'],doubles:true,playerSets:{eevee:{...clone('eevee'),moves:['Helping Hand','Return']}}},[1,2,3,4]);
assert.ok(slotOptions(duo.battle,'p1',0).some(o=>o.move==='Helping Hand'&&o.target===-2));
const helper=slotOptions(duo.battle,'p1',0).find(o=>o.move==='Helping Hand');const attack=slotOptions(duo.battle,'p1',1).find(o=>o.target===1);duo.choose([helper.command,attack.command]);duo.destroy();
console.log(`PASS: starter-only rewards, all directed opponents, tier changes, illegal-set rejection, custom moves/AI loadouts, ally targeting and ${variants} AI tier-consistent legal variants.`);

for(const target of records){const ids=roster.filter((_,i)=>i%2===0).map(p=>p.id);const actual=availablePartners(records,target.id,ids);assert.ok(actual.every(p=>ids.includes(p.id)));for(const p of records)assert.equal(actual.includes(p),ids.includes(p.id)&&eligibleOpponents(records,p).some(q=>q.id===(target.id==='tatsugiri'?'dondozo':target.id)));}
assert.deepEqual(availablePartners(records,'eevee',['koraidon']),[]);
assert.equal(availablePartners(records,'eevee',[]).length,0);
assert.equal(availablePartners(records,'groudon',['shiny-rayquaza']).length,0);
assert.equal(availablePartners(records,'groudon',['shiny-rayquaza'],{'shiny-rayquaza':ordinary}).length,1);
console.log('PASS: target-first availability respects collection, custom tiers, Commander aliases and empty pools.');
