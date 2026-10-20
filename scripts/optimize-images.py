"""Regenerate responsive WebP assets from retained originals (requires Pillow)."""
import json
import re
from io import BytesIO
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'public' / 'assets'
widths = {
    'event-door-walk': [480, 768, 1024],
    'event-door-stay': [480, 768, 1024],
    'event-door-think-call': [480, 768, 1024],
    'event-station-seat': [480, 768, 1024],
    'event-station-night': [480, 768, 1024],
    'event-station-quiet': [480, 768, 1024],
    'event-wake-sit': [480, 768, 1024],
    'event-wake-move': [480, 768, 1024],
    'event-wake-moment': [480, 768, 1024],

    'event-first-night-door': [480, 768, 1024],
    'event-first-night-bench': [480, 768, 1024],
    'event-first-night-station': [480, 768, 1024],
    'event-first-night-bench-wake': [480, 768, 1024],
    'event-bench-conversation': [480, 768, 1024],
    'event-bench-watch': [480, 768, 1024],
    'event-bench-space': [480, 768, 1024],
    'city-map-dark': [480, 768, 1024],
    'street-hero': [480, 768, 1024, 1400],
    'phone-search': [480, 768, 1024, 1400],
    'help-morning': [480, 768, 1024, 1400],
    'shop-interior': [480, 768, 1440, 2172],
    'inventory-equipment': [256, 512, 768],
    'shop-products': [256, 512, 768],
}
for source in sorted(assets.glob('event-*.webp')):
    if not re.search(r'-\d+\.webp$', source.name):
        widths.setdefault(source.stem, [480, 768, 1024])
manifest = {}
for name, sizes in widths.items():
    source = assets / f'{name}.webp'
    original = Image.open(source)
    variants = []
    for width in sizes:
        height = round(original.height * width / original.width)
        image = original.resize((width, height), Image.Resampling.LANCZOS)
        target = assets / f'{name}-{width}.webp'
        encoded = BytesIO()
        image.save(encoded, 'WEBP', quality=80, method=6)
        temporary = target.with_suffix('.webp.tmp')
        temporary.write_bytes(encoded.getvalue())
        temporary.replace(target)
        variants.append({'width': width, 'height': height, 'file': target.name})
        print(f'{target.name}: {width}x{height}, {target.stat().st_size // 1024} KB')
    manifest[source.name] = {'width': original.width, 'height': original.height, 'variants': variants}
(root / 'src' / 'imageManifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
