# v344 publication checkpoint

Local source: 91ebdcbf9de3edfa3df463a5b64d9baa227f36fd.
Verified source tree: e2f3c7cf3af6098fce47f173981c66d79313d465.
API tree matched the complete local source tree before adding this checkpoint.

release-v344-local.bundle preserves 0113fd7 and 91ebdcb on top of
0e08c18cd67f6ee023fd798aa07c8bdfd7057446. Restore the earlier
goal-art-2026-10-28.bundle first if that prerequisite is absent, then:

    git fetch .backup/release-v344-local.bundle HEAD:recovered-v344

Browser Chromium: 63/63 passed; no baselines changed.
Publication authorized by user; existing Pages workflow gates deployment
on the full Node suite and build. This checkpoint records publication
preparation, not a claim that deployment has already succeeded.
