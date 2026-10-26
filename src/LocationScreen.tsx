import type { GameAction, GameState, Location } from './game'
import { formatTime } from './game'
import type { Inventory, LifeSituation, StoredItems } from './stateTypes'
import { OPENING_CALLS, CALL_BATTERY_PER_MINUTE } from './openingCalls'
import { phoneDrainMultiplier } from './phonePower'
import { shelterQueueMinutes } from './shelterRules'
import { BACKPACK_CAPACITY, BOTTLE_DEPOSIT, SHOP_ITEMS, SCHRONISKO_FOOD_CAPACITY, canAddToBackpack, foodFreshnessLabel } from './inventory'
import { Icon } from './Icon'
import { LocationSummary, ShopHero } from './LocationPresentation'
import ClosedContent from './ClosedContent'
import AvailableFirst from './AvailableFirst'
import ChoiceButton from './ChoiceButton'
import ChoiceOptions from './ChoiceOptions'
import ShopCard from './ShopCard'

type ViewState = {
  current: Location; open: boolean; firstNight: boolean; game: GameState; streetIllustration?: string
  underRainCover: boolean; travelling: boolean; message: string; currentActions: GameAction[]
  shelterInterview: { step: 'reason' | 'action' | 'plan'; reason?: string; action?: string } | null
  choiceSeed: number; choiceDecisionKey: string; usedBackpackSlots: number; inventory: Inventory
  life: LifeSituation; insideNightShelter: boolean; usedStorageSlots: number; storageCapacity: number
  storage: StoredItems; shelterPhoneCharging: boolean; dayWorkEnergyRequired: number; streetChoiceGroups: string[][]
  nextOpeningCall?: (typeof OPENING_CALLS)[number]; phoneUnavailable: string | null
  musicWalkUsed: boolean; canWalkWithMusic: boolean; walkMusicCost: number; shelterBooked: boolean
  discoveredLocations: string[]; begging: { day: number; attempts: number }; streetBenchFound: boolean
  hygieneLimit: number; busy: boolean
}
type StoredItem = 'documents' | 'medicines' | 'cigarettes'
type Handlers = {
  answerShelterInterview: (value: string) => void
  returnBottles: () => void; buyShopItem: (id: string) => void; stealShopItem: (id: string) => void
  socialSupport: (kind: 'housing' | 'documents' | 'transport' | 'benefits') => void
  takeStoredItem: (item: StoredItem) => void; storeItem: (item: StoredItem) => void
  storeFood: () => void; takeStoredFood: () => void; chargePhone: () => void
  toggleShelterPhoneCharging: () => void; takeDayWork: () => void; hospitalVisit: () => void
  startOpeningCall: () => void; openPhone: () => void; walkCity: (withMusic?: boolean) => void
  goToShelter: () => void; goToWork: () => void; goToStation: () => void
  askForMoney: () => void; searchStreetBottles: () => void
  streetAction: (kind: 'find-bench' | 'bench-rest' | 'bench-sleep') => void
  act: (id: string) => void; actionUnavailableReason: (action: GameAction) => string | null
}

