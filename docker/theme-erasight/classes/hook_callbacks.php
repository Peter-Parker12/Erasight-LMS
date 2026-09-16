<?php
namespace theme_erasight;

// Registered against core\hook\output\before_standard_head_html_generation
// via db/hooks.php — the current (Moodle 4.4+) hook API, verified against
// lib/classes/hook/output/before_standard_head_html_generation.php on
// MOODLE_405_STABLE. Replaces the older theme_erasight_before_standard_html_head()
// legacy callback lib.php used to define: that style still works (Moodle
// bridges it automatically via process_legacy_callbacks()), but logs a
// deprecation notice on every page once debug is turned up, and there is
// no reason to keep using the deprecated form for new code.
class hook_callbacks {
    public static function before_standard_head_html_generation(
        \core\hook\output\before_standard_head_html_generation $hook
    ): void {
        $hook->add_html(
            '<link rel="preconnect" href="https://fonts.googleapis.com">'
            . '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            . '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">'
        );
    }
}
