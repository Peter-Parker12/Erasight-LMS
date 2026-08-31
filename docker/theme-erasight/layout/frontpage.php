<?php
// Used ONLY for the 'frontpage' page layout (see config.php's $THEME->layouts
// override) — every other page layout still uses Boost's own
// theme/boost/layout/drawers.php, untouched.
//
// This file is a deliberate near-copy of that file (theme/boost/layout/
// drawers.php on MOODLE_405_STABLE, fetched and read in full before writing
// this), not a from-scratch layout — the drawer/nav/header setup below is
// unchanged from Boost so the front page keeps normal chrome; the only real
// addition is $herohtml, rendered by theme_erasight/templates/frontpage.mustache
// (itself a near-copy of theme_boost/drawers.mustache with one extra line)
// instead of the shared theme_boost/drawers template.
//
// Known cost of this approach, accepted deliberately: if Moodle patches
// drawers.php/drawers.mustache in a future point release, this fork won't
// inherit that fix automatically — would need a manual diff+reapply.
defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/behat/lib.php');
require_once($CFG->dirroot . '/course/lib.php');

// Add block button in editing mode.
$addblockbutton = $OUTPUT->addblockbutton();

if (isloggedin()) {
    $courseindexopen = (get_user_preferences('drawer-open-index', true) == true);
    $blockdraweropen = (get_user_preferences('drawer-open-block') == true);
} else {
    $courseindexopen = false;
    $blockdraweropen = false;
}

if (defined('BEHAT_SITE_RUNNING') && get_user_preferences('behat_keep_drawer_closed') != 1) {
    $blockdraweropen = true;
}

$extraclasses = ['uses-drawers'];
if ($courseindexopen) {
    $extraclasses[] = 'drawer-open-index';
}

$blockshtml = $OUTPUT->blocks('side-pre');
$hasblocks = (strpos($blockshtml, 'data-block=') !== false || !empty($addblockbutton));
if (!$hasblocks) {
    $blockdraweropen = false;
}
$courseindex = core_course_drawer();
if (!$courseindex) {
    $courseindexopen = false;
}

$bodyattributes = $OUTPUT->body_attributes($extraclasses);
$forceblockdraweropen = $OUTPUT->firstview_fakeblocks();

$secondarynavigation = false;
$overflow = '';
if ($PAGE->has_secondary_navigation()) {
    $tablistnav = $PAGE->has_tablist_secondary_navigation();
    $moremenu = new \core\navigation\output\more_menu($PAGE->secondarynav, 'nav-tabs', true, $tablistnav);
    $secondarynavigation = $moremenu->export_for_template($OUTPUT);
    $overflowdata = $PAGE->secondarynav->get_overflow_menu_data();
    if (!is_null($overflowdata)) {
        $overflow = $overflowdata->export_for_template($OUTPUT);
    }
}

$primary = new core\navigation\output\primary($PAGE);
$renderer = $PAGE->get_renderer('core');
$primarymenu = $primary->export_for_template($renderer);
$buildregionmainsettings = !$PAGE->include_region_main_settings_in_header_actions() && !$PAGE->has_secondary_navigation();
// If the settings menu will be included in the header then don't add it here.
$regionmainsettingsmenu = $buildregionmainsettings ? $OUTPUT->region_main_settings_menu() : false;

$header = $PAGE->activityheader;
$headercontent = $header->export_for_template($renderer);

// --- Erasight addition starts here ---
if (isloggedin() && !isguestuser()) {
    $herocta = (object) [
        'primaryurl' => (new moodle_url('/my/'))->out(false),
        'primarylabel' => get_string('hero_primary_loggedin', 'theme_erasight'),
        'secondaryurl' => (new moodle_url('/local/erasight/catalog.php'))->out(false),
        'secondarylabel' => get_string('hero_secondary_loggedin', 'theme_erasight'),
    ];
} else {
    $herocta = (object) [
        'primaryurl' => (new moodle_url('/local/erasight/catalog.php'))->out(false),
        'primarylabel' => get_string('hero_primary_loggedout', 'theme_erasight'),
        'secondaryurl' => (new moodle_url('/login/index.php'))->out(false),
        'secondarylabel' => get_string('hero_secondary_loggedout', 'theme_erasight'),
    ];
}

$herostats = [
    (object) [
        'value' => $DB->count_records('course') - 1, // Excludes the site "front page" pseudo-course (id 1).
        'label' => get_string('hero_stat_courses', 'theme_erasight'),
    ],
    (object) [
        // Excludes the guest account by its real $CFG->siteguest id, rather
        // than guessing at a fixed offset — 'deleted' => 0 already excludes
        // deleted accounts, so there's nothing else to subtract for.
        'value' => $DB->count_records_select(
            'user',
            'deleted = 0 AND confirmed = 1 AND id != ?',
            [$CFG->siteguest]
        ),
        'label' => get_string('hero_stat_users', 'theme_erasight'),
    ],
];

$herohtml = $OUTPUT->render_from_template('theme_erasight/hero', [
    'sitename' => format_string($SITE->fullname, true, ['context' => context_course::instance(SITEID)]),
    'tagline' => get_string('hero_tagline', 'theme_erasight'),
    'cta' => $herocta,
    'stats' => $herostats,
]);
// --- Erasight addition ends here ---

$templatecontext = [
    'sitename' => format_string($SITE->shortname, true, ['context' => context_course::instance(SITEID), "escape" => false]),
    'output' => $OUTPUT,
    'sidepreblocks' => $blockshtml,
    'hasblocks' => $hasblocks,
    'bodyattributes' => $bodyattributes,
    'courseindexopen' => $courseindexopen,
    'blockdraweropen' => $blockdraweropen,
    'courseindex' => $courseindex,
    'primarymoremenu' => $primarymenu['moremenu'],
    'secondarymoremenu' => $secondarynavigation ?: false,
    'mobileprimarynav' => $primarymenu['mobileprimarynav'],
    'usermenu' => $primarymenu['user'],
    'langmenu' => $primarymenu['lang'],
    'forceblockdraweropen' => $forceblockdraweropen,
    'regionmainsettingsmenu' => $regionmainsettingsmenu,
    'hasregionmainsettingsmenu' => !empty($regionmainsettingsmenu),
    'overflow' => $overflow,
    'headercontent' => $headercontent,
    'addblockbutton' => $addblockbutton,
    'herohtml' => $herohtml,
];

echo $OUTPUT->render_from_template('theme_erasight/frontpage', $templatecontext);
