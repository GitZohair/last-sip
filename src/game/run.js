import * as THREE from 'three';
import { buildIsland } from './island.js';
import { createTray } from './tray.js';
import { createShift, BAR } from './shift.js';
import { BOAT } from './island.js';
import { createConductor, COST } from './conductor.js';
import { createGlass, createSplash } from './glass.js';
import { createChaos } from './chaos.js';
import { createGallery } from './gallery.js';
import { createProps } from './props.js';
import { createMods } from './mods.js';
import { createCharacter } from './character.js';
import { dress, personalize } from './clutter.js';
import { Ledger } from './ledger.js';
import { draw, byId } from './deck.js';
import { rng } from './rng.js';
import { createHazards } from './hazards.js';
import { createStyle } from './style.js';
import { sfx } from './sfx.js';
import { createPrompts } from './prompts.js';
import { createActors, ballMat, lifebuoy } from './actors.js';
import { model, preload } from './assets.js';
import { todaysRule, createWind } from './rules.js';
import { createGuide } from './guide.js';
import { createDrops, FURNITURE } from './drops.js';

export const LIMIT = 90;
const LEGACY = { storm: 'gust', crate: 'fridge', ice: 'mop', quake: 'bass', calm: 'steady', bomb: 'bomb', lights: 'lights' };

