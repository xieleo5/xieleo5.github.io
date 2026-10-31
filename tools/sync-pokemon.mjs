import fs from 'node:fs';
import {PNG} from 'pngjs';
import {execFileSync} from 'node:child_process';
const roster=JSON.parse(fs.readFileSync('pokemon-roster.json'));
const presets=JSON.parse(fs.readFileSync('battle-presets.json'));
if(new Set(roster.map(p=>p.id)).size!==roster.length)throw new Error('Duplicate roster IDs');
for(const p of roster)if(!presets[p.id])throw new Error('Missing preset for '+p.id);
fs.writeFileSync('battle-src/presets.mjs','// Generated from battle-presets.json by npm run pokemon:sync.\nexport const PRESETS='+JSON.stringify(presets,null,2)+';\n');
let runtime=fs.readFileSync('dist/pokemon.js','utf8');
runtime=runtime.replace(/const companions=\[[\s\S]*?\];/,'const companions='+JSON.stringify(roster,null,1)+';');
const offsets={};
for(const id of [...roster.map(p=>p.id),'tatsugiri-droopy','tatsugiri-stretchy']){
 const png=PNG.sync.read(fs.readFileSync('dist/assets/menu-icons/'+id+'.png'));let bottom=0;
 for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++)if(png.data[(y*png.width+x)*4+3])bottom=Math.max(bottom,y+1);
 if(!bottom)throw new Error('Empty image '+id);
 const side=Math.max(png.width,png.height);offsets[id]=+(((side-png.height)/2+png.height-bottom)/side*100).toFixed(3);
}
runtime=runtime.replace(/const floorOffsets=\{[^;]+\};/,'const floorOffsets='+JSON.stringify(offsets)+';');fs.writeFileSync('dist/pokemon.js',runtime);
const template=fs.readFileSync('homepage.template.html','utf8').replace(/0 \/ \d+/g,'0 / '+roster.length);fs.writeFileSync('homepage.template.html',template);
execFileSync('node',['tools/sync-backend-catalog.mjs'],{stdio:'inherit'});
execFileSync('python3',['render-homepage.py'],{stdio:'inherit'});
console.log('Synced',roster.length,'Pokémon; preserved all existing IDs and progress keys.');
