import { Children, Fragment, isValidElement, type ReactNode } from 'react'
import { standardizeChoiceButton } from './ChoiceButton'
import { shuffleChoiceOrder } from './streetChoiceOrder'

function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap(node => isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment ? flatten(node.props.children) : [node])
}

function text(children: ReactNode): string {
  return Children.toArray(children).map(node => isValidElement<{ children?: ReactNode }>(node) ? text(node.props.children) : String(node)).join('')
}

function identity(node: ReactNode): string {
  if (!isValidElement<{ children?: ReactNode; 'aria-label'?: string; 'data-choice'?: string }>(node)) return String(node)
  if (node.props['data-choice'] || node.props['aria-label']) return node.props['data-choice'] ?? node.props['aria-label']!
  function heading(children: ReactNode): string | undefined {
    for (const child of Children.toArray(children)) if (isValidElement<{ children?: ReactNode }>(child)) {
      if (child.type === 'strong') return text(child.props.children)
      const found = heading(child.props.children)
      if (found) return found
    }
  }
  return heading(node.props.children) ?? text(node.props.children)
}

export function orderChoiceNodes(children: ReactNode, seed: number, decision: string, fixed = false): ReactNode[] {
  const nodes = flatten(children)
  const labels = nodes.map(identity)
  // Preserve conventional yes/no, accept/decline and do/leave pairs.
  const binary = nodes.length === 2 && labels.some(label => /^(yes\b|no\b|accept\b|decline\b|confirm\b|cancel\b|leave it\b|let it fall\b)/i.test(label.trim()))
  return fixed || binary ? nodes : shuffleChoiceOrder(nodes, seed, `${decision}|${labels.join('|')}`)
}

export default function ChoiceOptions({ children, seed, decision, className, fixed = false }: { children: ReactNode; seed: number; decision: string; className?: string; fixed?: boolean }) {
  return <div className={`choice-options ${className ?? ''}`}>{orderChoiceNodes(children, seed, decision, fixed).map(standardizeChoiceButton)}</div>
}
