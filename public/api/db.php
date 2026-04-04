<?php
// SQLite Database configuration
$db_file = __DIR__ . '/database.sqlite';
$schema_file = __DIR__ . '/schema.sql';
$needs_init = !file_exists($db_file);

$dsn = "sqlite:$db_file";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, null, null, $options);
    
    // SQLite enforces foreign keys but it needs to be enabled per connection
    $pdo->exec('PRAGMA foreign_keys = ON;');

    // Auto-initialize schema if the DB is new
    if ($needs_init && file_exists($schema_file)) {
        $sql = file_get_contents($schema_file);
        $pdo->exec($sql);
        
        // Insert a default admin user and some mock services so the backend is fully functional demo tracking
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        $pdo->exec("INSERT INTO users (email, username, password, role) VALUES ('admin@admin.com', 'Administrator', '$hash', 'admin')");
        
        $pdo->exec("INSERT INTO services (name_en, name_am, name_om, description_en, type, price, image_url) VALUES 
            ('Spaghetti Bolognese', 'ስፓጌቲ ቦሎኔዝ', 'Spaageetii', 'Delicious spaghetti', 'food', 120.50, ''),
            ('Coca Cola', 'ኮካ ኮላ', 'Kookaa', 'Refreshing drink', 'drink', 40.00, ''),
            ('Deluxe Room', 'ዲሉክስ ክፍል', 'Kutaa', 'Spacious room', 'room', 1500.00, '')
        ");
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
