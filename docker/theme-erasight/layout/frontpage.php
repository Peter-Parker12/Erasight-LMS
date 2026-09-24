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
// Redesigned per Sep 2026 brief. All fake data (testimonials, scenarios,
// team pricing, segments, 6-card course grid) removed. Replaced with
// real content: 2 courses, teaching methodology, instructors, FAQ.
global $DB;

// ── Hero (S1) ──────────────────────────────────────────────
if (isloggedin() && !isguestuser()) {
    $heroctaprimaryurl = (new moodle_url('/my/'))->out(false);
    $heroctaprimarylabel = get_string('hero_primary_loggedin', 'theme_erasight');
    $heroctasecondaryurl = (new moodle_url('/local/erasight/catalog.php'))->out(false);
    $heroctasecondarylabel = get_string('hero_secondary_loggedin', 'theme_erasight');
} else {
    $heroctaprimaryurl = '#khoa-hoc';
    $heroctaprimarylabel = get_string('hero_cta_primary', 'theme_erasight');
    $heroctasecondaryurl = (new moodle_url('/login/index.php'))->out(false);
    $heroctasecondarylabel = get_string('hero_cta_secondary', 'theme_erasight');
}

$herohtml = $OUTPUT->render_from_template('theme_erasight/hero', [
    'headline' => get_string('hero_headline', 'theme_erasight'),
    'tagline' => get_string('hero_tagline', 'theme_erasight'),
    'ctaprimaryurl' => $heroctaprimaryurl,
    'ctaprimarylabel' => $heroctaprimarylabel,
    'ctasecondaryurl' => $heroctasecondaryurl,
    'ctasecondarylabel' => $heroctasecondarylabel,
]);
$templatecontext['herohtml'] = $herohtml;

// ── Course Cards (S2) — hardcoded per brief, 2 courses ────
$courses = [
    (object) [
        'badge' => get_string('course_ai_badge', 'theme_erasight'),
        'badgeclass' => 'erasight-badge-ai',
        'name' => get_string('course_ai_name', 'theme_erasight'),
        'result' => get_string('course_ai_result', 'theme_erasight'),
        'bullets' => [
            (object) ['text' => get_string('course_ai_bullet1', 'theme_erasight')],
            (object) ['text' => get_string('course_ai_bullet2', 'theme_erasight')],
            (object) ['text' => get_string('course_ai_bullet3', 'theme_erasight')],
        ],
        'price' => get_string('course_ai_price', 'theme_erasight'),
        'enrolldate' => get_string('course_enroll_date_placeholder', 'theme_erasight'),
        'image' => (new moodle_url('/theme/erasight/pix/course-ai-marketing.jpg'))->out(false),
        'detailurl' => (new moodle_url('/local/erasight/catalog.php'))->out(false),
        'cta' => get_string('course_ai_cta', 'theme_erasight'),
    ],
    (object) [
        'badge' => get_string('course_en_badge', 'theme_erasight'),
        'badgeclass' => 'erasight-badge-en',
        'name' => get_string('course_en_name', 'theme_erasight'),
        'result' => get_string('course_en_result', 'theme_erasight'),
        'bullets' => [
            (object) ['text' => get_string('course_en_bullet1', 'theme_erasight')],
            (object) ['text' => get_string('course_en_bullet2', 'theme_erasight')],
            (object) ['text' => get_string('course_en_bullet3', 'theme_erasight')],
        ],
        'price' => get_string('course_en_price', 'theme_erasight'),
        'enrolldate' => get_string('course_enroll_date_placeholder', 'theme_erasight'),
        'image' => (new moodle_url('/theme/erasight/pix/course-english.jpg'))->out(false),
        'detailurl' => (new moodle_url('/local/erasight/catalog.php'))->out(false),
        'cta' => get_string('course_en_cta', 'theme_erasight'),
    ],
];

// ── Teaching Methodology (S3) ──────────────────────────────
$methods = [
    (object) [
        'step' => '01',
        'title' => get_string('method1_title', 'theme_erasight'),
        'body' => get_string('method1_body', 'theme_erasight'),
        'image' => (new moodle_url('/theme/erasight/pix/method-live-class.jpg'))->out(false),
    ],
    (object) [
        'step' => '02',
        'title' => get_string('method2_title', 'theme_erasight'),
        'body' => get_string('method2_body', 'theme_erasight'),
        'image' => (new moodle_url('/theme/erasight/pix/method-real-product.jpg'))->out(false),
    ],
    (object) [
        'step' => '03',
        'title' => get_string('method3_title', 'theme_erasight'),
        'body' => get_string('method3_body', 'theme_erasight'),
        'image' => (new moodle_url('/theme/erasight/pix/method-mentorship.jpg'))->out(false),
    ],
];

// ── Instructors (S5) ───────────────────────────────────────
$instructors = [
    (object) [
        'name' => get_string('instructor_ai_name', 'theme_erasight'),
        'role' => get_string('instructor_ai_role', 'theme_erasight'),
        'bio' => get_string('instructor_ai_bio', 'theme_erasight'),
        'photo' => (new moodle_url('/theme/erasight/pix/instructor-tien.jpg'))->out(false),
    ],
    (object) [
        'name' => get_string('instructor_en_name', 'theme_erasight'),
        'role' => get_string('instructor_en_role', 'theme_erasight'),
        'bio' => get_string('instructor_en_bio', 'theme_erasight'),
        'photo' => (new moodle_url('/theme/erasight/pix/instructor-quan.jpg'))->out(false),
    ],
];

// ── FAQ (S6) ───────────────────────────────────────────────
$faqs = [];
for ($i = 1; $i <= 6; $i++) {
    $faqs[] = (object) [
        'question' => get_string("faq{$i}_q", 'theme_erasight'),
        'answer' => get_string("faq{$i}_a", 'theme_erasight'),
        'first' => ($i === 1),
    ];
}

// ── Closing CTA (S7) ──────────────────────────────────────
$closingctaurl = (new moodle_url('/local/erasight/catalog.php'))->out(false);

$landinghtml = $OUTPUT->render_from_template('theme_erasight/landing', [
    'courses' => $courses,
    'hascourses' => !empty($courses),
    'methodtitle' => get_string('method_title', 'theme_erasight'),
    'methods' => $methods,
    'hasmethods' => !empty($methods),
    'instructorstitle' => get_string('instructors_title', 'theme_erasight'),
    'instructors' => $instructors,
    'hasinstructors' => !empty($instructors),
    'faqtitle' => get_string('faq_title', 'theme_erasight'),
    'faqs' => $faqs,
    'hasfaq' => !empty($faqs),
    'closingheadline' => get_string('closing_headline', 'theme_erasight'),
    'closingctalabel' => get_string('closing_cta', 'theme_erasight'),
    'closingctaurl' => $closingctaurl,
]);

$templatecontext['landinghtml'] = $landinghtml;
$templatecontext['hidenavbar'] = false;
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
