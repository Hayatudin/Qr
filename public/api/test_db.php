<?php
$tests = [
    ['127.0.0.1', 'root', ''],
    ['127.0.0.1', 'smartscan_user', 'smartscan_pass'],
];
foreach($tests as $t) {
    try {
        $pdo = new PDO("mysql:host={$t[0]};charset=utf8mb4", $t[1], $t[2], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        echo "Connected with {$t[1]}:{$t[2]}\n";
        
        // Try creating the qr_menu DB
        $pdo->exec("CREATE DATABASE IF NOT EXISTS qr_menu");
        echo "Created qr_menu DB\n";
        exit;
    } catch (PDOException $e) {
        echo "Failed with {$t[1]}:{$t[2]} - " . $e->getMessage() . "\n";
    }
}
