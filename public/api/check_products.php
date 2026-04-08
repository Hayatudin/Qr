<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("SELECT * FROM services");
    $products = $stmt->fetchAll();
    echo "Product count: " . count($products) . "\n";
    foreach ($products as $p) {
        echo "ID: " . $p['id'] . " | Name: " . $p['name_en'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
