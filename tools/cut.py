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

def clip(d, fps, f0, n, out, sounds=(), speed=1.0):
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
    args += ['-filter_complex', ';'.join(flt), '-map', '0:v', '-map', '[a]', '-frames:v', str(n), '-r', '60',
             '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2', out]
    run(args)

def title(d, frame, out, secs=2.2):
    img = os.path.join(d, f'f{frame:05d}.jpg')
    vf = (f"scale=1920:1080,boxblur=18:2,eq=brightness=-0.12,"
          f"drawtext=fontfile='{FONT}':text='LAST SIP':fontsize=230:fontcolor=white:x=(w-tw)/2:y=(h-th)/2-90:shadowcolor=0x1b1530AA:shadowx=0:shadowy=10,"
          f"drawtext=fontfile='{FONT}':text='STACK DRINKS. SLAM STREAMERS.':fontsize=64:fontcolor=0xffd166:x=(w-tw)/2:y=(h/2)+90,"
          f"drawtext=fontfile='{FONT}':text='lastsip-seven.vercel.app':fontsize=40:fontcolor=white@0.85:x=(w-tw)/2:y=h-140,"
          f"fade=in:st=0:d=0.15")
    run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-i', img, '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', str(secs), '-vf', vf, '-r', '60',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '44100', '-ac', '2', out])

def concat(parts, out, music=None):
    lst = out + '.txt'; open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    tmp = out + '.tmp.mp4'; run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', tmp])
    if music:
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-i', music, '-filter_complex',
             '[1:a]volume=0.55,afade=in:d=0.3[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]',
             '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', out])
        os.remove(tmp)
    else: os.replace(tmp, out)
    os.remove(lst)

# trailer: (shot, start s into the shot, length s, speed)
TRAILER = [('establish', 1.5, 1.6, 1.3), ('tower', .6, 1.3, 1), ('airstrike', .8, 2.6, 1), ('slam', 0, 1.4, 1), ('bombs', .5, 1.6, 1.2),
           ('co2', 0, 2.2, 1.2), ('taxi', 1.2, 1.6, 1), ('offedge', .4, 1.6, 1), ('plane', 0, 1.4, 1.3), ('plane', -3.2, 2.6, 1)]

if __name__ == '__main__':
    take, mode = sys.argv[1], sys.argv[2]
    d, log, S = load(take); fps = log['fps']
    out_dir = os.path.join(ROOT, 'video', 'broll' if mode == 'broll' else ''); os.makedirs(out_dir, exist_ok=True)
    if mode == 'broll':
        for name, s in S.items():
            clip(d, fps, s['from'], s['to'] - s['from'], os.path.join(out_dir, f'{name}.mp4'), events(log, s['from'], s['to'], fps)); print('broll', name)
    else:
        parts = []; tmpd = os.path.join(ROOT, 'video', 'parts'); os.makedirs(tmpd, exist_ok=True)
        for i, (name, st, ln, sp) in enumerate(TRAILER):
            s = S[name]; f0 = (s['to'] + int(st * fps)) if st < 0 else s['from'] + int(st * fps); n = int(ln * fps)
            f0 = max(s['from'], min(f0, s['to'] - n)); p = os.path.join(tmpd, f'p{i:02d}.mp4')
            clip(d, fps, f0, n, p, events(log, f0, f0 + n, fps), sp); parts.append(p)
        tp = os.path.join(tmpd, 'title.mp4'); title(d, S['finale']['from'] + int(2 * fps), tp); parts.append(tp)
        concat(parts, os.path.join(ROOT, 'video', 'trailer.mp4'), sys.argv[3] if len(sys.argv) > 3 else None); print('trailer done')
