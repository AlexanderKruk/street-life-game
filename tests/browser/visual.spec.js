import { test, expect, openGame, entries, findHelp, advance, readyForScreenshot, keys, presentStoryChoices } from './game.js'

const states = {
  street: async page => openGame(page),
  shop: async page => {
    const seed = entries()
    const game = JSON.parse(seed[keys.game])
    await openGame(page, { ...seed, [keys.game]: JSON.stringify({ ...game, locationId: 'shop', money: 7 }) })
  },
  inventory: async page => {
    await openGame(page, entries(null, { 'street-life-screen': 'inventory' }))
  },
  'find-help': async page => { await openGame(page); await findHelp(page) },
  event: async page => { await openGame(page, entries('event')); await presentStoryChoices(page); await advance(page, 3000) },
  result: async page => {
    await openGame(page, entries('event'))
    await presentStoryChoices(page)
    await page.getByRole('button', { name: 'Let me help with those bags.', exact: true }).click()
    await advance(page, 2000)
    await expect(page.locator('.story-event-panel')).toBeVisible()
  },
  discovery: async page => {
    await openGame(page)
    await findHelp(page)
    await page.getByRole('button', { name: 'Help & hygiene', exact: true }).click()
    await advance(page, 6500)
    await expect(page.getByRole('dialog', { name: 'Help Center', exact: true })).toBeVisible()
  },
  'sleep-planning': async page => {
    const seed = entries()
    const game = JSON.parse(seed[keys.game])
    await openGame(page, { ...seed, [keys.game]: JSON.stringify({ ...game, locationId: 'station' }) })
    await page.getByRole('button', { name: /Try to sleep/ }).click()
    await expect(page.getByRole('group', { name: 'Sleep duration' })).toBeVisible()
  },
}

for (const [name, prepare] of Object.entries(states)) {
  test(name, async ({ page }) => {
    await prepare(page)
    await readyForScreenshot(page)
    await expect(page).toHaveScreenshot(`${name}.png`, {
      // Release numbers do not represent a visual change to the game.
      stylePath: 'tests/browser/screenshot.css',
    })
  })
}
