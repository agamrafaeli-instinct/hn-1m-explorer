#!/usr/bin/env python3
"""Rewrites the Takeaway template of every stories/h*.json to the neutral pattern (docs/DRAFTS_FOR_REVIEW.md, section 2):
no "Yes."/"No." opener and no "supports/refutes". It states the ratio, the lines the card set before the check, and which side the ratio is on.
The side comes from the story's for_verdict (a story only shows while the computed verdict equals it). Safe to run twice."""
import glob, json, re, sys

END_BOTH = {'supported': 'past the line that backs the claim', 'inconclusive': 'between the two lines', 'refuted': 'past the line that counts against the claim'}
END_ONE = {'supported': 'on the other side of that line', 'inconclusive': 'not past that line', 'refuted': 'past that line'}
SPECIAL = {
    'h301': "Agent stories went from {b} to {a} per chatbot story, a {ratio}x change. The card set its line before the check: {support_at}x or more would back the claim. This is past that line.",
    'h304': "React's share is now {ratio}x of its earlier share. The card set its lines before the check: {support_at}x or lower would back the claim, {refute_at}x or higher would count against it. This is past the line that backs the claim.",
    'h319': "The share is {ratio}x the earlier one. The card set its line before the check: {support_at}x or more would back the claim. This is past that line.",
    'h324': "The ratio is {ratio}x. The card set its line before the check: {refute_at}x or lower would count against the claim. This is past that line.",
}

def new_text(d):
    if d['id'] in SPECIAL: return SPECIAL[d['id']]
    t, v = d['takeaway'], d['for_verdict']
    sup = re.search(r'supports the claim at \{support_at\}x or (more|less|lower|higher)', t)
    ref = re.search(r'refutes the claim at \{refute_at\}x or (more|less|lower|higher)', t)
    if sup and ref:
        return 'The ratio is {ratio}x. The card set its lines before the check: {support_at}x or %s would back the claim, {refute_at}x or %s would count against it. This is %s.' % (sup.group(1), ref.group(1), END_BOTH[v])
    if ref:
        return 'The ratio is {ratio}x. The card set its line before the check: {refute_at}x or %s would count against the claim. This is %s.' % (ref.group(1), END_ONE[v])
    raise SystemExit('no pattern for ' + d['id'] + ': ' + t)

def main(write):
    n = 0
    for f in sorted(glob.glob('stories/h*.json')):
        raw = open(f).read(); d = json.loads(raw)
        if d['takeaway'].startswith(('The ratio is', 'The card set')) and d['id'] not in SPECIAL: continue
        new = new_text(d)
        if new == d['takeaway']: continue
        old_s, new_s = json.dumps(d['takeaway'], ensure_ascii=False), json.dumps(new, ensure_ascii=False)
        if old_s not in raw: raise SystemExit('cannot find the takeaway text in ' + f)
        if write: open(f, 'w').write(raw.replace(old_s, new_s, 1))
        n += 1
    print(('rewrote ' if write else 'would rewrite ') + str(n) + ' takeaways')

if __name__ == '__main__': main('--write' in sys.argv)
