"""Regenerate responsive WebP assets from retained originals (requires Pillow)."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'public' / 'assets'
widths = {
    'city-night': [480, 768, 1024],
    'street-hero': [480, 768, 1024, 1400],
    'phone-search': [480, 768, 1024, 1400],
    'help-morning': [480, 768, 1024, 1400],
    'shop-interior': [480, 768, 1440, 2172],
    'inventory-equipment': [256, 512, 768],
    'shop-products': [256, 512, 768],
}
manifest = {}
for name, sizes in widths.items():
    source = assets / f'{name}.webp'
    original = Image.open(source)
    variants = []
    for width in sizes:
        height = round(original.height * width / original.width)
        image = original.resize((width, height), Image.Resampling.LANCZOS)
        target = assets / f'{name}-{width}.webp'
        image.save(target, 'WEBP', quality=80, method=6)
        variants.append({'width': width, 'height': height, 'file': target.name})
        print(f'{target.name}: {width}x{height}, {target.stat().st_size // 1024} KB')
    manifest[source.name] = {'width': original.width, 'height': original.height, 'variants': variants}
(root / 'src' / 'imageManifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
