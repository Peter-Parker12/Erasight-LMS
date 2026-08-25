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
