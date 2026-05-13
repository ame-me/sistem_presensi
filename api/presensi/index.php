<?php
include_once '../config/database.php';
 
$requestMethod = $_SERVER["REQUEST_METHOD"];
 
switch($requestMethod) {
    case 'GET':
        $date = $_GET['date'] ?? null;
        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;
        $teacher = $_GET['teacher'] ?? null;
        $class = $_GET['class'] ?? null;
        $studentId = $_GET['student_id'] ?? null;
        
        $query = "SELECT p.*, s.name as student_name FROM presensi p 
                  JOIN siswa s ON p.student_id = s.id 
                  WHERE 1=1";
        $params = [];
        
        if ($date) { $query .= " AND p.date = :date"; $params[':date'] = $date; }
        if ($startDate) { $query .= " AND p.date >= :start_date"; $params[':start_date'] = $startDate; }
        if ($endDate) { $query .= " AND p.date <= :end_date"; $params[':end_date'] = $endDate; }
        if ($teacher) { $query .= " AND p.teacher_code = :teacher"; $params[':teacher'] = $teacher; }
        if ($class) { $query .= " AND p.class_name = :class"; $params[':class'] = $class; }
        if ($studentId) { $query .= " AND p.student_id = :student_id"; $params[':student_id'] = $studentId; }
        if (isset($_GET['schedule_id'])) { $query .= " AND p.schedule_id = :schedule_id"; $params[':schedule_id'] = $_GET['schedule_id']; }
        if (isset($_GET['tahun_ajaran'])) { $query .= " AND p.tahun_ajaran = :tahun_ajaran"; $params[':tahun_ajaran'] = $_GET['tahun_ajaran']; }
        
        $query .= " ORDER BY p.created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        $results = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $results[] = $row;
        }
        
        echo json_encode(["status" => "success", "data" => $results]);
        break;
 
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if(is_array($data) && count($data) > 0) {
            $conn->beginTransaction();
            try {
                foreach($data as $rec) {
                    // Update or Insert
                    $check = "SELECT id FROM presensi WHERE student_id = :sid AND date = :date AND schedule_id = :schid";
                    $cstmt = $conn->prepare($check);
                    $cstmt->execute([':sid' => $rec['studentId'], ':date' => $rec['date'], ':schid' => $rec['scheduleId']]);
                    
                    if ($cstmt->rowCount() > 0) {
                        $upd = "UPDATE presensi SET status = :status WHERE student_id = :sid AND date = :date AND schedule_id = :schid";
                        $ustmt = $conn->prepare($upd);
                        $ustmt->execute([':status' => $rec['status'], ':sid' => $rec['studentId'], ':date' => $rec['date'], ':schid' => $rec['scheduleId']]);
                    } else {
                        $ins = "INSERT INTO presensi (student_id, schedule_id, teacher_code, class_name, subject_name, date, status, tahun_ajaran) 
                                VALUES (:sid, :schid, :tcode, :class, :subject, :date, :status, :tahun_ajaran)";
                        $istmt = $conn->prepare($ins);
                        $istmt->execute([
                            ':sid' => $rec['studentId'],
                            ':schid' => $rec['scheduleId'],
                            ':tcode' => $rec['teacherCode'] ?? '',
                            ':class' => $rec['className'],
                            ':subject' => $rec['subjectName'],
                            ':date' => $rec['date'],
                            ':status' => $rec['status'],
                            ':tahun_ajaran' => $rec['tahunAjaran'] ?? '2025/2026 Genap'
                        ]);
                    }
                }
                $conn->commit();
                echo json_encode(["status" => "success", "message" => "Presensi disimpan"]);
            } catch(PDOException $e) {
                $conn->rollBack();
                http_response_code(400); echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Data presensi tidak valid atau kosong"]);
        }
        break;
}
?>
