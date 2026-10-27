import {starterPool,canAcquire} from './collection-rules.mjs';
import {matchesPokemonAnswer} from './arcade-model.mjs';

function initArcade(){
 const collection=window.PokemonCollection, modal=document.querySelector('#arcade-dialog'), content=document.querySelector('#arcade-content');
 const roster=collection.list(), byId=id=>roster.find(p=>p.id===id), name=id=>byId(id)?.name||id;
 const starters=starterPool(roster);
 const sprite=(id,cls='')=>`<img class="game-sprite ${cls}" src="assets/menu-icons/${id}.png" alt="${name(id)}" draggable="false">`;
 let requestedOpponent=null;
 let mode='menu', generation=0, raf=0, timer=0, guessBag=[], guess=null, guessResolved=false, guessDeadline=0, timeoutNotice='', physicsAbort=null, battleAbort=null;
 const setStatus=text=>{content.querySelector('.game-status').textContent=text;};
 function cancel(){generation++;cancelAnimationFrame(raf);clearTimeout(timer);raf=0;timer=0;physicsAbort?.abort();physicsAbort=null;battleAbort?.abort();battleAbort=null;}
 function award(id){if(!canAcquire(byId(id),mode))return '';collection.award(id);updateCount();return `${name(id)} ${collection.has(id)?'is on your shelf':'joined your shelf'}!`;}
 function updateCount(){document.querySelector('#arcade-count').textContent=collection.count()+' / '+roster.length+' collected';}
 function winPanel(id,againLabel,again){
  const panel=content.querySelector('.game-result');panel.hidden=false;
  panel.innerHTML=`${sprite(id)}<div><strong>${name(id)} is on your shelf!</strong><span>Keep playing in any mode.</span></div><button type="button" class="game-primary" data-again>${againLabel}</button><button type="button" class="game-secondary" data-shelf>View shelf</button>`;
  panel.querySelector('[data-again]').addEventListener('click',again);
  panel.querySelector('[data-shelf]').addEventListener('click',()=>{modal.close();collection.openShelf();});
 }
 function shell(title,description,body){content.innerHTML=`<header class="game-heading"><h3>${title}</h3><p>${description}</p></header>${body}<div class="game-result" hidden></div>`;}
 function select(next){if(next==='claw')next='arm';cancel();mode=next;modal.dataset.game=next;
  document.querySelectorAll('[data-game]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.game===next)));
  if(next==='battle')renderBattle();else if(next==='arm')renderPhysics();else if(next==='guess')renderGuess();else renderMenu();
  content.scrollTop=0;modal.scrollTop=0;
 }
 function open(next='menu',opponentId=null){requestedOpponent=opponentId;collection.revealShelf();if(document.querySelector('#field-notes').open)document.querySelector('#field-notes').close();select(next);updateCount();if(!modal.open)modal.showModal();}
 function renderMenu(){
  content.innerHTML=`<div class="arcade-choices">
   <button type="button" data-start="guess"><div class="choice-art guess-choice"><img class="game-sprite" src="assets/menu-icons/jigglypuff.png" alt="Pokémon silhouette"><span>?</span></div><span class="choice-number">01 · RECOGNITION</span><h3>Guess who?</h3><p>Ten seconds. One silhouette. Name it in English or 中文 before time runs out.</p><span class="choice-play">Play →</span></button>
   <button type="button" data-start="arm"><div class="choice-art arm-choice"><svg class="choice-arm" viewBox="0 0 100 120" aria-hidden="true"><path d="M15 110L25 40L70 20L86 65"/><circle cx="25" cy="40" r="8"/><circle cx="70" cy="20" r="8"/><path d="M77 67v16h8M95 67v16h-8"/></svg>${sprite('teddiursa')}</div><span class="choice-number">02 · ROBOTICS</span><h3>Pick & place</h3><p>A Franka arm, a cluttered box, and an empty bin. Pick any Pokémon and place it safely.</p><span class="choice-play">Play →</span></button>
   <button type="button" data-start="battle"><div class="choice-art battle-choice">${sprite('scizor')}<span>vs.</span>${sprite('fuecoco')}</div><span class="choice-number">03 · STRATEGY</span><h3>Pokémon battle</h3><p>Choose a silhouette, then pick an available shelf partner and edit its build. Win to collect new Pokémon.</p><span class="choice-play">Play →</span></button>
  </div><p class="arcade-footnote">Guess who? and Pick & place unlock the original 24. All other Pokémon are earned in battle.</p>`;
  content.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.start)));
 }
 async function renderPhysics(){
  shell('Pick & place','Move a Franka Panda arm. Collect the original 24 Pokémon. Move a block from the cluttered box into the green bin.', '<div id="physics-host"><p class="game-status">Loading the 3D workspace…</p></div>');
  const token=generation;physicsAbort=new AbortController();const signal=physicsAbort.signal;
  try{const {mountPickPlace}=await import('./pick-place.js');if(token!==generation)return;
   const picks=shuffle(starters.filter(p=>!collection.has(p.id))).concat(shuffle(starters.filter(p=>collection.has(p.id))));
   const host=content.querySelector('#physics-host');host.addEventListener('new-physics-bin',()=>select('arm'));
   await mountPickPlace(host,picks,{signal,onAward:id=>{award(id);}});
  }catch(error){if(token!==generation)return;physicsAbort?.abort();content.querySelector('#physics-host').innerHTML='<p class="game-status">The 3D workspace could not load. <button type="button" class="game-secondary" id="retry-physics">Retry</button></p>';content.querySelector('#retry-physics').addEventListener('click',()=>select('arm'));console.error(error);}
 }
 function shuffle(items){
  const list=[...items];for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;
 }
 function renderGuess(){
  if(!guessBag.length)guessBag=[...shuffle(starters.filter(p=>!collection.has(p.id))),...shuffle(starters.filter(p=>collection.has(p.id)))];
  guess=guessBag.shift();guessResolved=false;let composing=false;
  shell('Who’s that Pokémon?','Collect the original 24 Pokémon. 10 seconds each; 中文 or English, any capitalization.',`
   <div class="guess-timer"><div class="guess-time-track"><span id="guess-time-fill"></span></div><span id="guess-seconds" role="timer" aria-label="Seconds remaining">10.0s</span></div>
   <div class="guess-stage"><span class="guess-question" aria-hidden="true">?</span><img class="game-sprite guess-silhouette" src="assets/menu-icons/${guess.id}.png" alt="Unknown Pokémon silhouette" width="192" height="192"><div class="guess-reveal-name" aria-live="polite"></div></div>
   <form id="guess-form" class="guess-form"><label for="guess-answer">Your answer / 你的答案</label><div class="guess-input-row"><input id="guess-answer" name="answer" type="text" maxlength="80" placeholder="中文 or English" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" required><button type="submit" class="game-primary">Check answer</button></div></form>
   <div class="game-actions guess-actions"><button type="button" id="guess-hint" class="game-secondary">Hint / 提示</button><button type="button" id="guess-reveal" class="game-secondary">Reveal & skip</button><button type="button" id="guess-next" class="game-primary" hidden>Next silhouette →</button></div>
   <p class="game-status" role="status">Recognize the shape? A correct answer adds this Pokémon to your shelf.</p>`);
  const input=content.querySelector('#guess-answer');
  const token=generation;guessDeadline=performance.now()+10000;
  if(timeoutNotice){setStatus(timeoutNotice);timeoutNotice='';}
  function timeOut(){if(token!==generation||guessResolved)return;timeoutNotice='Time’s up — '+guess.name+' · '+guess.zh+'. Try this one!';select('guess');}
  timer=setTimeout(timeOut,10000);
  const tick=now=>{if(token!==generation||guessResolved)return;const left=Math.max(0,guessDeadline-now);content.querySelector('#guess-seconds').textContent=(left/1000).toFixed(1)+'s';content.querySelector('#guess-time-fill').style.transform='scaleX('+(left/10000)+')';content.querySelector('.guess-timer').classList.toggle('urgent',left<3000);if(!left){timeOut();return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
  input.focus({preventScroll:true});
  input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;});
  content.querySelector('#guess-form').addEventListener('submit',e=>{
   e.preventDefault();if(composing||guessResolved)return;if(performance.now()>=guessDeadline){timeOut();return;}
   if(!input.value.trim()){setStatus('Enter a Pokémon name / 请输入宝可梦名字。');return;}
   if(matchesPokemonAnswer(guess,input.value)){revealGuess(true);}
   else{setStatus('Not quite — try again! / 还不对，再试试看。');input.setAttribute('aria-invalid','true');input.focus();}
  });
  input.addEventListener('input',()=>input.removeAttribute('aria-invalid'));
  content.querySelector('#guess-hint').addEventListener('click',()=>setStatus(`English starts with “${guess.name[0]}”. 中文名字有 ${guess.zh.length} 个字。`));
  content.querySelector('#guess-reveal').addEventListener('click',()=>revealGuess(false));
  content.querySelector('#guess-next').addEventListener('click',()=>select('guess'));
 }
 function revealGuess(correct){
  if(guessResolved)return;guessResolved=true;clearTimeout(timer);cancelAnimationFrame(raf);
  const image=content.querySelector('.guess-stage img');image.classList.remove('guess-silhouette');image.alt=guess.name+' · '+guess.zh;
  content.querySelector('.guess-reveal-name').textContent=guess.name+' · '+guess.zh;
  content.querySelector('.guess-question').hidden=true;
  content.querySelectorAll('#guess-form input,#guess-form button,#guess-hint,#guess-reveal').forEach(e=>e.disabled=true);
  if(correct){award(guess.id);setStatus('Correct! / 答对了！ '+guess.name+' · '+guess.zh);winPanel(guess.id,'Next silhouette',()=>select('guess'));}
  else{setStatus('It’s '+guess.name+' · '+guess.zh+'. Revealing doesn’t collect it — try the next one.');content.querySelector('#guess-next').hidden=false;}
 }
 async function renderBattle(){
  content.innerHTML='<p class="game-status">Loading Pokémon battle…</p>';
  battleAbort=new AbortController();const signal=battleAbort.signal,token=generation;
  try{const {mountShowdown}=await import('./showdown-game.js');if(token!==generation)return;
   await mountShowdown(content,{collection,signal,initialOpponent:requestedOpponent,onAward:award,onShelf:()=>{modal.close();collection.openShelf();}});
  }catch(error){if(signal.aborted)return;content.innerHTML='<p class="game-status">The battle could not load. Please switch games and try again.</p>';console.error(error);}
 }
 document.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.game)));
 document.querySelector('#close-arcade').addEventListener('click',()=>modal.close());
 document.querySelector('#arcade-shelf').addEventListener('click',()=>{modal.close();collection.openShelf();});
 document.querySelectorAll('[data-arcade-entry]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.arcadeEntry)));
 document.querySelector('#cabinet-play').addEventListener('click',()=>open());
 modal.addEventListener('close',cancel);
 window.addEventListener('open-pokemon-arcade',e=>open(e.detail?.mode||'menu',e.detail?.opponentId||null));
 window.addEventListener('pokemon-collection-change',updateCount);
 updateCount();
}
if(window.PokemonCollection)initArcade();else window.addEventListener('pokemon-ready',initArcade,{once:true});
