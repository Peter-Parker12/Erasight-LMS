<?php
namespace theme_erasight;

// Registered against core\hook\output\before_standard_head_html_generation
// via db/hooks.php — the real, non-deprecated Moodle 4.4+ hook API.
// Google Fonts <link> tags — Be Vietnam Pro (body, Vietnamese-optimized),
// Bricolage Grotesque (display headings), JetBrains Mono (prices/codes).
class hook_callbacks {
    public static function before_standard_head_html_generation(
        \core\hook\output\before_standard_head_html_generation $hook
    ): void {
        $hook->add_html(
            '<link rel="preconnect" href="https://fonts.googleapis.com">'
            . '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            . '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Bricolage+Grotesque:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">'
        );
    }

    // Sitewide footer — injected via after_standard_main_region_html hook.
    // 4-column layout: Khoá học · Về Erasight · Hỗ trợ · Liên hệ
    // Plus legal info line at the bottom per Vietnamese e-commerce law.
    public static function after_standard_main_region_html_generation(
        \core\hook\output\after_standard_main_region_html_generation $hook
    ): void {
        global $CFG;

        $contacturl = !empty($CFG->supportemail)
            ? 'mailto:' . $CFG->supportemail
            : (new \moodle_url('/local/erasight/catalog.php'))->out(false);

        // Column 1: Khoá học
        $courseslinks = [
            (object) [
                'label' => get_string('footer_course_ai', 'theme_erasight'),
                'url' => (new \moodle_url('/local/erasight/catalog.php'))->out(false),
            ],
            (object) [
                'label' => get_string('footer_course_english', 'theme_erasight'),
                'url' => (new \moodle_url('/local/erasight/catalog.php'))->out(false),
            ],
        ];

        // Column 2: Về Erasight
        $aboutlinks = [
            (object) [
                'label' => get_string('footer_about_instructors', 'theme_erasight'),
                'url' => '#giang-vien',
            ],
            (object) [
                'label' => get_string('footer_about_method', 'theme_erasight'),
                'url' => '#cach-day',
            ],
        ];

        // Column 3: Hỗ trợ
        $supportlinks = [
            (object) [
                'label' => get_string('footer_support_faq', 'theme_erasight'),
                'url' => '#hoi-dap',
            ],
            (object) [
                'label' => get_string('footer_link_contact', 'theme_erasight'),
                'url' => $contacturl,
            ],
            (object) [
                'label' => get_string('footer_link_policies', 'theme_erasight'),
                'url' => (new \moodle_url('/admin/tool/policy/index.php'))->out(false),
            ],
        ];

        // Social URLs from theme settings.
        $socialkeys = ['facebook', 'linkedin', 'twitter'];
        $socials = [];
        foreach ($socialkeys as $key) {
            $url = get_config('theme_erasight', 'social_' . $key);
            if (!empty($url)) {
                $socials[] = (object) [
                    'name' => ucfirst($key),
                    'url' => $url,
                    'iconlinkedin' => $key === 'linkedin',
                    'icontwitter' => $key === 'twitter',
                    'iconfacebook' => $key === 'facebook',
                ];
            }
        }

        $logourl = (new \moodle_url('/theme/erasight/pix/erasight-logo-header.png'))->out(false);
        $homeurl = (new \moodle_url('/'))->out(false);

        $html = $hook->renderer->render_from_template('theme_erasight/sitefooter', [
            'logourl' => $logourl,
            'homeurl' => $homeurl,
            'tagline' => get_string('footer_tagline', 'theme_erasight'),
            'coursesheading' => get_string('footer_courses_heading', 'theme_erasight'),
            'courseslinks' => $courseslinks,
            'aboutheading' => get_string('footer_about_heading', 'theme_erasight'),
            'aboutlinks' => $aboutlinks,
            'supportheading' => get_string('footer_support_heading', 'theme_erasight'),
            'supportlinks' => $supportlinks,
            'socialheading' => get_string('footer_social_heading', 'theme_erasight'),
            'hassocial' => !empty($socials),
            'socials' => $socials,
            'legalname' => get_string('footer_legal_name', 'theme_erasight'),
            'legaladdress' => get_string('footer_legal_address', 'theme_erasight'),
            'legalphone' => get_string('footer_legal_phone', 'theme_erasight'),
            'legalemail' => !empty($CFG->supportemail) ? $CFG->supportemail : 'contact@erasight.edu',
            'copyright' => get_string('footer_copyright', 'theme_erasight', date('Y')),
        ]);

        $hook->add_html($html);
    }
}
