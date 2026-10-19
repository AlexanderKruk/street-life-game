export const FOOD_KINDS = ['food', 'bread', 'readyMeal'] as const
export type FoodKind = typeof FOOD_KINDS[number]
export type FoodCondition = 'fresh' | 'stale' | 'spoiled'
type FreshnessKey = `${FoodKind}Freshness`
type PortionsKey = `${FoodKind}Portions`
export type FoodPortionFields = Partial<Record<PortionsKey, number[]>>
type FoodStock = Partial<Record<FoodKind | FreshnessKey, number>> & FoodPortionFields
export const FOOD_STACK_SIZE = 4

export function foodCondition(freshness: number): FoodCondition {
  return freshness > 50 ? 'fresh' : freshness > 20 ? 'stale' : 'spoiled'
}

export function isPerishableFood(id: string): id is FoodKind {
  return FOOD_KINDS.some(kind => kind === id)
}

export function averageFreshness(portions: readonly number[]) {
  return portions.length ? portions.reduce((sum, freshness) => sum + freshness, 0) / portions.length : 100
}

export function foodPortions(stock: FoodStock, kind: FoodKind): number[] {
  const count = Math.max(0, Math.floor(stock[kind] ?? 0))
  const saved = stock[`${kind}Portions`]
  if (Array.isArray(saved) && saved.length === count && saved.every(value => Number.isFinite(value) && value >= 0 && value <= 100)) return saved
  // Old saves only know one freshness value. Preserve that known condition;
  // every subsequent addition keeps its own age instead of refreshing old food.
  const legacy = stock[`${kind}Freshness`] ?? 100
  const freshness = Number.isFinite(legacy) ? Math.max(0, Math.min(100, legacy)) : 100
  return Array.from({ length: count }, () => freshness)
}

export function withFoodPortions<T extends FoodStock>(stock: T, kind: FoodKind, portions: readonly number[]): T {
  return { ...stock, [kind]: portions.length, [`${kind}Freshness`]: averageFreshness(portions), [`${kind}Portions`]: [...portions] }
}

export function addFoodPortions<T extends FoodStock>(stock: T, kind: FoodKind, portions: readonly number[]): T {
  return withFoodPortions(stock, kind, [...foodPortions(stock, kind), ...portions])
}

export function ageFood<T extends FoodStock>(stock: T, elapsed: number): T {
  let next = stock
  for (const kind of FOOD_KINDS) {
    if (!stock[kind]) continue
    const decay = elapsed * 100 / ((kind === 'bread' ? 24 : 48) * 60)
    next = withFoodPortions(next, kind, foodPortions(stock, kind).map(freshness => Math.max(0, freshness - decay)))
  }
  return next
}

export function foodSlot(stock: FoodStock, kind: FoodKind, index: number) {
  const portions = foodPortions(stock, kind).slice(index * FOOD_STACK_SIZE, (index + 1) * FOOD_STACK_SIZE)
  return { portions, quantity: portions.length, freshness: averageFreshness(portions), fresh: portions.filter(freshness => freshness > 50).length, stale: portions.filter(freshness => freshness > 20 && freshness <= 50).length, spoiled: portions.filter(freshness => freshness <= 20).length }
}

export function foodPortionIndex(stock: FoodStock, kind: FoodKind, slotIndex = 0, condition?: FoodCondition) {
  const offset = slotIndex * FOOD_STACK_SIZE
  const relative = foodPortions(stock, kind).slice(offset, offset + FOOD_STACK_SIZE).findIndex(freshness => !condition || foodCondition(freshness) === condition)
  return relative < 0 ? -1 : offset + relative
}

export function consumeFood<T extends FoodStock>(stock: T, kind: FoodKind, slotIndex = 0, condition?: FoodCondition): T {
  const index = foodPortionIndex(stock, kind, slotIndex, condition)
  return index < 0 ? stock : withFoodPortions(stock, kind, foodPortions(stock, kind).filter((_, offset) => offset !== index))
}

export function discardFood<T extends FoodStock>(stock: T, kind: FoodKind, slotIndex: number, spoiledOnly: boolean): T {
  const start = slotIndex * FOOD_STACK_SIZE
  // Filtering compacts following portions into the gap without changing age.
  return withFoodPortions(stock, kind, foodPortions(stock, kind).filter((freshness, index) =>
    index < start || index >= start + FOOD_STACK_SIZE || (spoiledOnly && freshness > 20)))
}
