import * as THREE from 'three';
import * as C from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = id => document.getElementById(id);
const keys = new Set();
const V = (x=0,y=0,z=0) => new C.Vec3(x,y,z);
const dayKey = new Date().toISOString().slice(0,10);
let concept='sip', day=0, running=false, paused=false, finished=false, t=0, yaw=0, pitch=0;
let water=1, falls=0, damage=0, storm=0, ice=0, knock=0, cueTime=0, cooldown=0;
let eventCounts={}, autoSeen=new Set(), receipts=[], pairs=[], props=[], bombs=[], sparks=[], bubbles=[];
let player, glassBody, glassMesh, liquid, liquidTop, liftBody, liftMesh, grab=null;
let checkpoint=V(0,1,5), progress=0, elapsed=0, accumulator=0, previous=performance.now(), wasWater=1;
let world, scene, camera, renderer, sun, ambient, rain, rainGeo, skyColor, sea, windFlags=[];
let audio=null, sound=false, dragging=false, lastGlassV=V(), glassShake=0;
const animated=[], assets=new Map(), gltfLoader=new GLTFLoader();
const material = (color, extra={}) => new THREE.MeshStandardMaterial({color,roughness:.85,flatShading:true,...extra});
const mat = { floor:material('#c6b99c'), trim:material('#f4b56d'), dark:material('#263a42'), red:material('#dc614e'), teal:material('#64a29c'), white:material('#e5dfc9'), wood:material('#947158'), blue:material('#426b83'), ice:material('#9be8e5',{roughness:.12,metalness:.3,transparent:true,opacity:.65}), skin:material('#cf9875') };
const bodyMat = new C.Material('world');
const playerMat = new C.Material('player');
const tmp = new THREE.Vector3();

