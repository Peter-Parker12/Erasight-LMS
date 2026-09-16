<?php
defined('MOODLE_INTERNAL') || die();

// Format verified against lib/db/hooks.php on MOODLE_405_STABLE.
$callbacks = [
    [
        'hook' => \core\hook\output\before_standard_head_html_generation::class,
        'callback' => \theme_erasight\hook_callbacks::class . '::before_standard_head_html_generation',
    ],
];
