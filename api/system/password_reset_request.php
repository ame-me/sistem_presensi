<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/config.php';

$response = ['status' => 'error', 'message' => 'Invalid request'];

try {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'POST':
            // Submit password reset request
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['user_id']) || !isset($data['user_name']) || !isset($data['user_email']) || !isset($data['reason'])) {
                throw new Exception('Missing required fields');
            }

            $userId = $conn->real_escape_string($data['user_id']);
            $userName = $conn->real_escape_string($data['user_name']);
            $userEmail = $conn->real_escape_string($data['user_email']);
            $userRole = $conn->real_escape_string($data['user_role'] ?? 'UNKNOWN');
            $reason = $conn->real_escape_string($data['reason']);
            $requestedAt = date('Y-m-d H:i:s');

            // Check if there's a pending request for this user
            $checkSql = "SELECT id FROM password_reset_requests WHERE user_id = ? AND status = 'PENDING'";
            $checkStmt = $conn->prepare($checkSql);
            $checkStmt->bind_param("s", $userId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult->num_rows > 0) {
                throw new Exception('Anda sudah memiliki permintaan reset password yang sedang diproses');
            }

            // Create password_reset_requests table if not exists
            $createTableSql = "
                CREATE TABLE IF NOT EXISTS password_reset_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    user_name VARCHAR(150) NOT NULL,
                    user_email VARCHAR(120) NOT NULL,
                    user_role VARCHAR(30) NOT NULL,
                    reason TEXT NOT NULL,
                    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
                    requested_at DATETIME NOT NULL,
                    processed_at DATETIME NULL,
                    processed_by VARCHAR(50) NULL,
                    default_password VARCHAR(100) NULL,
                    notes TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ";
            $conn->query($createTableSql);

            // Insert new request
            $insertSql = "INSERT INTO password_reset_requests (user_id, user_name, user_email, user_role, reason, status, requested_at)
                         VALUES (?, ?, ?, ?, ?, 'PENDING', ?)";
            $insertStmt = $conn->prepare($insertSql);
            $insertStmt->bind_param("ssssss", $userId, $userName, $userEmail, $userRole, $reason, $requestedAt);

            if ($insertStmt->execute()) {
                $requestId = $conn->insert_id;

                // Create notifications table if not exists
                $createNotifTableSql = "
                    CREATE TABLE IF NOT EXISTS notifications (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50) NOT NULL,
                        title VARCHAR(200) NOT NULL,
                        message TEXT NOT NULL,
                        type VARCHAR(30) NOT NULL,
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ";
                $conn->query($createNotifTableSql);

                // Send notification to Admin IT
                $adminNotifSql = "INSERT INTO notifications (user_id, title, message, type) VALUES
                                 ('ADMIN_IT', 'Permintaan Reset Password', ?, 'PASSWORD_RESET_REQUEST')";
                $adminNotifStmt = $conn->prepare($adminNotifSql);
                $message = "User {$userName} ({$userEmail}) meminta reset password. Alasan: {$reason}";
                $adminNotifStmt->bind_param("s", $message);
                $adminNotifStmt->execute();

                $response = [
                    'status' => 'success',
                    'message' => 'Permintaan reset password telah dikirim ke Admin IT',
                    'request_id' => $requestId
                ];
            } else {
                throw new Exception('Gagal mengirim permintaan reset password');
            }

            $checkStmt->close();
            $insertStmt->close();
            if (isset($adminNotifStmt)) $adminNotifStmt->close();
            break;

        case 'GET':
            // Get password reset requests (for Admin IT)
            $status = $_GET['status'] ?? 'PENDING';

            // Create table if not exists (in case GET is called first)
            $createTableSql = "
                CREATE TABLE IF NOT EXISTS password_reset_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    user_name VARCHAR(150) NOT NULL,
                    user_email VARCHAR(120) NOT NULL,
                    user_role VARCHAR(30) NOT NULL,
                    reason TEXT NOT NULL,
                    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
                    requested_at DATETIME NOT NULL,
                    processed_at DATETIME NULL,
                    processed_by VARCHAR(50) NULL,
                    default_password VARCHAR(100) NULL,
                    notes TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ";
            $conn->query($createTableSql);

            $sql = "SELECT * FROM password_reset_requests WHERE status = ? ORDER BY requested_at DESC";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $status);
            $stmt->execute();
            $result = $stmt->get_result();

            $requests = [];
            while ($row = $result->fetch_assoc()) {
                $requests[] = $row;
            }

            $response = [
                'status' => 'success',
                'data' => $requests,
                'count' => count($requests)
            ];

            $stmt->close();
            break;

        case 'PUT':
            // Update password reset request (approve/reject/complete)
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['request_id']) || !isset($data['action']) || !isset($data['processed_by'])) {
                throw new Exception('Missing required fields');
            }

            $requestId = $conn->real_escape_string($data['request_id']);
            $action = $conn->real_escape_string($data['action']);
            $processedBy = $conn->real_escape_string($data['processed_by']);
            $notes = $conn->real_escape_string($data['notes'] ?? '');
            $processedAt = date('Y-m-d H:i:s');

            // Get request details
            $getSql = "SELECT * FROM password_reset_requests WHERE id = ?";
            $getStmt = $conn->prepare($getSql);
            $getStmt->bind_param("i", $requestId);
            $getStmt->execute();
            $requestResult = $getStmt->get_result();

            if ($requestResult->num_rows === 0) {
                throw new Exception('Permintaan tidak ditemukan');
            }

            $request = $requestResult->fetch_assoc();

            $status = '';
            $defaultPassword = '';

            switch ($action) {
                case 'approve':
                    $status = 'APPROVED';
                    // Generate default password
                    $defaultPassword = 'password' . rand(100, 999);
                    break;
                case 'reject':
                    $status = 'REJECTED';
                    break;
                case 'complete':
                    $status = 'COMPLETED';
                    break;
                default:
                    throw new Exception('Aksi tidak valid');
            }

            // Update request
            $updateSql = "UPDATE password_reset_requests SET
                          status = ?,
                          processed_at = ?,
                          processed_by = ?,
                          notes = ?,
                          default_password = ?
                          WHERE id = ?";
            $updateStmt = $conn->prepare($updateSql);
            $updateStmt->bind_param("sssssi", $status, $processedAt, $processedBy, $notes, $defaultPassword, $requestId);

            if ($updateStmt->execute()) {
                if ($action === 'approve') {
                    // Reset user's password in appropriate table
                    if ($request['user_role'] === 'ORTU') {
                        // Reset parent password
                        $resetSql = "UPDATE ortu SET password = ? WHERE email = ? OR nik = ?";
                        $resetStmt = $conn->prepare($resetSql);
                        $resetStmt->bind_param("sss", $defaultPassword, $request['user_email'], $request['user_email']);
                        $resetStmt->execute();
                        $resetStmt->close();
                    } else {
                        // Reset teacher/admin password
                        $resetSql = "UPDATE guru SET password = ? WHERE email = ?";
                        $resetStmt = $conn->prepare($resetSql);
                        $resetStmt->bind_param("ss", $defaultPassword, $request['user_email']);
                        $resetStmt->execute();
                        $resetStmt->close();
                    }

                    // Create notifications table if not exists
                    $createNotifTableSql = "
                        CREATE TABLE IF NOT EXISTS notifications (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id VARCHAR(50) NOT NULL,
                            title VARCHAR(200) NOT NULL,
                            message TEXT NOT NULL,
                            type VARCHAR(30) NOT NULL,
                            is_read BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    ";
                    $conn->query($createNotifTableSql);

                    // Send notification to user
                    $userNotifSql = "INSERT INTO notifications (user_id, title, message, type) VALUES
                                    (?, 'Password Telah Direset', ?, 'PASSWORD_RESET_APPROVED')";
                    $userNotifStmt = $conn->prepare($userNotifSql);
                    $message = "Password Anda telah direset oleh Admin IT. Password default: {$defaultPassword}. Silakan login dan ganti password Anda.";
                    $userNotifStmt->bind_param("ss", $request['user_id'], $message);
                    $userNotifStmt->execute();
                    $userNotifStmt->close();
                }

                $response = [
                    'status' => 'success',
                    'message' => "Permintaan berhasil di{$action}",
                    'default_password' => $action === 'approve' ? $defaultPassword : null
                ];
            } else {
                throw new Exception('Gagal memperbarui permintaan');
            }

            $getStmt->close();
            $updateStmt->close();
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
} finally {
    $conn->close();
}

echo json_encode($response);
?>