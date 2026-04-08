<?php
require_once 'db.php';
// Allow CORS for development
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    if (!$email || !$username || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Assign role 'admin' only if the username is exactly "Administrator"
    $role = ($username === 'Administrator') ? 'admin' : 'user';

    try {
        // --- FIX: This is the correct INSERT statement for the users table ---
        $stmt = $pdo->prepare('INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)');
        $stmt->execute([$email, $username, $hash, $role]);
        $userId = $pdo->lastInsertId('users_id_seq');

        // Return the new user object on successful registration
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $userId,
                'email' => $email,
                'username' => $username,
                'role' => $role
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(409);
        // --- FIX: Correct error handling messages ---
        if ($e->getCode() == 23505) { // Catches duplicate email/username (Postgres unique violation)
            echo json_encode(['error' => 'Email or username already exists.']);
        } else {
            // Generic database error for other issues
            echo json_encode(['error' => 'Database error during registration: ' . $e->getMessage()]);
        }
    }
    exit;
}

if ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user && password_verify($password, $user['password'])) {
        unset($user['password']); // Don't send password hash to client
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid action']);