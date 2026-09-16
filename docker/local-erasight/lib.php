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

// Single source of truth for "what does this course cost" — used by
// catalog.php, course.php, and theme_erasight's front-page course grid.
// Deliberately lives here rather than in theme_erasight/lib.php: a theme's
// lib.php functions are only reliably loaded when that theme is the active
// one, and the site's active theme is now admin-switchable (see the
// theme_erasight color-scheme/theme-selector work) — a local plugin's
// lib.php has no such dependency, it's loaded regardless of theme choice.
//
// Returns null (not a fatal error) when the course has no enrol_fee
// instance yet, which is expected while courses are being rolled over to
// paid enrolment one at a time. enrol_get_instances() and
// \core_payment\helper::get_cost_as_string() both verified against real
// source (lib/enrollib.php, payment/classes/helper.php) on MOODLE_405_STABLE
// before use here.
// Real uploaded "Course image" (Site administration -> course settings ->
// Course image) if one exists, falling back to Moodle's own generated
// pattern placeholder otherwise — exactly the "configure it in the LMS, or
// get a placeholder to replace later" the user asked for, with no new
// upload path needed since Moodle already has one.
//
// Deliberately does NOT use \core_course\external\course_summary_exporter::
// get_course_image() (a cache-backed static method whose population
// mechanism wasn't verified) — builds the URL directly from the real
// stored_file via get_area_files() + moodle_url::make_pluginfile_url(),
// both stable, well-documented APIs, matching catalog.php's own established
// preference for plain verified APIs over the exporter classes.
function local_erasight_get_course_image($courseid, $renderer) {
    global $CFG;
    if (!empty($CFG->courseoverviewfileslimit)) {
        $fs = get_file_storage();
        $context = context_course::instance($courseid);
        $files = $fs->get_area_files($context->id, 'course', 'overviewfiles', false, 'filename', false);
        foreach ($files as $file) {
            if ($file->is_directory()) {
                continue;
            }
            return moodle_url::make_pluginfile_url(
                $file->get_contextid(),
                $file->get_component(),
                $file->get_filearea(),
                $file->get_itemid(),
                $file->get_filepath(),
                $file->get_filename()
            )->out();
        }
    }
    return $renderer->get_generated_image_for_id($courseid);
}

function local_erasight_get_course_price($courseid) {
    $instances = enrol_get_instances($courseid, true);
    foreach ($instances as $instance) {
        if ($instance->enrol !== 'fee') {
            continue;
        }
        if ((float) $instance->cost <= 0 || empty($instance->currency)) {
            continue;
        }
        return (object) [
            'cost' => (float) $instance->cost,
            'currency' => $instance->currency,
            'formatted' => \core_payment\helper::get_cost_as_string((float) $instance->cost, $instance->currency),
            // Real per-instance setting (Enrolment methods -> Fee -> Enrolment
            // duration), not a marketing claim — 0 genuinely means Moodle will
            // never unenrol the student for time, i.e. real lifetime access.
            'enrolperiod' => (int) $instance->enrolperiod,
        ];
    }
    return null;
}

// Course custom fields (Site administration -> Courses -> Custom fields,
// provisioned automatically for this site by db/upgrade.php below) — the
// real, admin-editable mechanism for "What you'll learn"/"Requirements"/
// "FAQ" style content the storefront's reference design shows, since none
// of that has a native Moodle course field. Returns only fields an admin
// has actually filled in for this course (shortname => formatted HTML),
// so a page section can be omitted entirely rather than shown empty.
function local_erasight_get_course_customfields($courseid) {
    $handler = \core_course\customfield\course_handler::create();
    $fields = $handler->get_fields();
    if (empty($fields)) {
        return [];
    }
    $datas = \core_customfield\api::get_instance_fields_data($fields, $courseid);
    $result = [];
    foreach ($datas as $data) {
        $value = $data->export_value();
        if ($value === null || $value === '') {
            continue;
        }
        $result[$data->get_field()->get('shortname')] = $value;
    }
    return $result;
}
