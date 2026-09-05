<?php
// Erasight theme — a child of Boost, per Moodle's documented child-theme
// pattern. Never edits theme/boost itself (that's re-cloned from upstream on
// every image build), only extends it via the callbacks below.
//
// Verified against theme/boost/config.php and lib.php on the MOODLE_405_STABLE
// branch (github.com/moodle/moodle) rather than assumed — see AGENTS.md for
// why that matters in this repo.
defined('MOODLE_INTERNAL') || die();

$THEME->name = 'erasight';
$THEME->parents = ['boost'];

$THEME->sheets = [];
$THEME->editor_sheets = [];

$THEME->scss = function($theme) {
    return theme_erasight_get_main_scss_content($theme);
};
$THEME->prescsscallback = 'theme_erasight_get_pre_scss';
$THEME->extrascsscallback = 'theme_erasight_get_extra_scss';

$THEME->iconsystem = \core\output\icon_system::FONTAWESOME;
$THEME->haseditswitch = true;
$THEME->usescourseindex = true;
$THEME->rendererfactory = 'theme_overridden_renderer_factory';

// Enables settings.php, which defines the light/dark color-scheme setting
// lib.php's SCSS callbacks read (theme_erasight_is_dark()).
$THEME->hassettings = true;

// Overrides ONLY these three layout keys — verified against
// lib/classes/output/theme_config.php (the constructor cascades every OTHER
// layout key straight from the parent when a child theme doesn't define it,
// lines ~552-563), so 'course'/'admin'/'standard'/'login'/etc. are untouched
// and still come from Boost exactly as before. Regions/options below are
// copied verbatim from Boost's own entries (theme/boost/config.php) — only
// 'file' differs, since that file is what renders the welcome banner (see
// layout/frontpage.php, layout/mydashboard.php, layout/mycourses.php).
$THEME->layouts = [
    'frontpage' => [
        'file' => 'frontpage.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
        'options' => ['nonavbar' => true],
    ],
    'mydashboard' => [
        'file' => 'mydashboard.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
        'options' => ['nonavbar' => true, 'langmenu' => true],
    ],
    'mycourses' => [
        'file' => 'mycourses.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
        'options' => ['nonavbar' => true],
    ],
];
