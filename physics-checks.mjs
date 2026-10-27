import assert from 'node:assert/strict';
import {Vector3} from './dist/vendor/three.core.js';
import {HOME,LIMITS,solveIK} from './dist/panda-kinematics.mjs';
import {createPhysics,SOURCE,DEST,FLOOR,RADIUS,inDestination} from './dist/pick-place-world.mjs';
const q=[...HOME];let worst=0;
for(const x of [.3,.44,.59])for(const y of [-.3,.12,.28])for(const z of [.055,.14,.34]){
 const t=new Vector3(x,y,z),f=solveIK(q,t,0,140),err=f.tcp.distanceTo(t);worst=Math.max(worst,err);assert.ok(err<.012,`IK ${x},${y},${z}: ${err}`);assert.ok(q.every((v,i)=>v>=LIMITS[i][0]&&v<=LIMITS[i][1]));
}
console.log('IK reachable workspace checked; worst position error (m):',worst);
const w=createPhysics();w.setGripper(new Vector3(.44,0,.5),0,1/60);
const t=w.addToy('eevee',[SOURCE.x,SOURCE.y,.18],0);let wins=[];
for(let i=0;i<180;i++)wins.push(...w.step(1/60));assert.equal(wins.length,0);assert.ok(Math.abs(t.body.position.z-(FLOOR+RADIUS))<.01,'Object rests on bin floor');
w.toggle();for(let i=0;i<60;i++){w.setGripper(new Vector3(.44,0,.5),0,1/60);w.step(1/60);}assert.equal(w.held,null,'Cannot grip remotely');w.release();
const tp=new Vector3(t.body.position.x,t.body.position.y,t.body.position.z);
for(let i=0;i<240;i++){w.setGripper(tp,0,1/60);w.step(1/60);}w.toggle();for(let i=0;i<60;i++){w.setGripper(tp,0,1/60);w.step(1/60);}assert.equal(w.held?.id,'eevee','Aligned grip attaches');
function move(end){const start=tp.clone();for(let i=1;i<=180;i++){tp.lerpVectors(start,end,i/180);w.setGripper(tp,0,1/60);wins.push(...w.step(1/60));}}
move(new Vector3(SOURCE.x,SOURCE.y,.3));assert.ok(t.body.position.z>.25,'Held body lifts against gravity');move(new Vector3(DEST.x,DEST.y,.3));assert.equal(wins.length,0,'Held body cannot score');w.release();
for(let i=0;i<240;i++){w.setGripper(tp,0,1/60);wins.push(...w.step(1/60));}assert.deepEqual(wins,['eevee'],'Released and settled body scores exactly once');assert.ok(inDestination(t.body.position));
console.log('PASS: gravity, floor collision, remote-grab rejection, constrained lift, transfer, release, settled-bin reward, no duplicate awards.');
