<?php
header('Content-Type: application/json');

// Simulating cache cleaning
// In a real scenario, this might delete temporary files or clear OpCache
sleep(2);

echo json_encode([
    "status" => "success",
    "message" => "Cache sistem berhasil dibersihkan dan performa dioptimalkan."
]);
?>
