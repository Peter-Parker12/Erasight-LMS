<?php
// Used ONLY for the 'frontpage' page layout (config.php's $THEME->layouts
// override, added back once this file exists) — every other page layout
// still uses Boost's own theme/boost/layout/drawers.php, untouched.
//
// A deliberate near-copy of that file, fetched FRESH from
// theme/boost/layout/drawers.php on MOODLE_502_STABLE for this rebuild —
// not carried forward from the 4.5-era version, which had genuinely drifted
// (Bootstrap 5's data-bs-* attributes, a renamed core/tertiary_navigation_selector
// partial, new coursefullname/courseurl fields — confirmed by diffing the
// old file against the real current one before writing this). The
// drawer/nav/header setup below is unchanged from Boost so the front page
// keeps normal chrome apart from the hero addition and hidenavbar flag.
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
        // \core\output\select_menu confirmed fresh against the real
        // MOODLE_502_STABLE drawers.php — the 4.5-era file this was forked
        // from originally just exported $overflowdata directly, which is no
        // longer how Boost itself builds this on 5.2.
        $selectmenu = new \core\output\select_menu(
            'tertiarynavigation',
            $overflowdata->urls,
            $overflowdata->selected,
        );
        $selectmenu->set_label($overflowdata->label, $overflowdata->labelattributes);
        $overflow = $selectmenu->export_for_template($OUTPUT);
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

// coursefullname/courseurl are new in the real 5.2 drawers.php (not present
// in the 4.5 version this theme forked before) — included here for parity
// even though the front page itself has no $PAGE->course, so both resolve
// to empty/null via the null-safe operator, matching Boost's own real
// behaviour on a courseless page.
$coursefullname = ($PAGE->course?->fullname) ? format_string(
    $PAGE->course->fullname,
    true,
    ['context' => context_course::instance($PAGE->course->id), 'escape' => false],
) : '';
$courseurl = $PAGE->course ? new \core\url('/course/view.php', ['id' => $PAGE->course->id]) : null;

// --- Erasight addition starts here ---
// $DB isn't in scope here the way it is in a normal top-level script: this
// file is include()'d from inside a renderer method (not executed as a
// standalone request), so only the specific globals that method itself
// declares — $CFG, $SITE, $OUTPUT, $PAGE, $USER — are already available
// above without a `global` statement. $DB was never part of that set since
// the original Boost file never touches the database.
global $DB;

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
    'eyebrow' => get_string('hero_eyebrow', 'theme_erasight'),
    'headlinepre' => get_string('hero_headline_pre', 'theme_erasight'),
    'headlineemphasis' => get_string('hero_headline_emphasis', 'theme_erasight'),
    'headlinepost' => get_string('hero_headline_post', 'theme_erasight'),
    'tagline' => get_string('hero_tagline', 'theme_erasight'),
    'cta' => $herocta,
    'stats' => $herostats,
]);
// --- Erasight addition ends here ---

$templatecontext = [
    'sitename' => format_string($SITE->shortname, true, ['context' => context_course::instance(SITEID), "escape" => false]),
    'coursefullname' => $coursefullname,
    'courseurl' => $courseurl ? $courseurl->out(false) : null,
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
    'landinghtml' => '', // Populated in Phase 4 — Mustache renders '' as nothing, not an error.
    // 'nonavbar' in config.php's $THEME->layouts['frontpage'] does NOT
    // suppress the persistent top nav bar — verified against real
    // MOODLE_502_STABLE source: core_renderer::full_header() reads it only
    // to set $header->hasnavbar, which controls a secondary in-page header
    // component, not the theme_boost/navbar partial (included
    // unconditionally by drawers.mustache, and by this fork, regardless of
    // any layout option). hidenavbar is this theme's own real flag,
    // guarding both the navbar partial AND output.full_header (Moodle's own
    // page-heading bar, redundant with the hero below it) in
    // frontpage.mustache — scoped to this layout only, so
    // mydashboard.php/mycourses.php keep normal chrome for logged-in users.
    'hidenavbar' => true,
];

echo $OUTPUT->render_from_template('theme_erasight/frontpage', $templatecontext);
