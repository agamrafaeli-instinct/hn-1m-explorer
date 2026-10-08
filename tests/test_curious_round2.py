import importlib.util, pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('curious_round2', ROOT/'scripts/curious_round2.py')
mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
MON=1785110400
class CuriousRound2Test(unittest.TestCase):
    def test_nulls_and_pairs_are_not_zeroes(self):
        r=mod.measure([(MON,None,2,'a'),(MON,10,None,'b'),(MON,20,5,'c')])
        self.assertEqual((r['stories'],r['score_stories'],r['comment_stories']), (3,2,2))
        self.assertEqual((r['paired_points'],r['paired_comments']), (20,5))
        self.assertEqual((r['trimmed_points'],r['trimmed_stories']), (10,1))
    def test_complete_weeks_and_overlap(self):
        rows=[(MON-1,999,999,'cat'),(MON+1,10,2,'cat'),(MON+6*mod.DAY,20,3,'cat'),(MON+7*mod.DAY,999,999,'cat')]
        r=mod.aggregate(rows,(MON-1,MON+7*mod.DAY+1),[dict(key='animals',pattern=r'\bcat\b'),dict(key='pets',pattern='cat')])
        self.assertEqual(r['window']['stories'],2)
        self.assertEqual(r['window']['weeks'],1)
        self.assertEqual(r['totals']['animals']['points'],30)
        self.assertEqual(r['totals']['pets']['points'],30)
        self.assertEqual(r['weekday']['animals'][0]['stories'],1)
        self.assertEqual(r['weekday']['animals'][6]['stories'],1)
    def test_exact_end_boundary(self):
        r=mod.aggregate([(MON,1,0,'a')],(MON,MON+7*mod.DAY-1),[dict(key='a',pattern='a')])
        self.assertEqual(r['window']['weeks'],1)
    def test_manifest_only(self):
        source=(ROOT/'scripts/curious_round2.py').read_text()
        self.assertIn("for chunk in manifest['chunks']",source)
        self.assertNotIn('glob(',source)
if __name__=='__main__': unittest.main()
