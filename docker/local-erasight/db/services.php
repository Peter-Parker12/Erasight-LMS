<?php
// Defines a custom, narrowly-scoped external service bundling EXISTING core
// functions (core_user_create_users, core_course_get_courses) — a plugin's
// db/services.php can reference functions it doesn't implement itself,
// confirmed against lib/db/services.php on MOODLE_405_STABLE (its own
// $services array works the same way). This is the standard, documented
// Moodle mechanism for giving an external system (the CRM) a token scoped
// to exactly what it needs rather than a full admin/API-everything token.
//
// core_course_get_courses, called with no 'ids' filter, returns every
// course except the site's own front-page pseudo-course (confirmed in
// course/externallib.php) — exactly "list courses and their info." Each
// course requires moodle/course:view in that course's context, which the
// authorised service-account user needs granted at SYSTEM context (via a
// role, since it won't be enrolled in every course) — see README.md.
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
        'functions' => ['core_user_create_users', 'core_course_get_courses'],
        'enabled' => 1,
        'restrictedusers' => 1,
        'shortname' => 'erasight_crm_integration',
        'downloadfiles' => 0,
        'uploadfiles' => 0,
    ],
];
