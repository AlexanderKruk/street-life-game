import { defineConfig } from '@playwright/test'
import { chromiumLaunchOptions } from './tests/helpers/chromium.js'

// Same pinned binary and font set locally and in CI.
const chromiumOptions = await chromiumLaunchOptions()

// Browser checks deliberately run separately from the fast Node/jsdom suite.
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  fullyParallel: true,
  workers: 2,
  retries: 0,
  forbidOnly: !!process.env.CI,
  updateSnapshots: 'none',
  snapshotPathTemplate: '{testDir}/snapshots/{projectName}/{arg}{ext}',
  outputDir: 'test-results/browser',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  expect: { timeout: 5000, toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixels: 0 } },
  use: {
    baseURL: 'http://127.0.0.1:4173/street-life-game/',
    locale: 'en-GB', timezoneId: 'Europe/Warsaw', colorScheme: 'dark',
    reducedMotion: 'reduce', deviceScaleFactor: 1, serviceWorkers: 'block',
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/street-life-game/', reuseExistingServer: false,
  },
  projects: [
    { name: 'visual-mobile', testMatch: 'visual.spec.js', use: { browserName: 'chromium', launchOptions: chromiumOptions, viewport: { width: 390, height: 844 } } },
    { name: 'visual-desktop', testMatch: 'visual.spec.js', use: { browserName: 'chromium', launchOptions: chromiumOptions, viewport: { width: 1280, height: 900 } } },
    { name: 'smoke-chromium', testMatch: 'smoke.spec.js', use: { browserName: 'chromium', launchOptions: chromiumOptions, viewport: { width: 390, height: 844 } } },
    { name: 'smoke-webkit', testMatch: 'smoke.spec.js', use: { browserName: 'webkit', viewport: { width: 390, height: 844 } } },
  ],
})
