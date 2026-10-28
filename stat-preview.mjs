export const STAT_KEYS=['hp','atk','def','spa','spd','spe'];
export const STAT_LABELS={hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe'};
export function natureLabel(name,effects){const n=effects[name];return n?.plus?`${name} (+${STAT_LABELS[n.plus]}, −${STAT_LABELS[n.minus]})`:`${name} (neutral)`;}
export function effectiveStatForm(catalog,item,moves){
 const id=value=>String(value).toLowerCase().replace(/[^a-z0-9]/g,'');
 return catalog.itemForms[id(item)]||(catalog.dragonAscentForm&&moves.some(m=>id(m)==='dragonascent')?catalog.dragonAscentForm:catalog.baseForm);
}
export function level50Stats(base,evs,ivs,nature={}){
 return Object.fromEntries(STAT_KEYS.map(k=>{
  const value=Math.floor((2*base[k]+Number(ivs[k]??31)+Math.floor(Number(evs[k]??0)/4))*50/100);
  return [k,k==='hp'?(base.hp===1?1:value+60):Math.floor((value+5)*(nature.plus===k?110:nature.minus===k?90:100)/100)];
 }));
}
export function cappedEV(evs,key,value){return Math.max(0,Math.min(252,Math.trunc(Number(value)||0),510-STAT_KEYS.filter(k=>k!==key).reduce((sum,k)=>sum+Number(evs[k]||0),0)));}
