import * as THREE from 'three';
import { INGREDIENTS } from './recipe.js';
import { textTexture } from './assets.js';

// VISUAL CUES: everything that tells you what is going on without reading text.
//   beams       tall coloured light over each fruit you still need (and over the hut once the drink is done)
//   route arrow chevron on the boards pointing along the boardwalk to the next goal (fishbone routing)
//   gap tape    caution strips + HOP sign at every gap in the boards
//   target ring red ring that tightens on your feet while a sniper is aiming
//   barrel lane red strip down the boards in front of a rolling barrel
//   pour ring   progress ring over the fruit while you hold E
export const GAPS = [[0, -20, 'z'], [0, -55.2, 'z'], [6.7, -64, 'x']];

function gradientTex() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 128); grd.addColorStop(0, '#fff0'); grd.addColorStop(.7, '#fff6'); grd.addColorStop(1, '#fffc');
  g.fillStyle = grd; g.fillRect(0, 0, 4, 128); const t = new THREE.CanvasTexture(c); return t;
}

export function createGuide(scene, { recipe, actors, level }) {
  // ramp markers: green "climb out here" signs, shown only while you're swimming
  const exitTex = textTexture('CLIMB', { w: 256, h: 96, bg: '#2fbf71', fg: '#fff', font: '900 60px system-ui' });
  const exitSigns = level.exits.map(e => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: exitTex, depthTest: false })); s.scale.set(1.1, .42, 1); s.position.set(e.x, .2, e.z); s.renderOrder = 9; s.visible = false; scene.add(s); return s; });
  const beamGeo = new THREE.CylinderGeometry(.55, .55, 24, 18, 1, true).translate(0, 12, 0), beamTex = gradientTex();
  const beam = (x, z, color) => { const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color, map: beamTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.position.set(x, 0, z); scene.add(m); return m; };
  const beams = recipe.stations.filter(s => s.want).map(s => ({ s, m: beam(s.x, s.z, INGREDIENTS[s.id].color) }));
  const hutBeam = beam(level.finish.x, level.finish.z - 1, '#a970ff'); hutBeam.visible = false;

  // route arrow: flat chevron on the boards
  const sh = new THREE.Shape(); sh.moveTo(0, .55); sh.lineTo(.42, .05); sh.lineTo(.2, .05); sh.lineTo(.2, -.4); sh.lineTo(-.2, -.4); sh.lineTo(-.2, .05); sh.lineTo(-.42, .05); sh.closePath();
  const arrowMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .85, depthWrite: false, fog: false });
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2).scale(1.3, 1, 1.3), arrowMat); arrow.renderOrder = 3; scene.add(arrow);

  // gap tape + HOP signs
  const tapeMat = new THREE.MeshBasicMaterial({ color: '#ffb020' }), hopTex = textTexture('HOP', { w: 256, h: 96, bg: '#ffb020', fg: '#1b1530', font: '900 64px system-ui' });
  const hops = GAPS.map(([x, z, ax]) => {
    for (const d of [-1.2, 1.2]) { const t = new THREE.Mesh(new THREE.BoxGeometry(ax === 'z' ? 1.9 : .14, .03, ax === 'z' ? .14 : 1.9), tapeMat); t.position.set(ax === 'x' ? x + d * .6 : x, .01, ax === 'z' ? z + d * .85 : z); scene.add(t); }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: hopTex, depthTest: false })); s.scale.set(.9, .34, 1); s.position.set(x, 1.1, z); s.renderOrder = 9; scene.add(s); return s;
  });

  // sniper target ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(.5, .62, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ff2040', transparent: true, depthWrite: false, fog: false })); ring.renderOrder = 4; scene.add(ring);
  // barrel lanes (pooled)
  const laneMat = new THREE.MeshBasicMaterial({ color: '#ff3b2f', transparent: true, opacity: .3, depthWrite: false });
  const lanes = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 10).rotateX(-Math.PI / 2).translate(0, .02, 5), laneMat); m.visible = false; scene.add(m); return m; });

  // pour ring: canvas sprite with a progress arc and the E key
  const pc = document.createElement('canvas'); pc.width = pc.height = 128; const pg = pc.getContext('2d'); const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace;
  const pour = new THREE.Sprite(new THREE.SpriteMaterial({ map: ptex, depthTest: false })); pour.scale.setScalar(.9); pour.renderOrder = 12; scene.add(pour);
  let lastP = -1, lastC = '';
  const drawPour = (p, color) => {
    if (Math.abs(p - lastP) < .02 && color === lastC) return; lastP = p; lastC = color;
    pg.clearRect(0, 0, 128, 128); pg.fillStyle = '#1b1530dd'; pg.beginPath(); pg.arc(64, 64, 54, 0, 7); pg.fill();
    pg.lineWidth = 12; pg.strokeStyle = '#ffffff33'; pg.beginPath(); pg.arc(64, 64, 52, 0, 7); pg.stroke();
    pg.strokeStyle = color; pg.lineCap = 'round'; pg.beginPath(); pg.arc(64, 64, 52, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); pg.stroke();
    pg.fillStyle = '#fff'; pg.font = '900 56px system-ui'; pg.textAlign = 'center'; pg.textBaseline = 'middle'; pg.fillText('E', 64, 68); ptex.needsUpdate = true;
  };

  // next goal with fishbone routing: get to the spine, walk it to the target's row, then go across
  function goal(p) {
    const left = recipe.stations.filter(s => s.want && !s.got).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    const T = left ? { x: left.x, z: left.z, color: INGREDIENTS[left.id].color } : { x: level.finish.x, z: level.finish.z, color: '#c9a2ff' };
    const rowOf = z => [-16, -48, -64].find(r => Math.abs(z - r) < 3.2);
    const onBranch = Math.abs(p.x) > 2.6 && rowOf(p.z) !== undefined;
    if (onBranch) return rowOf(p.z) === rowOf(T.z) && Math.sign(p.x) === Math.sign(T.x || p.x) ? { ...T, final: T } : { x: 0, z: rowOf(p.z) ?? p.z, color: T.color, final: T };
    if (Math.abs(p.x) > .6 && Math.abs(p.z - T.z) > .5) return { x: 0, z: p.z + Math.sign(T.z - p.z) * 1.5, color: T.color, final: T }; // recentre on the spine
    if (Math.abs(p.z - T.z) > .5 && T.x !== 0) return { x: 0, z: T.z, color: T.color, final: T }; // walk the spine to the row first
    return { ...T, final: T };
  }

  return {
    goal,
    update(t, player, playing, run) {
      const swim = !!run?.swimming;
      for (const s of exitSigns) { s.visible = swim && Math.hypot(s.position.x - player.pos.x, s.position.z - player.pos.z) < 16; s.position.y = .2 + Math.sin(t * 5) * .1; }
      const fade = (x, z) => Math.min(1, Math.max(.12, (Math.hypot(x - player.pos.x, z - player.pos.z) - 2.5) / 9)); // thin out up close
      for (const b of beams) { b.m.visible = !b.s.got; b.m.material.opacity = (.75 + Math.sin(t * 3 + b.s.x) * .2) * fade(b.s.x, b.s.z); }
      hutBeam.visible = recipe.done; hutBeam.material.opacity = .8 + Math.sin(t * 5) * .2;
      const p = player.pos, ex = swim && run.nearestExit(p), g = ex ? { ...ex, color: '#5dffa0', final: { ...ex, x: ex.x + 99 } } : goal(p), dx = g.x - p.x, dz = g.z - p.z, d = Math.hypot(dx, dz), fd = Math.hypot(g.final.x - p.x, g.final.z - p.z);
      arrow.visible = playing && (swim || fd > 2.6);
      if (arrow.visible) {
        const k = 2.4 + Math.sin(t * 6) * .15; arrow.position.set(p.x + dx / d * k, player.y + (swim ? .6 : .14), p.z + dz / d * k);
        arrow.rotation.y = Math.atan2(-dx, -dz); arrowMat.color.set(g.color);
      }
      for (const h of hops) { const near = Math.hypot(h.position.x - p.x, h.position.z - p.z); h.visible = near < 14; h.position.y = 1.1 + Math.sin(t * 4) * .08; }
      // sniper aim ring: tightens as the shot gets closer; flashes white just before firing
      const aiming = actors.list.filter(a => a.kind === 'sniper' && !a.ball && a.aim < 1.4).sort((a, b) => a.aim - b.aim)[0];
      ring.visible = !!aiming;
      if (aiming) { ring.position.set(p.x, player.y + .03, p.z); ring.scale.setScalar(1 + aiming.aim * 1.6); ring.material.color.set(aiming.aim < .35 && Math.sin(t * 50) > 0 ? '#ffffff' : '#ff2040'); }
      let i = 0;
      for (const a of actors.list) if (a.kind === 'barrel' && i < lanes.length) { const l = lanes[i++]; l.visible = true; l.position.set(a.x, 0, a.z); }
      for (; i < lanes.length; i++) lanes[i].visible = false;
      laneMat.opacity = .22 + Math.sin(t * 12) * .1;
      const near = recipe.near; pour.visible = !!near;
      if (near) { pour.position.set(near.x, 2.3 + Math.sin(t * 3) * .05, near.z); drawPour(Math.min(1, near.hold / .9), INGREDIENTS[near.id].color); }
    },
  };
}
