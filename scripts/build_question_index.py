"""Build question metadata only from published story sources."""
import json,pathlib

def build(site):
    site=pathlib.Path(site); folder=site/'stories'; ids=json.loads((folder/'index.json').read_text())['ids']; rows=[]
    for id in ids:
        story=json.loads((folder/(id+'.json')).read_text())
        if story.get('id')!=id or not isinstance(story.get('question'),str) or not story['question'].strip():
            raise ValueError('Missing published question: '+id)
        rows.append({'id':id,'question':story['question']})
    (folder/'questions.json').write_text(json.dumps({'schema':1,'questions':rows},ensure_ascii=False)+'\n')
    return rows
