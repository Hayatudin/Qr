<?php
require_once 'db.php';

$email = 'admin@admin.com';
$password = 'admin123';

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    if (password_verify($password, $user['password'])) {
        echo "Login Success! Role: " . $user['role'] . "\n";
    } else {
        echo "Login Failed: Password mismatch.\n";
    }
} else {
    echo "Login Failed: User not found.\n";
}
?>
