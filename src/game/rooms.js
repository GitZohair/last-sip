import { checker, planks } from './assets.js';
import { zone, patrol, launcher } from './roomkit.js';
import { MORE } from './rooms2.js';

// Each room: build(ctx, z0, r) -> { name, len, w, hazards, slots, finish?, sleeper? }.
// ctx.place(kit, name, x, z, rotY, solid=true) places a Kenney model (+collider). Course runs toward -z.
// Rooms are arenas, not corridors: every room has a blocker in the middle that splits it into routes.
const L = Math.PI / 2, R = -Math.PI / 2;

export const ROOMS = {
  kitchen(ctx, z0, r) {
    const w = 11, len = 12, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, checker('#f3ead8', '#d9c9a8', 8));
    const run = ['kitchenCabinet', 'kitchenCabinetDrawer', 'kitchenSink', 'kitchenCabinet', 'kitchenStove', 'kitchenCabinet', 'kitchenCabinetDrawer', 'kitchenCoffeeMachine'];
    run.forEach((n, i) => ctx.place('furniture', n === 'kitchenCoffeeMachine' ? 'kitchenCabinet' : n, -w / 2 + .5, z0 - 1.5 - i, L));
    ctx.place('furniture', 'kitchenCoffeeMachine', -w / 2 + .45, z0 - 8.5, L, false).then(m => m.position.y = .9);
    ctx.place('furniture', 'hoodModern', -w / 2 + .35, z0 - 5.5, L, false).then(m => m.position.y = 1.7);
    ctx.place('furniture', 'kitchenFridgeLarge', w / 2 - .6, z0 - 1.4, R);
    ctx.place('furniture', 'kitchenFridgeSmall', w / 2 - .5, z0 - 3, R);
    // The island: a bar run across the middle with one end open; the toaster on it lobs donuts at you.
    const ix = r() > .5 ? 1 : -1, iz = zc - .5;
    for (let i = 0; i < 4; i++) ctx.place('furniture', i === 3 ? 'kitchenBarEnd' : 'kitchenBar', ix * (-2.6 + i * 1.05), iz, ix > 0 ? 0 : Math.PI);
    for (let i = 0; i < 4; i++) ctx.place('furniture', 'stoolBar', ix * (-2.6 + i * 1.05), iz + 1, r.range(0, 6), false);
    const tx = ix * -1.5;
    ctx.place('furniture', 'toaster', tx, iz, 0, false).then(m => m.position.y = .95);
    ctx.place('furniture', 'kitchenBlender', ix * -.3, iz, 0, false).then(m => m.position.y = .95);
    ctx.place('furniture', 'tableRound', ix * -2.8, z0 - len + 2.4, 0);
    for (const a of [0, 2.1, 4.2]) ctx.place('furniture', 'chairCushion', ix * -2.8 + Math.sin(a) * 1.1, z0 - len + 2.4 + Math.cos(a) * 1.1, a + Math.PI, false);
    ctx.place('furniture', 'trashcan', w / 2 - .5, z0 - len + 1, 0);
    return { name: 'THE KITCHEN', len, w, slots: [], hazards: [launcher(tx, 1.25, iz, { label: 'TOASTER', every: 2.2, range: 6.5 })] };
  },
  hallway(ctx, z0, r) {
    const w = 5, len = 20, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, planks('#a8754f', '#7d5539', 10));
    const slots = [];
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) slots.push({ x: s * (w / 2 - .12), y: 1.6, z: z0 - 2 - i * 3 - (s > 0 ? 1.5 : 0), rot: s > 0 ? R : L });
    ctx.place('furniture', 'coatRackStanding', -w / 2 + .4, z0 - 1.2, 0);
    // Benches alternate sides: a slalom. Low enough to hop.
    for (let i = 0; i < 4; i++) { const s = i % 2 ? 1 : -1; ctx.place('furniture', i % 2 ? 'benchCushion' : 'bench', s * (w / 2 - .45), z0 - 4 - i * 4 + r.range(-.6, .6), s > 0 ? R : L); }
    ctx.place('furniture', 'pottedPlant', w / 2 - .35, z0 - len + 1.2, 0);
    const rugZ = zc + r.range(-3, 2);
    const rug = ctx.place('furniture', 'rugRectangle', 0, rugZ, L, false);
    return { name: 'THE CHAT GALLERY', len, w, slots, hazards: [
      zone(0, rugZ, 1.8, 3.4, { push: { x: 0, z: 3.4 }, label: 'RUG PULL', update(t) { rug.then(m => m.children[0] && (m.children[0].position.z = ((t * 3.2) % .6) - .3)); } }),
      patrol(ctx, -w / 2 + .7, w / 2 - .7, z0 - 7.5, 1.5, r.range(0, 6)),
      patrol(ctx, -w / 2 + .7, w / 2 - .7, z0 - len + 3.5, 1.9, r.range(0, 6)),
    ] };
  },
  living(ctx, z0, r) {
    const w = 14, len = 18, zc = z0 - len / 2;
    ctx.shell.floor(0, zc, w, len, checker('#6f8fa8', '#6688a0', 14, 32));
    ctx.place('furniture', 'rugRound', 0, zc, 0, false); ctx.place('furniture', 'rugSquare', 0, z0 - len + 4, 0, false);
    // Sofa slalom: alternating sofas + ottomans force a weave across the whole width.
    const sofas = ['loungeSofa', 'loungeSofaLong', 'loungeDesignSofa', 'loungeSofaCorner'];
    for (let i = 0; i < 4; i++) { const s = i % 2 ? 1 : -1; ctx.place('furniture', sofas[i], s * r.range(1.8, 3.2), z0 - 3 - i * 3.6, s > 0 ? R : L); ctx.place('furniture', 'loungeSofaOttoman', -s * r.range(.5, 2), z0 - 4.6 - i * 3.6, 0); }
    ctx.place('furniture', 'tableCoffeeGlass', r.range(-1, 1), zc, 0);
    ctx.place('furniture', 'cabinetTelevision', -w / 2 + .5, zc, L);
    ctx.place('furniture', 'televisionModern', -w / 2 + .5, zc, L, false).then(m => m.position.y = .62);
    for (const z of [z0 - 2, z0 - len + 2]) ctx.place('furniture', 'loungeChairRelax', w / 2 - 1, z, R);
    ctx.place('furniture', 'lampSquareFloor', w / 2 - .5, z0 - 1, 0);
    const fan = ctx.place('furniture', 'ceilingFan', 0, zc, 0, false); fan.then(m => m.position.y = 2.5);
    const dir = r() > .5 ? 1 : -1;
    return { name: 'THE LIVING ROOM', len, w, slots: [], hazards: [
      zone(0, zc, 9, 7, { label: 'CEILING FAN', update(t) { this.push = { x: dir * 2.6 * Math.max(0, Math.sin(t * .9)), z: 0 }; fan.then(m => m.rotation.y = t * 9); } }),
      patrol(ctx, -w / 2 + 1, w / 2 - 1, z0 - len + 4, 1.2, r.range(0, 6), 'radio', 'BOOMBOX BOT'),
    ] };
  },
  ...MORE,
};
