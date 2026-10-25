import { test as base, expect } from '@playwright/test'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
export const saves = require('../../test-fixtures/v332-saves.json')
export const NOW = saves.clock
export const keys = {
  game: 'street-life-save-v3', inventory: 'street-life-inventory-v1',
  trip: 'street-life-trip-v1', phone: 'street-life-phone-activity-v1',
  sleep: 'street-life-sleep-v1', life: 'street-life-situation-v1',
  encounters: 'street-life-encounters-v1', history: 'street-life-journal-history-v1',
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await use(page)
    expect(errors, 'No uncaught browser errors').toEqual([])
  },
})
export { expect }

export function entries(id, overrides = {}) {
  const fixture = id && saves.cases.find(item => item.id === id)
  if (id && !fixture) throw new Error(`Unknown save fixture: ${id}`)
  return { ...saves.base, ...fixture?.entries, ...overrides }
}

export async function openGame(page, seed = entries()) {
  await page.clock.install({ time: NOW })
  await page.clock.pauseAt(NOW)
  await page.addInitScript(({ seed }) => {
    // Each test gets a new browser context. Reloads keep actual game progress.
    Math.random = () => 0.34
    if (sessionStorage.getItem('browser-test-seeded')) return
    localStorage.clear()
    for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value)
    sessionStorage.setItem('browser-test-seeded', 'true')
  }, { seed })
  await page.goto('./')
  await expect(page.locator('.bottom-nav')).toBeAttached()
}

export async function read(page, key) {
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), key)
}

export async function advance(page, milliseconds) {
  // Let React commit between world ticks. A long mocked runFor can otherwise
  // batch state/effects differently under CPU load (notably phone battery).
  for (let remaining = milliseconds; remaining > 0; remaining -= 250) {
    await page.clock.runFor(Math.min(250, remaining))
    await page.evaluate(() => new Promise(resolve => {
      const channel = new MessageChannel()
      channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolve() }
      channel.port2.postMessage(null)
    }))
  }
}

export async function findHelp(page) {
  await page.getByRole('button', { name: 'Phone', exact: true }).click()
  await page.getByRole('button', { name: 'Find Help', exact: true }).click()
}

export async function readyForScreenshot(page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    const visible = [...document.images].filter(img => {
      const rect = img.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight
    })
    await Promise.all(visible.map(async img => {
      // Offscreen lazy art is not part of a viewport screenshot.
      img.loading = 'eager'
      await img.decode()
      if (!img.naturalWidth) throw new Error(`Image failed: ${img.currentSrc}`)
    }))
    scrollTo(0, 0)
  })
  if (await page.locator('.result-modal').count()) {
    // Headless shell does not reliably expose reduced-motion media emulation.
    // Finish JS meter animations on the controlled clock while the result pauses
    // gameplay; do not mask or overwrite the values being checked.
    await advance(page, 2500)
    const game = await read(page, keys.game)
    const inventory = await read(page, keys.inventory)
    for (const [label, value] of [['Mood', game.mood], ['Battery', inventory.phoneBattery]]) {
      const stat = page.locator(`.result-stat[data-stat="${label}"]`)
      if (await stat.count()) await expect(stat.getByRole('meter')).toHaveAttribute('aria-valuenow', String(value))
    }
  }
}

export async function assertLocked(page) {
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(page.locator('.bottom-nav')).toHaveAttribute('inert', '')
  for (const button of await page.locator('.bottom-nav button').all()) await expect(button).toBeDisabled()
  await page.keyboard.press('Tab')
  expect(await dialog.evaluate(node => node.contains(document.activeElement)), 'Focus stays inside modal').toBe(true)
}

export async function acknowledge(page) {
  await page.getByRole('dialog').getByRole('button', { name: 'Got it', exact: true }).click()
}
