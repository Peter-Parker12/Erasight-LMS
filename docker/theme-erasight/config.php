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

// Overrides ONLY the 'frontpage' layout — verified against
// lib/classes/output/theme_config.php (the constructor cascades every OTHER
// layout key straight from the parent when a child theme doesn't define it,
// lines ~552-563), so 'course'/'admin'/'standard'/'mydashboard'/etc. are
// untouched and still come from Boost exactly as before. Same regions/
// options as Boost's own 'frontpage' entry — only 'file' differs, since that
// file is what actually renders the hero banner (see layout/frontpage.php).
$THEME->layouts = [
    'frontpage' => [
        'file' => 'frontpage.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
        'options' => ['nonavbar' => true],
    ],
];
