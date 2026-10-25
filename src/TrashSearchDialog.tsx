import { Icon } from './Icon'
import { ModalOverlay, ModalPanel, ModalAction } from './Modal'
import TrashSearchTime from './TrashSearchTime'
import type { TrashBounds, TrashSearch } from './trashSearchRules'
type Props = {
  trashGame: TrashSearch; checkTrashDeadline: () => void; finishTrashSearch: () => void
  startTrashDrag: (id: number, x: number, y: number, bounds: TrashBounds) => boolean
  moveTrashItem: (id: number, x: number, y: number, bounds: TrashBounds) => void
  collectTrashBottle: (id: number) => void; endTrashDrag: (id: number) => boolean; cancelTrashDrag: () => void
}
export default function TrashSearchDialog({ trashGame, checkTrashDeadline, finishTrashSearch, startTrashDrag, moveTrashItem, collectTrashBottle, endTrashDrag, cancelTrashDrag }: Props) {
  return <ModalOverlay className="trash-overlay">
      <ModalPanel size="compact" className="trash-card" role="dialog" aria-modal="true" aria-labelledby="trash-title">
        <div className="trash-head"><Icon name="bottle" /><h2 id="trash-title">Look for bottles</h2></div>
        <p className="trash-tip">Drag rubbish out. Tap intact bottles & cans.</p>
        <div className="trash-search-row"><TrashSearchTime startedAt={trashGame.startedAt} onDeadline={checkTrashDeadline} /><span aria-label={`${trashGame.found} containers kept`}><Icon name="bottle" /><strong>{trashGame.found}</strong></span></div>
        <div className="trash-bin">
          <div className="trash-pile">
          {trashGame.items.map((item, index) => !item.collected && <button
            key={item.id}
            className={item.bottle ? 'trash-piece bottle-piece' : 'trash-piece'}
            aria-label={item.returnable ? item.art === 'can' ? 'Pick up can' : 'Pick up plastic bottle' : 'Drag rubbish aside · arrow keys to move'}
            data-art={item.art}
            style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`, zIndex: index + 2 }}
            onPointerDown={(e) => { const bounds = e.currentTarget.parentElement!.getBoundingClientRect(); if (startTrashDrag(item.id, e.clientX, e.clientY, bounds)) e.currentTarget.setPointerCapture(e.pointerId) }}
            onPointerMove={(e) => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; moveTrashItem(item.id, e.clientX, e.clientY, e.currentTarget.parentElement!.getBoundingClientRect()) }}
            onPointerUp={(e) => { const tapped = endTrashDrag(item.id); if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); if (tapped && item.returnable) collectTrashBottle(item.id) }}
            onPointerCancel={cancelTrashDrag}
            onClick={e => { if (e.detail === 0 && item.returnable) collectTrashBottle(item.id) }}
            onKeyDown={e => {
              const direction = ({ ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] } as Record<string, number[]>)[e.key]
              if (!direction) return
              e.preventDefault()
              const bounds = e.currentTarget.parentElement!.getBoundingClientRect()
              const x = bounds.left + item.x / 100 * bounds.width
              const y = bounds.top + item.y / 100 * bounds.height
              if (startTrashDrag(item.id, x, y, bounds)) moveTrashItem(item.id, x + direction[0], y + direction[1], bounds)
              cancelTrashDrag()
            }}
          ><img src={`/street-life-game/assets/trash-${item.art}.webp`} alt="" draggable={false} decoding="async" width="192" height="192" /></button>)}
          </div>
        </div>
        <ModalAction className="trash-stop" onClick={finishTrashSearch}>Finish searching</ModalAction>
      </ModalPanel>
    </ModalOverlay>
}
