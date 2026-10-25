import { ModalAction } from './Modal'
import InventoryDialog from './InventoryDialog'

export default function DiscardDialog({ name, quantity, spoiledQuantity, onCancel, onConfirm, onDiscardSpoiled }: { name: string; quantity: number; spoiledQuantity?: number; onCancel: () => void; onConfirm: () => void; onDiscardSpoiled: () => void }) {
  return <InventoryDialog icon="trash" title={`Discard ${name} ×${quantity}?`} description={`${spoiledQuantity !== undefined ? `${spoiledQuantity} of ${quantity} portions in this slot are spoiled. Remove only those, or discard the entire slot. Remaining food of the same type fills the gap without changing its freshness.` : 'This removes the contents of this slot from your backpack.'} You cannot get discarded items back.`} onCancel={onCancel}>
    <div className="sleep-choice-buttons discard-actions"><ModalAction variant="secondary" type="button" onClick={onCancel}>Cancel</ModalAction>{spoiledQuantity !== undefined && <ModalAction type="button" variant="danger" className="discard-spoiled" disabled={spoiledQuantity === 0} onClick={onDiscardSpoiled}>Discard spoiled ×{spoiledQuantity}</ModalAction>}<ModalAction type="button" variant="danger" className="discard-confirm" onClick={onConfirm}>Discard all</ModalAction></div>
  </InventoryDialog>
}
