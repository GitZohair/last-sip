import * as THREE from 'three';
import { model } from './assets.js';

// Voice set pieces. Both read `voice` (see voice.js): level 0..1, loud, noise.

// SMART LOCK: the door into your stream room only opens if you SHOUT at the smart speaker.
// Hold the shout for ~1.2 s within 3.5 m. The ring fills as you yell; yelling also shakes your glass.
export async function voiceDoor(scene, colliders, d) {
  const W = 1.8, H = 2.25;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(W, H, .08), new THREE.MeshStandardMaterial({ color: '#2e2a3a', roughness: .35, metalness: .3 }));
  panel.position.set(d.x, H / 2, d.z); panel.castShadow = true; scene.add(panel);
  const col = { minX: d.x - W / 2, maxX: d.x + W / 2, minZ: d.z - .12, maxZ: d.z + .12, top: H }; colliders.push(col);
  const spk = await model('furniture', 'speakerSmall'); spk.position.set(d.x + W / 2 + .45, 1.2, d.z + .2); scene.add(spk);
  const ringMat = new THREE.MeshStandardMaterial({ color: '#a970ff', emissive: '#a970ff', emissiveIntensity: .4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .05, 12, 48, .001), ringMat); ring.position.set(d.x, 1.6, d.z + .06); scene.add(ring);
  const state = { kind: 'voiceDoor', label: 'SMART LOCK', x: d.x, z: d.z, charge: 0, open: false, near: false };
  state.update = (t, player, dt, voice) => {
    state.near = !state.open && Math.abs(player.pos.z - d.z) < 3.5 && Math.abs(player.pos.x - d.x) < 3;
    if (state.open) { panel.position.y = Math.min(H * 1.5, panel.position.y + dt * 4); return null; }
    if (state.near && voice?.loud) state.charge = Math.min(1, state.charge + dt / 1.2); else state.charge = Math.max(0, state.charge - dt * .35);
    ring.geometry.dispose(); ring.geometry = new THREE.TorusGeometry(.42, .05, 12, 48, Math.max(.001, state.charge * Math.PI * 2));
    ringMat.emissiveIntensity = .4 + state.charge * 3 + (voice?.loud && state.near ? Math.sin(t * 30) * .5 : 0);
    if (state.charge >= 1) { state.open = true; col.disabled = true; ringMat.color.set('#5dff9b'); ringMat.emissive.set('#5dff9b'); return { opened: true }; }
    return null;
  };
  return state;
}

// THE ROOMMATE: asleep in the bedroom. Noise in the room fills their alert meter; at 100% they wake up
// and hurl pillows at you for 4 s, then drift back to sleep. Whisper-walk (Shift) to sneak past.
export function roommate(room, props) {
  if (!room?.sleeper) return null;
  const { x, z } = room.sleeper; let m = null; room.sleeper.model.then(o => m = o);
  const s = { kind: 'roommate', label: 'THE ROOMMATE', alert: 0, awake: 0, inRoom: false, next: 0 };
  s.update = (t, player, dt, voice) => {
    s.inRoom = player.pos.z <= room.z0 && player.pos.z > room.z1;
    if (s.awake > 0) {
      s.awake -= dt; if (m) m.rotation.x = -.1 + Math.sin(t * 20) * .08;
      if (t > s.next) {
        s.next = t + .55; const dx = player.pos.x - x, dz = player.pos.z - z, d = Math.hypot(dx, dz) || 1, fl = .5 + d * .06;
        props.spawn('pillow', x, 1.4, z, { x: (dx + player.vel.x * fl) / fl, z: (dz + player.vel.z * fl) / fl, y: 3, life: 5 });
      }
      if (s.awake <= 0) { s.alert = 0; if (m) m.rotation.x = -1.2; }
      return null;
    }
    const n = s.inRoom ? voice?.noise || 0 : 0;
    s.alert = n > .3 ? Math.min(1, s.alert + dt * n * 1.1) : Math.max(0, s.alert - dt * .25);
    if (m) m.position.y = .45 + Math.sin(t * 2) * .02 + s.alert * .15;
    if (s.alert >= 1) { s.awake = 4; s.next = t + .4; return { woke: true }; }
    return null;
  };
  return s;
}
