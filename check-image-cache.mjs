import assert from 'node:assert/strict'
import vm from 'node:vm'
import { imageCacheWorker } from './build/imageCache.mjs'

const stores = new Map()
const caches = {
  async keys() { return [...stores.keys()] },
  async delete(name) { return stores.delete(name) },
  async open(name) {
    if (!stores.has(name)) stores.set(name, new Map())
    const data = stores.get(name)
    return {
      async match(key) { return data.get(key)?.clone() },
      async put(key, response) { data.set(key, response.clone()) },
    }
  },
}
let requests = [], offline = false
function worker(images) {
  const listeners = {}, state = { skipped: false, claimed: false }
  vm.runInNewContext(imageCacheWorker(images), {
    URL, caches,
    fetch: async url => {
      if (offline) throw new Error('Offline')
      requests.push(typeof url === 'string' ? url : url.url)
      return new Response('image bytes', { headers: { 'content-type': 'image/webp' } })
    },
    self: {
      location: { origin: 'https://example.test' },
      addEventListener(type, listener) { listeners[type] = listener },
      async skipWaiting() { state.skipped = true },
      clients: { async claim() { state.claimed = true } },
    },
  })
  return {
    state,
    async lifecycle(type) {
      let completion
      listeners[type]({ waitUntil(promise) { completion = promise } })
      await completion
    },
    response(url, method = 'GET') {
      let response
      listeners.fetch({ request: { url: `https://example.test${url}`, method }, respondWith(promise) { response = promise } })
      return response
    },
    async warm(urls) {
      let completion
      listeners.message({ data: { type: 'WARM_IMAGES', urls }, waitUntil(promise) { completion = promise } })
      await completion
    },
  }
}
const firstImages = [{ url: '/street-life-game/assets/a.webp', revision: 'a1' }, { url: '/street-life-game/assets/b.webp', revision: 'b1' }]
const first = worker(firstImages)
await first.lifecycle('install')
assert.equal(requests.length, 0, 'installation never downloads all responsive sizes')
assert(first.state.skipped)
await first.lifecycle('activate')
assert(first.state.claimed)
await first.warm([firstImages[0].url, firstImages[0].url, '/unknown.webp'])
assert.deepEqual(requests, [firstImages[0].url], 'warmup only downloads selected valid variants once')
await first.warm([firstImages[1].url])
offline = true
assert.equal(await (await first.response(firstImages[0].url)).text(), 'image bytes', 'cached images work offline')
assert.equal(first.response('/street-life-game/'), undefined, 'HTML never intercepted')
assert.equal(first.response('/street-life-game/assets/app.js'), undefined, 'JS never intercepted')
assert.equal(first.response(firstImages[0].url, 'POST'), undefined)
assert.equal(requests.length, 2, 'cache hits avoid network')

// Offline warmup is optional and must not affect existing cached images.
const nextImages = [firstImages[0], { ...firstImages[1], revision: 'b2' }]
await first.warm([firstImages[0].url])
assert.equal(await (await first.response(firstImages[1].url)).text(), 'image bytes')
offline = false
requests = []
const next = worker(nextImages)
await next.lifecycle('install')
assert.equal(requests.length, 0, 'updates carry over identical cached images without network')
await next.lifecycle('activate')
assert.equal(stores.size, 1, 'old image caches are removed')
offline = true
await next.warm([firstImages[1].url])
assert.equal(await (await next.response(firstImages[0].url)).text(), 'image bytes', 'failed warmup preserves reused images')
offline = false
await next.warm(nextImages.map(image => image.url))
assert.deepEqual(requests, [firstImages[1].url], 'only the changed selected image is fetched')
requests = []
const unchanged = worker(nextImages)
await unchanged.lifecycle('install')
await unchanged.warm(nextImages.map(image => image.url))
assert.equal(requests.length, 0, 'unchanged deployment reuses all images')
console.log('PASS: selective image warmup, offline reads, content revisions, failed warmup, cache cleanup and network-only application code.')
