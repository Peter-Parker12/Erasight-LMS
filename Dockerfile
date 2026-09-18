# Moodle 5.2 (latest stable — upgraded from 4.5 LTS), self-built (no
# maintained free Docker image exists anymore — bitnami/moodle moved to a
# paid "Bitnami Secure Images" subscription in 2026, and the official
# moodlehq/moodle-docker repo is explicitly dev/test-only).
#
# One image, reused by all three compose services (moodle, moodle-install,
# moodle-cron) with different `command:` overrides — there's nothing to build
# differently between them. Replaces the old Next.js Dockerfile — the app
# source (app/, actions/, lib/, components/, prisma/, ...) is no longer built
# by anything, left in place but unused pending a decision on whether to
# archive or delete it.

FROM alpine/git:latest AS fetch
WORKDIR /src
# MOODLE_502_STABLE = the latest stable release (5.2) as of this upgrade,
# confirmed directly against github.com/moodle/moodle's real branch list —
# previously MOODLE_405_STABLE (4.5 LTS). Moodle 5.1 restructured the
# webroot: most of the codebase (including every plugin directory) now
# lives under a new public/ subdirectory, confirmed by direct checks against
# the real MOODLE_500_STABLE/501_STABLE/502_STABLE branches (e.g.
# theme/boost/config.php is 404 at the old root path, 200 under
# public/theme/boost/config.php on 5.1+). config.php and admin/cli/* stay
# at the repo root unchanged — Moodle's own official 5.1 restructure guide
# confirms $CFG->dirroot/$CFG->wwwroot behave as before, and a real
# backward-compat shim at the old root lib/setup.php bridges through to the
# real code now under public/lib/setup.php. See the COPY destinations and
# the Apache DocumentRoot change below for what this actually requires.
RUN git clone --depth=1 --branch MOODLE_502_STABLE https://github.com/moodle/moodle.git .

# webservice_mcp: a third-party (not Moodle core, not ours) plugin exposing
# Moodle's external services as an MCP server for AI assistants — cloned
# fresh here rather than vendored into this repo, same reasoning as Moodle
# core itself above. onbirdev/moodle-webservice_mcp confirmed as the
# canonical, actively-maintained repo (15 stars, most recent pushed_at) vs.
# the one other fork on GitHub, which has zero commits beyond it.
RUN git clone --depth=1 https://github.com/onbirdev/moodle-webservice_mcp.git /src-webservice-mcp

# Boost Union: theme_erasight's new parent theme, replacing raw Boost after
# evaluating real GitHub theme repos for Moodle 5.x compatibility this
# session — Adaptable had no MOODLE_50x_STABLE branch at all, Moove tracked
# only through 5.1, Boost Union had an exact MOODLE_502_STABLE branch match
# and was pushed the same day this was written. GPL-3.0, same license as
# everything else in this install — cloned fresh here, never vendored/
# edited directly, same pattern as webservice_mcp above and Moodle core
# itself: this repo's own customization lives entirely in theme_erasight,
# which extends Boost Union via real, documented extension points
# (confirmed against the official moodle-theme_boost_union_child
# boilerplate before writing theme_erasight's config.php/lib.php).
RUN git clone --depth=1 --branch MOODLE_502_STABLE https://github.com/moodle-an-hochschulen/moodle-theme_boost_union.git /src-boost-union

FROM php:8.3-apache AS runtime
WORKDIR /var/www/html

# Build deps for the PHP extensions below. Purged after install to drop
# headers/build tools, but WITHOUT --auto-remove: that flag cascades into
# removing the runtime shared libraries (libpq.so.5, libicu*, libpng16,
# libzip, libexslt) that the compiled .so extensions dlopen() at startup,
# since apt sees nothing left depending on them once the -dev packages are
# gone — that broke pgsql/intl/pdo_pgsql/xsl/zip/gd loading on first deploy.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libpq-dev libicu-dev libxml2-dev libzip-dev libsodium-dev \
      libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
      libxslt1-dev libonig-dev git unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
      pgsql pdo_pgsql intl xml zip sodium gd soap xsl opcache mbstring exif \
    && apt-get purge -y libpq-dev libicu-dev libxml2-dev libzip-dev \
      libsodium-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libxslt1-dev \
      libonig-dev \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php-moodle.ini /usr/local/etc/php/conf.d/zz-moodle.ini
RUN a2enmod rewrite

COPY --from=fetch /src /var/www/html
# Boost Union (theme_erasight's parent theme) copied in BEFORE theme_erasight
# itself, matching real-plugin-dependency order even though Moodle's own
# plugin loading doesn't strictly require it — makes the "erasight depends
# on boost_union" relationship visible in this file, not just implied.
COPY --from=fetch /src-boost-union /var/www/html/public/theme/boost_union
# Our theme and the catalog page are plugins, not core edits — added into
# the freshly-cloned tree rather than committed to the fetch stage's
# checkout, so they survive every future MOODLE_502_STABLE re-clone unchanged.
# Destinations are under public/ — confirmed by direct HTTP checks that
# plugin directories physically moved there in 5.1+, with no compatibility
# shim (unlike config.php/admin/cli, which stayed at the repo root).
COPY docker/theme-erasight /var/www/html/public/theme/erasight
COPY docker/local-erasight /var/www/html/public/local/erasight
COPY --from=fetch /src-webservice-mcp /var/www/html/public/webservice/mcp
COPY docker/config.php /var/www/html/config.php
COPY docker/install-database.sh /usr/local/bin/install-database.sh
COPY docker/cron-loop.sh /usr/local/bin/cron-loop.sh
RUN chmod +x /usr/local/bin/install-database.sh /usr/local/bin/cron-loop.sh

# Apache's DocumentRoot must point at public/ on 5.1+ — the old root-level
# index.php now deliberately throws an error telling you to do exactly this
# (confirmed by reading its real source: throw new
# \core\exception\moodle_exception('rootdirpublic', 'error')). Matches the
# exact change Moodle's own official restructure guide gives as the example
# (DocumentRoot /srv/moodle/public). admin/cli/* and config.php are
# unaffected since they were never served through DocumentRoot in the first
# place — this only needs to touch where Apache resolves incoming HTTP
# requests from, not where PHP CLI scripts get invoked from.
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' \
      /etc/apache2/sites-available/*.conf /etc/apache2/apache2.conf

RUN mkdir -p /var/moodledata \
    && chown -R www-data:www-data /var/moodledata /var/www/html \
    && chmod -R 0755 /var/www/html

# No USER directive here: the `moodle` (Apache) service needs to start as
# root so its master process can bind port 80 — Apache drops its worker
# processes to www-data internally on its own. The one-shot `moodle-install`
# and looping `moodle-cron` services (which run PHP CLI, not Apache) instead
# set `user: www-data` in docker-compose.yml, since they don't need root.
EXPOSE 80
