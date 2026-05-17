<?php
include_once '../config/database.php';

$requestMethod = $_SERVER["REQUEST_METHOD"];

function ensureOrtuProfileColumns($conn) {
    try {
        $conn->exec("ALTER TABLE ortu MODIFY COLUMN email VARCHAR(120) DEFAULT NULL");
        $conn->exec("ALTER TABLE ortu MODIFY COLUMN phone VARCHAR(30) DEFAULT NULL");
    } catch (PDOException $e) {
        // Older MySQL variants may reject MODIFY under limited privileges; CRUD can still continue.
    }

    $columns = [
        "namaAyah" => "VARCHAR(120) DEFAULT NULL",
        "pekerjaanAyah" => "VARCHAR(80) DEFAULT NULL",
        "namaIbu" => "VARCHAR(120) DEFAULT NULL",
        "pekerjaanIbu" => "VARCHAR(80) DEFAULT NULL"
    ];

    foreach ($columns as $column => $definition) {
        $stmt = $conn->prepare("SHOW COLUMNS FROM ortu LIKE ?");
        $stmt->execute([$column]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            $conn->exec("ALTER TABLE ortu ADD COLUMN `$column` $definition");
        }
    }
}

ensureOrtuProfileColumns($conn);

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

        // Change password logic
        if ($action === 'change_password') {
            if (!empty($data['nik']) && !empty($data['current_password']) && !empty($data['new_password'])) {

                // Validate new password length
                if (strlen($data['new_password']) < 6) {
                    echo json_encode(["status" => "error", "message" => "Password baru minimal 6 karakter"]);
                    break;
                }

                // Get user by NIK and verify current password
                $stmt = $conn->prepare("SELECT id, password FROM ortu WHERE nik = ?");
                $stmt->execute([$data['nik']]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($row) {
                    // Verify current password (plain text comparison in this example)
                    if ($row['password'] === $data['current_password']) {
                        // Update password
                        $updateStmt = $conn->prepare("UPDATE ortu SET password = ? WHERE id = ?");
                        $updateStmt->execute([$data['new_password'], $row['id']]);

                        echo json_encode(["status" => "success", "message" => "Password berhasil diubah"]);
                    } else {
                        echo json_encode(["status" => "error", "message" => "Password saat ini salah"]);
                    }
                } else {
                    echo json_encode(["status" => "error", "message" => "User tidak ditemukan"]);
                }
            } else {
                echo json_encode(["status" => "error", "message" => "NIK, password saat ini, dan password baru wajib diisi"]);
            }
            break;
        }
        }

        if ($action === 'bulk-upsert') {
            if (!is_array($data)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Data import ortu harus berupa array"]);
                break;
            }

            $created = 0;
            $updated = 0;
            $failed = 0;
            $errors = [];

            $selectStmt = $conn->prepare("SELECT id FROM ortu WHERE nik = ?");
            $query = "INSERT INTO ortu (nik, name, email, password, phone, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, status)
                      VALUES (:nik, :name, :email, :password, :phone, :namaAyah, :pekerjaanAyah, :namaIbu, :pekerjaanIbu, :status)
                      ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        email = COALESCE(VALUES(email), email),
                        phone = COALESCE(VALUES(phone), phone),
                        namaAyah = COALESCE(VALUES(namaAyah), namaAyah),
                        pekerjaanAyah = COALESCE(VALUES(pekerjaanAyah), pekerjaanAyah),
                        namaIbu = COALESCE(VALUES(namaIbu), namaIbu),
                        pekerjaanIbu = COALESCE(VALUES(pekerjaanIbu), pekerjaanIbu),
                        status = VALUES(status)";
            $stmt = $conn->prepare($query);

            foreach ($data as $index => $row) {
                if (empty($row['nik']) || empty($row['name'])) {
                    $failed++;
                    $errors[] = ["row" => $index + 1, "message" => "NIK dan nama wajib diisi"];
                    continue;
                }

                try {
                    $selectStmt->execute([$row['nik']]);
                    $exists = (bool) $selectStmt->fetch(PDO::FETCH_ASSOC);
                    $stmt->execute([
                        ':nik' => $row['nik'],
                        ':name' => $row['name'],
                        ':email' => $row['email'] ?? null,
                        ':password' => $row['password'] ?? 'password123',
                        ':phone' => $row['phone'] ?? null,
                        ':namaAyah' => $row['namaAyah'] ?? null,
                        ':pekerjaanAyah' => $row['pekerjaanAyah'] ?? null,
                        ':namaIbu' => $row['namaIbu'] ?? null,
                        ':pekerjaanIbu' => $row['pekerjaanIbu'] ?? null,
                        ':status' => $row['status'] ?? 'AKTIF'
                    ]);
                    if ($exists) {
                        $updated++;
                    } else {
                        $created++;
                    }
                } catch(PDOException $e) {
                    $failed++;
                    $errors[] = ["row" => $index + 1, "nik" => $row['nik'] ?? null, "message" => $e->getMessage()];
                }
            }

            echo json_encode([
                "status" => "success",
                "message" => "Import ortu selesai",
                "created" => $created,
                "updated" => $updated,
                "failed" => $failed,
                "errors" => $errors
            ]);
            break;
        }

        // 3. CRUD: Menambahkan Ortu baru (untuk Admin IT)
        if(!empty($data['nik']) && !empty($data['name'])) {
            $query = "INSERT INTO ortu (nik, name, email, password, phone, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, status) 
                      VALUES (:nik, :name, :email, :password, :phone, :namaAyah, :pekerjaanAyah, :namaIbu, :pekerjaanIbu, :status)";
            $stmt = $conn->prepare($query);
            
            try {
                $stmt->execute([
                    ':nik' => $data['nik'],
                    ':name' => $data['name'],
                    ':email' => $data['email'] ?? null,
                    ':password' => $data['password'] ?? 'password123',
                    ':phone' => $data['phone'] ?? null,
                    ':namaAyah' => $data['namaAyah'] ?? null,
                    ':pekerjaanAyah' => $data['pekerjaanAyah'] ?? null,
                    ':namaIbu' => $data['namaIbu'] ?? null,
                    ':pekerjaanIbu' => $data['pekerjaanIbu'] ?? null,
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
            $passwordSql = !empty($data['password']) ? ", password = :password" : "";
            $query = "UPDATE ortu SET 
                        nik = :nik,
                        name = :name, 
                        email = :email, 
                        phone = :phone, 
                        namaAyah = :namaAyah,
                        pekerjaanAyah = :pekerjaanAyah,
                        namaIbu = :namaIbu,
                        pekerjaanIbu = :pekerjaanIbu,
                        status = :status
                        $passwordSql
                      WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            try {
                $params = [
                    ':nik' => $data['nik'],
                    ':name' => $data['name'],
                    ':email' => $data['email'] ?? null,
                    ':phone' => $data['phone'] ?? null,
                    ':namaAyah' => $data['namaAyah'] ?? null,
                    ':pekerjaanAyah' => $data['pekerjaanAyah'] ?? null,
                    ':namaIbu' => $data['namaIbu'] ?? null,
                    ':pekerjaanIbu' => $data['pekerjaanIbu'] ?? null,
                    ':status' => $data['status'] ?? 'AKTIF',
                    ':id' => $id
                ];
                if (!empty($data['password'])) {
                    $params[':password'] = $data['password'];
                }
                $stmt->execute($params);
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
