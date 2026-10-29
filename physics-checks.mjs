import assert from 'node:assert/strict';
import {Vector3,Quaternion} from './dist/vendor/three.core.js';
import {HOME,LIMITS,solveIK} from './dist/panda-kinematics.mjs';
import {createPhysics,SOURCE,DEST,FLOOR,RADIUS,inDestination} from './dist/pick-place-world.mjs';

const q=[...HOME];let worst=0;
for(const x of [.3,.44,.59])for(const y of [-.3,.12,.28])for(const z of [.055,.14,.34]){
 const t=new Vector3(x,y,z),f=solveIK(q,t,0,140),err=f.tcp.distanceTo(t);worst=Math.max(worst,err);assert.ok(err<.012,`IK ${x},${y},${z}: ${err}`);assert.ok(q.every((v,i)=>v>=LIMITS[i][0]&&v<=LIMITS[i][1]));
}
const metrics={worstIKError:worst,peakPenetration:0,maxHeldDrift:0,maxHeldRotationDrift:0,peakRobotObstaclePenetration:0};
async function fixture(dt=1/60){
 const w=await createPhysics(),t=w.addToy('eevee',[SOURCE.x,SOURCE.y,.09],0),wins=[];
 let p=new Vector3(SOURCE.x,SOURCE.y,.32),angle=0;
 const step=()=>{wins.push(...w.step(dt));metrics.peakPenetration=Math.max(metrics.peakPenetration,w.diagnostics.maxPenetration);};
 function hold(seconds){for(let i=0;i<Math.round(seconds/dt);i++)step();}
 function move(end,yaw=angle,seconds=3){const start=p.clone(),old=angle,n=Math.round(seconds/dt);for(let i=1;i<=n;i++){p.lerpVectors(start,end,i/n);angle=old+(yaw-old)*i/n;w.setGripper(p,angle);step();}}
 function grasp(){move(new Vector3(SOURCE.x,SOURCE.y,FLOOR+RADIUS));hold(1);w.toggle();hold(2);assert.equal(w.held?.id,t.id,'Both fingers must physically contact the block');}
 return {w,t,wins,step,hold,move,grasp};
}
// Exercise the same fixed-step simulation at common display refresh rates.
for(const dt of [1/30,1/60,1/120]){
 const {w,t,wins,step,hold,move,grasp}=await fixture(dt);
 try{
  hold(2);assert.ok(Math.abs(t.body.position.z-(FLOOR+RADIUS))<.0001,'Gravity and floor support');
  w.toggle();hold(2);assert.equal(w.held,null,'No proximity/magnetic grab from a distance');w.release();hold(2);
  grasp();move(new Vector3(SOURCE.x,SOURCE.y,.3));hold(2);assert.ok(t.body.position.z>.29,'Friction lifts the free body against gravity');
  move(new Vector3(SOURCE.x,SOURCE.y,.3),Math.PI/2,4);hold(2);
  const relative=t.body.position.clone().sub(w.tcp),rotation=t.body.quaternion.clone();
  for(let i=0;i<Math.round(15/dt);i++){
   step();assert.equal(w.held?.id,t.id);metrics.maxHeldDrift=Math.max(metrics.maxHeldDrift,t.body.position.clone().sub(w.tcp).distanceTo(relative));metrics.maxHeldRotationDrift=Math.max(metrics.maxHeldRotationDrift,t.body.quaternion.angleTo(rotation));
  }
  // The displayed hand/link transforms must match the dynamics engine's world poses.
  const frames=[...w.frame.frames,w.frame.hand,...w.frame.fingers];
  frames.forEach((f,i)=>{const body=i+1,xyz=w.data.xpos.subarray(body*3,body*3+3),r=w.data.xquat.subarray(body*4,body*4+4);assert.ok(f.p.distanceTo(new Vector3(...xyz))<1e-8,'Visual/collision position mismatch');assert.ok(f.r.angleTo(new Quaternion(r[1],r[2],r[3],r[0]))<1e-6,'Visual/collision orientation mismatch');});
  move(new Vector3(DEST.x,DEST.y,.3),Math.PI/2,6);hold(1);assert.deepEqual(wins,[],'Held blocks cannot score');w.release();hold(4);
  assert.deepEqual(wins,[t.id],'Release, settle and award exactly once');assert.ok(inDestination(t.body.position));
 }finally{w.dispose();w.dispose();}
}
assert.ok(metrics.maxHeldDrift<.001,'No pendulum/suspension drift while stationary');assert.ok(metrics.maxHeldRotationDrift<.01,'No free rotation while held');
// Ablation: remove contact friction AFTER gripping. A fake weld would keep it aloft.
{
 const {w,t,hold,move,grasp}=await fixture();
 try{hold(2);grasp();move(new Vector3(SOURCE.x,SOURCE.y,.3));hold(1);assert.ok(t.body.position.z>.29);w.model.geom_friction.fill(0);hold(3);assert.ok(t.body.position.z<.08,'Frictionless block must slip and fall');assert.equal(w.held,null);}finally{w.dispose();}
}
// Force commands into the bin walls/floor: finite-force servos must yield, not teleport through them.
for(const target of [[.44,.33,.06],[.62,.16,.055],[.44,.16,-.02]]){
 const w=await createPhysics();try{w.step(0);w.setGripper(new Vector3(...target),0);for(let i=0;i<300;i++){w.step(1/60);metrics.peakRobotObstaclePenetration=Math.max(metrics.peakRobotObstaclePenetration,w.diagnostics.maxPenetration);}assert.ok(w.tcp.distanceTo(new Vector3(...target))>.01,'Obstacle stops the commanded motion');}finally{w.dispose();}
}
assert.ok(metrics.peakRobotObstaclePenetration<.001,'Robot/obstacle penetration stays below 1 mm');
assert.ok(metrics.peakPenetration<.004,'Transient falling-block impact penetration stays below 4 mm');
console.log(JSON.stringify(metrics,null,2));
console.log('PASS: MuJoCo gravity, contact-only grasp, 90-degree turn, 15s hold, friction ablation, wall/floor blocking, pose alignment, 30/60/120 Hz transfer, release/reward, disposal.');
