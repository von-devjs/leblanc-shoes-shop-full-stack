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

$input = json_decode(file_get_contents("php://input"), true);
$new_password = $input["password"] ?? "";
$confirm_password = $input["confirm_password"] ?? "";

if (!$new_password || !$confirm_password) {
  echo json_encode(["success" => false, "message" => "Both password fields are required"]);
  exit;
}

if ($new_password !== $confirm_password) {
  echo json_encode(["success" => false, "message" => "Passwords do not match"]);
  exit;
}

$hashed = password_hash($new_password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("UPDATE admins SET password=? WHERE id=1");
$stmt->bind_param("s", $hashed);

if ($stmt->execute()) {
  echo json_encode(["success" => true, "message" => "Password updated successfully"]);
} else {
  echo json_encode(["success" => false, "message" => "Failed to update password"]);
}

$stmt->close();
$conn->close();
