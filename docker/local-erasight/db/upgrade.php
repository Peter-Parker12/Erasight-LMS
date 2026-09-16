<?php
// Function name/signature and upgrade_plugin_savepoint() usage verified
// against a real core plugin's db/upgrade.php (mod/choice) on
// MOODLE_405_STABLE before writing this — this is Moodle's standard,
// version-gated migration hook, run automatically on every upgrade
// (admin/cli/upgrade.php, or the web upgrade screen), including on an
// already-installed site — unlike db/install.php, which only runs once.
defined('MOODLE_INTERNAL') || die();

function xmldb_local_erasight_upgrade($oldversion) {
    if ($oldversion < 2026091700) {
        // Provisions the real, admin-editable course custom fields backing
        // the Course Details page's "What you'll learn"/"Requirements"/
        // "FAQ" sections (see local_erasight_get_course_customfields() in
        // lib.php) — Moodle has no native course fields for any of these,
        // so this is the correct, real mechanism (Site administration ->
        // Courses -> Custom fields) rather than inventing new storage.
        // Idempotent: checks by name/shortname before creating anything,
        // safe to run again on an existing site that already has these.
        $handler = \core_course\customfield\course_handler::create();
        $category = null;
        foreach (\core_customfield\api::get_categories_with_fields('core_course', 'course', 0) as $existing) {
            if ($existing->get('name') === 'Erasight storefront') {
                $category = $existing;
                break;
            }
        }
        if (!$category) {
            $category = \core_customfield\category_controller::create(0, (object) [
                'name' => 'Erasight storefront',
            ], $handler);
            \core_customfield\api::save_category($category);
        }

        $existingshortnames = [];
        foreach ($category->get_fields() as $field) {
            $existingshortnames[$field->get('shortname')] = true;
        }

        $newfields = [
            'erasight_learn' => 'What you\'ll learn',
            'erasight_requirements' => 'Requirements',
            'erasight_faq' => 'FAQ',
        ];
        foreach ($newfields as $shortname => $name) {
            if (!empty($existingshortnames[$shortname])) {
                continue;
            }
            $field = \core_customfield\field_controller::create(0, (object) [
                'categoryid' => $category->get('id'),
                'type' => 'textarea',
                'shortname' => $shortname,
                'name' => $name,
            ], $category);
            \core_customfield\api::save_field_configuration($field);
        }

        upgrade_plugin_savepoint(true, 2026091700, 'local', 'erasight');
    }

    return true;
}
