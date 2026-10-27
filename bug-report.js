// Session-only diagnostics. Never record raw form values, storage, cookies or full URLs. Validated game builds are included.
(()=>{
 const entries=[],limit=60;
 const clean=value=>String(value??'').replace(/https?:\/\/[^\s)"<>]+/g,raw=>{try{const u=new URL(raw);return u.origin+u.pathname;}catch{return '[URL]';}}).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]').replace(/((?:token|password|authorization|api[_-]?key)\s*[:=]\s*)[^\s,;]+/gi,'$1[redacted]').replace(/```/g,"'''").slice(0,1800);
 const record=(kind,message)=>{entries.push({time:new Date().toISOString(),kind,message:clean(message)});while(entries.length>limit||JSON.stringify(entries).length>18000)entries.shift();};
 window.addEventListener('error',event=>{
  if(event.target!==window){const el=event.target;if(el instanceof HTMLElement)record('resource-error',el.tagName+' '+(el.getAttribute('src')||el.getAttribute('href')||''));}
  else record('error',event.error?.stack||event.message);
 },true);
 window.addEventListener('unhandledrejection',event=>record('unhandled-rejection',event.reason?.stack||event.reason));
 window.addEventListener('homepage-diagnostic',event=>record(event.detail?.kind||'game-error',event.detail?.message));
 document.addEventListener('click',event=>{
  const el=event.target.closest?.('button');if(!el||el.closest('#bug-report-dialog'))return;
  const action=el.dataset.arcadeEntry||el.dataset.game||el.dataset.start||el.dataset.pick||(el.dataset.opponent?'challenge cabinet slot '+(Array.from(document.querySelectorAll('[data-opponent]')).indexOf(el)+1):'')||el.dataset.hold||el.id||('slot' in el.dataset?`slot ${el.dataset.slot}, move ${el.dataset.move}`:'');
  if(action)record('action',action);
 },true);
 document.addEventListener('change',event=>{
  const el=event.target;if(el.closest?.('#bug-report-dialog'))return;
  if(el.matches?.('[data-mega]'))record('setting','Mega slot '+el.dataset.mega+': '+el.checked);
  else if(el.matches?.('[data-target]'))record('setting','Target slot '+el.dataset.target+': '+el.value);
  else if(el.closest?.('#ps-set-form'))record('build-edit','Changed '+el.name);
 });
 document.addEventListener('DOMContentLoaded',()=>{
  const dialog=document.querySelector('#bug-report-dialog'),preview=document.querySelector('#bug-report-text'),status=document.querySelector('#bug-report-status'),link=document.querySelector('#bug-report-link');
  if(!dialog)return;
  function report(){
   const game=document.querySelector('#arcade-dialog'),mode=game?.open?game.dataset.game||'menu':document.querySelector('#field-notes')?.open?'collection':'homepage';
   const text=selector=>{const el=document.querySelector(selector);return clean((el?.innerText||el?.textContent||'').trim());};
   const diagnostic={build:document.querySelector('meta[name="homepage-build"]')?.content||'unknown',timestamp:new Date().toISOString(),page:location.origin+location.pathname,view:mode,browser:clean(navigator.userAgent),viewport:{width:innerWidth,height:innerHeight,pixelRatio:devicePixelRatio},online:navigator.onLine,battle:text('.ps-battle-top'),playerStatus:text('#ps-render-status'),gameStatus:text('#arcade-content .game-status'),robot:text('.physics-readout'),engine:'@pkmn/sim 0.10.11',recentEvents:[...entries]};
   const latestError=[...entries].reverse().find(e=>/error|rejection/.test(e.kind));
   const summary=latestError?latestError.message.split('\n')[0]:'Visitor reported a problem in '+mode+'. No runtime error was captured.';
   const timeline=entries.slice(-12).map(e=>'- '+e.time+' · '+e.kind+': '+e.message.replace(/\n/g,' ').slice(0,240)).join('\n')||'No game actions were recorded before this report.';
   return {mode,body:`## Automatic report\n${summary}\n\nView: ${mode} · Build: ${diagnostic.build}\n${diagnostic.battle||diagnostic.robot||diagnostic.gameStatus||''}\n\n## Recent activity (automatic)\n${timeline}\n\n## Additional details (optional)\nYou can submit this report as-is. Add a description, reproduction steps, expected behavior or screenshot only if you want to.\n\n<details>\n<summary>Runtime log & diagnostics (automatic)</summary>\n\nIncludes recent game actions, validated battle builds, state changes and errors from this session. Raw input text, cookies and saved collection data are not read.\n\n\`\`\`json\n${JSON.stringify(diagnostic,null,2)}\n\`\`\`\n</details>\n`};
  }
  document.querySelectorAll('[data-report-bug]').forEach(button=>button.addEventListener('click',()=>{
   const data=report();preview.value=data.body;status.textContent='';
   link.href='https://github.com/xieleo5/xieleo5.github.io/issues/new?template=bug_report.md&title='+encodeURIComponent('[Bug] '+data.mode);
   dialog.showModal();
  }));
  document.querySelector('#close-bug-report').onclick=()=>dialog.close();
  document.querySelector('#copy-bug-report').onclick=async()=>{
   // Start the copy and open the tab within the original user gesture.
   const copy=navigator.clipboard?.writeText(preview.value);
   window.open(link.href,'_blank','noopener,noreferrer');
   try{if(!copy)throw new Error('Clipboard unavailable');await copy;status.textContent='Copied. In GitHub, replace the issue body with this report and submit. Extra details are optional.';}
   catch{preview.focus();preview.select();status.textContent='Copy the selected report manually, then paste it into the GitHub issue. If no tab opened, use the link below.';}
  };
 });
})();
