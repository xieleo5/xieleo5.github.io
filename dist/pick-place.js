import * as THREE from './vendor/three.module.js';
import {createPhysics,SOURCE,DEST,RADIUS,BLOCK_SPACING} from './pick-place-world.mjs?v=20261029-loading';
import {createArmController} from './panda-kinematics.mjs';
import {downloadBuffer} from './game-download.mjs';
async function loadModel(onProgress){
 const [json,buffer]=await Promise.all([
  downloadBuffer(new URL('assets/franka/panda.json',import.meta.url)),
  downloadBuffer(new URL('assets/franka/panda.bin',import.meta.url),onProgress)
 ]);
 return [JSON.parse(new TextDecoder().decode(json)),buffer];
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export async function mountPickPlace(host,roster,{onAward,signal}){
 const diagnose=(kind,message)=>window.dispatchEvent(new CustomEvent('homepage-diagnostic',{detail:{kind,message}}));
 host.innerHTML=`<div class="physics-stage dual-camera"><canvas aria-label="Franka side view and wrist camera. Use arrow keys to move, W and S for height, A and D to rotate, Space for the gripper." tabindex="0"></canvas><div class="camera-panels"><div class="camera-panel" id="side-panel"><span class="camera-label">SIDE VIEW</span></div><div class="camera-panel" id="wrist-panel"><span class="camera-label">WRIST CAM</span><span class="wrist-crosshair" aria-hidden="true"></span></div></div><div class="physics-loading"><div class="physics-loading-card"><div class="physics-loading-heading"><span class="physics-loading-label" role="status">Downloading game engine…</span><span class="physics-loading-value" aria-hidden="true"></span></div><progress max="1" aria-label="Game loading progress"></progress><span class="physics-loading-detail">First load may take a moment. Downloaded files are cached for next time.</span></div></div></div>
 <div class="physics-readout"><span id="physics-phase">Gripper open</span><span>Height <output id="robot-height">32 cm</output></span><span>Rotation <output id="robot-angle">0°</output></span><span id="physics-count">0 placed</span></div>
 <div class="robot-console"><div class="robot-dpad" role="group" aria-label="Move in the horizontal plane"><button type="button" data-hold="forward" class="pad-up" aria-label="Move forward">↑</button><button type="button" data-hold="left" class="pad-left" aria-label="Move left">←</button><span class="pad-center" aria-hidden="true">MOVE</span><button type="button" data-hold="right" class="pad-right" aria-label="Move right">→</button><button type="button" data-hold="back" class="pad-down" aria-label="Move backward">↓</button></div><div class="robot-tool-controls"><div class="robot-button-pair"><button type="button" data-hold="up" aria-label="Raise arm">↑ Up <kbd>W</kbd></button><button type="button" data-hold="down" aria-label="Lower arm">↓ Down <kbd>S</kbd></button></div><div class="robot-button-pair"><button type="button" data-hold="ccw" aria-label="Rotate left">↶ <span>Rotate</span> <kbd>A</kbd></button><button type="button" data-hold="cw" aria-label="Rotate right">↷ <span>Rotate</span> <kbd>D</kbd></button></div><button type="button" class="game-primary" id="physics-grip">Close gripper <kbd>Space</kbd></button></div></div>
 <div class="physics-footer"><p class="physics-help">Hold the controls to move. Arrow keys: plane · W / S: height · A / D: rotate · Space: gripper.</p><button type="button" id="physics-reset" class="game-secondary">New bin</button></div><p class="game-status" role="status">Pick a block from the clutter box, lift above the rim, then release it into the green bin.</p><div class="physics-rewards" aria-live="polite"></div>`;
 const canvas=host.querySelector('canvas'),stage=host.querySelector('.physics-stage'),status=host.querySelector('.game-status'),phase=host.querySelector('#physics-phase'),gripButton=host.querySelector('#physics-grip'),loading=host.querySelector('.physics-loading');
 const progress=loading.querySelector('progress'),loadLabel=loading.querySelector('.physics-loading-label'),loadValue=loading.querySelector('.physics-loading-value'),loadDetail=loading.querySelector('.physics-loading-detail');
 function showProgress(label,value=null,detail='First load may take a moment. Downloaded files are cached for next time.'){
  if(signal.aborted)return;if(loadLabel.textContent!==label)loadLabel.textContent=label;loadDetail.textContent=detail;
  if(value===null){progress.removeAttribute('value');loadValue.textContent='';}else{progress.value=Math.min(1,Math.max(0,value));loadValue.textContent=Math.round(progress.value*100)+'%';}
 }
 function downloadProgress(label,{loaded,total}){const mb=n=>(n/1e6).toFixed(1)+' MB';showProgress(label,total?loaded/total:null,loaded?mb(loaded)+(total?' / '+mb(total):''):'Waiting for download…');}
 host.querySelectorAll('button').forEach(button=>button.disabled=true);
 let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});}catch{diagnose('game-error','WebGL renderer unavailable');host.innerHTML='<p class="game-status">This game needs WebGL. Try a browser with hardware acceleration enabled. The other games are still available.</p>';return ()=>{};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xeef0f1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xeef0f1);
 const camera=new THREE.PerspectiveCamera(39,1,.01,10);camera.up.set(0,0,1);camera.position.set(1.25,-1.4,.95);camera.lookAt(.34,0,.28);camera.layers.enable(1);
 const wristCamera=new THREE.PerspectiveCamera(82,1,.006,3);const panels=[host.querySelector('#side-panel'),host.querySelector('#wrist-panel')];let viewports=[];
 scene.add(new THREE.HemisphereLight(0xffffff,0xaab4ac,2.1));const sun=new THREE.DirectionalLight(0xffffff,3.2);sun.position.set(-.6,-.5,2.5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-1;sun.shadow.camera.right=1;sun.shadow.camera.top=1;sun.shadow.camera.bottom=-1;sun.shadow.normalBias=.002;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xb9d9ff,1);fill.position.set(1,1,1);scene.add(fill);
 let physics;
 try{physics=await createPhysics({onProgress:p=>p.stage==='download'?downloadProgress('1 / 4 · Downloading game engine',p):showProgress('1 / 4 · Starting game engine…')});}catch(err){diagnose('game-error',err.stack||err.message);loading.textContent='Physics failed to load. Close and reopen to retry.';renderer.dispose();renderer.forceContextLoss();return ()=>{};}
 if(signal.aborted){physics.dispose();renderer.dispose();renderer.forceContextLoss();return ()=>{};}
 const robotGroups={},allTextures=[],controller=createArmController();let raf=0,last=0,disposed=false,gripWas=false,placed=0,currentHeld=null;
 const keys=new Set(),heldControls=new Map();
 function material(color){return new THREE.MeshStandardMaterial({color,roughness:.62,metalness:.1});}
 for(const s of physics.statics){const m=new THREE.Mesh(new THREE.BoxGeometry(...s.size.map(n=>n*2)),material(s.color));m.position.set(...s.pos);m.receiveShadow=true;m.castShadow=true;scene.add(m);}
 // Feet and a pedestal anchor the actual Panda meshes to the workbench.
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.09,.105,.018,32),material(0x323c46));base.rotation.x=Math.PI/2;base.position.z=.009;base.receiveShadow=true;scene.add(base);
 function label(text,pos,color){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='600 32px Arial';ctx.textAlign='center';ctx.fillText(text,256,62);const tex=new THREE.CanvasTexture(c);allTextures.push(tex);const m=new THREE.Mesh(new THREE.PlaneGeometry(.27,.051),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.position.set(...pos);scene.add(m);}
 label('CLUTTER', [SOURCE.x,SOURCE.y,.0261],'#69727d');label('PLACE HERE',[DEST.x,DEST.y,.0261],'#3d7060');
 const ring=new THREE.Mesh(new THREE.RingGeometry(.035,.039,40),new THREE.MeshBasicMaterial({color:0xe49e42,transparent:true,opacity:.8,side:THREE.DoubleSide}));ring.position.set(.44,.16,.03);ring.layers.set(1);scene.add(ring);
 const ghost=new THREE.Mesh(new THREE.SphereGeometry(.006,12,8),new THREE.MeshBasicMaterial({color:0xd89737}));ghost.layers.set(1);scene.add(ghost);
 const tcpLineGeom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,.3)]);const tcpLine=new THREE.Line(tcpLineGeom,new THREE.LineDashedMaterial({color:0xa2aaa8,dashSize:.012,gapSize:.01,transparent:true,opacity:.55}));tcpLine.layers.set(1);scene.add(tcpLine);
 const resize=new ResizeObserver(()=>{const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const r=canvas.getBoundingClientRect();viewports=panels.map(p=>{const b=p.getBoundingClientRect();return {x:b.left-r.left,y:h-(b.bottom-r.top),w:b.width,h:b.height};});[camera,wristCamera].forEach((c,i)=>{c.aspect=viewports[i].w/viewports[i].h;c.updateProjectionMatrix();});});resize.observe(stage);
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);resize.disconnect();keys.clear();window.removeEventListener('blur',clearKeys);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);document.removeEventListener('visibilitychange',visibility);physics.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});allTextures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();}
 signal.addEventListener('abort',dispose,{once:true});
 try{
  const [desc,buffer]=await loadModel(p=>downloadProgress('2 / 4 · Loading robot model',p));if(signal.aborted){dispose();return dispose;}
  function build(body){const group=new THREE.Group();scene.add(group);robotGroups[body.name]=group;
   for(const visual of body.visuals){const spec=desc.meshes[visual.mesh],g=new THREE.BufferGeometry(),interleaved=new THREE.InterleavedBuffer(new Float32Array(buffer,spec.offset,spec.vertices*6),6);g.setAttribute('position',new THREE.InterleavedBufferAttribute(interleaved,3,0));g.setAttribute('normal',new THREE.InterleavedBufferAttribute(interleaved,3,3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer,spec.indexOffset,spec.indices),1));const m=new THREE.Mesh(g,material(new THREE.Color(...visual.color)));m.castShadow=true;m.receiveShadow=true;m.layers.set(body.name.includes('finger')?0:1);group.add(m);}body.children.forEach(build);
  }build(desc.body);
 }catch(err){if(!signal.aborted){diagnose('game-error',err.stack||err.message);loading.textContent='Model failed to load. Close and reopen to retry.';status.textContent=err.message;}dispose();return dispose;}
 const toyMeshes=[];const colors=[0xe9c27c,0x9fb8b3,0xc8adc6,0xa3bdd4,0xd9b29e,0xb3c69b];
 async function tokenTexture(id){const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='assets/menu-icons/'+id+'.png';});if(signal.aborted||disposed)return null;
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,256,256);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const probe=document.createElement('canvas');probe.width=image.width;probe.height=image.height;const pc=probe.getContext('2d');pc.drawImage(image,0,0);const data=pc.getImageData(0,0,image.width,image.height).data;let x0=image.width,y0=image.height,x1=0,y1=0;for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(data[(y*image.width+x)*4+3]>20){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  const w=x1-x0+1,h=y1-y0+1,s=210/Math.max(w,h);ctx.drawImage(image,x0,y0,w,h,(256-w*s)/2,(256-h*s)/2,w*s,h*s);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;allTextures.push(t);return t;
 }
 // Eighteen free bodies spawn above one another and settle into a genuinely cluttered bin.
 const chosen=roster.slice(0,18);let maps;
 let imagesReady=0;showProgress('3 / 4 · Loading Pokémon',0,'0 / '+chosen.length+' ready');
 try{maps=await Promise.all(chosen.map(async p=>{const map=await tokenTexture(p.id);imagesReady++;showProgress('3 / 4 · Loading Pokémon',imagesReady/chosen.length,imagesReady+' / '+chosen.length+' ready');return map;}));}catch(err){if(!signal.aborted){diagnose('game-error','Block image failed to load');loading.textContent='Block images failed to load. Close and reopen to retry.';}dispose();return dispose;}
 if(signal.aborted){dispose();return dispose;}
 chosen.forEach((p,i)=>{
  const map=maps[i];
  const col=i%3,row=Math.floor(i/3)%3,layer=Math.floor(i/9);const toy=physics.addToy(p.id,[SOURCE.x+(col-1)*BLOCK_SPACING,SOURCE.y+(row-1)*BLOCK_SPACING,.065+layer*.105+(i%2)*.012],i);
  const side=material(colors[i%colors.length]),face=new THREE.MeshStandardMaterial({map,roughness:.7});const mesh=new THREE.Mesh(new THREE.BoxGeometry(RADIUS*2,RADIUS*2,RADIUS*2),[side,side,face,face,face,face]);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.toy=toy;scene.add(mesh);toyMeshes.push({mesh,toy,p});
 });
 showProgress('4 / 4 · Preparing the scene…');
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 if(signal.aborted){dispose();return dispose;}
 try{physics.step(0);}catch(err){diagnose('game-error',err.stack||err.message);loading.textContent='Simulation failed to start. Close and reopen to retry.';dispose();return dispose;}
 showProgress('Ready',1,'');loading.hidden=true;host.querySelectorAll('button').forEach(button=>button.disabled=false);diagnose('robot-ready',physics.diagnostics.engine+' · Bin: '+chosen.map(p=>p.id).join(', '));
 function toggle(){physics.toggle();diagnose('robot-gripper',physics.closed?'closed':'open');gripButton.innerHTML=(physics.closed?'Open gripper':'Close gripper')+' <kbd>Space</kbd>';}
 gripButton.addEventListener('click',toggle);
 host.querySelector('#physics-reset').addEventListener('click',()=>host.dispatchEvent(new CustomEvent('new-physics-bin')));
 // Pointer input is limited to explicit buttons; the scene never changes the target.
 host.querySelectorAll('[data-hold]').forEach(button=>{
  button.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();button.setPointerCapture(e.pointerId);heldControls.set(e.pointerId,button.dataset.hold);button.classList.add('pressed');});
  const stop=e=>{heldControls.delete(e.pointerId);button.classList.remove('pressed');};
  button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);
  button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();heldControls.set('button',button.dataset.hold);button.classList.add('pressed');}});
  button.addEventListener('keyup',e=>{if(e.key==='Enter'||e.key===' '){heldControls.delete('button');button.classList.remove('pressed');}});
  button.addEventListener('blur',()=>{heldControls.delete('button');button.classList.remove('pressed');});
 });
 function keyDown(e){if(signal.aborted||document.querySelector('#bug-report-dialog')?.open||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)){if(k===' '&&e.target.tagName==='BUTTON')return;e.preventDefault();if(k===' '&&!e.repeat)toggle();else keys.add(k);}}
 function keyUp(e){keys.delete(e.key.toLowerCase());}function clearKeys(){keys.clear();heldControls.clear();host.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));}function visibility(){clearKeys();last=0;}
 window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',visibility);
 function active(action,key){return keys.has(key)||[...heldControls.values()].includes(action);}
 function drawRobot(f){for(let i=0;i<8;i++){robotGroups['link'+i].position.copy(f.frames[i].p);robotGroups['link'+i].quaternion.copy(f.frames[i].r);}robotGroups.hand.position.copy(f.hand.p);robotGroups.hand.quaternion.copy(f.hand.r);
  ['left_finger','right_finger'].forEach((name,i)=>{robotGroups[name].position.copy(f.fingers[i].p);robotGroups[name].quaternion.copy(f.fingers[i].r);});}

 let lastInput='',inputSince=0;
 function tick(now){if(disposed)return;raf=requestAnimationFrame(tick);if(document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.04):1/60;last=now;
  const input={x:Number(active('back','arrowdown'))-Number(active('forward','arrowup')),y:Number(active('right','arrowright'))-Number(active('left','arrowleft')),z:Number(active('up','w'))-Number(active('down','s')),turn:Number(active('ccw','a'))-Number(active('cw','d'))};
  const inputKey=JSON.stringify(input);
  controller.step(input,dt);physics.setArmTarget(controller.q);
  const awards=physics.step(dt),f=physics.frame;
  if(inputKey!==lastInput){diagnose('robot-motion',JSON.stringify({input,previousDurationMs:inputSince?Math.round(now-inputSince):0,tcp:{x:+f.tcp.x.toFixed(3),y:+f.tcp.y.toFixed(3),z:+f.tcp.z.toFixed(3)},limited:controller.limited}));lastInput=inputKey;inputSince=now;}drawRobot(f);const toolX=new THREE.Vector3(1,0,0).applyQuaternion(f.r),actualYaw=Math.atan2(toolX.y,toolX.x);
  host.querySelector('#robot-height').textContent=(f.tcp.z*100).toFixed(1)+' cm';host.querySelector('#robot-angle').textContent=Math.round(actualYaw*180/Math.PI)+'°';
  for(const id of awards){placed++;onAward(id);const p=roster.find(p=>p.id===id);const reward=document.createElement('span');reward.innerHTML=`<img src="assets/menu-icons/${id}.png" alt="">${p.name} collected`;host.querySelector('.physics-rewards').append(reward);status.textContent=p.name+' is safely in the bin and on your shelf. Keep going!';host.querySelector('#physics-count').textContent=placed+' placed';}
  for(const {mesh,toy} of toyMeshes){mesh.position.copy(toy.body.position);mesh.quaternion.copy(toy.body.quaternion);}
  if(physics.held?.id!==currentHeld){currentHeld=physics.held?.id;diagnose('robot-held',currentHeld||'released');phase.textContent=currentHeld?'Holding '+roster.find(p=>p.id===currentHeld).name:'Gripper '+(physics.closed?'closed · reopen to retry':'open');if(currentHeld)status.textContent='Got it. Lift above the rim, move over the green bin, then open the gripper.';else if(physics.closed)status.textContent='No secure grip. Reopen, align the fingers with two sides of a block, and try again.';}
  if(physics.closed!==gripWas){gripWas=physics.closed;gripButton.innerHTML=(gripWas?'Open gripper':'Close gripper')+' <kbd>Space</kbd>';}
  if(!currentHeld)phase.textContent='Gripper '+(physics.closed?'closed · reopen to retry':'open');
  if(controller.limited&&(input.turn||input.x||input.y||input.z))phase.textContent='Reach / rotation limit — move back';
  ring.position.set(f.tcp.x,f.tcp.y,.027);ghost.position.copy(f.tcp);const pos=tcpLine.geometry.attributes.position;pos.setXYZ(0,f.tcp.x,f.tcp.y,.027);pos.setXYZ(1,f.tcp.x,f.tcp.y,f.tcp.z);pos.needsUpdate=true;tcpLine.computeLineDistances();
  wristCamera.position.copy(new THREE.Vector3(0,0,.025).applyQuaternion(f.hand.r).add(f.hand.p));wristCamera.up.copy(new THREE.Vector3(-1,0,0).applyQuaternion(f.r));wristCamera.lookAt(f.tcp.clone().add(new THREE.Vector3(0,0,.1).applyQuaternion(f.r)));
  renderer.setScissorTest(true);for(let i=0;i<viewports.length;i++){const v=viewports[i];renderer.setViewport(v.x,v.y,v.w,v.h);renderer.setScissor(v.x,v.y,v.w,v.h);renderer.render(scene,i===0?camera:wristCamera);}renderer.setScissorTest(false);

 }
 canvas.focus({preventScroll:true});raf=requestAnimationFrame(tick);return dispose;
}
