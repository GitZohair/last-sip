import * as THREE from 'three';
import { checker, planks } from './assets.js';

// Each room: build(ctx, z0, r) -> { name, len, w, hazards, slots }.
// ctx.place(kit, name, x, z, rotY, solid=true) places a Kenney model (+collider).
// Hazard zones: {minX,maxX,minZ,maxZ, push?:{x,z}, slip?, shake?, label, update?(t)}.
const zone = (x, z, w, d, extra) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, ...extra });

export const ROOMS = {
  kitchen(ctx, z0, r) {
    const w = 8, len = 9, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, checker('#f3ead8', '#d9c9a8', 6));
    for (let i = 0; i < 6; i++) ctx.place('furniture', i === 2 ? 'kitchenSink' : i === 4 ? 'kitchenStove' : 'kitchenCabinet', -w / 2 + .5, z0 - 1.2 - i * .9, Math.PI / 2);
    ctx.place('furniture', 'kitchenFridgeLarge', w / 2 - .6, z0 - 1.2, -Math.PI / 2);
    ctx.place('furniture', 'table', r.range(-.8, .8), zc - .5, 0);
    for (const dx of [-1, 1]) ctx.place('furniture', 'chair', dx * 1.1, zc - .5 + r.range(-.4, .4), r.range(0, 6), false);
    ctx.place('furniture', 'trashcan', w / 2 - .5, z0 - len + 1, 0);
    return { name: 'THE KITCHEN', len, w, hazards: [], slots: [] };
  },
  hallway(ctx, z0, r) {
    const w = 3.2, len = 16, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, planks('#a8754f', '#7d5539', 8));
    const slots = [];
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) slots.push({ x: s * (w / 2 - .12), y: 1.6, z: z0 - 2 - i * 3 - (s > 0 ? 1.5 : 0), rot: s > 0 ? -Math.PI / 2 : Math.PI / 2 });
    ctx.place('furniture', 'coatRackStanding', -w / 2 + .4, z0 - 1.2, 0);
    ctx.place('furniture', 'pottedPlant', w / 2 - .35, z0 - 7, 0);
    // The rug pull: a rug that slides backward. Readable, avoidable at the edges.
    const rugZ = zc + r.range(-3, 1);
    const rug = ctx.place('furniture', 'rugRectangle', 0, rugZ, Math.PI / 2, false);
    // Robo-bear: a teddy riding a vacuum, patrolling side to side.
    const bear = ctx.place('furniture', 'bear', 0, z0 - len + 3, 0, false);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.35, .38, .12, 24), new THREE.MeshStandardMaterial({ color: '#33363d', roughness: .4 }));
    disc.position.y = .06; bear.then(b => { b.add(disc); b.children[0].position.y += .12; });
    const bearCol = { minX: 0, maxX: 0, minZ: 0, maxZ: 0, top: .6 }; ctx.shell.colliders.push(bearCol);
    const phase = r.range(0, 6);
    const hazards = [
      zone(0, rugZ, 1.6, 3, { push: { x: 0, z: 3.2 }, label: 'RUG PULL', update(t) { rug.then(m => m.children[0] && (m.children[0].position.z = ((t * 3.2) % .6) - .3)); } }),
      { minX: 0, maxX: 0, minZ: 0, maxZ: 0, label: 'ROBO-BEAR', update(t) {
        const x = Math.sin(t * 1.4 + phase) * (w / 2 - .6), z = z0 - len + 3;
        bear.then(b => { b.position.x = x; b.rotation.y = Math.cos(t * 1.4 + phase) > 0 ? -Math.PI / 2 : Math.PI / 2; });
        Object.assign(bearCol, { minX: x - .35, maxX: x + .35, minZ: z - .35, maxZ: z + .35 });
      } },
    ];
    return { name: 'THE CHAT GALLERY', len, w, hazards, slots };
  },
  living(ctx, z0, r) {
    const w = 10, len = 14, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, checker('#6f8fa8', '#6688a0', 10, 32));
    ctx.place('furniture', 'rugRound', 0, zc, 0, false);
    // Sofa slalom: alternating sofas force a weave.
    for (let i = 0; i < 3; i++) { const s = i % 2 ? 1 : -1; ctx.place('furniture', i === 1 ? 'loungeSofaLong' : 'loungeSofa', s * r.range(1.2, 2.2), z0 - 3 - i * 3.6, s > 0 ? -Math.PI / 2 : Math.PI / 2); }
    ctx.place('furniture', 'tableCoffee', r.range(-1, 1), zc, 0);
    ctx.place('furniture', 'cabinetTelevision', -w / 2 + .5, zc, Math.PI / 2);
    ctx.place('furniture', 'televisionModern', -w / 2 + .5, zc, Math.PI / 2, false).then(m => m.position.y = .62);
    ctx.place('furniture', 'lampRoundFloor', w / 2 - .5, z0 - 1, 0);
    const fan = ctx.place('furniture', 'ceilingFan', 0, zc, 0, false); fan.then(m => m.position.y = 2.5);
    const dir = r() > .5 ? 1 : -1;
    return { name: 'THE LIVING ROOM', len, w, slots: [], hazards: [
      zone(0, zc, 7, 6, { label: 'CEILING FAN', update(t) { this.push = { x: dir * 2.4 * Math.max(0, Math.sin(t * .9)), z: 0 }; fan.then(m => m.rotation.y = t * 9); } }),
    ] };
  },
  laundry(ctx, z0, r) {
    const w = 6, len = 8, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, checker('#e6e6ee', '#cfd3e0', 8));
    for (let i = 0; i < 3; i++) ctx.place('furniture', 'washer', -w / 2 + .5, z0 - 1.5 - i * 1.1, Math.PI / 2);
    // Box wall with one gap; boxes are low enough to hop (Space) as a risky shortcut.
    const gap = Math.floor(r.range(0, 5));
    for (let i = 0; i < 6; i++) if (i !== gap) ctx.place('furniture', 'cardboardBoxClosed', -w / 2 + .6 + i * 1, zc - .5, r.range(-.2, .2));
    return { name: 'THE LAUNDRY ROOM', len, w, slots: [], hazards: [
      zone(-w / 2 + 1.4, z0 - 2.6, 1.6, 3.6, { shake: 1, label: 'SPIN CYCLE' }),
    ] };
  },
  stream(ctx, z0) {
    const w = 8, len = 8, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, planks('#3a2d4f', '#2a2040', 6));
    const deskZ = z0 - len + 1;
    ctx.place('furniture', 'desk', 0, deskZ, 0);
    ctx.place('furniture', 'computerScreen', 0, deskZ - .25, 0, false).then(m => m.position.y = .76);
    ctx.place('furniture', 'chairDesk', 0, deskZ + 1.2, Math.PI, false);
    for (const s of [-1, 1]) ctx.place('furniture', 'speaker', s * 1.3, deskZ - .2, 0);
    const neon = new THREE.PointLight('#a970ff', 6, 7); neon.position.set(0, 2, deskZ + .5); ctx.scene.add(neon);
    return { name: 'YOUR STREAM DESK', len, w, slots: [], hazards: [], finish: { x: 0, z: deskZ + 1.2, r: .9 } };
  },
};
