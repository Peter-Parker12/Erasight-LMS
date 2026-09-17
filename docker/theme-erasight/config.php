<?php
// Erasight theme — a child of Boost. Rebuilt from scratch on MOODLE_502_STABLE
// (5.2), verified against the real theme/boost/config.php on that exact
// branch rather than reused from the earlier 4.5-era build — Boost's own
// drawers.php/drawers.mustache genuinely changed between 4.5 and 5.2
// (Bootstrap 5's data-bs-* attributes, a renamed core/tertiary_navigation_selector
// partial, new coursefullname/courseurl context fields), so anything forked
// from the old files would have carried that drift silently. Never edits
// theme/boost itself (re-cloned from upstream on every image build), only
// extends it via the callbacks below.
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

// Overrides ONLY the 'frontpage' layout key for now (rebuild Phase 3) —
// mydashboard/mycourses come back in Phase 5, once their layout files
// exist; every other layout key ('course', 'admin', 'standard', 'login',
// etc.) cascades straight from Boost's own $THEME->layouts, confirmed
// unchanged by this rebuild. Regions/options copied verbatim from Boost's
// real 5.2 config.php — only 'file' differs, since that file is what
// renders the hero (and, once Phase 4 lands, the landing/storefront
// content below it).
$THEME->layouts = [
    'frontpage' => [
        'file' => 'frontpage.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
        'options' => ['nonavbar' => true],
    ],
];
