<?php
include_once '../config/database.php';

$requestMethod = $_SERVER["REQUEST_METHOD"];

switch($requestMethod) {
    case 'GET':
        // 1. Ambil Ortu tunggal (untuk login info)? Atau Ortu list?
        $nik = $_GET['nik'] ?? null;
        
        if ($nik) {
            $stmt = $conn->prepare("SELECT * FROM ortu WHERE nik = ?");
            $stmt->execute([$nik]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                unset($row['password']); // Jangan kirim password
                echo json_encode(["status" => "success", "data" => $row]);
            } else {
                echo json_encode(["status" => "error", "message" => "Ortu tidak ditemukan"]);
            }
        } else {
            // Ambil semua ortu untuk Admin IT
            $stmt = $conn->query("SELECT * FROM ortu ORDER BY name ASC");
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // Hide passwords
            foreach ($results as &$r) unset($r['password']);
            echo json_encode(["status" => "success", "data" => $results]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $_GET['action'] ?? null;
        
        // 2. Login Logic
        if ($action === 'login') {
            if (!empty($data['nik']) && !empty($data['password'])) {
                $stmt = $conn->prepare("SELECT * FROM ortu WHERE nik = ? AND password = ?");
                $stmt->execute([$data['nik'], $data['password']]); // Simple comparison for now (user provided password123 as dummy)
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($row) {
                    unset($row['password']);
                    echo json_encode(["status" => "success", "message" => "Login berhasil", "data" => $row]);
                } else {
                    echo json_encode(["status" => "error", "message" => "NIK atau Password salah"]);
                }
            } else {
                echo json_encode(["status" => "error", "message" => "NIK and password data are mandatory"]);
            }
            break;
        }

        // 3. CRUD: Menambahkan Ortu baru (untuk Admin IT)
        if(!empty($data['nik']) && !empty($data['name'])) {
            $query = "INSERT INTO ortu (nik, name, email, password, phone, status) 
                      VALUES (:nik, :name, :email, :password, :phone, :status)";
            $stmt = $conn->prepare($query);
            
            try {
                $stmt->execute([
                    ':nik' => $data['nik'],
                    ':name' => $data['name'],
                    ':email' => $data['email'] ?? null,
                    ':password' => $data['password'] ?? 'password123',
                    ':phone' => $data['phone'] ?? null,
                    ':status' => $data['status'] ?? 'AKTIF'
                ]);
                echo json_encode(["status" => "success", "message" => "Orang Tua berhasil ditambahkan", "id" => $conn->lastInsertId()]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "NIK dan Nama mandatory untuk pendaftaran"]);
        }
        break;

    case 'PUT':
        // Memperbarui data Ortu
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $_GET['id'] ?? $data['id'] ?? null;
        
        if($id && !empty($data['name'])) {
            $query = "UPDATE ortu SET 
                        nik = :nik,
                        name = :name, 
                        email = :email, 
                        phone = :phone, 
                        status = :status 
                      WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            try {
                $stmt->execute([
                    ':nik' => $data['nik'],
                    ':name' => $data['name'],
                    ':email' => $data['email'] ?? null,
                    ':phone' => $data['phone'] ?? null,
                    ':status' => $data['status'] ?? 'AKTIF',
                    ':id' => $id
                ]);
                echo json_encode(["status" => "success", "message" => "Data Ortu berhasil diperbarui"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal update: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID dan Nama harus ada"]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if($id) {
            $stmt = $conn->prepare("DELETE FROM ortu WHERE id = ?");
            try {
                $stmt->execute([$id]);
                echo json_encode(["status" => "success", "message" => "Ortu berhasil dihapus"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal hapus: " . $e->getMessage()]);
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Tidak Diizinkan"]);
        break;
}
?>
