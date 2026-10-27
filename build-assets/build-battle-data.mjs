import fs from 'node:fs';
import {transform} from 'esbuild';
import {Dex,TeamValidator} from '@pkmn/sim';
import {PRESETS} from '../battle-src/presets.mjs';
import {FORMATS,TIER_ORDER,isCommander} from '../battle-src/rules.mjs';
if(!Dex.formats.get('shelfnationaldexsingles').exists)Dex.formats.extend(FORMATS);
const src=await transform(fs.readFileSync('build-assets/ps-formats-data.ts','utf8'),{loader:'ts',format:'esm'});
const {FormatsData}=await import('data:text/javascript;base64,'+Buffer.from(src.code).toString('base64'));
const roster=JSON.parse(fs.readFileSync('pokemon-roster.json','utf8'));
const upstream=JSON.parse(fs.readFileSync('build-assets/ps-upstream-commit.json','utf8'));
const records=roster.map(p=>{
 const preset=PRESETS[p.id];if(!preset)throw new Error('Missing '+p.id);
 const errors=new TeamValidator('shelfnationaldexsingles').validateTeam([structuredClone(preset.set)]);
 if(errors)throw new Error(p.id+': '+errors.join('\n'));
 const species=Dex.species.get(preset.form||preset.set.species);
 const data=FormatsData[species.id];
 const rawTier=data?.natDexTier||data?.tier||species.natDexTier;
 const sourceTier=rawTier.replace(/[()]/g,'');
 const tier=isCommander(p.id)?'OU':sourceTier;
 if(!TIER_ORDER.includes(tier))throw new Error(p.id+' unsupported tier: '+tier);
 const tierMap={};
 for(const sp of Dex.species.all()){const d=FormatsData[sp.id];const t=(d?.natDexTier||d?.tier||sp.natDexTier||'').replace(/[()]/g,'');if(sp.baseSpecies===species.baseSpecies&&TIER_ORDER.includes(t))tierMap[sp.name]=t;}
 return {...p,...preset,tierMap,types:species.types,form:species.name,tier,sourceTier,tierOverride:isCommander(p.id),moves:preset.set.moves.map(m=>{const move=Dex.moves.get(m);return {name:move.name,id:move.id,type:move.type,category:move.category,power:move.basePower,accuracy:move.accuracy,pp:move.pp,description:move.shortDesc||move.desc};})};
});
fs.writeFileSync('dist/battle-roster.json',JSON.stringify({engine:'@pkmn/sim',version:'0.10.11',tierSource:'https://github.com/smogon/pokemon-showdown/blob/'+upstream.sha+'/data/formats-data.ts',tierRevision:upstream.sha,tierDate:upstream.commit.committer.date,records},null,2)+'\n');
console.log(records.map(p=>p.name+': '+p.tier+(p.tierOverride?' (Commander override; species '+p.sourceTier+')':'')).join('\n'));

const legalItem=i=>i.gen<=9&&!['Custom','CAP','Unobtainable'].includes(i.isNonstandard)&&!i.isPokeball&&!i.zMove&&!i.zMoveType;
const editor={items:Dex.items.all().filter(legalItem).map(i=>({name:i.name,description:i.shortDesc})),natures:Dex.natures.all().map(n=>n.name),species:{}};
for(const p of records){const sp=Dex.species.get(p.set.species);editor.species[p.id]={abilities:[...new Set(Object.values(sp.abilities))],moves:[...new Set([...Dex.species.getMovePool(sp.id,true),...(Dex.species.getMovePool(sp.id,true).has('hiddenpower')?Dex.types.all().filter(t=>!['Normal','Fairy','Stellar','???'].includes(t.name)).map(t=>'hiddenpower'+t.id):[])])].map(m=>Dex.moves.get(m)).filter(m=>!m.isZ&&!m.isMax&&m.gen<=9).sort((a,b)=>a.name.localeCompare(b.name)).map(m=>({name:m.name,type:m.type,description:m.shortDesc||m.desc}))};}
fs.writeFileSync('dist/battle-editor.json',JSON.stringify(editor)+'\n');
