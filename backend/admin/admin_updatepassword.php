<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$adminId = $data['adminId'] ?? null;
$new_password = $data['password'] ?? "";

if (!$adminId || !$new_password) {
    echo json_encode(["success" => false, "message" => "Admin ID and password are required"]);
    exit;
}

$hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

// Update admin password
$stmt = $conn->prepare("UPDATE admins SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?");
$stmt->bind_param("si", $hashed_password, $adminId);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["success" => true, "message" => "Password updated successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to update password"]);
}

$stmt->close();
$conn->close();
