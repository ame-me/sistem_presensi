<?php
include_once '../config/database.php';

$requestMethod = $_SERVER["REQUEST_METHOD"];

switch($requestMethod) {
    case 'GET':
        $class = $_GET['class'] ?? null;
        $parentId = $_GET['parent_id'] ?? null;
        $parentNik = $_GET['parent_nik'] ?? null;
        $tahunAjaran = $_GET['tahun_ajaran'] ?? null;
        
        $query = "SELECT * FROM siswa WHERE 1=1";
            $params = [];
            
            if ($class) {
                $query .= " AND cls = :class";
                $params[':class'] = $class;
            }
            if ($parentId) {
                $query .= " AND parent_id = :parent_id";
                $params[':parent_id'] = $parentId;
            }
            if ($parentNik) {
                $query .= " AND nik_ortu = :parent_nik";
                $params[':parent_nik'] = $parentNik;
            }
            if ($tahunAjaran) {
                $query .= " AND tahun_ajaran = :tahun_ajaran";
                $params[':tahun_ajaran'] = $tahunAjaran;
            }
            
            $query .= " ORDER BY cls ASC, name ASC";
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
        
        $results = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            // Konversi tipe data jika perlu, misalnya numerik
            $row['id'] = (int) $row['id'];
            array_push($results, $row);
        }
        
        echo json_encode([
            "status" => "success", 
            "message" => "Data siswa berhasil diambil",
            "data" => $results
        ]);
        break;

    case 'POST':
        // Menambahkan siswa baru (Single or Bulk)
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data[0]) && is_array($data)) {
            // Bulk Insert
            $conn->beginTransaction();
            try {
                $query = "INSERT INTO siswa (noInduk, nisn, name, gender, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, nik_ortu, wa, status, tahun_ajaran) 
                          VALUES (:noInduk, :nisn, :name, :gender, :tglLahir, :kota, :alamat, :namaAyah, :pekerjaanAyah, :namaIbu, :pekerjaanIbu, :cls, :parent, :nik_ortu, :wa, :status, :tahun_ajaran)";
                $stmt = $conn->prepare($query);
                
                foreach ($data as $row) {
                    $stmt->execute([
                        ':noInduk' => $row['noInduk'] ?? $row['nisn'],
                        ':nisn' => $row['nisn'],
                        ':name' => $row['name'],
                        ':gender' => $row['gender'] ?? 'L',
                        ':tglLahir' => $row['tglLahir'] ?? '-',
                        ':kota' => $row['kota'] ?? '-',
                        ':alamat' => $row['alamat'] ?? '-',
                        ':namaAyah' => $row['namaAyah'] ?? '-',
                        ':pekerjaanAyah' => $row['pekerjaanAyah'] ?? '-',
                        ':namaIbu' => $row['namaIbu'] ?? '-',
                        ':pekerjaanIbu' => $row['pekerjaanIbu'] ?? '-',
                        ':cls' => $row['cls'] ?? '',
                        ':parent' => $row['parent'] ?? '-',
                        ':nik_ortu' => $row['nik_ortu'] ?? '-',
                        ':wa' => $row['wa'] ?? '-',
                        ':status' => $row['status'] ?? 'ok',
                        ':tahun_ajaran' => $row['tahun_ajaran'] ?? '2024/2025 Ganjil'
                    ]);
                }
                $conn->commit();
                echo json_encode(["status" => "success", "message" => count($data) . " siswa berhasil diimport"]);
            } catch(PDOException $e) {
                $conn->rollBack();
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal bulk import: " . $e->getMessage()]);
            }
        } elseif(!empty($data['nisn']) && !empty($data['name'])) {
            // Single Insert
            $query = "INSERT INTO siswa (noInduk, nisn, name, gender, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, nik_ortu, wa, status, tahun_ajaran) 
                      VALUES (:noInduk, :nisn, :name, :gender, :tglLahir, :kota, :alamat, :namaAyah, :pekerjaanAyah, :namaIbu, :pekerjaanIbu, :cls, :parent, :nik_ortu, :wa, :status, :tahun_ajaran)";
            $stmt = $conn->prepare($query);
            
            try {
                $stmt->execute([
                    ':noInduk' => $data['noInduk'] ?? $data['nisn'],
                    ':nisn' => $data['nisn'],
                    ':name' => $data['name'],
                    ':gender' => $data['gender'] ?? 'L',
                    ':tglLahir' => $data['tglLahir'] ?? '-',
                    ':kota' => $data['kota'] ?? '-',
                    ':alamat' => $data['alamat'] ?? '-',
                    ':namaAyah' => $data['namaAyah'] ?? '-',
                    ':pekerjaanAyah' => $data['pekerjaanAyah'] ?? '-',
                    ':namaIbu' => $data['namaIbu'] ?? '-',
                    ':pekerjaanIbu' => $data['pekerjaanIbu'] ?? '-',
                    ':cls' => $data['cls'] ?? '',
                    ':parent' => $data['parent'] ?? '-',
                    ':nik_ortu' => $data['nik_ortu'] ?? '-',
                    ':wa' => $data['wa'] ?? '-',
                    ':status' => $data['status'] ?? 'ok',
                    ':tahun_ajaran' => $data['tahun_ajaran'] ?? '2024/2025 Ganjil'
                ]);
                echo json_encode(["status" => "success", "message" => "Siswa berhasil ditambahkan", "id" => $conn->lastInsertId()]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Data NISN dan Nama mandatory"]);
        }
        break;
    case 'PUT':
        // Memperbarui data siswa
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $_GET['id'] ?? $data['id'] ?? null;
        
        if($id && !empty($data['name'])) {
            $query = "UPDATE siswa SET 
                        noInduk = :noInduk,
                        nisn = :nisn, 
                        name = :name, 
                        gender = :gender, 
                        tglLahir = :tglLahir, 
                        kota = :kota, 
                        alamat = :alamat, 
                        namaAyah = :namaAyah, 
                        pekerjaanAyah = :pekerjaanAyah, 
                        namaIbu = :namaIbu, 
                        pekerjaanIbu = :pekerjaanIbu, 
                        cls = :cls, 
                        parent = :parent, 
                        nik_ortu = :nik_ortu, 
                        wa = :wa, 
                        status = :status,
                        tahun_ajaran = :tahun_ajaran
                      WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            try {
                $stmt->execute([
                    ':noInduk' => $data['noInduk'] ?? '',
                    ':nisn' => $data['nisn'],
                    ':name' => $data['name'],
                    ':gender' => $data['gender'] ?? 'L',
                    ':tglLahir' => $data['tglLahir'] ?? '-',
                    ':kota' => $data['kota'] ?? '-',
                    ':alamat' => $data['alamat'] ?? '-',
                    ':namaAyah' => $data['namaAyah'] ?? '-',
                    ':pekerjaanAyah' => $data['pekerjaanAyah'] ?? '-',
                    ':namaIbu' => $data['namaIbu'] ?? '-',
                    ':pekerjaanIbu' => $data['pekerjaanIbu'] ?? '-',
                    ':cls' => $data['cls'] ?? '',
                    ':parent' => $data['parent'] ?? '-',
                    ':nik_ortu' => $data['nik_ortu'] ?? '-',
                    ':wa' => $data['wa'] ?? '-',
                    ':status' => $data['status'] ?? 'ok',
                    ':tahun_ajaran' => $data['tahun_ajaran'] ?? '2025/2026 Genap',
                    ':id' => $id
                ]);
                echo json_encode(["status" => "success", "message" => "Data siswa berhasil diperbarui"]);
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
        // Menghapus data siswa
        $id = $_GET['id'] ?? null;
        if($id) {
            $query = "DELETE FROM siswa WHERE id = :id";
            $stmt = $conn->prepare($query);
            try {
                $stmt->execute([':id' => $id]);
                echo json_encode(["status" => "success", "message" => "Siswa berhasil dihapus"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Gagal hapus: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID harus ada"]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Tidak Diizinkan"]);
        break;
}
?>
