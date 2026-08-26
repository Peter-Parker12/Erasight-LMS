<?php
// The "browse all courses" catalog page — deliberately NOT built by
// subclassing core_course_renderer. That renderer's course-listing output
// (coursecat_coursebox_content() and friends, in course/renderer.php) is
// built from a chain of interdependent `protected` html_writer methods with
// no Mustache templates involved at all — reskinning it means overriding
// most of that chain consistently, which isn't verifiable without a live
// Moodle install to run it against. This page instead fetches courses via
// the stable, public core_course_category API and renders them through the
// SAME core_course/coursecards + core_course/coursecard templates the
// theme_erasight override already reskins for the /my/ dashboard — reusing
// verified, working code instead of best-effort core surgery.
//
// Deliberately builds a plain stdClass per course with only the fields
// core_course/coursecard.mustache actually reads, rather than instantiating
// Moodle's own \core_course\external\course_summary_exporter — that class
// requires a fuller, stricter property set (see course/classes/external/
// course_summary_exporter.php) that's easy to get subtly wrong without a
// live install to catch a missing-property fatal on.
require(__DIR__ . '/../../config.php');

require_login();

$PAGE->set_url(new moodle_url('/local/erasight/catalog.php'));
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('course');
$PAGE->set_title(get_string('catalog', 'local_erasight'));
$PAGE->set_heading(get_string('catalog', 'local_erasight'));

$systemcontext = context_system::instance();
$courses = core_course_category::top()->get_courses(['recursive' => true, 'limit' => 200]);

$carddata = [];
foreach ($courses as $course) {
    if (!$course->visible && !has_capability('moodle/course:viewhiddencourses', $systemcontext)) {
        continue;
    }

    $coursecontext = context_course::instance($course->id);
    $enrolled = is_enrolled($coursecontext, $USER, '', true);

    $hasprogress = false;
    $progress = 0;
    if ($enrolled) {
        $percent = \core_completion\progress::get_course_progress_percentage($course);
        if ($percent !== null) {
            $hasprogress = true;
            $progress = (int) floor($percent);
        }
    }

    $category = core_course_category::get($course->category, IGNORE_MISSING, true);

    $carddata[] = (object) [
        'id' => $course->id,
        'uniqid' => uniqid(),
        'viewurl' => (new moodle_url('/course/view.php', ['id' => $course->id]))->out(false),
        'courseimage' => $OUTPUT->get_generated_image_for_id($course->id),
        'fullname' => format_string($course->fullname),
        'shortname' => format_string($course->shortname),
        'showshortname' => (bool) $CFG->courselistshortnames,
        'hasprogress' => $hasprogress,
        'progress' => $progress,
        'coursecategory' => $category ? format_string($category->name) : '',
        'visible' => (bool) $course->visible,
        'isfavourite' => false,
    ];
}

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('core_course/coursecards', ['courses' => $carddata]);
echo $OUTPUT->footer();
