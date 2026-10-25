import { Icon, locationIcon } from './Icon'
import type { Location } from './game'
import { locationPresentation } from './resultPresentation'
import { practicalQuestions } from './phoneQuestions'

type Props = { mapPlaces: Location[]; answeredQuestions: string[] }
export default function PhoneNotesScreen({ mapPlaces, answeredQuestions }: Props) {
  return <div className="phone-notes-list">
        <p className="phone-section-label">Saved information</p>
        {mapPlaces.filter(place => place.id !== 'street').map(place => {
          const note = locationPresentation([place.id]).places?.[0]
          const details = practicalQuestions.filter(question => answeredQuestions.includes(question.id) && question.locations.includes(place.id) && question.text)
          return <article className="phone-note" key={place.id}>
            <div className="phone-note-heading"><h3><Icon name={locationIcon(place.id)} className="action-label-icon" />{place.name}</h3></div>
            <div className="phone-note-meta"><span>{note?.hours}</span><span className="on-map">On map</span></div>
            <p>{note?.detail ?? place.description}</p>
            {details.map(question => <details key={question.id}><summary>{question.noteTitle}</summary><p>{question.text}</p></details>)}
          </article>
        })}
        {answeredQuestions.includes('no-place') && <article className="phone-note"><div className="phone-note-heading"><h3>If there is no shelter bed</h3></div><p>{practicalQuestions.find(question => question.id === 'no-place')?.text}</p></article>}
      </div>
}