// Location presentation owns its sections and action cards. The game owner
// supplies eligibility and commands; this screen starts no timers or saves.
export default function LocationScreen({ state, handlers }: { state: ViewState; handlers: Handlers }) {
  const { current, open, firstNight, game, streetIllustration, underRainCover, travelling, message, currentActions, shelterInterview, choiceSeed, choiceDecisionKey, usedBackpackSlots, inventory, life, insideNightShelter, usedStorageSlots, storageCapacity, storage, shelterPhoneCharging, dayWorkEnergyRequired, streetChoiceGroups, nextOpeningCall, phoneUnavailable, musicWalkUsed, canWalkWithMusic, walkMusicCost, shelterBooked, discoveredLocations, begging, streetBenchFound, hygieneLimit, busy } = state
  const { answerShelterInterview, returnBottles, buyShopItem, stealShopItem, socialSupport, takeStoredItem, storeItem, storeFood, takeStoredFood, chargePhone, toggleShelterPhoneCharging, takeDayWork, hospitalVisit, startOpeningCall, openPhone, walkCity, goToShelter, goToWork, goToStation, askForMoney, searchStreetBottles, streetAction, act, actionUnavailableReason } = handlers
  return <div className="location-surface" inert={busy} aria-hidden={busy || undefined}>
      {current.id === 'shop' ? <ShopHero name={current.name} open={open} opensAt={current.open} closesAt={current.close} /> : <LocationSummary id={current.id} name={current.name} description={current.id === 'street' && firstNight && game.minutes >= 1320 ? 'Behind the lit windows, people are getting ready for bed. You sit outside with your backpack. You have nowhere to go, and no one is expecting you tonight.' : current.description} open={open} opensAt={current.open} night={current.id === 'street' && (game.minutes >= 1200 || game.minutes < 360)} streetIllustration={streetIllustration} />}
      {underRainCover && !travelling && <p className="rain-cover-status"><Icon name="umbrella" />Under cover</p>}
      {message && current.id !== 'street' && <section className="event"><span>●</span><p>{message}</p></section>}
      <ClosedContent closed={!open && current.id !== 'hospital' && !currentActions.some(action => actionUnavailableReason(action) === null)} opensAt={formatTime(current.open)}>
      {shelterInterview && <section className="shop">
        <div className="shop-heading"><div><p className="eyebrow">SOCIAL WORKER</p><h2>{shelterInterview.step === 'reason' ? 'Why do you still need a place?' : shelterInterview.step === 'action' ? 'What are you doing about your situation?' : 'What will you do next?'}</h2></div></div>
        <ChoiceOptions className="shop-grid" seed={choiceSeed} decision={`${choiceDecisionKey}|interview:${shelterInterview.step}`}>
          {shelterInterview.step === 'reason' && <>
            <button data-order-id="interview:reason:work" data-icon="coins" className="shop-item" onClick={() => answerShelterInterview('work')}><div><strong>I still can’t afford a place to live</strong><small>I’m trying to find a steady income.</small></div></button>
            <button data-order-id="interview:reason:documents" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('documents')}><div><strong>I need help with my paperwork</strong><small>I haven’t finished it yet.</small></div></button>
            <button data-order-id="interview:reason:health" data-icon="hospital" className="shop-item" onClick={() => answerShelterInterview('health')}><div><strong>I’m struggling with my health</strong><small>I need more time to recover.</small></div></button>
          </>}
          {shelterInterview.step === 'action' && <>
            <button data-order-id="interview:action:job" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('job')}><div><strong>I’m looking for work</strong><small>I’ve been sending applications.</small></div></button>
            <button data-order-id="interview:action:documents" data-icon="documents" className="shop-item" onClick={() => answerShelterInterview('documents')}><div><strong>I’m sorting out my documents or benefits</strong><small>I’ve started the paperwork.</small></div></button>
            <button data-order-id="interview:action:nothing" data-icon="thought" className="shop-item" onClick={() => answerShelterInterview('nothing')}><div><strong>Nothing concrete yet</strong><small>I haven’t made much progress.</small></div></button>
          </>}
          {shelterInterview.step === 'plan' && <>
            <button data-order-id="interview:plan:jobcenter" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('jobcenter')}><div><strong>I’ll go to the Job Centre</strong><small>They might help me find regular work.</small></div></button>
            <button data-order-id="interview:plan:daywork" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('daywork')}><div><strong>I’ll try day work</strong><small>I can earn something while looking for a steady job.</small></div></button>
            <button data-order-id="interview:plan:documents" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('documents')}><div><strong>I’ll finish the paperwork</strong><small>Then I can work out the next step.</small></div></button>
            <button data-order-id="interview:plan:nothing" data-icon="chat" className="shop-item" onClick={() => answerShelterInterview('nothing')}><div><strong>I can’t promise anything yet</strong><small>I don’t know what I can manage yet.</small></div></button>
          </>}
        </ChoiceOptions>
      </section>}
      {current.id === 'shop' && <section className="shop">
        <div className="shop-capacity"><Icon name="backpack" /><strong>Backpack</strong><span>{usedBackpackSlots} / {BACKPACK_CAPACITY} slots</span><div className="shop-capacity-bar" role="meter" aria-label="Backpack capacity" aria-valuenow={usedBackpackSlots} aria-valuemin={0} aria-valuemax={BACKPACK_CAPACITY}><i style={{ width: `${usedBackpackSlots / BACKPACK_CAPACITY * 100}%` }} /></div></div>
        {inventory.bottles > 0 && <ChoiceButton className="shop-return" onClick={returnBottles} disabled={!open} icon="bottle" label={`Return bottles & cans ×${inventory.bottles}`} detail={<small>Deposit return · 0.50 zł each · +{(inventory.bottles * BOTTLE_DEPOSIT).toFixed(2)} zł</small>} />}
        {[{ title: 'Food & drink', items: SHOP_ITEMS.slice(0, 5) }, { title: 'Care', items: SHOP_ITEMS.slice(5) }].map(group => <section className="shop-category" key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3><div className="shop-grid supply-grid">{group.items.map(item => <ShopCard key={item.id} item={item} open={open} fits={canAddToBackpack(inventory, item)} affordable={game.money >= item.price} onBuy={buyShopItem} onSteal={stealShopItem} />)}</div>
        </section>)}
      </section>}
      {current.id === 'support' && <section className="support-menu">
        <div className="section-title"><h2>Talk to a social worker</h2><span>Choose what you need help with</span></div>
        <AvailableFirst tag="div" className="support-grid" orderSeed={choiceSeed} decisionKey={`${choiceDecisionKey}|support`}>
          <button data-order-id="support:housing" data-icon="house" onClick={() => socialSupport('housing')} disabled={!open}><Icon name="house" /><div><strong>Housing</strong><small>{life.schroniskoReferral ? 'Referral issued · Schronisko unlocked' : 'Ask about stable accommodation'}</small></div></button>
          <button data-order-id="support:documents" data-icon="documents" onClick={() => socialSupport('documents')} disabled={!open}><Icon name="documents" /><div><strong>Documents</strong><small>{inventory.documents ? 'Documents complete' : 'Restore missing documents'}</small></div></button>
          <button data-order-id="support:transport" data-icon="ticket" onClick={() => socialSupport('transport')} disabled={!open || !inventory.documents}><Icon name="ticket" /><div><strong>Transport</strong><small>Apply for 3 days of free public transport</small></div></button>
          <button data-order-id="support:benefits" data-icon="coins" onClick={() => socialSupport('benefits')} disabled={!open || !inventory.documents}><Icon name="banknote" /><div><strong>Benefits</strong><small>Ask what financial support is available</small></div></button>
        </AvailableFirst>
      </section>}
      {((current.id === 'shelter' && insideNightShelter) || current.id === 'residential-shelter') && <section className="storage-panel">
        <div className="storage-heading"><div><p className="eyebrow">SAFE STORAGE</p><h2>Stored belongings</h2></div><span>{usedStorageSlots}/{storageCapacity} slots</span></div>
        <p className="storage-note">{current.id === 'residential-shelter' ? 'Schronisko gives you more long-term storage.' : 'Night shelter has limited storage.'} {current.id === 'residential-shelter' ? ' Water must stay in your backpack; Schronisko has a separate small food shelf.' : ' Food and water must stay in your backpack.'}</p>
        <div className="storage-grid">
          <div><strong><Icon name="documents" />Documents</strong><small>{storage.documents ? 'Stored safely' : inventory.documents ? 'Carried with you' : 'Missing'}</small><button onClick={() => storage.documents ? takeStoredItem('documents') : storeItem('documents')} disabled={!open || (storage.documents ? inventory.documents : !inventory.documents)}>{storage.documents ? 'Take' : 'Store'}</button></div>
          <div><strong><Icon name="pill" />Medicine ×{storage.medicines}</strong><small>Store/take up to one stack</small><button onClick={() => inventory.medicines > 0 ? storeItem('medicines') : takeStoredItem('medicines')} disabled={!open || (inventory.medicines <= 0 && storage.medicines <= 0)}>{inventory.medicines > 0 ? 'Store' : 'Take'}</button></div>
          <div><strong><Icon name="cigarette" />Cigarettes ×{storage.cigarettes}</strong><small>Store/take up to one stack</small><button onClick={() => inventory.cigarettes > 0 ? storeItem('cigarettes') : takeStoredItem('cigarettes')} disabled={!open || (inventory.cigarettes <= 0 && storage.cigarettes <= 0)}>{inventory.cigarettes > 0 ? 'Store' : 'Take'}</button></div>
          {current.id === 'residential-shelter' && <div><strong><Icon name="food" />Food ×{storage.food}/{SCHRONISKO_FOOD_CAPACITY}</strong><small>Separate food shelf · {storage.food > 0 ? `${foodFreshnessLabel(storage.foodFreshness)} · ${Math.round(storage.foodFreshness)}%` : 'empty'}</small><div className="freshness-bar"><i style={{ width: `${storage.food > 0 ? storage.foodFreshness : 0}%` }} /></div><button onClick={() => inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? storeFood() : takeStoredFood()} disabled={!open || ((inventory.food <= 0 || storage.food >= SCHRONISKO_FOOD_CAPACITY) && storage.food <= 0)}>{inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? 'Store' : 'Take'}</button></div>}
        </div>
      </section>}
      {(current.id === 'support' || current.id === 'residential-shelter') && <AvailableFirst className="charging-station" orderSeed={choiceSeed} decisionKey="charge">
        <button data-order-id="charge:public" data-icon="phone" className="action" onClick={chargePhone} disabled={!open || inventory.phoneBattery >= 100}>
          <div><strong><Icon name="plug" className="action-label-icon" />Charge phone</strong><small>Use a public power outlet.</small></div><span>+25% · ~30 min</span>
        </button>
      </AvailableFirst>}
      {current.id === 'shelter' && <AvailableFirst className="charging-station" orderSeed={choiceSeed} decisionKey="shelter-charge">
        <button data-order-id={shelterPhoneCharging ? 'charge:shelter-collect' : 'charge:shelter-start'} data-icon="phone" className="action" onClick={toggleShelterPhoneCharging} disabled={!insideNightShelter || (!shelterPhoneCharging && (inventory.phoneBattery >= 100 || inventory.phoneCondition <= 0))}>
          <div><strong><Icon name="plug" className="action-label-icon" />{shelterPhoneCharging ? 'Collect phone' : 'Leave phone charging'}</strong><small>{shelterPhoneCharging
            ? 'Charging while you do other things. Collect at any time.'
            : !insideNightShelter ? 'Available inside Night Shelter with an active bed, 18:00–08:00.'
            : inventory.phoneCondition <= 0 ? 'Your phone is not working.' : inventory.phoneBattery >= 100 ? 'Phone is fully charged.' : 'Leave it plugged in while you eat, shower or sleep. Also available during quiet hours.'}</small></div>
          <span>{shelterPhoneCharging ? `${Math.round(inventory.phoneBattery)}%` : '+60%/h · free'}</span>
        </button>
      </AvailableFirst>}
      {current.id === 'work' && <AvailableFirst className="actions" orderSeed={choiceSeed} decisionKey={`${choiceDecisionKey}|work`}>
        <button data-order-id="work:shift" data-icon="work" className="action" onClick={takeDayWork} disabled={!open || game.energy < dayWorkEnergyRequired}>
          <div><strong>Take a short shift</strong><small>{game.energy < dayWorkEnergyRequired ? `Need at least ${dayWorkEnergyRequired} Energy · current ${Math.floor(game.energy)}` : 'Physical work; collect your pay at the end.'}</small></div><span>+35 zł · ~180 min</span>
        </button>
      </AvailableFirst>}
      {current.id !== 'shop' && current.id !== 'work' && current.id !== 'support' && <>
        {current.id === 'street' ? <section className="story-choices location-actions-title">
          <h2>What do you do now?</h2>
        </section> : <div className="section-title location-actions-title"><h2>What do you do?</h2></div>}
        <AvailableFirst className={current.id === 'street' ? 'actions story-actions' : 'actions'} thoughtsOnly={current.id === 'street'} choiceGroups={streetChoiceGroups} orderSeed={choiceSeed} decisionKey={choiceDecisionKey}>
          {current.id === 'hospital' && <>
            <button data-order-id="hospital:appointment" data-icon="hospital" className="action" onClick={hospitalVisit} disabled={!open || !inventory.documents}><div><strong><Icon name="hospital" className="action-label-icon" />Regular medical appointment</strong><small>{!inventory.documents ? 'Documents required.' : open ? 'See a doctor and receive proper treatment.' : 'Regular care is closed.'}</small></div><span>~90 min</span></button>
          </>}
          {current.id === 'street' && <>
            {nextOpeningCall && <button data-icon="phone" className="action" data-choice="phone-call" onClick={startOpeningCall} disabled={!!phoneUnavailable || inventory.phoneBattery < nextOpeningCall.minutes * CALL_BATTERY_PER_MINUTE * phoneDrainMultiplier(inventory.phoneCondition)}><div><strong><Icon name="phone" className="action-label-icon" />{nextOpeningCall.label}</strong></div><span>~{nextOpeningCall.minutes} min</span></button>}
            <button data-icon="phone" className="action" data-choice="phone-help" onClick={openPhone}><div><strong><Icon name="phone" className="action-label-icon" />{shelterBooked || discoveredLocations.some(id => ['shelter', 'support', 'daycenter', 'free-clinic', 'residential-shelter'].includes(id)) ? 'Look for more help on my phone.' : 'Look for help on my phone. There might be somewhere I can stay.'}</strong></div></button>
            {!musicWalkUsed && <button data-icon="headphones" className="action" data-choice="music-walk" onClick={() => walkCity(true)} disabled={!canWalkWithMusic}><div><strong><span className="choice-emoji" aria-hidden="true">🎧</span>Put on something familiar and walk for a while. Clear my head.</strong><small>{canWalkWithMusic ? 'Listen to a few familiar songs.' : 'Needs a working phone, mobile service and enough battery.'}</small></div><span>~30 min · −{walkMusicCost.toFixed(1)}% battery</span></button>}
            {discoveredLocations.includes('shelter') && <button data-icon="bed" className="action" data-choice="shelter-route" disabled={firstNight && !shelterBooked} onClick={goToShelter}><div><strong><span className="choice-emoji" aria-hidden="true">🛏️</span>{shelterBooked ? 'Go back to Night Shelter. I have a bed there.' : 'What about Night Shelter? Maybe there is a place.'}</strong><small>{shelterBooked ? 'You have a reserved bed.' : firstNight ? 'Registration is closed. Try to arrive before 18:00 for the next intake; places are limited.' : 'Try to arrive before 18:00; places are limited.'}</small></div><span>Choose route</span></button>}
            {!firstNight && discoveredLocations.includes('work') && <button data-icon="work" className="action" data-choice="work-route" onClick={goToWork}><div><strong>Go to Day Work</strong><small>Ask about a short shift.</small></div><span>Choose route</span></button>}
            {<button data-icon="station" className="action" data-choice="station-route" aria-label="Try the station. At least I’d be out of the cold." onClick={goToStation}><div><strong><span className="choice-emoji" aria-hidden="true">🚉</span>Try the station. At least I’d be out of the cold.</strong><small>A place to sit; safe sleep is not guaranteed.</small></div><span>Choose route</span></button>}
            {!firstNight && <button data-icon="coins" className="action" data-choice="beg" onClick={askForMoney} disabled={(begging.day === game.day ? begging.attempts : 0) >= 3}><div><strong>🤲 Ask someone for change? It’s hard, but I could try.</strong><small>{(begging.day === game.day ? begging.attempts : 0) >= 3 ? 'No attempts left today.' : `${3 - (begging.day === game.day ? begging.attempts : 0)}/3 attempts left today.`}</small></div><span>~45 min</span></button>}
            {!firstNight && <button data-icon="bottle" className="action" data-choice="bottles" onClick={searchStreetBottles}><div><strong>Maybe there are bottles I could return for a little money.</strong><small>Move rubbish aside. Collect intact deposit bottles and cans.</small></div><span>~10–60 min</span></button>}
            {!streetBenchFound && <button data-icon="bench" className="action" data-choice="find-bench" onClick={() => streetAction('find-bench')}><div><strong>🪑 Is there a bench nearby? My legs could use a break.</strong><small>Find somewhere to sit or sleep.</small></div><span>~20 min</span></button>}
            {streetBenchFound && <button data-icon="bench" className="action" data-choice="bench-rest" onClick={() => streetAction('bench-rest')}><div><strong>🪑 I’ll sit for a bit. Just get off my feet.</strong><small>Recover some Energy.</small></div><span>~45 min</span></button>}
            {streetBenchFound && <button data-icon="bed" className="action" data-choice="bench-sleep" onClick={() => streetAction('bench-sleep')}><div><strong>😴 Could I sleep here? What about my backpack…</strong><small>Still exposed, but better than sleeping on the ground.</small></div><span>Choose duration</span></button>}
          </>}
          {currentActions.length ? currentActions.map((action) => {
            const registering = action.id === 'shelter-rest' && !shelterBooked
            const selectableSleep = action.id === 'street-sleep' || action.id === 'station-sleep' || (action.id === 'shelter-rest' && shelterBooked) || action.id === 'residential-sleep'
            const unavailableReason = actionUnavailableReason(action)
            const unavailable = unavailableReason !== null
            return <button data-icon={action.icon} className="action" data-choice={action.id} key={action.id} onClick={() => act(action.id)} disabled={unavailable}>
              <div><strong>{action.id === 'street-sleep' && <span className="choice-emoji" aria-hidden="true">🛌</span>}{registering ? 'Join registration queue' : action.id === 'shelter-rest' ? 'Use your reserved bed' : action.id === 'street-sleep' ? 'Lie down here? I’m not sure… But I could try.' : action.name}</strong><small>{registering ? life.shelterRegistrationAttemptDay === game.day ? 'No places left for you today. Arrive before 18:00 tomorrow.' : 'Doors 18:00 · registration 18:20–22:00. Your arrival time sets queue priority; arrive early.' : action.id === 'shelter-rest' ? 'Entry 18:00–22:00. Once inside, use your bed any time until morning. Leave by 08:00.' : action.id === 'shelter-shower' || action.id === 'daycenter-shower' ? inventory.showerGel > 0 ? `3-in-1 gel: Hygiene gain ×1.5, max ${hygieneLimit} · uses 1 automatically.` : `Water only: Hygiene max ${Math.min(70, hygieneLimit)}. Bring 3-in-1 shower gel for better cleaning.` : action.description}{(action.id === 'shelter-shower' || action.id === 'daycenter-shower') && hygieneLimit < 100 && ` Dirty clothes: Hygiene max ${hygieneLimit}.`}{unavailableReason && <em className="action-unavailable-reason">{unavailableReason}</em>}</small>{action.impacts && <span className="shop-impact" aria-label="Effects">{action.impacts.map(impact => <em className="positive" key={impact}>{impact}</em>)}</span>}</div>
              <span>{selectableSleep ? 'Choose duration' : <>{action.cost ? `${action.cost} zł · ` : ''}~{registering ? shelterQueueMinutes(game.minutes) : action.minutes} min</>}</span>
            </button>
          }) : <p className="empty" data-order-id="location:empty">Nothing useful to do here yet.</p>}
        </AvailableFirst>
      </>}
      </ClosedContent>
    </div>
}
