import fs from 'node:fs';
const roster=JSON.parse(fs.readFileSync(new URL('../pokemon-roster.json',import.meta.url)));
const runtime=fs.readFileSync(new URL('../dist/pokemon.js',import.meta.url),'utf8');
const cats=JSON.parse(runtime.match(/const homeCats=(\[[\s\S]*?\]);/)[1]);
fs.writeFileSync(new URL('../backend/catalog.json',import.meta.url),JSON.stringify([...roster,...cats].map(({id,acquisition})=>({id,acquisition})),null,2)+'\n');
