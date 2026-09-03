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
7. **Admin explicitly follows the Udemy brand too** (done) — the earlier phase-1 decision to keep `$primary` a neutral near-black specifically so Site administration stayed quiet was reversed on request: `$primary` is now the ember accent, so every default button/focus-ring/active-nav-indicator site-wide (Home, Dashboard, My courses, Site administration included) reads as the same brand. Admin Home (`local_erasight/adminhome.php`) also gained a hero-style welcome banner, reusing the same gradient/token language as the front-page hero but contained entirely within a page this repo already owns — no new layout fork needed for that one.
8. **Full-parity welcome banners on Dashboard and My courses** (done) — `layout/mydashboard.php` and `layout/mycourses.php` are two more forked Boost layouts (`$THEME->layouts['mydashboard']`/`['mycourses']`, same partial-override mechanism as phase 6's front page), each a near-copy of `drawers.php` rendering a "Welcome back"/"Your courses" banner via the new shared `theme_erasight/banner` template (a simpler, CTA-less sibling of the front page's `hero` template) through the same `theme_erasight/frontpage` wrapper template phase 6 built — reused as-is rather than duplicated a third time, since its `{{{ herohtml }}}` insertion point was never actually frontpage-specific. **Same accepted cost as phase 6, now ×3**: none of these three forked layouts will automatically pick up a future Moodle patch to `drawers.php`/`drawers.mustache`.

All eight phases are now in place. Still open: a 502 was reported when creating a course category (`course/editcategory.php`) shortly after phase 4's deploy — root cause not yet identified, needs `docker compose logs moodle` from around that request to diagnose (could be one of these plugins, could be unrelated VPS resource pressure; not established either way).

New plugins (theme or local) aren't picked up by an *existing* install the way a fresh `install_database.php` run picks up everything present at once — `docker/install-database.sh` now also runs `admin/cli/upgrade.php --non-interactive` on every `docker compose up` to register them (confirmed idempotent: exits 0 when nothing's pending, not an error).

## CRM integration (Twenty CRM → Moodle account creation)

Goal: when a lead converts in the (modified) Twenty CRM, an account gets created here automatically. Built on Moodle's official Web Services REST API, using its real `core_user_create_users` function (verified against `user/externallib.php`) rather than a custom endpoint — no new code in this repo has to be trusted with account creation.

**What's automated** (`docker/install-database.sh` + `docker/local-erasight/db/services.php`):
- `enablewebservices` and `webserviceprotocols=rest` are turned on idempotently on every `docker compose up`, same pattern as the SMTP settings.
- A narrowly-scoped external service, **"Erasight CRM integration"** (shortname `erasight_crm_integration`), bundling only `core_user_create_users` — not a general-purpose API token. `restrictedusers => 1` means enabling it isn't enough by itself; a specific user still has to be explicitly authorised (next section).

**What's manual, deliberately** (a token is a real secret — this repo doesn't generate or store one):
1. Log in as admin → Site administration → Server → Web services → External services → find **Erasight CRM integration** → **Authorised users** → add a user for this integration to act as. Recommend a **dedicated account** with only the `moodle/user:create` capability at system level, not an existing admin — least privilege, and it makes the audit trail (who created a given account) clean.
2. Site administration → Server → Web services → Manage tokens → create a new token for that user, scoped to the **Erasight CRM integration** service.
3. Store that token wherever your Twenty CRM fork keeps its other API credentials.

**What the CRM should call**, wherever its lead-conversion code path lives (not in this repo — that's the Twenty CRM fork's own codebase):

```
POST https://lms.erasight.net/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded

wstoken=<TOKEN>
wsfunction=core_user_create_users
moodlewsrestformat=json
users[0][username]=<email, lowercased>
users[0][firstname]=<lead first name>
users[0][lastname]=<lead last name>
users[0][email]=<lead email>
users[0][auth]=manual
users[0][createpassword]=1
```

- `createpassword=1` means Moodle generates the password itself and emails the new user a set-password link — the CRM never needs to invent or transmit a real password.
- `username` must be unique. Using the lowercased email is the simplest reliable choice unless the CRM has a better natural key already.
- **Not idempotent** — calling this twice for the same email throws `Username already exists` (confirmed in `user/externallib.php`). If the CRM's conversion trigger can fire more than once for the same lead (retries, re-conversion, etc.), that specific error response should be treated as "already handled," not a failure — worth handling on the CRM side since this repo doesn't own that code.

## Deploy

```bash
cp .env.example .env   # fill in POSTGRES_PASSWORD, NEXT_PUBLIC_APP_URL, GMAIL_*, INITIAL_ADMIN_*
docker compose up -d --build
```

A single `docker compose up` brings up `db` → installs Moodle → starts `moodle` + `moodle-cron`, with no manual install-wizard step.

## Known gaps to close inside Moodle once it's up

- Install the [`enrol_invitation`](https://github.com/michael-milette/moodle-enrol_invitation) plugin for email-based course invitations (closest native equivalent to the old app's invite flow — one course per invitation, not multi-class in one email).
- S3-compatible file storage (reusing the VPS's existing MinIO) isn't wired up yet — Moodle uses local-disk `moodledata` for now. Add the `tool_objectfs` plugin later if that becomes necessary.
