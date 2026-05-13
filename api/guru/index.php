<?php
// Include the database config
include_once '../config/database.php';

// Cek Method Tipe apa yang di-request React
$requestMethod = $_SERVER["REQUEST_METHOD"];

switch($requestMethod) {
    case 'GET':
        // ===================================
        // PROSES MENGAMBIL DATA GURU (List All)
        // ===================================
        // Siapkan query
        $query = "SELECT * FROM guru ORDER BY CAST(teacherCode AS UNSIGNED) ASC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        $results = [];
        
        // Loop tiap baris (fetch) data
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            // Kita extract biar gampang (ex: $row['name'] jadi $name)
            extract($row);
            
            $guru_item = [
                "id" => (int) $id,
                "teacherCode" => $teacherCode,
                "name" => $name,
                "email" => $email,
                "phone" => $phone ? $phone : "-",
                "mapel" => $mapel ? $mapel : "-",
                "homebase" => $homebase ? $homebase : "-",
                "wali_kelas" => $wali_kelas ? $wali_kelas : "-",
                "role" => $role,
                "isBK" => (bool) $isBK, // React mengharapkan strict boolean
                "status" => $status
            ];
            
            array_push($results, $guru_item);
        }
        
        // Kembalikan Response ke Frontend sebagai JSON
        echo json_encode([
            "status" => "success",
            "message" => "Data guru berhasil diambil",
            "data" => $results
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['name']) && !empty($data['teacherCode'])) {
            $email = $data['email'] ?? $data['teacherCode'] . "@sekolah.id";
            $password = password_hash($data['password'] ?? 'password123', PASSWORD_DEFAULT);
            
            $query = "INSERT INTO guru (name, teacherCode, email, password, phone, mapel, homebase, role, wali_kelas, status) VALUES (:name, :teacherCode, :email, :password, :phone, :mapel, :homebase, :role, :wali_kelas, 'AKTIF')";
            $stmt = $conn->prepare($query);
            try {
                $stmt->execute([
                    ':name' => $data['name'],
                    ':teacherCode' => $data['teacherCode'],
                    ':email' => $email,
                    ':password' => $password,
                    ':phone' => $data['phone'] ?? '-',
                    ':mapel' => $data['mapel'] ?? '-',
                    ':homebase' => $data['homebase'] ?? '-',
                    ':role' => $data['role'] ?? 'Guru Mapel',
                    ':wali_kelas' => $data['wali_kelas'] ?? '-'
                ]);

                // OTOMATIS HUBUNGKAN KE TABEL RUANGAN (PIC)
                $newHomebase = $data['homebase'] ?? '-';
                $tCode = $data['teacherCode'];
                $tName = $data['name'];
                if ($newHomebase !== '-' && $newHomebase !== 'Tidak ada') {
                    $assignRuanganQuery = "UPDATE ruangan SET pic = :teacher_name, pic_code = :tcode WHERE name = :room_name";
                    $assignRuanganStmt = $conn->prepare($assignRuanganQuery);
                    $assignRuanganStmt->execute([
                        ':teacher_name' => $tName,
                        ':tcode' => $tCode,
                        ':room_name' => $newHomebase
                    ]);
                }

                // OTOMATIS HUBUNGKAN KE TABEL KELAS
                $newWaliKelas = $data['wali_kelas'] ?? '-';
                if (stripos($data['role'], 'Wali Kelas') !== false && $newWaliKelas !== '-') {
                    $assignQuery = "UPDATE kelas SET teacher = :teacher_name, teacher_code = :tcode WHERE name = :class_name";
                    $assignStmt = $conn->prepare($assignQuery);
                    $assignStmt->execute([
                        ':teacher_name' => $tName,
                        ':tcode' => $tCode,
                        ':class_name' => $newWaliKelas
                    ]);
                }

                echo json_encode(["status" => "success", "message" => "Guru berhasil ditambahkan"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Nama dan Kode wajib diisi"]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['id'])) {
            try {
                // Ambil info nama dulu sebelum dihapus untuk membersihkan kelas
                $infoQuery = "SELECT name FROM guru WHERE id = :id";
                $infoStmt = $conn->prepare($infoQuery);
                $infoStmt->execute([':id' => $data['id']]);
                $guruInfo = $infoStmt->fetch(PDO::FETCH_ASSOC);

                if ($guruInfo) {
                    $clearQuery = "UPDATE kelas SET teacher = '-' WHERE teacher = :teacher_name";
                    $clearStmt = $conn->prepare($clearQuery);
                    $clearStmt->execute([':teacher_name' => $guruInfo['name']]);

                    // Bersihkan pic di tabel ruangan juga
                    $clearRuanganQuery = "UPDATE ruangan SET pic = '-' WHERE pic = :teacher_name";
                    $clearRuanganStmt = $conn->prepare($clearRuanganQuery);
                    $clearRuanganStmt->execute([':teacher_name' => $guruInfo['name']]);
                }

                $query = "DELETE FROM guru WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->execute([':id' => $data['id']]);
                echo json_encode(["status" => "success", "message" => "Guru berhasil dinonaktifkan"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!empty($data['id'])) {
            // Handle Password Reset Action
            if (isset($data['action']) && $data['action'] === 'reset_password') {
                $password = password_hash('password123', PASSWORD_DEFAULT);
                $query = "UPDATE guru SET password = :password WHERE id = :id";
                $stmt = $conn->prepare($query);
                try {
                    $stmt->execute([':password' => $password, ':id' => $data['id']]);
                    echo json_encode(["status" => "success", "message" => "Password berhasil direset"]);
                } catch(PDOException $e) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
                }
                break;
            }

            // Normal Update
            $query = "UPDATE guru SET name=:name, teacherCode=:teacherCode, email=:email, phone=:phone, mapel=:mapel, homebase=:homebase, role=:role, wali_kelas=:wali_kelas WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            // If password is provided in update, hash it
            if (!empty($data['password'])) {
                $query = "UPDATE guru SET name=:name, teacherCode=:teacherCode, email=:email, password=:password, phone=:phone, mapel=:mapel, homebase=:homebase, role=:role, wali_kelas=:wali_kelas WHERE id = :id";
                $stmt = $conn->prepare($query);
            }

            try {
                $params = [
                    ':id' => $data['id'],
                    ':name' => $data['name'] ?? '',
                    ':teacherCode' => $data['teacherCode'] ?? '',
                    ':email' => $data['email'] ?? '',
                    ':phone' => $data['phone'] ?? '',
                    ':mapel' => $data['mapel'] ?? '',
                    ':homebase' => $data['homebase'] ?? '',
                    ':role' => $data['role'] ?? '',
                    ':wali_kelas' => $data['waliKelasRombel'] ?? ($data['wali_kelas'] ?? '-')
                ];
                
                if (!empty($data['password'])) {
                    $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
                }

                $stmt->execute($params);

                // OTOMATIS HUBUNGKAN KE TABEL RUANGAN (PIC)
                $newHomebase = $data['homebase'] ?? '-';
                $teacherName = $data['name'];
                $tCode = $data['teacherCode'] ?? '';
                
                // 1. Cabut dulu status PIC guru ini dari semua ruangan
                $clearRuanganQuery = "UPDATE ruangan SET pic = '-', pic_code = NULL WHERE pic_code = :tcode OR pic = :teacher_name";
                $clearRuanganStmt = $conn->prepare($clearRuanganQuery);
                $clearRuanganStmt->execute([':tcode' => $tCode, ':teacher_name' => $teacherName]);
                
                // 2. Set guru ini ke ruangan baru jika dipilih
                if ($newHomebase !== '-' && $newHomebase !== 'Tidak ada') {
                    $assignRuanganQuery = "UPDATE ruangan SET pic = :teacher_name, pic_code = :tcode WHERE name = :room_name";
                    $assignRuanganStmt = $conn->prepare($assignRuanganQuery);
                    $assignRuanganStmt->execute([
                        ':teacher_name' => $teacherName,
                        ':tcode' => $tCode,
                        ':room_name' => $newHomebase
                    ]);
                }

                // OTOMATIS HUBUNGKAN KE TABEL KELAS
                $newWaliKelas = $data['waliKelasRombel'] ?? ($data['wali_kelas'] ?? '-');
                
                // 1. Cabut dulu status wali kelas lama bagi guru ini dari semua kelas
                $clearQuery = "UPDATE kelas SET teacher = '-', teacher_code = NULL WHERE teacher_code = :tcode OR teacher = :teacher_name";
                $clearStmt = $conn->prepare($clearQuery);
                $clearStmt->execute([':tcode' => $tCode, ':teacher_name' => $teacherName]);
                
                // 2. Jika jabatannya Wali Kelas, set guru ini ke kelas yang dipilih
                if (stripos(($data['role'] ?? ''), 'Wali Kelas') !== false && $newWaliKelas !== '-') {
                    $assignQuery = "UPDATE kelas SET teacher = :teacher_name, teacher_code = :tcode WHERE name = :class_name";
                    $assignStmt = $conn->prepare($assignQuery);
                    $assignStmt->execute([
                        ':teacher_name' => $teacherName,
                        ':tcode' => $tCode,
                        ':class_name' => $newWaliKelas
                    ]);
                }

                echo json_encode(["status" => "success", "message" => "Data guru berhasil diupdate"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
            }
        }
        break;

    default:
        // Jika method ngawur selain GET
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Tidak Diizinkan"]);
        break;
}
?>
