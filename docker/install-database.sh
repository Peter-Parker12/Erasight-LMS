#!/bin/sh
# One-shot: installs the Moodle schema + admin account into an empty
# database, then configures outgoing mail. admin/cli/install_database.php
# has no "already installed" flag — it hard-errors (exit 1) if the database
# already has tables — so on every `docker compose up` after the first
# successful run, this treats that specific failure as a benign no-op rather
# than blocking `moodle` from starting. Mirrors scripts/bootstrap-admin.mjs's
# idempotency approach in the Next.js app this is replacing.
set -eu

cd /var/www/html

# NOTE: any non-zero exit here is treated as "already installed" so repeat
# `docker compose up` runs don't block. That's the expected case, but a real
# misconfiguration (wrong DB password, unreachable db, etc.) would ALSO exit
# non-zero and get swallowed the same way — this script does not attempt to
# distinguish the two. Nothing above is redirected, so the actual error text
# always reaches `docker compose logs moodle-install`: check there first if
# `moodle` comes up but Moodle itself isn't actually working.
if php admin/cli/install_database.php \
  --agree-license \
  --fullname="${MOODLE_SITE_FULLNAME:-Erasight LMS}" \
  --shortname="${MOODLE_SITE_SHORTNAME:-ErasightLMS}" \
  --adminuser="${MOODLE_ADMIN_USER:-admin}" \
  --adminpass="${INITIAL_ADMIN_PASSWORD:?INITIAL_ADMIN_PASSWORD is required}" \
  --adminemail="${INITIAL_ADMIN_EMAIL:?INITIAL_ADMIN_EMAIL is required}"; then
  echo "Moodle database installed."
else
  echo "install_database.php exited non-zero — see output above for whether this was the expected 'already installed' case or a real error."
fi

# Registers any plugin added to the image since the last deploy (theme_erasight,
# local_erasight, ...) — a fresh install_database.php run above already picks up
# whatever plugins exist at that moment, but an EXISTING site needs this
# separate step to notice new plugin directories. Verified against
# admin/cli/upgrade.php on MOODLE_405_STABLE: with nothing pending it exits 0
# (not an error), so this is safe to run on every startup, not just once.
php admin/cli/upgrade.php --non-interactive
echo "Plugin upgrade check complete."

# Outgoing mail — reuses the same Gmail App Password already set up for the
# Next.js app's invitation emails. admin/cli/cfg.php is idempotent (no-ops if
# the value is already set), so this always runs, not just on first install.
if [ -n "${GMAIL_USER:-}" ] && [ -n "${GMAIL_APP_PASSWORD:-}" ]; then
  php admin/cli/cfg.php --name=smtphosts --set="smtp.gmail.com:465"
  php admin/cli/cfg.php --name=smtpuser --set="${GMAIL_USER}"
  php admin/cli/cfg.php --name=smtppass --set="${GMAIL_APP_PASSWORD}"
  php admin/cli/cfg.php --name=smtpsecure --set="ssl"
  php admin/cli/cfg.php --name=noreplyaddress --set="${GMAIL_USER}"
  echo "SMTP configured from GMAIL_USER/GMAIL_APP_PASSWORD."
else
  echo "GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping SMTP configuration."
fi

# Web services + REST/MCP protocols. Both are plain $CFG scalars —
# enablewebservices confirmed in lib/classes/plugininfo/webservice.php,
# webserviceprotocols is the real comma-separated config name that same
# file reads/writes (a list, not a single value — REST for the CRM
# integration and MCP for Claude coexist here). cfg.php is idempotent, same
# as the SMTP settings above. The webservice_mcp plugin itself (cloned at
# build time, see Dockerfile) is registered by admin/cli/upgrade.php above,
# same as any other new plugin.
#
# This only turns the transports on — it does NOT create a token by itself.
# A token is a real secret, so generating and authorising one stays a
# manual step for both integrations: Site administration > Server > Web
# services > External services > find the service ("Erasight CRM
# integration" or "Erasight Claude integration") > Authorised users, then
# Manage tokens. See README.md for exact request formats and the extra
# webservice/mcp:use capability the MCP integration needs.
php admin/cli/cfg.php --name=enablewebservices --set=1
php admin/cli/cfg.php --name=webserviceprotocols --set=rest,mcp
echo "Web services + REST/MCP protocols enabled."

