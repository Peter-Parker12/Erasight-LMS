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

    // Registered against core\hook\output\after_standard_main_region_html_generation
    // via db/hooks.php — deliberately NOT before_standard_footer_html_generation,
    // which was tried first and confirmed live to render invisibly: Boost
    // Union's own templates/theme_boost/footer.mustache wraps
    // {{{ output.standard_footer_html }}} inside
    // <div class="footer-content-popover">, a panel hidden by default and
    // only shown when a visitor clicks the small "?" button — so that
    // hook's HTML was real and present in the DOM (confirmed via curl) but
    // never visible without that click. after_standard_main_region_html,
    // by contrast, is called unconditionally in both Boost Union's raw
    // drawers.mustache and this theme's own forked frontpage.mustache
    // (verified against the real
    // public/lib/classes/output/core_renderer.php::standard_after_main_region_html()
    // dispatch on MOODLE_502_STABLE), right after the real <footer> element,
    // with nothing collapsing it.
    public static function after_standard_main_region_html_generation(
        \core\hook\output\after_standard_main_region_html_generation $hook
    ): void {
        global $CFG;

        // No dedicated "contact us" flow exists yet — same mailto-or-catalog
        // fallback already used for the front page's team-pricing CTA.
        $contacturl = !empty($CFG->supportemail)
            ? 'mailto:' . $CFG->supportemail
            : (new \moodle_url('/local/erasight/catalog.php'))->out(false);

        $links = [
            (object) [
                'label' => get_string('footer_link_catalog', 'theme_erasight'),
                'url' => (new \moodle_url('/local/erasight/catalog.php'))->out(false),
            ],
            (object) [
                'label' => get_string('footer_link_login', 'theme_erasight'),
                'url' => (new \moodle_url('/login/index.php'))->out(false),
            ],
            (object) [
                'label' => get_string('footer_link_contact', 'theme_erasight'),
                'url' => $contacturl,
            ],
            // Moodle's own built-in site policies list — real and always
            // present as core, not a fabricated Terms/Privacy page.
            (object) [
                'label' => get_string('footer_link_policies', 'theme_erasight'),
                'url' => (new \moodle_url('/admin/tool/policy/index.php'))->out(false),
            ],
        ];

        // Social URLs come from theme settings (settings.php), empty by
        // default. Falls back to "#" — a real placeholder, never a
        // fabricated profile URL — until an admin fills in a real account.
        $socialkeys = ['linkedin', 'twitter', 'facebook'];
        $socials = [];
        foreach ($socialkeys as $key) {
            $url = get_config('theme_erasight', 'social_' . $key);
            $socials[] = (object) [
                'name' => ucfirst($key),
                'url' => !empty($url) ? $url : '#',
                'iconlinkedin' => $key === 'linkedin',
                'icontwitter' => $key === 'twitter',
                'iconfacebook' => $key === 'facebook',
            ];
        }

        $html = $hook->renderer->render_from_template('theme_erasight/sitefooter', [
            'tagline' => get_string('footer_tagline', 'theme_erasight'),
            'linksheading' => get_string('footer_links_heading', 'theme_erasight'),
            'links' => $links,
            'socialheading' => get_string('footer_social_heading', 'theme_erasight'),
            'hassocial' => !empty($socials),
            'socials' => $socials,
            'copyright' => get_string('footer_copyright', 'theme_erasight', date('Y')),
        ]);

        $hook->add_html($html);
    }
}
