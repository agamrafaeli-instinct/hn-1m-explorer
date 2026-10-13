"""The QA walk scans rendered text with the same banned words as scripts/copy_lint.py (#356)."""
import json, os, re, subprocess, sys, unittest
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import copy_lint

class SameList(unittest.TestCase):
    def test_lists_match(self):
        line = next(l for l in open(os.path.join(ROOT, 'scripts/qa_review.mjs')) if l.startswith('const BANNED'))
        expr = line.rstrip().rstrip(';').replace("new RegExp(", "((a)=>a)(", 1).replace(".join('|')", '')
        out = subprocess.run(['node', '-e', expr + ';console.log(JSON.stringify(BANNED))'], capture_output=True, text=True, check=True).stdout.strip()
        js = set(json.loads(out))
        py = set(copy_lint.BANNED)
        norm = lambda s: {x.replace('\\u2014', '\u2014').replace('\\b1M\\b', '(?<![\\d.])1M\\b') for x in s}
        self.assertEqual({x.lower() for x in norm(js)}, {x.lower() for x in norm(py)})
if __name__ == '__main__': unittest.main()
