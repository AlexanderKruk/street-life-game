import { actionName, actionDescription, showerDescription } from './actionText'
import { locationName, locationDescription } from './locationText'
import { itemName } from './itemPresentation'
import { formatNumber, formatMoney } from './i18n/formatters'
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
      {current.id === 'shop' ? <ShopHero name={locationName(current.id)} open={open} opensAt={current.open} closesAt={current.close} /> : <LocationSummary id={current.id} name={locationName(current.id)} description={current.id === 'street' && firstNight && game.minutes >= 1320 ? t('location.street.opening') : locationDescription(current.id)} open={open} opensAt={current.open} night={current.id === 'street' && (game.minutes >= 1200 || game.minutes < 360)} streetIllustration={streetIllustration} />}
      {underRainCover && !travelling && <p className="rain-cover-status"><Icon name="umbrella" />{t("action.ui.underCover")}</p>}
      {message && current.id !== 'street' && <section className="event"><span>●</span><p>{message}</p></section>}
      <ClosedContent closed={!open && current.id !== 'hospital' && !currentActions.some(action => actionUnavailableReason(action) === null)} opensAt={formatTime(current.open)}>
      {shelterInterview && <section className="shop">
        <div className="shop-heading"><div><p className="eyebrow">{t("action.interview.label")}</p><h2>{shelterInterview.step === 'reason' ? t("action.interview.reason.title") : shelterInterview.step === 'action' ? t("action.interview.action.title") : t("action.interview.plan.title")}</h2></div></div>
        <ChoiceOptions className="shop-grid" seed={choiceSeed} decision={`${choiceDecisionKey}|interview:${shelterInterview.step}`}>
          {shelterInterview.step === 'reason' && <>
            <ChoiceButton data-order-id="interview:reason:work" data-icon="coins" className="shop-item" onClick={() => answerShelterInterview('work')} icon="coins" label={<>{t("action.interview.reason.work")}</>}  detail={<><small className="choice-description">{t("action.interview.reason.workDetail")}</small></>} />
            <ChoiceButton data-order-id="interview:reason:documents" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('documents')} icon="work" label={<>{t("action.interview.reason.documents")}</>}  detail={<><small className="choice-description">{t("action.interview.reason.documentsDetail")}</small></>} />
            <ChoiceButton data-order-id="interview:reason:health" data-icon="hospital" className="shop-item" onClick={() => answerShelterInterview('health')} icon="hospital" label={<>{t("action.interview.reason.health")}</>}  detail={<><small className="choice-description">{t("action.interview.reason.healthDetail")}</small></>} />
          </>}
          {shelterInterview.step === 'action' && <>
            <ChoiceButton data-order-id="interview:action:job" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('job')} icon="work" label={<>{t("action.interview.action.job")}</>}  detail={<><small className="choice-description">{t("action.interview.action.jobDetail")}</small></>} />
            <ChoiceButton data-order-id="interview:action:documents" data-icon="documents" className="shop-item" onClick={() => answerShelterInterview('documents')} icon="documents" label={<>{t("action.interview.action.documents")}</>}  detail={<><small className="choice-description">{t("action.interview.action.documentsDetail")}</small></>} />
            <ChoiceButton data-order-id="interview:action:nothing" data-icon="thought" className="shop-item" onClick={() => answerShelterInterview('nothing')} icon="thought" label={<>{t("action.interview.action.nothing")}</>}  detail={<><small className="choice-description">{t("action.interview.action.nothingDetail")}</small></>} />
          </>}
          {shelterInterview.step === 'plan' && <>
            <ChoiceButton data-order-id="interview:plan:jobcenter" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('jobcenter')} icon="work" label={<>{t("action.interview.plan.jobcenter")}</>}  detail={<><small className="choice-description">{t("action.interview.plan.jobcenterDetail")}</small></>} />
            <ChoiceButton data-order-id="interview:plan:daywork" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('daywork')} icon="work" label={<>{t("action.interview.plan.daywork")}</>}  detail={<><small className="choice-description">{t("action.interview.plan.dayworkDetail")}</small></>} />
            <ChoiceButton data-order-id="interview:plan:documents" data-icon="work" className="shop-item" onClick={() => answerShelterInterview('documents')} icon="work" label={<>{t("action.interview.plan.documents")}</>}  detail={<><small className="choice-description">{t("action.interview.plan.documentsDetail")}</small></>} />
            <ChoiceButton data-order-id="interview:plan:nothing" data-icon="chat" className="shop-item" onClick={() => answerShelterInterview('nothing')} icon="chat" label={<>{t("action.interview.plan.nothing")}</>}  detail={<><small className="choice-description">{t("action.interview.plan.nothingDetail")}</small></>} />
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
        <div className="section-title"><h2>{t("action.support.title")}</h2><span>{t("action.support.prompt")}</span></div>
        <AvailableFirst tag="div" className="support-grid" orderSeed={choiceSeed} decisionKey={`${choiceDecisionKey}|support`}>
          <ChoiceButton data-order-id="support:housing" data-icon="house" onClick={() => socialSupport('housing')} disabled={!open} icon="house" label={<>{t("action.support.housing")}</>}  detail={<><small className="choice-description">{life.schroniskoReferral ? t("action.support.housingDone") : t("action.support.housingDetail")}</small></>} />
          <ChoiceButton data-order-id="support:documents" data-icon="documents" onClick={() => socialSupport('documents')} disabled={!open} icon="documents" label={<>{t("action.support.documents")}</>}  detail={<><small className="choice-description">{inventory.documents ? t("action.support.documentsDone") : t("action.support.documentsDetail")}</small></>} />
          <ChoiceButton data-order-id="support:transport" data-icon="ticket" onClick={() => socialSupport('transport')} disabled={!open || !inventory.documents} icon="ticket" label={<>{t("action.support.transport")}</>}  detail={<><small className="choice-description">{t("action.support.transportDetail")}</small></>} />
          <ChoiceButton data-order-id="support:benefits" data-icon="coins" onClick={() => socialSupport('benefits')} disabled={!open || !inventory.documents} icon="banknote" label={<>{t("action.support.benefits")}</>}  detail={<><small className="choice-description">{t("action.support.benefitsDetail")}</small></>} />
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
        <ChoiceButton data-order-id="charge:public" data-icon="phone" className="action" onClick={chargePhone} disabled={!open || inventory.phoneBattery >= 100} icon="plug" label={<>{t("action.charge.public")}</>} estimate={{ minutes: 30 }} detail={<><small className="choice-description">{t("action.charge.publicDetail")}</small><small>{t("action.charge.publicGain")}</small></>} />
      </AvailableFirst>}
      {current.id === 'shelter' && <AvailableFirst className="charging-station" orderSeed={choiceSeed} decisionKey="shelter-charge">
        <ChoiceButton data-order-id={shelterPhoneCharging ? 'charge:shelter-collect' : 'charge:shelter-start'} data-icon="phone" className="action" onClick={toggleShelterPhoneCharging} disabled={!insideNightShelter || (!shelterPhoneCharging && (inventory.phoneBattery >= 100 || inventory.phoneCondition <= 0))} icon="plug" label={<>{shelterPhoneCharging ? t("action.charge.collect") : t("action.charge.leave")}</>}  detail={<><small className="choice-description">{shelterPhoneCharging
            ? t("action.charge.collectDetail")
            : !insideNightShelter ? t("action.charge.outside")
            : inventory.phoneCondition <= 0 ? t("action.charge.broken") : inventory.phoneBattery >= 100 ? t("action.charge.full") : t("action.charge.leaveDetail")}</small><small>{shelterPhoneCharging ? t('format.percent', { amount: Math.round(inventory.phoneBattery) }) : t("action.charge.rate")}</small></>} />
      </AvailableFirst>}
      {current.id === 'work' && <AvailableFirst className="actions" orderSeed={choiceSeed} decisionKey={`${choiceDecisionKey}|work`}>
        <ChoiceButton data-order-id="work:shift" data-icon="work" className="action" onClick={takeDayWork} disabled={!open || game.energy < dayWorkEnergyRequired} icon="work" label={<>{t("action.work.title")}</>} estimate={{ minutes: 180 }} detail={<><small className="choice-description">{game.energy < dayWorkEnergyRequired ? t('action.work.energy', { required: dayWorkEnergyRequired, current: Math.floor(game.energy) }) : t("action.work.detail")}</small><small>{t("action.work.pay")}</small></>} />
      </AvailableFirst>}
      {current.id !== 'shop' && current.id !== 'work' && current.id !== 'support' && <>
        {current.id === 'street' ? <section className="story-choices location-actions-title">
          <h2>{t("action.ui.streetPrompt")}</h2>
        </section> : <div className="section-title location-actions-title"><h2>{t("action.ui.prompt")}</h2></div>}
        <AvailableFirst className={current.id === 'street' ? 'actions story-actions' : 'actions'} thoughtsOnly={current.id === 'street'} choiceGroups={streetChoiceGroups} orderSeed={choiceSeed} decisionKey={choiceDecisionKey}>
          {current.id === 'hospital' && <>
            <ChoiceButton data-order-id="hospital:appointment" data-icon="hospital" className="action" onClick={hospitalVisit} disabled={!open || !inventory.documents} icon="hospital" label={<>{t("action.hospital.title")}</>} estimate={{ minutes: 90 }} detail={<><small className="choice-description">{!inventory.documents ? t("action.hospital.documents") : open ? t("action.hospital.open") : t("action.hospital.closed")}</small></>} />
          </>}
          {current.id === 'street' && <>
            {nextOpeningCall && <ChoiceButton data-icon="phone" className="action" data-choice="phone-call" onClick={startOpeningCall} disabled={phoneUnavailable !== null || inventory.phoneBattery < nextOpeningCall.minutes * CALL_BATTERY_PER_MINUTE * phoneDrainMultiplier(inventory.phoneCondition)} icon="phone" label={<>{nextOpeningCall.label}</>} estimate={{ minutes: nextOpeningCall.minutes }} />}
            <ChoiceButton data-icon="phone" className="action" data-choice="phone-help" onClick={openPhone} icon="phone" label={<>{shelterBooked || discoveredLocations.some(id => ['shelter', 'support', 'daycenter', 'free-clinic', 'residential-shelter'].includes(id)) ? t("action.street.phoneKnown") : t("action.street.phoneUnknown")}</>}  />
            {!musicWalkUsed && <ChoiceButton data-icon="headphones" className="action" data-choice="music-walk" onClick={() => walkCity(true)} disabled={!canWalkWithMusic} icon="headphones" label={<>{t("action.street.music")}</>} estimate={{ minutes: 30 }} detail={<><small className="choice-description">{canWalkWithMusic ? t("action.street.musicDetail") : t("action.street.musicUnavailable")}</small></>} />}
            {discoveredLocations.includes('shelter') && <ChoiceButton data-icon="bed" className="action" data-choice="shelter-route" disabled={firstNight && !shelterBooked} onClick={goToShelter} icon="bed" label={<>{shelterBooked ? t("action.street.shelterBooked") : t("action.street.shelterUnbooked")}</>} thoughtEstimate={routeEstimate('shelter')} detail={<><small className="choice-description">{shelterBooked ? t("action.street.shelterBookedDetail") : firstNight ? t("action.street.shelterFirstNight") : t("action.street.shelterDetail")}</small></>} />}
            {!firstNight && discoveredLocations.includes('work') && <ChoiceButton data-icon="work" className="action" data-choice="work-route" onClick={goToWork} icon="work" label={<>{t("action.street.work")}</>} thoughtEstimate={routeEstimate('work')} detail={<><small className="choice-description">{t("action.street.workDetail")}</small></>} />}
            {<ChoiceButton data-icon="station" className="action" data-choice="station-route" aria-label={t("action.street.station")} onClick={goToStation} icon="station" label={<>{t("action.street.station")}</>} thoughtEstimate={routeEstimate('station')} detail={<><small className="choice-description">{t("action.street.stationDetail")}</small></>} />}
            {!firstNight && <ChoiceButton data-icon="coins" className="action" data-choice="beg" onClick={askForMoney} disabled={(begging.day === game.day ? begging.attempts : 0) >= 3} icon="coins" label={<>{t("action.street.beg")}</>} estimate={{ minutes: 45 }} detail={<><small className="choice-description">{(begging.day === game.day ? begging.attempts : 0) >= 3 ? t("action.street.begExhausted") : t('action.street.begRemaining', { count: 3 - (begging.day === game.day ? begging.attempts : 0) })}</small></>} />}
            {!firstNight && <ChoiceButton data-icon="bottle" className="action" data-choice="bottles" onClick={searchStreetBottles} icon="bottle" label={<>{t("action.street.bottles")}</>} estimate={{ minutes: 10, maxMinutes: 60 }} detail={<><small className="choice-description">{t("action.street.bottlesDetail")}</small></>} />}
            {!streetBenchFound && <ChoiceButton data-icon="bench" className="action" data-choice="find-bench" onClick={() => streetAction('find-bench')} icon="bench" label={<>{t("action.street.findBench")}</>} estimate={{ minutes: 20 }} detail={<><small className="choice-description">{t("action.street.findBenchDetail")}</small></>} />}
            {streetBenchFound && <ChoiceButton data-icon="bench" className="action" data-choice="bench-rest" onClick={() => streetAction('bench-rest')} icon="bench" label={<>{t("action.street.benchRest")}</>} estimate={{ minutes: 45 }} detail={<><small className="choice-description">{t("action.street.benchRestDetail")}</small></>} />}
            {streetBenchFound && <ChoiceButton data-icon="bed" className="action" data-choice="bench-sleep" onClick={() => streetAction('bench-sleep')} icon="bed" label={<>{t("action.street.benchSleep")}</>} estimate={{ minutes: SLEEP_HOURS[0] * 60, atLeast: true }} detail={<small className="choice-description">{t("action.street.benchSleepDetail")}</small>} />}
          </>}
          {currentActions.length ? currentActions.map((action) => {
            const registering = action.id === 'shelter-rest' && !shelterBooked
            const selectableSleep = action.id === 'street-sleep' || action.id === 'station-sleep' || (action.id === 'shelter-rest' && shelterBooked) || action.id === 'residential-sleep'
            const unavailableReason = actionUnavailableReason(action)
            const unavailable = unavailableReason !== null
            return <ChoiceButton data-icon={action.icon} className="action" data-choice={action.id} key={action.id} onClick={() => act(action.id)} disabled={unavailable} icon={action.icon} label={<>{registering ? t("action.shelter.register") : action.id === 'shelter-rest' ? t("action.shelter.bed") : action.id === 'street-sleep' ? t("action.street.groundSleep") : actionName(action.id)}</>} estimate={selectableSleep ? { minutes: SLEEP_HOURS[0] * 60, atLeast: true } : { minutes: registering ? shelterQueueMinutes(game.minutes) : action.minutes }} detail={<><small className="choice-description">{registering ? life.shelterRegistrationAttemptDay === game.day ? t("action.shelter.noPlaces") : t("action.shelter.registerDetail") : action.id === 'shelter-rest' ? t("action.shelter.bedDetail") : action.id === 'shelter-shower' || action.id === 'daycenter-shower' ? showerDescription(inventory.showerGel > 0, hygieneLimit) : actionDescription(action.id)}{unavailableReason && <em className="action-unavailable-reason">{unavailableReason}</em>}</small>{!selectableSleep && !!action.cost && <small>{formatMoney(action.cost)}</small>}{action.impacts && <span className="shop-impact" aria-label={t("action.ui.effects")}>{action.impacts.map(id => impactChip(id)).map(chip => <em className={chip.kind} key={chip.id}>{chip.label}</em>)}</span>}</>} />
          }) : <p className="empty" data-order-id="location:empty">{t("action.ui.empty")}</p>}
        </AvailableFirst>
      </>}
      </ClosedContent>
    </div>
}
