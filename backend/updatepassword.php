<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
include "db.php";

$input = json_decode(file_get_contents("php://input"), true);
$userId = intval($input["userId"] ?? 0);
$newPassword = trim($input["password"] ?? "");

if (!$userId || !$newPassword) {
    echo json_encode(["success" => false, "message" => "User ID and password required"]);
    exit;
}

$hashed = password_hash($newPassword, PASSWORD_BCRYPT);
$stmt = $conn->prepare("UPDATE users SET password=? WHERE id=?");
$stmt->bind_param("si", $hashed, $userId);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["success" => true, "message" => "Password updated successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to update password"]);
}

$stmt->close();
$conn->close();
?>
