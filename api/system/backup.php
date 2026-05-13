<?php
include_once '../config/database.php';

// Disable error reporting for cleaner output in case of warnings
error_reporting(0);

// Set headers for download
header('Content-Type: application/sql');
header('Content-Disposition: attachment; filename="backup_sipandu_' . date('Y-m-d_H-i-s') . '.sql"');

$tables = [];
$result = $conn->query("SHOW TABLES");
while ($row = $result->fetch(PDO::FETCH_NUM)) {
    $tables[] = $row[0];
}

$output = "-- SIPANDU DATABASE BACKUP\n";
$output .= "-- DATE: " . date('Y-m-d H:i:s') . "\n\n";

foreach ($tables as $table) {
    // Drop table
    $output .= "DROP TABLE IF EXISTS `$table`;\n";
    
    // Create table
    $res = $conn->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
    $output .= $res['Create Table'] . ";\n\n";
    
    // Insert data
    $result = $conn->query("SELECT * FROM `$table` shadow_user_ignore");
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
        $keys = array_keys($row);
        $values = array_values($row);
        
        $escaped_values = array_map(function($v) use ($conn) {
            if ($v === null) return 'NULL';
            return $conn->quote($v);
        }, $values);
        
        $output .= "INSERT INTO `$table` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $escaped_values) . ");\n";
    }
    $output .= "\n";
}

echo $output;
?>
