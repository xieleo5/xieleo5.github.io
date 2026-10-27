import assert from 'node:assert/strict';
import {Vector3} from './dist/vendor/three.core.js';
import {createArmController,conditioning,LIMITS} from './dist/panda-kinematics.mjs';
import {createPhysics,SOURCE} from './dist/pick-place-world.mjs';
let peakJointSpeed=0,peakJointAcceleration=0,minSigma=1;
for(const start of [[.44,.16,.32],[.59,.28,.055],[.3,-.30,.18]]){
 const c=createArmController(new Vector3(...start));let lastV=Array(7).fill(0);
 for(let i=0;i<1800;i++){
  const q=[...c.q],dt=1/60;c.step({turn:i<600?1:i<1200?-1:0,x:i>1200?.5:0},dt);
  c.q.forEach((v,j)=>{assert.ok(Number.isFinite(v)&&v>=LIMITS[j][0]&&v<=LIMITS[j][1]);const speed=(v-q[j])/dt;peakJointSpeed=Math.max(peakJointSpeed,Math.abs(speed));peakJointAcceleration=Math.max(peakJointAcceleration,Math.abs(speed-lastV[j])/dt);lastV[j]=speed;});
  if(i%60===0)minSigma=Math.min(minSigma,conditioning(c.q).sigmaMin);
 }
}
assert.ok(peakJointSpeed<=.800001);assert.ok(peakJointAcceleration<=2.501);
const w=createPhysics();w.setGripper(new Vector3(.44,.16,.34),0);
for(let i=0;i<18;i++)w.addToy('block-'+i,[SOURCE.x+(i%3-1)*.077,SOURCE.y+(Math.floor(i/3)%3-1)*.077,.065+Math.floor(i/9)*.105],i);
let peakBlockSpeed=0,peakZ=0;const blocks=w.toys;
for(let i=0;i<5400;i++){
 const phase=i/60,p=new Vector3(.44+.095*Math.sin(phase*.4),.16+.095*Math.sin(phase*.57),.055+.15*(.5+.5*Math.cos(phase*.5)));
 if(i>180){w.setGripper(p,Math.sin(phase*.7)*1.6);if(i%150===0)w.toggle();}
 w.step(i%4===0?1/30:1/60);
 for(const t of blocks){const b=t.body;peakBlockSpeed=Math.max(peakBlockSpeed,b.velocity.length());peakZ=Math.max(peakZ,b.position.z);assert.ok(Number.isFinite(b.position.x+b.position.y+b.position.z));assert.ok(Math.abs(b.position.x)<1.5&&Math.abs(b.position.y)<1.5,'No launched blocks');}
}
assert.ok(peakBlockSpeed<3,'No explosive contact velocities');assert.ok(peakZ<.6,'No launched blocks above workspace');
console.log(JSON.stringify({peakJointSpeed,peakJointAcceleration,minSigma,peakBlockSpeed,peakZ},null,2));
console.log('PASS: continuous/reversed rotation, joint speed/acceleration bounds, workspace edges, 18-body contact stress, repeated grip/release.');
