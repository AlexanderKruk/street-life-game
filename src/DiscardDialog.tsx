import { ModalAction } from './Modal'
import InventoryDialog from './InventoryDialog'
import { t } from './i18n'

export default function DiscardDialog({ name, quantity, spoiledQuantity, onCancel, onConfirm, onDiscardSpoiled }: { name: string; quantity: number; spoiledQuantity?: number; onCancel: () => void; onConfirm: () => void; onDiscardSpoiled: () => void }) {
  return <InventoryDialog icon="trash" title={t('discard.title', { name, quantity })} description={spoiledQuantity !== undefined ? t('discard.spoiledDescription', { spoiled: spoiledQuantity, quantity }) : t('discard.description')} onCancel={onCancel}>
    <div className="sleep-choice-buttons discard-actions"><ModalAction variant="secondary" type="button" onClick={onCancel}>{t('common.cancel')}</ModalAction>{spoiledQuantity !== undefined && <ModalAction type="button" variant="danger" className="discard-spoiled" disabled={spoiledQuantity === 0} onClick={onDiscardSpoiled}>{t('discard.spoiled', { quantity: spoiledQuantity })}</ModalAction>}<ModalAction type="button" variant="danger" className="discard-confirm" onClick={onConfirm}>{t('discard.all')}</ModalAction></div>
  </InventoryDialog>
}
