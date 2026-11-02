"""Cut film takes (film/<take>/f00000.jpg + log.json from ?film) into video.
  python tools/cut.py <take> broll            -> video/broll/<shot>.mp4 (every shot, full length, with impact sounds)
  python tools/cut.py <take> trailer [music]  -> video/trailer.mp4 (fast cuts + title card; music optional)
Sound design: the logged impacts are re-voiced with layered, pitched Kenney CC0 samples (no synth beeps)."""
import json, subprocess, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = os.path.join(ROOT, 'public', 'assets', 'sfx')
FONT = 'C\\:/Windows/Fonts/seguibl.ttf'
# impact -> layers of (sample, pitch, volume, delay s)
VOICE = {
  'boom':    [('punchheavy', .45, 1.0, 0), ('woodheavy', .5, .8, .02), ('softheavy', .6, .9, 0), ('sand0', .7, .5, .08)],
  'hit':     [('punchheavy', .9, .9, 0), ('softheavy', .8, .6, 0)],
  'slam':    [('woodheavy', .8, .8, 0), ('punch1', .85, .8, 0)],
  'splash':  [('drop003', .55, 1.0, 0), ('sand2', .6, .6, .05), ('drop002', .7, .5, .12)],
  'shatter': [('glassheavy', 1.0, .8, 0), ('glass001', 1.1, .5, .06), ('glass002', .9, .4, .12)],
}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-2000:]); sys.exit(1)

def load(take):
    d = os.path.join(ROOT, 'film', take); log = json.load(open(os.path.join(d, 'log.json')))
    shots = log['shots']
    for i, s in enumerate(shots): s['to'] = shots[i + 1]['from'] if i + 1 < len(shots) else log['frames']
    return d, log, {s['name']: s for s in shots}

def events(log, f0, f1, fps):
    out, last = [], {}
    for e in log['sfx']:
        if f0 <= e['f'] < f1 and e['k'] in VOICE and e['f'] - last.get(e['k'], -99) > fps * .15:
            last[e['k']] = e['f']; out.append(((e['f'] - f0) / fps, e['k']))
    return out

def clip(d, fps, f0, n, out, sounds=(), speed=1.0, caption=None):
    """encode frames f0..f0+n to out.mp4 at 60 fps (speed>1 = sped up), with impact sounds mixed in."""
    args = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps * speed), '-start_number', str(f0), '-i', os.path.join(d, 'f%05d.jpg')]
    flt, mix = [], []
    for i, (t, k) in enumerate(sounds):
        for j, (name, pitch, vol, delay) in enumerate(VOICE[k]):
            args += ['-i', os.path.join(SFX, name + '.ogg')]; idx = len(mix) + 1
            ms = int(((t / speed) + delay) * 1000)
            flt.append(f'[{idx}:a]asetrate=44100*{pitch},aresample=44100,volume={vol},adelay={ms}|{ms}[s{idx}]'); mix.append(f'[s{idx}]')
    dur = n / (fps * speed)
    if mix: flt.append(f'{"".join(mix)}amix=inputs={len(mix)}:normalize=0,alimiter=limit=0.9,apad,atrim=0:{dur:.3f}[a]')
    else: args += ['-f', 'lavfi', '-i', f'anullsrc=r=44100:cl=stereo']; flt.append(f'[1:a]atrim=0:{dur:.3f}[a]')
    vmap = '0:v'
    if caption:  # one caption style: heavy white text on a dark pill, lower third, quick fade in
        txt = caption.replace("'", "’").replace(':', '\:')
        flt.insert(0, f"[0:v]drawtext=fontfile='{FONT}':text='{txt}':fontsize=76:fontcolor=white:box=1:boxcolor=0x18181bD9:boxborderw=26:x=(w-tw)/2:y=h-210:alpha='min(1,t*6)'[v]"); vmap = '[v]'
    args += ['-filter_complex', ';'.join(flt), '-map', vmap, '-map', '[a]', '-frames:v', str(n), '-r', '60',
             '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2', out]
    run(args)

