import json,hashlib,pathlib,sys
# Usage: python3 scripts/import-tracker-quran.py /path/to/tanzil-download.txt
# Source URL and terms: docs/tracker.md. Never edit Quran strings manually.
raw=pathlib.Path(sys.argv[1]).read_text()
assert hashlib.sha256(raw.encode()).hexdigest() == 'ac0724796cbbda0f4801470fbbd11d0f3c5802067bae0493466d0128b0c667af', 'Source changed: perform a new content review and version bump'
lines=[l for l in raw.splitlines() if l and not l.startswith('#')]
counts=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]
assert len(lines)==sum(counts)==6236
verses={}; n=0
for s,c in enumerate(counts,1):
 for a in range(1,c+1): verses[f'{s}:{a}']=lines[n]; n+=1
notice=raw[raw.index('# PLEASE'):]
pathlib.Path('public/licenses/tanzil.txt').write_text(notice)
selected={k:v for k,v in verses.items() if int(k.split(':')[0]) in [1,2,18,67,112,113,114]}
data={'version':'2026.11.10-1','source':'https://tanzil.net','edition':'Tanzil Uthmani 1.1','retrieved':'2026-11-10','sha256':hashlib.sha256(raw.encode()).hexdigest(),'copyright':notice,'verses':selected}
pathlib.Path('src/data/quran.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
