<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/config.php';

$response = ['status' => 'error', 'message' => 'Invalid request'];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed');
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['email']) || !isset($data['current_password']) || !isset($data['new_password'])) {
        throw new Exception('Missing required fields');
    }

    $email = $conn->real_escape_string($data['email']);
    $currentPassword = $data['current_password'];
    $newPassword = $data['new_password'];

    // Validate new password
    if (strlen($newPassword) < 6) {
        throw new Exception('Password baru minimal 6 karakter');
    }

    // Get user by email
    $sql = "SELECT id, password FROM guru WHERE email = ? AND status = 'active'";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('User tidak ditemukan');
    }

    $user = $result->fetch_assoc();

    // Verify current password (assuming password is stored as plain text in this example)
    // In production, you should use password_hash() and password_verify()
    if ($user['password'] !== $currentPassword) {
        throw new Exception('Password saat ini salah');
    }

    // Update password
    $updateSql = "UPDATE guru SET password = ?, updated_at = NOW() WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("si", $newPassword, $user['id']);

    if ($updateStmt->execute()) {
        $response = [
            'status' => 'success',
            'message' => 'Password berhasil diubah'
        ];
    } else {
        throw new Exception('Gagal mengubah password');
    }

    $updateStmt->close();
    $stmt->close();

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
} finally {
    $conn->close();
}

echo json_encode($response);
?>