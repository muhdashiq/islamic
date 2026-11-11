"""Import the bundled verses' Alafasy timings from quran-align release-2016-11-24.
Usage: python3 scripts/import-quran-audio.py /path/to/Alafasy_128kbps.json
Audio binaries are downloaded only by explicit playback/download in the app.
"""
import hashlib
import json
import pathlib
import sys

raw = pathlib.Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(raw).hexdigest() == '55c1353848d8f3140abab72bb5d1d4533476a8219f6241079a425d232f001eb7', 'Review a changed timing source before importing'
source = {f"{v['surah']}:{v['ayah']}": v for v in json.loads(raw)}
quran = json.loads(pathlib.Path('src/data/quran.json').read_text())['verses']
verses = {}
overlaps = []
invalid = []
for key in quran:
    # A published overlap cannot honestly be split into exact individual words.
    # Keep its entire word/time range as one phrase highlight instead.
    merged = []
    for segment in source[key]['segments']:
        first, after, start, end = segment
        if end <= start:
            invalid.append(key)
            continue
        if merged and start < merged[-1][3]:
            previous = merged[-1]
            merged[-1] = [min(previous[0], first), max(previous[1], after), previous[2], max(previous[3], end)]
            overlaps.append(key)
        else:
            merged.append(list(segment))
    verses[key] = merged
result = {
    'version': 'alafasy-quran-align-2016-11-24-v1',
    'source': 'https://github.com/cpfair/quran-align/releases/tag/release-2016-11-24',
    'sourceSha256': hashlib.sha256(raw).hexdigest(),
    'license': 'CC BY 4.0; Copyright (c) 2016 Collin Fair',
    'adaptations': {'overlappingSegmentsGrouped': sorted(set(overlaps)), 'nonPositiveSpansOmitted': sorted(set(invalid)), 'note': 'First-verse indices exclude the unnumbered basmalah outside Al-Fatihah. Missing timing spans remain unhighlighted.'},
    'verses': verses,
}
pathlib.Path('src/data/quran-audio.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
