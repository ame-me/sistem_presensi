<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];

// Handle preflight
if ($method === 'OPTIONS') {
    exit;
}

// Ensure notification table exists
$sql_table = "CREATE TABLE IF NOT EXISTS notifikasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_code VARCHAR(50),
    schedule_id INT,
    type VARCHAR(50),
    message TEXT,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read TINYINT(1) DEFAULT 0
)";
$conn->exec($sql_table);

switch ($method) {
    case 'GET':
        $teacher = $_GET['teacher'] ?? null;
        if (!$teacher) {
            echo json_encode(['status' => 'error', 'message' => 'Teacher code required']);
            break;
        }
        $stmt = $conn->prepare("SELECT * FROM notifikasi WHERE teacher_code = :teacher AND is_read = 0 ORDER BY created_at DESC");
        $stmt->execute([':teacher' => $teacher]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $results]);
        break;

    case 'POST':
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        // Cek jika ini adalah aksi Dismissal (menggunakan POST sebagai pengganti PATCH jika bermasalah)
        if (isset($data['action']) && $data['action'] === 'dismiss') {
            if (!isset($data['id'])) {
                echo json_encode(['status' => 'error', 'message' => 'Notification ID required']);
                break;
            }
            $stmt = $conn->prepare("UPDATE notifikasi SET is_read = 1 WHERE id = :id");
            $stmt->execute([':id' => $data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Notification closed']);
            break;
        }

        if (!$data || !isset($data['teacher_code'])) {
            echo json_encode(['status' => 'error', 'message' => 'Incomplete data']);
            break;
        }
        $stmt = $conn->prepare("INSERT INTO notifikasi (teacher_code, schedule_id, type, message, date) VALUES (:teacher, :sid, :type, :msg, :date)");
        $stmt->execute([
            ':teacher' => $data['teacher_code'],
            ':sid' => $data['schedule_id'] ?? null,
            ':type' => $data['type'] ?? 'INFO',
            ':msg' => $data['message'],
            ':date' => $data['date'] ?? date('Y-m-d')
        ]);
        echo json_encode(['status' => 'success', 'message' => 'Notification sent']);
        break;

    case 'PATCH':
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        if (!$data || !isset($data['id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Notification ID required']);
            break;
        }
        $stmt = $conn->prepare("UPDATE notifikasi SET is_read = 1 WHERE id = :id");
        $stmt->execute([':id' => $data['id']]);
        echo json_encode(['status' => 'success', 'message' => 'Notification closed']);
        break;
}
?>
