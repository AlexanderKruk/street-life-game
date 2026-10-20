# Transparent item artwork — v259

The inventory and shop share isolated RGBA artwork for all nine products: water,
sandwich, bread roll, canned food, ready meal, wipes, shower gel, cigarettes and
medicine. Phone, clothing, documents and transit card have separate cutouts packed
into the existing equipment atlas. Deposit containers retain their existing
transparent bottle/can artwork.

The built-in imagegen tool removed the surfaces and regenerated the product
cutouts. Shower gel is navy, clothing olive, and phone edges have lighter
highlights. `item-cutout-generation.json` retains the exact selected prompts and
reference mapping; original references are available in git at v256. A first
equipment-sheet candidate was rejected because objects crossed tile boundaries.
The selected equipment cutouts were generated individually.

`scripts/pack-item-art.py` only crops transparent margins, centers/normalizes the
generated cutouts in square cells, packs the atlases and encodes WebP variants.
It does not generate artwork or remove backgrounds. Atlases retain the previous
item order, URLs and 1x/2x/3x selection. The image cache detects the new contents.

Backpack art remains centered independently of text/card height. Delete buttons
float in the top-left corner with no reserved space. Their dark outline follows
the SVG strokes, with no circle or background plate. Confirmation and inventory
logic are unchanged. The shop hero's mobile margins now match shell padding up
to 520px, fixing the pre-existing six-pixel overflow at 430px.

## Verification

- Existing full gameplay/regression suite passed after the UI changes.
- Final responsive-art, cache and rendering checks and production build passed.
- Chromium 153, DPR 2: 320, 390, 430 and 760px layouts have no horizontal overflow.
  All backpack sprites remain square and vertically centered; all nine product
  pictures have transparent backgrounds.
- Clicking the trash icon opens confirmation without consuming an item; cancel
  preserves the quantity. Buying water retains its normal three-portion increase.
- Browser checks reported no JavaScript errors. This is viewport emulation,
  not a physical iPhone test.
