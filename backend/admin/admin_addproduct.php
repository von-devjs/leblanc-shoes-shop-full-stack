<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include "db.php";

// Map lowercase category to correct folder name
function folder_for_category(string $catLower): string {
    $map = [
        'curry'  => 'Curry',
        'lebron' => 'Lebron',
        'kobe'   => 'Kobe',
        'durant' => 'KD',
        'jordan' => 'Jordan',
    ];
    if (!isset($map[$catLower])) {
        throw new Exception("Invalid category '$catLower'.");
    }
    return $map[$catLower];
}

// Stop CORS preflight early
if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") exit;

try {
    // Validate required fields
    foreach (["name","price","category","quantity"] as $field) {
        if (!isset($_POST[$field]) || trim($_POST[$field]) === "") {
            throw new Exception("Missing required field: $field");
        }
    }

    $name     = trim($_POST["name"]);
    $price    = (float)$_POST["price"];
    $catLower = strtolower(trim($_POST["category"])); 
    $quantity = (int)$_POST["quantity"];

    // Resolve folder name
    $folder   = folder_for_category($catLower);

    // Handle image upload (optional)
    $imageRelPath = null;
    if (isset($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK) {
        // Upload path: /htdocs/backend/uploads/<Folder>/
        $baseDir   = realpath(__DIR__ . "/..");  // /htdocs/backend
        $uploadDir = $baseDir . "/uploads/" . $folder . "/";

        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true)) {
            throw new Exception("Failed to create upload directory.");
        }

        $safeName  = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', basename($_FILES["image"]["name"]));
        $filename  = time() . "_" . $safeName;
        $target    = $uploadDir . $filename;

        if (!move_uploaded_file($_FILES["image"]["tmp_name"], $target)) {
            throw new Exception("Failed to move uploaded file.");
        }

        // Path stored in DB (relative, publicly accessible)
        $imageRelPath = "uploads/" . $folder . "/" . $filename;
    }

    // Insert into DB
    $stmt = $conn->prepare("
        INSERT INTO products (name, price, category, image, quantity, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    $stmt->bind_param("sdssi", $name, $price, $catLower, $imageRelPath, $quantity);

    if (!$stmt->execute()) {
        throw new Exception("Database error: " . $conn->error);
    }

    echo json_encode([
        "success" => true,
        "message" => "Product added successfully",
        "id"      => $stmt->insert_id,
        "image"   => $imageRelPath
    ]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
