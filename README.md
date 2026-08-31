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
2. **Dashboard + catalog course cards** (done) — overrides `core_course/coursecard.mustache` and `block_myoverview/progress-bar.mustache` (Moodle's own progress display is plain text with no visual bar) for the "My courses" (`/my/`) dashboard. Moodle's separate "browse all courses" page is built from a chain of `protected` `html_writer` methods in `course/renderer.php`, not Mustache at all — rather than subclassing that (unverifiable without a live install), `docker/local-erasight/` is a small new plugin adding its own `/local/erasight/catalog.php` page, fetching courses via the stable `core_course_category` API and rendering them through the same reskinned card template. Linked into the main nav automatically via `local_erasight_extend_navigation()`.
3. **In-course "cinema mode"** (partial) — restyles Moodle's own course-index drawer (`course/format/templates/local/courseindex/*.mustache` — a real, modern Mustache-based component since Moodle 4.0, not the legacy renderer phase 2 had to work around) into a dark curriculum sidebar with a highlighted current activity, scoped to `body.pagelayout-course`. Pure SCSS, no new templates — the lowest-risk phase so far. Deliberately does **not** attempt a custom video player: Moodle has no single "video" concept to hook (a page, a URL, an H5P activity, and an embedded iframe all render completely differently), so a universal player chrome isn't something a theme can honestly claim to provide.
4. **Admin polish** (done) — `.generaltable`/`.generalbox` styling (Moodle's own long-standing, near-universal conventions for admin listings, not guessed-at page-specific markup) plus semantic status-badge colors, on top of phase 1's tokens.
5. **Easier admin navigation** (done) — two additive mechanisms, neither restructures Moodle's own admin tree:
   - `local_erasight_extend_settings_navigation()` (in `docker/local-erasight/lib.php`) injects an "Erasight quick links" branch at the bottom of the real Site Administration tree, linking straight to Course & category management, Manage users, Cohorts, and Manage enrolment plugins — each link only appears if the equivalent real entry is already visible in that admin's own (capability-filtered) tree, so a shortcut can never point somewhere they couldn't already reach the long way.
   - `docker/local-erasight/adminhome.php` is a new tile-grid landing page (`/local/erasight/adminhome.php`, gated on `moodle/site:config`) grouping those same destinations as Manage/Access/System tiles, plus a simple course/user count under Overview. Uses `pagelayout('admin')` so the real Site Administration tree (quick-links branch included) still sits in the drawer — a shortcut layer on top of Moodle's nav, not a replacement for it.
6. **Front-page hero** (done) — a full-width Udemy-style hero banner (headline, CTA, course/teammate counts) on the site's public front page. This is the one place this theme forks a shared core template rather than only adding to it: Boost's front page shares the same `theme_boost/layout/drawers.php` + `theme_boost/drawers.mustache` used by nearly every other page type, so there was no isolated template to override without affecting other pages. Instead, `theme_erasight` overrides only the `'frontpage'` entry in `$THEME->layouts` (verified via `lib/classes/output/theme_config.php` that a child theme overriding one layout key leaves every other layout — course, admin, standard, dashboard — inherited from Boost untouched) to point at its own `layout/frontpage.php` + `templates/frontpage.mustache`, near-copies of Boost's originals with one line added for the hero. **Accepted cost**: this fork won't automatically pick up any future Moodle patch to `drawers.php`/`drawers.mustache` — would need a manual diff+reapply if one ever ships.

All six phases are now in place. Still open: a 502 was reported when creating a course category (`course/editcategory.php`) shortly after phase 4's deploy — root cause not yet identified, needs `docker compose logs moodle` from around that request to diagnose (could be one of these plugins, could be unrelated VPS resource pressure; not established either way).

New plugins (theme or local) aren't picked up by an *existing* install the way a fresh `install_database.php` run picks up everything present at once — `docker/install-database.sh` now also runs `admin/cli/upgrade.php --non-interactive` on every `docker compose up` to register them (confirmed idempotent: exits 0 when nothing's pending, not an error).

## Deploy

```bash
cp .env.example .env   # fill in POSTGRES_PASSWORD, NEXT_PUBLIC_APP_URL, GMAIL_*, INITIAL_ADMIN_*
docker compose up -d --build
```

A single `docker compose up` brings up `db` → installs Moodle → starts `moodle` + `moodle-cron`, with no manual install-wizard step.

## Known gaps to close inside Moodle once it's up

- Install the [`enrol_invitation`](https://github.com/michael-milette/moodle-enrol_invitation) plugin for email-based course invitations (closest native equivalent to the old app's invite flow — one course per invitation, not multi-class in one email).
- S3-compatible file storage (reusing the VPS's existing MinIO) isn't wired up yet — Moodle uses local-disk `moodledata` for now. Add the `tool_objectfs` plugin later if that becomes necessary.
