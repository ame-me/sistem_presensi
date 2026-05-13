<?php
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $query = "SELECT * FROM ruangan ORDER BY code ASC";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $ruangan = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $ruangan]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data[0]) && is_array($data)) {
            // Bulk Insert
            $conn->beginTransaction();
            try {
                $query = "INSERT INTO ruangan (code, name, location, pic, pic_code) VALUES (:code, :name, :location, :pic, :pic_code)";
                $stmt = $conn->prepare($query);
                
                foreach ($data as $row) {
                    $stmt->execute([
                        ':code' => $row['code'],
                        ':name' => $row['name'],
                        ':location' => $row['location'] ?? 'Lantai 1',
                        ':pic' => $row['pic'] ?? '',
                        ':pic_code' => $row['pic_code'] ?? null
                    ]);

                    // SINKRONISASI KE TABEL GURU (homebase)
                    $picCode = $row['pic_code'] ?? null;
                    if ($picCode && $picCode !== '-' && $picCode !== 'Tidak ada') {
                        $assignGuruQuery = "UPDATE guru SET homebase = :room_name WHERE teacherCode = :tcode";
                        $assignGuruStmt = $conn->prepare($assignGuruQuery);
                        $assignGuruStmt->execute([
                            ':room_name' => $row['name'],
                            ':tcode' => $picCode
                        ]);
                    }
                }
                $conn->commit();
                echo json_encode(["status" => "success", "message" => count($data) . " ruangan berhasil diimport"]);
            } catch(PDOException $e) {
                $conn->rollBack();
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal bulk import: " . $e->getMessage()]);
            }
        } elseif(!empty($data['name']) && !empty($data['code'])) {
            $query = "INSERT INTO ruangan (code, name, location, pic, pic_code) VALUES (:code, :name, :location, :pic, :pic_code)";
            $stmt = $conn->prepare($query);
            try {
                $stmt->execute([
                    ':code' => $data['code'],
                    ':name' => $data['name'],
                    ':location' => $data['location'] ?? 'Lantai 1',
                    ':pic' => $data['pic'] ?? '',
                    ':pic_code' => $data['pic_code'] ?? null
                ]);

                // OTOMATIS HUBUNGKAN KE TABEL GURU (homebase)
                $roomName = $data['name'];
                $picCode = $data['pic_code'] ?? null;
                if ($picCode && $picCode !== '-' && $picCode !== 'Tidak ada') {
                    $assignGuruQuery = "UPDATE guru SET homebase = :room_name WHERE teacherCode = :tcode";
                    $assignGuruStmt = $conn->prepare($assignGuruQuery);
                    $assignGuruStmt->execute([
                        ':room_name' => $roomName,
                        ':tcode' => $picCode
                    ]);
                }

                echo json_encode(['status' => 'success', 'message' => 'Ruangan berhasil ditambahkan']);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap']);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['id'])) {
            try {
                // 1. Ambil data lama untuk keperluan sinkronisasi
                $oldDataQuery = "SELECT name, pic_code FROM ruangan WHERE id = :id";
                $oldDataStmt = $conn->prepare($oldDataQuery);
                $oldDataStmt->execute([':id' => $data['id']]);
                $oldData = $oldDataStmt->fetch(PDO::FETCH_ASSOC);

                // 2. Update tabel ruangan
                $query = "UPDATE ruangan SET code=:code, name=:name, location=:location, pic=:pic, pic_code=:pic_code WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->execute([
                    ':id' => $data['id'],
                    ':code' => $data['code'] ?? '',
                    ':name' => $data['name'] ?? '',
                    ':location' => $data['location'] ?? 'Lantai 1',
                    ':pic' => $data['pic'] ?? '',
                    ':pic_code' => $data['pic_code'] ?? null
                ]);

                // 3. SINKRONISASI KE TABEL GURU
                $roomName = $data['name'] ?? '';
                $newPicCode = $data['pic_code'] ?? null;
                
                // Cabut homebase dari guru lama (jika ada)
                if ($oldData && $oldData['pic_code'] && $oldData['pic_code'] !== '') {
                    $clearOldPICQuery = "UPDATE guru SET homebase = '-' WHERE teacherCode = :old_tcode";
                    $clearOldPICStmt = $conn->prepare($clearOldPICQuery);
                    $clearOldPICStmt->execute([':old_tcode' => $oldData['pic_code']]);
                }

                // Set homebase ke guru baru
                if ($newPicCode && $newPicCode !== '-' && $newPicCode !== 'Tidak ada') {
                    $assignGuruQuery = "UPDATE guru SET homebase = :room_name WHERE teacherCode = :tcode";
                    $assignGuruStmt = $conn->prepare($assignGuruQuery);
                    $assignGuruStmt->execute([
                        ':room_name' => $roomName,
                        ':tcode' => $newPicCode
                    ]);
                }

                echo json_encode(['status' => 'success', 'message' => 'Ruangan berhasil diperbarui']);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID tidak ditemukan']);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['id'])) {
            try {
                // Ambil info pic sebelum dihapus untuk membersihkan tabel guru
                $infoQuery = "SELECT pic FROM ruangan WHERE id = :id";
                $infoStmt = $conn->prepare($infoQuery);
                $infoStmt->execute([':id' => $data['id']]);
                $roomInfo = $infoStmt->fetch(PDO::FETCH_ASSOC);

                if ($roomInfo && $roomInfo['pic'] !== '') {
                    $clearGuruQuery = "UPDATE guru SET homebase = '-' WHERE name = :pic_name";
                    $clearGuruStmt = $conn->prepare($clearGuruQuery);
                    $clearGuruStmt->execute([':pic_name' => $roomInfo['pic']]);
                }

                $query = "DELETE FROM ruangan WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->execute([':id' => $data['id']]);
                echo json_encode(['status' => 'success', 'message' => 'Ruangan berhasil dihapus']);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID tidak ditemukan']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}
?>
