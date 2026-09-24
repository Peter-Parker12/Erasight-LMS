<?php
// CLI script to install Vietnamese language pack (vi) and set as site default.
define('CLI_SCRIPT', true);

require(__DIR__ . '/config.php');
require_once($CFG->libdir . '/clilib.php');

cli_heading("Erasight Edu - Cài đặt Ngôn ngữ Tiếng Việt");

// 1. Kiểm tra xem gói ngôn ngữ vi đã có trong moodledata/lang hay chưa
$langdir = $CFG->dataroot . '/lang/vi';
$needs_install = !file_exists($langdir) || !file_exists($langdir . '/moodle.php');

if ($needs_install) {
    echo "Gói ngôn ngữ tiếng Việt (vi) chưa được cài đặt trong {$langdir}.\n";
    echo "Đang thử tải về từ Moodle langpack repository...\n";
    
    // Thử sử dụng tool_langimport controller
    try {
        if (file_exists($CFG->dirroot . '/admin/tool/langimport/classes/controller.php')) {
            require_once($CFG->dirroot . '/admin/tool/langimport/classes/controller.php');
            $controller = new \tool_langimport\controller();
            $result = $controller->install_languagepacks(['vi']);
            echo "Kết quả cài đặt qua tool_langimport: " . ($result ? "Thành công" : "Không hoàn tất") . "\n";
        }
    } catch (\Throwable $e) {
        echo "Lưu ý khi dùng controller: " . $e->getMessage() . "\n";
    }

    // Nếu vẫn chưa có, thử tải trực tiếp zip gói ngôn ngữ
    if (!file_exists($langdir . '/moodle.php')) {
        echo "Đang thử tải trực tiếp vi.zip từ download.moodle.org...\n";
        $urls = [
            "https://download.moodle.org/download.php/direct/langpack/5.0/vi.zip",
            "https://download.moodle.org/download.php/direct/langpack/4.5/vi.zip",
            "https://download.moodle.org/download.php/direct/langpack/4.4/vi.zip"
        ];
        
        $tempzip = $CFG->dataroot . '/temp/vi.zip';
        @mkdir(dirname($tempzip), 0777, true);
        @mkdir($CFG->dataroot . '/lang', 0777, true);

        $downloaded = false;
        foreach ($urls as $url) {
            echo "Thử tải: {$url} ... ";
            $fp = @fopen($tempzip, 'w+');
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            curl_setopt($ch, CURLOPT_FILE, $fp);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $success = curl_exec($ch);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            fclose($fp);

            if ($success && $httpcode == 200 && filesize($tempzip) > 10000) {
                echo "Thành công (" . round(filesize($tempzip) / 1024) . " KB)!\n";
                $downloaded = true;
                break;
            } else {
                echo "Thất bại (HTTP {$httpcode})\n";
                @unlink($tempzip);
            }
        }

        if ($downloaded) {
            echo "Đang giải nén gói ngôn ngữ vi.zip vào {$CFG->dataroot}/lang/ ...\n";
            $zip = new ZipArchive();
            if ($zip->open($tempzip) === TRUE) {
                $zip->extractTo($CFG->dataroot . '/lang/');
                $zip->close();
                echo "Đã giải nén gói ngôn ngữ vi thành công.\n";
            } else {
                echo "Không thể giải nén file zip.\n";
            }
            @unlink($tempzip);
        }
    }
} else {
    echo "Gói ngôn ngữ tiếng Việt (vi) đã có sẵn trong hệ thống.\n";
}

// 2. Thiết lập ngôn ngữ mặc định của Site sang 'vi'
echo "Thiết lập ngôn ngữ mặc định site: lang = vi...\n";
set_config('lang', 'vi');
set_config('langmenu', 1);

// Đặt theme sang 'erasight'
set_config('theme', 'erasight');

// Xoá cache ngôn ngữ và theme
purge_all_caches();

echo "\n----------------------------------------------------\n";
echo "HOÀN TẤT THIẾT LẬP:\n";
echo "  - Ngôn ngữ mặc định site: " . get_config('core', 'lang') . "\n";
echo "  - Theme hiện tại: " . get_config('core', 'theme') . "\n";
echo "  - Cache hệ thống đã được purge sạch.\n";
echo "----------------------------------------------------\n";
