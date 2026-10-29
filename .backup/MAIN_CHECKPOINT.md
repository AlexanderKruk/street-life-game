# Story metadata source checkpoint — 29 October 2026

Source-only save. Published game remains v348.
Local source commit: 89a1f0894fa66804b3b0ed3bda7a7cd83bba2ba0
Verified source tree: 24691134431ad949c50bd800e6b6bf69f60681fb
GitHub source snapshot: f1e7be603b8d9b8e54cf3f7d62e375bed078d313
Backup branch: backup/story-metadata-2026-10-29

Story omits the event title and separate place line; opening metadata is HH:MM · saved place name · Dn, with Replay alongside. Cursor timestamps put time before day. Existing archives, classic dialogs and call behavior remain unchanged. The phone-call recording gap remains explicitly deferred at the user's request.

Targeted Story recording/comparison checks and design-system check passed. Production build and diff check passed after the final metadata order change. No full suite or browser QA was repeated; deployment is not requested.

Original local history is preserved in .backup/story-metadata-2026-10-29.bundle, verified with git bundle verify. After fetching base 1012bc00ea76020b445b16951e234d69c7823cdf:

    git bundle verify .backup/story-metadata-2026-10-29.bundle
    git fetch .backup/story-metadata-2026-10-29.bundle HEAD:refs/heads/recovered-story-metadata-2026-10-29

The API source tree matched the local committed tree before these recovery files were added. [skip ci] suppresses automatic game publication.
