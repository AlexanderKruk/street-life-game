import { Children, Fragment, cloneElement, isValidElement, type ReactNode } from 'react'
import ChoiceButton, { type ChoiceButtonProps } from './ChoiceButton'
import { orderChoiceNodes } from './ChoiceOptions'
import { shuffleChoiceOrder } from './streetChoiceOrder'
import { t } from './i18n'

// Flatten conditional fragments before sorting, so custom and configured
// actions share one available-first ordering and keep their order within a group.
export default function AvailableFirst({ children, className, tag = 'section', thoughtsOnly = false, choiceGroups, orderSeed = 0, decisionKey = '' }: { children: ReactNode; className: string; tag?: 'section' | 'div'; thoughtsOnly?: boolean; choiceGroups?: string[][]; orderSeed?: number; decisionKey?: string }) {
  function flatten(nodes: ReactNode): ReactNode[] {
    return Children.toArray(nodes).flatMap(node =>
      isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment ? flatten(node.props.children) : [node])
  }
  function thoughtOnly(node: ReactNode): ReactNode {
    if (!isValidElement<ChoiceButtonProps>(node) || node.type !== ChoiceButton) return node
    return cloneElement(node, { detail: undefined, duration: undefined, estimate: node.props.thoughtEstimate ?? node.props.estimate })
  }
  const nodes = flatten(children).map(node => thoughtsOnly ? thoughtOnly(node) : node)
  const disabled = (node: ReactNode) => isValidElement<{ disabled?: boolean }>(node) && !!node.props.disabled
  if (thoughtsOnly && choiceGroups) {
    const find = (id: string) => nodes.find(node => isValidElement<{ 'data-choice'?: string }>(node) && node.props['data-choice'] === id)
    const selected = choiceGroups.slice(0, 3).flatMap(group => {
      const candidates = group.map(find).filter(node => node !== undefined)
      const selected = candidates.find(node => !disabled(node)) ?? candidates[0]
      return selected ? [selected] : []
    })
    const ids = selected.map(node => isValidElement<{ 'data-choice'?: string }>(node) ? node.props['data-choice'] : '').join('|')
    const ordered = shuffleChoiceOrder(selected, orderSeed, `${decisionKey}|${ids}`)
    const Tag = tag
    return <Tag className={className}>{ordered.filter(node => !disabled(node))}{ordered.filter(disabled)}</Tag>
  }
  const ordered = orderChoiceNodes(nodes, orderSeed, decisionKey)
  const available = ordered.filter(node => !disabled(node))
  const unavailable = ordered.filter(disabled)
  const Tag = tag
  return <Tag className={className}>{available}{unavailable.length > 0 && <p className="unavailable-heading">{t('choice.unavailable')}</p>}{unavailable}</Tag>
}

