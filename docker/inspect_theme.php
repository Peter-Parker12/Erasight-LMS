<?php
define('CLI_SCRIPT', true);
require('/var/www/html/config.php');
require_once($CFG->libdir . '/clilib.php');

$PAGE->set_url('/');
$theme = theme_config::load('erasight');
cli_writeln("Theme name: " . $theme->name);
$urls = $theme->css_urls($PAGE);
foreach ($urls as $url) {
    cli_writeln("CSS URL: " . $url->out());
}

try {
    cli_writeln("Testing get_css_content...");
    $css = $theme->get_css_content();
    cli_writeln("CSS content length: " . strlen($css));
    if (strlen($css) == 0) {
        cli_writeln("WARNING: CSS content is EMPTY!");
    }
} catch (\Throwable $e) {
    cli_writeln("CSS ERROR: " . $e->getMessage());
    cli_writeln($e->getTraceAsString());
}
