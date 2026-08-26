# Erasight LMS

Self-hosted **Moodle 4.5 LTS**, deployed via Docker Compose. This repo does not contain Moodle's source — the `Dockerfile` clones it (`MOODLE_405_STABLE` branch) at build time. What lives here is just the deployment: the Docker image definition, Compose stack, and Moodle's `config.php`.

This replaced an earlier custom-built Next.js LMS (see git history before the Moodle migration if you need to reference that).

## Stack

- **`db`** — Postgres 16. Moodle's tables live here under the `mdl_` prefix.
- **`moodle-install`** — one-shot container that runs Moodle's DB install + admin account creation on first `docker compose up`, and configures outgoing mail from `GMAIL_USER`/`GMAIL_APP_PASSWORD`. Safe to re-run (see `docker/install-database.sh`).
- **`moodle`** — the Apache/PHP app itself, bound to `127.0.0.1:5895` only.
- **`moodle-cron`** — loops `admin/cli/cron.php` every 60s, which Moodle requires for scheduled tasks/notifications.

Public access is via **Cloudflare Tunnel** (`cloudflared`), run separately on the VPS — not part of this Compose stack. Its ingress rule points at `http://localhost:5895`.

## Theme

`docker/theme-erasight/` is a custom theme (a child of Boost — never edits Moodle core), baked into the image at `theme/erasight` and set as the site default via `$CFG->theme` in `config.php`. It's being built in phases:

1. **Brand tokens** (done) — palette, Inter/Bricolage Grotesque/JetBrains Mono, radius — applied globally via `scss/pre.scss` and `scss/post.scss`, which reskins every admin screen for free since Moodle's admin UI inherits the active theme.
2. **Dashboard course cards** (done) — overrides `core_course/coursecard.mustache` and `block_myoverview/progress-bar.mustache` (Moodle's own progress display is plain text with no visual bar) for the "My courses" (`/my/`) dashboard. Discovered along the way: the separate "browse all courses" category/search page (`course/renderer.php`'s `coursecat_coursebox_content()`) is built with raw PHP `html_writer` calls, not Mustache templates at all — this override doesn't reach it. Reskinning that page means subclassing `core_course_renderer` in the theme, a materially bigger task than a template override, not yet started.
3. In-course player (sidebar curriculum + video pane) — the highest-risk phase, touches how course content renders, not yet built.
4. Admin polish pass on top of phase 1's base tokens.

## Deploy

```bash
cp .env.example .env   # fill in POSTGRES_PASSWORD, NEXT_PUBLIC_APP_URL, GMAIL_*, INITIAL_ADMIN_*
docker compose up -d --build
```

A single `docker compose up` brings up `db` → installs Moodle → starts `moodle` + `moodle-cron`, with no manual install-wizard step.

## Known gaps to close inside Moodle once it's up

- Install the [`enrol_invitation`](https://github.com/michael-milette/moodle-enrol_invitation) plugin for email-based course invitations (closest native equivalent to the old app's invite flow — one course per invitation, not multi-class in one email).
- S3-compatible file storage (reusing the VPS's existing MinIO) isn't wired up yet — Moodle uses local-disk `moodledata` for now. Add the `tool_objectfs` plugin later if that becomes necessary.
