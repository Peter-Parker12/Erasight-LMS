<?php
defined('MOODLE_INTERNAL') || die();

// Format verified against public/lib/db/hooks.php on MOODLE_502_STABLE
// (moved under public/ along with the rest of core — see README/AGENTS.md
// for the webroot restructuring this repo already accounts for).
$callbacks = [
    [
        'hook' => \core\hook\output\before_standard_head_html_generation::class,
        'callback' => \theme_erasight\hook_callbacks::class . '::before_standard_head_html_generation',
    ],
    [
        'hook' => \core\hook\output\before_standard_footer_html_generation::class,
        'callback' => \theme_erasight\hook_callbacks::class . '::before_standard_footer_html_generation',
    ],
];
