import { icon } from './icons.js';
export const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const set = (id, v) => { const el = $(id); if (el && el.textContent !== String(v)) el.textContent = v; }; // avoid layout churn
let blameT = 0, slotT = 0, blameAcc = 0, blameName = '', hudLast = 0;
const MOD_LABEL = { moon: 'MOON GRAVITY', tilt: 'TILTED', tiny: 'TINY', bigglass: 'BIG GLASS', lava: 'LAVA FLOOR', mirror: 'MIRRORED', drunk: 'WOBBLY', hyper: 'HYPER', fog: 'SMOKE', disco: 'DISCO', lid: 'LID ON', slowmo: 'SLOW-MO', soft: 'CUSHIONED' };
const MOD_ICON = { soft: 'pillows' };
const REEL = ['bomb', 'banana', 'ducks', 'fridge', 'moon', 'disco', 'lava', 'cans', 'balls', 'gust'];
let modsKey = '', trickT = 0;

export const ui = {
  bind({ start, practice, connect, mic, signIn, lock }) {
    $('start').onclick = start; $('practice').onclick = practice; $('again').onclick = practice; $('home').onclick = () => location.reload();
    $('connect').onclick = () => { const v = $('channel').value.trim().replace(/^.*twitch\.tv\//, ''); if (v) connect(v); };
    $('channel').value = localStorage.getItem('lastsip:channel') || '';
    $('signin').onclick = signIn;
    $('mic-on').onclick = async () => { $('mic-on').textContent = (await mic()) ? 'MICROPHONE ON' : 'MIC BLOCKED: HOLD V TO SHOUT'; };
    $('world').onclick = lock;
    addEventListener('keydown', e => { if (e.code === 'KeyR' && !$('results').hidden) practice(); });
  },
  intro({ number, daily, canSignIn }) {
    set('day-no', `#${number}`);
    $('start').textContent = daily.poured ? 'TODAY\'S POUR IS DONE' : 'THE POUR (TODAY\'S OFFICIAL RUN)';
    $('start').disabled = true; $('start').dataset.done = daily.poured ? '1' : '';
    set('streak', daily.streak > 0 ? `${daily.streak}-day streak` : 'Start a streak today');
    $('signin').hidden = !canSignIn;
  },
  ready() { $('loading').hidden = true; $('start').disabled = !!$('start').dataset.done; $('practice').disabled = false; },
  loading(on) { $('loading').hidden = !on; },
  signedIn(login) { $('signin').textContent = `Signed in as ${login}`; $('signin').disabled = true; },
  show(id) { for (const x of ['intro', 'hud', 'results']) $(x).hidden = x !== id; },
  mode(text) { set('mode', text); },
  chatStatus(s, c) { set('chat-status', s === 'connected' ? `● LIVE · #${c}` : s === 'reconnecting' ? `◌ reconnecting #${c}` : '○ not connected'); $('chat-status').dataset.state = s; },
  feed(text, kind = 'chaos', ico = '') {
    const li = document.createElement('li'); li.className = kind; li.innerHTML = `${icon(ico)}<span>${esc(text)}</span>`; $('feed').prepend(li);
    while ($('feed').children.length > 6) $('feed').lastChild.remove();
    setTimeout(() => li.classList.add('old'), 6000);
  },
  // slot reel: spins through icons then lands on the card (variable-reward reveal for viewers)
  slot(card, by) {
    const el = $('slot'); el.className = `on r-${card.r}${card.help ? ' help' : ''}`;
    let i = 0; clearInterval(el._spin);
    el._spin = setInterval(() => { el.innerHTML = `<b>${icon(REEL[i++ % REEL.length], 'reel')}</b><span>${esc(by)} pulled the lever</span>`; if (i > 7) { clearInterval(el._spin); el.innerHTML = `<b>${icon(card.id, 'reel')}</b><strong>${esc(card.label)}</strong><span>${card.r === 'l' ? 'LEGENDARY · ' : card.r === 'r' ? 'RARE · ' : ''}${esc(by)}</span>`; } }, 55);
    clearTimeout(slotT); slotT = setTimeout(() => el.className = '', 2800);
  },
  blame(name, amount) {
    if (name !== blameName) { blameName = name; blameAcc = 0; }
    blameAcc += amount; if (blameAcc < .01) return;
    $('blame').innerHTML = `−${Math.round(blameAcc * 100)}% <span>${esc(name)}</span>`; $('blame').classList.add('on');
    clearTimeout(blameT); blameT = setTimeout(() => { $('blame').classList.remove('on'); blameAcc = 0; }, 1400);
  },
  trick(t) {
    const el = $('trick'); el.innerHTML = `<b>${t.label}</b><span>+${t.gained}${t.combo > 1 ? `  x${t.combo}` : ''}</span>`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(trickT); trickT = setTimeout(() => el.classList.remove('on'), 1300);
  },
  catchPrompt(on) { $('catch').classList.toggle('on', on); },
  lastSip() { document.body.classList.add('lastsip'); setTimeout(() => document.body.classList.remove('lastsip'), 2500); },
  hud({ water, danger, time, room, hazard, steady, calm, mods, progress, vacuum = 99, style, voice }) {
    const now = performance.now(); if (now - hudLast < 80) return; hudLast = now;
    set('water', Math.round(water * 100)); $('water-fill').style.transform = `scaleY(${water})`;
    $('danger').style.transform = `scaleX(${danger})`; $('danger').dataset.hot = danger > .85 ? '1' : '';
    set('timer', Math.max(0, time).toFixed(1)); set('room', room);
    set('hazard', hazard ? hazard : calm ? 'CHAT IS STEADYING YOU' : steady ? 'CAREFUL STEPS' : '');
    const key = mods.join(); if (key !== modsKey) { modsKey = key; $('mods').innerHTML = mods.filter(m => MOD_LABEL[m]).map(m => `<span>${icon(MOD_ICON[m] || m)}${MOD_LABEL[m]}</span>`).join(''); }
    const near = Math.max(0, Math.min(1, 1 - (vacuum - 1) / 7)); $('vac').style.opacity = vacuum < 8 ? 1 : 0; $('vac-fill').style.transform = `scaleX(${near})`; $('vac').dataset.hot = vacuum < 2.5 ? '1' : '';
    if (voice) { const v = $('voice'); v.style.opacity = voice.level > .08 || voice.lock >= 0 || voice.alert >= 0 ? 1 : .35; $('voice-fill').style.transform = `scaleY(${voice.level.toFixed(3)})`; v.dataset.mode = voice.alert >= 0 ? 'quiet' : voice.lock >= 0 ? 'lock' : ''; $('voice-goal').style.transform = `scaleY(${Math.max(0, voice.lock >= 0 ? voice.lock : voice.alert).toFixed(3)})`; }
    if (style) { set('style-pts', style.points); set('style-combo', style.combo > 1 ? `x${style.combo}` : ''); }
    $('progress-fill').style.transform = `scaleX(${progress})`;
    document.body.classList.toggle('low', water < .25);
  },
  results({ won, water, time, score, credits, receipt, official, streak, board }) {
    ui.show('results');
    set('r-kicker', official ? 'THE POUR · OFFICIAL' : 'PRACTICE RUN');
    set('r-title', !won ? (water <= .001 ? 'Bone dry.' : 'The stream started without you.') : water < .05 ? 'ONE. LAST. SIP.' : water > .7 ? 'Hydrated. Respect.' : 'Technically a drink.');
    $('r-stats').innerHTML = `<div><b>${Math.round(water * 100)}%</b><span>WATER</span></div><div><b>${time.toFixed(1)}s</b><span>TIME</span></div><div><b>${score}</b><span>SCORE</span></div><div><b>${streak || 0}</b><span>DAY STREAK</span></div>`;
    $('credits').innerHTML = credits.length ? credits.map((c, i) => `<li style="animation-delay:${i * .3}s"><span>${esc(c.name)}</span><b>${Math.round(c.amount * 100)}%</b></li>`).join('') : '<li><span>Nobody. A perfect pour.</span></li>';
    $('receipt').textContent = receipt;
    $('share').onclick = () => { navigator.clipboard?.writeText(receipt); $('share').textContent = 'COPIED'; };
    const rows = board?.pour || [];
    $('board').innerHTML = `<h4>TODAY'S POUR ${board?.local ? '(this browser)' : '· ACROSS TWITCH'}</h4>` + (rows.length ? rows.map((r, i) => `<li><span>${i + 1}. ${esc(r.channel)}${r.verified === false ? ' <small title="not signed in">*</small>' : ''}</span><b>${r.score}</b></li>`).join('') : '<li><span>No pours yet. Be first.</span></li>') +
      (board?.wanted?.length ? `<h4>MOST WANTED ACROSS TWITCH</h4>` + board.wanted.map((r, i) => `<li><span>${i + 1}. ${esc(r.viewer)}</span><b>${Math.round(r.spilled * 100)}%</b></li>`).join('') : '');
  },
};
