import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { build } from 'esbuild'

const { outputFiles } = await build({ entryPoints: ['src/responsiveImages.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { responsiveImageProps, spriteImageSet, warmImageUrls } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)
const manifest = JSON.parse(readFileSync('src/imageManifest.json', 'utf8'))
for (const [original, group] of Object.entries(manifest)) {
  const originalBytes = readFileSync(`public/assets/${original}`).length
  let previous = 0
  for (const image of group.variants) {
    assert(image.width > previous); previous = image.width
    assert(existsSync(`public/assets/${image.file}`))
    assert(readFileSync(`public/assets/${image.file}`).length > 0, 'responsive image must not be empty')
    assert(readFileSync(`public/assets/${image.file}`).length < originalBytes)
    assert(Math.abs(image.height / image.width - group.height / group.width) < .003)
  }
}
const street = responsiveImageProps('/street-life-game/assets/street-hero.webp')
assert.match(street.srcSet, /480w.*768w.*1024w.*1400w/)
assert(street.sizes.includes('svh'), 'cover cropping accounted for')
assert.match(responsiveImageProps('/street-life-game/assets/city-map-dark.webp').sizes, /760px/)
assert.match(spriteImageSet('inventory-equipment'), /256.webp.*1x.*512.webp.*2x.*768.webp.*3x/)
assert.deepEqual(responsiveImageProps('/unknown.webp'), { src: '/unknown.webp' })
const eventArt = responsiveImageProps('/street-life-game/assets/event-first-night-bench.webp')
assert.match(eventArt.srcSet, /480w.*768w.*1024w/)
assert(eventArt.sizes.includes('480px'))
const small = warmImageUrls(390, 844, 1)
const retina = warmImageUrls(390, 844, 3)
const desktop = warmImageUrls(1440, 900, 1)
assert(!small.some(url => url.includes('event-')), 'event illustrations load on demand')
assert.equal(small.length, 7); assert.equal(new Set(small).size, 7)
assert(small.every(url => url.includes('-480.webp') || url.includes('-256.webp')))
assert(retina.includes('/street-life-game/assets/city-map-dark-1024.webp'))
assert(retina.includes('/street-life-game/assets/inventory-equipment-768.webp'))
assert(desktop.includes('/street-life-game/assets/street-hero-768.webp'))
const total = urls => urls.reduce((sum, url) => sum + readFileSync(`public/assets/${url.split('/').pop()}`).length, 0)
console.log(`PASS: responsive variants, aspect ratios, density selection, selective warmup. Seven images: mobile 1x ${Math.round(total(small)/1024)} KB; mobile 3x ${Math.round(total(retina)/1024)} KB; desktop 1x ${Math.round(total(desktop)/1024)} KB.`)
