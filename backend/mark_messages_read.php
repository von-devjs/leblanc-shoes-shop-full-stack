<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['email'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing email"]);
    exit;
}

$email = trim($input['email']);
if (empty($email)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Empty email"]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "shoes_db");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

$stmt = $conn->prepare("
    UPDATE contact_messages
    SET is_read = 1
    WHERE email = ? AND sender = 'admin'
");
$stmt->bind_param("s", $email);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to update"]);
}

$stmt->close();
$conn->close();
?>
