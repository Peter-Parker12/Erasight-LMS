<?php
// Used ONLY for the 'frontpage' page layout (config.php's $THEME->layouts
// override) — every other page layout still uses theme_boost_union's own
// layout/drawers.php, untouched.
//
// A deliberate near-copy of theme/boost_union/layout/drawers.php, fetched
// FRESH from moodle-an-hochschulen/moodle-theme_boost_union on
// MOODLE_502_STABLE for this rebase (theme_erasight is now a Boost Union
// child, not a direct Boost child — see config.php). Boost Union's own
// drawers.php is substantially more complex than raw Boost's (~15 extra
// require_once includes for smart menus, block regions, course hints,
// info banners, footnote, accessibility pages, etc.) — rather than
// hand-retranscribe that logic (exactly the kind of subtle-omission risk
// that caused real bugs earlier this session), this file preserves it
// verbatim, with two deliberate, surgical changes:
//   1. Every `require_once(__DIR__ . '/includes/X.php')` became
//      `require_once($CFG->dirroot . '/theme/boost_union/layout/includes/X.php')`
//      — this file lives in OUR theme's layout/ directory, not Boost
//      Union's, so __DIR__ would resolve to the wrong place and 404. This
//      way our fork stays in sync with Boost Union's real include logic
//      instead of duplicating 17 files that could drift out of date.
//   2. The hero-building block and the final render target (this theme's
//      own 'theme_erasight/frontpage' template instead of the shared
//      'theme_boost/drawers', which Boost Union itself overrides globally)
//      — everything else, including the MWP extension-point branch, is
//      unchanged from the real file, kept for fidelity even though this
//      site doesn't have that extension installed.
defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/behat/lib.php');
require_once($CFG->dirroot . '/course/lib.php');

// Require Boost Union's own locallib.php — this layout calls several of
// its functions/constants (THEME_BOOST_UNION_SETTING_SELECT_YES etc.).
require_once($CFG->dirroot . '/theme/boost_union/locallib.php');

// Add activity navigation if the feature is enabled.
$activitynavigation = get_config('theme_boost_union', 'activitynavigation');
if ($activitynavigation == THEME_BOOST_UNION_SETTING_SELECT_YES) {
    $PAGE->theme->usescourseindex = false;
}

// Add block button in editing mode.
$addblockbutton = $OUTPUT->addblockbutton();

if (isloggedin()) {
    $courseindexopen = (get_user_preferences('drawer-open-index', true) == true);

    if (isguestuser()) {
        $sitehomerighthandblockdrawerserverconfig = get_config('theme_boost_union', 'showsitehomerighthandblockdraweronguestlogin');
    } else {
        $sitehomerighthandblockdrawerserverconfig = get_config('theme_boost_union', 'showsitehomerighthandblockdraweronfirstlogin');
    }

    $isadminsettingyes = ($sitehomerighthandblockdrawerserverconfig == THEME_BOOST_UNION_SETTING_SELECT_YES);
    $blockdraweropen = (get_user_preferences('drawer-open-block', $isadminsettingyes)) == true;
} else {
    $courseindexopen = false;
    $blockdraweropen = false;

    if (get_config('theme_boost_union', 'showsitehomerighthandblockdraweronvisit') == THEME_BOOST_UNION_SETTING_SELECT_YES) {
        $blockdraweropen = true;
    }
}

if (defined('BEHAT_SITE_RUNNING') && get_user_preferences('behat_keep_drawer_closed') != 1) {
    try {
        if (
            get_config('theme_boost_union', 'showsitehomerighthandblockdraweronvisit') === false &&
            get_config('theme_boost_union', 'showsitehomerighthandblockdraweronguestlogin') === false &&
            get_config('theme_boost_union', 'showsitehomerighthandblockdraweronfirstlogin') === false
        ) {
            $blockdraweropen = true;
        }
    } catch (Exception $e) {
        echo $e->getMessage();

        $blockdraweropen = true;
    }
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

$forceblockdraweropen = $OUTPUT->firstview_fakeblocks();

$secondarynavigation = false;
$overflow = '';
if ($PAGE->has_secondary_navigation()) {
    $tablistnav = $PAGE->has_tablist_secondary_navigation();
    $moremenu = new \core\navigation\output\more_menu($PAGE->secondarynav, 'nav-tabs', true, $tablistnav);
    $secondarynavigation = $moremenu->export_for_template($OUTPUT);
    $overflowdata = $PAGE->secondarynav->get_overflow_menu_data();
    if (!is_null($overflowdata)) {
        $selectmenu = new \core\output\select_menu(
            'tertiarynavigation',
            $overflowdata->urls,
            $overflowdata->selected,
        );
        $selectmenu->set_label($overflowdata->label, $overflowdata->labelattributes);
        $overflow = $selectmenu->export_for_template($OUTPUT);
    }
}

// Load the navigation from boost_union primary navigation, the extended
// version of core primary navigation. It includes the smart menus and menu
// items, for multiple locations.
$primary = new theme_boost_union\output\navigation\primary($PAGE);
$renderer = $PAGE->get_renderer('core');
$primarymenu = $primary->export_for_template($renderer);

// Add special class selectors to improve the Smart menus SCSS selectors.
if (isset($primarymenu['includesmartmenu']) && $primarymenu['includesmartmenu'] == true) {
    $extraclasses[] = 'theme-boost-union-smartmenu';
}

if (!empty($primarymenu['bottombar']) && !empty($primarymenu['bottombar']['drawer']) && !empty($primarymenu['includesmartmenu'])) {
    $extraclasses[] = 'theme-boost-union-bottombar';
}

// Include the extra classes for the course index modification.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/courseindex.php');

// Include the extra classes for the section appearance modification.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/sectionappearance.php');

$buildregionmainsettings = !$PAGE->include_region_main_settings_in_header_actions() && !$PAGE->has_secondary_navigation();
// If the settings menu will be included in the header then don't add it here.
$regionmainsettingsmenu = $buildregionmainsettings ? $OUTPUT->region_main_settings_menu() : false;

$bodyattributes = $OUTPUT->body_attributes($extraclasses); // In the original layout file, this line is placed more above,
                                                           // but we amended $extraclasses and had to move it.

$header = $PAGE->activityheader;
$headercontent = $header->export_for_template($renderer);

$coursefullname = $PAGE->course?->fullname ? format_string(
    $PAGE->course->fullname,
    true,
    ['context' => context_course::instance($PAGE->course->id), 'escape' => false],
) : '';
$courseurl = $PAGE->course ? new \core\url('/course/view.php', ['id' => $PAGE->course->id]) : null;

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
];

