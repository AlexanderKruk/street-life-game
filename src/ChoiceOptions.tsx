import { choiceOrderToken } from './legacyChoiceOrderCompatibility'
import { Children, Fragment, isValidElement, type ReactNode } from 'react'
import { shuffleChoiceOrder } from './streetChoiceOrder'

function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap(node => isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment ? flatten(node.props.children) : [node])
}

function identity(node: ReactNode): string {
  if (isValidElement<{ 'data-order-id'?: string; 'data-choice'?: string }>(node)) {
    const id = node.props['data-order-id'] ?? node.props['data-choice']
    if (id) return id
  }
  throw new Error('Shuffled choices require a stable ordering ID')
}

export function orderChoiceNodes(children: ReactNode, seed: number, decision: string, fixed = false): ReactNode[] {
  const nodes = flatten(children)
  if (fixed || nodes.length < 2) return nodes
  return shuffleChoiceOrder(nodes, seed, `${decision}|${nodes.map(identity).map(choiceOrderToken).join('|')}`)
}

export default function ChoiceOptions({ children, seed, decision, className, fixed = false }: { children: ReactNode; seed: number; decision: string; className?: string; fixed?: boolean }) {
  return <div className={`choice-options ${className ?? ''}`}>{orderChoiceNodes(children, seed, decision, fixed)}</div>
}
