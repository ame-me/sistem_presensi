<?php
include_once '../config/database.php';
 
$requestMethod = $_SERVER["REQUEST_METHOD"];
 
switch($requestMethod) {
    case 'GET':
        $date = $_GET['date'] ?? null;
        $teacher = $_GET['teacher'] ?? null;
        
        $query = "SELECT * FROM jurnal WHERE 1=1";
        $params = [];
        
        if ($date) { $query .= " AND date = :date"; $params[':date'] = $date; }
        if ($teacher) { $query .= " AND teacher_code = :teacher"; $params[':teacher'] = $teacher; }
        if (isset($_GET['schedule_id'])) { $query .= " AND schedule_id = :schedule_id"; $params[':schedule_id'] = $_GET['schedule_id']; }
        
        $query .= " ORDER BY date DESC";
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
        if(!empty($data['scheduleId']) && !empty($data['topic'])) {
            $check = "SELECT id FROM jurnal WHERE schedule_id = :sid AND date = :date";
            $cstmt = $conn->prepare($check);
            $cstmt->execute([':sid' => $data['scheduleId'], ':date' => $data['date']]);
            
            if ($cstmt->rowCount() > 0) {
                $upd = "UPDATE jurnal SET topic = :topic, notes = :notes WHERE schedule_id = :sid AND date = :date";
                $stmt = $conn->prepare($upd);
                $stmt->execute([':topic' => $data['topic'], ':notes' => $data['notes'] ?? '', ':sid' => $data['scheduleId'], ':date' => $data['date']]);
            } else {
                $ins = "INSERT INTO jurnal (schedule_id, teacher_code, date, topic, notes) VALUES (:sid, :tcode, :date, :topic, :notes)";
                $stmt = $conn->prepare($ins);
                $stmt->execute([
                    ':sid' => $data['scheduleId'],
                    ':tcode' => $data['teacherCode'] ?? '',
                    ':date' => $data['date'],
                    ':topic' => $data['topic'],
                    ':notes' => $data['notes'] ?? ''
                ]);
            }
            echo json_encode(["status" => "success", "message" => "Jurnal tersimpan"]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Data jurnal tidak lengkap atau kosong"]);
        }
        break;
}
?>
