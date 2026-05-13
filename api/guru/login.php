<?php
include_once '../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!empty($data['email']) && !empty($data['password'])) {
        $email = $data['email'];
        $password = $data['password'];

        $query = "SELECT * FROM guru WHERE email = :email LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            // Success
            unset($user['password']); // Don't send password back
            echo json_encode([
                "status" => "success",
                "message" => "Login berhasil",
                "data" => $user
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Email atau password salah"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email dan password wajib diisi"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
