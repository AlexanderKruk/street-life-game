import { test, expect, openGame, entries, findHelp, advance, read, keys, assertLocked, acknowledge, saves, presentStoryChoices, storyVisible } from './game.js'

test('new run reaches its first scene and releases the UI after acknowledgement', async ({ page }) => {
  await openGame(page, {})
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Status', exact: true }).click()
  const scroll = await page.locator('.game-content').evaluate(node => { node.scrollTop = 200; return node.scrollTop })
  await advance(page, 15_000)
  await presentStoryChoices(page)
  await expect(page.getByRole('dialog', { name: 'A familiar face', exact: true })).toBeVisible()
  await assertLocked(page)
  const paused = await read(page, keys.game)
  await advance(page, 3000)
  expect(await read(page, keys.game)).toEqual(paused)
  await page.getByRole('button', { name: 'No, thanks. Just going for a walk.', exact: true }).click()
  await acknowledge(page)
  await expect(page.locator('.bottom-nav')).not.toHaveAttribute('inert')
  await expect(page.getByRole('button', { name: 'Status', exact: true })).toBeFocused()
  expect(await page.locator('.game-content').evaluate(node => node.scrollTop)).toBe(scroll)
  await page.getByRole('button', { name: 'Map', exact: true }).click()
  await expect(page.locator('.map-surface')).toBeVisible()
})

test('Find Help spends resources once, adds a place and survives reload', async ({ page }) => {
  await openGame(page)
  const before = await read(page, keys.game)
  const battery = (await read(page, keys.inventory)).phoneBattery
  await findHelp(page)
  await page.getByRole('button', { name: 'Help & hygiene', exact: true }).click()
  await advance(page, 1000)
  const pending = await read(page, keys.phone)
  expect(pending.remaining).toBeLessThan(pending.total)
  await page.reload()
  expect(await read(page, keys.phone)).toEqual(pending)
  await advance(page, 6500)
  await expect(page.getByRole('dialog', { name: 'Help Center', exact: true })).toBeVisible()
  await assertLocked(page)
  // Exercise the shared discovery result through portrait → landscape → portrait.
  // Chromium checks layout/inheritance; a physical iPhone is still needed to
  // verify WebKit's orientation-specific text inflation itself.
  const description = page.locator('.result-card-content > .result-description').first()
  const typography = () => description.evaluate(node => {
    const style = getComputedStyle(node)
    return {
      size: style.fontSize,
      adjustment: style.getPropertyValue('-webkit-text-size-adjust') || style.getPropertyValue('text-size-adjust'),
      height: node.getBoundingClientRect().height,
    }
  })
  const portrait = page.viewportSize()
  const beforeRotation = await typography()
  expect(beforeRotation.adjustment).toBe('100%')
  await page.setViewportSize({ width: portrait.height, height: portrait.width })
  expect((await typography()).size).toBe(beforeRotation.size)
  await page.setViewportSize(portrait)
  await expect.poll(typography).toEqual(beforeRotation)
  const after = await read(page, keys.game)
  expect(after.minutes - before.minutes).toBe(pending.total)
  expect((await read(page, keys.inventory)).phoneBattery).toBeLessThan(battery)
  expect(await read(page, 'street-life-discovered-v1')).toContain('support')
  const history = await read(page, keys.history)
  await acknowledge(page)
  await page.reload()
  expect(await read(page, keys.game)).toEqual(after)
  expect(await read(page, keys.history)).toEqual(history)
  await page.getByRole('button', { name: 'Map', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Help Center Open/ })).toBeVisible()
})

test('pending travel pauses for an event and result, then resumes without a second fare', async ({ page }) => {
  const seed = entries('trip')
  const encounter = JSON.parse(seed[keys.encounters])
  await openGame(page, { ...seed, [keys.encounters]: JSON.stringify({ ...encounter, pendingId: 'dropped-glove' }) })
  await assertLocked(page)
  const before = await read(page, keys.game)
  const trip = await read(page, keys.trip)
  await advance(page, 3000)
  expect(await read(page, keys.trip)).toEqual(trip)
  await presentStoryChoices(page)
  await page.getByRole('button', { name: 'Keep going', exact: true }).click()
  await expect(page.locator('.story-event-panel')).toBeVisible()
  await advance(page, 2000)
  expect(await read(page, keys.trip)).toEqual(trip)
  await acknowledge(page)
  await expect(page.locator('.travel-screen')).toBeVisible()
  await advance(page, 1000)
  const progressed = await read(page, keys.trip)
  expect(progressed.remaining).toBeLessThan(trip.remaining)
  await page.reload()
  expect(await read(page, keys.trip)).toEqual(progressed)
  await advance(page, 30_000)
  await expect(page.locator('.result-modal')).toContainText('Arrival')
  expect((await read(page, keys.game)).locationId).toBe('station')
  expect((await read(page, keys.game)).money).toBe(before.money)
  expect(await read(page, keys.trip)).toBeNull()
  await acknowledge(page)
  await page.reload()
  expect((await read(page, keys.game)).money).toBe(before.money)
})