// Include the template content for the course related hints.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/courserelatedhints.php');

// Include the template content for the block regions.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/blockregions.php');

// Include the content for the back to top button.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/backtotopbutton.php');

// Include the content for the Boost Union footer buttons.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/footerbuttons.php');

// Include the content for the scrollspy.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/scrollspy.php');

// Include the template content for the footnote.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/footnote.php');

// Include the template content for the static pages.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/staticpages.php');

// Include the template content for the accessibility pages.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/accessibilitypages.php');

// Include the template content for the footer button.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/footer.php');

// Include the template content for the JavaScript disabled hint.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/javascriptdisabledhint.php');

// Include the template content for the info banners.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/infobanners.php');

// Include the template content for the navbar.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/navbar.php');

// Include the template content for the advertisement tiles, but only if we are on the frontpage.
if ($PAGE->pagelayout == 'frontpage') {
    require_once($CFG->dirroot . '/theme/boost_union/layout/includes/advertisementtiles.php');
}

// Include the template content for the slider, but only if we are on the frontpage.
if ($PAGE->pagelayout == 'frontpage') {
    require_once($CFG->dirroot . '/theme/boost_union/layout/includes/slider.php');
}

// Include the template content for the smart menus.
require_once($CFG->dirroot . '/theme/boost_union/layout/includes/smartmenus.php');

// --- Erasight addition starts here ---
// $DB isn't in scope here the way it is in a normal top-level script: this
// file is include()'d from inside a renderer method, so only the specific
// globals that method itself declares — $CFG, $SITE, $OUTPUT, $PAGE, $USER
// — are already available above without a `global` statement.
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

$templatecontext['herohtml'] = $herohtml;
$templatecontext['landinghtml'] = ''; // Populated in a later rebuild phase — Mustache renders '' as nothing, not an error.
// 'nonavbar' in config.php's $THEME->layouts['frontpage'] does NOT suppress
// the persistent top nav bar — verified against real source (both raw
// Boost's and Boost Union's core_renderer::full_header() usage is
// unchanged): it only sets $header->hasnavbar, a secondary in-page header
// component. hidenavbar is this theme's own real flag, guarding both the
// navbar partial AND output.full_header in templates/frontpage.mustache —
// scoped to this layout only.
$templatecontext['hidenavbar'] = true;
// --- Erasight addition ends here ---

// If we are on MWP.
if (\theme_boost_union\local\mwp::extension_present() == true) {
    // Call the BU MWP class method only if the class and method exist.
    if (
        class_exists('\\local_boost_union_mwp\\local\\layouts') &&
            method_exists('\\local_boost_union_mwp\\local\\layouts', 'postprocess_drawers_templatecontext')
    ) {
        // Post-process the templatecontext array.
        $templatecontext = \local_boost_union_mwp\local\layouts::postprocess_drawers_templatecontext($templatecontext);
    }

    // Render drawers.mustache from local_boost_union_mwp — unchanged from
    // the real file; this site has no MWP extension installed, so this
    // branch never actually fires, kept only for fidelity with the source
    // this was forked from.
    echo $OUTPUT->render_from_template('local_boost_union_mwp/drawers', $templatecontext);

    // Otherwise.
} else {
    // Render OUR OWN template, not the shared 'theme_boost/drawers' Boost
    // Union itself overrides globally — keeps this fork isolated to only
    // the 'frontpage' layout, same reasoning as the earlier raw-Boost fork.
    echo $OUTPUT->render_from_template('theme_erasight/frontpage', $templatecontext);
}
