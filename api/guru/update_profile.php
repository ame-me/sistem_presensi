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

$response = ['status' => 'error', 'message' => 'Invalid request'];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed');
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['email'])) {
        throw new Exception('Email diperlukan');
    }

    $email = trim($data['email']);
    $name = isset($data['name']) ? trim($data['name']) : null;
    $phone = isset($data['phone']) ? trim($data['phone']) : null;

    if (!$name && !$phone) {
        throw new Exception('Tidak ada data yang akan diupdate');
    }

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

    $params[':email'] = $email;

    $sql = "UPDATE guru SET " . implode(", ", $setParts) . " WHERE email = :email";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0 && $name === null && $phone === null) {
        throw new Exception('Tidak ada perubahan data');
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