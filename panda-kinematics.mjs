import {Vector3, Quaternion} from './vendor/three.core.js';
export const LIMITS=[[-2.8973,2.8973],[-1.7628,1.7628],[-2.8973,2.8973],[-3.0718,-.0698],[-2.8973,2.8973],[-.0175,3.7525],[-2.8973,2.8973]];
export const HOME=[0,-.45,0,-2.15,0,1.7,.7854];
const origins=[[0,0,.333],[0,0,0],[0,-.316,0],[.0825,0,0],[-.0825,.384,0],[0,0,0],[.088,0,0]];
const tilts=[0,-Math.PI/2,Math.PI/2,Math.PI/2,-Math.PI/2,Math.PI/2,Math.PI/2];
const zAxis=new Vector3(0,0,1),xAxis=new Vector3(1,0,0);
export function forward(q){
 let p=new Vector3(),r=new Quaternion();const frames=[{p:p.clone(),r:r.clone()}],axes=[],centers=[];
 for(let i=0;i<7;i++){
  p.add(new Vector3(...origins[i]).applyQuaternion(r));r.multiply(new Quaternion().setFromAxisAngle(xAxis,tilts[i]));
  axes.push(zAxis.clone().applyQuaternion(r));centers.push(p.clone());r.multiply(new Quaternion().setFromAxisAngle(zAxis,q[i]));frames.push({p:p.clone(),r:r.clone()});
 }
 const hand=p.clone().add(new Vector3(0,0,.107).applyQuaternion(r));
 r.multiply(new Quaternion().setFromAxisAngle(zAxis,-Math.PI/4));
 const tcp=hand.clone().add(new Vector3(0,0,.1034).applyQuaternion(r));
 return {frames,axes,centers,hand:{p:hand,r:r.clone()},tcp,r};
}
function linearSolve(a,b){
 const n=b.length,m=a.map((row,i)=>[...row,b[i]]);
 for(let c=0;c<n;c++){
  let pivot=c;for(let j=c+1;j<n;j++)if(Math.abs(m[j][c])>Math.abs(m[pivot][c]))pivot=j;
  [m[c],m[pivot]]=[m[pivot],m[c]];if(Math.abs(m[c][c])<1e-12)return Array(n).fill(0);
  const d=m[c][c];for(let k=c;k<=n;k++)m[c][k]/=d;
  for(let j=0;j<n;j++)if(j!==c){const s=m[j][c];for(let k=c;k<=n;k++)m[j][k]-=s*m[c][k];}
 }return m.map(row=>row[n]);
}

function jacobian(f){
 const j=Array.from({length:6},()=>Array(7).fill(0));
 f.axes.forEach((axis,i)=>{const v=axis.clone().cross(f.tcp.clone().sub(f.centers[i]));[v.x,v.y,v.z,axis.x*.26,axis.y*.26,axis.z*.26].forEach((n,k)=>j[k][i]=n);});return j;
}
function spectrum(j){
 const a=Array.from({length:6},(_,i)=>Array.from({length:6},(_,k)=>j[i].reduce((s,v,c)=>s+v*j[k][c],0)));
 for(let sweep=0;sweep<40;sweep++){
  let p=0,q=1,max=0;for(let i=0;i<6;i++)for(let k=i+1;k<6;k++)if(Math.abs(a[i][k])>max){max=Math.abs(a[i][k]);p=i;q=k;}if(max<1e-10)break;
  const phi=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(phi),s=Math.sin(phi),ap=a[p][p],aq=a[q][q],cross=a[p][q];
  for(let k=0;k<6;k++)if(k!==p&&k!==q){const x=a[k][p],y=a[k][q];a[k][p]=a[p][k]=c*x-s*y;a[k][q]=a[q][k]=s*x+c*y;}
  a[p][p]=c*c*ap-2*s*c*cross+s*s*aq;a[q][q]=s*s*ap+2*s*c*cross+c*c*aq;a[p][q]=a[q][p]=0;
 }
 const values=a.map((r,i)=>Math.sqrt(Math.max(0,r[i])));return {min:Math.min(...values),max:Math.max(...values)};
}
export function conditioning(q){const s=spectrum(jacobian(forward(q)));return {sigmaMin:s.min,condition:s.max/Math.max(s.min,1e-10)};}

export function solveIK(q,target,yaw=0,iterations=10){
 const desired=new Quaternion().setFromAxisAngle(zAxis,yaw).multiply(new Quaternion().setFromAxisAngle(xAxis,Math.PI));
 for(let it=0;it<iterations;it++){
  const f=forward(q),dp=target.clone().sub(f.tcp),er=desired.clone().multiply(f.r.clone().invert());
  if(er.w<0){er.x*=-1;er.y*=-1;er.z*=-1;er.w*=-1;}
  const weight=.26,error=[dp.x,dp.y,dp.z,2*er.x*weight,2*er.y*weight,2*er.z*weight];
  if(dp.length()<.0003&&Math.hypot(er.x,er.y,er.z)<.001)break;
  const j=jacobian(f),sigma=spectrum(j).min;
  const damping=.012+Math.max(0,.045-sigma)*1.6;
  const a=Array.from({length:6},(_,i)=>Array.from({length:6},(_,k)=>j[i].reduce((sum,v,c)=>sum+v*j[k][c],0)+(i===k?damping*damping:0)));
  const dq=linearSolve(a,error);
  for(let i=0;i<7;i++)q[i]=Math.max(LIMITS[i][0],Math.min(LIMITS[i][1],q[i]+Math.max(-.11,Math.min(.11,j.reduce((s,row,k)=>s+row[i]*dq[k],0)))));
 }
 return forward(q);
}

// Separate the IK target from the rendered joint state: no instantaneous pose writes.
export function createArmController(target=new Vector3(.44,.16,.32)){
 const q=[...HOME];solveIK(q,target,0,180);let desiredQ=[...q],goal=forward(q).tcp.clone(),yaw=0;const velocity=Array(7).fill(0);let limited=false;
 return {q,velocity,get yaw(){return yaw;},get limited(){return limited;},step(input,dt){
  dt=Math.min(.04,Math.max(.001,dt));const next=goal.clone(),v=new Vector3(input.x||0,input.y||0,input.z||0);if(v.length()>1)v.normalize();next.addScaledVector(v,.075*dt);
  next.x=Math.max(.27,Math.min(.60,next.x));next.y=Math.max(-.34,Math.min(.31,next.y));next.z=Math.max(.052,Math.min(.46,next.z));
  const nextYaw=yaw+(input.turn||0)*.5*dt;
  if(v.lengthSq()||input.turn){const candidate=[...desiredQ],f=solveIK(candidate,next,nextYaw,8),desired=new Quaternion().setFromAxisAngle(zAxis,nextYaw).multiply(new Quaternion().setFromAxisAngle(xAxis,Math.PI));
   limited=f.tcp.distanceTo(next)>.009||f.r.angleTo(desired)>.055;
   if(!limited){desiredQ=candidate;goal=next;yaw=nextYaw;}
  }
  for(let i=0;i<7;i++){
   const error=desiredQ[i]-q[i],requested=Math.max(-.8,Math.min(.8,error*8));velocity[i]+=Math.max(-2.5*dt,Math.min(2.5*dt,requested-velocity[i]));
   const step=velocity[i]*dt;q[i]=Math.max(LIMITS[i][0],Math.min(LIMITS[i][1],q[i]+step));
  }
  return forward(q);
 }};
}
