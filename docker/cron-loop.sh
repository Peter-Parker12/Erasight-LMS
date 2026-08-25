#!/bin/sh
# Moodle needs admin/cli/cron.php run roughly every minute for scheduled
# tasks, notifications, etc. There's no separate cron daemon in this image,
# so this loop is the whole job — the moodle-cron compose service's command.
set -eu

cd /var/www/html

while true; do
  php admin/cli/cron.php || echo "cron.php exited non-zero — will retry next cycle."
  sleep 60
done
