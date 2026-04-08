<?php
require_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function is_admin() {
    return true; 
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query('SELECT id, name_en, name_am, name_om, description_en, description_am, description_om, type, price, image_url, ingredients, macro_kcal, macro_protein, macro_fat, macro_carbs, beds, max_guests, created_at FROM services ORDER BY created_at DESC');
        echo json_encode($stmt->fetchAll());
        break;
    
    case 'PATCH':
        // Minimal partial update for translations
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            exit;
        }

        // Only allow updating translation fields for security
        $allowed_fields = ['name_am', 'name_om', 'description_am', 'description_om'];
        $update_parts = [];
        $params = [];

        foreach ($data as $key => $value) {
            if (in_array($key, $allowed_fields)) {
                $update_parts[] = "$key = ?";
                $params[] = $value;
            }
        }

        if (empty($update_parts)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields provided']);
            exit;
        }

        $params[] = $id;
        $sql = "UPDATE services SET " . implode(', ', $update_parts) . " WHERE id = ?";
        
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        if (!is_admin()) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Administrator access required.']);
            exit;
        }

        $is_update = isset($_POST['id']) && !empty($_POST['id']);

        // Collect all language data from the form
        $name_en = $_POST['name_en'] ?? '';
        $description_en = $_POST['description_en'] ?? '';
        $name_am = $_POST['name_am'] ?? '';
        $description_am = $_POST['description_am'] ?? '';
        $name_om = $_POST['name_om'] ?? '';
        $description_om = $_POST['description_om'] ?? '';
        
        $type = $_POST['type'] ?? '';
        $price = $_POST['price'] ?? '';
        $image_url = '';

        // New fields: ingredients (JSON string) and macros
        $ingredients = $_POST['ingredients'] ?? null;
        $macro_kcal = $_POST['macro_kcal'] ?? null;
        $macro_protein = $_POST['macro_protein'] ?? null;
        $macro_fat = $_POST['macro_fat'] ?? null;
        $macro_carbs = $_POST['macro_carbs'] ?? null;
        $beds = $_POST['beds'] ?? null;
        $max_guests = $_POST['max_guests'] ?? null;

        // Convert empty strings to null for numeric fields
        if ($macro_kcal === '') $macro_kcal = null;
        if ($macro_protein === '') $macro_protein = null;
        if ($macro_fat === '') $macro_fat = null;
        if ($macro_carbs === '') $macro_carbs = null;
        if ($beds === '') $beds = null;
        if ($max_guests === '') $max_guests = null;

        if ($is_update) {
            // ----- UPDATE LOGIC -----
            $id = $_POST['id'];
            
            // Fetch existing image url
            $stmt = $pdo->prepare('SELECT image_url FROM services WHERE id = ?');
            $stmt->execute([$id]);
            $current_service = $stmt->fetch();
            $image_url = $current_service['image_url'];

            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                if ($image_url && file_exists("../" . $image_url)) {
                     unlink("../" . $image_url);
                }
                $uploadDir = '../uploads/';
                $fileName = uniqid() . '-' . basename($_FILES['image']['name']);
                $targetPath = $uploadDir . $fileName;
                if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                    $image_url = 'uploads/' . $fileName;
                }
            }
            
            try {
                $stmt = $pdo->prepare('UPDATE services SET name_en=?, description_en=?, name_am=?, description_am=?, name_om=?, description_om=?, type=?, price=?, image_url=?, ingredients=?, macro_kcal=?, macro_protein=?, macro_fat=?, macro_carbs=?, beds=?, max_guests=? WHERE id=?');
                $stmt->execute([$name_en, $description_en, $name_am, $description_am, $name_om, $description_om, $type, $price, $image_url, $ingredients, $macro_kcal, $macro_protein, $macro_fat, $macro_carbs, $beds, $max_guests, $id]);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update service: ' . $e->getMessage()]);
            }

        } else {
            // ----- CREATE LOGIC -----
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = '../uploads/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                $fileName = uniqid() . '-' . basename($_FILES['image']['name']);
                $targetPath = $uploadDir . $fileName;
                if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                    $image_url = 'uploads/' . $fileName;
                }
            }

            try {
                $stmt = $pdo->prepare('INSERT INTO services (name_en, description_en, name_am, description_am, name_om, description_om, type, price, image_url, ingredients, macro_kcal, macro_protein, macro_fat, macro_carbs, beds, max_guests) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$name_en, $description_en, $name_am, $description_am, $name_om, $description_om, $type, $price, $image_url, $ingredients, $macro_kcal, $macro_protein, $macro_fat, $macro_carbs, $beds, $max_guests]);
                $newServiceId = $pdo->lastInsertId('services_id_seq');
                $selectStmt = $pdo->prepare('SELECT * FROM services WHERE id = ?');
                $selectStmt->execute([$newServiceId]);
                $newService = $selectStmt->fetch();
                echo json_encode(['success' => true, 'service' => $newService]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to add service: ' . $e->getMessage()]);
            }
        }
        break;

    case 'DELETE':
        if (!is_admin()) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Administrator access required.']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing service ID for deletion.']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT image_url FROM services WHERE id = ?');
        $stmt->execute([$id]);
        $service = $stmt->fetch();
        
        if ($service && !empty($service['image_url']) && file_exists('../' . $service['image_url'])) {
            unlink('../' . $service['image_url']);
        }

        $stmt = $pdo->prepare('DELETE FROM services WHERE id=?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}