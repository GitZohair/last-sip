import * as THREE from 'three';
import { buildIsland } from './island.js';
import { createRecipe, INGREDIENTS } from './recipe.js';
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
import { createActors } from './actors.js';

export const LIMIT = 90;
const LEGACY = { storm: 'gust', crate: 'fridge', ice: 'mop', quake: 'bass', calm: 'steady', bomb: 'bomb', lights: 'lights' };

// One run (practice or the daily POUR). Owns the scene contents; main.js owns renderer, UI and Twitch.
export async function createRun(world, player, { seed, profile, hooks, voice }) {
  const scene = world.reset();
  const level = await buildIsland(scene);
  const props = createProps(scene, level.colliders);
  const deco = await dress(scene, level, props, rng(seed + ':clutter'));
  personalize(scene, profile);
  const recipe = await createRecipe(scene, seed);
  const avatar = await createCharacter(scene);
  const glass = createGlass(avatar.holder);
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
  player.reset(level.spawn);
  glass.state.water = 0; // you start empty: today's 3 ingredients fill the glass
  const run = { actors, recipe, hazards, style, sprintClean: 0, legendT: -9, level, glass, chaos, gallery, props, mods, ledger, avatar, t: 0, state: 'play', duck: false, lastSip: false, saves: 0, catchWin: 0, lastChat: -9, houseNext: 2.5, roomLoss: Object.fromEntries(level.rooms.map(r => [r.key, 0])) };
  chaos.onBlast = f => { sfx.boom(); gallery.shake(1.4); if (f > .3) hooks.clip?.('bomb'); };

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
  // viewer characters spawn by name; the card system handles everything else
  run.summon = (kind, user) => { if (run.state !== 'play') return false; actors.spawn(kind, user, player); run.lastChat = run.t; return true; };
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

  const trick = id => { const g = style.add(id); if (g) { hooks.trick?.(style.last); sfx.pop(style.combo); } };
  // Falling in: splash, lose 12% of the glass, respawn at the last safe spot. Very clippable.
  run.safe = { x: level.spawn.x, z: level.spawn.z }; run.falls = 0;
  const fall = (room) => {
    run.falls++; const before = glass.state.water; glass.state.water = Math.max(0, before - .12); run.roomLoss[room.key] += before - glass.state.water;
    ledger.spill(before - glass.state.water, run.t, 'THE WATER'); hooks.spill?.('THE WATER', before - glass.state.water);
    splash.emit({ x: player.pos.x, y: 0, z: player.pos.z }, { x: 0, z: 0 }, 24); sfx.splash(); avatar.emote('No', .8);
    player.reset({ x: run.safe.x, z: run.safe.z, yaw: player.yaw }); style.combo = 1; hooks.fell?.(run.falls);
    if (run.falls === 1) hooks.clip?.('fell in');
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
    // timed hazards + the vacuum: hits shove the player and slosh the glass; blamed on the house
    for (const hit of hazards.update(run.t, player, dt, chaos, voice)) {
      if (hit.opened) { sfx.unlock2(); trick('shout'); continue; }
      if (hit.woke) { sfx.wake(); hooks.toast?.('YOU WOKE THE ROOMMATE', 'pillows'); hooks.clip?.('roommate'); continue; }
      if (hit.kind === 'door') sfx.slam(); else sfx.thud(.8);
      player.vel.x += hit.dir.x * hit.power; player.vel.z += hit.dir.z * hit.power;
      glass.kick(hit.dir.x * hit.power * .35, -Math.abs(hit.power) * .25);
      ledger.blame([hit.label], hit.label, 1.5, run.t); hazard = hit.label; avatar.emote('No', .5); style.combo = 1;
    }
    for (const hit of actors.update(dt, run.t, player)) {
      sfx.hit(); player.vel.x += hit.dir.x * hit.power; player.vel.z += hit.dir.z * hit.power;
      glass.kick(hit.dir.x * hit.power * .4, -hit.power * .3); ledger.blame([hit.user], hit.kind, 3, run.t); hazard = `${hit.kind}: ${hit.user}`; avatar.emote('No', .6); style.combo = 1;
    }
    const vac = hazards.vacuum.distance;
    if (vac < 1.6 && !run.vacClose) run.vacClose = true;
    if (run.vacClose && vac > 4.5) { run.vacClose = false; trick('outrun'); }
    let slip = chaos.slipAt(player.pos.x, player.pos.z) || (wet && !grip);
    player.step(dt, { colliders: level.colliders, push, slip, gravity: mods.gravity, speedMul: mods.speed, mirror: mods.mirror, base: pit || level.open ? -12 : 0 });
    if (player.grounded && !pit && player.y > -.05) { run.safe.x = player.pos.x; run.safe.z = player.pos.z; }
    if (player.y < -1.4) fall(room);
    player.mirror = mods.mirror;
    // props: bananas make you slip-spin, everything else bonks the glass
    for (const { prop, speed } of props.step(dt, player, mods.on('moon') ? 5 : 18)) {
      if (prop.k.slip && player.grounded) { player.yaw += (Math.random() > .5 ? 1 : -1) * 1.2; glass.kick((Math.random() - .5) * 3, 1.5); hazard = 'BANANA'; ledger.blame(['THE BANANA'], 'BANANA', .8, run.t); }
      else if (speed > 2) sfx.thud(.35), glass.kick((Math.random() - .5) * speed * .3, -speed * .2);
    }
    if (bounce && player.grounded && player.y > .25) { player.vy = bounce; player.grounded = false; sfx.boing(); glass.kick((Math.random() - .5) * 2, -2.5); trick('bounce'); }
    if (player.landed) sfx.thud(Math.min(1, player.landed / 8));
    if (player.landed) glass.kick(0, -player.landed * (mods.soft ? .05 : .25));
    if (player.justJumped) { player.justJumped = false; if (props.list.some(p => Math.hypot(p.pos.x - player.pos.x, p.pos.z - player.pos.z) < 1.2)) trick('hop'); }
    if (mods.lava && player.y < .05 && player.grounded) { glass.state.water = Math.max(0, glass.state.water - .06 * dt); hazard = 'THE FLOOR IS LAVA — GET ON FURNITURE'; }
    const lost = glass.step(dt, { ax: player.accel.x, az: player.accel.z, turn: THREE.MathUtils.clamp(player.turnRate, -6, 6) * .25, steady: player.steady, calm: fx.calm, wobble: (shake + fx.kick + (mods.on('drunk') ? 2 : 0)) * 6, gain: mods.slosh, noSpill: mods.noSpill });
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
    sfx.frame(dt, { vacuum: hazards.vacuum.distance, stunned: hazards.vacuum.stunned, low: run.filled && glass.state.water < .15 });
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
    if (!run.lastSip && run.filled && glass.state.water < .15) { run.lastSip = true; hooks.lastSip?.(); }
    // THE HOUSE: seeded daily script keeps pressure on when chat is quiet; faster in later rooms.
    run.houseNext -= dt;
    if (run.houseNext <= 0) {
      const ri = level.rooms.indexOf(room); run.houseNext = Math.max(2.2, 6 - ri * .9) + houseRng() * 2;
      if (run.t - run.lastChat > 3 && houseRng() < .35) { actors.spawn(houseRng() < .7 ? 'barrel' : 'sniper', 'THE HOUSE', player); }
      else if (run.t - run.lastChat > 3) { const card = draw(houseRng); if (card.r !== 'l' && !card.help) hooks.house?.(run.play(card.id, ['THE HOUSE'])); }
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
    // TODAY'S ORDER: pour in the 3 ingredients (hold E on their islets), then deliver to the hut.
    recipe.update(run.t, dt, player, glass, (st, n) => { glass.tint(recipe.color); sfx.collect(n); trick('collect'); run.filled = true; hooks.collect?.(st.id, n, recipe.order.length); });
    if (!hazard && recipe.near) hazard = 'HOLD E';
    const mate = hazards.mate;
    // Set pieces are signposted in the world (prompts.js); the HUD only gets a one-word hint.
    if (!hazard && hazards.lock.near) hazard = voice.mic ? 'SHOUT' : 'HOLD V';
    if (!hazard && mate?.inRoom && mate.awake <= 0) hazard = 'SHH';
    void info;
    const f = level.finish;
    const atHut = Math.hypot(player.pos.x - f.x, player.pos.z - f.z) < f.r * 2.5;
    if (atHut && recipe.done) run.end(true);
    else if (atHut && !hazard) hazard = 'MISSING ' + recipe.order.filter(id => !recipe.got.includes(id)).map(id => INGREDIENTS[id].label).join(' + ');
    else if ((run.filled && glass.state.water <= .001) || run.t >= LIMIT) run.end(false);
    if (!hazard && hazards.doorWarning(run.t, player)) hazard = 'DOOR CLOSING';
    return { room, hazard, calm: fx.calm, vacuum: vac, style, voice: { level: voice.level, lock: hazards.lock.near ? hazards.lock.charge : -1, alert: mate?.inRoom ? (mate.awake > 0 ? 1 : mate.alert) : -1 } };
  };
  run.render = (dt, t) => { prompts.update(t, voice, run); scene.userData.sea?.userData.update(t); avatar.update(dt, player, glass.state, run.state === 'play' ? 'play' : run.won ? 'done-win' : 'done-fail'); glass.render(t, mods.on('bigglass') ? 1.8 : 1); chaos.render(dt); gallery.render(dt); };
  run.end = (won) => { if (run.state !== 'play') return; run.state = 'done'; run.won = won; sfx.silence(); won ? sfx.win() : sfx.fail(); if (won && glass.state.water < .05) hooks.clip?.('lastsip'); hooks.end?.(run); };
  return run;
}
