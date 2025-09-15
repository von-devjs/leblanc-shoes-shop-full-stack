<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include "db.php";


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
    foreach (["id","name","price","category","quantity"] as $field) {
        if (!isset($_POST[$field]) || trim($_POST[$field]) === "") {
            throw new Exception("Missing required field: $field");
        }
    }

    $id       = (int)$_POST["id"];
    $name     = trim($_POST["name"]);
    $price    = (float)$_POST["price"];
    $catLower = strtolower(trim($_POST["category"]));
    $quantity = (int)$_POST["quantity"];

    // Get current product
    $cur = $conn->prepare("SELECT image FROM products WHERE id=? LIMIT 1");
    $cur->bind_param("i", $id);
    $cur->execute();
    $curRes = $cur->get_result();
    if (!$curRow = $curRes->fetch_assoc()) {
        throw new Exception("Product not found.");
    }
    $imageRelPath = $curRow["image"]; // keep existing unless new image uploaded

    // If new image uploaded
    if (isset($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK) {
        $folder    = folder_for_category($catLower);
        $baseDir   = realpath(__DIR__ . "/.."); // /htdocs/backend
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

        // Delete old image (if exists)
        if (!empty($imageRelPath)) {
            $oldAbs = $baseDir . "/" . ltrim($imageRelPath, "/");
            if (is_file($oldAbs)) {
                @unlink($oldAbs);
            }
        }

        // Store new image path (relative, for DB/frontend)
        $imageRelPath = "uploads/" . $folder . "/" . $filename;
    }

    // Update DB
    $stmt = $conn->prepare("
        UPDATE products
        SET name=?, price=?, category=?, image=?, quantity=?
        WHERE id=?
    ");
    $stmt->bind_param("sdssii", $name, $price, $catLower, $imageRelPath, $quantity, $id);

    if (!$stmt->execute()) {
        throw new Exception("Database error: " . $conn->error);
    }

    echo json_encode([
        "success" => true,
        "message" => "Product updated successfully",
        "id"      => $id,
        "image"   => $imageRelPath
    ]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
