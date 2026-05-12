<?php
include_once '../config/database.php';

$requestMethod = $_SERVER["REQUEST_METHOD"];

switch($requestMethod) {
    case 'GET':
        // Menampilkan daftar mapel
        $tahunAjaran = $_GET['tahun_ajaran'] ?? null;
        $query = "SELECT * FROM mapel WHERE 1=1";
        $params = [];
        if ($tahunAjaran) {
            $query .= " AND tahun_ajaran = :tahun_ajaran";
            $params[':tahun_ajaran'] = $tahunAjaran;
        }
        $query .= " ORDER BY grade ASC, name ASC";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        $results = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            $row['id'] = (int) $row['id'];
            $row['hours'] = (int) $row['hours'];
            array_push($results, $row);
        }
        
        echo json_encode([
            "status" => "success", 
            "data" => $results
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if(!empty($data['code']) && !empty($data['name'])) {
            $query = "INSERT INTO mapel (code, name, grade, hours, cat, tahun_ajaran) VALUES (:code, :name, :grade, :hours, :cat, :tahun_ajaran)";
            $stmt = $conn->prepare($query);
            
            try {
                $stmt->execute([
                    ':code' => $data['code'],
                    ':name' => $data['name'],
                    ':grade' => $data['grade'] ?? 'VII',
                    ':hours' => $data['hours'] ?? 0,
                    ':cat' => $data['cat'] ?? 'Umum',
                    ':tahun_ajaran' => $data['tahun_ajaran'] ?? '2023/2024 Ganjil'
                ]);
                echo json_encode(["status" => "success", "message" => "Mapel berhasil ditambahkan"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
        }
        break;

    case 'PUT':
        // Update data mapel
        $data = json_decode(file_get_contents("php://input"), true);
        
        if(!empty($data['id'])) {
            $query = "UPDATE mapel SET code = :code, name = :name, grade = :grade, hours = :hours, cat = :cat, tahun_ajaran = :tahun_ajaran WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            try {
                $stmt->execute([
                    ':id' => $data['id'],
                    ':code' => $data['code'],
                    ':name' => $data['name'],
                    ':grade' => $data['grade'],
                    ':hours' => $data['hours'],
                    ':cat' => $data['cat'] ?? 'Umum',
                    ':tahun_ajaran' => $data['tahun_ajaran'] ?? '2023/2024 Ganjil'
                ]);
                echo json_encode(["status" => "success", "message" => "Mapel berhasil diperbarui"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID tidak ditemukan"]);
        }
        break;

    case 'DELETE':
        // Hapus data mapel
        $data = json_decode(file_get_contents("php://input"), true);
        
        if(!empty($data['id'])) {
            $query = "DELETE FROM mapel WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            try {
                $stmt->execute([':id' => $data['id']]);
                echo json_encode(["status" => "success", "message" => "Mapel berhasil dihapus"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID tidak ditemukan"]);
        }
        break;

    case 'OPTIONS':
        // Handle preflight requests
        http_response_code(200);
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Tidak Diizinkan"]);
        break;
}
?>