def title(d, frame, out, secs=2.2):
    img = os.path.join(d, f'f{frame:05d}.jpg')
    vf = (f"scale=1920:1080,boxblur=18:2,eq=brightness=-0.12,"
          f"drawtext=fontfile='{FONT}':text='LAST SIP':fontsize=230:fontcolor=white:x=(w-tw)/2:y=(h-th)/2-90:shadowcolor=0x1b1530AA:shadowx=0:shadowy=10,"
          f"drawtext=fontfile='{FONT}':text='STREAMERS COMPETE. CHAT DECIDES.':fontsize=64:fontcolor=0xffd166:x=(w-tw)/2:y=(h/2)+90,"
          f"drawtext=fontfile='{FONT}':text='lastsip-seven.vercel.app':fontsize=40:fontcolor=white@0.85:x=(w-tw)/2:y=h-140,"
          f"fade=in:st=0:d=0.15")
    run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-i', img, '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', str(secs), '-vf', vf, '-r', '60',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '44100', '-ac', '2', out])

def dur(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
MUSIC_AT = 0.0

def concat(parts, out, music=None):
    lst = out + '.txt'; open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    tmp = out + '.tmp.mp4'; run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', tmp])
    if music:
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-i', music, '-filter_complex',
             f'[1:a]atrim=start={MUSIC_AT},asetpts=PTS-STARTPTS,volume=0.7,afade=in:d=0.2,afade=out:st={dur(tmp) - 1.6:.2f}:d=1.6[m];[0:a]volume=0.55[g];[g][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]',
             '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', out])
        os.remove(tmp)
    else: os.replace(tmp, out)
    os.remove(lst)

# trailer: (shot, start s into the shot, length s, speed)
# trailer: (shot, start s into the shot (negative = from its end), length s, speed, caption). ~2.5-4 s per idea.
TRAILER = [('establish', 1.0, 3.4, 1, 'STREAMERS. ONE BAR. 90 SECONDS.'), ('tower', .4, 3.0, 1, 'STACK DRINKS. MOST TIPS WINS.'),
           ('airstrike', 3.6, 4.0, 1, 'YOUR VIEWERS CAN RUIN YOU'), ('airstrike', 8.6, 3.0, 1, 'OR SAVE YOU'),
           ('slam', 0, 2.6, 1, 'KNOCK OUT RIVAL STREAMERS'), ('bombs', .5, 2.8, 1, 'BOMB THE COMPETITION'),
           ('co2', 0, 3.2, 1, 'CO2 THEM UNTIL THEY POP'), ('taxi', .8, 2.6, 1, 'STEAL A TAXI'),
           ('plane2:plane', 1.2, 2.0, 1, 'OR A PLANE'), ('plane2:plane', 6.3, 3.0, 1, None),
           ('plane2:finale', .8, 3.0, 1, 'STREAMERS COMPETE. CHAT PICKS SIDES.')]

if __name__ == '__main__':
    take, mode = sys.argv[1], sys.argv[2]
    d, log, S = load(take); fps = log['fps']
    out_dir = os.path.join(ROOT, 'video', 'broll' if mode == 'broll' else ''); os.makedirs(out_dir, exist_ok=True)
    if mode == 'broll':
        for name, s in S.items():
            clip(d, fps, s['from'], s['to'] - s['from'], os.path.join(out_dir, f'{name}.mp4'), events(log, s['from'], s['to'], fps)); print('broll', name)
    else:
        parts = []; tmpd = os.path.join(ROOT, 'video', 'cut_v3'); os.makedirs(tmpd, exist_ok=True)
        takes = {take: (d, log, S)}
        for i, (name, st, ln, sp, cap) in enumerate(TRAILER):
            tk, _, nm = name.rpartition(':'); tk = tk or take
            if tk not in takes:
                if not os.path.exists(os.path.join(ROOT, 'film', tk, 'log.json')): print('skip', name); continue
                takes[tk] = load(tk)
            d, log, S2 = takes[tk]
            if nm not in S2: print('skip', name); continue
            s = S2[nm]; f0 = (s['to'] + int(st * fps)) if st < 0 else s['from'] + int(st * fps); n = int(ln * fps)
            f0 = max(s['from'], min(f0, s['to'] - n)); p = os.path.join(tmpd, f'p{i:02d}.mp4')
            clip(d, fps, f0, n, p, events(log, f0, f0 + n, fps), sp, cap); parts.append(p)
        d, log, S = takes[take]; tp = os.path.join(tmpd, 'title.mp4'); title(d, S['establish']['from'] + int(2 * fps), tp, 3.2); parts.append(tp)
        concat(parts, os.path.join(ROOT, 'video', 'trailer_v3.mp4'), sys.argv[3] if len(sys.argv) > 3 else None); print('trailer done')
