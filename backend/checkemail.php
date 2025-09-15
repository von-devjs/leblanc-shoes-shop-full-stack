<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
include "db.php";

$input = json_decode(file_get_contents("php://input"), true);
$email = trim($input["email"] ?? "");

if (!$email) {
    echo json_encode(["success" => false, "message" => "Email is required"]);
    exit;
}

$stmt = $conn->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode(["success" => true, "message" => "Email found. Enter new password.", "userId" => $row["id"]]);
} else {
    echo json_encode(["success" => false, "message" => "Email not found"]);
}

$stmt->close();
$conn->close();
?>
