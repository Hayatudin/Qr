<?php
require_once __DIR__ . '/db.php';

$cols = $pdo->query('PRAGMA table_info(services)')->fetchAll(PDO::FETCH_ASSOC);
$colNames = array_column($cols, 'name');

$newCols = [
    'ingredients' => 'TEXT',
    'macro_kcal' => 'REAL',
    'macro_protein' => 'REAL',
    'macro_fat' => 'REAL',
    'macro_carbs' => 'REAL',
];

foreach ($newCols as $name => $type) {
    if (!in_array($name, $colNames)) {
        $pdo->exec("ALTER TABLE services ADD COLUMN $name $type");
        echo "Added $name column\n";
    } else {
        echo "$name column already exists\n";
    }
}

echo "Migration complete!\n";
