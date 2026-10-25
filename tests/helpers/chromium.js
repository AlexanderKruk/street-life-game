import chromium from '@sparticuz/chromium'
import tar from 'tar-fs'
import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { createBrotliDecompress } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const packagePath = join(dirname(require.resolve('@sparticuz/chromium')), '..', '..', 'package.json')
const version = require(packagePath).version
const cache = join(tmpdir(), `street-life-chromium-${version}`)

// Extract once into a versioned, atomic cache. Do not restore archive uid/gid:
// managed containers may reject chown even though writing files is allowed.
export async function chromiumLaunchOptions() {
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    throw new Error('Canonical visual tests require Linux x64 (Ubuntu 24.04); use the browser CI workflow on other platforms.')
  }
  if (!existsSync(join(cache, 'ready'))) {
    const staging = await mkdtemp(join(tmpdir(), 'street-life-chromium-prepare-'))
    const source = join(dirname(packagePath), 'bin')
    try {
      await mkdir(join(staging, 'fonts'))
      await Promise.all([
        pipeline(createReadStream(join(source, 'chromium.br')), createBrotliDecompress(), createWriteStream(join(staging, 'chromium'), { mode: 0o700 })),
        pipeline(createReadStream(join(source, 'fonts.tar.br')), createBrotliDecompress(), tar.extract(join(staging, 'fonts'), { chown: false })),
        pipeline(createReadStream(join(source, 'swiftshader.tar.br')), createBrotliDecompress(), tar.extract(staging, { chown: false })),
      ])
      // Only the package's pinned fonts participate, independent of host installs.
      await writeFile(join(staging, 'fonts', 'fonts.conf'), `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${cache}/fonts/fonts</dir><cachedir>${cache}/font-cache</cachedir></fontconfig>`)
      await writeFile(join(staging, 'ready'), version)
      try { await rename(staging, cache) } catch (error) {
        if (!existsSync(join(cache, 'ready'))) throw error
      }
    } finally { await rm(staging, { recursive: true, force: true }) }
  }
  return {
    executablePath: join(cache, 'chromium'),
    env: { ...process.env, FONTCONFIG_PATH: join(cache, 'fonts'), FONTCONFIG_FILE: join(cache, 'fonts', 'fonts.conf') },
    // Browser reuse across contexts requires multiple processes. Retain web security.
    args: chromium.args.filter(arg => !['--single-process', '--disable-web-security', '--allow-running-insecure-content'].includes(arg)),
  }
}
