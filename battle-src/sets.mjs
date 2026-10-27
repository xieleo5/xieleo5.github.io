import {Dex,TeamValidator,toID} from '@pkmn/sim';
import {FORMATS,FORMAT_IDS,isCommander,TIER_ORDER} from './rules.mjs';
if(!Dex.formats.get('shelfnationaldexsingles').exists)Dex.formats.extend(FORMATS);
const stats=['hp','atk','def','spa','spd','spe'];
export function effectiveSpecies(set){
 const species=Dex.species.get(set.species),item=Dex.items.get(set.item);
 if(item.megaStone?.[species.name])return item.megaStone[species.name];
 if(species.baseSpecies==='Rayquaza'&&set.moves.some(m=>toID(m)==='dragonascent'))return 'Rayquaza-Mega';
 if(species.baseSpecies==='Groudon'&&item.id==='redorb')return 'Groudon-Primal';
 if(species.baseSpecies==='Kyogre'&&item.id==='blueorb')return 'Kyogre-Primal';
 if(species.baseSpecies==='Zacian'&&item.id==='rustedsword')return 'Zacian-Crowned';
 return species.name;
}
export function validatePlayerSet(record,input){
 if(!record||!input)throw new Error('Choose a Pokémon and enter a set.');
 const allowed=Dex.species.get(record.set.species);
 if(input.species&&toID(input.species)!==allowed.id)throw new Error('Keep the species assigned to this shelf slot.');
 const set={species:allowed.name,name:allowed.name,level:50,item:String(input.item||''),ability:String(input.ability||''),nature:String(input.nature||''),moves:Array.isArray(input.moves)?input.moves.map(String).filter(Boolean):[],evs:{},ivs:{},...(record.set.shiny?{shiny:true}:{})};
 if(!set.moves.length||set.moves.length>4||new Set(set.moves.map(toID)).size!==set.moves.length)throw new Error('Choose 1–4 different moves.');
 for(const k of stats){const ev=Number(input.evs?.[k]??0),iv=Number(input.ivs?.[k]??31);if(!Number.isInteger(ev)||ev<0||ev>252||!Number.isInteger(iv)||iv<0||iv>31)throw new Error('EVs must be integers from 0 to 252; IVs from 0 to 31.');set.evs[k]=ev;set.ivs[k]=iv;}
 if(Object.values(set.evs).reduce((a,b)=>a+b,0)>510)throw new Error('Total EVs cannot exceed 510.');
 if(!Dex.natures.get(set.nature).exists)throw new Error('Choose a valid nature.');
 const item=Dex.items.get(set.item);if(record.id==='ogerpon-teal'&&item.forcedForme)throw new Error('This shelf slot uses Ogerpon’s Teal Mask form. Choose a different item.');if(item.zMove||item.zMoveType)throw new Error('Z-Moves are not supported in this shelf format.');
 if(record.id==='tatsugiri'&&toID(set.ability)!=='commander')throw new Error('Keep Commander for the Dondozo + Tatsugiri encounter.');
 const checked=[structuredClone(set)];const errors=new TeamValidator(FORMAT_IDS[0]).validateTeam(checked);if(errors)throw new Error(errors.join('\n'));
 set.moves=checked[0].moves.map(m=>Dex.moves.get(m).name);set.ivs=checked[0].ivs;set.item=item.name||'';set.ability=Dex.abilities.get(set.ability).name;set.nature=Dex.natures.get(set.nature).name;
 const form=effectiveSpecies(set),species=Dex.species.get(form);
 const sourceTier=record.tierMap?.[form]||species.natDexTier.replace(/[()]/g,'');
 const tier=isCommander(record.id)?'OU':sourceTier;
 if(!TIER_ORDER.includes(tier))throw new Error('This form has no supported National Dex tier.');
 return {...record,set,form,tier,sourceTier,moves:set.moves.map(name=>{const m=Dex.moves.get(name);return {name:m.name,type:m.type,description:m.shortDesc||m.desc};}),custom:true};
}
