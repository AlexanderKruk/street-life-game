const assert = require('node:assert/strict');

module.exports = function checkTravelStory({ travelStoryKey, travelStoryPhase, arrivalStoryText, scheduleStoryClose, loadStory, loadTrip }) {
  const at = { day: 2, minute: 600, locationId: 'street', locationName: 'Street' };
  for (const mode of ['walk', 'transit', 'fare-dodge']) {
    const trip = { destinationId: 'station', mode, total: 80, remaining: 80, before: { game: { day: 2, minutes: 600, locationId: 'street' }, inventory: {}, effects: [] } };
    const key = travelStoryKey(trip), original = JSON.stringify(trip), phases = new Set();
    for (let remaining = 80; remaining >= 1; remaining--) {
      const current = { ...trip, remaining, storyEpisodeId: 5 };
      assert.equal(travelStoryKey(current), key, 'ticks and persisted pointers never change journey identity');
      const phase = travelStoryPhase(current, false); assert(phase.text && !phase.text.endsWith('...')); phases.add(phase.id);
      assert.equal(travelStoryPhase(current, true).id, 'underCover');
    }
    if (mode !== 'walk') assert.deepEqual([...phases], ['toStop', 'waiting', 'riding', 'toDestination']);
    assert.equal(JSON.stringify(trip), original, 'presentation never changes travel progress');
    const store = { version: 1, nextId: 6, episodes: [{ id: 5, source: 'travel', sourceId: key, status: 'active', scenes: [{ eventId: key, title: 'Travel', text: 'Street → Station', at }] }] };
    assert.deepEqual(loadStory(JSON.parse(JSON.stringify(store))), store);
    const finished = { ...store, episodes: [{ ...store.episodes[0], status: 'awaiting-ack', endedAt: { ...at, minute: 680, locationId: 'station', locationName: 'Station' }, result: { title: 'Arrival', text: arrivalStoryText('station', 'Station') }, resultIdentity: { actionId: 'arrival' } }] };
    assert.deepEqual(loadStory(JSON.parse(JSON.stringify(finished))), finished, 'pending arrival restores without another journey');
    const read = value => loadTrip({ getItem: () => JSON.stringify(value) });
    assert.equal(read({ ...trip, storyEpisodeId: 5 }).storyEpisodeId, 5);
    for (const storyEpisodeId of [0, -1, 1.5, '5', Infinity]) assert.equal(read({ ...trip, storyEpisodeId }).storyEpisodeId, undefined);
    assert.equal(read(trip).remaining, 80, 'old trips remain valid without a Story pointer');
  }
  assert.equal(arrivalStoryText('station', 'Station'), 'Arrived at the station.');
  assert.equal(arrivalStoryText('shop', 'Small Shop'), 'Arrived: Small Shop.');
  function clock() {
    let now = 0, id = 0; const timers = new Map();
    return { host: { setTimeout: (fn, delay) => { timers.set(++id, { fn, at: now + delay }); return id; }, clearTimeout: id => timers.delete(id) },
      advance: duration => { const end = now + duration; while (true) { const next = [...timers].filter(([, t]) => t.at <= end).sort((a,b) => a[1].at-b[1].at)[0]; if (!next) break; now = next[1].at; timers.delete(next[0]); next[1].fn(); } now = end; }, timers };
  }
  for (const reduced of [false, true]) {
    const c = clock(), calls = [];
    const cancel = scheduleStoryClose(c.host, () => calls.push('fade'), () => calls.push('close'), reduced);
    c.advance(999); assert.deepEqual(calls, []);
    c.advance(1); assert.deepEqual(calls, reduced ? ['fade', 'close'] : ['fade']);
    c.advance(200); assert.deepEqual(calls, ['fade', 'close']); assert.equal(c.timers.size, 0); cancel();
    const stopped = clock(), stale = [];
    const stop = scheduleStoryClose(stopped.host, () => stale.push('fade'), () => stale.push('close'), reduced);
    stop(); stopped.advance(5000); assert.deepEqual(stale, []); assert.equal(stopped.timers.size, 0);
  }
  const interrupted = clock(), calls = [];
  const cancel = scheduleStoryClose(interrupted.host, () => calls.push('fade'), () => calls.push('close'));
  interrupted.advance(1000); cancel(); interrupted.advance(5000); assert.deepEqual(calls, ['fade'], 'manual dismissal or unmount cancels an in-flight fade');
};
