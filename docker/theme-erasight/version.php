<?php
defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2026091800;
// Deployed/tested against MOODLE_502_STABLE (real base version confirmed:
// 2026042003.01), but $plugin->requires stays at the 4.5 baseline since
// this theme uses no 5.x-exclusive API (the SCSS callback mechanism and the
// core\hook\output hook API are both 4.4+) — this is a real minimum, not
// the version it happens to be built against.
$plugin->requires  = 2024100700;
$plugin->component = 'theme_erasight';
$plugin->maturity  = MATURITY_STABLE;
