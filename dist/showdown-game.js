import {STAT_KEYS,natureLabel,effectiveStatForm,level50Stats,cappedEV} from './stat-preview.mjs';
import {availablePartners,eligibleOpponents,makeMatchup,TATSUGIRI_FORMS,isCommander} from './battle-rules.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(id,alt,cls='')=>`<img src="assets/menu-icons/${id}.png" alt="${esc(alt)}" class="game-sprite ${cls}" draggable="false">`;
const statNames={hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe',accuracy:'Accuracy',evasion:'Evasion'};
const weatherNames={raindance:'Rain',sunnyday:'Sun',sandstorm:'Sandstorm',snow:'Snow',hail:'Hail',primordialsea:'Heavy rain',desolateland:'Harsh sunlight',deltastream:'Strong winds'};
export async function mountShowdown(host,{collection,signal,onAward,onShelf,initialOpponent=null}){
 const loaded=await Promise.all(['battle-roster.json','battle-editor.json','battle-ai-sets.json'].map(async path=>{const r=await fetch('./'+path+'?v=20261027-stat-editor');if(!r.ok)throw new Error('Could not load '+path);return r.json();}));
 const [data,editor,aiData]=loaded;if(signal.aborted)return;
 const diagnose=(kind,message)=>window.dispatchEvent(new CustomEvent('homepage-diagnostic',{detail:{kind,message}}));
 const records=data.records,byId=id=>records.find(p=>p.id===id);
 let selected=null,worker=null,pending=new Map(),sequence=0,busy=false,state=null,matchup=null,choices=[],mega=[],playerForm=collection.tatsugiriForm?.()||0,awarded=false,frameReady=false;
 let opponentId=initialOpponent,enemyForm=0;const custom={},storageKey='yuqi-battle-sets-v1';let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{}
 const current=id=>custom[id]||byId(id);
 const owned=()=>records.filter(p=>collection.has(p.id));
 function stopWorker(){worker?.terminate();worker=null;for(const {reject,timer}of pending.values()){clearTimeout(timer);reject(new Error('Battle closed.'));}pending.clear();}
 signal.addEventListener('abort',stopWorker,{once:true});
 function sendFrame(){const frame=host.querySelector('#ps-window');if(frame&&frameReady&&state)frame.contentWindow.postMessage({type:'shelf-battle-state',state},location.origin);}
 function onFrame(event){const frame=host.querySelector('#ps-window');if(!frame||event.source!==frame.contentWindow||event.origin!==location.origin)return;
  if(event.data.type==='ps-window-ready'){frameReady=true;sendFrame();}
  if(event.data.type==='ps-window-size')frame.style.height=event.data.height+'px';
  if(event.data.type==='ps-window-error'){window.dispatchEvent(new CustomEvent('homepage-diagnostic',{detail:{message:event.data.message}}));const status=host.querySelector('#ps-render-status');status.textContent='Battle display could not load. Return to partners to retry.';console.error(event.data.message);}
 }
 window.addEventListener('message',onFrame);signal.addEventListener('abort',()=>window.removeEventListener('message',onFrame),{once:true});

 function call(type,payload){
  if(!worker){worker=new Worker(new URL('./vendor/showdown-worker.js',import.meta.url),{type:'module'});
   worker.onmessage=({data})=>{if(data.ready)return;const entry=pending.get(data.id);if(!entry)return;pending.delete(data.id);clearTimeout(entry.timer);if(data.error){window.dispatchEvent(new CustomEvent('homepage-diagnostic',{detail:{message:data.error}}));entry.reject(new Error(data.error));}else entry.resolve(data.state);};
   worker.onerror=()=>{window.dispatchEvent(new CustomEvent('homepage-diagnostic',{detail:{message:'The battle engine could not load.'}}));for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(new Error('The battle engine could not load. Please retry.'));}pending.clear();stopWorker();};
  }
  return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);window.dispatchEvent(new CustomEvent('homepage-diagnostic',{detail:{message:'Battle engine request timed out: '+type}}));reject(new Error('The battle took too long. Start a new challenge to retry.'));stopWorker();},30000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,type,payload});});
 }
 function heading(){return '<header class="game-heading"><h3>Pokémon battle</h3><p>Choose a silhouette first, then pick an available Pokémon from your shelf.</p></header>';}
 const available=()=>availablePartners(records,opponentId,owned().map(p=>p.id),custom);
 function renderLobby(){
  state=null;busy=false;stopWorker();
  if(!byId(opponentId))opponentId=null;
  host.innerHTML=heading()+'<div id="ps-target-step"></div><div id="ps-partner-step"></div><div id="ps-preset"></div>'+`   <details class="ps-rules"><summary>Matchmaking & battle rules</summary><p>Level 50 · Gen 9 National Dex mechanics · Mega Evolution and Primal Reversion enabled · no Tera or Dynamax. This is a custom shelf challenge, not the official 1v1 ladder.</p><p>Choose any opponent in your edited set’s tier or higher. Items and Mega-capable moves can change that tier. Banlists sit between tiers: RU &lt; RUBL &lt; UU &lt; UUBL &lt; OU &lt; Uber &lt; AG. LC and NFE are placed below usage tiers for this game; they still battle at level 50.</p><p>Dondozo + Tatsugiri is a special OU doubles encounter. Either member brings the other as a temporary partner. Other doubles teams use a second shelf partner at or below your tier; enemy partners also meet your tier floor. Winning collects both opponents.</p><p>The challenger plans its move before you submit yours. It evaluates possible turns using the real simulator. Battles stop as a draw after 100 turns. AI sets are randomly chosen from fixed, legal builds informed by Smogon usage stats; sparse species use curated fallbacks.</p><p>Guess who? and Pick & place unlock the original 24 Pokémon. Later additions are challenge-only. Existing collections are kept.</p><p><a href="https://www.smogon.com/stats/" target="_blank" rel="noopener">Smogon usage statistics ↗</a> · Build source details are shown with your selected opponent.</p><a href="${esc(data.tierSource)}" target="_blank" rel="noopener">Showdown National Dex tier snapshot ↗</a><span> · <a href="https://github.com/pkmn/ps/tree/main/sim" target="_blank" rel="noopener">Engine: @pkmn/sim ${data.version} ↗</a></span></details>`;
  renderTargetStep();renderPartnerStep();host.closest('dialog').scrollTop=0;
 }
 function renderTargetStep(){
  const box=host.querySelector('#ps-target-step');
  if(opponentId){box.innerHTML=`<div class="ps-target-summary">${icon(opponentId,'Selected silhouette','ps-undiscovered')}<div><b>Selected silhouette · ${byId(opponentId).tier}</b><small>Win to reveal and collect it.</small></div><button type="button" class="game-secondary" id="ps-change-target">Change silhouette</button></div><div id="ps-opponent-preview"></div>`;
   renderOpponent();host.querySelector('#ps-change-target').onclick=()=>{if(busy)return;opponentId=null;selected=null;renderTargetStep();renderPartnerStep();};return;
  }
  box.innerHTML=`<div class="ps-challenge-picker"><h5>Choose a silhouette from the cabinet</h5><p class="ps-cabinet-help">Select your opponent to see which of your Pokémon can challenge it.</p><div class="inline-cabinet ps-target-cabinet"><div class="ps-target-scroll"><div class="ps-target-slots" aria-label="Choose a challenge from the cabinet">${records.map((e,i)=>`<button type="button" class="shelf-slot ps-target-slot" data-opponent="${e.id}" aria-label="Challenge silhouette in slot ${i+1}, ${e.tier}" title="Select this silhouette">${icon(e.id,'','undiscovered-art')}<small>${e.tier}</small></button>`).join('')}</div></div><div class="cabinet-plinth"></div></div></div>`;
  box.querySelectorAll('[data-opponent]').forEach(b=>b.onclick=()=>{if(busy)return;opponentId=b.dataset.opponent;selected=null;renderTargetStep();renderPartnerStep();host.closest('dialog').scrollTop=0;});
 }
 function renderPartnerStep(){
  const box=host.querySelector('#ps-partner-step');
  if(!opponentId){box.innerHTML='';host.querySelector('#ps-preset').innerHTML='';return;}
  const list=available();
  box.innerHTML=`<div class="ps-lobby-top"><span>AVAILABLE POKÉMON</span><span>${list.length} available · Lv. 50</span></div>`+(list.length?`<div class="ps-roster" aria-label="Choose an available Pokémon">${list.map(p=>`<button type="button" class="ps-pick" data-pick="${p.id}" aria-pressed="${p.id===selected}">${icon(p.id,p.name)}<span>${esc(p.name)}</span><small>${current(p.id).tier}${p.tierOverride?' · Duo':''}</small></button>`).join('')}</div>`:`<div class="ps-empty"><p>${owned().length?'None of your current builds can challenge this tier. Pick another silhouette, or collect a lower-tier partner.':'Collect your first partner in Guess who? or Pick & place, then return to this challenge.'}</p><button class="game-secondary" id="ps-first">Play Guess who?</button></div>`);
  box.querySelector('#ps-first')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('open-pokemon-arcade',{detail:{mode:'guess'}})));
  box.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{if(busy)return;selected=b.dataset.pick;box.querySelectorAll('[data-pick]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderPreset();});
  if(selected)renderPreset();else host.querySelector('#ps-preset').innerHTML=list.length?'<p class="ps-partner-prompt">Choose your Pokémon to review or edit its build.</p>':'';
 }
 function renderPreset(){
  const p=current(selected),canBattle=available().some(q=>q.id===selected);
  const evs=Object.entries(p.set.evs).filter(([,v])=>v).map(([k,v])=>v+' '+statNames[k]).join(' / ');
  host.querySelector('#ps-preset').innerHTML=`<div class="ps-preset"><div class="ps-preset-title">${icon(p.id,p.name)}<div><h4>${esc(p.name)}${isCommander(p.id)?' + '+esc(byId(p.id==='dondozo'?'tatsugiri':'dondozo').name):''}</h4><span class="ps-tier">${p.tier}${p.tierOverride?' · Commander duo':''}</span> <span>Lv. 50${p.form!==p.set.species?' · '+esc(p.form):''}${p.custom?' · Custom set':''}</span></div></div>
   <div class="ps-build-meta"><span><b>Item</b> ${esc(p.set.item||'None')}</span><span><b>Ability</b> ${esc(p.set.ability)}</span><span><b>Nature</b> ${esc(natureLabel(p.set.nature,editor.natureEffects))}</span></div>
   <div class="ps-preset-moves">${p.moves.map(m=>`<span data-type="${m.type}" title="${esc(m.description)}">${esc(m.name)}</span>`).join('')}</div><small class="ps-evs">EVs: ${evs||'None'}</small>
   <details class="ps-set-editor"><summary>Edit moves & build</summary><div id="ps-editor-fields"></div></details>
   ${isCommander(p.id)?`<label class="ps-form-label">Your Tatsugiri form <select id="ps-form">${TATSUGIRI_FORMS.map((f,i)=>`<option value="${i}" ${i===playerForm?'selected':''}>${f.name} · Order Up → ${f.boost}</option>`).join('')}</select></label>`:''}
   <div class="ps-match-row"><div><b>${canBattle?'Ready to challenge':'Build exceeds opponent’s tier'}</b><small>${canBattle?'Level 50 · Opponent remains a silhouette':'Edit this build or choose another available Pokémon.'}</small></div><button type="button" class="game-primary" id="ps-challenge">Challenge →</button></div><p id="ps-lobby-status" role="status"></p></div>`;
  host.querySelector('#ps-form')?.addEventListener('change',e=>{playerForm=Number(e.target.value);});
  host.querySelector('#ps-challenge').onclick=start;renderEditor();
 }
 function renderOpponent(){
  const p=byId(opponentId),variants=aiData.records[p.id]||[];
  const sourceLinks=aiData.sources?.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.format)} ${esc(s.month)}</a>`).join(' · ')||'';
  host.querySelector('#ps-opponent-preview').innerHTML=`${icon(p.id,'Selected silhouette','ps-undiscovered')}<div><strong>Selected silhouette · ${p.tier}</strong><p>${p.acquisition==='starter'?'Also available in Guess who? and Pick & place.':'Win this challenge to add it to your shelf.'}</p><small>AI randomly picks from ${variants.length||1} fixed build${variants.length===1?'':'s'}.</small></div>
  ${isCommander(p.id)?`<label class="ps-form-label">Duo partner form <select id="ps-enemy-form">${TATSUGIRI_FORMS.map((f,i)=>`<option value="${i}" ${i===enemyForm?'selected':''}>${f.name}</option>`).join('')}</select></label>`:''}
  <details class="ps-build-sources"><summary>AI build sources</summary><p>Complete builds are curated from usage patterns; statistics report individual moves, items and spreads, not complete teams. Low-data species use curated builds.</p><p>${sourceLinks}</p><p>Build details stay hidden until you defeat the silhouette.</p></details>`;
  host.querySelector('#ps-enemy-form')?.addEventListener('change',e=>{enemyForm=Number(e.target.value);});
 }
 function renderEditor(){
  const p=current(selected),catalog=editor.species[p.id],set=p.set;
  const selectOptions=(values,value,empty=false)=>(empty?'<option value="">None</option>':'')+values.map(v=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(v)}</option>`).join('');
  host.querySelector('#ps-editor-fields').innerHTML=`<form id="ps-set-form"><p class="ps-editor-note">Level 50 · Legal National Dex sets only. Challenge uses the current form. Valid builds stay in this browser.</p>
  <div class="ps-editor-grid">${[0,1,2,3].map(i=>`<label>Move ${i+1}<select name="move${i}" aria-label="Move ${i+1}">${selectOptions(catalog.moves.map(m=>m.name),set.moves[i],true)}</select></label>`).join('')}
  <label>Item<input name="item" list="ps-item-options" value="${esc(set.item||'')}" autocomplete="off" placeholder="None"><datalist id="ps-item-options">${editor.items.map(i=>`<option value="${esc(i.name)}">${esc(i.description)}</option>`).join('')}</datalist></label>
  <label>Ability<select name="ability">${selectOptions(catalog.abilities,set.ability)}</select></label><label>Nature<select name="nature">${editor.natures.map(n=>`<option value="${esc(n)}" ${n===set.nature?'selected':''}>${esc(natureLabel(n,editor.natureEffects))}</option>`).join('')}</select></label></div>
  <div class="ps-stat-preview-heading"><label>Lv. 50 stats <select id="ps-stat-form" aria-label="Stat preview form"></select></label><span id="ps-ev-total" role="status"></span></div>
  <div class="ps-stats-editor"><span>Stat</span><span>EVs</span><span>IVs</span><span>Value</span>${STAT_KEYS.map(k=>`<span class="ps-stat-name" data-stat-name="${k}">${statNames[k]}</span><div class="ps-ev-control"><input type="range" min="0" max="252" step="1" value="${set.evs?.[k]??0}" data-ev-slider="${k}" aria-label="${statNames[k]} EV slider"><input type="number" name="ev-${k}" aria-label="${statNames[k]} EVs" min="0" max="252" step="1" value="${set.evs?.[k]??0}"></div><input type="number" name="iv-${k}" aria-label="${statNames[k]} IVs" min="0" max="31" step="1" value="${set.ivs?.[k]??31}"><output data-stat-value="${k}" aria-label="${statNames[k]} final stat"></output>`).join('')}</div>
  <p class="ps-stat-note">Before battle boosts, abilities and item multipliers. + / − marks the nature’s 10% effect.</p>
  <div class="ps-editor-actions"><button class="game-secondary" type="button" id="ps-reset-set">Reset to preset</button></div><p id="ps-set-status" role="status"></p></form>`;
  const form=host.querySelector('#ps-set-form');
  form.onsubmit=e=>{e.preventDefault();start();};
  let previewForm=null;
  function updateStats(event){
   const build=readBuild(form),target=event?.target,key=target?.dataset.evSlider||target?.name?.match(/^ev-(.+)$/)?.[1];
   if(key&&target.value!==''){build.evs[key]=cappedEV(build.evs,key,target.value);form.elements['ev-'+key].value=build.evs[key];}
   for(const k of STAT_KEYS)form.querySelector(`[data-ev-slider="${k}"]`).value=build.evs[k];
   const effective=effectiveStatForm(catalog,build.item,build.moves),forms=[...new Set([catalog.baseForm,effective])],select=form.querySelector('#ps-stat-form');
   if(target===select)previewForm=select.value;
   else if(!previewForm||target?.name==='item'||target?.name?.startsWith('move')||!forms.includes(previewForm))previewForm=effective;
   select.innerHTML=forms.map(name=>`<option value="${esc(name)}" ${name===previewForm?'selected':''}>${esc(name)}</option>`).join('');select.hidden=forms.length===1;
   const nature=editor.natureEffects[build.nature]||{},stats=level50Stats(catalog.statForms[previewForm],build.evs,build.ivs,nature);
   for(const k of STAT_KEYS){const sign=nature.plus===k?'+':nature.minus===k?'−':'',kind=sign==='+'?'up':sign?'down':'neutral',label=form.querySelector(`[data-stat-name="${k}"]`),output=form.querySelector(`[data-stat-value="${k}"]`);label.textContent=statNames[k]+sign;label.dataset.nature=output.dataset.nature=kind;output.textContent=stats[k]+sign;output.title=sign?`${natureLabel(build.nature,editor.natureEffects)} · ${sign==='+'?'+10%':'−10%'}`:'No nature modifier';}
   const total=Object.values(build.evs).reduce((sum,n)=>sum+n,0);form.querySelector('#ps-ev-total').textContent=`${total} / 510 EVs · ${510-total} left`;
  }
  form.oninput=e=>{updateStats(e);host.querySelector('#ps-lobby-status').textContent='Your current form will be checked and used when you challenge.';};
  form.querySelector('#ps-stat-form').onchange=updateStats;updateStats();
  host.querySelector('#ps-reset-set').onclick=()=>{if(busy)return;delete custom[selected];delete saved[selected];try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}renderPreset();updatePartnerTiers();};
 }
 function updatePartnerTiers(){const status=host.querySelector('#ps-lobby-status')?.textContent;renderPartnerStep();if(status&&host.querySelector('#ps-lobby-status'))host.querySelector('#ps-lobby-status').textContent=status;}
 function readBuild(form){
  const values=new FormData(form),set={species:byId(selected).set.species,item:values.get('item'),ability:values.get('ability'),nature:values.get('nature'),moves:[0,1,2,3].map(i=>values.get('move'+i)).filter(Boolean),evs:{},ivs:{}};
  for(const k of ['hp','atk','def','spa','spd','spe']){set.evs[k]=Number(values.get('ev-'+k));set.ivs[k]=Number(values.get('iv-'+k));}
  return set;
 }
 async function start(){
  if(busy||!opponentId||!selected)return;
  const form=host.querySelector('#ps-set-form');
  if(!form.checkValidity()){host.querySelector('.ps-set-editor').open=true;form.reportValidity();return;}
  const set=readBuild(form);busy=true;awarded=false;
  host.querySelector('#ps-lobby-status').textContent='Checking your current build…';
  host.querySelectorAll('button,select,input').forEach(el=>el.disabled=true);
  try{
   const checked=await call('validate',{record:byId(selected),set});if(signal.aborted)return;diagnose('battle-build',JSON.stringify({pokemon:selected,tier:checked.tier,set:checked.set}));
   const builds={...custom,[selected]:checked};
   matchup=makeMatchup(records,selected,owned().map(p=>p.id),Math.random,playerForm,{opponentId,enemyForm,playerRecord:checked,playerRecords:builds});
   custom[selected]=checked;saved[selected]=checked.set;try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}
   matchup.playerSets=Object.fromEntries(matchup.player.filter(id=>custom[id]).map(id=>[id,custom[id].set]));
   matchup.enemySets=matchup.enemy.map(id=>{const variants=aiData.records[id]||[];return (variants[Math.floor(Math.random()*variants.length)]||byId(id)).set;});
   diagnose('battle-start',JSON.stringify({player:matchup.player,opponentSlot:records.findIndex(p=>p.id===opponentId)+1,doubles:matchup.doubles,playerForm,enemyForm}));
   host.innerHTML=heading()+'<div class="ps-loading" role="status">Preparing your challenge…<small>Loading the local Pokémon Showdown engine.</small></div>';
   state=await call('start',{records,matchup});if(signal.aborted)return;busy=false;resetChoices();renderBattle();host.closest('dialog').scrollTop=0;
  }catch(error){
   if(signal.aborted)return;busy=false;
   if(host.contains(form)){
    host.querySelectorAll('button,select,input').forEach(el=>el.disabled=false);
    host.querySelector('.ps-set-editor').open=true;
    host.querySelector('#ps-set-status').textContent=error.message;
    host.querySelector('#ps-lobby-status').textContent='Check your build before challenging.';
   }else showError(error);
  }
 }
 function resetChoices(){choices=state.options.map(opts=>opts.length===1?opts[0].command:null);mega=state.options.map((opts,i)=>i===state.options.findIndex(os=>os.some(o=>o.mega))&&opts.some(o=>o.mega));}
 function showError(error){console.error(error);busy=false;host.innerHTML=heading()+`<p class="game-status" role="alert">${esc(error.message)}</p><button type="button" class="game-secondary" id="ps-error-back">Back to partners</button>`;host.querySelector('#ps-error-back').onclick=renderLobby;}
 function logText(line){
  const t=line.split('|'),k=t[1],subject=s=>{
   if(!s)return '';const m=/p([12])([ab]):/.exec(s);if(!m)return s;
   const mon=(m[1]==='1'?state.player:state.enemy)[m[2]==='a'?0:1];
   return m[1]==='1'?mon?.name||'Your partner':(state.won||state.revealOpponent)?mon?.name||'Challenger':'Challenger '+(m[2]==='a'?1:2);
  };
  if(k==='turn')return 'Turn '+t[2];
  if(k==='move')return subject(t[2])+' used '+t[3]+'.';
  if(k==='-damage')return subject(t[2])+' → '+t[3].replace('/100','% HP').replace('0 fnt','0 HP')+(t[4]?.startsWith('[from]')?' ('+t[4].replace('[from] ','')+')':'');
  if(k==='-heal')return subject(t[2])+' recovered HP.';
  if(k==='faint')return subject(t[2])+' fainted.';
  if(k==='cant')return subject(t[2])+' could not move ('+t[3]+').';
  if(k==='-status')return subject(t[2])+' became '+({brn:'burned',par:'paralyzed',slp:'asleep',tox:'badly poisoned',psn:'poisoned',frz:'frozen'}[t[3]]||t[3])+'.';
  if(k==='-curestatus')return subject(t[2])+' recovered from '+t[3]+'.';
  if(k==='-boost'||k==='-unboost')return subject(t[2])+' '+(statNames[t[3]]||t[3])+' '+(k==='-boost'?'+':'−')+t[4]+'.';
  if(k==='-weather')return t[2]==='none'?'The weather cleared.':(weatherNames[t[2].toLowerCase()]||t[2])+'.';
  if(k==='-mega')return subject(t[2])+' Mega Evolved!';
  if(k==='-primal')return subject(t[2])+' underwent Primal Reversion!';
  if(k==='-activate')return subject(t[2])+': '+t[3]+'.';
  if(k==='-immune')return subject(t[2])+' is immune.';
  if(k==='-miss')return 'The attack missed '+subject(t[3]||t[2])+'.';
  if(k==='-supereffective')return 'It’s super effective!';
  if(k==='-resisted')return 'It’s not very effective.';
  if(k==='-crit')return 'A critical hit!';
  if(k==='-fail')return subject(t[2])+'’s action failed.';
  if(k==='-start'||k==='-end')return subject(t[2])+': '+t[3]+(k==='-end'?' ended.':'.');
  if(k==='-item')return subject(t[2])+' obtained '+t[3]+'.';
  if(k==='-enditem')return subject(t[2])+' used or lost '+t[3]+'.';
  if(k==='-ability')return subject(t[2])+': '+t[3]+'.';
  if(k==='win')return state.won?'You won!':'The challenger won.';
  if(k==='tie')return 'The battle ended in a draw.';
  return null;
 }
 function renderBattle(){
  const logs=state.log.map(logText).filter(Boolean);
  diagnose('battle-state',JSON.stringify({turn:state.turn,ended:state.ended,won:state.won,player:state.player.map(p=>({name:p.name,hp:p.hp,maxhp:p.maxhp,status:p.status,commanding:p.commanding})),events:logs.slice(-8)}));
  if(!host.querySelector('#ps-window')){frameReady=false;host.innerHTML=`<div class="ps-battle-top"></div><div class="ps-embedded-window"><div class="ps-window-title"><span>Pokémon Showdown</span><small>LOCAL BATTLE</small></div><iframe id="ps-window" title="Pokémon Showdown battle window" src="ps-window/index.html?v=20261027-stable-identifiers" loading="eager"></iframe><div id="ps-controls"></div></div><p id="ps-render-status" class="ps-render-status" role="status"></p><details class="ps-full-log"><summary>Battle log</summary><div></div></details>`;}
  host.querySelector('.ps-battle-top').innerHTML=`<button type="button" class="ps-back" id="ps-back">← Partners</button><span>${state.doubles?'Doubles · Commander encounter':'Singles · 1v1'} <b>${state.ended?'Finished':'Turn '+state.turn}</b></span>`;
  host.querySelector('.ps-full-log>div').innerHTML=logs.map(l=>`<p>${esc(l)}</p>`).join('');
  host.querySelector('#ps-render-status').textContent=state.player.map(p=>p.name+': '+p.hp+'/'+p.maxhp+' HP'+(p.status?' · '+p.status.toUpperCase():'')+(p.commanding?' · Inside Dondozo':'')).join(' · ');
  host.querySelector('#ps-back').onclick=()=>{if(!busy)renderLobby();};sendFrame();
  if(state.ended){
   if(state.won&&!awarded){awarded=true;state.rewardIds.forEach(onAward);}
   host.querySelector('#ps-controls').innerHTML=`<div class="ps-outcome"><h4>${state.won?'Victory!':state.draw?'A draw.':'Your partner fainted.'}</h4><p>${state.won?state.rewardIds.map(id=>esc(byId(id).name)).join(' & ')+' joined your shelf.':state.draw?'Neither side collected a Pokémon.':'Try another partner or a different opening move.'}</p><button type="button" class="game-primary" id="ps-again">New challenge</button> <button type="button" class="game-secondary" id="ps-view-shelf">View shelf</button></div>`;
   host.querySelector('#ps-again').onclick=renderLobby;host.querySelector('#ps-view-shelf').onclick=onShelf;
  }else renderControls();
 }
 function renderControls(){
  const controls=host.querySelector('#ps-controls');
  controls.innerHTML=state.options.map((options,i)=>{
   if(options.every(o=>o.pass))return '';
   const mons=[...state.enemy.map((p,j)=>({p,target:j+1})),...state.player.map((p,j)=>({p,target:-(j+1)}))].filter(x=>!x.p.fainted&&!x.p.commanding);
   const opts=options.filter(o=>Boolean(o.mega)===Boolean(mega[i]));
   const moves=[...new Map(opts.map(o=>[o.index||o.id,o])).values()];
   return `<section class="ps-move-section"><div class="ps-move-heading"><strong>${esc(state.player[i].name)}’s move</strong></div>${options.some(o=>o.mega)?`<label class="ps-mega-option"><input type="checkbox" data-mega="${i}" ${mega[i]?'checked':''}><span>Mega Evolution<small>Use with your next move</small></span></label>`:''}
    ${state.doubles?`<label class="ps-target-label">Target <select data-target="${i}">${mons.map(({p,target})=>`<option value="${target}">${esc(target<0?'Your '+p.name:state.won?p.name:'Challenger '+target)}</option>`).join('')}</select></label>`:''}
    <div class="ps-moves">${moves.map(o=>`<button type="button" data-slot="${i}" data-move="${o.index||1}" data-type="${o.type}" aria-pressed="${choices[i]===o.command}" title="${esc(o.description)}"><strong>${esc(o.move)}</strong><span>${o.type} · ${o.category}</span><small>${o.pp}/${o.maxpp} PP · ${o.power?o.power+' power':o.category==='Status'?'Status':'Variable power'} · ${o.accuracy===true?'—':o.accuracy+'%'} accuracy</small></button>`).join('')}</div><p class="ps-move-description" id="ps-move-description-${i}">Hover or focus a move to see its effect. Click to use it.</p></section>`;
  }).join('')+`<div class="ps-submit-row"><p id="ps-action-status" role="status">${state.doubles?'Choose a move for each active partner.':'Choose your next move.'}</p></div>`;
  controls.querySelectorAll('[data-mega]').forEach(box=>box.onchange=()=>{const i=Number(box.dataset.mega);mega[i]=box.checked;if(box.checked)mega=mega.map((_,j)=>i===j);choices=choices.map((c,j)=>state.options[j].every(o=>o.pass)?'pass':null);renderControls();});
  function choose(button){
   if(busy)return;
   const i=Number(button.dataset.slot),move=Number(button.dataset.move),target=Number(controls.querySelector(`[data-target="${i}"]`)?.value||0);
   const available=state.options[i].filter(o=>(o.index||1)===move&&Boolean(o.mega)===Boolean(mega[i]));
   const option=available.find(o=>!o.target||o.target===target)||available[0];
   if(!option)return;choices[i]=option.command;
   controls.querySelectorAll(`[data-slot="${i}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   controls.querySelector('#ps-move-description-'+i).textContent=option.description;
   if(choices.every(Boolean)){submit();return;}
   controls.querySelector('#ps-action-status').textContent='Choose '+state.player[choices.findIndex(c=>!c)].name+'’s move to play this turn.';
  }
  controls.querySelectorAll('[data-slot]').forEach(b=>{
   b.onclick=()=>choose(b);
   const describe=()=>{const i=Number(b.dataset.slot),option=state.options[i].find(o=>(o.index||1)===Number(b.dataset.move)&&Boolean(o.mega)===Boolean(mega[i]));if(option)controls.querySelector('#ps-move-description-'+i).textContent=option.description;};
   b.onmouseenter=describe;b.onfocus=describe;
  });
  controls.querySelectorAll('[data-target]').forEach(select=>select.onchange=()=>{
   const i=Number(select.dataset.target);choices[i]=null;
   controls.querySelectorAll(`[data-slot="${i}"]`).forEach(b=>b.setAttribute('aria-pressed','false'));
   controls.querySelector('#ps-action-status').textContent='Choose a move for the selected target.';
  });
 }
 async function submit(){
  if(busy||choices.some(c=>!c))return;busy=true;diagnose('battle-choice',JSON.stringify({turn:state.turn,commands:choices}));
  host.querySelectorAll('button,select,input').forEach(b=>b.disabled=true);
  host.querySelector('#ps-action-status').textContent='Resolving the turn…';
  try{const next=await call('choose',{commands:choices});if(signal.aborted)return;state=next;busy=false;resetChoices();renderBattle();}
  catch(error){if(signal.aborted)return;busy=false;renderBattle();host.querySelector('#ps-action-status').textContent=error.message;}
 }
 for(const [id,set] of Object.entries(saved)){if(!byId(id)||!collection.has(id))continue;try{custom[id]=await call('validate',{record:byId(id),set});}catch{}if(signal.aborted)return;}
 renderLobby();
}
