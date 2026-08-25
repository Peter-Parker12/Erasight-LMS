# Moodle 4.5 LTS, self-built (no maintained free Docker image exists anymore —
# bitnami/moodle moved to a paid "Bitnami Secure Images" subscription in 2026,
# and the official moodlehq/moodle-docker repo is explicitly dev/test-only).
#
# One image, reused by all three compose services (moodle, moodle-install,
# moodle-cron) with different `command:` overrides — there's nothing to build
# differently between them. Replaces the old Next.js Dockerfile — the app
# source (app/, actions/, lib/, components/, prisma/, ...) is no longer built
# by anything, left in place but unused pending a decision on whether to
# archive or delete it.

FROM alpine/git:latest AS fetch
WORKDIR /src
# MOODLE_405_STABLE = the 4.5.x LTS branch (supported through Oct 2027).
RUN git clone --depth=1 --branch MOODLE_405_STABLE https://github.com/moodle/moodle.git .

FROM php:8.3-apache AS runtime
WORKDIR /var/www/html

# Build deps for the PHP extensions below, removed after install to keep the
# image lean.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libpq-dev libicu-dev libxml2-dev libzip-dev libsodium-dev \
      libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
      libxslt1-dev libonig-dev git unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
      pgsql pdo_pgsql intl xml zip sodium gd soap xsl opcache mbstring exif \
    && apt-get purge -y --auto-remove libpq-dev libicu-dev libxml2-dev libzip-dev \
      libsodium-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libxslt1-dev \
      libonig-dev \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php-moodle.ini /usr/local/etc/php/conf.d/zz-moodle.ini
RUN a2enmod rewrite

COPY --from=fetch /src /var/www/html
COPY docker/config.php /var/www/html/config.php
COPY docker/install-database.sh /usr/local/bin/install-database.sh
COPY docker/cron-loop.sh /usr/local/bin/cron-loop.sh
RUN chmod +x /usr/local/bin/install-database.sh /usr/local/bin/cron-loop.sh

RUN mkdir -p /var/moodledata \
    && chown -R www-data:www-data /var/moodledata /var/www/html \
    && chmod -R 0755 /var/www/html

# No USER directive here: the `moodle` (Apache) service needs to start as
# root so its master process can bind port 80 — Apache drops its worker
# processes to www-data internally on its own. The one-shot `moodle-install`
# and looping `moodle-cron` services (which run PHP CLI, not Apache) instead
# set `user: www-data` in docker-compose.yml, since they don't need root.
EXPOSE 80
