<?php
// Delegates to theme_boost's own SCSS callbacks (verified in theme/boost/lib.php
// on MOODLE_405_STABLE) and appends our own partials on top — the documented
// way to extend a parent theme's SCSS pipeline without touching boost itself.
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/theme/boost/lib.php');

function theme_erasight_get_main_scss_content($theme) {
    return theme_boost_get_main_scss_content($theme);
}

function theme_erasight_get_pre_scss($theme) {
    global $CFG;
    $scss = theme_boost_get_pre_scss($theme);
    $scss .= file_get_contents($CFG->dirroot . '/theme/erasight/scss/pre.scss');
    return $scss;
}

function theme_erasight_get_extra_scss($theme) {
    global $CFG;
    $scss = theme_boost_get_extra_scss($theme);
    $scss .= file_get_contents($CFG->dirroot . '/theme/erasight/scss/post.scss');
    return $scss;
}
