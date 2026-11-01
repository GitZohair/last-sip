import * as THREE from 'three';
import { icon } from './icons.js';
import { PADS, TOWERS } from './island.js';
import { BAR } from './shift.js';
import { GAPS } from './guide.js';

// Screen-space cues: edge arrows for threats you can't see, floating hit/pickup text, a minimap, wind arrow.
const v = new THREE.Vector3();
const RUNS = [[0, 4, 0, -19], [0, -21, 0, -84], [-14, -16, 14, -16], [-14, -48, 14, -48], [-14, -64, 14, -64]];

export function createHudCues(root) {
  root.querySelector('#cues')?.remove();
  const box = document.createElement('div'); box.id = 'cues'; root.appendChild(box);
  const edges = [0, 1, 2, 3, 4].map(() => { const e = document.createElement('div'); e.className = 'edge'; e.innerHTML = '<i></i><span></span>'; box.appendChild(e); return e; });
  const windEl = document.createElement('div'); windEl.id = 'wind'; windEl.innerHTML = icon('gust') + '<b>&#10140;</b>'; box.appendChild(windEl);
  const flash = document.createElement('div'); flash.id = 'hitflash'; box.appendChild(flash); let hitN = 0;
  const onKey = e => { if (e.code === 'KeyM' || e.code === 'Tab') { e.preventDefault(); box.classList.toggle('map'); } }; addEventListener('keydown', onKey); // minimap on demand
  const map = document.createElement('canvas'); map.id = 'minimap'; box.appendChild(map);
  const W = 132, H = 236, S = 2; map.width = W * S; map.height = H * S; const g = map.getContext('2d'); g.scale(S, S);
  const mx = x => W / 2 + x * 2.6, mz = z => H - 14 - (6 - z) * 2.3; // forward (-z) is up

  function onScreen(camera, x, y, z) { v.set(x, y, z).project(camera); return v; }
  function edge(el, camera, pos, color, ico, label) {
    const p = onScreen(camera, pos.x, pos.y, pos.z), behind = p.z > 1;
    let x = behind ? -p.x : p.x, y = behind ? -p.y : p.y;
    if (!behind && Math.abs(x) < .92 && Math.abs(y) < .88) { el.classList.remove('on'); return; }
    if (behind && Math.abs(y) < .3) y = -.6; // behind you: show at the bottom edge
    const a = Math.atan2(y, x), k = Math.min(.9 / Math.abs(Math.cos(a)), .82 / Math.abs(Math.sin(a)));
    el.style.transform = `translate(${(Math.cos(a) * k * .5 + .5) * innerWidth}px, ${(-Math.sin(a) * k * .5 + .5) * innerHeight}px)`;
    el.style.setProperty('--c', color); el.querySelector('i').style.transform = `rotate(${-a}rad)`;
    const sp = el.querySelector('span'); if (sp.dataset.k !== ico + label) { sp.dataset.k = ico + label; sp.innerHTML = icon(ico) + (label ? `<em>${label}</em>` : ''); }
    el.classList.add('on');
  }

  let mapT = 0;
  function drawMap(run, player) {
    g.clearRect(0, 0, W, H); g.fillStyle = '#0e2a3acc'; g.beginPath(); g.roundRect(0, 0, W, H, 14); g.fill();
    g.strokeStyle = '#e8c79a'; g.lineWidth = 4; g.lineCap = 'round';
    for (const [x0, z0, x1, z1] of RUNS) { g.beginPath(); g.moveTo(mx(x0), mz(z0)); g.lineTo(mx(x1), mz(z1)); g.stroke(); }
    g.strokeStyle = '#0e2a3a'; g.lineWidth = 5; for (const [x, z, ax] of GAPS) { g.beginPath(); g.moveTo(mx(x) - (ax === 'z' ? 3 : 0), mz(z) - (ax === 'x' ? 3 : 0)); g.lineTo(mx(x) + (ax === 'z' ? 3 : 0), mz(z) + (ax === 'x' ? 3 : 0)); g.stroke(); }
    for (const [, [x, z]] of Object.entries(PADS)) { g.fillStyle = '#d9c39a55'; g.beginPath(); g.arc(mx(x), mz(z), 5, 0, 7); g.fill(); }
    g.fillStyle = '#a970ff'; g.fillRect(mx(BAR.x) - 5, mz(BAR.z) - 5, 10, 10); // the bar
    for (const c of run.shift.customers) if (c.mood === 'wait') { g.fillStyle = c.color; g.beginPath(); g.arc(mx(c.x), mz(c.z), 6, 0, 7); g.fill(); if (run.glass.glasses.some(q => q.id === c.id)) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); } }
    for (const [x, z] of TOWERS) { const busy = run.actors.list.some(a => a.tower && a.tower.x === x && a.tower.z === z); g.fillStyle = busy ? '#ff2040' : '#ffffff40'; g.fillRect(mx(x) - 3, mz(z) - 3, 6, 6); }
    for (const a of run.actors.list) if (a.kind === 'barrel') { g.fillStyle = '#ffb020'; g.beginPath(); g.arc(mx(a.x), mz(a.z), 3.5, 0, 7); g.fill(); }
    const bot = run.hazards.vacuum.mesh.position; if (run.hazards.vacuum.distance < 90) { g.fillStyle = '#ff3b5c'; g.beginPath(); g.arc(mx(bot.x), mz(bot.z), 3.5, 0, 7); g.fill(); }
    g.save(); g.translate(mx(player.pos.x), mz(player.pos.z)); g.rotate(player.yaw); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2); g.lineTo(-5, 5); g.closePath(); g.fill(); g.restore();
  }

  return {
    pop(text, color = '#fff', big = false) {
      const el = document.createElement('div'); el.className = 'pop' + (big ? ' big' : ''); el.textContent = text; el.style.color = color;
      el.style.left = `${50 + (Math.random() - .5) * 8}%`; box.appendChild(el); setTimeout(() => el.remove(), 1400);
    },
    update(dt, run, player, camera, wind) {
      let i = 0;
      for (const a of run.actors.list) {
        if (i >= edges.length - 1) break;
        if (a.kind === 'sniper') edge(edges[i++], camera, { x: a.tower.x, y: a.tower.y + 1, z: a.tower.z }, '#ff2040', 'cannon', a.user);
        else if (a.kind === 'barrel' && !a.sunk) edge(edges[i++], camera, { x: a.x, y: .5, z: a.z }, '#ffb020', 'barrel', '');
      }
      for (const c of run.shift.customers) { // customers whose drink you're carrying, when they're off screen
        if (i >= edges.length - 1 || c.mood !== 'wait' || !run.glass.glasses.some(q => q.id === c.id)) continue;
        edge(edges[i++], camera, { x: c.x, y: 1.5, z: c.z }, c.color, 'glass', c.user);
      }
      const vac = run.hazards.vacuum;
      if (vac.distance < 9 && !vac.stunned) edge(edges[i++], camera, { x: vac.mesh.position.x, y: .3, z: vac.mesh.position.z }, '#ff3b5c', 'cannon', 'LOOSE CANNON');
      for (; i < edges.length; i++) edges[i].classList.remove('on');
      // hit direction: red glow on the screen edge the hit came FROM
      if (run.lastHit && run.lastHit.n !== hitN) {
        hitN = run.lastHit.n; const o = onScreen(camera, player.pos.x, player.y + 1, player.pos.z).clone(), f = onScreen(camera, player.pos.x - run.lastHit.x * 3, player.y + 1, player.pos.z - run.lastHit.z * 3);
        let ax = f.x - o.x, ay = f.y - o.y; if (f.z > 1) { ax = -ax; ay = -ay; } const l = Math.hypot(ax, ay) || 1;
        flash.style.background = `radial-gradient(ellipse at ${50 + ax / l * 55}% ${50 - ay / l * 55}%, #ff2040cc, #ff204000 55%)`;
        flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
      }
      // wind: arrow points the way the gust pushes, in screen space
      const ws = wind?.state;
      box.classList.toggle('windy', !!ws); box.classList.toggle('windwarn', ws === 'warn');
      if (ws) {
        const a0 = onScreen(camera, player.pos.x, 1, player.pos.z).clone(), a1 = onScreen(camera, player.pos.x + wind.dir * 3, 1, player.pos.z);
        windEl.querySelector('b').style.transform = `rotate(${-Math.atan2(a1.y - a0.y, a1.x - a0.x)}rad)`;
      }
      if (box.classList.contains('map') && (mapT -= dt) <= 0) { mapT = .1; drawMap(run, player); }
    },
    remove() { box.remove(); removeEventListener('keydown', onKey); },
  };
}
