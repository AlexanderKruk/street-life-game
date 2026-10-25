import { Children, Fragment, cloneElement, isValidElement, type ReactNode } from 'react'
import { Icon, choiceIcon } from './Icon'
import { locations, destinationTravelTimeRange } from './game'
import { approximateDuration, standardizeChoiceButton } from './ChoiceButton'
import { orderChoiceNodes } from './ChoiceOptions'
import { shuffleChoiceOrder } from './streetChoiceOrder'
import { SLEEP_HOURS } from './sleepRules'

// Flatten conditional fragments before sorting, so custom and configured
// actions share one available-first ordering and keep their order within a group.
export default function AvailableFirst({ children, className, tag = 'section', thoughtsOnly = false, choiceGroups, orderSeed = 0, decisionKey = '' }: { children: ReactNode; className: string; tag?: 'section' | 'div'; thoughtsOnly?: boolean; choiceGroups?: string[][]; orderSeed?: number; decisionKey?: string }) {
  function flatten(nodes: ReactNode): ReactNode[] {
    return Children.toArray(nodes).flatMap(node =>
      isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment ? flatten(node.props.children) : [node])
  }
  function thoughtOnly(node: ReactNode): ReactNode {
    if (!isValidElement<{ children?: ReactNode; 'data-choice'?: string }>(node) || node.type !== 'button') return node
    const id = node.props['data-choice'] ?? ''
    const icon = choiceIcon(id)
    const route = { 'station-route': 'station', 'shelter-route': 'shelter', 'work-route': 'work' }[id as 'station-route' | 'shelter-route' | 'work-route']
    function textOf(children: ReactNode): string {
      return Children.toArray(children).map(child => isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : String(child)).join('')
    }
    const metadata = Children.toArray(node.props.children).find(part => isValidElement(part) && part.type === 'span')
    const text = isValidElement<{ children?: ReactNode }>(metadata) ? textOf(metadata.props.children) : ''
    const minutes = text.match(/~(\d+)(?:[–-](\d+))? min/)
    const destination = route ? locations.find(place => place.id === route) : undefined
    const duration = destination ? `${approximateDuration(destinationTravelTimeRange(destination, 'transit').min)}+`
      : text === 'Choose duration' ? `${approximateDuration(SLEEP_HOURS[0] * 60)}+`
      : minutes ? minutes[2] ? `≈${minutes[1]}–${minutes[2]}m` : approximateDuration(Number(minutes[1])) : null
    return cloneElement(node, {}, Children.toArray(node.props.children)
      .filter(part => !isValidElement(part) || part.type !== 'span')
      .map(part => isValidElement<{ children?: ReactNode }>(part) && part.type === 'div'
        ? cloneElement(part, {}, <Icon name={icon} className="story-action-icon" />, Children.toArray(part.props.children)
          .filter(detail => !isValidElement<{ className?: string }>(detail) || detail.type !== 'small' || detail.props.className?.split(' ').includes('choice-estimate'))
          .map(detail => isValidElement<{ children?: ReactNode }>(detail) && detail.type === 'strong'
            ? cloneElement(detail, {}, Children.toArray(detail.props.children)
              .filter(text => !isValidElement(text) || text.type !== 'span')
              .map(text => typeof text === 'string' ? text.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+\s*/u, '') : text))
            : detail), duration && !Children.toArray(part.props.children).some(detail => isValidElement<{ className?: string }>(detail) && detail.props.className?.split(' ').includes('choice-estimate'))
              ? <small className="choice-estimate choice-duration">{duration}</small> : null)
        : part))
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
    return <Tag className={className}>{ordered.filter(node => !disabled(node)).map(standardizeChoiceButton)}{ordered.filter(disabled).map(standardizeChoiceButton)}</Tag>
  }
  const ordered = orderChoiceNodes(nodes, orderSeed, decisionKey)
  const available = ordered.filter(node => !disabled(node))
  const unavailable = ordered.filter(disabled)
  const Tag = tag
  return <Tag className={className}>{available.map(standardizeChoiceButton)}{unavailable.length > 0 && <p className="unavailable-heading">Unavailable now</p>}{unavailable.map(standardizeChoiceButton)}</Tag>
}

