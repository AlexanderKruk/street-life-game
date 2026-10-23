"""Normalize imagegen phone cutouts and encode responsive inventory variants.

Only transparent padding, uniform resizing and WebP encoding are performed.
Visual condition edits are generated with imagegen, not painted by this script.
"""
import argparse
import json
from pathlib import Path

from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
for state in ('good', 'worn', 'damaged'):
    parser.add_argument(f'--{state}', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
assets = root / 'public' / 'assets'
manifest_path = root / 'src' / 'imageManifest.json'
manifest = json.loads(manifest_path.read_text())

for state in ('good', 'worn', 'damaged'):
    source = Image.open(getattr(args, state)).convert('RGBA')
    alpha = source.getchannel('A')
    assert alpha.getextrema()[0] == 0, f'{state}: transparent source required'
    bounds = alpha.point(lambda value: 255 if value > 25 else 0).getbbox()
    assert bounds, f'{state}: missing phone silhouette'
    item = source.crop(bounds)
    item.thumbnail((460, 460), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (512, 512))
    canvas.alpha_composite(item, ((512 - item.width) // 2, (512 - item.height) // 2))
    name = f'item-phone-{state}'
    canvas.save(assets / f'{name}.webp', 'WEBP', quality=92, method=6)
    variants = []
    for width in (160, 320, 480):
        filename = f'{name}-{width}.webp'
        canvas.resize((width, width), Image.Resampling.LANCZOS).save(assets / filename, 'WEBP', quality=80, method=6)
        variants.append({'width': width, 'height': width, 'file': filename})
    manifest[f'{name}.webp'] = {'width': 512, 'height': 512, 'variants': variants}
    print(f'{name}: transparent 512px master and 160/320/480px density variants')

manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
