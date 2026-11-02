// TWITCH PROOF STRIP (bottom left): a small live badge "● LIVE #channel · 1,284 msgs" plus ONLY the chat messages
// that changed the game ("XQCFAN99: kaboom get him" → "called in an AIRSTRIKE"). Streamers already show their own
// chat, so the full chat stays hidden; C pops it open (Twitch chat style: badges, name colours, emotes).
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const emoteImg = id => `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`;
function body(msg) { // text with Twitch emotes swapped in as images
  const chars = [...(msg.text || '')], em = (msg.emotes || []).filter(e => e.start != null).sort((a, b) => a.start - b.start);
  let out = '', i = 0;
  for (const e of em) { out += esc(chars.slice(i, e.start).join('')); out += `<img src="${emoteImg(e.id)}" alt="${esc(e.name || '')}">`; i = e.end + 1; }
  out += esc(chars.slice(i).join('')).slice(0, 140); return out;
}
const badgesOf = m => (m.mod ? '<em class="b mod"></em>' : '') + (m.vip ? '<em class="b vip"></em>' : '') + (m.sub ? '<em class="b sub"></em>' : '') + (m.bits ? '<em class="b bits"></em>' : '');
const lineHtml = m => `${badgesOf(m)}<span style="color:${esc(m.color || '#bf94ff')}">${esc(m.user)}</span>: ${body(m)}`;
export function createChatPanel(hud) {
  const el = document.createElement('div'); el.id = 'streamchat'; el.hidden = true;
  el.innerHTML = '<header><i></i><b>LIVE</b><span class="ch"></span><span class="n"></span><kbd>C</kbd></header><ol class="evts"></ol><ol class="all"></ol>'; hud.appendChild(el);
  const evts = el.querySelector('.evts'), all = el.querySelector('.all'), nEl = el.querySelector('.n');
  let n = 0, open = false;
  const last = new Map(); // user -> their last message (to quote it on the event line)
  addEventListener('keydown', e => { if (e.code === 'KeyC' && !e.repeat && !el.hidden) { open = !open; el.classList.toggle('open', open); } });
  const push = (list, li, max) => { list.appendChild(li); while (list.children.length > max) list.firstChild.remove(); };
  return {
    channel(name) { el.hidden = !name; el.querySelector('.ch').textContent = name ? `#${name}` : ''; },
    line(msg) {
      if (!msg.user || msg.notice) return; n++; nEl.textContent = `${n.toLocaleString()} msgs`; last.set(msg.user, msg);
      const li = document.createElement('li'); li.innerHTML = lineHtml(msg); if (msg.bits) li.className = 'cheer'; push(all, li, 8);
    },
    // a chat message that changed the game: quote it, then say what it did
    event(who, what, color = '#bf94ff') {
      const m = who && last.get(who), li = document.createElement('li'); li.className = 'evt'; li.style.setProperty('--c', color);
      li.innerHTML = (m ? `<q>${lineHtml(m)}</q>` : '') + `<p>${who && !m ? `<span style="color:${esc(color)}">${esc(who)}</span> ` : ''}${esc(what)}</p>`;
      push(evts, li, 3); setTimeout(() => { li.classList.add('old'); setTimeout(() => li.remove(), 900); }, 9000);
    },
  };
}
