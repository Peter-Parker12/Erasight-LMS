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

// $THEME->layouts (frontpage/mydashboard/mycourses overrides) intentionally
// NOT added yet — rebuild Phase 1/2 checkpoint deploys with Boost's own
// default layouts still in effect, so there's nothing here referencing
// layout/*.php files that don't exist yet (Phase 3/5 add them, and this
// override, back). Deploying with a layout override pointing at a
// non-existent file would fatal the front page.
