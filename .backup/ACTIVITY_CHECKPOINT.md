# Activity recovery checkpoint, 27 October 2026

The restored feature source commit is58097713e7fb4cc22aa7278e065f88a1c4c1325f.
Its tree33e102d06ba24a05b8adc849a1ae6d5e3b52770f exactly matches the API
checkpoint9d8c5e2d12163504fc923542f84fa7692c181cc6 saved in main without CI.
The previous transient local commits were unavailable after environment loss;
this bundle preserves the new reconstruction, not those original hashes.

Verify with `git bundle verify .backup/activity-2026-10-27.bundle`.
The prerequisite base is4146a6dfe0da9ae0d1b7f35a9c415878dd15033c, already in main.
Recover with:

```sh
git fetch .backup/activity-2026-10-27.bundle refs/heads/backup/activity-2026-10-27:refs/heads/recover/activity-2026-10-27
```

This source checkpoint alone does not publish a release. v339 is a later
commit and follows the existing Node-check/build/Pages gate.
