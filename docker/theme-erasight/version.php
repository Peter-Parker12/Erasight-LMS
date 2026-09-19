<?php
defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2026091806;
// Deployed/tested against MOODLE_502_STABLE (real base version confirmed:
// 2026042003.01), but $plugin->requires stays at the 4.5 baseline since
// this theme uses no 5.x-exclusive Moodle-core API (the SCSS callback
// mechanism and the core\hook\output hook API are both 4.4+) — this is a
// real minimum, not the version it happens to be built against.
$plugin->requires  = 2024100700;
$plugin->component = 'theme_erasight';
$plugin->maturity  = MATURITY_STABLE;
// Real dependency, not optional — config.php does require() (not merely
// reference) theme/boost_union/config.php directly, so this theme fatals
// without it. Version number is Boost Union's own real $plugin->version on
// the exact MOODLE_502_STABLE branch commit this theme was rebased
// against, matching the pattern the official boost_union_child boilerplate
// itself uses (its README explicitly recommends pinning to the tested
// version rather than leaving this unset).
$plugin->dependencies = ['theme_boost_union' => 2026042013];
