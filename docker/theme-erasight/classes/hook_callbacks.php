<?php
namespace theme_erasight;

// Registered against core\hook\output\before_standard_head_html_generation
// via db/hooks.php — the real, non-deprecated Moodle 4.4+ hook API,
// verified against lib/classes/hook/output/before_standard_head_html_generation.php
// on MOODLE_502_STABLE. This is the sitewide mechanism for the Google
// Fonts <link> tags — see the long comment in lib.php for why this is a
// <link> tag and not an SCSS @import.
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
