<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once '../config/database.php';

header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $day = $_GET['day'] ?? null;
        $class = $_GET['class'] ?? null;
        $teacher = $_GET['teacher'] ?? null;
        $tahunAjaran = $_GET['tahun_ajaran'] ?? null;
        
        try {
            $query = "SELECT j.*, g.name as teacher_name, g.mapel as teacher_mapel 
                      FROM jadwal j 
                      LEFT JOIN guru g ON j.teacher_code = g.teacherCode 
                      WHERE 1=1";
            $params = [];
            
            if ($day) { $query .= " AND j.day = :day"; $params[':day'] = $day; }
            if ($class) { $query .= " AND j.class_name = :class"; $params[':class'] = $class; }
            if ($teacher) { $query .= " AND (j.teacher_code = :teacher OR j.teacher_code LIKE :tlike1 OR j.teacher_code LIKE :tlike2 OR j.teacher_code LIKE :tlike3)"; $params[':teacher'] = $teacher; $params[':tlike1'] = $teacher . "/%"; $params[':tlike2'] = "%/" . $teacher; $params[':tlike3'] = "%/" . $teacher . "/%"; }
            if ($tahunAjaran) { $query .= " AND j.tahun_ajaran = :tahun_ajaran"; $params[':tahun_ajaran'] = $tahunAjaran; }
            
            $query .= " ORDER BY j.day, j.slot, j.class_name";
            
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['status' => 'success', 'data' => $results]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if(!empty($data['day']) && !empty($data['slot']) && !empty($data['class_name'])) {
            try {
                $query = "INSERT INTO jadwal (day, slot, time_range, class_name, teacher_code, subject_code, subject_hint, room_code, tahun_ajaran) 
                          VALUES (:day, :slot, :time_range, :class_name, :teacher_code, :subject_code, :subject_hint, :room_code, :tahun_ajaran)";
                $stmt = $conn->prepare($query);
                $stmt->execute([
                    ':day' => $data['day'],
                    ':slot' => $data['slot'],
                    ':time_range' => $data['time_range'] ?? '',
                    ':class_name' => $data['class_name'],
                    ':teacher_code' => $data['teacher_code'] ?? '',
                    ':subject_code' => $data['subject_code'] ?? null,
                    ':subject_hint' => $data['subject_hint'] ?? null,
                    ':room_code' => $data['room_code'] ?? null,
                    ':tahun_ajaran' => $data['tahun_ajaran'] ?? '2023/2024 Ganjil'
                ]);
                echo json_encode(['status' => 'success', 'message' => 'Jadwal berhasil ditambahkan']);
            } catch(Exception $e) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['id'])) {
            try {
                // Conflict Check
                $tahun = $data['tahun_ajaran'] ?? '2025/2026 Genap';
                
                // 1. Teacher Conflict
                if (!empty($data['teacher_code']) && !in_array($data['teacher_code'], ['UPACARA', 'DOA dan SABDA', 'SENAM', '-'])) {
                    $cstmt = $conn->prepare("SELECT class_name FROM jadwal WHERE day = :day AND slot = :slot AND teacher_code = :tcode AND tahun_ajaran = :tahun AND id != :id");
                    $cstmt->execute([':day' => $data['day'], ':slot' => $data['slot'], ':tcode' => $data['teacher_code'], ':tahun' => $tahun, ':id' => $data['id']]);
                    if ($conflict = $cstmt->fetch(PDO::FETCH_ASSOC)) {
                        http_response_code(409);
                        echo json_encode(['status' => 'error', 'message' => "BENTROK GURU! Guru ini sudah mengajar di kelas {$conflict['class_name']} pada waktu tersebut."]);
                        exit;
                    }
                }

                // 2. Room Conflict
                if (!empty($data['room_code']) && $data['room_code'] !== '-') {
                    $rstmt = $conn->prepare("SELECT class_name FROM jadwal WHERE day = :day AND slot = :slot AND room_code = :rcode AND tahun_ajaran = :tahun AND id != :id");
                    $rstmt->execute([':day' => $data['day'], ':slot' => $data['slot'], ':rcode' => $data['room_code'], ':tahun' => $tahun, ':id' => $data['id']]);
                    if ($rconflict = $rstmt->fetch(PDO::FETCH_ASSOC)) {
                        http_response_code(409);
                        echo json_encode(['status' => 'error', 'message' => "BENTROK RUANGAN! Ruangan ini sudah digunakan oleh kelas {$rconflict['class_name']} pada waktu tersebut."]);
                        exit;
                    }
                }

                $query = "UPDATE jadwal SET 
                          day = :day, 
                          slot = :slot, 
                          time_range = :time_range, 
                          class_name = :class_name, 
                          teacher_code = :teacher_code, 
                          subject_code = :subject_code, 
                          subject_hint = :subject_hint,
                          room_code = :room_code,
                          tahun_ajaran = :tahun_ajaran
                          WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->execute([
                    ':id' => $data['id'],
                    ':day' => $data['day'],
                    ':slot' => $data['slot'],
                    ':time_range' => $data['time_range'] ?? '',
                    ':class_name' => $data['class_name'],
                    ':teacher_code' => $data['teacher_code'] ?? '',
                    ':subject_code' => $data['subject_code'] ?? null,
                    ':subject_hint' => $data['subject_hint'] ?? null,
                    ':room_code' => $data['room_code'] ?? null,
                    ':tahun_ajaran' => $tahun
                ]);
                echo json_encode(['status' => 'success', 'message' => 'Jadwal berhasil diperbarui']);
            } catch(Exception $e) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['id'])) {
            try {
                $query = "DELETE FROM jadwal WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->execute([':id' => $data['id']]);
                echo json_encode(['status' => 'success', 'message' => 'Jadwal berhasil dihapus']);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
        }
        break;
}
?>
