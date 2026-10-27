import fs from 'node:fs';import path from 'node:path';
import {Dex} from '@pkmn/sim';import {build,transform} from 'esbuild';
const out='dist/ps-window';fs.mkdirSync(out,{recursive:true});
const text={};for(const [name,key]of [['default','Default'],['moves','Moves'],['abilities','Abilities'],['items','Items']]){
 const {code}=await transform(fs.readFileSync('build-assets/ps-client/text-'+name+'.ts','utf8'),{loader:'ts',format:'esm'});
 const mod=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));text[key]=Object.values(mod)[0];
}
text.StatNames={hp:'HP',atk:'Attack',def:'Defense',spa:'Special Attack',spd:'Special Defense',spe:'Speed',accuracy:'accuracy',evasion:'evasiveness',stats:'stats'};text.StatMediumNames={...text.StatNames,spa:'Sp. Atk',spd:'Sp. Def'};text.StatShortNames={hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe',accuracy:'Acc',evasion:'Eva'};
const tables={BattlePokedex:Object.fromEntries(Dex.species.all().map(x=>[x.id,x])),BattleMovedex:Object.fromEntries(Dex.moves.all().map(x=>[x.id,x])),BattleItems:Object.fromEntries(Dex.items.all().map(x=>[x.id,x])),BattleAbilities:Object.fromEntries(Dex.abilities.all().map(x=>[x.id,x])),BattleTypeChart:Dex.data.TypeChart,BattleText:{en:text}};
fs.writeFileSync(out+'/data.js',Object.entries(tables).map(([key,val])=>'window.'+key+'='+JSON.stringify(val)+';').join('\n'));
await build({entryPoints:['battle-src/ps-window.mjs'],bundle:true,platform:'browser',format:'esm',minify:true,keepNames:true,define:{global:'window'},outfile:out+'/window.js',inject:['battle-src/jquery-inject.mjs'],plugins:[{name:'local-battle-only',setup(build){build.onLoad({filter:/battle-animations-moves\.ts$/},({path:file})=>({contents:fs.readFileSync(file,'utf8').replace(/([a-zA-Z]+): (BattleOtherAnims\.[a-zA-Z0-9]+\.anim),/g,'$1: (...args) => $2(...args),'),loader:'ts',resolveDir:path.dirname(file)}));build.onResolve({filter:/\/client-(main|connection)$/},()=>({path:path.resolve('battle-src/ps-shim.mjs')}));}}],legalComments:'eof'});
for(const name of ['battle.css','battle-log.css']){let css=fs.readFileSync('build-assets/ps-client/'+name,'utf8');css=css.replace(/url\([^)]*\)/g,match=>match.includes('battle-log.css')?match:'none');fs.writeFileSync(out+'/'+name,css);}
console.log('Built official Showdown battle renderer with local media adapter.');
