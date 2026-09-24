<?php
define('CLI_SCRIPT', true);
require(__DIR__ . '/config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/mod/forum/lib.php');
require_once($CFG->dirroot . '/mod/assign/lib.php');

$course = $DB->get_record('course', ['id' => 2]);
if (!$course) {
    cli_writeln("Course 2 not found!");
    exit(1);
}

cli_writeln("Configuring Course 2: " . $course->fullname);

// Define section names matching user's reference screenshot
$section_names = [
    0 => 'Chung',
    1 => 'Tài liệu môn học',
    2 => 'Nộp bài tập (Quá trình)',
    3 => 'THỰC HÀNH - Lớp NT101.R11.1',
    4 => 'New section'
];

foreach ($section_names as $num => $name) {
    $sec = $DB->get_record('course_sections', ['course' => $course->id, 'section' => $num]);
    if ($sec) {
        $sec->name = $name;
        $DB->update_record('course_sections', $sec);
        cli_writeln("Updated section {$num}: {$name}");
    } else {
        $newsec = course_create_section($course->id, $num);
        $newsec_rec = $DB->get_record('course_sections', ['id' => $newsec->id]);
        $newsec_rec->name = $name;
        $DB->update_record('course_sections', $newsec_rec);
        cli_writeln("Created section {$num}: {$name}");
    }
}

// Clear course cache
rebuild_course_cache($course->id, true);
cli_writeln("Course cache rebuilt successfully!");
