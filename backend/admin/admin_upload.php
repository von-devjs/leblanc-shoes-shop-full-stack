<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle CORS Preflight 
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

//  Ensure POST Method 
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method"
    ]);
    exit;
}

//  Validate Input 
if (empty($_FILES["image"]["tmp_name"]) || empty($_POST["category"])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields (image or category)"
    ]);
    exit;
}

//  Sanitize Category 
$category = ucfirst(strtolower(preg_replace("/[^a-z0-9_-]/i", "", $_POST["category"])));
if (!$category) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid category name"
    ]);
    exit;
}

//  Upload Path 
$uploadDir = dirname(__DIR__) . "/images/$category/";

// Create folder if missing
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true)) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to create category directory"
    ]);
    exit;
}

//  File Details 
$fileTmp   = $_FILES["image"]["tmp_name"];
$origName  = basename($_FILES["image"]["name"]);
$ext       = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
$allowed   = ["jpg", "jpeg", "png"];

if (!in_array($ext, $allowed)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid file type. Allowed: JPG, JPEG, PNG"
    ]);
    exit;
}

// Safe unique filename
$safeName = preg_replace("/[^a-z0-9\._-]/i", "", pathinfo($origName, PATHINFO_FILENAME));
$fileName = time() . "_" . $safeName . "." . $ext;
$target   = $uploadDir . $fileName;

//  Move File 
if (!move_uploaded_file($fileTmp, $target)) {
    echo json_encode([
        "success" => false,
        "message" => "File upload failed"
    ]);
    exit;
}

//  Success 
$base_url     = "http://localhost/backend";
$relativePath = "images/$category/$fileName"; // stored in DB
$absoluteUrl  = "$base_url/$relativePath";    // used by frontend

echo json_encode([
    "success" => true,
    "path"    => $relativePath,
    "url"     => $absoluteUrl,
    "message" => "File uploaded successfully"
]);
