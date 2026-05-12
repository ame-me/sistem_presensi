<?php
require_once "../config/database.php";

const ACCESS_MATRIX_KEY = "access_matrix";

function ensure_settings_table(PDO $conn): void {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS app_settings (
            setting_key VARCHAR(80) NOT NULL PRIMARY KEY,
            setting_value LONGTEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function read_json_body(): array {
    $raw = file_get_contents("php://input");
    if (!$raw) return [];

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

try {
    ensure_settings_table($conn);

    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $stmt = $conn->prepare("SELECT setting_value, updated_at FROM app_settings WHERE setting_key = ?");
        $stmt->execute([ACCESS_MATRIX_KEY]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $matrix = null;
        if ($row && $row["setting_value"] !== "") {
            $decoded = json_decode($row["setting_value"], true);
            $matrix = is_array($decoded) ? $decoded : null;
        }

        echo json_encode([
            "status" => "success",
            "data" => $matrix,
            "updated_at" => $row ? $row["updated_at"] : null,
        ]);
        exit;
    }

    if ($method === "POST" || $method === "PUT") {
        $payload = read_json_body();
        $matrix = $payload["accessMatrix"] ?? $payload["matrix"] ?? $payload;

        if (!is_array($matrix)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Matriks akses tidak valid"]);
            exit;
        }

        $encoded = json_encode($matrix, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $stmt = $conn->prepare("
            INSERT INTO app_settings (setting_key, setting_value)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");
        $stmt->execute([ACCESS_MATRIX_KEY, $encoded]);

        echo json_encode(["status" => "success", "data" => $matrix]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method tidak didukung"]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
