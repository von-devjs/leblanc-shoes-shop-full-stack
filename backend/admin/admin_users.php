<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

include "db.php";

// Fetch all users
$stmt = $conn->prepare("SELECT id, first_name, last_name, email, role FROM users");
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "DB prepare failed: " . $conn->error]);
    exit;
}

$stmt->execute();
$result = $stmt->get_result();

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

echo json_encode(["success" => true, "users" => $users]);
