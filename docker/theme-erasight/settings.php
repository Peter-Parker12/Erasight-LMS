<?php
// Signature verified fresh against admin_setting_configselect's real
// constructor in lib/adminlib.php on MOODLE_502_STABLE:
// ($name, $visiblename, $description, $defaultsetting, $choices).
defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {
    $settings = new theme_boost_admin_settingspage_tabs('themesettingerasight', get_string('configtitle', 'theme_erasight'));

    $general = new admin_settingpage('theme_erasight_general', get_string('generalsettings', 'theme_boost'));

    $general->add(new admin_setting_configselect(
        'theme_erasight/colorscheme',
        get_string('colorscheme', 'theme_erasight'),
        get_string('colorscheme_desc', 'theme_erasight'),
        'dark',
        [
            'light' => get_string('colorscheme_light', 'theme_erasight'),
            'dark' => get_string('colorscheme_dark', 'theme_erasight'),
        ]
    ));

    $settings->add($general);

    // Social links are optional and empty by default — the footer still
    // renders the icons with a "#" placeholder href when unset (real
    // accounts don't exist yet), rather than ever hardcoding a fabricated
    // profile URL. Fill these in via this settings page once real
    // accounts exist, no code change needed.
    $footer = new admin_settingpage('theme_erasight_footer', get_string('footersettings', 'theme_erasight'));

    $footer->add(new admin_setting_configtext(
        'theme_erasight/social_linkedin',
        get_string('social_linkedin', 'theme_erasight'),
        get_string('social_linkedin_desc', 'theme_erasight'),
        '',
        PARAM_URL
    ));

    $footer->add(new admin_setting_configtext(
        'theme_erasight/social_twitter',
        get_string('social_twitter', 'theme_erasight'),
        get_string('social_twitter_desc', 'theme_erasight'),
        '',
        PARAM_URL
    ));

    $footer->add(new admin_setting_configtext(
        'theme_erasight/social_facebook',
        get_string('social_facebook', 'theme_erasight'),
        get_string('social_facebook_desc', 'theme_erasight'),
        '',
        PARAM_URL
    ));

    $settings->add($footer);
}
