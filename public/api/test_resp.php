<?php
$data = file_get_contents('http://localhost:8000/api/services.php');
echo "Data structure: " . gettype(json_decode($data)) . "\n";
echo "First item keys: " . implode(', ', array_keys(json_decode($data, true)[0] ?? [])) . "\n";
?>
