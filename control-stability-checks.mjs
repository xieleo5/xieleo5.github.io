import assert from 'node:assert/strict';
import {Vector3} from './dist/vendor/three.core.js';
import {createArmController,conditioning,LIMITS} from './dist/panda-kinematics.mjs';
import {createPhysics,SOURCE,DEST,BLOCK_SPACING} from './dist/pick-place-world.mjs';
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
const w=await createPhysics();w.setGripper(new Vector3(.44,.16,.34),0);
for(let i=0;i<18;i++)w.addToy('block-'+i,[SOURCE.x+(i%3-1)*BLOCK_SPACING,SOURCE.y+(Math.floor(i/3)%3-1)*BLOCK_SPACING,.065+Math.floor(i/9)*.105],i);
let peakBlockSpeed=0,peakZ=0;const blocks=w.toys;
for(let i=0;i<5400;i++){
 const phase=i/60,p=new Vector3(.44+.095*Math.sin(phase*.4),.16+.095*Math.sin(phase*.57),.055+.15*(.5+.5*Math.cos(phase*.5)));
 if(i>180){w.setGripper(p,Math.sin(phase*.7)*1.6);if(i%150===0)w.toggle();}
 w.step(i%4===0?1/30:1/60);
 for(const t of blocks){const b=t.body;peakBlockSpeed=Math.max(peakBlockSpeed,b.velocity.length());peakZ=Math.max(peakZ,b.position.z);assert.ok(Number.isFinite(b.position.x+b.position.y+b.position.z));assert.ok(Math.abs(b.position.x)<1.5&&Math.abs(b.position.y)<1.5,'No launched blocks');}
}
assert.ok(peakBlockSpeed<3,'No explosive contact velocities');assert.ok(peakZ<.6,'No launched blocks above workspace');
w.dispose();
console.log(JSON.stringify({peakJointSpeed,peakJointAcceleration,minSigma,peakBlockSpeed,peakZ},null,2));
console.log('PASS: continuous/reversed rotation, joint speed/acceleration bounds, workspace edges, 18-body contact stress, repeated grip/release.');

// End-to-end keyboard controller -> joint servos -> contact grasp in the actual 18-block pile.
{
 const w=await createPhysics(),c=createArmController();
 try{
  for(let i=0;i<18;i++)w.addToy('block-'+i,[SOURCE.x+(i%3-1)*BLOCK_SPACING,SOURCE.y+(Math.floor(i/3)%3-1)*BLOCK_SPACING,.065+Math.floor(i/9)*.105+(i%2)*.012],i);
  const awards=[];
  function run(input,seconds){for(let i=0;i<Math.round(seconds*60);i++){c.step(input,1/60);w.setArmTarget(c.q);awards.push(...w.step(1/60));}}
  run({},2);run({x:-1},BLOCK_SPACING/.075);run({y:-1},BLOCK_SPACING/.075);run({},1);
  run({z:-1},(.32-.106)/.075);run({},2);w.toggle();run({},2);assert.equal(w.held?.id,'block-9');
  run({z:1},(.3-.106)/.075);run({},2);assert.equal(w.held?.id,'block-9');assert.ok(w.toys[9].body.position.z>.29);
  run({turn:1},Math.PI);run({},2);assert.equal(w.held?.id,'block-9','Keyboard 90-degree rotation retains grip');
  run({y:-1},(SOURCE.y-BLOCK_SPACING-DEST.y)/.075);run({},2);assert.equal(w.held?.id,'block-9');assert.deepEqual(awards,[]);
  w.release();run({},4);assert.deepEqual(awards,['block-9'],'Actual controls complete a contact-only pick and place');
 }finally{w.dispose();}
}
console.log('PASS: keyboard-controller grasp from 18-block pile, lift, 90-degree turn, transfer and release.');
