import {build} from 'esbuild';
import fs from 'node:fs';
await import('./build-battle-data.mjs');
await import('./build-ai-sets.mjs');
await build({entryPoints:['battle-src/worker.mjs'],bundle:true,platform:'browser',format:'esm',minify:true,keepNames:true,outfile:'dist/vendor/showdown-worker.js',legalComments:'eof'});
fs.copyFileSync('battle-src/rules.mjs','dist/battle-rules.mjs');
fs.copyFileSync('node_modules/@pkmn/sim/LICENSE','dist/vendor/showdown-LICENSE.txt');
console.log('Built lazy-loaded Showdown worker.');
