export const TATSUGIRI_FORMS=[{name:'Curly · 上弓',species:'Tatsugiri',art:'tatsugiri',boost:'Attack'},{name:'Droopy · 下垂',species:'Tatsugiri-Droopy',art:'tatsugiri-droopy',boost:'Defense'},{name:'Stretchy · 平挺',species:'Tatsugiri-Stretchy',art:'tatsugiri-stretchy',boost:'Speed'}];
export const ENGINE_VERSION='0.10.11';
export const TIER_ORDER=['LC','NFE','ZU','ZUBL','PU','PUBL','NU','NUBL','RU','RUBL','UU','UUBL','OU','Uber','AG'];
export const isCommander=id=>id==='dondozo'||id==='tatsugiri';
export const FORMATS=[
 {name:'Shelf National Dex Singles',mod:'gen9',gameType:'singles',ruleset:['Standard AG','NatDex Mod','!Team Preview','Adjust Level = 50','Max Team Size = 1','Terastal Clause','Dynamax Clause']},
 {name:'Shelf National Dex Doubles',mod:'gen9',gameType:'doubles',ruleset:['Standard AG','NatDex Mod','!Team Preview','Adjust Level = 50','Max Team Size = 2','Terastal Clause','Dynamax Clause']},
];
export const FORMAT_IDS=['shelfnationaldexsingles','shelfnationaldexdoubles'];
export function eligibleOpponents(roster,selected){
 const rank=TIER_ORDER.indexOf(selected.tier);
 if(rank<0)throw new Error('Unrecognized National Dex tier: '+selected.tier);
 // The Commander duo is one encounter, even though either shelf Pokémon can open it.
 return roster.filter(p=>p.id!=='tatsugiri'&&TIER_ORDER.indexOf(p.tier)>=rank);
}
export function availablePartners(roster,opponentId,collected,custom={}){
 const target=opponentId==='tatsugiri'?'dondozo':opponentId;
 if(!roster.some(p=>p.id===target))return [];
 return roster.filter(p=>collected.includes(p.id)&&eligibleOpponents(roster,custom[p.id]||p).some(q=>q.id===target));
}
export function makeMatchup(roster,playerId,collected,rng=Math.random,playerForm=0,options={}){
 if(!collected.includes(playerId))throw new Error('Choose a Pokémon already on your shelf.');
 const selected=options.playerRecord||roster.find(p=>p.id===playerId);if(!selected)throw new Error('Unknown Pokémon.');
 const eligible=eligibleOpponents(roster,selected);if(!eligible.length)throw new Error('No eligible opponents.');
 const pick=items=>items[Math.min(items.length-1,Math.floor(rng()*items.length))];
 const unseen=eligible.filter(p=>!collected.includes(p.id));
 const enemy=options.opponentId?eligible.find(p=>p.id===(options.opponentId==='tatsugiri'?'dondozo':options.opponentId)):pick(unseen.length?unseen:eligible);
 if(!enemy)throw new Error('Choose an opponent in your current tier or higher.');
 const doubles=isCommander(playerId)||isCommander(enemy.id);
 function team(id,opponent){
  if(isCommander(id))return ['dondozo','tatsugiri'];
  if(!doubles)return [id];
  const pool=(opponent?eligible:roster.filter(p=>collected.includes(p.id)&&TIER_ORDER.indexOf((options.playerRecords?.[p.id]||p).tier)<=TIER_ORDER.indexOf(selected.tier))).filter(p=>!isCommander(p.id)&&p.id!==id);
  // A temporary mirror partner only if the player owns no second eligible shelf member.
  return [id,pick(pool.length?pool:[roster.find(p=>p.id===id)]).id];
 }
 return {playerForm,enemyForm:Number.isInteger(options.enemyForm)&&options.enemyForm>=0&&options.enemyForm<3?options.enemyForm:Math.floor(rng()*3),player:team(playerId,false),enemy:team(enemy.id,true),doubles,primaryEnemy:enemy.id,tier:selected.tier,playerId,revealOpponent:false};
}
