# Street Life character and event artwork

The authoritative protagonist reference is [hero-reference.webp](hero-reference.webp), derived from the existing `event-door-think-call.webp`, `event-bench-conversation.webp` and `street-hero.webp` artwork. Use the younger standing protagonist, not the elderly bench character.

Keep his late-thirties face, tousled wavy dark brown hair, short stubble, lean ordinary build, charcoal hooded field jacket, dark sweater, blue jeans, dark walking boots and practical black backpack. He is a recently displaced office worker; avoid stereotyped ragged clothing. There is one backpack, either worn or placed nearby.

New scenes must attach [illustration-style-reference.webp](illustration-style-reference.webp) for the established realistic painterly rendering and balanced light, alongside [hero-reference.webp](hero-reference.webp) for identity when needed. Use cool slate ambient colors with localized softly warm practical lights; preserve readable faces and clothing. Keep saturation restrained, avoiding both orange/gold grading across the entire image and an overly dark gray wash. The reference is also embedded in GAME_DESIGN.md. Event and outcome artwork is 16:9. Ordinary and critical D20 successes share a success image; failures share a failure image.

Thirty new scene/outcome images cover all ten previously unillustrated catalog events and the separate rain/canopy flow. Quiet waking selects ground, bench or night-shelter artwork from the actual sleep context. The four existing first-night events and their twelve outcome images are retained.

All assets are in `public/assets`. `src/eventArtwork.ts` adds presentation without modifying probabilities, eligibility, checks, time or resource changes. `scripts/optimize-images.py` discovers new event originals and creates 480/768/1024-pixel WebP variants. They load on demand, outside the startup image warmup.

Generation used the built-in image tool, with one call per asset and the reference sheet plus corresponding scene as visual inputs. [generation-manifest.json](generation-manifest.json) retains the exact prompt set and reference mapping. Original generated images are preserved by the image generation service; project assets use WebP.

The ambient/patrol expansion adds 28 images: seven openings and three distinct answer results per scene. [ambient-patrol-generation.json](ambient-patrol-generation.json) records every exact prompt, reference and project asset path. These use the same authoritative hero sheet; outcome generation also references its opening image for continuity. The night-rustle cat appears only in the inspection result, never in the opening, waiting or leaving artwork. Patrol results show no document or ticket, so they also fit missing or stored ID. All new assets have 480/768/1024-pixel variants and restore on pending-encounter reload.

Bench waking now has distinct Street and Station scene/answer sets. The existing outdoor set retains its older male passer-by. Four additional Station images use the same protagonist and a different female passenger with a suitcase inside the hall. Selection follows actual location, including a restored pending event. [bench-wake-station-generation.json](bench-wake-station-generation.json) records the selected prompts, references and assets; all new images have responsive 480/768/1024-pixel variants.

Nine main-location environment images cover Station, Night Shelter, Help Center, Schronisko, Day Center, Free Clinic, Hospital, Job Centre and Day Work. These show the places in everyday use, with roughly 5–10 visitors, residents, patients or workers and no protagonist; they are not event illustrations. [location-generation.json](location-generation.json) retains exact built-in image-generation prompts, references and saved asset paths. Responsive 480/768/1024/1400px variants load only for the visited place and stay outside startup warmup. Street and Shop retain their existing artwork.

## Opening phone calls — prepared artwork

[phone-call-generation.json](phone-call-generation.json) records three standalone split-screen images and their exact prompts: unanswered call with a quiet empty half and three dots, former colleague at home with family, and acquaintance renting one small room. The left half retains the same protagonist and residential bench. Each image has 480/768/1024px WebP variants. These assets are connected to the sequential opening-call results in v302.


## Familiar dog — v310

[neighbour-dog-generation.json](neighbour-dog-generation.json) records the four approved images: opening, avoiding the encounter, walking past and greeting the dog. All share the same hero, grey-haired neighbour, shaggy beige-grey dog, residential courtyard and muted evening palette. WebP masters plus 480/768/1024px variants load on demand for `first-night-dog`, outside startup warmup. Outcomes use their own illustrations in the shared blocking result modal. The opening remains eligible only before the first actual trip, like the neighbour returning with groceries.


## One quick call — v314

[borrow-phone-generation.json](borrow-phone-generation.json) records the seven approved illustrations and outcome prompts. The opening fixes both men, their clothes, the residential Warsaw street and night lighting; catch/drop also reference the slip image. The hero retains the authoritative identity sheet. Each WebP master has on-demand 480/768/1024px variants. The safe return, speakerphone, refusal and D20 success/failure results use their own images in the shared result modal; the slipping image is a saved continuation before the existing Reflex check.


## Room for one more — v316

[park-company-generation.json](park-company-generation.json) records the selected opening and four final outcome illustrations. The opening keeps only the olive-jacket man addressing the hero. Supporting characters change their posture, gestures and gaze by outcome: listening to the conversation, reacting to the argument, returning to their evening after refusal, or chatting/drinking while the hero takes another path. Identity, wardrobe, park bench and night light stay consistent. Five WebP masters and 480/768/1024px variants load on demand in the same event/result components as the neighbour. D20 success/failure each has one illustration, also used for natural 20/1.


## Timed rain — v319

`rain-choice-generation.json` records three intensity openings and nine choice outcomes. Drizzle/Downpour nearby cover is a small shop awning; Rain nearby cover is an autumn street tree. Proper cover is a deep dry passage. Carry on depicts exposed walking. Downpour scenes consistently use the raised jacket hood. All twelve images have on-demand 480/768/1024px variants; scene-specific English copy in `src/rain.ts` describes the pictured cover.

The shared `event-rain-stopped-search` result is exclusive to a shelter search interrupted by rain ending. It shows the hero looking at the cloudy sky, wet paving without large puddles, and no falling rain. The same image covers all three intensities; regular shelter/carry-on images are unchanged. `rain-stopped-search-generation.json` records the exact generation prompt and reference roles.
