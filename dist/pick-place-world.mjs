import * as C from './vendor/cannon-es.js';
export const SOURCE={x:.44,y:.16,hx:.17,hy:.16},DEST={x:.44,y:-.24,hx:.15,hy:.13};
export const FLOOR=.025,RADIUS=.027,PHYSICS_DT=1/120;
export function inDestination(p,r=RADIUS){return Math.abs(p.x-DEST.x)<DEST.hx-r&&Math.abs(p.y-DEST.y)<DEST.hy-r&&p.z<FLOOR+2*r+.018;}
export function createPhysics(){
 const world=new C.World({gravity:new C.Vec3(0,0,-9.81)});world.solver.iterations=30;world.allowSleep=true;
 Object.assign(world.defaultContactMaterial,{friction:.5,restitution:0,contactEquationStiffness:8e4,contactEquationRelaxation:6,frictionEquationStiffness:8e4,frictionEquationRelaxation:6});
 const statics=[];
 function box(size,pos,color){const body=new C.Body({mass:0,shape:new C.Box(new C.Vec3(...size)),position:new C.Vec3(...pos)});world.addBody(body);statics.push({size,pos,color});return body;}
 box([.64,.58,.025],[.33,0,-.025],0xe7e9e7);
 for(const [b,color] of [[SOURCE,0xb5bbc2],[DEST,0x94b2a5]]){
  box([b.hx,b.hy,.0125],[b.x,b.y,.0125],color);
  for(const s of [-1,1]){box([.009,b.hy+.009,.055],[b.x+s*(b.hx+.009),b.y,.055],color);box([b.hx,.009,.055],[b.x,b.y+s*(b.hy+.009),.055],color);}
 }
 const toys=[];let held=null,gripConstraint=null,aperture=.042,closing=false,accumulator=0,initialized=false,yaw=0;
 const target=new C.Vec3(.44,.16,.32),tcp=target.clone();let targetYaw=0;
 const palm=new C.Body({type:C.Body.KINEMATIC,allowSleep:false,shape:new C.Box(new C.Vec3(.045,.025,.022)),collisionFilterGroup:2,collisionFilterMask:1});world.addBody(palm);
 const pads=[-1,1].map(()=>{const b=new C.Body({type:C.Body.KINEMATIC,allowSleep:false,shape:new C.Box(new C.Vec3(.012,.006,.025)),collisionFilterGroup:2,collisionFilterMask:1});world.addBody(b);return b;});
 const anchor=new C.Body({type:C.Body.KINEMATIC,allowSleep:false,collisionFilterGroup:0,collisionFilterMask:0});world.addBody(anchor);
 function placeInitial(body,pos,quat){body.position.copy(pos);body.previousPosition.copy(pos);body.interpolatedPosition.copy(pos);body.quaternion.copy(quat);body.aabbNeedsUpdate=true;}
 function drive(body,pos,quat){
  body.wakeUp();
  // Integrate velocity once. Teleporting to pos AND setting velocity double-applied motion.
  body.velocity.set((pos.x-body.position.x)/PHYSICS_DT,(pos.y-body.position.y)/PHYSICS_DT,(pos.z-body.position.z)/PHYSICS_DT);
  const inv=new C.Quaternion(),delta=new C.Quaternion();body.quaternion.conjugate(inv);quat.mult(inv,delta);if(delta.w<0){delta.x*=-1;delta.y*=-1;delta.z*=-1;delta.w*=-1;}
  const sin=Math.hypot(delta.x,delta.y,delta.z),angle=2*Math.atan2(sin,Math.max(0,delta.w)),scale=sin>1e-8?Math.min(angle/PHYSICS_DT,.8)/sin:0;body.angularVelocity.set(delta.x*scale,delta.y*scale,delta.z*scale);
 }
 function release(){if(gripConstraint)world.removeConstraint(gripConstraint);if(held){held.releaseDelay=.3;held.body.wakeUp();}held=null;gripConstraint=null;closing=false;}
 function setGripper(p,rotation){target.set(p.x,p.y,p.z);targetYaw=rotation;}
 function widthInGripper(t){const normal=new C.Vec3(-Math.sin(yaw),Math.cos(yaw),0),local=new C.Vec3();t.body.quaternion.conjugate(new C.Quaternion()).vmult(normal,local);return RADIUS*(Math.abs(local.x)+Math.abs(local.y)+Math.abs(local.z));}
 function substep(){
  const h=PHYSICS_DT,delta=new C.Vec3();target.vsub(tcp,delta);const len=delta.length();if(len>.18*h)delta.scale(.18*h/len,delta);tcp.vadd(delta,tcp);
  const angle=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw));yaw+=Math.max(-.6*h,Math.min(.6*h,angle));
  if(!initialized){tcp.copy(target);yaw=targetYaw;}
  if(closing&&!held){let best=null,distance=.028;
   for(const t of toys){if(t.awarded||t.releaseDelay>0)continue;const p=t.body.position,d=Math.hypot(p.x-tcp.x,p.y-tcp.y);if(d<distance&&Math.abs(p.z-tcp.z)<.022&&aperture<=widthInGripper(t)+.008){best=t;distance=d;}}
   if(best){held=best;held.body.collisionFilterMask=1;held.body.wakeUp();const pivot=new C.Vec3();held.body.pointToLocalFrame(tcp,pivot);gripConstraint=new C.PointToPointConstraint(anchor,new C.Vec3(),held.body,pivot,5);gripConstraint.equations.forEach(e=>e.setSpookParams(8e4,6,h));world.addConstraint(gripConstraint);}
  }
  const opening=closing?(held?Math.min(.042,widthInGripper(held)+.002):.008):.042;aperture+=Math.max(-.045*h,Math.min(.045*h,opening-aperture));
  const quat=new C.Quaternion();quat.setFromAxisAngle(new C.Vec3(0,0,1),yaw);
  const poses=[[anchor,tcp],[palm,new C.Vec3(tcp.x,tcp.y,tcp.z+.085)],...pads.map((b,i)=>{const side=i?1:-1;return[b,new C.Vec3(tcp.x-Math.sin(yaw)*side*(aperture+.006),tcp.y+Math.cos(yaw)*side*(aperture+.006),tcp.z)];})];
  for(const [b,p] of poses){if(!initialized)placeInitial(b,p,quat);drive(b,p,quat);}initialized=true;
  if(held)held.body.wakeUp();
  for(const t of toys)if(t!==held&&t.body.collisionFilterMask===1){t.releaseDelay=Math.max(0,(t.releaseDelay||0)-h);if(!t.releaseDelay&&(!closing||t.body.position.distanceTo(tcp)>.09)&&aperture>.039)t.body.collisionFilterMask=3;}
  world.step(h);
  if(held&&held.body.position.distanceTo(tcp)>.07)release();
 }
 function addToy(id,pos,index){const b=new C.Body({mass:.08+(index%3)*.02,shape:new C.Box(new C.Vec3(RADIUS,RADIUS,RADIUS)),position:new C.Vec3(...pos),linearDamping:.35,angularDamping:.55,sleepSpeedLimit:.035,sleepTimeLimit:.4,collisionFilterGroup:1,collisionFilterMask:3});b.quaternion.setFromEuler(.06*(index%3),.08*(index%2),index*.7);world.addBody(b);const t={id,body:b,awarded:false,settled:0,releaseDelay:0};toys.push(t);return t;}
 function step(dt){accumulator+=Math.min(.05,Math.max(0,dt));const wins=[];
  while(accumulator+1e-10>=PHYSICS_DT){substep();accumulator-=PHYSICS_DT;
   for(const t of toys){if(t===held||t.awarded)continue;if(inDestination(t.body.position)&&t.body.velocity.length()<.065&&t.body.angularVelocity.length()<.8)t.settled+=PHYSICS_DT;else t.settled=0;if(t.settled>.65){t.awarded=true;wins.push(t.id);}}
  }return wins;
 }
 return {world,statics,toys,addToy,setGripper,step,release,toggle(){if(closing)release();else closing=true;},get held(){return held;},get aperture(){return aperture;},get closed(){return closing;},get tcp(){return tcp;},pads,palm};
}
