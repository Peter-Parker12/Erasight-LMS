<?php
// A tile-grid admin landing page — the second of two additive "easier
// navigation" mechanisms (the first is the "Erasight quick links" branch
// local_erasight_extend_settings_navigation() injects into the real Site
// Administration tree). Same plain-PHP-then-render_from_template pattern as
// catalog.php: no renderable/exporter class, not worth the extra layer for
// one page.
//
// Deliberately uses pagelayout('admin') so the real Site Administration
// tree (quick-links branch included) still sits in the side drawer here —
// this page is a shortcut layer on top of Moodle's own admin nav, not a
// replacement or a dead end.
require(__DIR__ . '/../../config.php');

require_login();
require_capability('moodle/site:config', context_system::instance());

$PAGE->set_url(new moodle_url('/local/erasight/adminhome.php'));
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('admin');
$PAGE->set_title(get_string('adminhome', 'local_erasight'));
$PAGE->set_heading(get_string('adminhome', 'local_erasight'));

$stats = [
    (object) ['value' => $DB->count_records('course') - 1, 'label' => get_string('stat_courses', 'local_erasight')],
    (object) ['value' => $DB->count_records('user', ['deleted' => 0, 'confirmed' => 1]), 'label' => get_string('stat_users', 'local_erasight')],
];

$groups = [
    (object) [
        'title' => get_string('group_manage', 'local_erasight'),
        'tiles' => [
            (object) [
                'url' => (new moodle_url('/course/management.php'))->out(false),
                'label' => get_string('quicklink_coursemgmt', 'local_erasight'),
                'description' => get_string('quicklink_coursemgmt_desc', 'local_erasight'),
                'icon' => 'i/course',
            ],
            (object) [
                'url' => (new moodle_url('/admin/user.php'))->out(false),
                'label' => get_string('quicklink_editusers', 'local_erasight'),
                'description' => get_string('quicklink_editusers_desc', 'local_erasight'),
                'icon' => 'i/user',
            ],
        ],
    ],
    (object) [
        'title' => get_string('group_access', 'local_erasight'),
        'tiles' => [
            (object) [
                'url' => (new moodle_url('/cohort/index.php'))->out(false),
                'label' => get_string('quicklink_cohorts', 'local_erasight'),
                'description' => get_string('quicklink_cohorts_desc', 'local_erasight'),
                'icon' => 'i/cohort',
            ],
            (object) [
                'url' => (new moodle_url('/admin/settings.php', ['section' => 'manageenrols']))->out(false),
                'label' => get_string('quicklink_manageenrols', 'local_erasight'),
                'description' => get_string('quicklink_manageenrols_desc', 'local_erasight'),
                'icon' => 'i/enrolusers',
            ],
        ],
    ],
    (object) [
        'title' => get_string('group_system', 'local_erasight'),
        'tiles' => [
            (object) [
                'url' => (new moodle_url('/admin/search.php'))->out(false),
                'label' => get_string('quicklink_siteadmin', 'local_erasight'),
                'description' => get_string('quicklink_siteadmin_desc', 'local_erasight'),
                'icon' => 'i/settings',
            ],
        ],
    ],
];

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_erasight/adminhome', [
    'overviewtitle' => get_string('group_overview', 'local_erasight'),
    'stats' => $stats,
    'groups' => $groups,
]);
echo $OUTPUT->footer();
