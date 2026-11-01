export const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let blameTimer = 0, bannerTimer = 0, blameAcc = 0, blameName = '';

export const ui = {
  bind({ start, connect, simulate, lock }) {
    $('start').onclick = start; $('again').onclick = start;
    $('connect').onclick = () => { const v = $('channel').value.trim(); if (v) { connect(v); localStorage.setItem('lastsip:channel', v); } };
    $('channel').value = localStorage.getItem('lastsip:channel') || '';
    document.querySelectorAll('[data-sim]').forEach(b => b.onclick = () => simulate(b.dataset.sim));
    $('world').onclick = lock;
    addEventListener('keydown', e => { if (e.code === 'KeyR' && !$('results').hidden) start(); });
  },
  ready() { $('loading').hidden = true; $('start').disabled = false; },
  show(id) { for (const x of ['intro', 'hud', 'results']) $(x).hidden = x !== id; },
  chatStatus(s, c) { $('chat-status').textContent = s === 'connected' ? `● LIVE · #${c}` : s === 'reconnecting' ? `◌ reconnecting #${c}` : '○ not connected'; $('chat-status').dataset.state = s; },
  feed(text, kind = 'chaos') {
    const li = document.createElement('li'); li.textContent = text; li.className = kind; $('feed').prepend(li);
    while ($('feed').children.length > 6) $('feed').lastChild.remove();
    setTimeout(() => li.classList.add('old'), 6000);
  },
  banner(title, by) { $('banner').innerHTML = `<b>${esc(title)}</b><span>courtesy of ${esc(by)}</span>`; $('banner').classList.add('on'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => $('banner').classList.remove('on'), 2200); },
  blame(name, amount) {
    if (name !== blameName) { blameName = name; blameAcc = 0; }
    blameAcc += amount;
    if (blameAcc < .01) return;
    $('blame').innerHTML = `−${Math.round(blameAcc * 100)}% <span>${esc(name)}</span>`; $('blame').classList.add('on');
    clearTimeout(blameTimer); blameTimer = setTimeout(() => { $('blame').classList.remove('on'); blameAcc = 0; }, 1400);
  },
  hud({ water, time, room, hazard, steady, calm, lights, progress }) {
    $('water').textContent = Math.round(water * 100); $('water-fill').style.height = `${water * 100}%`;
    $('timer').textContent = Math.max(0, time).toFixed(1); $('room').textContent = room;
    $('hazard').textContent = hazard ? `⚠ ${hazard}` : calm ? '🫶 CHAT IS STEADYING YOU' : steady ? 'CAREFUL STEPS' : '';
    $('progress-fill').style.width = `${progress * 100}%`;
    document.body.classList.toggle('dark', lights); document.body.classList.toggle('low', water < .25);
  },
  results({ success, water, time, score, credits, seed, channel }) {
    ui.show('results');
    $('r-title').textContent = !success ? (water <= .001 ? 'Bone dry.' : 'The stream started without you.') : water > .7 ? 'Hydrated. Respect.' : water > .3 ? 'Technically a drink.' : 'One. Last. Sip.';
    $('r-stats').innerHTML = `<div><b>${Math.round(water * 100)}%</b><span>WATER</span></div><div><b>${time.toFixed(1)}s</b><span>TIME</span></div><div><b>${score}</b><span>SCORE</span></div>`;
    $('credits').innerHTML = credits.length ? credits.map((c, i) => `<li style="animation-delay:${i * .35}s"><span>${esc(c.name)}</span><b>${Math.round(c.amount * 100)}%</b></li>`).join('') : '<li><span>Nobody. A perfect pour.</span></li>';
    $('share').onclick = () => navigator.clipboard?.writeText(`LAST SIP ${seed}${channel ? ' #' + channel : ''}: ${Math.round(water * 100)}% water, ${time.toFixed(1)}s. Top spiller: ${credits[0]?.name || 'nobody'} 💧`);
  },
};
