<?php
defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2026082600;
// Matches MOODLE_405_STABLE's own version.php base (2024100713.01, i.e. the
// 4.5 branch date) — the lower bound this theme was actually built against.
$plugin->requires  = 2024100700;
$plugin->component = 'theme_erasight';
$plugin->maturity  = MATURITY_STABLE;
