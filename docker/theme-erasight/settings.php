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
}
