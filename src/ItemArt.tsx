import { spriteImageSet } from './responsiveImages'
import { memo } from 'react'

const positions = {
  water: '0% 0%', food: '100% 0%', bread: '0% 33.333333%', cannedFood: '100% 33.333333%',
  wipes: '0% 66.666667%', showerGel: '100% 66.666667%', cigarettes: '0% 100%', medicines: '100% 100%',
  phone: '0% 0%', clothing: '100% 0%', documents: '0% 50%', transitCard: '100% 50%',
  bottles: '0% 100%', empty: '100% 100%',
}
export type ItemArtId = keyof typeof positions
const equipment = new Set<ItemArtId>(['phone', 'clothing', 'documents', 'transitCard', 'bottles', 'empty'])

export default memo(function ItemArt({ id, className = 'inventory-art' }: { id: ItemArtId; className?: string }) {
  const essentials = equipment.has(id)
  if (id === 'bottles') return <span className={className} aria-hidden="true" style={{
    backgroundImage: 'url("/street-life-game/assets/trash-plastic.webp"), url("/street-life-game/assets/trash-can.webp")',
    backgroundSize: '62% 88%, 42% 65%',
    backgroundPosition: '10% 50%, 95% 65%',
    backgroundRepeat: 'no-repeat',
  }} />
  return <span className={className} aria-hidden="true" style={{
    backgroundImage: spriteImageSet(essentials ? 'inventory-equipment' : 'shop-products'),
    backgroundPosition: positions[id], backgroundSize: essentials ? '200% 300%' : '200% 400%',
  }} />
})
