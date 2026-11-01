import * as THREE from 'three';
import { buildLevel } from './level.js';
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

export const LIMIT = 60;
const LEGACY = { storm: 'gust', crate: 'fridge', ice: 'mop', quake: 'bass', calm: 'steady', bomb: 'bomb', lights: 'lights' };

// One run (practice or the daily POUR). Owns the scene contents; main.js owns renderer, UI and Twitch.
export async function createRun(world, player, { seed, profile, hooks, scream }) {
  const scene = world.reset();
  const level = await buildLevel(scene, seed);
  const props = createProps(scene, level.colliders);
  const deco = await dress(scene, level, props, rng(seed + ':clutter'));
  personalize(scene, level, profile);
  const avatar = await createCharacter(scene);
  const glass = createGlass(avatar.holder);
  const mods = createMods();
  const houseRng = rng(seed + ':house');
  const chaos = createChaos({ scene, level, player, glass, props });
  const gallery = createGallery(scene, level.slots);
  const ledger = new Ledger();
  const splash = createSplash(scene, (x, z) => Math.random() < .25 && chaos.puddle(x, z, .25));
  const hazards = await createHazards(scene, level, rng(seed + ':hazards'), level.spawn);
  const style = createStyle();
  player.reset(level.spawn);
  const run = { hazards, style, sprintClean: 0, legendT: -9, level, glass, chaos, gallery, props, mods, ledger, avatar, t: 0, state: 'play', duck: false, lastSip: false, saves: 0, catchWin: 0, lastChat: -9, houseNext: 2.5, roomLoss: Object.fromEntries(level.rooms.map(r => [r.key, 0])) };
  chaos.onBlast = f => { gallery.shake(1.4); if (f > .3) hooks.clip?.('bomb'); };

  const ahead = d => ({ x: player.pos.x + Math.sin(player.yaw) * d, z: player.pos.z - Math.cos(player.yaw) * d });
  const api = {
    fire: type => chaos.fire(type),
    mod: (n, s) => mods.set(n, s),
    refill: f => { glass.state.water = Math.min(1, glass.state.water + f); },
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
  run.play = (eventName, users, { bias = 0 } = {}) => {
    if (run.state !== 'play') return null;
    const card = eventName === 'deck' ? draw(Math.random, { bias }) : byId(LEGACY[eventName] || eventName);
    if (!card) return null;
    card.apply(api);
    if (users[0] !== 'THE HOUSE') run.lastChat = run.t;
    if (!card.help) ledger.blame(users, card.label, card.id === 'mop' ? 8 : 4, run.t);
    else avatar.emote('ThumbsUp', .9);
    if (card.r === 'l' && !card.help) run.legendT = run.t;
    return card;
  };

  const trick = id => { const g = style.add(id); if (g) hooks.trick?.(style.last); };
  const lipPos = new THREE.Vector3();
  run.step = (dt) => {
    mods.step(dt); dt *= mods.timeScale; run.t += dt;
    const room = level.roomAt(player.pos.z);
    let push = { x: Math.cos(player.yaw) * mods.tilt, z: Math.sin(player.yaw) * mods.tilt }, shake = 0, hazard = null;
    for (const h of level.hazards) {
      h.update?.(run.t);
      if (player.y < .2 && player.pos.x > h.minX && player.pos.x < h.maxX && player.pos.z > h.minZ && player.pos.z < h.maxZ) {
        if (h.push) { push.x += h.push.x; push.z += h.push.z; } if (h.shake) shake += h.shake; hazard = h.label;
      }
    }
    const fx = chaos.step(dt); push.x += fx.push.x; push.z += fx.push.z;
    // timed hazards + the vacuum: hits shove the player and slosh the glass; blamed on the house
    for (const hit of hazards.update(run.t, player, dt, chaos)) {
      player.vel.x += hit.dir.x * hit.power; player.vel.z += hit.dir.z * hit.power;
      glass.kick(hit.dir.x * hit.power * .35, -Math.abs(hit.power) * .25);
      ledger.blame([hit.label], hit.label, 1.5, run.t); hazard = hit.label; avatar.emote('No', .5); style.combo = 1;
    }
    const vac = hazards.vacuum.distance;
    if (vac < 1.6 && !run.vacClose) run.vacClose = true;
    if (run.vacClose && vac > 4.5) { run.vacClose = false; trick('outrun'); }
    let slip = chaos.slipAt(player.pos.x, player.pos.z);
    player.step(dt, { colliders: level.colliders, push, slip, gravity: mods.gravity, speedMul: mods.speed, mirror: mods.mirror });
    player.mirror = mods.mirror;
    // props: bananas make you slip-spin, everything else bonks the glass
    for (const { prop, speed } of props.step(dt, player, mods.on('moon') ? 5 : 18)) {
      if (prop.k.slip && player.grounded) { player.yaw += (Math.random() > .5 ? 1 : -1) * 1.2; glass.kick((Math.random() - .5) * 3, 1.5); hazard = 'BANANA'; ledger.blame(['THE BANANA'], 'BANANA', .8, run.t); }
      else if (speed > 2) glass.kick((Math.random() - .5) * speed * .3, -speed * .2);
    }
    if (player.landed) glass.kick(0, -player.landed * (mods.soft ? .05 : .25));
    if (player.justJumped) { player.justJumped = false; if (props.list.some(p => Math.hypot(p.pos.x - player.pos.x, p.pos.z - player.pos.z) < 1.2)) trick('hop'); }
    if (mods.lava && player.y < .05 && player.grounded) { glass.state.water = Math.max(0, glass.state.water - .06 * dt); hazard = 'THE FLOOR IS LAVA — GET ON FURNITURE'; }
    const lost = glass.step(dt, { ax: player.accel.x, az: player.accel.z, turn: THREE.MathUtils.clamp(player.turnRate, -6, 6) * .25, steady: player.steady, calm: fx.calm, wobble: (shake + fx.kick + (mods.on('drunk') ? 2 : 0)) * 6, gain: mods.slosh, noSpill: mods.noSpill });
    if (lost > 0) {
      run.roomLoss[room.key] += lost;
      const cause = ledger.spill(lost, run.t, hazard ? 'THE HOUSE' : 'YOUR OWN HANDS');
      splash.emit(glass.lip(lipPos), player.vel, Math.min(6, 1 + Math.floor(lost * 300)));
      hooks.spill?.(cause ? cause.users.join(', ') : hazard || 'YOUR OWN HANDS', lost);
      if (lost > .004) avatar.emote('No', .5);
    }
    splash.step(dt);
    const spd = Math.hypot(player.vel.x, player.vel.z);
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
    if (!run.lastSip && glass.state.water < .15) { run.lastSip = true; hooks.lastSip?.(); }
    // THE HOUSE: seeded daily script keeps pressure on when chat is quiet; faster in later rooms.
    run.houseNext -= dt;
    if (run.houseNext <= 0) {
      const ri = level.rooms.indexOf(room); run.houseNext = Math.max(2.2, 6 - ri * .9) + houseRng() * 2;
      if (run.t - run.lastChat > 3) { const card = draw(houseRng); if (card.r !== 'l' && !card.help) hooks.house?.(run.play(card.id, ['THE HOUSE'])); }
    }
    // CATCH IT: when the glass is about to go, a short window to press E for a slow-mo save.
    if (run.catchWin > 0) {
      run.catchWin -= dt;
      if (player.keys.has('KeyE')) { glass.state.vx = glass.state.vz = 0; glass.state.tx *= .3; glass.state.tz *= .3; run.saves++; trick('catch'); run.catchWin = -1.2; hooks.saved?.(run.saves); avatar.emote('Yes', .6); }
      else if (run.catchWin <= 0) { run.catchWin = -1.2; hooks.catchPrompt?.(false); }
    } else if (run.catchWin < 0) run.catchWin = Math.min(0, run.catchWin + dt);
    else if (glass.state.danger > .9 && glass.state.water > .02) { run.catchWin = .5; hooks.catchPrompt?.(true); }
    // SCREAM TO DASH (mic): forward burst, but the glass hates it.
    if (scream?.update(dt)) { player.vel.x += Math.sin(player.yaw) * 7; player.vel.z -= Math.cos(player.yaw) * 7; glass.kick((Math.random() - .5) * 2, 2.2); hooks.scream?.(); }
    const f = level.finish;
    if (Math.hypot(player.pos.x - f.x, player.pos.z - f.z) < f.r) run.end(true);
    else if (glass.state.water <= .001 || run.t >= LIMIT) run.end(false);
    if (!hazard && hazards.doorWarning(run.t, player)) hazard = 'DOOR CLOSING';
    return { room, hazard, calm: fx.calm, vacuum: vac, style };
  };
  run.render = (dt, t) => { avatar.update(dt, player, glass.state, run.state === 'play' ? 'play' : run.won ? 'done-win' : 'done-fail'); glass.render(t, mods.on('bigglass') ? 1.8 : 1); chaos.render(dt); gallery.render(dt); };
  run.end = (won) => { if (run.state !== 'play') return; run.state = 'done'; run.won = won; if (won && glass.state.water < .05) hooks.clip?.('lastsip'); hooks.end?.(run); };
  return run;
}
