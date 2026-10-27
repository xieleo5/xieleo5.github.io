import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TeamValidator} from '@pkmn/sim';
import {ShelfBattle,chooseBotAction,slotOptions} from './battle-src/engine.mjs';
import {PRESETS} from './battle-src/presets.mjs';
import {TIER_ORDER,eligibleOpponents,makeMatchup,isCommander,TATSUGIRI_FORMS} from './battle-src/rules.mjs';
const records=JSON.parse(fs.readFileSync('dist/battle-roster.json')).records;
const roster=JSON.parse(fs.readFileSync('pokemon-roster.json'));
assert.equal(records.length,roster.length);assert.deepEqual(records.map(p=>p.id),roster.map(p=>p.id));
for(const p of records){
 assert.equal(p.set.level,50);assert.equal(new TeamValidator('shelfnationaldexsingles').validateTeam([structuredClone(p.set)]),null,p.id+' is legal');
 const pool=eligibleOpponents(records,p);assert.ok(pool.length);
 assert.ok(pool.every(q=>TIER_ORDER.indexOf(q.tier)>=TIER_ORDER.indexOf(p.tier)));
 for(let i=0;i<12;i++){
  let rngCount=0;const rng=()=>((i*17+(rngCount++)*31)%100)/100;
  const match=makeMatchup(records,p.id,[p.id],rng);
  assert.ok(match.enemy.every(id=>TIER_ORDER.indexOf(records.find(q=>q.id===id).tier)>=TIER_ORDER.indexOf(p.tier)));
  assert.equal(match.doubles,isCommander(p.id)||isCommander(match.primaryEnemy));
 }
}
assert.throws(()=>makeMatchup(records,'eevee',[]),/already on your shelf/);
assert.deepEqual(eligibleOpponents(records,records.find(p=>p.id==='shiny-rayquaza')).map(p=>p.id).sort(),['koraidon','shiny-rayquaza']);
console.log('PASS: all roster entries have legal level-50 presets; every matchup respects effective National Dex tiers and shelf ownership.');
for(const [form,stat]of ['atk','def','spe'].entries()){
 const game=new ShelfBattle(records,{player:['dondozo','tatsugiri'],enemy:['groudon','kyogre'],doubles:true,playerForm:form},[1,2,3,4]);
 const s=game.snapshot();assert.equal(s.player[1].commanding,true);assert.equal(s.player[0].commanded,true);
 for(const key of ['atk','def','spa','spd','spe'])assert.equal(s.player[0].boosts[key],2);
 assert.deepEqual(slotOptions(game.battle,'p1',1),[{command:'pass',pass:true}]);
 game.botAction='move 1, move 1';const next=game.choose(['move 1 1','pass']);assert.equal(next.player[0].boosts[stat],3,TATSUGIRI_FORMS[form].name+' Order Up');
 assert.equal(next.player[1].artId,TATSUGIRI_FORMS[form].art);game.destroy();
}
console.log('PASS: all three Commander forms merge, skip Tatsugiri actions, and grant the correct Order Up boost.');
let completed=0;const started=Date.now();
for(const [i,p] of records.entries()){
 const foe=records[(i+11)%records.length];
 const doubles=isCommander(p.id)||isCommander(foe.id);
 const player=isCommander(p.id)?['dondozo','tatsugiri']:doubles?[p.id,'scizor']:[p.id];
 const enemy=isCommander(foe.id)?['dondozo','tatsugiri']:doubles?[foe.id,'charizard']:[foe.id];
 const game=new ShelfBattle(records,{player,enemy,doubles},[i+1,2,3,4]);
 assert.ok(game.snapshot().player.every(m=>m.level===50));
 const before=JSON.stringify(game.battle.toJSON());chooseBotAction(game.battle);assert.equal(JSON.stringify(game.battle.toJSON()),before,'Bot search must never mutate the real battle');
 let turn=0;
 while(!game.battle.ended&&turn++<101){
  const command=chooseBotAction(game.battle,'p1');assert.notEqual(command,'default',p.id+' should have a legal move');
  game.choose(command.split(', '));
 }
 const s=game.snapshot();assert.equal(s.ended,true,p.id+' completes');
 assert.deepEqual(s.rewardIds,s.won?[...new Set(enemy)]:[],'Only wins award opponents');
 assert.ok([...s.player,...s.enemy].every(m=>m.hp>=0&&m.hp<=m.maxhp));game.destroy();completed++;
}
console.log('PASS:',completed,'complete engine battles, non-mutating bot planning, valid HP, and victory-only rewards in',((Date.now()-started)/1000).toFixed(1)+'s.');
