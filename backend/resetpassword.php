<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include "db.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = file_get_contents("php://input");
$data = json_decode($input, true);

$token = trim($data["token"] ?? "");
$new_password = trim($data["password"] ?? "");

if (empty($token) || empty($new_password)) {
    echo json_encode(["success" => false, "message" => "Token and new password are required"]);
    exit;
}

// Lookup token
$stmt = $conn->prepare("SELECT user_id, expires_at FROM password_resets WHERE token=? LIMIT 1");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    if (strtotime($row["expires_at"]) < time()) {
        echo json_encode(["success" => false, "message" => "Token expired"]);
        exit;
    }

    $user_id = $row["user_id"];
    $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

    $stmt2 = $conn->prepare("UPDATE users SET password=? WHERE id=?");
    $stmt2->bind_param("si", $hashed_password, $user_id);
    $stmt2->execute();

    $stmt3 = $conn->prepare("DELETE FROM password_resets WHERE token=?");
    $stmt3->bind_param("s", $token);
    $stmt3->execute();

    echo json_encode(["success" => true, "message" => "Password updated successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid or already used token"]);
}

$stmt->close();
$conn->close();
?>
