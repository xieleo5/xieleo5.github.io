import {validatePlayerSet} from './sets.mjs';
import {ShelfBattle} from './engine.mjs';
let game;
self.onmessage=event=>{
 const {id,type,payload}=event.data;
 try{
  if(type==='validate'){self.postMessage({id,state:validatePlayerSet(payload.record,payload.set)});return;}
  if(type==='start'){game?.destroy();game=new ShelfBattle(payload.records,payload.matchup);}
  else if(type==='choose'){if(!game)throw new Error('Start a battle first.');game.choose(payload.commands);}
  else throw new Error('Unknown battle request.');
  self.postMessage({id,state:game.snapshot()});
 }catch(error){self.postMessage({id,error:error.message||String(error)});}
};
self.postMessage({ready:true});
