<?php
// Konfigurasi Header CORS agar React / Next.js bisa akses API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Konfigurasi koneksi MySQL. Env vars dipakai Docker, fallback tetap cocok untuk XAMPP lokal.
$host = getenv("DB_HOST") ?: "127.0.0.1";
$db_name = getenv("DB_NAME") ?: "presensipander_db";
$username = getenv("DB_USER") ?: "root";
$password = getenv("DB_PASSWORD") ?: "";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    // Aktifkan mode error khusus PDO
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Aktifkan utf8 untuk encoding karakter biar aman kalau ada karakter aneh
    $conn->exec("set names utf8");
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failure: " . $exception->getMessage()]);
    exit;
}
?>
