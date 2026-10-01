<?php
define('CLI_SCRIPT', true);
require('/var/www/html/config.php');
require_once($CFG->libdir . '/clilib.php');

$theme = theme_config::load('erasight');
cli_writeln("theme->settings->colorscheme: " . var_export($theme->settings->colorscheme ?? 'NOT SET', true));
cli_writeln("theme_erasight_is_dark returns: " . var_export(theme_erasight_is_dark($theme), true));
cli_writeln("get_config('theme_erasight', 'colorscheme'): " . var_export(get_config('theme_erasight', 'colorscheme'), true));
cli_writeln("get_config('core', 'theme'): " . var_export(get_config('core', 'theme'), true));
cli_writeln("CFG->theme: " . var_export($CFG->theme ?? 'NOT SET', true));
