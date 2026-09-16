<?php
// The "Course Details" pre-purchase page (/local/erasight/course.php?id=X).
// Deliberately NOT built on course/info.php: that page is a bare, legacy,
// direct-echo page (not template-based) — same vintage as the category-
// browse renderer catalog.php already chose not to subclass. This follows
// catalog.php's own established pattern instead: a plugin-owned page using
// stable public APIs, rendered through our own template.
//
// "Enroll now" links to Moodle's own real enrolment-options page
// (enrol/index.php, confirmed real — it calls enrol_page_hook() on every
// available enrolment method for the course) rather than building any
// custom checkout — enrol_fee + the configured PayPal payment gateway
// already provide that UI, this page just gets the student there.
require(__DIR__ . '/../../config.php');
// Explicit, not relying on Moodle's lazy plugin-loading timing — see the
// same note in catalog.php.
require_once(__DIR__ . '/lib.php');

require_login();

$id = required_param('id', PARAM_INT);
$course = $DB->get_record('course', ['id' => $id], '*', MUST_EXIST);
$coursecontext = context_course::instance($course->id);

if (!$course->visible && !has_capability('moodle/course:viewhiddencourses', $coursecontext)) {
    // Reuses the exact same string core's own course/info.php throws for
    // this scenario (verified against its real source) rather than a
    // guessed-at, nonexistent 'coursehidden' string.
    throw new moodle_exception('cannotviewcategory', '', $CFG->wwwroot . '/');
}

$PAGE->set_url(new moodle_url('/local/erasight/course.php', ['id' => $course->id]));
$PAGE->set_context($coursecontext);
$PAGE->set_pagelayout('course');
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(get_string('coursedetails', 'local_erasight'));

$category = core_course_category::get($course->category, IGNORE_MISSING, true);
$price = local_erasight_get_course_price($course->id);
$enrolled = is_enrolled($coursecontext, $USER, '', true);

// Real course sections/activities via get_fast_modinfo() — the same stable,
// heavily-used core API course/view.php itself relies on — not a fabricated
// "curriculum" field, since none exists on a course.
$modinfo = get_fast_modinfo($course);
$curriculum = [];
foreach ($modinfo->get_section_info_all() as $sectionnum => $sectioninfo) {
    if ($sectionnum == 0 || !$sectioninfo->uservisible) {
        continue; // Section 0 is the "General" top area, not a real curriculum section.
    }
    $cmids = $modinfo->sections[$sectionnum] ?? [];
    if (empty($cmids)) {
        continue;
    }
    $items = [];
    foreach ($cmids as $cmid) {
        $cm = $modinfo->get_cm($cmid);
        if (!$cm->uservisible) {
            continue;
        }
        $items[] = (object) ['name' => $cm->get_formatted_name()];
    }
    if (empty($items)) {
        continue;
    }
    $sectionname = $sectioninfo->name;
    if ($sectionname === '' || $sectionname === null) {
        $sectionname = get_string('sectionname', 'local_erasight', $sectionnum);
    } else {
        $sectionname = format_string($sectionname);
    }
    $curriculum[] = (object) ['title' => $sectionname, 'items' => $items];
}

// Best-effort instructor via the editingteacher archetype role, same
// role-based lookup pattern core itself uses for course contacts. Gracefully
// omitted (not fatal) when a course has no one in that role yet.
$instructor = null;
// IGNORE_MULTIPLE, not the default IGNORE_MISSING (which only tolerates
// zero rows, not several) — a customized site could plausibly have more
// than one role with this archetype; either one is a fine answer here.
$editingteacherroleid = $DB->get_field('role', 'id', ['archetype' => 'editingteacher'], IGNORE_MULTIPLE);
$editingteachers = $editingteacherroleid
    ? get_role_users((int) $editingteacherroleid, $coursecontext, false, 'u.id, u.firstname, u.lastname')
    : [];
if ($editingteachers) {
    $teacher = reset($editingteachers);
    $instructor = (object) [
        'fullname' => fullname($teacher),
        'initials' => strtoupper(mb_substr($teacher->firstname, 0, 1) . mb_substr($teacher->lastname, 0, 1)),
    ];
}

// A simple, real-data heuristic (not a stored Moodle flag) — 60 days is a
// display choice, not something Moodle tracks as "new" itself.
$isnew = ($course->timecreated > time() - 60 * DAYSECS);

// Only claim a certificate if the course actually contains a real
// certificate-issuing activity — mod_certificate/mod_customcert are both
// contrib, not core-bundled, so this must be detected, never assumed.
$hascertificate = false;
foreach ($modinfo->get_cms() as $cm) {
    if (in_array($cm->modname, ['certificate', 'customcert'], true)) {
        $hascertificate = true;
        break;
    }
}

$accesstext = null;
if ($price) {
    $accesstext = $price->enrolperiod > 0
        ? get_string('accessperiod', 'local_erasight', format_time($price->enrolperiod))
        : get_string('lifetimeaccess', 'local_erasight');
}

$customfields = local_erasight_get_course_customfields($course->id);

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_erasight/course', [
    'id' => $course->id,
    'fullname' => format_string($course->fullname),
    'category' => $category ? format_string($category->name) : '',
    'summary' => format_text($course->summary, $course->summaryformat, ['context' => $coursecontext]),
    'courseimage' => local_erasight_get_course_image($course->id, $OUTPUT),
    'price' => $price,
    'enrolled' => $enrolled,
    'viewurl' => (new moodle_url('/course/view.php', ['id' => $course->id]))->out(false),
    'enrolurl' => (new moodle_url('/enrol/index.php', ['id' => $course->id]))->out(false),
    'catalogurl' => (new moodle_url('/local/erasight/catalog.php'))->out(false),
    'instructor' => $instructor,
    'curriculum' => $curriculum,
    'lessoncount' => array_sum(array_map(fn($s) => count($s->items), $curriculum)),
    'isnew' => $isnew,
    'hascertificate' => $hascertificate,
    'accesstext' => $accesstext,
    'learncontent' => $customfields['erasight_learn'] ?? null,
    'requirementscontent' => $customfields['erasight_requirements'] ?? null,
    'faqcontent' => $customfields['erasight_faq'] ?? null,
]);
echo $OUTPUT->footer();
