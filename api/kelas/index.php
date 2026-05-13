<?php
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $tahunAjaran = $_GET['tahun_ajaran'] ?? null;
            $query = "SELECT * FROM kelas WHERE 1=1";
            $params = [];
            if ($tahunAjaran) {
                $query .= " AND tahun_ajaran = :tahun_ajaran";
                $params[':tahun_ajaran'] = $tahunAjaran;
            }
            $query .= " ORDER BY grade ASC, name ASC";
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
        
        if (isset($data[0]) && is_array($data)) {
            // Bulk Insert
            $conn->beginTransaction();
            try {
                $query = "INSERT INTO kelas (grade, name, teacher, teacher_code, count, status, tahun_ajaran) 
                          VALUES (:grade, :name, :teacher, :tcode, :count, :status, :tahun_ajaran)";
                $stmt = $conn->prepare($query);
                
                foreach ($data as $row) {
                    $stmt->execute([
                        ':grade' => $row['grade'],
                        ':name' => $row['name'],
                        ':teacher' => $row['teacher'] ?? '-',
                        ':tcode' => $row['teacher_code'] ?? null,
                        ':count' => $row['count'] ?? 0,
                        ':status' => $row['status'] ?? 'Aman',
                        ':tahun_ajaran' => $row['tahun_ajaran'] ?? '2024/2025 Ganjil'
                    ]);

                    // SINKRONISASI KE TABEL GURU
                    $tCode = $row['teacher_code'] ?? null;
                    if ($tCode && $tCode !== '-') {
                        $updGuru = "UPDATE guru SET wali_kelas = :cls, role = CASE WHEN role NOT LIKE '%Wali Kelas%' THEN CONCAT(role, ', Wali Kelas') ELSE role END WHERE teacherCode = :tcode";
                        $stGuru = $conn->prepare($updGuru);
                        $stGuru->execute([':cls' => $row['name'], ':tcode' => $tCode]);
                    }
                }
                $conn->commit();
                echo json_encode(["status" => "success", "message" => count($data) . " kelas berhasil diimport"]);
            } catch(PDOException $e) {
                $conn->rollBack();
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal bulk import: " . $e->getMessage()]);
            }
        } elseif(!empty($data['name']) && !empty($data['grade'])) {
            try {
                $query = "INSERT INTO kelas (grade, name, teacher, teacher_code, count, status, tahun_ajaran) 
                          VALUES (:grade, :name, :teacher, :tcode, :count, :status, :tahun_ajaran)";
                $stmt = $conn->prepare($query);
                $stmt->execute([
                    ':grade' => $data['grade'],
                    ':name' => $data['name'],
                    ':teacher' => $data['teacher'] ?? '-',
                    ':tcode' => $data['teacher_code'] ?? null,
                    ':count' => $data['count'] ?? 0,
                    ':status' => $data['status'] ?? 'Aman',
                    ':tahun_ajaran' => $data['tahun_ajaran'] ?? '2024/2025 Ganjil'
                ]);

                // SINKRONISASI KE TABEL GURU
                $className = $data['name'];
                $tCode = $data['teacher_code'] ?? null;
                if ($tCode && $tCode !== '-') {
                    $updGuru = "UPDATE guru SET wali_kelas = :cls, role = CASE WHEN role NOT LIKE '%Wali Kelas%' THEN CONCAT(role, ', Wali Kelas') ELSE role END WHERE teacherCode = :tcode";
                    $stGuru = $conn->prepare($updGuru);
                    $stGuru->execute([':cls' => $className, ':tcode' => $tCode]);
                }

                echo json_encode(["status" => "success", "message" => "Kelas berhasil ditambahkan"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['id'])) {
            try {
                // Ambil data lama untuk sinkronisasi
                $oldQ = "SELECT name, teacher_code FROM kelas WHERE id = :id";
                $oldS = $conn->prepare($oldQ);
                $oldS->execute([':id' => $data['id']]);
                $old = $oldS->fetch(PDO::FETCH_ASSOC);

                $query = "UPDATE kelas SET grade=:grade, name=:name, teacher=:teacher, teacher_code=:tcode, count=:count, status=:status, tahun_ajaran=:tahun_ajaran WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->execute([
                    ':id' => $data['id'],
                    ':grade' => $data['grade'],
                    ':name' => $data['name'],
                    ':teacher' => $data['teacher'] ?? '-',
                    ':tcode' => $data['teacher_code'] ?? null,
                    ':count' => $data['count'] ?? 0,
                    ':status' => $data['status'] ?? 'Aman',
                    ':tahun_ajaran' => $data['tahun_ajaran'] ?? '2025/2026 Genap'
                ]);

                // SINKRONISASI KE TABEL GURU
                $className = $data['name'];
                $newTCode = $data['teacher_code'] ?? null;

                // Cabut jabatan wali kelas dari guru lama
                if ($old && $old['teacher_code'] && $old['teacher_code'] !== '-') {
                    $clearGuru = "UPDATE guru SET wali_kelas = '-', role = REPLACE(REPLACE(role, ', Wali Kelas', ''), 'Wali Kelas', '') WHERE teacherCode = :tcode";
                    $stClear = $conn->prepare($clearGuru);
                    $stClear->execute([':tcode' => $old['teacher_code']]);
                }

                // Pasang ke guru baru
                if ($newTCode && $newTCode !== '-') {
                    $updGuru = "UPDATE guru SET wali_kelas = :cls, role = CASE WHEN role NOT LIKE '%Wali Kelas%' THEN CONCAT(role, ', Wali Kelas') ELSE role END WHERE teacherCode = :tcode";
                    $stGuru = $conn->prepare($updGuru);
                    $stGuru->execute([':cls' => $className, ':tcode' => $newTCode]);
                }

                echo json_encode(["status" => "success", "message" => "Kelas berhasil diperbarui"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['id'])) {
            try {
                // Info guru sebelum hapus
                $oldQ = "SELECT teacher FROM kelas WHERE id = :id";
                $oldS = $conn->prepare($oldQ);
                $oldS->execute([':id' => $data['id']]);
                $old = $oldS->fetch(PDO::FETCH_ASSOC);

                if ($old && $old['teacher'] !== '' && $old['teacher'] !== '-') {
                    $clearGuru = "UPDATE guru SET wali_kelas = '-', role = REPLACE(REPLACE(role, ', Wali Kelas', ''), 'Wali Kelas', '') WHERE name = :name";
                    $stClear = $conn->prepare($clearGuru);
                    $stClear->execute([':name' => $old['teacher']]);
                }

                $query = "DELETE FROM kelas WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->execute([':id' => $data['id']]);
                echo json_encode(["status" => "success", "message" => "Kelas berhasil dihapus"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;
}
?>
