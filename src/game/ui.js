import { icon } from './icons.js';
import { sfx } from './sfx.js';
export const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const set = (id, v) => { const el = $(id); if (el && el.textContent !== String(v)) el.textContent = v; }; // avoid layout churn
let blameT = 0, slotT = 0, blameAcc = 0, blameName = '', hudLast = 0;
const MOD_LABEL = { moon: 'MOON GRAVITY', tilt: 'TILTED', tiny: 'TINY', bigglass: 'BIG GLASS', lava: 'LAVA FLOOR', mirror: 'MIRRORED', drunk: 'WOBBLY', hyper: 'HYPER', fog: 'SMOKE', disco: 'DISCO', lid: 'LID ON', slowmo: 'SLOW-MO', soft: 'CUSHIONED' };
const MOD_ICON = { soft: 'pillows' };
const REEL = ['bomb', 'banana', 'ducks', 'fridge', 'moon', 'disco', 'lava', 'cans', 'balls', 'gust'];
let modsKey = '', trickT = 0, lastRoom = '';
const LABEL = { sniper: 'SNIPER', barrel: 'BARREL', drop: 'SKY DROP', storm: 'SEA BREEZE', deck: 'MYSTERY', calm: 'LIFEBUOY' };

export const ui = {
  bind({ start, practice, connect, mic, signIn, lock }) {
    $('start').onclick = start; $('practice').onclick = practice; $('again').onclick = practice; $('home').onclick = () => location.reload();
    $('connect').onclick = () => { const v = $('channel').value.trim().replace(/^.*twitch\.tv\//, ''); if (v) connect(v); };
    $('channel').value = localStorage.getItem('lastsip:channel') || '';
    $('signin').onclick = signIn;
    document.querySelectorAll('.ic').forEach(e => e.innerHTML = icon(e.dataset.ic));
    if ($('mic-on')) $('mic-on').onclick = async () => { $('mic-on').textContent = (await mic()) ? 'MICROPHONE ON' : 'MIC BLOCKED: HOLD V TO SHOUT'; };
    $('world').onclick = lock;
    addEventListener('keydown', e => { if (e.code === 'KeyR' && !$('results').hidden) practice(); });
  },
  tabs(onOpen) {
    document.querySelectorAll('#intro nav button').forEach(b => b.onclick = () => {
      document.querySelectorAll('#intro nav button').forEach(x => x.classList.toggle('on', x === b));
      document.querySelectorAll('#intro .panel').forEach(p => p.hidden = p.id !== 'tab-' + b.dataset.tab);
      onOpen(b.dataset.tab);
    });
  },
  todayOrder(ids, ING, rule) { $('today-order').innerHTML = ids.map(id => `<span style="--c:${ING[id].color}">${ING[id].label}</span>`).join('') + (rule ? `<span class="rule" title="${rule.tip}">${rule.label}</span>` : ''); },
  introBoard(board) {
    const rows = board?.pour || [], wanted = board?.wanted || [];
    $('intro-board').innerHTML = rows.length ? rows.map((r, i) => `<li><span>${i + 1}. ${esc(r.channel)}</span><b>${r.score}</b></li>`).join('') : '<li><span>No pours yet today. Be first.</span></li>';
    $('intro-wanted').innerHTML = wanted.length ? wanted.map((r, i) => `<li><span>${i + 1}. ${esc(r.viewer)}</span><b>${Math.round(r.spilled * 100)}%</b></li>`).join('') : '<li><span>Nobody yet. Suspicious.</span></li>';
  },
  stats(h) {
    const days = Object.values(h.days || {}), won = days.filter(d => d.finished), avg = won.length ? won.reduce((a, d) => a + d.water, 0) / won.length : 0;
    $('stats-grid').innerHTML = [[days.length, 'PLAYED'], [days.length ? Math.round(won.length / days.length * 100) + '%' : '0%', 'DELIVERED'], [h.streak || 0, 'STREAK'], [Math.round(avg * 100) + '%', 'AVG DRINK']].map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('');
    const buckets = [['90+', .9], ['70+', .7], ['50+', .5], ['25+', .25], ['<25', 0]], counts = buckets.map(([, lo], i) => won.filter(d => d.water >= lo && (i === 0 || d.water < buckets[i - 1][1])).length), max = Math.max(1, ...counts);
    $('stats-hist').innerHTML = buckets.map(([l], i) => `<div><span>${l}%</span><i style="width:${Math.max(6, counts[i] / max * 100)}%">${counts[i]}</i></div>`).join('') + `<div><span>DNF</span><i style="width:${Math.max(6, (days.length - won.length) / max * 100)}%;background:#18332e">${days.length - won.length}</i></div>`;
  },
  intro({ number, daily, canSignIn }) {
    set('day-no', `#${number}`);
    $('start').textContent = daily.poured ? 'POURED TODAY' : 'THE POUR';
    $('start').disabled = true; $('start').dataset.done = daily.poured ? '1' : '';
    set('streak', daily.streak > 0 ? `${daily.streak}-DAY STREAK` : new Date().toDateString().slice(4).toUpperCase());
    $('signin').hidden = !canSignIn;
  },
  ready() { $('loading').hidden = true; $('start').disabled = !!$('start').dataset.done; $('practice').disabled = false; },
  loading(on) { $('loading').hidden = !on; },
  signedIn(login) { $('signin').textContent = `Signed in as ${login}`; $('signin').disabled = true; },
  show(id) { for (const x of ['intro', 'hud', 'results']) $(x).hidden = x !== id; },
  mode(text) { set('mode', text); },
  chatStatus(s, c) { set('chat-status', s === 'connected' ? `● LIVE · #${c}` : s === 'reconnecting' ? `◌ reconnecting #${c}` : '○ not connected'); $('chat-status').dataset.state = s; },
  feed(text, kind = 'chaos', ico = '', key = '') { // key: replace the previous line with the same key (vote progress)
    if (key) $('feed').querySelector(`[data-key="${key}"]`)?.remove();
    const li = document.createElement('li'); if (key) li.dataset.key = key; li.className = kind; li.innerHTML = `${icon(ico)}<span>${esc(text)}</span>`; $('feed').prepend(li);
    while ($('feed').children.length > 3) $('feed').lastChild.remove();
    setTimeout(() => li.classList.add('old'), 3500); setTimeout(() => li.remove(), 4300);
  },
  // slot reel: spins through icons then lands on the card (variable-reward reveal for viewers)
  slot(card, by) {
    const el = $('slot'); el.className = `on r-${card.r}${card.help ? ' help' : ''}`;
    let i = 0; clearInterval(el._spin);
    el._spin = setInterval(() => { sfx.tick(); el.innerHTML = `<b>${icon(REEL[i++ % REEL.length], 'reel')}</b><span>${esc(by)} pulled the lever</span>`; if (i > 7) { clearInterval(el._spin); card.help ? sfx.help() : sfx.reveal(card.r); el.innerHTML = `<b>${icon(card.id, 'reel')}</b><strong>${esc(card.label)}</strong><span>${card.r === 'l' ? 'LEGENDARY · ' : card.r === 'r' ? 'RARE · ' : ''}${esc(by)}</span>`; } }, 55);
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
  // 3-2-1-POUR. Resolves when the run should start.
  big(text) { const el = $('count'); el.textContent = text; el.className = ''; void el.offsetWidth; el.className = 'on'; },
  countdown() {
    const el = $('count'), steps = ['3', '2', '1', 'POUR'];
    return new Promise(done => steps.forEach((s, i) => setTimeout(() => {
      el.textContent = s; el.className = ''; void el.offsetWidth; el.className = 'on'; sfx.beep(i === 3);
      if (i === 3) { done(); setTimeout(() => el.className = '', 700); }
    }, i * 650)));
  },
  confetti() {
    const fx = document.body, colors = ['#a970ff', '#5dd6ff', '#ffd36b', '#ff5fa2', '#5dff9b'];
    for (let i = 0; i < 90; i++) { const d = document.createElement('i'); d.className = 'confetti'; d.style.cssText = `left:${Math.random() * 100}vw;background:${colors[i % 5]};animation-delay:${Math.random() * .6}s;animation-duration:${1.8 + Math.random() * 1.6}s;transform:rotate(${Math.random() * 360}deg)`; fx.appendChild(d); setTimeout(() => d.remove(), 4200); }
  },
  order(ids, labels, colors, got = [], rule) {
    $('order').innerHTML = ids.map(id => `<span class="${got.includes(id) ? 'got' : ''}" style="--c:${colors[id]}"><i></i>${labels[id]}</span>`).join('') + (rule ? `<span class="rule">${rule.label}</span>` : '');
  },
  // CHAT VOTE card: options with live counts and a draining bar; then the result with the drawn face
  ballot(st, result) {
    let el = $('ballot'); if (!el) { el = document.createElement('div'); el.id = 'ballot'; $('hud').appendChild(el); }
    clearTimeout(el._t);
    if (result) { el.className = 'on result'; el.innerHTML = `<small>CHAT PICKED</small><b>${esc(result.label)}</b><span>${esc(result.user)} is on the island · ${result.votes} vote${result.votes > 1 ? 's' : ''}</span>`; el._t = setTimeout(() => el.className = '', 2200); return; }
    if (!st) { el.className = ''; return; }
    el.className = 'on'; el._k = '';
    el.innerHTML = `<small>CHAT VOTE · TYPE 1 2 3</small><div class="opts">${st.options.map((o, i) => `<span><em>${i + 1}</em>${LABEL[o] || o}<b>0</b></span>`).join('')}</div><i></i>`;
    ui.ballotTick(st);
  },
  ballotTick(st) {
    const el = $('ballot'); if (!el || !st) return; const k = st.counts.join() + '|' + Math.ceil(st.left);
    if (el._k === k) return; el._k = k; const total = st.counts.reduce((a, b) => a + b, 0) || 1;
    el.querySelectorAll('.opts span').forEach((sp, i) => { sp.querySelector('b').textContent = st.counts[i]; sp.style.setProperty('--p', st.counts[i] / total); });
    el.querySelector('i').style.transform = `scaleX(${st.left / st.seconds})`;
  },
  catchPrompt(on) { $('catch').classList.toggle('on', on); },
  lastSip() { document.body.classList.add('lastsip'); setTimeout(() => document.body.classList.remove('lastsip'), 2500); },
  standings(rows) { // arena: live table, top right
    let el = $('standings'); if (!el) { el = document.createElement('div'); el.id = 'standings'; $('hud').appendChild(el); }
    const key = rows.map(r => r.name + r.tips + r.n).join('|'); if (el.dataset.k === key) return; el.dataset.k = key;
    el.innerHTML = rows.slice(0, 6).map((r, i) => `<div class="${r.me ? 'me' : ''}"><b>${i + 1}</b><i style="background:${r.color}"></i><span>${esc(r.name).slice(0, 14)}</span><em>$${r.tips}</em><small>${r.n ? '▮'.repeat(Math.min(10, r.n)) : ''}</small></div>`).join('');
  },
  hud({ water, danger, time, room, hazard, steady, calm, mods, progress, vacuum = 99, style, voice, salt = 0, tips = 0, tray = 0, served = 0, streak = 0 }) {
    const now = performance.now(); if (now - hudLast < 80) return; hudLast = now;
    set('water', Math.round(water * 100)); const sl = Math.round(salt * 100); if ($('salt').dataset.v !== String(sl)) { $('salt').dataset.v = sl; $('salt').textContent = sl ? `SALT ${sl}%` : ''; } $('water-fill').style.transform = `scaleY(${water})`;
    $('danger').style.transform = `scaleX(${danger})`; $('danger').dataset.hot = danger > .85 ? '1' : '';
    set('timer', Math.max(0, time).toFixed(1));
    if (room !== lastRoom) { lastRoom = room; set('room', room); const r = $('room'); r.classList.remove('enter'); void r.offsetWidth; r.classList.add('enter'); }
    set('hazard', hazard ? hazard : calm ? 'STEADIED BY CHAT' : '');
    const key = mods.join(); if (key !== modsKey) { modsKey = key; $('mods').innerHTML = mods.filter(m => MOD_LABEL[m]).map(m => `<span>${icon(MOD_ICON[m] || m)}${MOD_LABEL[m]}</span>`).join(''); }
    const near = Math.max(0, Math.min(1, 1 - (vacuum - 1) / 7)); $('vac').style.opacity = vacuum < 8 ? 1 : 0; $('vac-fill').style.transform = `scaleX(${near})`; $('vac').dataset.hot = vacuum < 2.5 ? '1' : '';
    if (voice) { const v = $('voice'); v.style.opacity = voice.lock >= 0 || voice.alert >= 0 ? 1 : 0; /* only when a set piece needs your voice */ $('voice-fill').style.transform = `scaleY(${voice.level.toFixed(3)})`; v.dataset.mode = voice.alert >= 0 ? 'quiet' : voice.lock >= 0 ? 'lock' : ''; $('voice-goal').style.transform = `scaleY(${Math.max(0, voice.lock >= 0 ? voice.lock : voice.alert).toFixed(3)})`; }
    if (style) { document.querySelector('.style-box').dataset.zero = style.points ? '' : '1'; set('style-pts', style.points); set('style-combo', style.combo > 1 ? `x${style.combo}` : ''); }
    const ok = `${tips}|${tray}|${served}|${streak}`; if ($('order').dataset.k !== ok) { $('order').dataset.k = ok; $('order').innerHTML = `<span class="tips"><b>$${tips}</b></span><span>${served} SERVED</span><span class="tower">TOWER ${tray}</span>${streak > 1 ? `<span class="streak">CLEAN x${Math.min(2, 1 + (streak - 1) * .25)}</span>` : ''}`; }
    $('progress-fill').style.transform = `scaleX(${progress})`;
    document.body.classList.toggle('low', tray > 0 && water < .25 && water > .001);
    document.body.classList.toggle('trayless', !tray); // empty tray: the drink meter fades instead of screaming 0%
  },
  results({ rooms = [], won, water, time, score, credits, receipt, official, streak, board, salt = 0, tips = 0, served = 0, walkouts = 0, servedBy = [] }) {
    ui.show('results');
    set('r-kicker', official ? 'THE POUR · OFFICIAL' : 'PRACTICE RUN');
    set('r-title', !served ? 'Nobody got a drink.' : walkouts > served ? 'The customers have left a review.' : tips >= served * 8 ? 'Five-star waiter.' : tips < served * 4 ? 'Mostly spilled, partly seawater.' : 'Technically hospitality.');
    $('r-stats').innerHTML = `<div><b>$${tips}</b><span>TIPS</span></div><div><b>${served}</b><span>SERVED</span></div>${walkouts ? `<div><b>${walkouts}</b><span>WALKOUTS</span></div>` : ''}<div><b>${score}</b><span>SCORE</span></div>${streak > 0 ? `<div><b>${streak}</b><span>DAY STREAK</span></div>` : ''}`;
    $('credits').innerHTML = credits.length ? credits.map((c, i) => `<li style="animation-delay:${i * .3}s"><span>${esc(c.name)}</span><b>${Math.round(c.amount * 100)}%</b></li>`).join('') : '<li><span>Nobody. A perfect pour.</span></li>';
    const grade = l => l < .03 ? 'A' : l < .08 ? 'B' : l < .15 ? 'C' : 'F';
    $('grades').innerHTML = servedBy.length ? `<p class="served">SERVED: ${servedBy.map(esc).join(', ')}</p>` : '';
    void rooms.map((x, i) => `<div class="g-${grade(x.lost)}" style="animation-delay:${.2 + i * .15}s"><b>${grade(x.lost)}</b><span>${x.key}</span></div>`).join('');
    $('receipt').textContent = receipt;
    $('share').onclick = () => { navigator.clipboard?.writeText(receipt); $('share').textContent = 'COPIED'; };
    const rows = board?.pour || [];
    $('board').innerHTML = `<h4>TODAY'S POUR ${board?.local ? '(this browser)' : '· ACROSS TWITCH'}</h4>` + (rows.length ? rows.map((r, i) => `<li><span>${i + 1}. ${esc(r.channel)}${r.verified === false ? ' <small title="not signed in">*</small>' : ''}</span><b>${r.score}</b></li>`).join('') : '<li><span>No pours yet. Be first.</span></li>') +
      (board?.wanted?.length ? `<h4>MOST WANTED ACROSS TWITCH</h4>` + board.wanted.map((r, i) => `<li><span>${i + 1}. ${esc(r.viewer)}</span><b>${Math.round(r.spilled * 100)}%</b></li>`).join('') : '');
  },
};
