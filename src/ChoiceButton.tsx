import { Children, cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Icon, choiceIcon, type IconName } from './Icon'

// Estimates are intentionally coarse; clocks and elapsed timers never use this formatter.
export function approximateDuration(minutes: number): string {
  const rounded = minutes > 0 ? Math.max(5, Math.round(minutes / 5) * 5) : 0
  const hours = Math.floor(rounded / 60)
  const rest = rounded % 60
  return `≈${hours ? `${hours}h` : ''}${rest || !hours ? `${hours ? ' ' : ''}${rest}m` : ''}`
}

export function roundDurationLabel(value: string): string {
  return value.replace(/[≈~](\d+)(?:[–-](\d+))?\s*(min|m|h)(?:\s*(\d+)m)?/g, (_, first, last, unit, rest) => {
    if (last) return `≈${Math.max(5, Math.round(Number(first) / 5) * 5)}–${Math.max(5, Math.round(Number(last) / 5) * 5)}${unit === 'h' ? 'h' : 'm'}`
    return approximateDuration(Number(first) * (unit === 'h' ? 60 : 1) + Number(rest ?? 0))
  })
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: ReactNode; detail?: ReactNode; duration?: ReactNode }

export default function ChoiceButton({ icon, label, detail, duration, className = '', ...props }: Props) {
  return <button {...props} className={`${className} choice-button`}>
    <Icon name={icon} className="choice-icon story-action-icon" />
    <div className="choice-copy"><strong>{label}</strong>{detail}</div>
    {duration && <small className="choice-time choice-estimate choice-duration event-choice-time">{duration}</small>}
  </button>
}

function textOf(children: ReactNode): string {
  return Children.toArray(children).map(node => isValidElement<{ children?: ReactNode }>(node) ? textOf(node.props.children) : String(node)).join('')
}

function descendants(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap(node => [node, ...(isValidElement<{ children?: ReactNode }>(node) ? descendants(node.props.children) : [])])
}

function cleanLabel(children: ReactNode): ReactNode {
  return Children.toArray(children).flatMap(node => {
    if (isValidElement<{ children?: ReactNode; className?: string }>(node)) {
      if (node.type === Icon || node.props.className === 'choice-emoji') return []
      return [cloneElement(node, {}, cleanLabel(node.props.children))]
    }
    return [typeof node === 'string' ? node.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+\s*/u, '') : node]
  })
}

// Existing action lists keep their handlers, disabled reasons and ordering while
// sharing the same visual component as authored event choices.
export function standardizeChoiceButton(node: ReactNode): ReactNode {
  if (!isValidElement<ButtonHTMLAttributes<HTMLButtonElement> & { 'data-choice'?: string }>(node) || node.type !== 'button') return node
  const all = descendants(node.props.children)
  const heading = all.find(part => isValidElement(part) && part.type === 'strong')
  const label = isValidElement<{ children?: ReactNode }>(heading) ? cleanLabel(heading.props.children) : cleanLabel(Children.toArray(node.props.children)[0])
  const existingIcon = all.find(part => isValidElement<{ name?: IconName }>(part) && part.type === Icon)
  const icon = isValidElement<{ name: IconName }>(existingIcon) ? existingIcon.props.name : choiceIcon(node.props['data-choice'] ?? '', textOf(label))
  const details: ReactNode[] = []
  let duration: string | undefined
  const timePattern = /[≈~]\d+(?:[–-]\d+)?\s*(?:min|m|h)(?:\s*\d+m)?\+?/
  for (const part of all) {
    if (!isValidElement<{ children?: ReactNode; className?: string }>(part) || part.type !== 'small') continue
    const value = textOf(part.props.children)
    const time = value.match(timePattern)?.[0]
    if (time) duration ??= roundDurationLabel(time)
    const remainder = time ? value.replace(time, '').replace(/^\s*·\s*|\s*·\s*$/g, '').trim() : null
    if (remainder) details.push(<small key={details.length}>{remainder}</small>)
    else if (!time) details.push(cloneElement(part, { key: details.length, className: `${part.props.className ?? ''} choice-description`.trim() }))
  }
  // Legacy actions store price, duration and benefits in a trailing span.
  if (heading) for (const part of Children.toArray(node.props.children)) {
    if (!isValidElement<{ children?: ReactNode }>(part) || part.type !== 'span') continue
    const value = textOf(part.props.children)
    const time = value.match(timePattern)?.[0]
    if (time) duration ??= roundDurationLabel(time)
    const rest = time ? value.replace(time, '').replace(/^\s*·\s*|\s*·\s*$/g, '').trim() : value
    if (rest) details.push(<small key={details.length}>{rest}</small>)
  }
  const impacts = all.filter(part => isValidElement<{ className?: string }>(part) && part.props.className === 'shop-impact')
  return <ChoiceButton {...node.props} key={node.key} icon={icon} label={label} detail={<>{details}{impacts}</>} duration={duration} />
}
