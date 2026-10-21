# Street Life character and event artwork

The authoritative protagonist reference is [hero-reference.webp](hero-reference.webp), derived from the existing `event-door-think-call.webp`, `event-bench-conversation.webp` and `street-hero.webp` artwork. Use the younger standing protagonist, not the elderly bench character.

Keep his late-thirties face, tousled wavy dark brown hair, short stubble, lean ordinary build, charcoal hooded field jacket, dark sweater, blue jeans, dark walking boots and practical black backpack. He is a recently displaced office worker; avoid stereotyped ragged clothing. There is one backpack, either worn or placed nearby.

New scenes use the same cinematic realistic painterly treatment, amber practical lights, slate ambient colors and autumn Warsaw setting. Event and outcome artwork is 16:9. Ordinary and critical D20 successes share a success image; failures share a failure image.

Thirty new scene/outcome images cover all ten previously unillustrated catalog events and the separate rain/canopy flow. Quiet waking selects ground, bench or night-shelter artwork from the actual sleep context. The four existing first-night events and their twelve outcome images are retained.

All assets are in `public/assets`. `src/eventArtwork.ts` adds presentation without modifying probabilities, eligibility, checks, time or resource changes. `scripts/optimize-images.py` discovers new event originals and creates 480/768/1024-pixel WebP variants. They load on demand, outside the startup image warmup.

Generation used the built-in image tool, with one call per asset and the reference sheet plus corresponding scene as visual inputs. [generation-manifest.json](generation-manifest.json) retains the exact prompt set and reference mapping. Original generated images are preserved by the image generation service; project assets use WebP.

The ambient/patrol expansion adds 28 images: seven openings and three distinct answer results per scene. [ambient-patrol-generation.json](ambient-patrol-generation.json) records every exact prompt, reference and project asset path. These use the same authoritative hero sheet; outcome generation also references its opening image for continuity. The night-rustle cat appears only in the inspection result, never in the opening, waiting or leaving artwork. Patrol results show no document or ticket, so they also fit missing or stored ID. All new assets have 480/768/1024-pixel variants and restore on pending-encounter reload.
