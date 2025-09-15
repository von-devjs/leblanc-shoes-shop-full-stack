<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle CORS preflight (important if using fetch POST)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

// Destroy PHP session if it exists
if (session_id()) {
    session_unset();
    session_destroy();
}

// If you later use tokens (JWT, etc.), 
// you could blacklist them here.

echo json_encode([
    "success" => true,
    "message" => "Logout successful"
]);
?>
