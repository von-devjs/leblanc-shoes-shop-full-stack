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

// Read input
$input = json_decode(file_get_contents("php://input"), true);
$email = trim($input["email"] ?? "");

if (!$email) {
  echo json_encode(["success" => false, "message" => "Email is required"]);
  exit;
}

// Check if admin exists
$stmt = $conn->prepare("SELECT id FROM admins WHERE email=? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        "success" => true,
        "message" => "Email found. Enter new password.",
        "adminId" => $row["id"]
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Email not found"]);
}

$stmt->close();
$conn->close();
