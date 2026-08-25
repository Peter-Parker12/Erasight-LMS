# This repo does not contain the application

This is a **deployment-only** repo for a self-hosted Moodle 4.5 LTS instance. Moodle's actual PHP source is cloned from `github.com/moodle/moodle` (`MOODLE_405_STABLE` branch) at Docker build time — it does not live here and there is nothing to `npm install` or run locally. The real content of this repo is the `Dockerfile`, `docker-compose.yml`, and `docker/` (Moodle's `config.php` plus install/cron scripts).

Before assuming anything about Moodle's internals (CLI script flags, config option names, plugin APIs), verify against Moodle's own source/docs rather than training data — none of it has been run/tested locally in this project (no PHP or Docker available in past sessions that built this), only reviewed for correctness.

An earlier version of this repo was a custom Next.js/Prisma LMS; that was fully replaced, not extended. If you find lingering references to it, they're stale — check git history for context rather than trusting them.
