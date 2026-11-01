import * as THREE from 'three';
import { checker, planks } from './assets.js';
import { zone, patrol, launcher } from './roomkit.js';

const L = Math.PI / 2, R = -Math.PI / 2;

export const MORE = {
  laundry(ctx, z0, r) {
    const w = 10, len = 12, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, checker('#e6e6ee', '#cfd3e0', 10));
    for (let i = 0; i < 4; i++) ctx.place('furniture', i % 2 ? 'dryer' : 'washer', -w / 2 + .5, z0 - 1.5 - i * 1.1, L);
    ctx.place('furniture', 'washerDryerStacked', w / 2 - .5, z0 - 1.6, R);
    // Two box walls, each with one gap in a different place: zig-zag, or hop the boxes (risky).
    for (const [row, zz] of [[0, zc + .5], [1, zc - 3]]) {
      const gap = Math.floor(r.range(0, 8));
      for (let i = 0; i < 9; i++) if (i !== gap && i !== gap + 1 - row) ctx.place('furniture', 'cardboardBoxClosed', -w / 2 + .7 + i * 1.07, zz, r.range(-.2, .2));
    }
    return { name: 'THE LAUNDRY ROOM', len, w, slots: [], hazards: [
      zone(-w / 2 + 1.5, z0 - 3.2, 1.8, 4.8, { shake: 1, label: 'SPIN CYCLE' }),
      launcher(w / 2 - .6, 1.1, z0 - 1.6, { kind: 'ball', every: 2.8, range: 7, label: 'DRYER', power: .8 }),
    ] };
  },
  // Wet tile everywhere: only the bath mats grip. The bathtub blocks the middle; the shower sprays sideways.
  bathroom(ctx, z0, r) {
    const w = 9, len = 12, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, checker('#dff3f7', '#bfe2ea', 14));
    const tx = r() > .5 ? 1.4 : -1.4;
    ctx.place('furniture', 'bathtub', tx, zc, 0);
    ctx.place('furniture', 'toilet', -w / 2 + .5, z0 - 2, L); ctx.place('furniture', 'toilet', w / 2 - .5, z0 - len + 2, R);
    for (let i = 0; i < 2; i++) { ctx.place('furniture', 'bathroomSink', w / 2 - .4, z0 - 3 - i * 1.2, R); ctx.place('furniture', 'bathroomMirror', w / 2 - .12, z0 - 3 - i * 1.2, R, false).then(m => m.position.y = 1.3); }
    ctx.place('furniture', 'bathroomCabinet', -w / 2 + .4, z0 - len + 1.5, L);
    const sz = z0 - len + 3.5; ctx.place('furniture', 'showerRound', -w / 2 + .8, sz, L);
    const mats = [];
    for (let i = 0; i < 4; i++) { const x = r.range(-2.8, 2.8), z = z0 - 1.6 - i * 2.6; if (Math.abs(x - tx) < 1.4 && Math.abs(z - zc) < 1.6) continue; ctx.place('furniture', 'rugDoormat', x, z, 0, false); mats.push(zone(x, z, 1.2, .9, { grip: true, label: '' })); }
    const phase = r.range(0, 4);
    return { name: 'THE BATHROOM', len, w, slots: [], hazards: [
      zone(0, zc, w, len, { slip: true, info: true, label: 'WET TILE: STAY ON THE MATS' }), ...mats,
      zone(0, sz, w, 1.8, { label: 'SHOWER SPRAY', update(t) { const on = Math.sin(t * 1.3 + phase) > .3; this.push = on ? { x: 3.2, z: 0 } : null; this.shake = on ? .6 : 0; this.label = on ? 'SHOWER SPRAY' : ''; } }),
    ] };
  },
  // The roommate is asleep. Noise (your voice or running) wakes them, and they throw pillows. The bed is a trampoline.
  bedroom(ctx, z0, r) {
    const w = 12, len = 14, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, planks('#c49a6c', '#a87f55', 12));
    ctx.place('furniture', 'rugRounded', 0, zc, 0, false);
    ctx.place('furniture', 'bedDouble', 0, zc + 1, 0);
    for (const s of [-1, 1]) ctx.place('furniture', 'cabinetBed', s * 1.7, zc + 2.2, 0);
    ctx.place('furniture', 'bedBunk', -w / 2 + 1.1, z0 - len + 2.5, L);
    ctx.place('furniture', 'bookcaseOpenLow', w / 2 - .4, z0 - 2, R);
    ctx.place('furniture', 'deskCorner', w / 2 - .9, z0 - len + 1.4, R);
    ctx.place('furniture', 'laptop', w / 2 - .9, z0 - len + 1.4, R, false).then(m => m.position.y = .76);
    const bx = r() > .5 ? 3 : -3, bz = zc - 3;
    ctx.place('furniture', 'bedSingle', bx, bz, 0);
    const sleeper = ctx.place('furniture', 'bear', bx, bz + .3, Math.PI, false);
    sleeper.then(m => { m.scale.setScalar(2.4); m.position.y = .45; m.rotation.x = -1.2; });
    for (let i = 0; i < 3; i++) ctx.place('furniture', i % 2 ? 'pillowBlueLong' : 'pillowLong', r.range(-4, 4), z0 - 1.5 - r() * (len - 3), r.range(0, 6), false);
    return { name: 'THE BEDROOM', len, w, slots: [], sleeper: { model: sleeper, x: bx, z: bz }, hazards: [
      zone(0, zc + 1, 1.8, 2.2, { bounce: 9.5, label: 'TRAMPOLINE BED' }),
      zone(0, zc, w, len, { quiet: true, info: true, label: '' }),
    ] };
  },
  stream(ctx, z0) {
    const w = 10, len = 10, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, planks('#3a2d4f', '#2a2040', 8));
    const deskZ = z0 - len + 1;
    ctx.place('furniture', 'desk', 0, deskZ, 0);
    ctx.place('furniture', 'computerScreen', 0, deskZ - .25, 0, false).then(m => m.position.y = .76);
    ctx.place('furniture', 'computerKeyboard', 0, deskZ + .1, 0, false).then(m => m.position.y = .76);
    ctx.place('furniture', 'chairDesk', 0, deskZ + 1.2, Math.PI, false);
    for (const s of [-1, 1]) { ctx.place('furniture', 'speaker', s * 1.3, deskZ - .2, 0); ctx.place('furniture', 'bookcaseClosedWide', s * (w / 2 - .4), zc, s > 0 ? R : L); }
    ctx.place('furniture', 'televisionAntenna', -3, deskZ, 0);
    const neon = new THREE.PointLight('#a970ff', 6, 8); neon.position.set(0, 2, deskZ + .5); ctx.scene.add(neon);
    return { name: 'YOUR STREAM DESK', len, w, slots: [], hazards: [], finish: { x: 0, z: deskZ + 1.2, r: .9 } };
  },
};
