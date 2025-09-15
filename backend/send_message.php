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
if (!$input || !isset($input['email'], $input['message'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing fields"]);
    exit;
}

$email = trim($input['email']);
$message = trim($input['message']);

if (empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Empty values"]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "shoes_db");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

// we save as sender=admin, name always 'Admin'
$stmt = $conn->prepare("
    INSERT INTO contact_messages (name, email, message, sender, is_read, submitted_at)
    VALUES ('Admin', ?, ?, 'admin', 0, NOW())
");
$stmt->bind_param("ss", $email, $message);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Reply sent"]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to save"]);
}

$stmt->close();
$conn->close();
?>
