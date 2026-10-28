import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Battle,Dex} from '@pkmn/sim';
import {level50Stats,natureLabel,effectiveStatForm,cappedEV,STAT_KEYS} from './dist/stat-preview.mjs';
import {effectiveSpecies} from './battle-src/sets.mjs';
const editor=JSON.parse(fs.readFileSync('dist/battle-editor.json'));
const roster=JSON.parse(fs.readFileSync('dist/battle-roster.json')).records;
const battle=new Battle({formatid:'gen9customgame'});let count=0;
for(const p of roster){const catalog=editor.species[p.id];
 assert.equal(effectiveStatForm(catalog,p.set.item,p.set.moves),effectiveSpecies(p.set));
 assert.equal(effectiveStatForm(catalog,'',[]),catalog.baseForm);
 for(const [form,base]of Object.entries(catalog.statForms))for(const nature of editor.natures)for(const value of [0,4,128,252]){
  const evs=Object.fromEntries(STAT_KEYS.map(k=>[k,value])),ivs=Object.fromEntries(STAT_KEYS.map((k,i)=>[k,[0,15,31][i%3]]));
  assert.deepEqual(level50Stats(base,evs,ivs,editor.natureEffects[nature]),battle.spreadModify(base,{level:50,nature,evs,ivs}),form+' '+nature);count++;
 }
}
battle.destroy();
assert.equal(natureLabel('Adamant',editor.natureEffects),'Adamant (+Atk, −SpA)');
assert.equal(natureLabel('Hardy',editor.natureEffects),'Hardy (neutral)');
assert.equal(cappedEV({hp:4,atk:252,spe:252},'hp',252),6);
assert.equal(cappedEV({hp:4,atk:252,spe:252},'atk',0),0);
assert.equal(cappedEV({},'hp',999),252);
assert.equal(cappedEV({},'hp',-1),0);
assert.equal(effectiveStatForm(editor.species.charizard,'CHARIZARDITE X',[]),'Charizard-Mega-X');
assert.equal(effectiveStatForm(editor.species['shiny-rayquaza'],'',['Dragon Ascent']),'Rayquaza-Mega');
console.log(`PASS: ${count} live stat previews match the Showdown engine, including all 25 natures, IV/EV rounding and Mega/Primal forms; EV allocation respects 252/510 limits.`);
