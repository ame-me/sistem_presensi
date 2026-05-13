<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$target_dir = "../../uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

if ($_FILES["file"]) {
    $file_name = time() . "_" . basename($_FILES["file"]["name"]);
    $target_file = $target_dir . $file_name;
    
    if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
        echo json_encode(["status" => "success", "url" => $file_name]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal upload file"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Tidak ada file"]);
}
?>
