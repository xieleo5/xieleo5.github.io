import {downloadBuffer} from './game-download.mjs';
import loadMujoco from './vendor/mujoco/mujoco.js';
import {Vector3,Quaternion} from './vendor/three.core.js';
import {HOME,forward,solveIK} from './panda-kinematics.mjs';
export const SOURCE={x:.44,y:.16,hx:.17,hy:.16},DEST={x:.44,y:-.24,hx:.15,hy:.13};
export const FLOOR=.025,RADIUS=.027,PHYSICS_DT=.002,BLOCK_SPACING=.10;
export function inDestination(p,r=RADIUS){return Math.abs(p.x-DEST.x)<DEST.hx-r&&Math.abs(p.y-DEST.y)<DEST.hy-r&&p.z<FLOOR+2*r+.018;}
let enginePromise,assetsPromise;
async function readAsset(name,binary=false){
 const url=new URL('assets/franka/physics/'+name,import.meta.url);
 if(url.protocol==='file:'){const {readFile}=await import('node:fs/promises');const b=await readFile(url);return binary?new Uint8Array(b):b.toString();}
 const r=await fetch(url);if(!r.ok)throw Error('Physics asset unavailable: '+name);return binary?new Uint8Array(await r.arrayBuffer()):r.text();
}
async function assets(){
 const manifest=JSON.parse(await readAsset('manifest.json'));
 return {xml:await readAsset('panda.xml'),meshes:await Promise.all(manifest.meshes.map(async name=>[name,await readAsset(name,true)]))};
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const vec=a=>new Vector3(...a);
export async function createPhysics({onProgress=()=>{}}={}){
 const binary=await downloadBuffer(new URL('./vendor/mujoco/mujoco.wasm',import.meta.url),p=>onProgress({stage:'download',...p}));
 onProgress({stage:'initialize'});
 enginePromise??=loadMujoco({wasmBinary:binary}).catch(e=>{enginePromise=null;throw e;});
 assetsPromise??=assets().catch(e=>{assetsPromise=null;throw e;});
 const [mj,source]=await Promise.all([enginePromise,assetsPromise]);
 const statics=[],toys=[];
 const box=(size,pos,color)=>statics.push({size,pos,color});
 box([.64,.58,.025],[.33,0,-.025],0xe7e9e7);
 for(const [b,color] of [[SOURCE,0xb5bbc2],[DEST,0x94b2a5]]){
  box([b.hx,b.hy,.0125],[b.x,b.y,.0125],color);
  for(const s of [-1,1]){box([.009,b.hy+.009,.055],[b.x+s*(b.hx+.009),b.y,.055],color);box([b.hx,.009,.055],[b.x,b.y+s*(b.hy+.009),.055],color);}
 }
 let model,data,disposed=false,closing=false,held=null,accumulator=0,opening=.04;
 let frame,contactSummary={left:[],right:[],maxPenetration:0};
 const targetQ=[...HOME],commandQ=[...HOME];solveIK(targetQ,new Vector3(.44,.16,.32),0,180);commandQ.splice(0,7,...targetQ);
 let fingers=[.04,.04],bodyIds={};
 function initialize(){
  if(model)return;
  const staticXML=statics.map((s,i)=>`<geom name="bench_${i}" type="box" size="${s.size.join(' ')}" pos="${s.pos.join(' ')}"/>`).join('');
  const toyXML=toys.map((t,i)=>`<body name="toy_${i}" pos="${t.start.join(' ')}" quat="${t.initialQuat.w} ${t.initialQuat.x} ${t.initialQuat.y} ${t.initialQuat.z}"><freejoint name="toy_joint_${i}"/><geom name="toy_geom_${i}" type="box" size="${RADIUS} ${RADIUS} ${RADIUS}" mass="${.08+(i%3)*.02}" friction="0.6 0.005 0.0001"/></body>`).join('');
  const xml=source.xml.replace('</worldbody>',staticXML+toyXML+'</worldbody>');
  const vfs=new mj.MjVFS();
  try{for(const [name,bytes] of source.meshes)vfs.addBuffer(name,bytes);model=mj.MjModel.from_xml_string(xml,vfs);}finally{vfs.delete();}
  try{data=new mj.MjData(model);}catch(e){model.delete();model=null;throw e;}
  data.qpos.set(targetQ,0);data.qpos[7]=data.qpos[8]=.04;data.ctrl.set(targetQ,0);data.ctrl[7]=.04;
  const bodyId=name=>mj.mj_name2id(model,mj.mjtObj.mjOBJ_BODY.value,name);
  for(const name of ['hand','left_finger','right_finger'])bodyIds[name]=bodyId(name);
  toys.forEach((t,i)=>{t.bodyId=bodyId('toy_'+i);t.geomId=mj.mj_name2id(model,mj.mjtObj.mjOBJ_GEOM.value,'toy_geom_'+i);const j=mj.mj_name2id(model,mj.mjtObj.mjOBJ_JOINT.value,'toy_joint_'+i);t.qadr=model.jnt_qposadr[j];t.vadr=model.jnt_dofadr[j];});
  mj.mj_forward(model,data);sync();
 }
 function sync(){
  frame=forward(Array.from(data.qpos.subarray(0,7)));fingers=[data.qpos[7],data.qpos[8]];
  frame.fingers=['left_finger','right_finger'].map(name=>{const i=bodyIds[name],p=data.xpos.subarray(3*i,3*i+3),r=data.xquat.subarray(4*i,4*i+4);return {p:vec(p),r:new Quaternion(r[1],r[2],r[3],r[0])};});
  for(const t of toys){const p=data.xpos.subarray(3*t.bodyId,3*t.bodyId+3),r=data.xquat.subarray(4*t.bodyId,4*t.bodyId+4),v=data.qvel.subarray(t.vadr,t.vadr+6);t.body.position.set(...p);t.body.quaternion.set(r[1],r[2],r[3],r[0]);t.body.velocity.set(...v.subarray(0,3));t.body.angularVelocity.set(...v.subarray(3,6));}
 }
 function inspectContacts(){
  const contacts=data.contact,left=new Set(),right=new Set();let maxPenetration=0;
  try{for(let i=0;i<data.ncon;i++){const c=contacts.get(i);maxPenetration=Math.max(maxPenetration,-c.dist);if(c.dist>.0005||c.efc_address<0)continue;
   const a=model.geom_bodyid[c.geom1],b=model.geom_bodyid[c.geom2];
   for(const [name,set] of [['left_finger',left],['right_finger',right]]){if(a===bodyIds[name])set.add(b);if(b===bodyIds[name])set.add(a);}
  }}finally{contacts.delete();}
  // This is observation only. No weld, magnet, collision disabling or pose writes.
  held=closing?toys.find(t=>left.has(t.bodyId)&&right.has(t.bodyId))??null:null;
  contactSummary={left:[...left],right:[...right],maxPenetration};
 }
 function addToy(id,pos,index=toys.length){
  if(model)throw Error('Add all blocks before starting the simulation.');
  const q=new Quaternion().setFromAxisAngle(new Vector3(0,0,1),index*.7);
  const t={id,start:[...pos],initialQuat:q,body:{position:vec(pos),quaternion:q.clone(),velocity:new Vector3(),angularVelocity:new Vector3()},awarded:false,settled:0};toys.push(t);return t;
 }
 function step(dt){
  if(disposed)return [];initialize();accumulator+=Math.min(.05,Math.max(0,dt));const wins=[];
  while(accumulator+1e-10>=PHYSICS_DT){
   for(let i=0;i<7;i++){commandQ[i]+=clamp(targetQ[i]-commandQ[i],-.8*PHYSICS_DT,.8*PHYSICS_DT);data.ctrl[i]=commandQ[i];}
   opening+=clamp((closing?0:.04)-opening,-.04*PHYSICS_DT,.04*PHYSICS_DT);data.ctrl[7]=opening;
   mj.mj_step(model,data);accumulator-=PHYSICS_DT;
  }
  // mj_step leaves pose-derived arrays at the integration input state; refresh for rendering.
  mj.mj_forward(model,data);sync();inspectContacts();
  for(const t of toys){if(t===held||t.awarded){t.settled=0;continue;}
   const supported=t.body.position.z<FLOOR+RADIUS+.004;
   if(supported&&inDestination(t.body.position)&&t.body.velocity.length()<.03&&t.body.angularVelocity.length()<.3)t.settled+=Math.min(.05,Math.max(0,dt));else t.settled=0;
   if(t.settled>.65){t.awarded=true;wins.push(t.id);}
  }return wins;
 }
 return {statics,toys,addToy,step,release(){closing=false;held=null;},toggle(){closing=!closing;if(!closing)held=null;},
  setArmTarget(q){targetQ.splice(0,7,...q);},
  setGripper(p,yaw){solveIK(targetQ,new Vector3(p.x,p.y,p.z),yaw,80);if(!model)commandQ.splice(0,7,...targetQ);},
  get held(){return held;},get closed(){return closing;},get aperture(){return (fingers[0]+fingers[1])/2;},get tcp(){return (frame??forward(targetQ)).tcp;},get frame(){return frame??forward(targetQ);},
  get diagnostics(){return {...contactSummary,engine:'MuJoCo '+mj.mj_versionString(),time:data?.time??0};},
  get model(){return model;},get data(){return data;},
  dispose(){if(disposed)return;disposed=true;data?.delete();model?.delete();data=model=null;}
 };
}
