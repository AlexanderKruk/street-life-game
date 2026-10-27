import { test, expect, openGame, entries, findHelp, advance, read, keys, assertLocked, acknowledge, saves } from './game.js'

test('new run reaches its first scene and releases the UI after acknowledgement', async ({ page }) => {
  await openGame(page, {})
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await advance(page, 15_000)
  await expect(page.getByRole('dialog', { name: 'A familiar face', exact: true })).toBeVisible()
  await assertLocked(page)
  const paused = await read(page, keys.game)
  await advance(page, 3000)
  expect(await read(page, keys.game)).toEqual(paused)
  await page.getByRole('button', { name: 'No, thanks. Just going for a walk.', exact: true }).click()
  await acknowledge(page)
  await expect(page.locator('.bottom-nav')).not.toHaveAttribute('inert')
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
  await page.getByRole('button', { name: 'Keep going', exact: true }).click()
  await expect(page.locator('.result-modal')).toBeVisible()
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
  await page.getByRole('button', { name: 'Start sleeping', exact: true }).click()
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
    await page.getByRole('button', { name: 'Let me help with those bags.', exact: true }).click()
    const result = page.locator('.result-modal')
    await expect(result).toBeVisible()
    await expect.poll(() => result.evaluate(node => ({
      horizontal: node.scrollWidth - node.clientWidth,
      overflow: getComputedStyle(node).overflow,
      bodyHorizontal: node.querySelector('.result-card-content').scrollWidth - node.querySelector('.result-card-content').clientWidth,
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
