export const LIMIT = 75;
export const SURFACES = [
  {x:0,z:5,w:9,d:12},{x:0,z:-10,w:5,d:20},
  {x:0,z:-22,w:10,d:8},{x:9,z:-22,w:20,d:3.8},
  {x:18,z:-22,w:8,d:8},{x:18,z:-35,w:3.8,d:24},
  {x:18,z:-49,w:9,d:8},{x:7,z:-49,w:24,d:3.6},
  {x:-5,z:-49,w:8,d:8},{x:-5,z:-63,w:4.4,d:24},
  {x:-5,z:-78,w:10,d:10}
];
export const WAYPOINTS = [{x:0,z:5},{x:0,z:-22},{x:18,z:-22},{x:18,z:-49},{x:-5,z:-49},{x:-5,z:-78}];
export function dailySeed(date = new Date()) { return date.toISOString().slice(0,10); }
export function hashSeed(str) { let h=2166136261; for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619);} return h>>>0; }
export function createState(seed=dailySeed()) {
  return {seed,phase:(hashSeed(seed)%628)/100,x:0,z:7,yaw:0,vx:0,vz:0,time:0,water:1,tiltX:0,tiltZ:0,tiltVX:0,tiltVZ:0,progress:0,leg:0,checkpoint:{x:0,z:7,yaw:0},falls:0,bumps:0,calm:0,gust:0,gustTime:0,crowd:false,support:0,done:false,finished:false,fallCooldown:0,bumpCooldown:0,sampleTime:0,samples:[{t:0,water:1}],lastEvent:null};
}
export function onSurface(x,z,margin=0) {return SURFACES.some(p=>Math.abs(x-p.x)<=p.w/2-margin&&Math.abs(z-p.z)<=p.d/2-margin);}
export function applyEvent(s,type){
 if(s.done)return false;
 if(type==='cheer'||type==='tip'){
   s.support++;
   if(s.support>=3){s.support=0;s.crowd=true;s.calm=6;s.lastEvent='THE CREW RAISED THE WINDBREAK · 6s CALM';}
   else s.lastEvent=`SIMULATED ${type.toUpperCase()} · WINDBREAK ${s.support}/3`;
 }else if(type==='left'||type==='right'){s.crowd=true;s.gust=type==='left'?-1:1;s.gustTime=2.8;s.lastEvent=type==='left'?'CHAT SENT A LEFT GUST':'CHAT SENT A RIGHT GUST';}
 else if(type==='calm'){s.crowd=true;s.calm=5;s.lastEvent='CHAT HAS YOUR BACK · 5s CALM';}
 else return false;
 return true;
}
export function obstacles(s){return [
 {x:Math.sin(s.time*1.3+s.phase)*1.65,z:-9,r:.63},
 {x:18+Math.sin(s.time*1.1+s.phase)*1.22,z:-34,r:.58},
 {x:6,z:-49+Math.sin(s.time*1.6+s.phase)*1.1,r:.52},
 {x:-5+Math.sin(s.time*1.45+s.phase)*1.35,z:-65,r:.63}
 ];}
