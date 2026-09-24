<?php
define('CLI_SCRIPT', true);
require(__DIR__ . '/config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/course/modlib.php');

$course = $DB->get_record('course', ['id' => 2]);
if (!$course) {
    cli_writeln("Course 2 not found!");
    exit(1);
}

// Check existing modules in course 2
$cms = $DB->get_records('course_modules', ['course' => $course->id]);
cli_writeln("Existing course modules: " . count($cms));

// Let's create sample activities if needed using generator
require_once($CFG->dirroot . '/lib/phpunit/classes/util.php');
// Or using native data generator
require_once($CFG->dirroot . '/lib/testing/generator/lib.php');

try {
    $generator = new testing_data_generator();
    
    // 1. Forum in Section 0: "Các thông báo"
    $forum_sec = $DB->get_record('course_sections', ['course' => $course->id, 'section' => 0]);
    $existing_forum = $DB->get_record('forum', ['course' => $course->id, 'name' => 'Các thông báo']);
    if (!$existing_forum) {
        $forum = $generator->create_module('forum', [
            'course' => $course->id,
            'section' => 0,
            'name' => 'Các thông báo',
            'intro' => 'Thông báo quan trọng từ giảng viên môn học',
            'type' => 'news'
        ]);
        cli_writeln("Created forum: Các thông báo");
    }

    // 2. Resource/Page in Section 1: "Slide bài giảng"
    $existing_page = $DB->get_record('page', ['course' => $course->id, 'name' => 'Slide bài giảng']);
    if (!$existing_page) {
        $page = $generator->create_module('page', [
            'course' => $course->id,
            'section' => 1,
            'name' => 'Slide bài giảng',
            'intro' => 'Tài liệu và slide bài giảng các buổi học',
            'content' => '<p>Tổng hợp slide bài giảng môn học.</p>'
        ]);
        cli_writeln("Created page: Slide bài giảng");
    }

    // 3. Assign in Section 2: "Bài tập buổi học 10.09.2026", "Bài tập buổi học 17.09.2026", "Bài tập buổi học 24.09.2026"
    $assigns = [
        'Bài tập buổi học 10.09.2026',
        'Bài tập buổi học 17.09.2026',
        'Bài tập buổi học 24.09.2026'
    ];
    foreach ($assigns as $aname) {
        $existing_assign = $DB->get_record('assign', ['course' => $course->id, 'name' => $aname]);
        if (!$existing_assign) {
            $generator->create_module('assign', [
                'course' => $course->id,
                'section' => 2,
                'name' => $aname,
                'intro' => 'Nộp bài tập buổi học theo đúng thời hạn quy định',
                'duedate' => time() + 7 * 86400,
                'allowsubmissionsfromdate' => time() - 86400
            ]);
            cli_writeln("Created assignment: {$aname}");
        }
    }

    // 4. Section 3: "Bài thực hành 1 - Lớp .1"
    $existing_lab = $DB->get_record('assign', ['course' => $course->id, 'name' => 'Bài thực hành 1 - Lớp .1']);
    if (!$existing_lab) {
        $generator->create_module('assign', [
            'course' => $course->id,
            'section' => 3,
            'name' => 'Bài thực hành 1 - Lớp .1',
            'intro' => 'Thực hành phòng máy',
            'duedate' => time() + 14 * 86400
        ]);
        cli_writeln("Created assignment: Bài thực hành 1 - Lớp .1");
    }

    rebuild_course_cache($course->id, true);
    cli_writeln("Activities populated & course cache rebuilt successfully!");
} catch (\Throwable $e) {
    cli_writeln("Generator notice: " . $e->getMessage());
}