# Paid-course storefront: enrol_fee (the modern paid-enrolment method) and
# paygw_paypal (the only payment gateway bundled in Moodle core — confirmed
# against payment/gateway/ on MOODLE_405_STABLE) enabled sitewide. Both
# config names confirmed directly from source, not assumed:
# enrol_plugins_enabled in lib/enrollib.php (enrol_get_plugins()/
# enrol_is_enabled()), paygw_plugins_sortorder in
# lib/classes/plugininfo/paygw.php (enable_plugin()/set_enabled_plugins(),
# which literally calls set_config('paygw_plugins_sortorder', ...)).
#
# Both are READ then APPENDED, never blindly overwritten — Moodle's own
# installer already enables several enrolment methods by default (manual,
# self, guest, cohort, ...), and a blind --set would silently disable
# whichever of those an admin is actually relying on for existing courses.
#
# Tradeoff accepted, not hidden: this runs on every `docker compose up`, so
# if an admin later deliberately disables 'fee' or 'paypal' via the UI (e.g.
# pausing paid enrolment temporarily), the next redeploy will silently
# re-enable it — unlike the theme setting below, this isn't guarded to
# "only set once". Judged lower-risk than the theme case: enabling the
# plugin sitewide only makes it an available option, it doesn't add a fee
# instance (a price) to any course by itself — that stays a genuinely
# separate, per-course manual step either way.
CURRENT_ENROL=$(php admin/cli/cfg.php --name=enrol_plugins_enabled --no-eol 2>/dev/null || echo "")
case ",${CURRENT_ENROL}," in
  *,fee,*) echo "enrol_fee already enabled." ;;
  *)
    NEW_ENROL=$([ -z "${CURRENT_ENROL}" ] && echo "fee" || echo "${CURRENT_ENROL},fee")
    php admin/cli/cfg.php --name=enrol_plugins_enabled --set="${NEW_ENROL}"
    echo "Added 'fee' to enrol_plugins_enabled (was: ${CURRENT_ENROL:-<empty>})."
    ;;
esac

CURRENT_PAYGW=$(php admin/cli/cfg.php --name=paygw_plugins_sortorder --no-eol 2>/dev/null || echo "")
case ",${CURRENT_PAYGW}," in
  *,paypal,*) echo "paygw_paypal already enabled." ;;
  *)
    NEW_PAYGW=$([ -z "${CURRENT_PAYGW}" ] && echo "paypal" || echo "${CURRENT_PAYGW},paypal")
    php admin/cli/cfg.php --name=paygw_plugins_sortorder --set="${NEW_PAYGW}"
    echo "Added 'paypal' to paygw_plugins_sortorder (was: ${CURRENT_PAYGW:-<empty>})."
    ;;
esac

# Sets 'erasight' as the starting theme, but ONLY if no theme has ever been
# explicitly set — covers both a genuinely fresh install AND this deploy's
# own transition off the old $CFG->theme force in config.php (in that case
# the DB's theme config was never populated either, since config.php always
# won before now). Never overwrites a theme an admin has since picked via
# Site administration > Appearance > Themes on a later `docker compose up`.
# admin/cli/cfg.php in read mode exits 3 if the value has never been set,
# 0 if it has — confirmed directly from the script's own source.
if ! php admin/cli/cfg.php --name=theme >/dev/null 2>&1; then
  php admin/cli/cfg.php --name=theme --set=erasight
  echo "Theme was never explicitly set — defaulted to erasight."
fi
