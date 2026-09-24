<?php
// CLI script to create or reset a test student account in Moodle.
// Usage: php /var/www/html/docker/create_test_user.php [username] [password] [email]
define('CLI_SCRIPT', true);

require(__DIR__ . '/config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/enrol/locallib.php');

cli_heading("Erasight Edu - Create Test Student User");

$username = $argv[1] ?? 'hocvien_test';
$password = $argv[2] ?? 'Student@123';
$email = $argv[3] ?? 'student.test@erasight.edu.vn';
$firstname = 'Học viên';
$lastname = 'Erasight';

echo "Checking user: {$username} ({$email})...\n";

$existing = $DB->get_record('user', ['username' => $username, 'deleted' => 0]);

if ($existing) {
    echo "User '{$username}' already exists (ID: {$existing->id}). Updating password and details...\n";
    $update = new stdClass();
    $update->id = $existing->id;
    $update->password = hash_internal_user_password($password);
    $update->email = $email;
    $update->lang = 'vi';
    $update->firstname = $firstname;
    $update->lastname = $lastname;
    $update->city = 'TP Hồ Chí Minh';
    $update->country = 'VN';
    $update->confirmed = 1;
    $update->suspended = 0;
    $DB->update_record('user', $update);
    $userid = $existing->id;
    echo "User '{$username}' updated successfully.\n";
} else {
    echo "Creating new user '{$username}'...\n";
    $user = new stdClass();
    $user->username = $username;
    $user->password = hash_internal_user_password($password);
    $user->firstname = $firstname;
    $user->lastname = $lastname;
    $user->email = $email;
    $user->city = 'TP Hồ Chí Minh';
    $user->country = 'VN';
    $user->lang = 'vi';
    $user->confirmed = 1;
    $user->auth = 'manual';
    $user->mnethostid = $CFG->mnet_localhost_id;
    $user->timecreated = time();
    $user->timemodified = time();
    
    $userid = user_create_user($user, false, false);
    echo "User created with ID: {$userid}\n";
}

// Enroll user into all active courses (except site frontpage course id=1)
$student_role = $DB->get_record('role', ['shortname' => 'student']);
if ($student_role) {
    $courses = $DB->get_records_select('course', 'id > 1 AND visible = 1');
    echo "\nEnrolling into visible courses:\n";
    if (empty($courses)) {
        echo "No courses found other than site front page.\n";
    } else {
        foreach ($courses as $course) {
            $enrol_instances = enrol_get_instances($course->id, true);
            $manual_instance = null;
            foreach ($enrol_instances as $instance) {
                if ($instance->enrol === 'manual') {
                    $manual_instance = $instance;
                    break;
                }
            }
            if ($manual_instance) {
                $enrol_plugin = enrol_get_plugin('manual');
                $enrol_plugin->enrol_user($manual_instance, $userid, $student_role->id);
                echo " - Enrolled in: [{$course->shortname}] {$course->fullname}\n";
            }
        }
    }
}

echo "\n----------------------------------------------------\n";
echo "THÔNG TIN TÀI KHOẢN HỌC VIÊN TEST:\n";
echo "  - URL: http://localhost:5895\n";
echo "  - Username: {$username}\n";
echo "  - Password: {$password}\n";
echo "  - Email:    {$email}\n";
echo "  - Ngôn ngữ: vi (Tiếng Việt)\n";
echo "----------------------------------------------------\n";
