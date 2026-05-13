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

// Konfigurasi koneksi MySQL ke XAMPP
$host = "127.0.0.1";
$db_name = "presensipander_db"; // Sesuai dengan nama database di PHPMyAdmin
$username = "root"; // Default username XAMPP
$password = ""; // Default password XAMPP kosong

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
