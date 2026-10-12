import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function imageCacheWorker(images) {
  const version = createHash('sha256').update(JSON.stringify(images)).digest('hex').slice(0, 16)
  return `// Generated from image contents; HTML and application code are never cached here.
const PREFIX = 'street-life-images-v1-';
const CACHE = PREFIX + '${version}';
const IMAGES = ${JSON.stringify(images)};
const entries = new Map(IMAGES.map(image => [new URL(image.url, self.location.origin).href, image]));
const keyFor = image => image.url + '?imageRevision=' + image.revision;

async function loadImage(image) {
  const cache = await caches.open(CACHE);
  const key = keyFor(image);
  const cached = await cache.match(key);
  if (cached) return cached;
  // Reuse identical images from the previous version instead of downloading them again.
  for (const name of await caches.keys()) {
    if (!name.startsWith(PREFIX) || name === CACHE) continue;
    const previous = await (await caches.open(name)).match(key);
    if (previous) {
      await cache.put(key, previous.clone());
      return previous;
    }
  }
  const response = await fetch(image.url, { cache: 'reload' });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
    throw new Error('Image cache: invalid response for ' + image.url);
  }
  await cache.put(key, response.clone());
  return response;
}

self.addEventListener('install', event => {
  event.waitUntil(Promise.all(IMAGES.map(loadImage)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const image = entries.get(event.request.url);
  if (!image) return;
  event.respondWith(loadImage(image).catch(() => fetch(event.request)));
});
`
}

export function imageCachePlugin() {
  let config
  return {
    name: 'street-life-image-cache',
    apply: 'build',
    configResolved(resolved) { config = resolved },
    generateBundle() {
      const directory = resolve(config.publicDir, 'assets')
      const images = readdirSync(directory).filter(name => /\.(webp|png|jpe?g|gif|svg|avif)$/i.test(name)).sort().map(name => ({
        url: `${config.base}assets/${name}`,
        revision: createHash('sha256').update(readFileSync(resolve(directory, name))).digest('hex'),
      }))
      this.emitFile({ type: 'asset', fileName: 'image-cache-sw.js', source: imageCacheWorker(images) })
    },
  }
}
