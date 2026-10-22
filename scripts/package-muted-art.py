"""Package approved imagegen edits without changing their color or content.

Input: a directory of per-asset JSON records containing name and generated path.
Only size normalization, WebP encoding and responsive variants happen here.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from io import BytesIO
from pathlib import Path
import re
import subprocess

from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('records', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
assets = root / 'public/assets'
manifest_path = root / 'src/imageManifest.json'
manifest = json.loads(manifest_path.read_text())
records = [json.loads(p.read_text()) for p in sorted(args.records.glob('*.json'))]
assert len({r['name'] for r in records}) == len(records), 'Duplicate asset records'
output = root / 'docs/art/muted-palette-generation.json'
old = json.loads(output.read_text()) if output.exists() else {}
source_commit = old.get('sourceCommit') or subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root).decode().strip()

def encode_webp(image, target, quality):
    encoded = BytesIO()
    image.save(encoded, 'WEBP', quality=quality, method=6)
    data = encoded.getvalue()
    assert len(data) > 0, f'{target}: empty encoded image'
    temporary = target.with_suffix('.webp.tmp')
    temporary.write_bytes(data)
    temporary.replace(target)

def package(record):
    name = record['name']
    assert re.fullmatch(r'[a-z0-9-]+', name), 'Invalid asset name'
    path = assets / f'{name}.webp'
    original = Image.open(path)
    size, mode = original.size, original.mode
    image = Image.open(record['path'])
    # No reframing: generated edits must already preserve the original ratio.
    assert abs(image.width / image.height - size[0] / size[1]) < .015, f'{name}: changed aspect ratio'
    if mode == 'RGBA':
        assert image.mode == 'RGBA', f'{name}: missing alpha channel'
        alpha = image.getchannel('A')
        assert alpha.getextrema()[0] == 0, f'{name}: missing transparent pixels'
        assert alpha.getextrema()[1] >= 250, f'{name}: item is not sufficiently opaque'
    image = image.convert(mode).resize(size, Image.Resampling.LANCZOS)
    encode_webp(image, path, 92)
    variants = manifest.get(path.name, {}).get('variants', [])
    # The unused city-night and standalone trash assets predate imageManifest.
    if not variants:
        variants = [{'file': p.name, 'width': int(p.stem.rsplit('-', 1)[1])}
                    for p in sorted(assets.glob(f'{name}-[0-9]*.webp'))
                    if p.stem.rsplit('-', 1)[1].isdigit()]
    for v in variants:
        w = v['width']
        h = round(image.height * w / image.width)
        encode_webp(image.resize((w, h), Image.Resampling.LANCZOS), assets / v['file'], 80)
    original_bytes = subprocess.check_output(['git', 'show', f'{source_commit}:public/assets/{path.name}'], cwd=root)
    details = {k: v for k, v in record.items() if k not in ('path', 'references')}
    references = []
    for ref in record.get('references', []):
        if ref.startswith(str(root) + '/'):
            ref = str(Path(ref).relative_to(root))
        elif '/generated_images/' in ref:
            ref = 'docs/art/muted-palette-reference.webp'
        references.append(ref)
    return {**details, 'sourceGeneration': Path(record['path']).name,
            'references': references, 'asset': f'public/assets/{path.name}',
            'originalSha256': hashlib.sha256(original_bytes).hexdigest(),
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'size': list(size), 'mode': mode,
            'responsive': [f"public/assets/{v['file']}" for v in variants]}

with ThreadPoolExecutor(max_workers=6) as pool:
    packaged = list(pool.map(package, records))
print(json.dumps({'packaged': len(packaged), 'files': sum(1 + len(r['responsive']) for r in packaged)}))
old.update({'generation': 'Built-in image_gen, one color-grade edit per existing asset; Pillow used only for size normalization and WebP encoding.',
            'date': '2026-10-22', 'paletteReference': 'docs/art/muted-palette-reference.webp',
            'heroReference': 'docs/art/hero-reference.webp',
            'prompts': 'docs/art/muted-palette-prompts.json',
            'sourceCommit': source_commit,
            'assets': packaged})
output.write_text(json.dumps(old, indent=2) + '\n')