function tone(freq=300,duration=.08,volume=.05){
  if(!sound)return;
  try {audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.45),audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}
}
function cue(text){$('cue').textContent=text;cueTime=2.8;}
function note(text){receipts.unshift(text);receipts=receipts.slice(0,6);$('receipts').replaceChildren();for(const line of receipts){const p=document.createElement('p');p.textContent=line;$('receipts').append(p);}}
function addBox(w,h,d,x,y,z,m=mat.floor,{mass=0,group=1,mask=-1,type,rotation}={}){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  const body=new C.Body({mass,material:bodyMat,shape:new C.Box(V(w/2,h/2,d/2)),position:V(x,y,z),collisionFilterGroup:group,collisionFilterMask:mask});
  if(type!==undefined)body.type=type;
  if(rotation){body.quaternion.setFromEuler(...rotation);mesh.quaternion.copy(body.quaternion);}
  body.linearDamping=.14;body.angularDamping=.25;world.addBody(body);pairs.push({body,mesh});return {body,mesh};
}
function visualBox(w,h,d,x,y,z,m=mat.dark,parent=scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function label(text,x,y,z,w=5,h=1,rotation=0,bg='#f0bd7b'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle='#26363e';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 80px Arial';ctx.fillText(text,512,130);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.15),[mat.dark,mat.dark,mat.dark,mat.dark,new THREE.MeshStandardMaterial({map:tex}),mat.dark]);m.position.set(x,y,z);m.rotation.y=rotation;scene.add(m);return m;
}
function stripe(x,z,w=3,dir=0){const g=new THREE.Group();for(let i=0;i<6;i++){const p=visualBox(w/6,.025,.45,-w/2+i*w/6+w/12,.04,0,i%2?mat.dark:mat.trim,g);}g.position.set(x,0,z);g.rotation.y=dir;scene.add(g);}
function physicalProp(kind,x,y,z,tag=''){
  const isFridge=kind==='fridge',isVase=kind==='vase',isChair=kind==='chair';
  const size=isFridge?[.85,1.6,.8]:isVase?[.5,.95,.5]:isChair?[.8,.95,.8]:[.7,.7,.7];
  const p=addBox(...size,x,y,z,isFridge?mat.white:isVase?mat.teal:isChair?mat.red:mat.wood,{mass:isFridge?12:isVase?2:4,group:8,mask:1|2|4|8|16});
  p.kind=kind;p.value=isVase?300:isFridge?250:isChair?180:150;p.lost=false;p.hp=1;p.tag=tag;props.push(p);
  if(isFridge){visualBox(.06,.5,.07,.29,.18,.43,mat.dark,p.mesh);visualBox(.83,.025,.02,0,.30,.41,mat.dark,p.mesh);}
  if(isVase){const neck=new THREE.Mesh(new THREE.CylinderGeometry(.14,.24,.22,8),mat.teal);neck.position.y=.53;p.mesh.add(neck);}
  if(tag){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#f3d99d';ctx.fillRect(0,0,256,128);ctx.fillStyle='#283a41';ctx.font='bold 34px Arial';ctx.textAlign='center';ctx.fillText(tag,128,78);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const placard=new THREE.Mesh(new THREE.PlaneGeometry(.65,.3),new THREE.MeshBasicMaterial({map:tx}));placard.position.set(0,.1,size[2]/2+.02);p.mesh.add(placard);}
  p.body.addEventListener('collide',e=>{if(!running||finished)return;const speed=Math.abs(e.contact.getImpactVelocityAlongNormal());if(speed>5){p.hp=Math.max(0,p.hp-(speed-5)*.015);if(isVase&&speed>8)cue('THE VASE HAS OPINIONS ABOUT THAT LANDING.');}});
  tryAsset(kind,p.mesh,size);
  return p;
}
function tryAsset(kind,parent,size){
  const modelNames={fridge:'kitchenFridge',chair:'chair',vase:'pottedPlant',crate:'cardboardBoxClosed'};
  const name=modelNames[kind];if(!name)return;
  const load=assets.get(name)||gltfLoader.loadAsync(`/assets/kenney/furniture-kit/${name}.glb`).catch(()=>null);assets.set(name,load);
  load.then(g=>{if(!g||!parent.parent)return;const m=g.scene.clone(true);const bounds=new THREE.Box3().setFromObject(m),s=bounds.getSize(new THREE.Vector3());const scale=Math.min(size[0]/s.x,size[1]/s.y,size[2]/s.z);m.scale.setScalar(scale);const box=new THREE.Box3().setFromObject(m),center=box.getCenter(new THREE.Vector3());m.position.sub(center);m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});parent.add(m);parent.material=new THREE.MeshBasicMaterial({visible:false});for(const child of [...parent.children])if(child!==m)child.visible=false;});
}
function makeGlass(){
  const radius=day?.31:.19,height=day?.22:.42;
  glassBody=new C.Body({mass:day?1.1:.6,material:bodyMat,shape:new C.Cylinder(radius,radius*.87,height,8),position:V(0,1.3,4),collisionFilterGroup:4,collisionFilterMask:1|8|16});glassBody.linearDamping=.05;glassBody.angularDamping=.5;world.addBody(glassBody);
  glassMesh=new THREE.Group();scene.add(glassMesh);
  const gmat=new THREE.MeshPhysicalMaterial({color:'#cbe9df',transparent:true,opacity:.28,roughness:.12,side:THREE.DoubleSide,depthWrite:false});
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(radius+.015,radius*.9,height+.04,10,1,true),day?mat.white:gmat);glassMesh.add(shell);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(radius+.015,.022,5,10),mat.trim);rim.rotation.x=Math.PI/2;rim.position.y=height/2+.02;glassMesh.add(rim);
  liquid=new THREE.Mesh(new THREE.CylinderGeometry(radius-.005,radius*.86,height-.04,10),material(day?'#e6a84c':'#62c3c9',{roughness:.12,transparent:true,opacity:.9}));glassMesh.add(liquid);
  liquidTop=new THREE.Mesh(new THREE.CircleGeometry(radius-.003,10),material(day?'#efd082':'#a7e9df',{side:THREE.DoubleSide,roughness:.15}));liquidTop.rotation.x=-Math.PI/2;glassMesh.add(liquidTop);
  const hands=new THREE.Group();for(const side of [-1,1]){const arm=visualBox(.12,.12,.34,.29+side*.27,-.57,-.69,mat.red,hands);arm.rotation.y=side*-.25;visualBox(.13,.11,.15,.29+side*.21,-.48,-.84,mat.skin,hands);}camera.add(hands);scene.add(camera);
}
function buildSip(){
  const route=[{x:0,z:5,w:8,d:10},{x:0,z:-6,w:3.8,d:14},{x:0,z:-16,w:8,d:8},{x:-6,z:-16,w:12,d:3.8},{x:7,z:-16,w:14,d:2.5},{x:-11,z:-29,w:4.8,d:25},{x:12,z:-26,w:2.6,d:16},{x:12,z:-39,w:2.6,d:8},{x:0,z:-45,w:27,d:7},{x:0,z:-56,w:4.6,d:17},{x:0,z:-68,w:9,d:9}];
  if(day){route[3].w=14;route[4].d=3.2;route[5].w=3.5;}
  for(const p of route){addBox(p.w,.5,p.d,p.x,-.25,p.z,mat.floor);for(const side of [-1,1])visualBox(.18,.15,p.d,p.x+side*(p.w/2-.1),.10,p.z,mat.trim);for(const sx of [-1,1])for(const sz of [-1,1])visualBox(.22,8,.22,p.x+sx*(p.w/2-.3),-4.2,p.z+sz*(p.d/2-.3),mat.dark);}
  // A broad, longer route and a narrow jump shortcut expose a real choice.
  addBox(3.4,.5,4,-11,-.25,-41,mat.trim);
  addBox(.2,2.6,5,-13.55,1.3,-28,mat.teal);addBox(4.9,.2,5,-11,2.7,-28,mat.teal);label('SHELTER / TAKE A BREATH',-11,2,-30.5,4.5,.55);
  for(let i=0;i<8;i++)stripe(0,1-i*1.1,3.3);
  stripe(-6,-16,3.2,Math.PI/2);stripe(6,-16,2.1,Math.PI/2);stripe(0,-64,4.2);
  label('ONE LAST SIP',0,3.3,-1,6.5,1.1);label('LONG & SLIPPERY',-6,2.5,-18.1,5,.7);label('SHORT & STUPID',7,2.5,-17.6,5,.7);
  label('THIS IS THE FINISH. PROBABLY.',0,3.6,-68,9,1);for(const side of [-1,1])visualBox(.22,4,.22,side*4.4,2,-68,mat.red);
  for(let i=0;i<10;i++)visualBox(.85,.02,.7,-4.2+i*.85,.02,-65.5,i%2?mat.white:mat.dark);
  for(const [x,z] of [[-2.7,-10],[-13.7,-26],[13.9,-27],[-3.4,-59]]){visualBox(.12,3,.12,x,1.5,z,mat.dark);const flag=visualBox(1,.5,.05,x+.5,2.7,z,mat.red);windFlags.push(flag);}
  physicalProp('chair',1.8,1,-15,'CHAT');physicalProp('crate',-1.7,1,-15,'FRAGILE');
  for(let i=0;i<8;i++){const x=(i%2?-1:1)*(22+(i%3)*9),z=15-i*14;addBox(9,12+i%3*5,9,x,-4,z,i%2?mat.teal:mat.dark);visualBox(10,.3,10,x,2+i%3*2.5,z,mat.red);}
  makeGlass();
}
function buildLift(){
  liftBody=addBox(6,.45,6,0,-.2,0,mat.floor,{type:C.Body.KINEMATIC}).body;liftMesh=pairs.find(p=>p.body===liftBody).mesh;
  for(const side of [-1,1]){liftBody.addShape(new C.Box(V(.12,.22,3)),V(side*2.9,.43,0));visualBox(.24,.44,6,side*2.9,.43,0,mat.trim,liftMesh);}
  liftBody.addShape(new C.Box(V(3,.22,.12)),V(0,.43,-2.9));visualBox(6,.44,.24,0,.43,-2.9,mat.trim,liftMesh);
  // The floor moves; objects and the player are genuinely dynamic bodies.
  for(const side of [-1,1]){addBox(.25,28,.25,side*3.35,9,-3.35,mat.trim);addBox(.25,28,.25,side*3.35,9,3.35,mat.trim);}
  for(let y=0;y<24;y+=4){visualBox(9,.2,.25,0,y,-4.2,mat.dark);label('FLOOR '+Math.round(y/4+1),0,y+1.7,-4.4,3,.65);}
  visualBox(12,30,.4,0,10,-5,mat.teal);visualBox(.4,30,12,-5,10,0,mat.dark);visualBox(.4,30,12,5,10,0,mat.dark);
  for(let i=0;i<8;i++)visualBox(.4,.25,2.8,-4.7,1+i*3,-1,mat.trim);
  const manifest=day?['fridge','vase','chair','crate','vase']:['vase','chair','crate','fridge','crate'];
  manifest.forEach((kind,i)=>physicalProp(kind,(i%3-1)*1.35,1.2+Math.floor(i/3)*1.4,-1.2+Math.floor(i/3)*1.3,['VIP','DO NOT DROP','CHAT','VERY HEAVY','RECEIPTS'][i]));
  checkpoint=V(0,1.1,2.1);
}
function init(){
  running=false;paused=false;finished=false;t=0;water=1;falls=0;damage=0;storm=0;ice=0;knock=0;cueTime=0;cooldown=0;progress=0;grab=null;
  eventCounts={bomb:0,storm:0,ice:0,crate:0};autoSeen=new Set();receipts=[];pairs=[];props=[];bombs=[];sparks=[];bubbles=[];windFlags=[];lastGlassV=V();glassShake=0;wasWater=1;
  world=new C.World({gravity:V(0,-15,0),allowSleep:true});world.broadphase=new C.SAPBroadphase(world);world.solver.iterations=10;world.defaultContactMaterial.friction=.5;world.defaultContactMaterial.restitution=.08;world.addContactMaterial(new C.ContactMaterial(playerMat,bodyMat,{friction:0,restitution:0}));
  scene=new THREE.Scene();skyColor=new THREE.Color(day?'#364351':'#6d8b91');scene.background=skyColor.clone();scene.fog=new THREE.Fog(skyColor,28,110);
  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.06,180);camera.rotation.order='YXZ';
  ambient=new THREE.HemisphereLight('#e7d8b7','#314956',2.0);scene.add(ambient);sun=new THREE.DirectionalLight('#ffd2a0',2.4);sun.position.set(-20,30,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=50;sun.shadow.camera.bottom=-60;sun.shadow.camera.far=130;sun.shadow.normalBias=.04;sun.target.position.set(0,0,-25);scene.add(sun,sun.target);
  sea=new THREE.Mesh(new THREE.PlaneGeometry(350,350),material('#3b6976',{roughness:.3,metalness:.1}));sea.rotation.x=-Math.PI/2;sea.position.y=-10;scene.add(sea);
  if(concept==='sip'){checkpoint=V(0,1,5);buildSip();}else buildLift();
  player=new C.Body({mass:65,material:playerMat,shape:new C.Sphere(.38),fixedRotation:true,allowSleep:false,position:checkpoint.clone(),collisionFilterGroup:2,collisionFilterMask:1|8|16});player.linearDamping=.01;world.addBody(player);
  const rainPositions=new Float32Array(450*3);for(let i=0;i<450;i++){rainPositions[i*3]=(Math.random()-.5)*70;rainPositions[i*3+1]=Math.random()*25;rainPositions[i*3+2]=(Math.random()-.5)*90-20;}rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:'#c4e6e5',size:.065,transparent:true,opacity:.7}));rain.visible=false;scene.add(rain);
  yaw=0;pitch=0;accumulator=0;keys.clear();document.body.classList.remove('running');$('result').hidden=true;$('paused').hidden=true;$('hud').hidden=true;$('crosshair').hidden=true;$('pause').hidden=true;$('cue').textContent='';$('ground-state').textContent='';
  $('premise').textContent=concept==='sip'?'A daily rooftop dash with one vulnerable glass. Bombs move you and the glass. Ice changes your grip. Storms change your plan. Try both routes.':'A tiny moving elevator, five awkward objects, and forty-five seconds of regret. Push or grab the valuables back aboard. Save the vase. The furniture can wait.';
  $('day-label').textContent=`${dayKey} / DAY ${day?'B':'A'} / ${concept==='sip'?(day?'THE SOUP SHIFT':'STORM WARNING'):(day?'HEAVY COMPANY':'GOING UP')}`;
  $('metric-label').textContent=concept==='sip'?(day?'SOUP KEPT':'WATER KEPT'):'CARGO ABOARD';$('objective').textContent=concept==='sip'?'ONE LAST SIP':'HOLD THE LIFT';$('time').textContent=concept==='sip'?'65.0':'45.0';$('primary').textContent=concept==='sip'?'100%':'5 / 5';$('progress').textContent='LOOK AROUND, THEN START';note('All intervention inputs are local simulations.');
}
function start(){init();running=true;document.body.classList.add('running');$('hud').hidden=false;$('crosshair').hidden=false;$('pause').hidden=false;cue(concept==='sip'?'ONE GLASS. TWO ROUTES. TERRIBLE COMPANY.':'KEEP THE VALUABLES INSIDE THE YELLOW LINE.');if(glassBody){glassBody.position.copy(player.position);glassBody.position.y+=.65;glassBody.position.z-=.8;}tone(500,.12);}
function spawnBomb(){
  if(bombs.length>=2){note('Bomb capacity reached. Next request waits for a clear blast.');return false;}
  const forward=V(Math.sin(yaw),0,-Math.cos(yaw));const pos=player.position.vadd(forward.scale(3.2));pos.y+=3.5;
  const body=new C.Body({mass:2,shape:new C.Sphere(.27),material:bodyMat,position:pos,collisionFilterGroup:16,collisionFilterMask:1|2|4|8|16});body.velocity.set(-forward.x*1.4,-1,-forward.z*1.4);body.linearDamping=.02;world.addBody(body);
  const mesh=new THREE.Group();const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(.29,1),mat.red);mesh.add(shell);const fuse=visualBox(.055,.25,.055,0,.37,0,mat.trim,mesh);scene.add(mesh);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.8,2.9,32),new THREE.MeshBasicMaterial({color:'#ff8061',transparent:true,opacity:.55,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;scene.add(ring);
  bombs.push({body,mesh,ring,fuse:1.8});cue('A PRESENT FROM CHAT. 1.8 SECOND FUSE.');tone(700,.04);return true;
}
function trigger(type,source='SIMULATED VIEWER'){
  if(!running||paused||finished){note('Start or resume a run to test an intervention.');return;}
  if(cooldown>0&&source!=='DAILY SCRIPT'){note('Let the current surprise land. Intervention cooldown is 1.2s.');return;}
  if(type==='bomb'&&!spawnBomb())return;
  if(type==='storm'){storm=Math.min(14,Math.max(storm,9));cue('CHAT HAS CANCELLED THE GOOD WEATHER.');}
  if(type==='ice'){ice=Math.min(12,Math.max(ice,8));cue('GOOD NEWS: THE FLOOR IS CLEAN. BAD NEWS: ICE.');}
  if(type==='crate'){const x=player.position.x+Math.sin(yaw)*2,z=player.position.z-Math.cos(yaw)*2;physicalProp('fridge',x,player.position.y+5,z,'FROM CHAT');cue('WHO ORDERED THE REFRIGERATOR?');}
  eventCounts[type]++;cooldown=1.2;note(`${source} → ${type.toUpperCase()} · ${t.toFixed(1)}s`);tone(type==='storm'?120:380,.14);
}
function explode(bomb){
  const origin=bomb.body.position.clone();
  for(const body of world.bodies){if(body.mass<=0||body===bomb.body)continue;const delta=body.position.vsub(origin),distance=delta.length();if(distance>6.5)continue;delta.y=Math.max(.7,delta.y+1.2);delta.normalize();const force=Math.max(0,1-distance/6.5);const scale=body===player?640:body===glassBody?12:Math.min(90,body.mass*14);body.applyImpulse(delta.scale(scale*force*(concept==='lift'?.35:1)));body.wakeUp();if(body===player){knock=1.1;damage+=force;cue('YOU CAN STILL SAVE THIS.');}if(body===glassBody){body.angularVelocity.x+=3*force;body.angularVelocity.z+=2*force;glassShake+=force*3;}}
  const flash=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,1),new THREE.MeshBasicMaterial({color:'#ffd585',transparent:true,opacity:.95}));flash.position.copy(origin);scene.add(flash);sparks.push({mesh:flash,life:.45,burst:true});
  for(let i=0;i<22;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.13,.13,.13),i%2?mat.red:mat.trim);m.position.copy(origin);scene.add(m);const a=i*2.4;sparks.push({mesh:m,life:1.1,velocity:new THREE.Vector3(Math.cos(a)*4,2+(i%5),Math.sin(a)*4)});}
  world.removeBody(bomb.body);scene.remove(bomb.mesh,bomb.ring);tone(85,.5,.18);
}
function groundHeight(){
  const from=player.position.clone(),to=player.position.clone();to.y-=.53;const result=new C.RaycastResult();world.raycastClosest(from,to,{collisionFilterMask:1|8,skipBackfaces:true},result);return result.hasHit;
}
function grabToggle(){
  const nearbyBomb=bombs.find(b=>b.body.position.distanceTo(player.position)<3&&b.fuse>.15);
  if(nearbyBomb){nearbyBomb.body.applyImpulse(V(Math.sin(yaw)*15,7,-Math.cos(yaw)*15));nearbyBomb.body.wakeUp();cue('RETURN TO SENDER. NICE SAVE.');tone(650,.1);return;}
  if(grab){grab=null;cue('LET IT GO. WITH INTENT.');return;}
  const forward=V(Math.sin(yaw),0,-Math.cos(yaw));let closest=null,best=3;
  for(const p of props){if(p.lost)continue;const d=p.body.position.vsub(player.position);const len=d.length();if(len<best&&d.dot(forward)>-.2){closest=p;best=len;}}
  if(closest){grab=closest;closest.body.wakeUp();cue('F TO RELEASE. THE GRIP IS A SPRING, NOT A FORCE FIELD.');}else cue('GET CLOSER TO SOMETHING YOU REGRET OWNING.');
}
function physicsStep(dt){
  t+=dt;storm=Math.max(0,storm-dt);ice=Math.max(0,ice-dt);knock=Math.max(0,knock-dt);cooldown=Math.max(0,cooldown-dt);glassShake*=Math.exp(-dt*2.8);
  const brace=keys.has('ShiftLeft')||keys.has('ShiftRight');const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);const strafe=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
  const length=Math.max(1,Math.hypot(forward,strafe)),speed=brace?2.2:4.5;
  const vx=(Math.sin(yaw)*forward+Math.cos(yaw)*strafe)*speed/length,vz=(-Math.cos(yaw)*forward+Math.sin(yaw)*strafe)*speed/length;
  const grounded=groundHeight();const traction=(ice>0?(brace?2.7:1.1):(brace?12:9))*(grounded?1:.22)*(knock>0?.13:1);
  player.velocity.x+=(vx-player.velocity.x)*Math.min(1,traction*dt);player.velocity.z+=(vz-player.velocity.z)*Math.min(1,traction*dt);
  if(keys.has('Space')&&grounded&&player.velocity.y<1){player.velocity.y=6.3;keys.delete('Space');tone(330,.08);}
  if(keys.has('ArrowLeft'))yaw-=dt*1.5;if(keys.has('ArrowRight'))yaw+=dt*1.5;
  if(storm>0){const sheltered=concept==='sip'&&player.position.x<-9&&player.position.z>-31&&player.position.z<-25;const gust=(Math.sin(t*2.1)*.7+Math.sin(t*.71)*.5)*(sheltered?.15:1);player.velocity.x+=(brace?.8:2.5)*gust*dt;for(const p of props)if(!p.lost)p.body.applyForce(V(14*gust,0,Math.cos(t)*7));}
  if(concept==='lift'){
    const base=t*.27;liftBody.position.y=base;liftBody.velocity.y=.27;liftBody.quaternion.setFromEuler(Math.sin(t*1.3)*(storm>0?.1:.035),0,Math.sin(t*.8)*(storm>0?.13:.025));liftBody.angularVelocity.set(Math.cos(t*1.3)*.04,0,Math.cos(t*.8)*.03);
    progress=Math.min(1,t/45);checkpoint.set(0,base+1.1,2.1);
    for(const p of props)if(!p.lost&&(p.body.position.y<base-3||Math.abs(p.body.position.x)>8||Math.abs(p.body.position.z)>8)){p.lost=true;cue(`${p.tag||p.kind.toUpperCase()} HAS LEFT THE ELEVATOR.`);tone(130,.3);}
  }else{
    progress=Math.max(progress,THREE.MathUtils.clamp((5-player.position.z)/71,0,1));
    if(player.position.z<-13&&player.position.z>-19&&Math.abs(player.position.x)<4)checkpoint.set(0,1,-15);
    if(player.position.z<-43&&player.position.z>-47)checkpoint.set(player.position.x<0?-7:7,1,-45);
    camera.position.set(player.position.x,player.position.y+.95,player.position.z);camera.rotation.set(-pitch,-yaw,0,'YXZ');camera.updateMatrixWorld();
    const target=new THREE.Vector3(.29,-.42,-.85).applyMatrix4(camera.matrixWorld);const d=V(target.x-glassBody.position.x,target.y-glassBody.position.y,target.z-glassBody.position.z);
    const relative=glassBody.velocity.vsub(player.velocity);let f=d.scale(brace?135:85).vsub(relative.scale(brace?13:9));if(f.length()>100)f=f.scale(100/f.length());glassBody.applyForce(f);glassBody.applyForce(V(0,glassBody.mass*15,0));
    const e=V();glassBody.quaternion.toEuler(e,'YZX');glassBody.torque.x+=-e.x*4-glassBody.angularVelocity.x*1.5;glassBody.torque.z+=-e.z*4-glassBody.angularVelocity.z*1.5;glassBody.angularVelocity.y*=.95;
    const acceleration=glassBody.velocity.vsub(lastGlassV).length()/dt;lastGlassV.copy(glassBody.velocity);const tilt=Math.hypot(e.x,e.z);const agitation=Math.max(0,tilt-((day?.15:.27)+(1-water)*(day?.30:.45)))*.22+Math.max(0,acceleration-13)*(brace?.0009:.0018)+glassShake*.04;
    water=Math.max(.005,water-agitation*dt); // A last visible sip survives; finish still records its actual volume.
    if(storm>0)glassBody.applyForce(V(Math.sin(t*2)*1.2,0,Math.cos(t)*.8));
  }
  if(grab){const target=player.position.vadd(V(Math.sin(yaw)*1.5,.9,-Math.cos(yaw)*1.5));const d=target.vsub(grab.body.position),f=d.scale(80).vsub(grab.body.velocity.scale(9));if(f.length()>120)f.scale(120/f.length(),f);grab.body.applyForce(f);grab.body.wakeUp();if(d.length()>4){grab=null;cue('YOUR GRIP LOST THE ARGUMENT.');}}
  if(player.position.y<(concept==='lift'?liftBody.position.y-4:-5)){
    falls++;player.position.copy(checkpoint);player.velocity.setZero();knock=0;water=Math.max(.005,water-.16);if(glassBody){glassBody.position.copy(checkpoint);glassBody.position.y+=.6;glassBody.velocity.setZero();glassBody.angularVelocity.setZero();glassBody.quaternion.set(0,0,0,1);}cue('THAT WAS A FALL. THE LAST SIP GETS ANOTHER CHANCE.');tone(140,.3);grab=null;
  }
  if($('auto').checked){const stages=concept==='sip'?(day?[['ice',player.position.z<-3],['crate',player.position.z<-15],['bomb',player.position.z<-29],['storm',player.position.z<-46]]:[['storm',player.position.z<-3],['bomb',player.position.z<-15],['ice',player.position.z<-29],['crate',player.position.z<-46]]):[['bomb',t>7],['storm',t>17],['ice',t>26],['crate',t>34]];for(const [kind,condition]of stages)if(condition&&!autoSeen.has(kind)){autoSeen.add(kind);trigger(kind,'DAILY SCRIPT');break;}}
  for(let i=bombs.length-1;i>=0;i--){const b=bombs[i];b.fuse-=dt;if(b.fuse<=0){explode(b);bombs.splice(i,1);}}
  world.step(dt);
  if((concept==='sip'&&player.position.z<-65.8&&Math.abs(player.position.x)<4.8)||(concept==='lift'&&t>=45))finish(true);
  else if(t>65&&concept==='sip')finish(false);
}
function finish(success){
  finished=true;running=false;$('result').hidden=false;$('pause').hidden=true;
  const kept=props.filter(p=>!p.lost&&p.body.position.y>(liftBody?.position.y??0)-1.5).length;
  const value=concept==='sip'?Math.round(water*1000+Math.max(0,65-t)*7):Math.round(props.filter(p=>!p.lost).reduce((sum,p)=>sum+p.value*p.hp,0));
  $('result-label').textContent=`DAY ${day?'B':'A'} / ${concept==='sip'?'ONE LAST SIP':'HOLD THE LIFT'} / LOCAL CHAOS RUN`;
  $('result-title').textContent=concept==='sip'?(success?(water>.6?'Still a glass act.':water>.15?'Still technically water.':'One. Last. Sip.'):'The clock drank first.'):(kept>=4?'An uplifting disaster.':kept>=2?'Some things made it.':'A very empty elevator.');
  $('result-text').textContent=concept==='sip'?`${success?'You reached the finish.':'You ran out of time.'} ${eventCounts.bomb} bomb(s), ${eventCounts.storm} storm(s), ${eventCounts.ice} ice event(s), ${eventCounts.crate} fridge(s). This score includes their consequences.`:`${kept} of ${props.length} objects stayed aboard. The storm and blasts affected real physics bodies. Each saved object contributes its remaining condition.`;
  const stats=concept==='sip'?[[Math.round(water*100)+'%','WATER KEPT'],[t.toFixed(1)+'s','RUN TIME'],[value,'POINTS'],[falls,'FALLS']]:[[kept+' / '+props.length,'CARGO SAVED'],[value,'VALUE KEPT'],[eventCounts.bomb,'BOMBS'],[falls,'FALLS']];
  $('result-stats').replaceChildren();for(const [v,label]of stats){const div=document.createElement('div'),b=document.createElement('b'),span=document.createElement('span');b.textContent=v;span.textContent=label;div.append(b,span);$('result-stats').append(div);}
  tone(success?600:150,.3);keys.clear();
}
function render(dt){
  for(const p of pairs){p.mesh.position.copy(p.body.position);p.mesh.quaternion.copy(p.body.quaternion);}
  for(const b of bombs){b.mesh.position.copy(b.body.position);b.mesh.quaternion.copy(b.body.quaternion);b.mesh.scale.setScalar(1+Math.sin(elapsed*25)*.12);b.ring.position.set(b.body.position.x,concept==='lift'?liftBody.position.y+.1:.08,b.body.position.z);b.ring.scale.setScalar(.8+Math.sin(elapsed*9)*.1);}
  for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.life-=dt;if(p.burst){p.mesh.scale.setScalar(1+(1-p.life/.45)*9);p.mesh.material.opacity=Math.max(0,p.life/.45);}else if(p.velocity){p.velocity.y-=dt*8;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=dt*4;}if(p.life<=0){scene.remove(p.mesh);sparks.splice(i,1);}}
  if(glassBody){glassMesh.position.copy(glassBody.position);glassMesh.quaternion.copy(glassBody.quaternion);liquid.scale.y=Math.max(.02,water);liquid.position.y=(day?-.09:-.19)+(day?.09:.19)*water;liquidTop.position.y=(day?-.09:-.19)+(day?.18:.38)*water;liquidTop.quaternion.copy(glassMesh.quaternion).invert();const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0));liquidTop.quaternion.multiply(q);
    if(running&&wasWater-water>.00008){const d=new THREE.Mesh(new THREE.BoxGeometry(.04,.065,.04),mat.teal);d.position.copy(glassMesh.position);d.position.y+=.15;scene.add(d);sparks.push({mesh:d,life:.7,velocity:new THREE.Vector3((Math.random()-.5)*2,.8,(Math.random()-.5)*2)});}wasWater=water;
  }
  rain.visible=storm>0;if(rain.visible){const a=rainGeo.attributes.position;for(let i=0;i<a.count;i++){a.array[i*3]+=.8*dt;a.array[i*3+1]-=20*dt;if(a.array[i*3+1]<-2)a.array[i*3+1]=22;}a.needsUpdate=true;}
  const targetColor=storm>0?new THREE.Color('#344555'):skyColor;scene.background.lerp(targetColor,dt*2);scene.fog.color.copy(scene.background);sun.intensity=THREE.MathUtils.lerp(sun.intensity,storm>0?.65:2.4,dt*2);windFlags.forEach((f,i)=>{f.rotation.y=Math.sin(elapsed*(storm>0?12:2)+i)*(storm>0?.9:.12);});
  for(const p of pairs)if(p.body.type===C.Body.STATIC&&p.mesh.geometry.parameters.height<=.5){p.mesh.material=ice>0?mat.ice:mat.floor;}
  if(running||paused||finished){camera.position.set(player.position.x,player.position.y+.95,player.position.z);camera.rotation.set(-pitch,-yaw,Math.sin(elapsed*20)*Math.min(.045,knock*.04),'YXZ');}
  else {camera.position.set(concept==='sip'?18:7,concept==='sip'?12:7,concept==='sip'?12:10);camera.lookAt(concept==='sip'?new THREE.Vector3(0,0,-25):new THREE.Vector3(0,1,0));}
  $('primary').textContent=concept==='sip'?Math.round(water*100)+'%':props.filter(p=>!p.lost).length+' / '+props.length;$('time').textContent=Math.max(0,(concept==='sip'?65:45)-t).toFixed(1);
  $('status').textContent=knock>0?'KNOCKED BACK / YOU CAN STILL RECOVER':ice>0?'ICE / MOMENTUM WILL NOT FORGIVE YOU':storm>0?'STORM / BRACE OR USE THE SHELTER':'A MOMENT TO BREATHE. SUSPICIOUS.';
  $('ground-state').textContent=grab?'HOLDING '+(grab.tag||grab.kind).toUpperCase()+' / F TO RELEASE':ice>0?'SLIPPERY / SHIFT TO BRACE':concept==='lift'&&running?'F TO GRAB / PUSH ITEMS INSIDE THE YELLOW LINE':'';
  $('progress').textContent=running?`${Math.round(progress*100)}% / ${falls} FALLS / ${Object.values(eventCounts).reduce((a,b)=>a+b,0)} INTERVENTIONS`:'LOCAL COMPARISON / REAL PHYSICS / SIMULATED EVENTS';
  cueTime=Math.max(0,cueTime-dt);$('cue').style.opacity=cueTime>0?'1':'0';renderer.render(scene,camera);
}
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.08,(now-previous)/1000);previous=now;elapsed+=dt;if(running&&!paused){accumulator+=dt;while(accumulator>=1/90&&!finished){physicsStep(1/90);accumulator-=1/90;}}render(paused?0:dt);}

renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
$('start').onclick=$('retry').onclick=start;$('restart').onclick=()=>{if(running||finished)start();else init();};$('compare').onclick=init;
document.querySelectorAll('[data-concept]').forEach(b=>b.onclick=()=>{concept=b.dataset.concept;document.querySelectorAll('[data-concept]').forEach(x=>x.classList.toggle('active',x===b));glassBody=null;liftBody=null;init();});
function changeDay(d){day=d;$('today').classList.toggle('active',!day);$('tomorrow').classList.toggle('active',!!day);glassBody=null;liftBody=null;init();}$('today').onclick=()=>changeDay(0);$('tomorrow').onclick=()=>changeDay(1);
document.querySelectorAll('[data-effect]').forEach(b=>b.onclick=()=>trigger(b.dataset.effect));
function pause(){if(!running)return;paused=!paused;keys.clear();$('paused').hidden=!paused;}$('pause').onclick=pause;$('resume').onclick=pause;
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'SOUND ON':'SOUND OFF';tone(440,.1);};
window.addEventListener('keydown',e=>{if(!running)return;if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause();return;}if(paused)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','KeyF','KeyR'].includes(e.code))e.preventDefault();if(e.code==='KeyR'&&!e.repeat){start();return;}if((e.code==='KeyQ'||e.code==='KeyE')&&!e.repeat){yaw+=(e.code==='KeyE'?1:-1)*Math.PI/2;return;}if(e.code==='KeyF'&&!e.repeat){grabToggle();return;}keys.add(e.code);});window.addEventListener('keyup',e=>keys.delete(e.code));
$('scene').addEventListener('pointerdown',e=>{dragging=true;$('scene').setPointerCapture(e.pointerId);});$('scene').addEventListener('pointerup',()=>dragging=false);$('scene').addEventListener('pointercancel',()=>dragging=false);$('scene').addEventListener('pointermove',e=>{if(dragging&&running&&!paused){yaw+=e.movementX*.004;pitch=THREE.MathUtils.clamp(pitch+e.movementY*.002,-.8,.8);}});
window.addEventListener('blur',()=>{keys.clear();if(running&&!paused)pause();});window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.mechanicLab={observe:()=>({concept,day,running,paused,finished,time:t,water,falls,progress,storm,ice,events:{...eventCounts},player:{x:player.position.x,y:player.position.y,z:player.position.z,vx:player.velocity.x,vy:player.velocity.y,vz:player.velocity.z,grounded:groundHeight()},glass:glassBody?{x:glassBody.position.x,y:glassBody.position.y,z:glassBody.position.z}:null,cargo:props.map(p=>({kind:p.kind,lost:p.lost,hp:p.hp,position:{x:p.body.position.x,y:p.body.position.y,z:p.body.position.z}}))})};
init();$('load').hidden=true;requestAnimationFrame(loop);
