import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Dex,TeamValidator} from '@pkmn/sim';
import {FORMATS} from '../battle-src/rules.mjs';

// Stats are marginal frequencies, not complete teams. The source JSON below is
// deliberately curated into coherent fixed sets for this site's no-switch mode.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const write=(name,value)=>fs.writeFileSync(path.join(root,name),JSON.stringify(value,null,2)+'\n');
const presets=read('battle-presets.json'),curated=read('battle-ai-presets.json');
const month=process.argv.find(x=>/^\d{4}-\d{2}$/.test(x))||'2026-09';
const formats=['gen9nationaldex','gen9nationaldexubers','gen9nationaldexuu','gen9nationaldexdoubles','gen9anythinggoes'];
const sources=formats.map(format=>({format,month,cutoff:1500,url:`https://www.smogon.com/stats/${month}/chaos/${format}-1500.json`}));
const snapshotName=`build-assets/stats/shelf-usage-${month}.json`;
const relevant=new Set(Object.values(presets).flatMap(p=>[p.set.species,p.form].filter(Boolean)));
const compact=(data)=>{
 const out={};
 for(const[name,stats]of Object.entries(data))if(relevant.has(name)){
  const denominator=Object.values(stats.Abilities||{}).reduce((a,b)=>a+b,0);
  const top=(field)=>Object.fromEntries(Object.entries(stats[field]||{}).sort((a,b)=>b[1]-a[1]).slice(0,24).map(([key,count])=>[key,denominator?Number((count/denominator*100).toFixed(3)):0]));
  out[name]={rawCount:stats['Raw count'],usage:stats.usage,abilities:top('Abilities'),items:top('Items'),moves:top('Moves'),spreads:top('Spreads')};
 }
 return out;
};
let usage;
if(process.argv.includes('--refresh')){
 const snapshots=[];
 for(const source of sources){
  const res=await fetch(source.url);if(!res.ok)throw new Error(`Stats download failed (${res.status}): ${source.url}`);
  const raw=await res.json();if(raw.info?.metagame!==source.format)throw new Error('Unexpected stats format');
  snapshots.push({...source,battles:raw.info['number of battles'],pokemon:compact(raw.data)});
 }
 usage={note:'Extracted top-24 marginal usage percentages for shelf species only; not full sets or joint probabilities.',sources:snapshots};
 fs.mkdirSync(path.dirname(path.join(root,snapshotName)),{recursive:true});write(snapshotName,usage);
}else if(fs.existsSync(path.join(root,snapshotName))){usage=read(snapshotName);}
else{
 const snapshots=sources.map(source=>{
  const raw=read(`build-assets/stats/${source.format}-1500-${month}.json`);
  if(raw.info?.metagame!==source.format)throw new Error('Unexpected stats format');
  return {...source,battles:raw.info['number of battles'],pokemon:compact(raw.data)};
 });
 usage={note:'Extracted top-24 marginal usage percentages for shelf species only; not full sets or joint probabilities.',sources:snapshots};write(snapshotName,usage);
}
if(!Dex.formats.get('shelfnationaldexsingles').exists)Dex.formats.extend(FORMATS);
const validator=new TeamValidator('shelfnationaldexsingles');
const records={};
for(const[id,base]of Object.entries(presets)){
 const variants=curated[id]||[{id:'balanced',label:'Shelf standard',...base}];
 const desired=base.form||base.set.species;
 // Preserve the configured battle form: comparing Mega usage with ordinary
 // species usage can falsely describe a build as common in a different tier.
 let hits=usage.sources.filter(s=>s.pokemon[desired]).map(s=>({source:s,name:desired,stats:s.pokemon[desired]}));
 if(!hits.length)hits=usage.sources.filter(s=>s.pokemon[base.set.species]).map(s=>({source:s,name:base.set.species,stats:s.pokemon[base.set.species]}));
 const preferred=(h)=>{
  if(['dondozo','tatsugiri'].includes(id))return h.source.format==='gen9nationaldexdoubles'?5:0;
  if(['koraidon','shiny-rayquaza'].includes(id))return h.source.format==='gen9anythinggoes'?5:0;
  return h.source.format==='gen9nationaldexdoubles'?0:h.source.format==='gen9anythinggoes'?1:3;
 };
 hits.sort((a,b)=>preferred(b)-preferred(a)||b.stats.rawCount-a.stats.rawCount);
 const hit=hits[0],seen=new Set();
 records[id]=variants.map((v,index)=>{
  const set=structuredClone(v.set);set.level=50;
  if(set.species!==base.set.species)throw new Error(`${id}: AI variants must preserve the species.`);
  if((v.form||v.set.species)!==(base.form||base.set.species))throw new Error(`${id}: AI variants must preserve the battle form/tier.`);
  if(base.mega&&set.item!==base.set.item)throw new Error(`${id}: keep the Mega stone (or Rayquaza item) fixed unless explicitly reviewed.`);
  if(['groudon','kyogre','zacian'].includes(id)&&set.item!==base.set.item)throw new Error(`${id}: preserve the Primal/Crowned item.`);
  if(id==='tatsugiri'&&set.ability!=='Commander')throw new Error('Tatsugiri variants must keep Commander.');
  if(id==='dondozo'&&!set.moves.includes('Order Up'))throw new Error('Dondozo variants must keep Order Up.');
  const errors=validator.validateTeam([structuredClone(set)]);if(errors)throw new Error(`${id}/${v.id}: ${errors.join('; ')}`);
  const signature=JSON.stringify(set);if(seen.has(signature))throw new Error(`${id}: duplicate AI variant`);seen.add(signature);
  const evidence=hit?{source:hit.source.url,format:hit.source.format,month,cutoff:1500,species:hit.name,rawCount:hit.stats.rawCount,itemPercent:hit.stats.items[Dex.toID(set.item)]||0,abilityPercent:hit.stats.abilities[Dex.toID(set.ability)]||0,movePercent:Object.fromEntries(set.moves.map(move=>[move,hit.stats.moves[Dex.toID(move)]||0]))}:null;
  const supported=evidence&&evidence.rawCount>=100&&evidence.itemPercent>=1&&Object.values(evidence.movePercent).filter(x=>x>=1).length>=Math.min(2,set.moves.length);
  return {...v,set,provenance:{kind:supported?'usage-informed':'curated-fallback',note:supported?'A complete curated duel set informed by marginal Showdown usage; not an observed joint set or exact usage ranking.':'Curated legal duel set; insufficient matching usage data to call this a common competitive configuration.',...(evidence?{evidence}:{})}};
 });
}
write('dist/battle-ai-sets.json',{schemaVersion:1,month,sources:usage.sources.map(({pokemon,...source})=>source),note:'AI randomly chooses a complete fixed preset before battle. Smogon usage data contains marginal moves/items/abilities/spreads, not complete configurations. Sets are curated for this custom level-50 no-switch mode; uncommon species use explicitly labelled fallbacks.',records});
console.log(`Built ${Object.values(records).reduce((n,a)=>n+a.length,0)} legal AI sets for ${Object.keys(records).length} shelf Pokémon using ${month} stats.`);
