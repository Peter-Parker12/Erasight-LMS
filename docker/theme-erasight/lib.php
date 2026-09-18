<?php
// Delegates to theme_boost_union's own SCSS callbacks (function names
// verified fresh against theme/boost_union/lib.php on MOODLE_502_STABLE:
// theme_boost_union_get_main_scss_content/_get_pre_scss/_get_extra_scss)
// and appends our own partials on top — the same pattern the real
// boost_union_child boilerplate uses (fetched and read in full before
// writing this), adapted since our SCSS itself doesn't depend on any
// Boost-Union-specific settings the way the boilerplate's inheritance
// toggle exists to guard against.
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/theme/boost_union/lib.php');

function theme_erasight_get_main_scss_content($theme) {
    global $CFG;

    // As a start, get the compiled main SCSS from Boost Union — this way
    // this theme ships the same base SCSS Boost Union itself does.
    $scss = theme_boost_union_get_main_scss_content(\core\output\theme_config::load('boost_union'));

    return $scss;
}

// Both pre.scss and post.scss branch on a plain Sass boolean, $erasight-dark,
// prepended here rather than read from inside those files — keeps the
// theme_erasight/colorscheme setting lookup in exactly one place.
function theme_erasight_is_dark($theme) {
    return isset($theme->settings->colorscheme) && $theme->settings->colorscheme === 'dark';
}

function theme_erasight_get_pre_scss($theme) {
    global $CFG;

    // Deliberately does NOT explicitly re-call theme_boost_union_get_pre_scss()
    // here — confirmed against lib/classes/output/theme_config.php this
    // session (get_pre_scss_code() walks $this->parent_configs and calls
    // every parent's own prescsscallback automatically) that Moodle already
    // includes Boost Union's pre-SCSS via the normal parent-chain mechanism
    // once $THEME->parents = ['boost_union', 'boost'] is set — calling it
    // again here would double-include it. The real boost_union_child
    // boilerplate DOES re-call it explicitly, but only as an opt-in
    // workaround for a specific edge case (Boost Union reading
    // $theme->settings and getting this theme's settings instead of its
    // own if invoked via the automatic chain) — not something to defend
    // against from day one without evidence this theme actually hits it.
    $scss = '$erasight-dark: ' . (theme_erasight_is_dark($theme) ? 'true' : 'false') . ";\n";
    $scss .= file_get_contents($CFG->dirroot . '/theme/erasight/scss/pre.scss');
    return $scss;
}

function theme_erasight_get_extra_scss($theme) {
    global $CFG;

    // Same reasoning as theme_erasight_get_pre_scss() above — Boost
    // Union's own extra-SCSS is already included via Moodle's automatic
    // parent-chain walk, not re-called explicitly here.
    $scss = '$erasight-dark: ' . (theme_erasight_is_dark($theme) ? 'true' : 'false') . ";\n";
    $scss .= file_get_contents($CFG->dirroot . '/theme/erasight/scss/post.scss');
    return $scss;
}

// Google Fonts <link> tags, sitewide (not just the front page).
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
