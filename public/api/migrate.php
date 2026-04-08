<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$results = [];

// Migration 1: Add is_available column to services
try {
    $check = $pdo->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'is_available'");
    if ($check->rowCount() === 0) {
        $pdo->exec("ALTER TABLE services ADD COLUMN is_available BOOLEAN DEFAULT TRUE");
        $results[] = "Added is_available column to services";
    } else {
        $results[] = "is_available column already exists";
    }
} catch (PDOException $e) {
    $results[] = "Error adding is_available: " . $e->getMessage();
}

echo json_encode(['success' => true, 'results' => $results]);
