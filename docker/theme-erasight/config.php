<?php
// Erasight theme — now a Boost Union child (rebased from a direct Boost
// child theme this session, after evaluating real GitHub theme repos for
// Moodle 5.x compatibility: Adaptable had no MOODLE_50x_STABLE branch at
// all, Moove tracked only through 5.1, Boost Union had an exact
// MOODLE_502_STABLE branch match and was updated the same day this was
// written — chosen for that reason, not from memory).
//
// Structure follows the real, official boost_union_child boilerplate
// (moodle-an-hochschulen/moodle-theme_boost_union_child config.php,
// fetched and read in full before writing this): inherit Boost Union's
// whole config first via require(), then override only what differs.
// Never edits theme/boost or theme/boost_union themselves (both re-cloned
// fresh from upstream on every image build), only extends them via the
// callbacks below.
defined('MOODLE_INTERNAL') || die();

// phpcs:disable moodle.Files.RequireLogin.Missing

// As a start, inherit the whole theme config from Boost Union — saves
// duplicating every line from Boost Union's own config.php. Uses require
// (not require_once) deliberately, matching the real boilerplate: makes
// sure all Boost Union settings are added to $THEME even if its config was
// already included elsewhere.
require($CFG->dirroot . '/theme/boost_union/config.php');

require_once($CFG->dirroot . '/theme/erasight/lib.php');

// Now overwrite only the settings which differ from Boost Union.
$THEME->name = 'erasight';
$THEME->parents = ['boost_union', 'boost'];
$THEME->scss = function ($theme) {
    return theme_erasight_get_main_scss_content($theme);
};
$THEME->prescsscallback = 'theme_erasight_get_pre_scss';
$THEME->extrascsscallback = 'theme_erasight_get_extra_scss';

// Duplicated even though it's the same value as Boost Union's — the real
// boilerplate does this too: theme_config::get_renderer() needs it
// directly on this theme_config object, not just inherited.
$THEME->rendererfactory = 'theme_overridden_renderer_factory';

// Enables settings.php, which defines the light/dark color-scheme setting
// lib.php's SCSS callbacks read (theme_erasight_is_dark()).
$THEME->hassettings = true;

// Overrides ONLY the 'frontpage' layout key — every other layout key
// cascades straight from Boost Union's own $THEME->layouts (all of which
// still point at 'drawers.php', confirmed against Boost Union's real
// config.php). 'file' points at OUR OWN fork of Boost Union's real
// drawers.php (see layout/frontpage.php for why it's forked rather than
// hand-retranscribed).
$THEME->layouts = [
    'frontpage' => [
        'file' => 'frontpage.php',
        'regions' => theme_boost_union_get_block_regions('frontpage'),
        'defaultregion' => 'side-pre',
        'options' => ['nonavbar' => true],
    ],
];

// Replicates a subset of Boost Union's own runtime settings replication
// (see the real boilerplate's config.php for the full rationale): some
// Moodle core code reads $this->page->theme->settings->* directly, which
// must exist on the CURRENTLY ACTIVE theme object (this one), not just on
// Boost Union's. Only 'unaddableblocks' is replicated here — the SCSS
// settings (scss/scsspre) aren't, since this theme's own get_pre_scss/
// get_extra_scss deliberately don't re-call Boost Union's SCSS functions
// at all (see lib.php: Moodle's own automatic parent-chain walk already
// includes them), so there's no scss/scsspre setting lookup here to
// possibly go wrong in the first place.
$unaddableblocks = get_config('theme_boost_union', 'unaddableblocks');
if (!empty($unaddableblocks)) {
    $THEME->settings->unaddableblocks = $unaddableblocks;
}
unset($unaddableblocks);
