import {Battle,Dex} from '@pkmn/sim';
import {validatePlayerSet} from './sets.mjs';
import {FORMATS,FORMAT_IDS,TATSUGIRI_FORMS,TIER_ORDER} from './rules.mjs';
if(!Dex.formats.get('shelfnationaldexsingles').exists)Dex.formats.extend(FORMATS);
const targeted=new Set(['normal','any','adjacentFoe','adjacentAlly','adjacentAllyOrSelf']);
export function slotOptions(battle,sideId,index){
 const side=battle[sideId],p=side.active[index],request=side.activeRequest?.active?.[index];
 if(!p||p.fainted||p.volatiles.commanding)return [{command:'pass',pass:true}];
 if(!request)return [];
 const options=[];
 for(const [i,move] of request.moves.entries()){
  if(move.disabled||move.pp===0)continue;
  const dexMove=battle.dex.moves.get(move.id);
  let targets=[0];
  if(battle.gameType==='doubles'&&targeted.has(move.target)){targets=[...p.foes(),...p.side.active].filter(x=>x&&!x.fainted&&!x.volatiles.commanding&&battle.validTarget(x,p,move.target)).map(x=>p.getLocOf(x));if(!targets.length)targets=[0];}
  for(const target of targets){
   const base='move '+(i+1)+(target?' '+target:'');
   const fields={move:move.move,id:move.id,type:dexMove.type,category:dexMove.category,power:dexMove.basePower,accuracy:dexMove.accuracy,description:dexMove.shortDesc||dexMove.desc,pp:move.pp,maxpp:move.maxpp,target,index:i+1};
   options.push({...fields,command:base,mega:false});
   if(request.canMegaEvo)options.push({...fields,command:base+' mega',mega:true});
  }
 }
 if(!options.length)options.push({command:'move 1',move:'Struggle',id:'struggle',type:'Normal',category:'Physical',power:50,accuracy:true,pp:1,maxpp:1,description:'Used automatically when no moves are available.'});
 return options;
}
function actionOptions(battle,sideId){
 const options=battle[sideId].active.map((_,i)=>slotOptions(battle,sideId,i));
 let combos=[[]];
 for(const opts of options){
  // Always Mega Evolve for this preset when possible, at most once per team.
  const use=opts;
  combos=combos.flatMap(xs=>use.map(o=>[...xs,o]));
 }
 const maxMega=Math.min(1,Math.max(...combos.map(xs=>xs.filter(o=>o.mega).length)));
 return combos.filter(xs=>xs.filter(o=>o.mega).length===maxMega).map(xs=>xs.map(o=>o.command).join(', '));
}
function scoreState(b,sideId){
 if(b.ended)return b.winner===b[sideId].name?10000:b.winner?-10000:0;
 const scoreSide=side=>side.pokemon.reduce((sum,p)=>{
  if(p.fainted)return sum-1.7;
  let v=p.hp/p.maxhp;
  const physical=p.moves.some(m=>b.dex.moves.get(m).category==='Physical');
  const special=p.moves.some(m=>b.dex.moves.get(m).category==='Special');
  v+=Math.min(3,p.boosts.atk)*.06*physical+Math.min(3,p.boosts.spa)*.06*special+Math.min(3,p.boosts.def)*.025+Math.min(3,p.boosts.spd)*.025+Math.min(2,p.boosts.spe)*.035;
  if(p.status==='slp')v-=p.moves.includes('sleeptalk')?.025:.23;
  if(p.status==='frz')v-=.4;
  if(p.status==='par')v-=.12;
  if(p.status==='tox')v-=.16;
  if(p.status==='psn')v-=.09;
  if(p.status==='brn')v-=physical&&p.ability!=='guts'?.22:.07;
  if(p.volatiles.substitute)v+=.15;
  if(p.volatiles.leechseed)v-=.18;
  if(p.volatiles.confusion)v-=.08;
  if(p.side.slotConditions[p.position]?.wish)v+=Math.min(.2,1-p.hp/p.maxhp);
  return sum+v;
 },0);
 return scoreSide(b[sideId])-scoreSide(b[sideId==='p1'?'p2':'p1']);
}
export function chooseBotAction(b,sideId='p2'){
 const opts=actionOptions(b,sideId);if(!opts.length)return 'default';if(opts.length===1)return opts[0];
 const foeId=sideId==='p1'?'p2':'p1';
 const responses=actionOptions(b,foeId);
 // Bound doubles search. Spread samples across the available responses, never inspect the human's submitted choice.
 const samples=responses.length<=4?responses:[responses[0],responses[Math.floor(responses.length/3)],responses[Math.floor(2*responses.length/3)],responses.at(-1)];
 const candidates=opts.length<=16?opts:opts.filter((_,i)=>i%Math.ceil(opts.length/16)===0);
 const saved=JSON.stringify(b.toJSON());let best=candidates[0],bestScore=-Infinity;
 for(const action of candidates){let total=0,worst=Infinity,valid=0;
  for(const [i,response]of samples.entries()){
   const sim=Battle.fromJSON(saved);
   // Search uses independent deterministic samples, not the real turn's random rolls.
   sim.resetRNG([b.turn+101,i+307,17,43]);
   let ok;
   try{ok=sim.choose(sideId,action)&&sim.choose(foeId,response);}catch{ok=false;}
   if(ok){const score=scoreState(sim,sideId);total+=score;worst=Math.min(worst,score);valid++;}
   sim.destroy();
  }
  if(valid){const score=.65*total/valid+.35*worst;if(score>bestScore){bestScore=score;best=action;}}
 }
 return best;
}
function publicLines(lines){
 const out=[];for(let i=0;i<lines.length;i++){
  if(lines[i].startsWith('|split|')){i++;continue;}out.push(lines[i]);
 }return out;
}
export class ShelfBattle {
 constructor(records,matchup,seed){
  this.records=records;this.matchup=matchup;this.closed=false;
  const byId=id=>records.find(p=>p.id===id);
  const playerRecords=Object.fromEntries(matchup.player.map(id=>[id,matchup.playerSets?.[id]?validatePlayerSet(byId(id),matchup.playerSets[id]):byId(id)]));
  const lead=playerRecords[matchup.playerId||matchup.player[0]];
  if(matchup.tier&&matchup.enemy.some(id=>TIER_ORDER.indexOf(byId(id).tier)<TIER_ORDER.indexOf(lead.tier)))throw new Error('The opponent is below your edited set’s tier.');
  this.battle=new Battle({formatid:FORMAT_IDS[matchup.doubles?1:0],...(seed?{seed}:{})});
  for(const [side,ids]of [['p1',matchup.player],['p2',matchup.enemy]]){
   this.battle.setPlayer(side,{name:side==='p1'?'You':'Challenger',team:ids.map((id,i)=>{
    const set=structuredClone(side==='p1'?playerRecords[id].set:matchup.enemySets?.[i]||byId(id).set);if(id==='tatsugiri')set.species=TATSUGIRI_FORMS[side==='p1'?matchup.playerForm||0:matchup.enemyForm||0].species;set.name=(side==='p1'?'Partner ':'Challenger ')+(i+1);return set;
   })});
  }
  this.botAction=chooseBotAction(this.battle);
 }
 snapshot(){
  const b=this.battle,thisMatch=this.matchup;
  function mon(p,id){return {id,artId:id==='tatsugiri'?TATSUGIRI_FORMS[p.side.id==='p1'?thisMatch.playerForm||0:thisMatch.enemyForm||0].art:id,name:p.species.name,level:p.level,hp:p.hp,maxhp:p.maxhp,status:p.status,fainted:p.fainted,commanding:!!p.volatiles.commanding,commanded:!!p.volatiles.commanded,boosts:{...p.boosts},types:p.getTypes(),ability:b.dex.abilities.get(p.ability).name,item:b.dex.items.get(p.item).name};}
  return {revealOpponent:false,turn:b.turn,ended:b.ended,won:b.ended&&b.winner==='You',draw:b.ended&&!b.winner,doubles:this.matchup.doubles,
   player:b.p1.active.map((p,i)=>mon(p,this.matchup.player[i])),enemy:b.p2.active.map((p,i)=>mon(p,this.matchup.enemy[i])),
   options:b.ended?[]:b.p1.active.map((_,i)=>slotOptions(b,'p1',i)),weather:b.field.weather,terrain:b.field.terrain,
   log:publicLines(b.log).filter(l=>!l.startsWith('|t:|')),rewardIds:b.ended&&b.winner==='You'?[...new Set(this.matchup.enemy)]:[],
  };
 }
 choose(commands){
  if(this.closed||this.battle.ended)throw new Error('This battle has ended.');
  const options=this.battle.p1.active.map((_,i)=>slotOptions(this.battle,'p1',i));
  if(commands.filter(c=>c.includes(' mega')).length>1)throw new Error('Only one Mega Evolution per team.');
  if(commands.length!==options.length||commands.some((c,i)=>!options[i].some(o=>o.command===c)))throw new Error('Choose an available move for each active Pokémon.');
  const action=commands.join(', ');
  if(!this.battle.choose('p1',action))throw new Error(this.battle.p1.choice.error||'Invalid move.');
  if(!this.battle.choose('p2',this.botAction))throw new Error('The challenger could not choose a move.');
  // Finite local sessions also avoid exceptionally long non-damaging mirrors.
  if(!this.battle.ended&&this.battle.turn>100)this.battle.tie();
  if(!this.battle.ended)this.botAction=chooseBotAction(this.battle);
  return this.snapshot();
 }
 destroy(){this.closed=true;this.battle.destroy();}
}
