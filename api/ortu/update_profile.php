<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

function ensureOrtuProfileColumns($conn) {
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

$response = ['status' => 'error', 'message' => 'Invalid request'];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed');
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['nik'])) {
        throw new Exception('NIK diperlukan');
    }

    $nik = trim($data['nik']);
    $name = isset($data['name']) ? trim($data['name']) : null;
    $phone = isset($data['phone']) ? trim($data['phone']) : null;
    $namaAyah = isset($data['namaAyah']) ? trim($data['namaAyah']) : null;
    $pekerjaanAyah = isset($data['pekerjaanAyah']) ? trim($data['pekerjaanAyah']) : null;
    $namaIbu = isset($data['namaIbu']) ? trim($data['namaIbu']) : null;
    $pekerjaanIbu = isset($data['pekerjaanIbu']) ? trim($data['pekerjaanIbu']) : null;

    $setParts = [];
    $params = [];

    if ($name) {
        $setParts[] = "name = :name";
        $params[':name'] = $name;
    }
    if ($phone) {
        $setParts[] = "phone = :phone";
        $params[':phone'] = $phone;
    }
    if ($namaAyah !== null) {
        $setParts[] = "namaAyah = :namaAyah";
        $params[':namaAyah'] = $namaAyah === '' ? null : $namaAyah;
    }
    if ($pekerjaanAyah !== null) {
        $setParts[] = "pekerjaanAyah = :pekerjaanAyah";
        $params[':pekerjaanAyah'] = $pekerjaanAyah === '' ? null : $pekerjaanAyah;
    }
    if ($namaIbu !== null) {
        $setParts[] = "namaIbu = :namaIbu";
        $params[':namaIbu'] = $namaIbu === '' ? null : $namaIbu;
    }
    if ($pekerjaanIbu !== null) {
        $setParts[] = "pekerjaanIbu = :pekerjaanIbu";
        $params[':pekerjaanIbu'] = $pekerjaanIbu === '' ? null : $pekerjaanIbu;
    }

    if (empty($setParts)) {
        throw new Exception('Tidak ada data yang akan diupdate');
    }

    $params[':nik'] = $nik;

    $sql = "UPDATE ortu SET " . implode(", ", $setParts) . " WHERE nik = :nik";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        $checkStmt = $conn->prepare("SELECT id FROM ortu WHERE nik = ?");
        $checkStmt->execute([$nik]);
        if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
            throw new Exception('Data ortu tidak ditemukan');
        }
    }

    $response = [
        'status' => 'success',
        'message' => 'Profil berhasil diperbarui'
    ];

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
} finally {
    $conn = null;
}

echo json_encode($response);
?>