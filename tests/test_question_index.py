import json,pathlib,tempfile,sys,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from build_question_index import build
class QuestionIndex(unittest.TestCase):
 def test_source_questions_only(self):
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t)/'stories';p.mkdir();(p/'index.json').write_text('{"ids":["h1"]}');(p/'h1.json').write_text('{"id":"h1","question":"A question?","opening":"Ignore this"}')
   self.assertEqual(build(t),[{'id':'h1','question':'A question?'}]);self.assertNotIn('opening',(p/'questions.json').read_text())
   (p/'h1.json').write_text('{"id":"h1"}')
   with self.assertRaises(ValueError):build(t)
