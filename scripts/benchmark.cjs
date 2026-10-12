// Optional lab tool: requires Playwright and a compatible Chromium installation.
// STREET_BENCH_BROWSER can select a browser; no user's browser profile/save is used.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const URL_TO_TEST = 'https://alexanderkruk.github.io/street-life-game/';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const rounded = value => Math.round(value * 10) / 10;
let browser, activePage;
const requestFailures = [];
const pageErrors = [];

function proxyFromEnvironment() {
  const source = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY;
  if (!source) return undefined;
  const url = new URL(source);
  return { server: url.origin, ...(url.username ? { username: decodeURIComponent(url.username), password: decodeURIComponent(url.password) } : {}) };
}
function installObservers() {
  window.__lab = { ready: null, lcp: null, shifts: [], tasks: [], frames: [], transitions: [], trackFrames: false, lastFrame: null };
  const lab = window.__lab;
  new MutationObserver(() => {
    if (lab.ready === null && document.querySelector('main .bottom-nav button')) lab.ready = performance.now();
  }).observe(document, { childList: true, subtree: true });
  for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask']) {
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (type === 'largest-contentful-paint') lab.lcp = entry.startTime;
          if (type === 'layout-shift' && !entry.hadRecentInput) lab.shifts.push(entry.value);
          if (type === 'longtask') lab.tasks.push({ start: entry.startTime, duration: entry.duration });
        }
      }).observe({ type, buffered: true });
    } catch {}
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('.bottom-nav button');
    if (!button) return;
    const started = performance.now(), name = button.textContent.trim();
    requestAnimationFrame(() => requestAnimationFrame(() => lab.transitions.push({ name, duration: performance.now() - started })));
  }, true);
  function frame(time) {
    if (lab.trackFrames && lab.lastFrame !== null) lab.frames.push(time - lab.lastFrame);
    lab.lastFrame = lab.trackFrames ? time : null;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
async function loadMetrics(page) {
  await page.goto(URL_TO_TEST, { waitUntil: 'load', timeout: 60000 });
  await page.locator('.bottom-nav').waitFor({ state: 'visible' });
  await sleep(1000);
  return page.evaluate(() => ({
    build: document.querySelector('.header-version').textContent,
    firstPaintMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
    uiReadyMs: window.__lab.ready,
    lcpMs: window.__lab.lcp,
    cls: window.__lab.shifts.reduce((sum, value) => sum + value, 0),
    ttfbMs: performance.getEntriesByType('navigation')[0].responseStart,
    blockingMs: window.__lab.tasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0),
    jsTransferBytes: performance.getEntriesByType('resource').filter(entry => /\.js(?:\?|$)/.test(entry.name)).reduce((sum, entry) => sum + entry.transferSize, 0),
  }));
}
async function waitForImageCache(page) {
  await page.waitForFunction(async () => {
    if (!navigator.serviceWorker.controller) return false;
    const name = (await caches.keys()).find(name => name.startsWith('street-life-images-v1-'));
    return name && (await (await caches.open(name)).keys()).length >= 7;
  }, null, { timeout: 60000 });
}
async function runtimeMetrics(page, cdp) {
  await page.evaluate(() => {
    const game = JSON.parse(localStorage.getItem('street-life-save-v3'));
    localStorage.setItem('street-life-save-v3', JSON.stringify({ ...game, day: 1, minutes: 500, money: 100, locationId: 'station' }));
    localStorage.setItem('street-life-screen', 'location');
    localStorage.setItem('street-life-mobile-auto-renew', 'false');
    localStorage.setItem('street-life-journal-history-v1', JSON.stringify(Array.from({ length: 30 }, (_, index) => ({ day: 1, minute: 480 + index, title: 'Walk through the city', text: 'I feel a little steadier. I am still working out what comes next.', reflection: true }))));
  });
  await page.reload({ waitUntil: 'load' });
  await waitForImageCache(page);
  await cdp.send('Performance.enable');
  const getTaskDuration = async () => (await cdp.send('Performance.getMetrics')).metrics.find(metric => metric.name === 'TaskDuration').value;
  await page.evaluate(() => { window.__lab.tasks = []; window.__lab.frames = []; window.__lab.transitions = []; window.__lab.trackFrames = true; });
  const taskStart = await getTaskDuration();
  const start = Date.now();
  await sleep(10000);
  const taskEnd = await getTaskDuration();
  const elapsed = (Date.now() - start) / 1000;
  const tickSample = await page.evaluate(() => ({
    frames: window.__lab.frames,
    tasks: window.__lab.tasks,
    time: document.querySelector('header time').textContent,
  }));
  await page.evaluate(() => { window.__lab.tasks = []; window.__lab.frames = []; });
  const networkRequests = [];
  const onRequest = request => { if (/\.webp(?:\?|$)/.test(request.url())) networkRequests.push(request.url()); };
  page.on('request', onRequest);
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const label of ['Map', 'Inventory', 'Status', 'Journal', 'Station']) {
      const target = label === 'Station' ? page.locator('.nav-item.home') : page.getByRole('button', { name: label, exact: true });
      await target.click();
      await sleep(180);
    }
  }
  page.off('request', onRequest);
  const transitionSample = await page.evaluate(() => {
    window.__lab.trackFrames = false;
    return { frames: window.__lab.frames, tasks: window.__lab.tasks, transitions: window.__lab.transitions, overflow: document.documentElement.scrollWidth > innerWidth };
  });
  const frameStats = sample => ({
    samples: sample.length, medianMs: rounded(median(sample)),
    p95Ms: rounded([...sample].sort((a, b) => a - b)[Math.floor(sample.length * .95)]),
    over50ms: sample.filter(value => value > 50).length,
  });
  const imageFailures = await page.evaluate(() => [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc));
  return {
    ticking: { durationSeconds: rounded(elapsed), mainThreadBusyPercent: rounded((taskEnd - taskStart) / elapsed * 100), frameIntervals: frameStats(tickSample.frames), longTasks: tickSample.tasks.length, finalTime: tickSample.time },
    navigation: { samples: transitionSample.transitions.length, medianToSecondFrameMs: rounded(median(transitionSample.transitions.map(sample => sample.duration))), maxToSecondFrameMs: rounded(Math.max(...transitionSample.transitions.map(sample => sample.duration))), frameIntervals: frameStats(transitionSample.frames), longTasks: transitionSample.tasks.length, cachedImageRequests: networkRequests.length, horizontalOverflow: transitionSample.overflow, imageFailures },
  };
}
(async () => {
  const executable = process.env.STREET_BENCH_BROWSER;
  const directory = executable ? path.dirname(executable) : '';
  browser = await chromium.launch({ headless: true, executablePath: executable || undefined, proxy: proxyFromEnvironment(),
    env: { ...process.env, ...(directory ? { LD_LIBRARY_PATH: `${directory}:${directory}/al2023`, FONTCONFIG_PATH: directory } : {}) },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const report = { timestamp: new Date().toISOString(), url: URL_TO_TEST, browser: browser.version(), method: 'Live production site; fresh isolated contexts; three cold/warm runs per profile; CSS viewport and DPR emulation; CDP CPU/network throttle; headless software rendering; rAF intervals are not physical device FPS.', profiles: [] };
  for (const profile of [
    { name: 'desktop', width: 1365, height: 900, dpr: 1, cpu: 1, latency: 40, downloadMbps: 10, uploadMbps: 5 },
    { name: 'mobile lab', width: 390, height: 844, dpr: 2, cpu: 4, latency: 100, downloadMbps: 1.5, uploadMbps: .75 },
  ]) {
    const result = { profile, loads: [], runtime: null, errors: [] };
    for (let run = 0; run < 3; run++) {
      const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, deviceScaleFactor: profile.dpr, isMobile: profile.dpr > 1, hasTouch: profile.dpr > 1, ignoreHTTPSErrors: true });
      const page = await context.newPage();
      activePage = page;
      await page.bringToFront();
      page.on('requestfailed', request => requestFailures.push({ url: request.url(), error: request.failure()?.errorText }));
      page.on('pageerror', error => { result.errors.push(error.message); pageErrors.push(error.message); });
      await page.addInitScript(installObservers);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: profile.latency, downloadThroughput: profile.downloadMbps * 1e6 / 8, uploadThroughput: profile.uploadMbps * 1e6 / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
      const cold = await loadMetrics(page);
      await waitForImageCache(page);
      const warm = await loadMetrics(page);
      result.loads.push({ cold, warm });
      console.log(JSON.stringify({ profile: profile.name, run: run + 1, cold, warm }));
      if (run === 0) {
        result.runtime = await runtimeMetrics(page, cdp);
        console.log(JSON.stringify({ profile: profile.name, runtime: result.runtime }));
        if (process.env.STREET_BENCH_SCREENSHOTS) {
          fs.mkdirSync(process.env.STREET_BENCH_SCREENSHOTS, { recursive: true });
          await page.screenshot({ path: path.join(process.env.STREET_BENCH_SCREENSHOTS, `benchmark-${profile.name.replace(/ /g, '-')}.png`) });
        }
      }
      await context.close();
    }
    result.medians = {};
    for (const temperature of ['cold', 'warm']) result.medians[temperature] = Object.fromEntries(['firstPaintMs', 'uiReadyMs', 'lcpMs', 'blockingMs', 'cls', 'ttfbMs', 'jsTransferBytes'].map(key => [key, key === 'cls' ? median(result.loads.map(load => load[temperature][key])) : rounded(median(result.loads.map(load => load[temperature][key])))]));
    report.profiles.push(result);
  }
  fs.writeFileSync('performance-report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ summary: report.profiles.map(result => ({ profile: result.profile.name, medians: result.medians, runtime: result.runtime, errors: result.errors })) }));
})().catch(async error => {
  console.error(error.message.split('Call log:')[0].slice(0,1500));
  if (activePage) console.error(JSON.stringify(await activePage.evaluate(() => ({ title: document.title, body: document.body?.innerText.slice(0,300), html: document.body?.innerHTML.slice(0,1000), visibility: document.visibilityState, dimensions: [innerWidth,innerHeight], resources: performance.getEntriesByType('resource').map(resource => ({ name: resource.name, duration: resource.duration, bytes: resource.transferSize })) })).catch(() => null)));
  console.error(JSON.stringify({ requestFailures, pageErrors }));
  process.exitCode = 1;
}).finally(async () => { if (browser) await browser.close(); });