test('shelter sleep wakes by checkout, reload retains packing and departure happens once', async ({ page }) => {
  const seed = entries('departure')
  const game = JSON.parse(seed[keys.game])
  await openGame(page, { ...seed, 'street-life-shelter-departure-v1': 'null',
    [keys.game]: JSON.stringify({ ...game, minutes: 449, energy: 65 }) })
  await page.getByRole('button', { name: /Use your reserved bed/ }).click()
  await page.getByRole('button', { name: 'Sleep', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Sleeping', exact: true })).toBeVisible()
  await advance(page, 2000)
  await expect(page.locator('.result-modal')).toBeVisible()
  expect((await read(page, keys.game)).minutes).toBe(450)
  await acknowledge(page)
  await expect(page.getByRole('dialog', { name: 'Leave the night shelter', exact: true })).toBeVisible()
  await assertLocked(page)
  await page.getByRole('button', { name: /Leave the night shelter · 30 min/ }).click()
  await advance(page, 2750)
  const pending = await read(page, 'street-life-shelter-departure-v1')
  const during = await read(page, keys.game)
  await page.reload()
  expect(await read(page, 'street-life-shelter-departure-v1')).toEqual(pending)
  expect(await read(page, keys.game)).toEqual(during)
  await advance(page, 4750)
  await expect(page.locator('.result-modal')).toBeVisible()
  const after = await read(page, keys.game)
  expect(after.locationId).toBe('street')
  expect(after.minutes).toBe(480)
  expect((await read(page, keys.life)).shelterCheckoutDay).toBe(3)
  const history = await read(page, keys.history)
  await acknowledge(page)
  await page.reload()
  expect(await read(page, keys.game)).toEqual(after)
  expect(await read(page, keys.history)).toEqual(history)
  await expect(page.locator('.bottom-nav')).not.toHaveAttribute('inert')
})

// Preserve the same literal process snapshots across real App mounts/reloads.
for (const fixture of saves.cases) {
  test(`v332 ${fixture.id}: pending progress survives two browser reloads`, async ({ page }) => {
    const seed = entries(fixture.id)
    const expected = JSON.parse(seed[fixture.processKey])
    await openGame(page, seed)
    for (let mount = 0; mount < 3; mount++) {
      await expect(page.getByRole('dialog')).toBeVisible()
      expect(await read(page, fixture.processKey)).toEqual(expected)
      const game = await read(page, keys.game)
      expect(game.money).toBe(JSON.parse(seed[keys.game]).money)
      expect(game.minutes).toBe(JSON.parse(seed[keys.game]).minutes)
      expect((await read(page, keys.inventory)).phoneBattery).toBe(JSON.parse(seed[keys.inventory]).phoneBattery)
      if (mount < 2) await page.reload()
    }
  })
}


for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 664 }, { width: 850, height: 390 }]) {
  test(`scroll stays inside the centre and result at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openGame(page, entries('event'))
    await presentStoryChoices(page)
    await page.getByRole('button', { name: 'Let me help with those bags.', exact: true }).click()
    const result = page.locator('.story-event-panel')
    await expect(result).toBeVisible()
    await expect.poll(() => result.evaluate(node => ({
      horizontal: node.scrollWidth - node.clientWidth,
      overflow: getComputedStyle(node).overflow,
      bodyHorizontal: node.querySelector('.story-event-content').scrollWidth - node.querySelector('.story-event-content').clientWidth,
    }))).toEqual({ horizontal: 0, overflow: 'hidden', bodyHorizontal: 0 })
    expect(await page.locator('.game-content').evaluate(node => getComputedStyle(node).overflowY)).toBe('hidden')
    const panel = await result.boundingBox()
    expect(panel.y).toBeGreaterThanOrEqual(0)
    expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height)
    await acknowledge(page)
    await page.getByRole('button', { name: 'Status', exact: true }).click()
    const centre = page.locator('.game-content')
    const headerBefore = await page.locator('.game-header').boundingBox()
    const navBefore = await page.locator('.bottom-nav').boundingBox()
    const centreBox = await centre.boundingBox()
    expect(centreBox.y).toBeGreaterThanOrEqual(headerBefore.y + headerBefore.height)
    expect(centreBox.y + centreBox.height).toBeLessThanOrEqual(navBefore.y)
    await centre.hover()
    await page.mouse.wheel(0, 1500)
    await expect.poll(() => centre.evaluate(node => node.scrollTop)).toBeGreaterThan(0)
    expect(await page.locator('.game-header').boundingBox()).toEqual(headerBefore)
    expect(await page.locator('.bottom-nav').boundingBox()).toEqual(navBefore)
    expect(await page.evaluate(() => ({ x: scrollX, y: scrollY, extraWidth: document.documentElement.scrollWidth - innerWidth, extraHeight: document.documentElement.scrollHeight - innerHeight }))).toEqual({ x: 0, y: 0, extraWidth: 0, extraHeight: 0 })
    await expect(page.getByRole('button', { name: 'Reset save', exact: true })).toBeInViewport()
    await page.getByRole('button', { name: 'Map', exact: true }).click()
    expect(await centre.evaluate(node => ({ x: node.scrollWidth - node.clientWidth, y: node.scrollHeight - node.clientHeight }))).toEqual({ x: 0, y: 0 })
    const map = page.locator('.map-surface')
    expect(await map.evaluate(node => node.scrollWidth - node.clientWidth)).toBe(0)
    if (viewport.width < 600) {
      expect(await map.evaluate(node => node.scrollHeight - node.clientHeight)).toBe(0)
    } else {
      // The existing landscape map needs height to keep all city points reachable.
      // Its scroll must stay between the HUD and menu.
      await map.hover()
      await page.mouse.wheel(0, 1500)
      await expect.poll(() => map.evaluate(node => node.scrollTop)).toBeGreaterThan(0)
      expect(await page.locator('.game-header').boundingBox()).toEqual(headerBefore)
      expect(await page.locator('.bottom-nav').boundingBox()).toEqual(navBefore)
      expect(await page.evaluate(() => scrollY)).toBe(0)
    }
    await page.getByRole('button', { name: 'Phone', exact: true }).click()
    await page.getByRole('button', { name: 'Find Help', exact: true }).click()
    expect(await centre.evaluate(node => node.scrollTop)).toBe(0)
    await centre.hover()
    await page.mouse.wheel(0, 1500)
    await page.getByRole('button', { name: 'Back to phone', exact: true }).click()
    expect(await centre.evaluate(node => node.scrollTop)).toBe(0)
  })
}

for (const mode of ['walk', 'transit', 'fare-dodge']) {
  test(`cancel ${mode} travel keeps elapsed time and costs after reload`, async ({ page }) => {
    const seed = entries('trip')
    const trip = JSON.parse(seed[keys.trip])
    const game = JSON.parse(seed[keys.game])
    await openGame(page, { ...seed, [keys.trip]: JSON.stringify({ ...trip, mode }),
      [keys.game]: JSON.stringify({ ...game, day: 3, minutes: 1439, locationId: 'shop' }) })
    await expect(page.locator('.activity-cancel')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.locator('.activity-cancel')).toBeFocused()
    for (const button of await page.locator('.bottom-nav button').all()) await expect(button).toBeDisabled()
    await advance(page, 1000)
    const before = await read(page, keys.game)
    expect(before.day).toBe(4)
    const inventory = await read(page, keys.inventory)
    const history = await read(page, keys.history)
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    expect(await read(page, keys.game)).toEqual({ ...before, locationId: 'street' })
    expect(await read(page, keys.inventory)).toEqual(inventory)
    expect(await read(page, keys.trip)).toBeNull()
    expect(await read(page, keys.history)).toEqual(history)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.reload()
    expect(await read(page, keys.trip)).toBeNull()
    expect(await read(page, keys.game)).toEqual({ ...before, locationId: 'street' })
    await advance(page, 1000)
    expect((await read(page, keys.game)).minutes).toBe(before.minutes + 1)
  })
}

function rainySeed(choice = null, searchRemaining = 0, duration = 20) {
  const seed = entries()
  const game = JSON.parse(seed[keys.game])
  const start = (game.day - 1) * 1440 + game.minutes
  const rain = { id: 'browser:rain', level: 'rain', start, end: start + duration,
    choice, choiceAt: choice ? start : undefined, searchRemaining, protection: .4,
    shelter: 'tree', exposure: 0, energyLoss: 0, moodLoss: 0, waited: 0, coldRoll: .99, cold: false }
  return { ...seed, [keys.game]: JSON.stringify({ ...game, rain }) }
}

for (const [choice, searchRemaining] of [['proper', 3], ['proper', 0], ['nearby', 0]]) {
  test(`cancel rain ${choice} search ${searchRemaining} continues episode in background`, async ({ page }) => {
    await openGame(page, rainySeed(choice, searchRemaining))
    await assertLocked(page)
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()
    await expect(dialog.getByRole('status')).toContainText(searchRemaining ? 'Looking' : 'Waiting')
    await advance(page, 750)
    await advance(page, 250)
    const before = await read(page, keys.game)
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    const after = await read(page, keys.game)
    expect(after.minutes).toBe(before.minutes)
    for (const key of ['id', 'end', 'coldRoll', 'energyLoss', 'moodLoss']) expect(after.rain[key]).toBe(before.rain[key])
    expect(after.rain.choice).toBe('continue')
    await expect(dialog).toHaveCount(0)
    await page.reload()
    expect((await read(page, keys.game)).rain).toEqual(after.rain)
    await advance(page, 19000)
    expect((await read(page, 'street-life-story-v1')).episodes.at(-1).result.title).toBe('The rain has passed')
    if (await page.locator('.story-event-overlay').count()) await acknowledge(page)
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}

test('shelter choice transitions through Story search, waiting and illustrated result', async ({ page }) => {
  await openGame(page, rainySeed(null, 0, 8))
  await presentStoryChoices(page)
  await page.locator('[data-order-id="rain:proper"]').click()
  await expect(page.locator('.story-live-controls [role="status"]')).toContainText('Looking')
  const rain = (await read(page, keys.game)).rain
  await advance(page, rain.searchRemaining * 250)
  await expect(page.locator('.story-live-controls [role="status"]')).toContainText('Waiting')
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()
  await expect(page.locator('[data-order-id="rain:proper"]')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.story-live-controls [role="status"]')).toContainText('Waiting')
  await advance(page, (8 - rain.searchRemaining) * 250)
  expect((await read(page, 'street-life-story-v1')).episodes.at(-1).result.title).toBe('Shelter from the rain')
})

for (const [name, seed] of [['travel', entries('trip')]]) {
  test(`compact ${name} action fits beside text on narrow and desktop screens`, async ({ page }) => {
      await openGame(page, seed)
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        const panel = page.locator('.activity-with-actions')
        const metrics = await panel.evaluate(node => {
          const box = node.getBoundingClientRect()
          const button = node.querySelector('.activity-cancel').getBoundingClientRect()
          const text = node.querySelector('.activity-status').getBoundingClientRect()
          const style = getComputedStyle(node.querySelector('.activity-cancel'))
          return { overflow: node.scrollWidth > node.clientWidth, panelHeight: box.height, right: box.right,
            buttonRight: button.right, buttonLeft: button.left, textRight: text.right,
            width: button.width, height: button.height, colour: style.color, border: style.borderTopColor }
        })
        expect(metrics.overflow).toBe(false)
        expect(metrics.panelHeight).toBeLessThanOrEqual(width === 320 ? 180 : 150)
        expect(metrics.width).toBe(44)
        expect(metrics.height).toBe(44)
        expect(metrics.buttonRight).toBeLessThan(metrics.right)
        expect(metrics.buttonLeft).toBeGreaterThanOrEqual(metrics.textRight)
        expect(metrics.colour).toBe('rgb(175, 152, 104)')
        expect(metrics.border).toBe(metrics.colour)
        await panel.screenshot({ path: `test-results/activity-layout/${name}-${width}.png`, animations: 'disabled' })
      }
  })
}

for (const width of [320, 1280]) test(`phone language switching preserves progress at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 })
  const seed = entries(null, { 'street-life-screen': 'phone', 'street-life-mobile-service-until': '0',
    [keys.history]: JSON.stringify([{ day: 3, minute: 590, actionTitle: 'Old heading', title: 'Saved heading', text: 'Saved English reflection.', reflection: true }]) })
  await openGame(page, seed)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: /Language English/ }).click()
  const before = await read(page, keys.game), inventory = await read(page, keys.inventory), history = await read(page, keys.history)
  for (const [id, title, back] of [['ru', 'Язык', 'Назад к настройкам'], ['pl', 'Język', 'Wróć do ustawień'], ['en', 'Language', 'Back to settings']]) {
    await page.locator(`input[name="game-language"][value="${id}"]`).check()
    await expect(page.locator('html')).toHaveAttribute('lang', id)
    await expect(page.locator('.phone-screen h2')).toHaveText(title)
    await expect(page.locator(`input[value="${id}"]`)).toBeChecked()
    expect(await read(page, keys.game)).toEqual(before)
    expect(await read(page, keys.inventory)).toEqual(inventory)
    expect(await read(page, keys.history)).toEqual(history)
    await expect(page.getByRole('button', { name: back, exact: true })).toBeVisible()
    expect(await page.locator('.phone-app-content').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  }
  await page.getByRole('button', { name: 'Back to settings', exact: true }).click()
  await expect(page.locator('.phone-screen h2')).toHaveText('Settings')
  await page.getByRole('button', { name: 'Back to phone', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused()
})

for (const width of [320, 390, 1280]) for (const needs of [false, true]) {
  test(`goals appear from needs and discoveries at ${width}px (${needs ? 'unlocked' : 'opening'})`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1280 ? 900 : 844 })
    const base = entries()
    const inventory = JSON.parse(base[keys.inventory])
    const overrides = needs ? {
      [keys.inventory]: JSON.stringify({ ...inventory, phoneBattery: 19 }),
      'street-life-discovered-v1': JSON.stringify(['street', 'station', 'shop', 'work']),
      'street-life-effects-v1': JSON.stringify([{ id: 'cold', expiresAt: 99999 }]),
    } : {
      [keys.game]: JSON.stringify({ ...JSON.parse(base[keys.game]), day: 1, minutes: 1320 }),
    }
    await openGame(page, entries(null, overrides))
    await page.getByRole('button', { name: 'Phone', exact: true }).click()
    await page.getByRole('button', { name: /^Goals/ }).click()
    await expect(page.locator('.journal-goals > .goal-list > li')).toHaveCount(needs ? 4 : 1)
    await expect(page.locator('.main-goal strong')).toHaveText('Find a safe place to sleep')
    if (needs) {
      await expect(page.locator('.journal-goals strong')).toHaveText([
        'Find a safe place to sleep', 'Recharge your phone', 'Earn your first pay', 'Recover from your cold',
      ])
    }
    const progress = await read(page, 'street-life-journal-goals-v1')
    await page.reload()
    expect(await read(page, 'street-life-journal-goals-v1')).toEqual(progress)
    // Phone returns to its launcher on reload; reopen the saved list.
    await page.getByRole('button', { name: /^Goals/ }).click()
    expect(await page.locator('.phone-app-content').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('goals.png') })
  })
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test(`goal completion before discovery at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const base = entries()
    const seed = entries(null, {
      [keys.game]: JSON.stringify({ ...JSON.parse(base[keys.game]), locationId: 'station', minutes: 600 }),
      [keys.inventory]: JSON.stringify({ ...JSON.parse(base[keys.inventory]), phoneBattery: 62 }),
    })
    await openGame(page, seed)
    const goalKey = 'street-life-journal-goals-v1'
    expect((await read(page, goalKey)).chargeKnown).toBe(false)
    await page.getByRole('button', { name: /Charge phone/ }).click()
    await expect(page.locator('.result-modal')).toBeVisible()
    await expect(page.locator('.goal-completed-modal')).toHaveCount(0)
    expect((await read(page, goalKey)).pendingCompletions).toEqual(['charge'])
    await acknowledge(page)
    const dialog = page.getByRole('dialog', { name: 'Recharge your phone' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Goal completed', { exact: true })).toBeVisible()
    await assertLocked(page)
    await dialog.evaluate(node => node.getAnimations({ subtree: true }).forEach(animation => animation.finish()))
    const dimensions = await dialog.evaluate(node => {
      const icon = node.querySelector('.goal-completed-emblem svg')
      const circle = node.querySelector('.goal-completed-emblem')
      const heading = node.querySelector('h2')
      const label = node.querySelector('.goal-completed-label')
      return { icon: icon.getBoundingClientRect().width, circle: circle.getBoundingClientRect().width,
        label: getComputedStyle(label).fontSize, heading: getComputedStyle(heading).fontSize,
        colour: getComputedStyle(icon).color,
        overflow: node.scrollWidth > node.clientWidth, documentOverflow: document.documentElement.scrollWidth > innerWidth }
    })
    expect(dimensions).toEqual({ icon: 32, circle: 32, label: '16px', heading: viewport.width < 768 ? '20px' : '24px', colour: 'rgb(175, 152, 104)', overflow: false, documentOverflow: false })
    const paused = await read(page, keys.game)
    await advance(page, 3000)
    expect(await read(page, keys.game)).toEqual(paused)
    await page.screenshot({ path: `test-results/goal-completed-${viewport.width}.png` })
    await page.reload()
    await expect(page.getByRole('dialog', { name: 'Recharge your phone' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.goal-completed-modal')).toHaveCount(0)
    expect((await read(page, goalKey)).pendingCompletions).toEqual([])
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect((await read(page, goalKey)).charge).toBe(true)
  })
}

for (const mode of ['transit', 'fare-dodge']) {
  test(`ticket inspection interrupts and resumes ${mode} mid-journey`, async ({ page }) => {
    const base = entries()
    const encounters = JSON.parse(base[keys.encounters])
    encounters.seen = encounters.seen.filter(id => id !== 'ticket-check')
    encounters.lastAt = null
    await openGame(page, entries(null, { [keys.encounters]: JSON.stringify(encounters) }))
    await page.getByRole('button', { name: 'Map', exact: true }).click()
    await page.getByRole('button', { name: 'Small Shop', exact: true }).click()
    await page.getByRole('button', { name: mode === 'transit' ? /Public transport/ : /Ride without ticket/ }).click()
    const started = await read(page, keys.trip)
    expect(started.inspection.status).toBe('scheduled')
    await expect(page.locator('.dice-overlay, .event-card')).toHaveCount(0)
    const paidMoney = (await read(page, keys.game)).money
    await advance(page, (started.inspection.at - 1) * 250)
    await expect(page.locator('.dice-overlay, .event-card')).toHaveCount(0)
    await page.reload()
    expect((await read(page, keys.trip)).inspection).toEqual(started.inspection)
    await advance(page, 250)
    const during = await read(page, keys.trip)
    expect(during.remaining).toBe(started.total - started.inspection.at)
    expect(during.remaining).toBeGreaterThan(0)
    await expect(page.getByRole('dialog', { name: mode === 'transit' ? 'Ticket inspection' : 'Avoid inspection' })).toBeVisible()
    await assertLocked(page)
    await page.screenshot({ path: `test-results/inspection-${mode}.png`, animations: 'disabled' })
    const paused = await read(page, keys.game)
    await advance(page, 2000)
    expect(await read(page, keys.game)).toEqual(paused)
    expect((await read(page, keys.trip)).remaining).toBe(during.remaining)
    if (mode === 'transit') {
      await presentStoryChoices(page)
      await page.getByRole('button', { name: 'Show my ticket', exact: true }).click()
    } else {
      await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0)
      await page.evaluate(() => { Math.random = () => 0 })
      await page.getByRole('button', { name: 'Try', exact: true }).click()
      expect((await read(page, keys.trip)).inspection.roll).toBe(1)
      await page.reload()
      await expect(page.getByLabel('Rolled 1', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
    }
    await expect(page.locator(mode === 'transit' ? '.story-event-panel' : '.result-modal')).toBeVisible()
    const afterCheck = await read(page, keys.trip)
    expect(afterCheck.remaining).toBe(during.remaining)
    expect(afterCheck.before).toEqual(started.before)
    expect(afterCheck.inspection.status).toBe('done')
    const money = (await read(page, keys.game)).money
    expect(money).toBe(mode === 'transit' ? paidMoney : Math.max(0, paidMoney - 35))
    await acknowledge(page)
    await advance(page, during.remaining * 250)
    await expect(page.locator('.result-modal')).toContainText('Arrival')
    expect((await read(page, keys.game)).locationId).toBe('shop')
    expect((await read(page, keys.game)).money).toBe(money)
    expect(await read(page, keys.trip)).toBeNull()
    await acknowledge(page)
    await page.reload()
    expect(await read(page, keys.trip)).toBeNull()
    expect((await read(page, keys.game)).money).toBe(money)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}

for (const { draw, action } of [{ draw: 0, action: 'Sit and recover' }, { draw: .999999, action: 'Sit and recover' }, { draw: 0, action: 'Charge phone' }]) {
  test(`station action leaves a real-time breather after ${action} with draw ${draw}`, async ({ page }) => {
    const base = entries()
    const encounters = JSON.parse(base[keys.encounters])
    encounters.seen = encounters.seen.filter(id => id !== 'station-cleaning')
    encounters.lastAt = null
    await openGame(page, entries(null, {
      [keys.game]: JSON.stringify({ ...JSON.parse(base[keys.game]), locationId: 'station', minutes: 600 }),
      [keys.encounters]: JSON.stringify(encounters),
    }))
    await page.evaluate(draw => { Math.random = () => draw }, draw)
    await page.getByRole('button', { name: new RegExp(action) }).click()
    await expect(page.locator('.result-modal')).toBeVisible()
    const saved = await read(page, keys.encounters)
    expect(saved.seen).not.toContain('station-cleaning')
    expect(saved.pendingId).toBeNull()
    const delay = saved.deferred.delayMs
    expect(delay).toBeGreaterThanOrEqual(5000)
    expect(delay).toBeLessThanOrEqual(15000)
    const resultGame = await read(page, keys.game)
    await advance(page, 30_000)
    expect(await read(page, keys.game)).toEqual(resultGame)
    expect((await read(page, keys.encounters)).deferred.remainingMs).toBe(delay)
    await acknowledge(page)
    if (action === 'Charge phone') {
      await expect(page.getByRole('dialog', { name: 'Recharge your phone' })).toBeVisible()
      await advance(page, 10_000)
      expect((await read(page, keys.encounters)).deferred.remainingMs).toBe(delay)
      await acknowledge(page)
    }
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.game-background')).not.toHaveAttribute('inert', '')
    for (const button of await page.locator('.bottom-nav button').all()) await expect(button).toBeEnabled()
    const roundedDelay = Math.ceil(delay / 1000) * 1000
    await advance(page, roundedDelay - 1000)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect((await read(page, keys.game)).minutes).toBeGreaterThan(resultGame.minutes)
    const remaining = (await read(page, keys.encounters)).deferred
    await page.reload()
    expect((await read(page, keys.encounters)).deferred).toEqual(remaining)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await advance(page, 1000)
    await expect(page.getByRole('dialog', { name: 'Cleaning the hall' })).toBeVisible()
    expect((await read(page, keys.encounters)).deferred).toBeUndefined()
    expect((await read(page, keys.encounters)).seen.filter(id => id === 'station-cleaning')).toHaveLength(1)
  })
}

for (const [choice, asset, cost] of [['Give 1 zł', 'give', 1], ['Sorry, I can’t', 'decline', 0], ['Keep my distance', 'avoid', 0]]) {
  test(`station spare-change artwork for ${asset}`, async ({ page }) => {
    const seed = entries()
    const game = { ...JSON.parse(seed[keys.game]), locationId: 'station' }
    const encounters = { ...JSON.parse(seed[keys.encounters]), pendingId: 'spare-change' }
    await openGame(page, { ...seed, [keys.game]: JSON.stringify(game), [keys.encounters]: JSON.stringify(encounters) })
    await presentStoryChoices(page)
    await expect(page.locator('.story-image img').first()).toHaveAttribute('src', /event-spare-change-station-480.webp$/)
    await page.locator('.story-image img').first().evaluate(img => img.decode())
    await page.getByRole('button', { name: choice, exact: true }).click()
    const art = page.locator(`.story-image img[src$="event-spare-change-${asset}-480.webp"]`)
    await storyVisible(page, art)
    await art.evaluate(img => img.decode())
    expect((await read(page, keys.game)).money).toBe(game.money - cost)
    expect(await page.locator('.story-event-panel').evaluate(node => node.scrollWidth > node.clientWidth)).toBe(false)
    await page.screenshot({ path: `test-results/spare-change-${asset}.png`, animations: 'disabled' })
    await acknowledge(page)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}

for (const width of [390, 1280]) {
  test(`live Story stamp and cursor stay centered through the dog result at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const seed = entries()
    const game = { ...JSON.parse(seed[keys.game]), locationId: 'street', day: 1, minutes: 1350 }
    const pending = JSON.stringify({ seen: [], lastAt: null, pendingId: 'first-night-dog' })
    await openGame(page, { ...seed, 'street-life-screen': 'story', 'street-life-left-home-v1': 'false',
      'street-life-first-night-events-v1': pending, [keys.encounters]: pending, [keys.game]: JSON.stringify(game) })
    await advance(page, 20000)
    const alignment = () => page.evaluate(() => {
      const head = document.querySelector('.story-head'), ring = head.querySelector('span'), time = head.querySelector('time')
      const r = ring.getBoundingClientRect(), t = time.getBoundingClientRect()
      const range = document.createRange(); range.selectNodeContents(time)
      const glyph = range.getBoundingClientRect()
      return { box: Math.abs(r.y + r.height / 2 - t.y - t.height / 2), glyph: Math.abs(r.y + r.height / 2 - glyph.y - glyph.height / 2) }
    })
    const choosing = await alignment()
    expect(choosing.box).toBeLessThan(.1)
    expect(choosing.glyph).toBeLessThanOrEqual(1)
    await page.locator('[data-order-id="event:first-night-dog:greet"]').click()
    const initialY = await page.locator('.story-track').evaluate(node => parseFloat(node.style.getPropertyValue('--story-y')))
    let closingChecked = false, departureChecked = false
    for (let guard = 0; guard < 450; guard++) {
      await advance(page, 64)
      const state = await page.evaluate(() => {
        const track = document.querySelector('.story-track'), stamp = document.querySelector('.story-result-stamp')
        const texts = [...document.querySelectorAll('.story-text')], closing = texts.at(-1)
        const head = track.querySelector('.story-head'), time = head?.querySelector('time')
        const button = closing?.querySelector('.story-reveal')
        const style = stamp && getComputedStyle(stamp), clockStyle = time && getComputedStyle(time)
        return { settling: track.classList.contains('is-settling'), y: parseFloat(track.style.getPropertyValue('--story-y')),
          closing: texts.length === 3 && !!button && button.textContent.length > 0,
          clockBottom: time?.getBoundingClientRect().bottom, closingTop: button?.getBoundingClientRect().top,
          stamp: stamp?.textContent, clockHidden: clockStyle?.visibility === 'hidden', stampColor: style?.color, clockColor: clockStyle?.color,
          stampFont: style?.font, clockFont: clockStyle?.font,
          sealed: stamp?.dataset.storyStamp === 'sealed', finished: !!document.querySelector('.story-idle') }
      })
      if (state.closing && !closingChecked) {
        closingChecked = true
        expect(state.y).toBeCloseTo(initialY, 1)
        expect(state.clockBottom).toBeLessThan(state.closingTop)
      }
      if (state.settling && state.sealed && state.y > initialY && !departureChecked) {
        departureChecked = true
        expect(state.clockHidden).toBe(true)
        expect(state.stamp.length).toBeLessThan('22:30 · Street · D0'.length)
        expect(state.stampColor).toBe(state.clockColor)
        expect(state.stampFont).toBe(state.clockFont)
        const centered = await alignment()
        expect(centered.box).toBeLessThan(.1)
        expect(centered.glyph).toBeLessThanOrEqual(1)
        await page.screenshot({ path: `test-results/story-stamp-${width}-departing.png` })
      }
      if (state.finished) break
    }
    expect(closingChecked).toBe(true)
    expect(departureChecked).toBe(true)
    await expect(page.locator('.story-idle')).toBeVisible()
    await expect(page.locator('.story-piece').last()).toHaveClass(/story-stats/)
    const finalAlignment = await alignment()
    expect(finalAlignment.box).toBeLessThan(.1)
    expect(finalAlignment.glyph).toBeLessThanOrEqual(1)
  })
  test(`live Story encounter, inline result and reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const seed = entries()
    const game = { ...JSON.parse(seed[keys.game]), locationId: 'street', day: 3, minutes: 600 }
    const encounters = { ...JSON.parse(seed[keys.encounters]), pendingId: 'spare-change' }
    await openGame(page, { ...seed, 'street-life-screen': 'story', [keys.game]: JSON.stringify(game), [keys.encounters]: JSON.stringify(encounters) })
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await advance(page, 20000)
    await expect(page.locator('.game-background')).not.toHaveAttribute('inert')
    await expect(page.locator('.bottom-nav')).toHaveAttribute('inert', '')
    await expect(page.locator('[data-order-id="event:spare-change:give"]')).toBeEnabled()
    expect(await page.locator('.game-content').evaluate(node => node.scrollWidth > node.clientWidth)).toBe(false)
    await page.screenshot({ path: `test-results/story-live-${width}-choices.png` })
    await page.locator('[data-order-id="event:spare-change:give"]').click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    for (let guard = 0; guard < 160 && (await read(page, 'street-life-story-v1')).episodes.at(-1).status !== 'complete'; guard++) await advance(page, 250)
    await expect(page.locator('[data-order-id="story:acknowledge"]')).toHaveCount(0)
    await expect(page.locator('.story-idle.is-running')).toBeVisible()
    const result = await read(page, keys.game)
    expect(result.money).toBe(game.money - 2)
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await read(page, keys.game)).toEqual(result)
    await page.locator('.story-idle').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `test-results/story-live-${width}-result.png` })
    expect(await page.locator('.game-content').evaluate(node => node.scrollWidth > node.clientWidth)).toBe(false)
    await expect(page.locator('.bottom-nav')).not.toHaveAttribute('inert')
    expect((await read(page, 'street-life-story-v1')).episodes.at(-1).status).toBe('complete')
  })
}

for (const [choice, asset, cost] of [['Give 2 zł', 'give', 2], ['Sorry, I can’t', 'decline', 0], ['Keep my distance', 'avoid', 0]]) {
  test(`street spare-change artwork and restored cost for ${asset}`, async ({ page }) => {
    const seed = entries()
    const game = { ...JSON.parse(seed[keys.game]), locationId: 'street', day: 3, minutes: 600 }
    const encounters = { ...JSON.parse(seed[keys.encounters]), pendingId: 'spare-change' }
    await openGame(page, { ...seed, [keys.game]: JSON.stringify(game), [keys.encounters]: JSON.stringify(encounters) })
    await presentStoryChoices(page)
    await expect(page.locator('.story-image img').first()).toHaveAttribute('src', /event-spare-change-street-480.webp$/)
    await page.locator('.story-image img').first().evaluate(img => img.decode())
    await page.reload()
    await presentStoryChoices(page)
    await page.getByRole('button', { name: choice, exact: true }).click()
    const art = page.locator(`.story-image img[src$="event-spare-change-street-${asset}-480.webp"]`)
    await storyVisible(page, art)
    await art.evaluate(img => img.decode())
    expect((await read(page, keys.game)).money).toBe(game.money - cost)
    await page.screenshot({ path: `test-results/spare-change-street-${asset}.png` })
  })
}

for (const width of [390, 1280]) test(`Story event modal preserves the previous screen at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  const seed = entries(), encounters = JSON.parse(seed[keys.encounters])
  await openGame(page, { ...seed, 'street-life-screen': 'inventory', [keys.encounters]: JSON.stringify({ ...encounters, pendingId: 'spare-change' }) })
  await expect(page.locator('.story-event-overlay')).toBeVisible()
  await expect(page.locator('.story-toolbar, .event-overlay, .dice-overlay, .result-overlay')).toHaveCount(0)
  await presentStoryChoices(page)
  await assertLocked(page)
  await expect(page.locator('.game-background')).toHaveAttribute('inert', '')
  expect(await page.evaluate(() => document.body.style.position)).toBe('fixed')
  const before = await read(page, keys.game)
  await page.keyboard.press('Escape')
  await expect(page.locator('.story-event-overlay')).toBeVisible()
  expect(await read(page, keys.game)).toEqual(before)
  const panel = page.locator('.story-event-panel')
  expect(await panel.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(false)
  const box = await panel.boundingBox()
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height)
  await page.screenshot({ path: `test-results/story-modal-${width}-choices.png` })
  await page.locator('[data-order-id="event:spare-change:give"]').click()
  const after = await read(page, keys.game)
  await page.reload()
  expect(await read(page, keys.game)).toEqual(after)
  await expect(page.locator('.story-event-overlay')).toBeVisible()
  for (let guard = 0; guard < 320 && !await page.locator('.story-event-close').count(); guard++) await advance(page, 250)
  await expect(page.locator('.story-event-overlay')).toBeVisible()
  await expect(page.locator('.bottom-nav')).not.toHaveAttribute('inert', '')
  await expect(page.getByRole('button', { name: 'Map', exact: true })).toBeEnabled()
  const finishedPanel = await page.locator('.story-event-panel').boundingBox()
  const menuTop = await page.locator('.bottom-nav .home').boundingBox()
  expect(finishedPanel.y + finishedPanel.height).toBeLessThanOrEqual(menuTop.y)
  await page.screenshot({ path: `test-results/story-modal-${width}-complete.png` })
  await page.locator('.story-event-overlay').click({ position: { x: 2, y: 2 } })
  await expect(page.locator('.inventory-screen')).toBeVisible()
  expect(await page.evaluate(() => document.body.style.position)).toBe('')
  await expect(page.locator('.game-background')).not.toHaveAttribute('inert', '')
  expect((await read(page, 'street-life-story-v1')).episodes.at(-1).status).toBe('complete')
  await page.reload()
  await expect(page.locator('.story-event-overlay')).toHaveCount(0)
  expect(await read(page, keys.game)).toEqual(after)
})

test('shop purchases and theft keep their existing dialogs', async ({ page }) => {
  const seed = entries(), game = JSON.parse(seed[keys.game])
  await openGame(page, { ...seed, [keys.game]: JSON.stringify({ ...game, locationId: 'shop', money: 100 }) })
  await page.locator('.shop-buy:not(:disabled)').first().click()
  await expect(page.locator('.result-modal')).toBeVisible()
  await expect(page.locator('.story-event-overlay')).toHaveCount(0)
  await acknowledge(page)
  await page.locator('.supply-steal:not(:disabled)').first().click()
  await expect(page.locator('.dice-overlay')).toBeVisible()
  await expect(page.locator('.story-event-overlay')).toHaveCount(0)
})
