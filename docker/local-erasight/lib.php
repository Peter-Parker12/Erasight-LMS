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
}
