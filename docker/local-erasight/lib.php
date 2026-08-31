<?php
// Hook name and $navigation->add() signature verified against
// lib/navigationlib.php on MOODLE_405_STABLE (load_local_plugin_navigation()
// calls get_plugin_list_with_function('local', 'extend_navigation')).
defined('MOODLE_INTERNAL') || die();

function local_erasight_extend_navigation(global_navigation $navigation) {
    if (!isloggedin() || isguestuser()) {
        return;
    }
    $navigation->add(
        get_string('catalog', 'local_erasight'),
        new moodle_url('/local/erasight/catalog.php')
    );

    if (has_capability('moodle/site:config', context_system::instance())) {
        $navigation->add(
            get_string('adminhome', 'local_erasight'),
            new moodle_url('/local/erasight/adminhome.php')
        );
    }
}

// Hook name confirmed via lib/navigationlib.php: settings_navigation's
// load_local_plugin_settings() calls
// get_plugin_list_with_function('local', 'extend_settings_navigation').
// Purely additive — never touches admin_category/admin_settingpage
// registration, so there is no way for this to change what any admin page
// actually does, only what shows up as a shortcut to it.
function local_erasight_extend_settings_navigation(settings_navigation $settingsnav, context $context) {
    // load_administration_settings() only builds this 'root' TYPE_SITE_ADMIN
    // node when the full admin tree is loaded (confirmed: lib/navigationlib.php
    // line ~4714). On an ordinary course/module page it won't exist yet —
    // nothing to attach a shortcut panel to, so just do nothing there.
    $adminroot = $settingsnav->find('root', navigation_node::TYPE_SITE_ADMIN);
    if (!$adminroot) {
        return;
    }

    $quicklinks = $adminroot->add(
        get_string('quicklinks', 'local_erasight'),
        null,
        navigation_node::TYPE_SETTING,
        null,
        'erasight_quicklinks'
    );

    // [admin-tree key to check, lang string id, destination, pix icon].
    // Keys verified as real, registered admin-tree nodes in
    // admin/settings/{courses,users,plugins}.php on MOODLE_405_STABLE.
    $targets = [
        ['coursemgmt', 'quicklink_coursemgmt', new moodle_url('/course/management.php'), 'i/course'],
        ['editusers', 'quicklink_editusers', new moodle_url('/admin/user.php'), 'i/user'],
        ['cohorts', 'quicklink_cohorts', new moodle_url('/cohort/index.php'), 'i/cohort'],
        ['manageenrols', 'quicklink_manageenrols', new moodle_url('/admin/settings.php', ['section' => 'manageenrols']), 'i/enrolusers'],
    ];

    $added = 0;
    foreach ($targets as [$key, $stringid, $url, $icon]) {
        // Only show a shortcut if the real entry is actually in this user's
        // (capability-filtered) tree — a shortcut can never point somewhere
        // the long way round wouldn't already let them go.
        if (!$adminroot->find($key, navigation_node::TYPE_SETTING)) {
            continue;
        }
        $quicklinks->add(
            get_string($stringid, 'local_erasight'),
            $url,
            navigation_node::TYPE_SETTING,
            null,
            'erasight_' . $key,
            new pix_icon($icon, '')
        );
        $added++;
    }

    if ($added === 0) {
        $quicklinks->remove();
    }
}
