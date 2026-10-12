#!/usr/bin/env python3
"""Compare new screenshots with the saved ones (#247). A change is reported, never a failure.
  snapshots_compare.py BASE_DIR NEW_DIR OUT_DIR [--threshold 0.5]
A screen counts as changed when more than THRESHOLD percent of its pixels differ, or its size changed, or it has no saved image.
Writes OUT_DIR/<name>.diff.png (changed pixels in red over the new image) and OUT_DIR/report.json {changed:[{name,percent,reason}]}."""
import json, os, sys
from PIL import Image, ImageChops

def compare(a, b, threshold=0.5):
    """Returns (percent, reason, diff_image_or_None)."""
    if a is None: return 100.0, 'no saved image', None
    if a.size != b.size: return 100.0, f'size {a.size[0]}x{a.size[1]} -> {b.size[0]}x{b.size[1]}', None
    d = ImageChops.difference(a.convert('RGB'), b.convert('RGB')).convert('L').point(lambda v: 255 if v > 24 else 0)
    n = d.histogram()[255]
    pct = 100.0 * n / (a.size[0] * a.size[1])
    if pct <= threshold: return pct, '', None
    red = b.convert('RGB').copy(); red.paste(Image.new('RGB', b.size, (255, 0, 0)), mask=d)
    return pct, 'pixels differ', red

def main(base, new, out, threshold=0.5):
    os.makedirs(out, exist_ok=True); changed = []
    for f in sorted(os.listdir(new)):
        if not f.endswith('.png'): continue
        name = f[:-4]; bp = os.path.join(base, f)
        pct, why, red = compare(Image.open(bp) if os.path.exists(bp) else None, Image.open(os.path.join(new, f)), threshold)
        if why:
            changed.append({'name': name, 'percent': round(pct, 2), 'reason': why})
            if red: red.save(os.path.join(out, name + '.diff.png'))
    json.dump({'changed': changed}, open(os.path.join(out, 'report.json'), 'w'), indent=1)
    return changed

if __name__ == '__main__':
    t = float(sys.argv[sys.argv.index('--threshold') + 1]) if '--threshold' in sys.argv else 0.5
    ch = main(sys.argv[1], sys.argv[2], sys.argv[3], t)
    for c in ch: print(f"{c['name']}: {c['percent']}% ({c['reason']})")
    print('screens changed:', len(ch))
