// STREAM CHAT, in-game: the real Twitch chat, styled like Twitch's own chat (Inter, badges, name colours, emotes).
// When a message makes something happen in the arena, a highlighted line says so (like Twitch's sub/raid notices),
// so viewers and judges can see chat driving the game.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const emoteImg = id => `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`;
function body(msg) { // text with Twitch emotes swapped in as images
  const chars = [...(msg.text || '')], em = (msg.emotes || []).filter(e => e.start != null).sort((a, b) => a.start - b.start);
  let out = '', i = 0;
  for (const e of em) { out += esc(chars.slice(i, e.start).join('')); out += `<img src="${emoteImg(e.id)}" alt="${esc(e.name || '')}">`; i = e.end + 1; }
  out += esc(chars.slice(i).join('')); return out;
}
export function createChatPanel(hud) {
  const el = document.createElement('div'); el.id = 'streamchat'; el.hidden = true;
  el.innerHTML = '<header><i></i><b>STREAM CHAT</b><span></span></header><ol></ol>'; hud.appendChild(el);
  const list = el.querySelector('ol');
  const push = li => { list.appendChild(li); while (list.children.length > 7) list.firstChild.remove(); };
  return {
    channel(name) { el.hidden = !name; el.querySelector('header span').textContent = name ? `#${name}` : ''; },
    line(msg) {
      if (!msg.user || msg.notice) return;
      const li = document.createElement('li'), badges = (msg.mod ? '<em class="b mod"></em>' : '') + (msg.vip ? '<em class="b vip"></em>' : '') + (msg.sub ? '<em class="b sub"></em>' : '') + (msg.bits ? '<em class="b bits"></em>' : '');
      li.innerHTML = `${badges}<span style="color:${esc(msg.color || '#bf94ff')}">${esc(msg.user)}</span>: ${body(msg)}`;
      if (msg.bits) li.className = 'cheer';
      push(li);
    },
    // something chat did, highlighted: "XQCFAN99 called in an AIRSTRIKE"
    event(who, what, color = '#bf94ff') {
      const li = document.createElement('li'); li.className = 'evt'; li.style.setProperty('--c', color);
      li.innerHTML = `${who ? `<span style="color:${esc(color)}">${esc(who)}</span> ` : ''}${esc(what)}`; push(li);
    },
  };
}
