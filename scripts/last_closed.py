#!/usr/bin/env python3
"""Update the 'Last closed' line in README.md from the latest completed issue."""
import json, re, subprocess, datetime, sys
r = json.loads(subprocess.run(['gh','issue','list','-R','agamrafaeli-instinct/hn-1m-explorer','--state','closed','--search','sort:updated-desc reason:completed -label:epic','-L','1','--json','number,title,closedAt,url'],capture_output=True,text=True,check=True).stdout)[0]
t = datetime.datetime.fromisoformat(r['closedAt'].replace('Z','+00:00')).astimezone(datetime.timezone(datetime.timedelta(hours=7)))
line = '<!-- last-closed -->Last closed task: [#%d](%s) %s, %s (UTC+7). Live board: https://agamrafaeli-instinct.github.io/grandstand/<!-- /last-closed -->' % (r['number'], r['url'], r['title'], t.strftime('%b %-d, %-I:%M %p'))
s = open('README.md').read()
if '<!-- last-closed -->' in s: s = re.sub(r'<!-- last-closed -->.*?<!-- /last-closed -->', lambda m: line, s, flags=re.S)
else:
    a, b = s.split('\n', 1); s = a + '\n\n' + line + '\n' + b
open('README.md','w').write(s); print(line)
