<?php
include_once '../config/database.php';
 
$requestMethod = $_SERVER["REQUEST_METHOD"];
 
switch($requestMethod) {
    case 'GET':
        $date = $_GET['date'] ?? null;
        $status = $_GET['status'] ?? null;
        
        $query = "SELECT i.*, s.name as student_name FROM izin i 
                  JOIN siswa s ON i.student_id = s.id 
                  WHERE 1=1";
        $params = [];
        
        if ($date) { $query .= " AND :date BETWEEN i.start_date AND i.end_date"; $params[':date'] = $date; }
        if ($status) { $query .= " AND i.status = :status"; $params[':status'] = $status; }
        
        $query .= " ORDER BY i.created_at DESC";
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
        if(!empty($data['studentId']) && !empty($data['type'])) {
            $status = $data['status'] ?? 'PENDING';
            
            // Helper to save base64 as file
            function saveBase64Image($base64String, $prefix) {
                if (!$base64String || strpos($base64String, 'data:image') === false) return $base64String;
                
                $target_dir = "../../uploads/";
                if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);
                
                $image_parts = explode(";base64,", $base64String);
                $image_type_aux = explode("image/", $image_parts[0]);
                $image_type = $image_type_aux[1];
                $image_base64 = base64_decode($image_parts[1]);
                
                $file_name = $prefix . "_" . time() . "_" . uniqid() . "." . $image_type;
                $file_path = $target_dir . $file_name;
                
                file_put_contents($file_path, $image_base64);
                return $file_name;
            }

            $selfieUrl = saveBase64Image($data['selfieUrl'] ?? '', 'selfie');
            $attachmentUrl = saveBase64Image($data['attachmentUrl'] ?? '', 'attach');

            $ins = "INSERT INTO izin (student_id, parent_email, type, start_date, end_date, reason, selfie_url, attachment_url, status) 
                    VALUES (:sid, :pmail, :type, :start, :end, :reason, :selfie, :attach, :status)";
            $stmt = $conn->prepare($ins);
            try {
                $stmt->execute([
                    ':sid' => $data['studentId'],
                    ':pmail' => $data['parentEmail'] ?? '',
                    ':type' => $data['type'],
                    ':start' => $data['startDate'],
                    ':end' => $data['endDate'],
                    ':reason' => $data['reason'],
                    ':selfie' => $selfieUrl,
                    ':attach' => $attachmentUrl,
                    ':status' => $status
                ]);
                echo json_encode(["status" => "success", "message" => "Izin diajukan"]);
            } catch(PDOException $e) {
                http_response_code(400); echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;
 
    case 'PUT':
        // Update status (Review)
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['id'])) {
            $upd = "UPDATE izin SET status = :status, review_notes = :notes, reviewed_by = :by WHERE id = :id";
            $stmt = $conn->prepare($upd);
            try {
                $stmt->execute([
                    ':status' => $data['status'],
                    ':notes' => $data['notes'] ?? '',
                    ':by' => $data['reviewedBy'] ?? 'Admin',
                    ':id' => $data['id']
                ]);
                echo json_encode(["status" => "success", "message" => "Izin di-review"]);
            } catch(PDOException $e) {
                http_response_code(400); echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;
}
?>
