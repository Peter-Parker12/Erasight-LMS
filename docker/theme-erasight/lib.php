<?php
// Delegates to theme_boost's own SCSS callbacks (verified in theme/boost/lib.php
// on MOODLE_405_STABLE) and appends our own partials on top — the documented
// way to extend a parent theme's SCSS pipeline without touching boost itself.
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/theme/boost/lib.php');

function theme_erasight_get_main_scss_content($theme) {
    return theme_boost_get_main_scss_content($theme);
}

// Both pre.scss and post.scss branch on a plain Sass boolean, $erasight-dark,
// prepended here rather than read from inside those files — keeps the
// theme_erasight/colorscheme setting lookup in exactly one place.
function theme_erasight_is_dark($theme) {
    return isset($theme->settings->colorscheme) && $theme->settings->colorscheme === 'dark';
}

function theme_erasight_get_pre_scss($theme) {
    global $CFG;
    $scss = theme_boost_get_pre_scss($theme);
    $scss .= '$erasight-dark: ' . (theme_erasight_is_dark($theme) ? 'true' : 'false') . ";\n";
    $scss .= file_get_contents($CFG->dirroot . '/theme/erasight/scss/pre.scss');
    return $scss;
}

function theme_erasight_get_extra_scss($theme) {
    global $CFG;
    $scss = theme_boost_get_extra_scss($theme);
    $scss .= '$erasight-dark: ' . (theme_erasight_is_dark($theme) ? 'true' : 'false') . ";\n";
    $scss .= file_get_contents($CFG->dirroot . '/theme/erasight/scss/post.scss');
    return $scss;
}

// The legacy plugin callback Moodle's before_standard_head_html_generation
// hook bridges for backward compatibility (confirmed via
// lib/classes/hook/output/before_standard_head_html_generation.php on
// MOODLE_405_STABLE: #[replaces_callbacks('before_standard_html_head')],
// discovered via get_plugins_with_function() and called with zero
// arguments, its return value appended into every page's <head>,
// regardless of layout). This is the real, correct place for the Google
// Fonts <link> that used to be an SCSS @import — see the long comment in
// scss/post.scss for why that broke this theme's entire custom CSS in
// production.
function theme_erasight_before_standard_html_head() {
    return '<link rel="preconnect" href="https://fonts.googleapis.com">'
        . '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        . '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">';
}
