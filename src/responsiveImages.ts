import manifest from './imageManifest.json'

const base = '/street-life-game/assets/'
type ImageGroup = { width: number; height: number; variants: { width: number; height: number; file: string }[] }
const groups: Record<string, ImageGroup> = manifest
const fileName = (url: string) => url.split('/').pop() ?? ''

export function imageSizes(url: string) {
  if (fileName(url).startsWith('event-')) return '(min-width: 480px) 480px, calc(100vw - 24px)'
  switch (fileName(url)) {
    case 'city-map-dark.webp': return '(min-width: 760px) 760px, 100vw'
    case 'phone-search.webp': return '(min-width: 760px) 760px, max(100vw, clamp(267px, 50.7svh, 480px))'
    case 'shop-interior.webp': return '(min-width: 760px) 760px, max(100vw, 435px)'
    default: return '(min-width: 760px) 760px, max(100vw, clamp(284px, 53.3svh, 462px))'
  }
}

export function responsiveImageProps(url: string) {
  const group = groups[fileName(url)]
  if (!group) return { src: url }
  return {
    src: base + group.variants[0].file,
    srcSet: group.variants.map(image => `${base}${image.file} ${image.width}w`).join(', '),
    sizes: imageSizes(url),
    decoding: 'async' as const,
  }
}

export function spriteImageSet(name: 'inventory-equipment' | 'shop-products') {
  return `image-set(${groups[`${name}.webp`].variants.map((image, index) => `url("${base}${image.file}") ${index + 1}x`).join(', ')})`
}

// Match the rendered slot and density; never warm every responsive alternative.
export function warmImageUrls(width: number, height: number, density: number) {
  const dpr = Math.max(1, density)
  return Object.entries(groups).filter(([file]) => !file.startsWith('event-')).map(([file, group]) => {
    const sprite = file === 'inventory-equipment.webp' || file === 'shop-products.webp'
    if (sprite) return base + group.variants[Math.min(2, Math.ceil(dpr) - 1)].file
    let slot = Math.min(width, 760)
    if (file === 'phone-search.webp') slot = Math.max(slot, Math.min(360, Math.max(200, height * .38)) * 4 / 3)
    else if (file === 'shop-interior.webp') slot = Math.max(slot, 435)
    else slot = Math.max(slot, Math.min(260, Math.max(160, height * .30)) * 1400 / 788)
    const image = group.variants.find(image => image.width >= slot * dpr) ?? group.variants[group.variants.length - 1]
    return base + image.file
  })
}
