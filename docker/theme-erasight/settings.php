<?php
// Structure verified against theme/boost/settings.php on MOODLE_405_STABLE
// (the $ADMIN->fulltree guard, admin_settingpage, set_updatedcallback
// pattern) — simplified to a single admin_settingpage rather than Boost's
// tabbed theme_boost_admin_settingspage_tabs, since one setting doesn't
// need tabs.
defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {
    $settings = new admin_settingpage('theme_erasight', get_string('configtitle', 'theme_erasight'));

    $name = 'theme_erasight/colorscheme';
    $title = get_string('colorscheme', 'theme_erasight');
    $description = get_string('colorscheme_desc', 'theme_erasight');
    $default = 'dark';
    $choices = [
        'light' => get_string('colorscheme_light', 'theme_erasight'),
        'dark' => get_string('colorscheme_dark', 'theme_erasight'),
    ];

    $setting = new admin_setting_configselect($name, $title, $description, $default, $choices);
    // Without this, a saved change wouldn't reliably force Moodle to
    // recompile the theme's cached SCSS — same callback Boost's own preset
    // setting uses for the same reason.
    $setting->set_updatedcallback('theme_reset_all_caches');
    $settings->add($setting);
}
