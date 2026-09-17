<?php
// Delegates to theme_boost's own SCSS callbacks (verified fresh against
// theme/boost/lib.php on MOODLE_502_STABLE — same function names/signatures
// as before) and appends our own partials on top — the documented way to
// extend a parent theme's SCSS pipeline without touching boost itself.
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

// Google Fonts <link> tags, sitewide (not just the 3 forked layouts).
// Deliberately NOT an SCSS @import — a remote-URL @import compiles fine
// under dart-sass locally but broke this exact theme's entire compiled CSS
// in production once already: Moodle's bundled scssphp compiler tries to
// resolve it as a local partial file, throws "file not found for @import",
// and that exception is swallowed silently inside
// theme_config::get_css_content_from_scss()'s own try/catch, so the whole
// extra-SCSS block (every custom style) got discarded with zero visible
// error unless you go looking with debug raised. Registered via the real,
// non-deprecated Moodle 4.4+ hook API (classes/hook_callbacks.php +
// db/hooks.php) rather than the older <component>_before_standard_html_head()
// lib.php callback, which still works (Moodle bridges it automatically) but
// logs a deprecation notice once debug is turned up.