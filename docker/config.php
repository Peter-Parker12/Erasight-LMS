<?php
// Generated for Docker deployment — reads connection/site settings from the
// SAME env vars already used by the rest of this repo's docker-compose.yml
// (POSTGRES_USER/PASSWORD/DB, NEXT_PUBLIC_APP_URL), not a separate Moodle-only
// config. Structure follows Moodle's own config-dist.php (moodle/moodle on
// GitHub) for the 4.5 branch.
//
// NOT verified by actually running Moodle (no PHP/Moodle runtime available
// in the environment this was written in) — review against config-dist.php
// in the cloned source if the install step errors on first boot.

unset($CFG);
global $CFG;
$CFG = new stdClass();

$CFG->dbtype    = 'pgsql';
$CFG->dblibrary = 'native';
$CFG->dbhost    = 'db'; // the compose service name — always true in this stack
$CFG->dbname    = getenv('POSTGRES_DB') ?: 'erasight_lms';
$CFG->dbuser    = getenv('POSTGRES_USER') ?: 'postgres';
$CFG->dbpass    = getenv('POSTGRES_PASSWORD') ?: '';
// Distinct prefix so Moodle's tables can't collide with anything already in
// this database — Prisma's tables have no prefix at all.
$CFG->prefix    = 'mdl_';
$CFG->dboptions = [
    'dbpersist' => false,
    'dbport'    => '5432',
    'dbsocket'  => false,
];

$CFG->wwwroot  = getenv('NEXT_PUBLIC_APP_URL') ?: 'http://localhost';
$CFG->dataroot = '/var/moodledata';
$CFG->admin    = 'admin';

$CFG->directorypermissions = 0755;

require_once(__DIR__ . '/lib/setup.php');

// There is no closing PHP tag on purpose — see php.net manual for why.
