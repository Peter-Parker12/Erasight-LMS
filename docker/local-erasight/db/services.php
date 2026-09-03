<?php
// Defines a custom, narrowly-scoped external service bundling an EXISTING
// core function (core_user_create_users) — a plugin's db/services.php can
// reference functions it doesn't implement itself, confirmed against
// lib/db/services.php on MOODLE_405_STABLE (its own $services array works
// the same way). This is the standard, documented Moodle mechanism for
// giving an external system (the CRM) a token scoped to exactly one
// capability rather than a full admin/API-everything token.
//
// restrictedusers => 1 means enabling this service isn't enough on its
// own — an admin still has to explicitly authorise a specific user for it
// (Site administration > Server > Web services > External services >
// Authorised users) before a token can be issued. Deliberately left as a
// manual step: generating/storing that token is a real secret, not
// something this repo should create or hold on its own.
defined('MOODLE_INTERNAL') || die();

$services = [
    'Erasight CRM integration' => [
        'functions' => ['core_user_create_users'],
        'enabled' => 1,
        'restrictedusers' => 1,
        'shortname' => 'erasight_crm_integration',
        'downloadfiles' => 0,
        'uploadfiles' => 0,
    ],
];
