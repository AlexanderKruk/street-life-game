import { itemName } from './itemPresentation'
import { formatNumber } from './i18n/formatters'
import { impactChip } from './effectChips'
import type { GameAction, GameState, Location } from './game'
import { formatTime, locations, destinationTravelTimeRange } from './game'
import { SLEEP_HOURS } from './sleepRules'
import { t } from './i18n'
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
  const routeEstimate = (id: string) => ({ minutes: destinationTravelTimeRange(locations.find(place => place.id === id)!, 'transit').min, atLeast: true })
  return <div className="location-surface" inert={busy} aria-hidden={busy || undefined}>
      {current.id === 'shop' ? <ShopHero name={current.name} open={open} opensAt={current.open} closesAt={current.close} /> : <LocationSummary id={current.id} name={current.name} description={current.id === 'street' && firstNight && game.minutes >= 1320 ? 'Behind the lit windows, people are getting ready for bed. You sit outside with your backpack. You have nowhere to go, and no one is expecting you tonight.' : current.description} open={open} opensAt={current.open} night={current.id === 'street' && (game.minutes >= 1200 || game.minutes < 360)} streetIllustration={streetIllustration} />}
      {underRainCover && !travelling && <p className="rain-cover-status"><Icon name="umbrella" />Under cover</p>}
      {message && current.id !== 'street' && <section className="event"><span>●</span><p>{message}</p></section>}
      <ClosedContent closed={!open && current.id !== 'hospital' && !currentActions.some(action => actionUnavailableReason(action) === null)} opensAt={formatTime(current.open)}>
      {shelterInterview && <section className="shop">
        <div className="shop-heading"><div><p className="eyebrow">SOCIAL WORKER</p><h2>{shelterInterview.step === 'reason' ? 'Why do you still need a place?' : shelterInterview.step === 'action' ? 'What are you doing about your situation?' : 'What will you do next?'}</h2></div></div>
        <ChoiceOptions className="shop-grid" seed={choiceSeed} decision={`${choiceDecisionKey}|interview:${shelterInterview.step}`}>
          {shelterInterview.step === 'reason' && <>
            <ChoiceButton data-order-id="interview:reason:work" data-icon="coins" className="shop-item" onClick={() => answerShelterInterview('work')} icon="coins" label={<>I still can’t afford a place to live</>}  detail={<><small className="choice-description">I’m trying to find a steady income.</small></>} />
            <ChoiceButton data-order-id="interview:reason:documents" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('documents')} icon="work" label={<>I need help with my paperwork</>}  detail={<><small className="choice-description">I haven’t finished it yet.</small></>} />
            <ChoiceButton data-order-id="interview:reason:health" data-icon="hospital" className="shop-item" onClick={() => answerShelterInterview('health')} icon="hospital" label={<>I’m struggling with my health</>}  detail={<><small className="choice-description">I need more time to recover.</small></>} />
          </>}
          {shelterInterview.step === 'action' && <>
            <ChoiceButton data-order-id="interview:action:job" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('job')} icon="work" label={<>I’m looking for work</>}  detail={<><small className="choice-description">I’ve been sending applications.</small></>} />
            <ChoiceButton data-order-id="interview:action:documents" data-icon="documents" className="shop-item" onClick={() => answerShelterInterview('documents')} icon="documents" label={<>I’m sorting out my documents or benefits</>}  detail={<><small className="choice-description">I’ve started the paperwork.</small></>} />
            <ChoiceButton data-order-id="interview:action:nothing" data-icon="thought" className="shop-item" onClick={() => answerShelterInterview('nothing')} icon="thought" label={<>Nothing concrete yet</>}  detail={<><small className="choice-description">I haven’t made much progress.</small></>} />
          </>}
          {shelterInterview.step === 'plan' && <>
            <ChoiceButton data-order-id="interview:plan:jobcenter" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('jobcenter')} icon="work" label={<>I’ll go to the Job Centre</>}  detail={<><small className="choice-description">They might help me find regular work.</small></>} />
            <ChoiceButton data-order-id="interview:plan:daywork" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('daywork')} icon="work" label={<>I’ll try day work</>}  detail={<><small className="choice-description">I can earn something while looking for a steady job.</small></>} />
            <ChoiceButton data-order-id="interview:plan:documents" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('documents')} icon="work" label={<>I’ll finish the paperwork</>}  detail={<><small className="choice-description">Then I can work out the next step.</small></>} />
            <ChoiceButton data-order-id="interview:plan:nothing" data-icon="chat" className="shop-item" onClick={() => answerShelterInterview('nothing')} icon="chat" label={<>I can’t promise anything yet</>}  detail={<><small className="choice-description">I don’t know what I can manage yet.</small></>} />
          </>}
        </ChoiceOptions>
      </section>}
      {current.id === 'shop' && <section className="shop">
        <div className="shop-capacity"><Icon name="backpack" /><strong>{t('inventory.backpack')}</strong><span>{t('inventory.capacity', { used: usedBackpackSlots, capacity: BACKPACK_CAPACITY })}</span><div className="shop-capacity-bar" role="meter" aria-label={t('inventory.capacityLabel')} aria-valuenow={usedBackpackSlots} aria-valuemin={0} aria-valuemax={BACKPACK_CAPACITY}><i style={{ width: `${usedBackpackSlots / BACKPACK_CAPACITY * 100}%` }} /></div></div>
        {inventory.bottles > 0 && <ChoiceButton className="shop-return" onClick={returnBottles} disabled={!open} icon="bottle" label={t('shop.returnContainers', { count: inventory.bottles })} detail={<small>{t('shop.returnDetail', { deposit: formatNumber(BOTTLE_DEPOSIT, 2, 2), payout: formatNumber(inventory.bottles * BOTTLE_DEPOSIT, 2, 2) })}</small>} />}
        {[{ id: 'food', title: t('shop.foodCategory'), items: SHOP_ITEMS.slice(0, 5) }, { id: 'care', title: t('shop.careCategory'), items: SHOP_ITEMS.slice(5) }].map(group => <section className="shop-category" key={group.id} aria-label={group.title}>
          <h3>{group.title}</h3><div className="shop-grid supply-grid">{group.items.map(item => <ShopCard key={item.id} item={item} open={open} fits={canAddToBackpack(inventory, item)} affordable={game.money >= item.price} onBuy={buyShopItem} onSteal={stealShopItem} />)}</div>
        </section>)}
      </section>}
      {current.id === 'support' && <section className="support-menu">
        <div className="section-title"><h2>Talk to a social worker</h2><span>Choose what you need help with</span></div>
        <AvailableFirst tag="div" className="support-grid" orderSeed={choiceSeed} decisionKey={`${choiceDecisionKey}|support`}>
          <ChoiceButton data-order-id="support:housing" data-icon="house" onClick={() => socialSupport('housing')} disabled={!open} icon="house" label={<>Housing</>}  detail={<><small className="choice-description">{life.schroniskoReferral ? 'Referral issued · Schronisko unlocked' : 'Ask about stable accommodation'}</small></>} />
          <ChoiceButton data-order-id="support:documents" data-icon="documents" onClick={() => socialSupport('documents')} disabled={!open} icon="documents" label={<>Documents</>}  detail={<><small className="choice-description">{inventory.documents ? 'Documents complete' : 'Restore missing documents'}</small></>} />
          <ChoiceButton data-order-id="support:transport" data-icon="ticket" onClick={() => socialSupport('transport')} disabled={!open || !inventory.documents} icon="ticket" label={<>Transport</>}  detail={<><small className="choice-description">Apply for 3 days of free public transport</small></>} />
          <ChoiceButton data-order-id="support:benefits" data-icon="coins" onClick={() => socialSupport('benefits')} disabled={!open || !inventory.documents} icon="banknote" label={<>Benefits</>}  detail={<><small className="choice-description">Ask what financial support is available</small></>} />
        </AvailableFirst>
      </section>}
      {((current.id === 'shelter' && insideNightShelter) || current.id === 'residential-shelter') && <section className="storage-panel">
        <div className="storage-heading"><div><p className="eyebrow">{t('inventory.storage.label')}</p><h2>{t('inventory.storage.title')}</h2></div><span>{t('inventory.storage.capacity', { used: usedStorageSlots, capacity: storageCapacity })}</span></div>
        <p className="storage-note">{t(current.id === 'residential-shelter' ? 'inventory.storage.residentialNote' : 'inventory.storage.nightNote')}</p>
        <div className="storage-grid">
          <div><strong><Icon name="documents" />{itemName('documents')}</strong><small>{t(storage.documents ? 'inventory.storage.documentsStored' : inventory.documents ? 'inventory.storage.documentsCarried' : 'inventory.documents.missing')}</small><button onClick={() => storage.documents ? takeStoredItem('documents') : storeItem('documents')} disabled={!open || (storage.documents ? inventory.documents : !inventory.documents)}>{t(storage.documents ? 'inventory.storage.take' : 'inventory.storage.store')}</button></div>
          <div><strong><Icon name="pill" />{t('inventory.namedQuantity', { name: itemName('medicines'), quantity: storage.medicines })}</strong><small>{t('inventory.storage.stackHint')}</small><button onClick={() => inventory.medicines > 0 ? storeItem('medicines') : takeStoredItem('medicines')} disabled={!open || (inventory.medicines <= 0 && storage.medicines <= 0)}>{t(inventory.medicines > 0 ? 'inventory.storage.store' : 'inventory.storage.take')}</button></div>
          <div><strong><Icon name="cigarette" />{t('inventory.namedQuantity', { name: itemName('cigarettes'), quantity: storage.cigarettes })}</strong><small>{t('inventory.storage.stackHint')}</small><button onClick={() => inventory.cigarettes > 0 ? storeItem('cigarettes') : takeStoredItem('cigarettes')} disabled={!open || (inventory.cigarettes <= 0 && storage.cigarettes <= 0)}>{t(inventory.cigarettes > 0 ? 'inventory.storage.store' : 'inventory.storage.take')}</button></div>
          {current.id === 'residential-shelter' && <div><strong><Icon name="food" />{t('inventory.storage.foodQuantity', { quantity: storage.food, capacity: SCHRONISKO_FOOD_CAPACITY })}</strong><small>{storage.food > 0 ? t('inventory.storage.foodHint', { freshness: foodFreshnessLabel(storage.foodFreshness), percent: Math.round(storage.foodFreshness) }) : t('inventory.storage.foodEmpty')}</small><div className="freshness-bar"><i style={{ width: `${storage.food > 0 ? storage.foodFreshness : 0}%` }} /></div><button onClick={() => inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? storeFood() : takeStoredFood()} disabled={!open || ((inventory.food <= 0 || storage.food >= SCHRONISKO_FOOD_CAPACITY) && storage.food <= 0)}>{t(inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? 'inventory.storage.store' : 'inventory.storage.take')}</button></div>}
        </div>
      </section>}
      {(current.id === 'support' || current.id === 'residential-shelter') && <AvailableFirst className="charging-station" orderSeed={choiceSeed} decisionKey="charge">
        <ChoiceButton data-order-id="charge:public" data-icon="phone" className="action" onClick={chargePhone} disabled={!open || inventory.phoneBattery >= 100} icon="plug" label={<>Charge phone</>} estimate={{ minutes: 30 }} detail={<><small className="choice-description">Use a public power outlet.</small><small>+25%</small></>} />
      </AvailableFirst>}
      {current.id === 'shelter' && <AvailableFirst className="charging-station" orderSeed={choiceSeed} decisionKey="shelter-charge">
        <ChoiceButton data-order-id={shelterPhoneCharging ? 'charge:shelter-collect' : 'charge:shelter-start'} data-icon="phone" className="action" onClick={toggleShelterPhoneCharging} disabled={!insideNightShelter || (!shelterPhoneCharging && (inventory.phoneBattery >= 100 || inventory.phoneCondition <= 0))} icon="plug" label={<>{shelterPhoneCharging ? 'Collect phone' : 'Leave phone charging'}</>}  detail={<><small className="choice-description">{shelterPhoneCharging
            ? 'Charging while you do other things. Collect at any time.'
            : !insideNightShelter ? 'Available inside Night Shelter with an active bed, 18:00–08:00.'
            : inventory.phoneCondition <= 0 ? 'Your phone is not working.' : inventory.phoneBattery >= 100 ? 'Phone is fully charged.' : 'Leave it plugged in while you eat, shower or sleep. Also available during quiet hours.'}</small><small>{shelterPhoneCharging ? `${Math.round(inventory.phoneBattery)}%` : '+60%/h · free'}</small></>} />
      </AvailableFirst>}
      {current.id === 'work' && <AvailableFirst className="actions" orderSeed={choiceSeed} decisionKey={`${choiceDecisionKey}|work`}>
        <ChoiceButton data-order-id="work:shift" data-icon="work" className="action" onClick={takeDayWork} disabled={!open || game.energy < dayWorkEnergyRequired} icon="work" label={<>Take a short shift</>} estimate={{ minutes: 180 }} detail={<><small className="choice-description">{game.energy < dayWorkEnergyRequired ? `Need at least ${dayWorkEnergyRequired} Energy · current ${Math.floor(game.energy)}` : 'Physical work; collect your pay at the end.'}</small><small>+35 zł</small></>} />
      </AvailableFirst>}
      {current.id !== 'shop' && current.id !== 'work' && current.id !== 'support' && <>
        {current.id === 'street' ? <section className="story-choices location-actions-title">
          <h2>What do you do now?</h2>
        </section> : <div className="section-title location-actions-title"><h2>What do you do?</h2></div>}
        <AvailableFirst className={current.id === 'street' ? 'actions story-actions' : 'actions'} thoughtsOnly={current.id === 'street'} choiceGroups={streetChoiceGroups} orderSeed={choiceSeed} decisionKey={choiceDecisionKey}>
          {current.id === 'hospital' && <>
            <ChoiceButton data-order-id="hospital:appointment" data-icon="hospital" className="action" onClick={hospitalVisit} disabled={!open || !inventory.documents} icon="hospital" label={<>Regular medical appointment</>} estimate={{ minutes: 90 }} detail={<><small className="choice-description">{!inventory.documents ? 'Documents required.' : open ? 'See a doctor and receive proper treatment.' : 'Regular care is closed.'}</small></>} />
          </>}
          {current.id === 'street' && <>
            {nextOpeningCall && <ChoiceButton data-icon="phone" className="action" data-choice="phone-call" onClick={startOpeningCall} disabled={!!phoneUnavailable || inventory.phoneBattery < nextOpeningCall.minutes * CALL_BATTERY_PER_MINUTE * phoneDrainMultiplier(inventory.phoneCondition)} icon="phone" label={<>{nextOpeningCall.label}</>} estimate={{ minutes: nextOpeningCall.minutes }} />}
            <ChoiceButton data-icon="phone" className="action" data-choice="phone-help" onClick={openPhone} icon="phone" label={<>{shelterBooked || discoveredLocations.some(id => ['shelter', 'support', 'daycenter', 'free-clinic', 'residential-shelter'].includes(id)) ? 'Look for more help on my phone.' : 'Look for help on my phone. There might be somewhere I can stay.'}</>}  />
            {!musicWalkUsed && <ChoiceButton data-icon="headphones" className="action" data-choice="music-walk" onClick={() => walkCity(true)} disabled={!canWalkWithMusic} icon="headphones" label={<>Put on something familiar and walk for a while. Clear my head.</>} estimate={{ minutes: 30 }} detail={<><small className="choice-description">{canWalkWithMusic ? 'Listen to a few familiar songs.' : 'Needs a working phone, mobile service and enough battery.'}</small></>} />}
            {discoveredLocations.includes('shelter') && <ChoiceButton data-icon="bed" className="action" data-choice="shelter-route" disabled={firstNight && !shelterBooked} onClick={goToShelter} icon="bed" label={<>{shelterBooked ? 'Go back to Night Shelter. I have a bed there.' : 'What about Night Shelter? Maybe there is a place.'}</>} thoughtEstimate={routeEstimate('shelter')} detail={<><small className="choice-description">{shelterBooked ? 'You have a reserved bed.' : firstNight ? 'Registration is closed. Try to arrive before 18:00 for the next intake; places are limited.' : 'Try to arrive before 18:00; places are limited.'}</small></>} />}
            {!firstNight && discoveredLocations.includes('work') && <ChoiceButton data-icon="work" className="action" data-choice="work-route" onClick={goToWork} icon="work" label={<>Go to Day Work</>} thoughtEstimate={routeEstimate('work')} detail={<><small className="choice-description">Ask about a short shift.</small></>} />}
            {<ChoiceButton data-icon="station" className="action" data-choice="station-route" aria-label="Try the station. At least I’d be out of the cold." onClick={goToStation} icon="station" label={<>Try the station. At least I’d be out of the cold.</>} thoughtEstimate={routeEstimate('station')} detail={<><small className="choice-description">A place to sit; safe sleep is not guaranteed.</small></>} />}
            {!firstNight && <ChoiceButton data-icon="coins" className="action" data-choice="beg" onClick={askForMoney} disabled={(begging.day === game.day ? begging.attempts : 0) >= 3} icon="coins" label={<>Ask someone for change? It’s hard, but I could try.</>} estimate={{ minutes: 45 }} detail={<><small className="choice-description">{(begging.day === game.day ? begging.attempts : 0) >= 3 ? 'No attempts left today.' : `${3 - (begging.day === game.day ? begging.attempts : 0)}/3 attempts left today.`}</small></>} />}
            {!firstNight && <ChoiceButton data-icon="bottle" className="action" data-choice="bottles" onClick={searchStreetBottles} icon="bottle" label={<>Maybe there are bottles I could return for a little money.</>} estimate={{ minutes: 10, maxMinutes: 60 }} detail={<><small className="choice-description">Move rubbish aside. Collect intact deposit bottles and cans.</small></>} />}
            {!streetBenchFound && <ChoiceButton data-icon="bench" className="action" data-choice="find-bench" onClick={() => streetAction('find-bench')} icon="bench" label={<>Is there a bench nearby? My legs could use a break.</>} estimate={{ minutes: 20 }} detail={<><small className="choice-description">Find somewhere to sit or sleep.</small></>} />}
            {streetBenchFound && <ChoiceButton data-icon="bench" className="action" data-choice="bench-rest" onClick={() => streetAction('bench-rest')} icon="bench" label={<>I’ll sit for a bit. Just get off my feet.</>} estimate={{ minutes: 45 }} detail={<><small className="choice-description">Recover some Energy.</small></>} />}
            {streetBenchFound && <ChoiceButton data-icon="bed" className="action" data-choice="bench-sleep" onClick={() => streetAction('bench-sleep')} icon="bed" label={<>Could I sleep here? What about my backpack…</>} thoughtEstimate={{ minutes: SLEEP_HOURS[0] * 60, atLeast: true }} detail={<><small className="choice-description">Still exposed, but better than sleeping on the ground.</small><small>{t('choice.chooseDuration')}</small></>} />}
          </>}
          {currentActions.length ? currentActions.map((action) => {
            const registering = action.id === 'shelter-rest' && !shelterBooked
            const selectableSleep = action.id === 'street-sleep' || action.id === 'station-sleep' || (action.id === 'shelter-rest' && shelterBooked) || action.id === 'residential-sleep'
            const unavailableReason = actionUnavailableReason(action)
            const unavailable = unavailableReason !== null
            return <ChoiceButton data-icon={action.icon} className="action" data-choice={action.id} key={action.id} onClick={() => act(action.id)} disabled={unavailable} icon={action.icon} label={<>{registering ? 'Join registration queue' : action.id === 'shelter-rest' ? 'Use your reserved bed' : action.id === 'street-sleep' ? 'Lie down here? I’m not sure… But I could try.' : action.name}</>} estimate={selectableSleep ? undefined : { minutes: registering ? shelterQueueMinutes(game.minutes) : action.minutes }} thoughtEstimate={selectableSleep ? { minutes: SLEEP_HOURS[0] * 60, atLeast: true } : undefined} detail={<><small className="choice-description">{registering ? life.shelterRegistrationAttemptDay === game.day ? 'No places left for you today. Arrive before 18:00 tomorrow.' : 'Doors 18:00 · registration 18:20–22:00. Your arrival time sets queue priority; arrive early.' : action.id === 'shelter-rest' ? 'Entry 18:00–22:00. Once inside, use your bed any time until morning. Leave by 08:00.' : action.id === 'shelter-shower' || action.id === 'daycenter-shower' ? inventory.showerGel > 0 ? `3-in-1 gel: Hygiene gain ×1.5, max ${hygieneLimit} · uses 1 automatically.` : `Water only: Hygiene max ${Math.min(70, hygieneLimit)}. Bring 3-in-1 shower gel for better cleaning.` : action.description}{(action.id === 'shelter-shower' || action.id === 'daycenter-shower') && hygieneLimit < 100 && ` Dirty clothes: Hygiene max ${hygieneLimit}.`}{unavailableReason && <em className="action-unavailable-reason">{unavailableReason}</em>}</small>{selectableSleep ? <small>{t('choice.chooseDuration')}</small> : !!action.cost && <small>{action.cost} zł</small>}{action.impacts && <span className="shop-impact" aria-label="Effects">{action.impacts.map(id => impactChip(id)).map(chip => <em className={chip.kind} key={chip.id}>{chip.label}</em>)}</span>}</>} />
          }) : <p className="empty" data-order-id="location:empty">Nothing useful to do here yet.</p>}
        </AvailableFirst>
      </>}
      </ClosedContent>
    </div>
}