export function step(s,input,dt){
 if(s.done)return;
 dt=Math.min(dt,1/30);s.time+=dt;s.lastEvent=null;
 s.calm=Math.max(0,s.calm-dt);s.gustTime=Math.max(0,s.gustTime-dt);s.fallCooldown=Math.max(0,s.fallCooldown-dt);s.bumpCooldown=Math.max(0,s.bumpCooldown-dt);
 const steady=!!input.steady;
 s.yaw+=(input.turn||0)*1.6*dt;
 const forward=input.forward||0,strafe=input.strafe||0,length=Math.max(1,Math.hypot(forward,strafe));
 const speed=steady?2.5:input.sprint?7:4.6;
 const tx=(Math.sin(s.yaw)*forward+Math.cos(s.yaw)*strafe)/length*speed;
 const tz=(-Math.cos(s.yaw)*forward+Math.sin(s.yaw)*strafe)/length*speed;
 const prevX=s.vx,prevZ=s.vz;
 const response=steady?5.5:7.5;
 s.vx+=(tx-s.vx)*Math.min(1,response*dt);s.vz+=(tz-s.vz)*Math.min(1,response*dt);
 const zone=s.z < -28?1:s.z < -15?.6:.22;
 const wind=s.calm>0?0:(Math.sin(s.time*1.1+s.phase)*.65+Math.sin(s.time*.43+s.phase)*.38)*zone+(s.gustTime>0?s.gust*2.3:0);
 s.x+=(s.vx+wind*.22)*dt;s.z+=s.vz*dt;
 const ax=(s.vx-prevX)/dt,az=(s.vz-prevZ)/dt;
 const localX=ax*Math.cos(s.yaw)+az*Math.sin(s.yaw),localZ=-ax*Math.sin(s.yaw)+az*Math.cos(s.yaw);
 const damping=steady?6.2:2.1,stiffness=steady?17:11;
 s.tiltVX+=(-stiffness*s.tiltX-damping*s.tiltVX-localX*.24+wind*2.0)*dt;
 s.tiltVZ+=(-stiffness*s.tiltZ-damping*s.tiltVZ-localZ*.24+Math.sin(s.time*9)*Math.hypot(s.vx,s.vz)*.085)*dt;
 s.tiltX+=s.tiltVX*dt;s.tiltZ+=s.tiltVZ*dt;
 const tilt=Math.hypot(s.tiltX,s.tiltZ),rim=.27+(1-s.water)*.48;
 s.water=Math.max(0,s.water-Math.max(0,tilt-rim)*dt*.16);
 for(const o of obstacles(s)){
  const dx=s.x-o.x,dz=s.z-o.z,d=Math.hypot(dx,dz),r=o.r+.25;
  if(d<r){const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0;s.x=o.x+nx*r;s.z=o.z+nz*r;s.vx*=.25;s.vz*=.25;
   if(s.bumpCooldown<=0){s.tiltVX+=nx*2.3;s.tiltVZ+=nz*2.3;s.water=Math.max(0,s.water-.025);s.bumps++;s.bumpCooldown=.8;s.lastEvent='EXCUSE YOU, BEACH BALL.';}
  }
 }
 if(!onSurface(s.x,s.z)&&s.fallCooldown<=0){s.water=Math.max(0,s.water-.14);s.falls++;Object.assign(s,s.checkpoint);s.vx=0;s.vz=0;s.tiltVX=0;s.tiltVZ=0;s.tiltX=.22;s.tiltZ=0;s.fallCooldown=1;s.lastEvent='A QUICK DIP. −14% WATER';}
 const next=WAYPOINTS[Math.min(s.leg+1,WAYPOINTS.length-1)];
 const from=WAYPOINTS[s.leg];
 if(next&&from){const dx=next.x-from.x,dz=next.z-from.z,len=Math.hypot(dx,dz);const along=Math.max(0,Math.min(1,((s.x-from.x)*dx+(s.z-from.z)*dz)/(len*len)));s.progress=Math.max(s.progress,(s.leg+along)/(WAYPOINTS.length-1));
  if(Math.hypot(s.x-next.x,s.z-next.z)<3.2&&s.leg<WAYPOINTS.length-2){s.leg++;const following=WAYPOINTS[s.leg+1];s.checkpoint={x:next.x,z:next.z,yaw:Math.atan2(following.x-next.x,-(following.z-next.z))};s.lastEvent='CHECKPOINT · YOU STILL HAVE A GLASS';}
 }
 if(s.leg>=4&&s.z < -75&&Math.abs(s.x+5)<4.7){s.done=true;s.finished=true;s.progress=1;}
 if(s.water<=0||s.time>=LIMIT){s.done=true;s.finished=false;}
 if(s.time-s.sampleTime>.5||s.done){s.samples.push({t:s.time,water:s.water});s.sampleTime=s.time;}
}
export function score(s){return s.finished?Math.round(s.water*1000+Math.max(0,LIMIT-s.time)*8):0;}
