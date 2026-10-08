import pathlib,sys,tempfile,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from stage_site import stage
class StagingTests(unittest.TestCase):
    def test_new_top_level_assets_included_tooling_excluded(self):
        with tempfile.TemporaryDirectory() as d:
            root=pathlib.Path(d)/'repo'; root.mkdir()
            for name in ['index.html','app.js','story.js','new-chart.mjs','style.css','new-chart.css','logo.svg','.nojekyll','source.json','README.md']:
                (root/name).write_text('fixture')
            for name in ['data','assets','vendor','.git','scripts','tests','tools','.github']:
                (root/name).mkdir(); (root/name/'manifest.json').write_text('{}')
            out=root/'_site'; stage(root,out)
            for name in ['story.js','new-chart.mjs','new-chart.css','logo.svg','data','assets','vendor','.nojekyll']: self.assertTrue((out/name).exists())
            for name in ['source.json','README.md','.git','scripts','tests','tools','.github']: self.assertFalse((out/name).exists())
    def test_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root=pathlib.Path(d); (root/'index.html').write_text('x'); (root/'data').mkdir(); (root/'data/manifest.json').write_text('{}')
            (root/'logo.svg').symlink_to(root/'index.html')
            with self.assertRaisesRegex(ValueError,'Symlink'): stage(root,root/'_site')
    def test_missing_dataset_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaisesRegex(ValueError,'Missing'): stage(d,pathlib.Path(d)/'_site')
