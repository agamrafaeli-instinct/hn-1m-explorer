import json, pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'scripts'))
import check_list_version as c

ROOT = pathlib.Path(__file__).resolve().parent.parent


class ListVersion(unittest.TestCase):
    def test_current_lists_match_recorded_hash(self):
        lists = json.loads((ROOT / 'data/lists.json').read_text())
        locked = json.loads((ROOT / 'data/lists_versions.json').read_text())
        self.assertIsNone(c.check(lists, locked))

    def test_edit_without_bump_fails(self):
        lists = json.loads((ROOT / 'data/lists.json').read_text())
        locked = {str(lists['list_version']): c.digest(lists)}
        edited = dict(lists, press=list(lists['press']) + ['example.invalid'])
        self.assertIn('still', c.check(edited, locked))

    def test_edit_with_bump_passes_once_recorded(self):
        lists = json.loads((ROOT / 'data/lists.json').read_text())
        locked = {str(lists['list_version']): c.digest(lists)}
        edited = dict(lists, press=list(lists['press']) + ['example.invalid'], list_version=str(lists['list_version']) + 'b')
        self.assertIn('no recorded hash', c.check(edited, locked))
        locked[str(edited['list_version'])] = c.digest(edited)
        self.assertIsNone(c.check(edited, locked))


if __name__ == '__main__':
    unittest.main()
