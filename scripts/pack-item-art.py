"""Pack imagegen RGBA cutouts into the existing responsive item atlases.

No background removal or painting is performed here. Input images must already
have real transparency. The optional split correction only finds the clear gap
between the two generated shop sprites before centering them in square cells.
"""
import argparse
import json
from pathlib import Path

from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--shop-sheet', type=Path, required=True)
parser.add_argument('--phone', type=Path, required=True)
parser.add_argument('--clothing', type=Path, required=True)
parser.add_argument('--documents', type=Path, required=True)
parser.add_argument('--transit-card', type=Path, required=True)
parser.add_argument('--ready-meal', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
assets = root / 'public' / 'assets'
cell_size = 512


def rgba(path):
    image = Image.open(path).convert('RGBA')
    assert image.getchannel('A').getextrema()[0] == 0, f'{path}: transparent input required'
    return image


def fit_cell(image):
    # Ignore imperceptible alpha noise when measuring the silhouette's bounds.
    bounds = image.getchannel('A').point(lambda value: 255 if value > 25 else 0).getbbox()
    assert bounds, 'Missing item silhouette'
    item = image.crop(bounds)
    extent = round(cell_size * .90)
    item.thumbnail((extent, extent), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (cell_size, cell_size))
    tile.alpha_composite(item, ((cell_size - item.width) // 2, (cell_size - item.height) // 2))
    return tile


shop_source = rgba(args.shop_sheet)
shop = Image.new('RGBA', (cell_size * 2, cell_size * 4))
for row in range(4):
    strip = shop_source.crop((0, round(row * shop_source.height / 4), shop_source.width, round((row + 1) * shop_source.height / 4)))
    alpha = strip.getchannel('A').point(lambda value: 255 if value > 25 else 0)
    midpoint = strip.width // 2
    candidates = range(midpoint - strip.width // 16, midpoint + strip.width // 16)
    split = min(candidates, key=lambda x: (sum(alpha.crop((x, 0, x + 1, strip.height)).getdata()), abs(x - midpoint)))
    for col, (left, right) in enumerate(((0, split), (split, strip.width))):
        shop.alpha_composite(fit_cell(strip.crop((left, 0, right, strip.height))), (col * cell_size, row * cell_size))

equipment = Image.new('RGBA', (cell_size * 2, cell_size * 3))
for index, source in enumerate((args.phone, args.clothing, args.documents, args.transit_card)):
    equipment.alpha_composite(fit_cell(rgba(source)), ((index % 2) * cell_size, (index // 2) * cell_size))
# The unused final row stays transparent; deposit containers use trash sprites.
ready_meal = fit_cell(rgba(args.ready_meal))

manifest_path = root / 'src' / 'imageManifest.json'
manifest = json.loads(manifest_path.read_text())
for name, image in (('shop-products', shop), ('inventory-equipment', equipment)):
    image.save(assets / f'{name}.webp', 'WEBP', quality=92, method=6)
    variants = []
    for width in (256, 512, 768):
        height = round(image.height * width / image.width)
        filename = f'{name}-{width}.webp'
        image.resize((width, height), Image.Resampling.LANCZOS).save(assets / filename, 'WEBP', quality=82, method=6)
        variants.append({'width': width, 'height': height, 'file': filename})
    manifest[f'{name}.webp'] = {'width': image.width, 'height': image.height, 'variants': variants}
ready_meal.save(assets / 'ready-meal.webp', 'WEBP', quality=86, method=6)
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print('Packed transparent shop/equipment atlases, 1x/2x/3x variants and ready meal.')