// One run (practice or the daily POUR). Owns the scene contents; main.js owns renderer, UI and Twitch.
export async function createRun(world, player, { seed, profile, hooks, voice }) {
  const scene = world.reset();
  const level = await buildIsland(scene);
  const props = createProps(scene, level.colliders);
  const deco = await dress(scene, level, props, rng(seed + ':clutter'));
  personalize(scene, profile);
  const avatar = await createCharacter(scene);
  const glass = createTray(avatar.holder); // the tray of drinks (same interface as one glass)
  const shift = await createShift(scene, seed, glass);
  const mods = createMods();
  const houseRng = rng(seed + ':house');
  const chaos = createChaos({ scene, level, player, glass, props });
  const gallery = createGallery(scene, level.slots);
  const ledger = new Ledger();
  const splash = createSplash(scene, (x, z) => Math.random() < .25 && chaos.puddle(x, z, .25));
  const hazards = await createHazards(scene, level, rng(seed + ':hazards'), level.spawn, props);
  const style = createStyle();
  const prompts = createPrompts(scene, hazards);
  const actors = createActors(scene, level, sfx);
  const rule = todaysRule(seed), wind = createWind(scene, seed, rule === 'windy'); // always present: SEA BREEZE cards use it too
  hazards.vacuum.hungry = rule === 'hungry'; hazards.vacuum.enabled = rule === 'hungry'; // only on LOOSE CANNON days, and it naps after every hit
  const guide = createGuide(scene, { shift, actors, level });
  const drops = createDrops(scene, level, { sfx, onImpact: (d, dist) => { gallery.shake(1); if (dist < 6) run.shakeT = .35; } });
  // where to drop: on the route a few metres ahead of the streamer (so it lands in their way, telegraphed)
  // Spaced 2.4 m from other drops and alternating sides, so the boards never get fully blocked (always a squeeze-past gap).
  function ahead(d) { return { x: player.pos.x + Math.sin(player.yaw) * d, z: player.pos.z - Math.cos(player.yaw) * d }; }
  let dropSide = 1;
  const dropSpot = (k = 0) => {
    const g = guide.goal(player.pos) || ahead(6), dx = g.x - player.pos.x, dz = g.z - player.pos.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    const lead = Math.hypot(player.vel.x, player.vel.z) * 1.25; // aim where you'll BE when it lands: read the shadow, brake or sidestep
    let a = Math.max(1.8, lead + .4) + k * 2.4, x, z; dropSide = -dropSide;
    for (let tries = 0; tries < 6; tries++, a += 2.4) { x = player.pos.x + ux * a - uz * .35 * dropSide; z = player.pos.z + uz * a + ux * .35 * dropSide; if (!drops.list.some(o => Math.hypot(o.x - x, o.z - z) < 2.4)) break; }
    return { x, z };
  };
  // barrels: a point ON THE PLANKS 6-13 m ahead along the route; it rolls back along that same board axis
  const onBoards = (x, z) => level.colliders.some(c => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ && c.top <= .1 && c.top > -.5);
  const barrelSpot = () => {
    const g = guide.goal(player.pos) || ahead(6); let dx = g.x - player.pos.x, dz = g.z - player.pos.z;
    if (Math.abs(dx) > Math.abs(dz)) { dx = Math.sign(dx); dz = 0; } else { dz = Math.sign(dz) || -1; dx = 0; }
    for (let a = 13; a >= 6; a -= .5) { const x = dz ? (Math.abs(player.pos.x) < 1.2 ? 0 : player.pos.x) : player.pos.x + dx * a, z = dx ? player.pos.z : player.pos.z + dz * a; if (onBoards(x, z)) return { x, z, dir: { x: -dx, z: -dz } }; }
    return null;
  };
  const spawnActor = (kind, user) => actors.spawn(kind, user, player, kind === 'barrel' ? { spot: barrelSpot() } : {});
  const conductor = createConductor(); // every threat asks the conductor first (budget, spacing, breathers)
  const worn = lifebuoy(); worn.scale.setScalar(.85); worn.position.y = .62; worn.visible = false; avatar.root.add(worn); // lifeguard's gift
  player.reset(level.spawn);
  const run = { conductor, drops, shakeT: 0, rule, wind, guide, actors, shift, hazards, style, sprintClean: 0, legendT: -9, level, glass, chaos, gallery, props, mods, ledger, avatar, t: 0, state: 'play', duck: false, lastSip: false, saves: 0, catchWin: 0, lastChat: -9, houseNext: 10, roomLoss: Object.fromEntries(level.rooms.map(r => [r.key, 0])) };
  // Pre-warm: compile every shader chat can spawn later (sniper ball, laser, name tags, puddles, fridge,
  // flashes) during the loading screen, so the first snipe of a run doesn't hitch.
  await preload([['pirate', 'cannon'], ['pirate', 'barrel'], ...FURNITURE.map(([n]) => ['furniture', n])]);
  {
    const temp = new THREE.Group(), geo = new THREE.SphereGeometry(.1, 6, 4); scene.add(temp);
    temp.add(new THREE.Mesh(geo, ballMat), new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true })), new THREE.Mesh(geo, new THREE.MeshStandardMaterial()), await model('furniture', 'kitchenFridge'));
    await actors.spawn('sniper', 'warm', player); await actors.spawn('barrel', 'warm', player, { spot: { x: 0, z: 0, dir: { x: 0, z: 1 } } });
    for (const a of actors.list) if (a.line) a.line.visible = true;
    chaos.puddle(0, 999, .1, .01);
    hazards.vacuum.mesh.visible = true; // compile its shaders now even though it's hidden until it wakes
    try { await world.renderer.compileAsync(scene, world.camera); } catch { world.renderer.compile(scene, world.camera); }
    hazards.vacuum.mesh.visible = false;
    actors.clear(); chaos.clearPuddles(); scene.remove(temp); geo.dispose();
  }
  chaos.onBlast = f => { sfx.boom(); gallery.shake(1.4); if (f > .3) hooks.clip?.('bomb'); };

  const api = {
    fire: type => type === 'storm' ? wind.gust(3.2) : type === 'crate' ? (() => { const p = dropSpot(); drops.furniture(api.user || 'CHAT', p.x, p.z, FURNITURE[0]); })() : chaos.fire(type),
    rain: n => { for (let i = 0; i < Math.min(n, 3); i++) setTimeout(() => { const p = dropSpot(i % 3); drops.furniture(api.user || 'CHAT', p.x, p.z); }, i * 450); },
    mod: (n, s) => mods.set(n, s),
    refill: f => glass.refill(f),
    clearPuddles: () => chaos.clearPuddles(),
    spawnAhead(kind, n, { spread = 2, drop = false, toward = 0, life } = {}) {
      const p = ahead(toward || 3);
      for (let i = 0; i < n; i++) {
        const x = p.x + (Math.random() - .5) * spread, z = p.z + (Math.random() - .5) * spread;
        const v = toward ? { x: (player.pos.x - x) * .9, z: (player.pos.z - z) * .9, y: 1 } : { y: 0 };
        setTimeout(() => props.spawn(kind, x, drop ? 2.4 + Math.random() * 1.5 : .3, z, { ...v, life }), i * 40);
      }
    },
  };

  // Play a card from chat. eventName may be a card id, a legacy event name, or 'deck' (random draw).
  // viewer characters spawn by name; the card system handles everything else
  run.summon = (kind, user, src = 'chat') => {
    if (run.state !== 'play') return false;
    const fire = kind === 'drop' ? () => { const p = dropSpot(); drops.furniture(user, p.x, p.z); } : () => spawnActor(kind, user);
    if (kind === 'lifeguard') fire(); else conductor.request(kind, user, src, fire);
    if (src !== 'house') run.lastChat = run.t; return true;
  };
  run.dropFrame = async ({ user, image, trusted }) => { if (run.state !== 'play') return { ok: false, reason: 'not playing' }; const p = dropSpot(); const d = await drops.frame(user, p.x, p.z, image, trusted); run.lastChat = run.t; return d ? { ok: true } : { ok: false, reason: 'image rejected' }; };
  run.play = (eventName, users, { bias = 0 } = {}) => {
    if (run.state !== 'play') return null;
    const card = eventName === 'deck' ? draw(Math.random, { bias }) : byId(LEGACY[eventName] || eventName);
    if (!card) return null;
    api.user = users[0]; card.apply(api);
    if (users[0] !== 'THE HOUSE') run.lastChat = run.t;
    if (!card.help) ledger.blame(users, card.label, card.id === 'mop' ? 8 : 4, run.t);
    else avatar.emote('ThumbsUp', .9);
    if (card.r === 'l' && !card.help) run.legendT = run.t;
    return card;
  };

  const trick = id => { const g = style.add(id); if (g) { hooks.trick?.(style.last); sfx.pop(style.combo); } };
  // FALLING IN: splash, the drink gets SALTIER (score drops), and you have to SWIM (slow, no hopping) to a beach
  // or one of the plank ramps to climb back up. A viewer's lifebuoy skips all that. Very clippable.
  const SWIM_Y = -2.2, SEA = new THREE.Color('#5d8f7c');
  run.safe = { x: level.spawn.x, z: level.spawn.z }; run.falls = 0; run.salt = 0; run.swimming = false; run.climb = null;
  const fall = (room) => {
    splash.emit({ x: player.pos.x, y: SWIM_Y + .4, z: player.pos.z }, { x: 0, z: 0 }, 30); sfx.splash(); gallery.shake(.6);
    if (run.buoy) { // a viewer's lifebuoy: free fall, straight back on the boards
      hooks.rescued?.(run.buoy); run.buoy = null; worn.visible = false; player.reset({ x: run.safe.x, z: run.safe.z, yaw: player.yaw }); return;
    }
    run.falls++; shift.streak = 0; run.swimming = true; run.breath = 1; player.swimming = true; player.vel.x *= .3; player.vel.z *= .3;
    run.salt = Math.min(1, run.salt + .35); glass.salt(.35); // every drink on the tray is now part seawater avatar.emote('No', .8);
    ledger.blame(['THE SEA'], 'SALT', 2, run.t); style.combo = 1; hooks.fell?.(run.falls);
    if (run.falls === 1) hooks.clip?.('fell in');
  };
  // DROWNING: you only have ~8 s of breath in the water. Run out and the sea takes the whole tray;
  // you wash up at the bar (and the boat drifts back to its dock).
  run.breath = 1;
  const drown = () => {
    splash.emit({ x: player.pos.x, y: SWIM_Y + .4, z: player.pos.z }, { x: 0, z: 0 }, 40); sfx.fail(); gallery.shake(.8);
    const lost = glass.count; glass.clear(); shift.streak = 0; run.swimming = false; player.swimming = false; run.breath = 1;
    player.reset({ x: BAR.x + 2.4, z: BAR.z + 1, yaw: -Math.PI / 2 }); player.grounded = true; run.safe = { x: player.pos.x, z: player.pos.z };
    sendBoat('dock'); ledger.blame(['THE SEA'], 'DROWNED', 3, run.t); hooks.drowned?.(lost);
  };
  // THE ROWBOAT: walk to the end of the plaza dock (or the islet shore) and it rows you across. The tray rocks on the waves.
  const boat = level.boat; run.ride = null; let boatArmed = true;
  function sendBoat(at) { boat.at = at; const s = BOAT[at]; boat.mesh.position.set(s.x, -1.55, s.z); boat.mesh.rotation.y = s.yaw; }
  function boatStep(dt) {
    if (run.ride) {
      const r = run.ride; r.t += dt / 3.4; const k = Math.min(1, r.t), e = k * k * (3 - 2 * k), A = BOAT[r.from], B = BOAT[r.to];
      const x = A.x + (B.x - A.x) * e, z = A.z + (B.z - A.z) * e + Math.sin(k * Math.PI) * 2.5, bob = Math.sin(run.t * 2.6) * .06;
      boat.mesh.position.set(x, -1.55 + bob, z); boat.mesh.rotation.y = Math.atan2(B.x - A.x, (B.z - A.z) + Math.cos(k * Math.PI) * 5) + Math.sin(run.t * 2) * .05;
      player.pos.x = x; player.pos.z = z; player.y = -1.2 + bob; player.vel.x = player.vel.z = 0; player.vy = 0; player.grounded = true;
      if (Math.random() < dt * 2.5) glass.kick((Math.random() - .5) * 1.4, -.3); // waves rock the tray
      if (k >= 1) { run.ride = null; sendBoat(r.to); player.reset({ x: B.land.x, z: B.land.z, yaw: player.yaw }); player.grounded = true; boatArmed = false; sfx.thud(.5); }
      return true;
    }
    if (run.swimming || run.climb || !player.grounded || player.y < -.05) return false;
    for (const at of ['dock', 'isle']) {
      const d = Math.hypot(player.pos.x - BOAT[at].land.x, player.pos.z - BOAT[at].land.z);
      if (d > 1.8 && at === boat.at) boatArmed = true; // step away from the landing spot before boarding again
      if (d < 1.1 && boatArmed) { if (boat.at !== at) sendBoat(at); run.ride = { from: at, to: at === 'dock' ? 'isle' : 'dock', t: 0 }; sfx.splash(); return true; }
    }
    return false;
  }
  // climbing out: any beach (sand islet) or a ramp exit point
  function exitFor(p) {
    for (const e of level.exits) if (Math.hypot(e.x - p.x, e.z - p.z) < 1.3) return { x: e.to.x, z: e.to.z };
    for (const c of level.colliders) if (c.beach) {
      const nx = Math.max(c.minX, Math.min(p.x, c.maxX)), nz = Math.max(c.minZ, Math.min(p.z, c.maxZ));
      if (Math.hypot(p.x - nx, p.z - nz) < .75) return { x: Math.max(c.minX + .6, Math.min(p.x, c.maxX - .6)), z: Math.max(c.minZ + .6, Math.min(p.z, c.maxZ - .6)) };
    }
    return null;
  }
  run.nearestExit = p => { // for the route arrow while swimming
    let best = null, bd = 1e9;
    const consider = (x, z) => { const d = Math.hypot(x - p.x, z - p.z); if (d < bd) { bd = d; best = { x, z }; } };
    for (const e of level.exits) consider(e.x, e.z);
    for (const c of level.colliders) if (c.beach) consider(Math.max(c.minX, Math.min(p.x, c.maxX)), Math.max(c.minZ, Math.min(p.z, c.maxZ)));
    return best;
  };
  let stepDist = 0, sloshCd = 0, spillCd = 0, creakCd = 0, zzzCd = 2;
  const lipPos = new THREE.Vector3();
  run.step = (dt) => {
    mods.step(dt); dt *= mods.timeScale; run.t += dt;
    const room = level.roomAt(player.pos.z);
    let push = { x: Math.cos(player.yaw) * mods.tilt, z: Math.sin(player.yaw) * mods.tilt }, shake = 0, hazard = null, info = null, wet = false, grip = false, bounce = 0, pit = false;
    for (const h of level.hazards) {
      h.update?.(run.t, player, props);
      if (player.pos.x > h.minX && player.pos.x < h.maxX && player.pos.z > h.minZ && player.pos.z < h.maxZ) {
        if (h.pit) { pit = true; continue; }
        if (h.bounce) { bounce = h.bounce; continue; }
        if (player.y > .2) continue;
        if (h.push) { push.x += h.push.x; push.z += h.push.z; } if (h.shake) shake += h.shake;
        if (h.slip) wet = true; if (h.grip) grip = true;
        if (h.label) { if (h.info) info = h.label; else hazard = h.label; }
      }
    }
    const spd0 = Math.hypot(player.vel.x, player.vel.z);
    voice.update(dt, player.keys, player.steady ? 0 : spd0);
    if (voice.loud) shake += .5; // yelling shakes your own hands
    const fx = chaos.step(dt); push.x += fx.push.x; push.z += fx.push.z;
    if (wind.update(run.t, dt, player)) hazard = hazard || 'WIND'; push.x += wind.push.x; if (wind.state === 'blow') glass.kick(wind.dir * .9 * dt * 10, 0);
    // timed hazards + the vacuum: hits shove the player and slosh the glass; blamed on the house
    for (const hit of hazards.update(run.t, player, dt, chaos, voice)) {
      if (hit.opened) { sfx.unlock2(); trick('shout'); continue; }
      if (hit.woke) { sfx.wake(); continue; }
      conductor.hit(hit.power); if (hit.kind === 'door') sfx.slam(); else sfx.thud(.8);
      player.vel.x += hit.dir.x * hit.power; player.vel.z += hit.dir.z * hit.power;
      glass.kick(hit.dir.x * hit.power * .35, -Math.abs(hit.power) * .25);
      ledger.blame([hit.label], hit.label, 1.5, run.t); hazard = hit.label; hooks.hit?.(hit.label, 'BUMPED'); avatar.emote('No', .5); style.combo = 1;
    }
    for (const hit of [...actors.update(dt, run.t, player), ...drops.update(dt, run.t, player)]) {
      if (hit.help) { run.buoy = hit.user; worn.visible = true; sfx.ding(); hooks.saved?.(0); hooks.buoy?.(hit.user); avatar.emote('ThumbsUp', .8); continue; }
      run.hitStop = .07; run.shakeT = Math.max(run.shakeT, .25); run.lastHit = { x: hit.dir.x, z: hit.dir.z, n: (run.lastHit?.n || 0) + 1 }; // juice: freeze-frame + shake + directional flash
      conductor.hit(hit.power); sfx.hit(); player.vel.x += hit.dir.x * hit.power;
      if (hit.drop) { avatar.knock(hit.direct ? 'flat' : 'fall', hit.direct ? 1.3 : 1.1); if (hit.direct) { player.vel.x *= .2; player.vel.z *= .2; sfx.boing(); } } // pancaked / knocked flat
      else if (hit.kind === 'BARREL') avatar.knock('fall', 1); player.vel.z += hit.dir.z * hit.power;
      glass.kick(hit.dir.x * hit.power * .4, -hit.power * .3); ledger.blame([hit.user], hit.kind, 3, run.t); hazard = `${hit.kind}: ${hit.user}`; hooks.hit?.(hit.user, hit.kind); avatar.emote('No', .6); style.combo = 1;
    }
    const vac = hazards.vacuum.distance;
    // what's on the island right now, by threat cost; the conductor releases queued threats within budget
    const activeCost = actors.list.reduce((a, x) => a + (COST[x.kind] || 0), 0) + drops.list.filter(d => d.state === 'fall').length * COST.drop + (wind.state ? COST.storm : 0);
    conductor.update(dt, { t: run.t, activeCost, swimming: run.swimming || !!run.climb });
    if (vac < 1.6 && !run.vacClose) run.vacClose = true;
    if (run.vacClose && vac > 4.5) { run.vacClose = false; trick('outrun'); }
    let slip = chaos.slipAt(player.pos.x, player.pos.z) || (wet && !grip);
    if (run.slip) { const s = run.slip; s.t -= dt; player.yaw += s.dir * 1.8 * Math.max(0, s.t / .55) * dt; slip = true; if (s.t <= 0) run.slip = null; } // eased spin, low traction
    if (boatStep(dt)) { /* rowing: the boat carries you */ }
    else if (run.climb) { // short climb-out tween onto the beach / ramp top
      const c = run.climb; c.t += dt / .45; const k = Math.min(1, c.t);
      player.pos.x = c.from.x + (c.to.x - c.from.x) * k; player.pos.z = c.from.z + (c.to.z - c.from.z) * k; player.y = SWIM_Y + (0 - SWIM_Y) * Math.sin(k * Math.PI / 2) + Math.sin(k * Math.PI) * .3;
      player.vel.x = player.vel.z = 0; player.vy = 0;
      if (k >= 1) { run.climb = null; player.y = 0; player.grounded = true; sfx.thud(.5); hooks.climbed?.(); }
    } else {
      player.step(dt, { colliders: level.colliders, push: run.swimming ? { x: push.x * .3, z: push.z * .3 } : push, slip, gravity: mods.gravity, speedMul: avatar.down ? 0 : mods.speed * (run.swimming ? .45 : 1), mirror: mods.mirror, base: run.swimming ? SWIM_Y : pit || level.open ? -12 : 0, noJump: run.swimming || avatar.down });
      if (player.grounded && !pit && !run.swimming && player.y > -.05) { run.safe.x = player.pos.x; run.safe.z = player.pos.z; }
      if (!run.swimming && player.y < SWIM_Y) fall(room);
      if (run.swimming) {
        if (Math.random() < dt * 2) { run.salt = Math.min(1, run.salt + .015); glass.salt(.015); }
        if (!run.buoy && (run.breath -= dt / 8) <= 0) drown();
        const out = run.swimming && exitFor(player.pos);
        if (out) { run.swimming = false; player.swimming = false; run.climb = { from: { x: player.pos.x, z: player.pos.z }, to: out, t: 0 }; }
      }
    }
    player.mirror = mods.mirror;
    // props: bananas make you slip-spin, everything else bonks the glass
    for (const { prop, speed } of props.step(dt, player, mods.on('moon') ? 5 : 18)) {
      if (prop.k.slip && player.grounded && !run.slip) { // one slip per banana: a short spin + forward skid, the peel flies off
        prop.used = true; prop.life = 1.2; prop.vel.set(player.vel.x * 1.5, 3, player.vel.z * 1.5); prop.spin = 25;
        run.slip = { t: .55, dir: Math.random() > .5 ? 1 : -1 }; glass.kick((Math.random() - .5) * 3, 1.5); sfx.boing(); avatar.emote('No', .6);
        hazard = 'BANANA'; ledger.blame(['THE BANANA'], 'BANANA', .8, run.t);
      }
      else if (speed > 2) sfx.thud(.35), glass.kick((Math.random() - .5) * speed * .3, -speed * .2);
    }
    if (bounce && player.grounded && player.y > .25) { player.vy = bounce; player.grounded = false; sfx.boing(); glass.kick((Math.random() - .5) * 2, -2.5); trick('bounce'); }
    if (player.landed) sfx.thud(Math.min(1, player.landed / 8));
    if (player.landed) glass.kick(0, -player.landed * (mods.soft ? .05 : .25));
    if (player.justJumped) { player.justJumped = false; if (props.list.some(p => Math.hypot(p.pos.x - player.pos.x, p.pos.z - player.pos.z) < 1.2)) trick('hop'); }
    if (mods.lava && player.y < .05 && player.grounded) { glass.state.water = Math.max(0, glass.state.water - .06 * dt); hazard = 'KEEP HOPPING'; }
    const lost = glass.step(dt, { ax: player.accel.x, az: player.accel.z, turn: THREE.MathUtils.clamp(player.turnRate, -6, 6) * .25, steady: player.steady, calm: fx.calm, wobble: (shake + fx.kick + (mods.on('drunk') ? 2 : 0)) * 6, gain: mods.slosh * (rule === 'heavy' ? 1.3 : 1), noSpill: mods.noSpill });
    if (lost > 0) {
      if ((spillCd -= dt) <= 0) { spillCd = .12; sfx.spill(lost); }
      run.roomLoss[room.key] += lost;
      const cause = ledger.spill(lost, run.t, hazard ? 'THE HOUSE' : 'YOUR OWN HANDS');
      splash.emit(glass.lip(lipPos), player.vel, Math.min(6, 1 + Math.floor(lost * 300)));
      hooks.spill?.(cause ? cause.users.join(', ') : hazard || 'YOUR OWN HANDS', lost);
      if (lost > .004) avatar.emote('No', .5);
    }
    splash.step(dt);
    const spd = Math.hypot(player.vel.x, player.vel.z);
    if (player.grounded && (stepDist += spd * dt) > (player.steady ? .55 : .8)) { stepDist = 0; sfx.step(player.steady); }
    sloshCd -= dt; if (glass.state.danger > .55 && sloshCd <= 0) { sloshCd = .45; sfx.slosh(glass.state.danger); }
    creakCd -= dt; if (creakCd <= 0 && hazards.doorWarning(run.t, player)) { creakCd = 1.2; sfx.creak(); }
    if (hazards.mate?.inRoom && hazards.mate.awake <= 0 && (zzzCd -= dt) <= 0) { zzzCd = 1.8; sfx.zzz(); }
    sfx.frame(dt, { vacuum: hazards.vacuum.distance, stunned: hazards.vacuum.stunned, low: glass.count > 0 && glass.state.water < .15 });
    run.sprintClean = spd > 3.6 && glass.state.danger < .7 ? run.sprintClean + dt : 0;
    if (run.sprintClean > 3) { run.sprintClean = 0; trick('cleanSprint'); }
    for (const h of hazards.list) {
      if (h.kind === 'pendulum') { const d = h.near(player); if (d < .95 && d > .55 && !h.close) { h.close = true; trick('nearmiss'); } else if (d > 1.6) h.close = false; }
      if (h.kind === 'door') { const across = Math.sign(player.pos.z - h.z); if (h.side && across !== h.side && h.warn(run.t)) trick('doorDash'); h.side = across; }
    }
    if (run.legendT > 0 && run.t - run.legendT > 6) { run.legendT = -9; if (glass.state.water > .2) trick('legend'); }
    style.step(dt, lost);
    if (!run.duck && deco.goldenDuck.visible && Math.hypot(player.pos.x - deco.goldenDuck.position.x, player.pos.z - deco.goldenDuck.position.z) < .7) { run.duck = true; deco.goldenDuck.visible = false; api.refill(.05); trick('duck'); }
    deco.goldenDuck.rotation.y += dt * 2;
    if (!run.lastSip && glass.count > 0 && glass.state.water < .15) { run.lastSip = true; hooks.lastSip?.(); }
    // THE HOUSE: seeded daily script keeps pressure on when chat is quiet; faster in later rooms.
    run.houseNext -= dt;
    if (run.houseNext <= 0) {
      const ri = level.rooms.indexOf(room); run.houseNext = 7 + houseRng() * 3 - Math.min(2, run.t / 45); // calm opening, one house event every 7-10 s; void ri
      if (run.falls >= 2 && !run.buoy && !actors.list.some(a => a.kind === 'lifeguard') && houseRng() < .3) actors.spawn('lifeguard', 'LIFEGUARD', player); // mercy
      else if (run.t - run.lastChat > 3 && houseRng() < .2) run.summon('drop', 'THE HOUSE', 'house');
      else if (run.t - run.lastChat > 3 && houseRng() < .35) run.summon(houseRng() < .7 ? 'barrel' : 'sniper', 'THE HOUSE', 'house');
      else if (run.t - run.lastChat > 3) { const card = draw(houseRng); if (card.r !== 'l' && !card.help) conductor.request('card', 'THE HOUSE', 'house', () => hooks.house?.(run.play(card.id, ['THE HOUSE']))); }
    }
    // CATCH IT: when the glass is about to go, a short window to press E for a slow-mo save.
    if (run.catchWin > 0) {
      run.catchWin -= dt;
      if (player.keys.has('KeyE')) { sfx.ding(); glass.state.vx = glass.state.vz = 0; glass.state.tx *= .3; glass.state.tz *= .3; run.saves++; trick('catch'); run.catchWin = -1.2; hooks.saved?.(run.saves); avatar.emote('Yes', .6); }
      else if (run.catchWin <= 0) { run.catchWin = -1.2; hooks.catchPrompt?.(false); }
    } else if (run.catchWin < 0) run.catchWin = Math.min(0, run.catchWin + dt);
    else if (glass.state.danger > .9 && glass.state.water > .02 && !run.atSink) { run.catchWin = .5; hooks.catchPrompt?.(true); }
    // SCREAM TO DASH (mic): forward burst, but the glass hates it.
    // SHOUT: scares the vacuum if it's close (it spins out for 2.5 s), otherwise a forward dash. Both slosh.
    if (voice.shout && !hazards.lock.near) {
      if (hazards.vacuum.distance < 4.5 && !hazards.vacuum.stunned) { sfx.scare(); hazards.vacuum.stun(2.5); trick('scare'); hooks.scream?.('scare'); }
      else { player.vel.x += Math.sin(player.yaw) * 6; player.vel.z -= Math.cos(player.yaw) * 6; glass.kick((Math.random() - .5) * 2, 2); hooks.scream?.('dash'); }
    }
    // THE SHIFT: load glasses at the bar, serve the customers on the islets. Tips are the score.
    shift.update(run.t, dt, player, {
      loaded: n => { run.salt = 0; sfx.collect(0); hooks.loaded?.(n); },
      served: (c, tip, water) => { if (c.mood === 'happy') { sfx.collect(Math.min(4, shift.served)); trick('collect'); } else sfx.wake(); hooks.served?.(c, tip, water); },
      order: c => hooks.order?.(c), hurry: c => hooks.hurry?.(c),
      walkout: c => { const v = ledger.villain(); if (v) ledger.blame([v.name], 'WALKOUT', 2, run.t); hooks.walkout?.(c, v?.name); },
    });
    if (run.swimming) hazard = run.breath < .4 ? 'OUT OF BREATH' : 'SWIM TO A BEACH OR RAMP';
    if (!hazard && !glass.count && shift.customers.some(c => c.mood === 'wait') && !shift.atBar) hazard = 'TO THE BAR';
    const mate = hazards.mate;
    if (!hazard && hazards.lock.near) hazard = voice.mic ? 'SHOUT' : 'HOLD V';
    if (!hazard && mate?.inRoom && mate.awake <= 0) hazard = 'SHH';
    void info;
    if (run.t >= LIMIT) run.end(shift.served > 0); // shift over
    if (!hazard && hazards.doorWarning(run.t, player)) hazard = 'DOOR CLOSING';
    return { room, hazard, calm: fx.calm, vacuum: vac, style, voice: { level: voice.level, lock: hazards.lock.near ? hazards.lock.charge : -1, alert: mate?.inRoom ? (mate.awake > 0 ? 1 : mate.alert) : -1 } };
  };
  run.render = (dt, t) => { guide.update(t, player, run.state === 'play' || run.state === 'ready', run); prompts.update(t, voice, run); scene.userData.sea?.userData.update(t); avatar.update(dt, player, glass.state, run.state === 'play' ? 'play' : run.won ? 'done-win' : 'done-fail'); glass.render(t, mods.on('bigglass') ? 1.8 : 1); chaos.render(dt); gallery.render(dt); };
  run.end = (won) => { if (run.state !== 'play') return; run.state = 'done'; run.won = won; sfx.silence(); won ? sfx.win() : sfx.fail();  hooks.end?.(run); };
  return run;
}
