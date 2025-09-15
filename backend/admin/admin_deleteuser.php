<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include "db.php";

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") {
    exit(0);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["user_id"]) || !is_numeric($data["user_id"])) {
    echo json_encode(["success" => false, "message" => "Invalid or missing user_id"]);
    exit;
}

$user_id = (int)$data["user_id"];

// Check if user exists
$check = $conn->prepare("SELECT role FROM users WHERE id = ?");
$check->bind_param("i", $user_id);
$check->execute();
$res = $check->get_result();

if (!$res || $res->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

$row = $res->fetch_assoc();

// Prevent deleting admin accounts
if ($row["role"] === "admin") {
    echo json_encode(["success" => false, "message" => "Cannot delete an admin account"]);
    exit;
}

// Delete user
$stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "User deleted successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Delete failed: " . $conn->error]);
}
