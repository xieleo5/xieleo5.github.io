import {Battle} from '../build-assets/ps-client/battle.ts';
import {BattleScene,PokemonSprite} from '../build-assets/ps-client/battle-animations.ts';
import {Dex,toID} from '../build-assets/ps-client/battle-dex.ts';
import {BattleLog} from '../build-assets/ps-client/battle-log.ts';
import {BattleTextParser} from '../build-assets/ps-client/battle-text-parser.ts';
import DOMPurify from 'dompurify';
// Isolate upstream battle rendering from the website. All art is local PokéAPI media.
Dex.resourcePrefix='./';Dex.fxPrefix='./fx/';
Dex.prefs=name=>name==='mute'?true:undefined;
BattleLog.sanitizeHTML=html=>DOMPurify.sanitize(html);
BattleScene.prototype.preloadEffects=function(){};
BattleScene.prototype.rollBgm=function(){};
BattleScene.prototype.setBgm=function(){};
BattleScene.prototype.updateBgm=function(){};
BattleScene.prototype.updateGen=function(){this.gen=this.battle.gen;this.activeCount=this.battle.nearSide?.active.length||1;this.backdropImage='background.svg';this.$bg?.css('background-image','url(./background.svg)');};
Dex.getAvatar=()=> '../assets/poke-ball.png';
Dex.getPokemonIcon=()=> 'background:none';
let art={},latest=null,battle=null,revealed=false,logLength=0;
const fallback='../assets/menu-icons/eevee.png';
Dex.getSpriteData=(pokemon,isFront,options={})=>{
 const name=typeof pokemon==='string'?pokemon:pokemon.getSpeciesForme();
 const species=Dex.species.get(name),key=toID(name),entry=art[key]||art[toID(species.baseSpecies)];
 const chosen=entry?.[isFront?'front':'back']||{url:fallback,w:96,h:96};
 return {gen:9,w:chosen.w,h:chosen.h,y:0,url:chosen.url,pixelated:false,isFrontSprite:!!isFront,cryurl:'',shiny:!!options.shiny};
};
const originalFull=BattleTextParser.prototype.pokemonFull;
BattleTextParser.prototype.pokemonFull=function(pokemon,details){if(pokemon.startsWith('p2')&&!revealed)return ['p2','Mystery Pokémon'];return originalFull.call(this,pokemon,details);};
const originalStatbar=PokemonSprite.prototype.getStatbarHTML;
PokemonSprite.prototype.getStatbarHTML=function(pokemon){
 const old=pokemon.name;pokemon.name=pokemon.side.isFar&&!revealed?'Mystery Pokémon':pokemon.speciesForme;
 let html=originalStatbar.call(this,pokemon);pokemon.name=old;
 // The shelf battle omits purely decorative icon dependencies.
 return html.replace(/<img\b[^>]*>/g,'');
};
function size(){
 const w=document.documentElement.clientWidth,wide=w>=760,scale=wide?1:Math.min(1,w/640);
 const frame=document.querySelector('#battle');frame.style.transform=`scale(${scale})`;frame.style.transformOrigin='top left';
 document.querySelector('#battle-wrap').style.height=(360*scale)+'px';
 document.body.classList.toggle('wide',wide);
 parent.postMessage({type:'ps-window-size',height:wide?360:360*scale+140},location.origin);
}
function conceal(){
 if(!battle)return;
 battle.scene.$sprites[1]?.css('filter',revealed?'none':'brightness(0) opacity(.65)');
 battle.scene.$spritesFront[1]?.css('filter',revealed?'none':'brightness(0) opacity(.65)');
 battle.scene.$tooltips?.css('display','none');
 for(const [i,side]of battle.sides.entries())for(const [j,p]of (side.active||[]).entries())if(p&&(i===0?latest.player:latest.enemy)[j]?.commanding){p.sprite?.$el?.css('opacity',0);p.sprite?.$statbar?.css('display','none');}
 document.querySelector('#commander-note').textContent=latest.player.some(p=>p.commanding)?'Commander · Tatsugiri is inside Dondozo':'';
}
function render(message){
 latest=message;revealed=!!message.won;document.body.classList.toggle('revealed',revealed);
 const log=message.log.map(line=>line.replace(/p1([ab]): Partner ([12])/g,(_,pos,num)=>'p1'+pos+': '+(message.player[Number(num)-1]?.name||'Partner')).replace(/p2([ab]): Challenger ([12])/g,(_,pos,num)=>'p2'+pos+': '+(revealed?message.enemy[Number(num)-1]?.name||'Challenger':'Mystery '+num)));
 if(!battle||log.length<logLength||message.reset){battle?.destroy();battle=new Battle({$frame:$('#battle'),$logFrame:$('#battle-log'),id:'battle-shelf-1',log,paused:true,isReplay:false});logLength=log.length;}
 else{for(const line of log.slice(logLength))battle.add(line);logLength=log.length;}
 battle.seekTurn(Infinity);conceal();
 // Keep the final state readable; the Pokémon GIFs themselves remain animated.
 for(const side of battle.sides)for(const pokemon of side.active||[])if(pokemon)pokemon.sprite?.resetStatbar(pokemon);
 conceal();size();document.querySelector('#battle-log').scrollTop=document.querySelector('#battle-log').scrollHeight;
 parent.postMessage({type:'ps-window-rendered',turn:message.turn},location.origin);
}
window.addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='shelf-battle-state')return;try{render(event.data.state);}catch(error){console.error(error);parent.postMessage({type:'ps-window-error',message:error.message},location.origin);}});
window.addEventListener('resize',size);
art=await (await fetch('../battle-art.json')).json();size();parent.postMessage({type:'ps-window-ready'},location.origin);
