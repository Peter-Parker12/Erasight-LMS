# Erasight LMS

Self-hosted **Moodle 4.5 LTS**, deployed via Docker Compose. This repo does not contain Moodle's source — the `Dockerfile` clones it (`MOODLE_405_STABLE` branch) at build time. What lives here is just the deployment: the Docker image definition, Compose stack, and Moodle's `config.php`.

This replaced an earlier custom-built Next.js LMS (see git history before the Moodle migration if you need to reference that).

## Stack

- **`db`** — Postgres 16. Moodle's tables live here under the `mdl_` prefix.
- **`moodle-install`** — one-shot container that runs Moodle's DB install + admin account creation on first `docker compose up`, and configures outgoing mail from `GMAIL_USER`/`GMAIL_APP_PASSWORD`. Safe to re-run (see `docker/install-database.sh`).
- **`moodle`** — the Apache/PHP app itself, bound to `127.0.0.1:5895` only.
- **`moodle-cron`** — loops `admin/cli/cron.php` every 60s, which Moodle requires for scheduled tasks/notifications.

Public access is via **Cloudflare Tunnel** (`cloudflared`), run separately on the VPS — not part of this Compose stack. Its ingress rule points at `http://localhost:5895`.

## Deploy

```bash
cp .env.example .env   # fill in POSTGRES_PASSWORD, NEXT_PUBLIC_APP_URL, GMAIL_*, INITIAL_ADMIN_*
docker compose up -d --build
```

A single `docker compose up` brings up `db` → installs Moodle → starts `moodle` + `moodle-cron`, with no manual install-wizard step.

## Known gaps to close inside Moodle once it's up

- Install the [`enrol_invitation`](https://github.com/michael-milette/moodle-enrol_invitation) plugin for email-based course invitations (closest native equivalent to the old app's invite flow — one course per invitation, not multi-class in one email).
- S3-compatible file storage (reusing the VPS's existing MinIO) isn't wired up yet — Moodle uses local-disk `moodledata` for now. Add the `tool_objectfs` plugin later if that becomes necessary.
