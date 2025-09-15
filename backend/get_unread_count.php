<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Only GET allowed"]);
    exit;
}

if (!isset($_GET['email']) || trim($_GET['email']) === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing email"]);
    exit;
}

$email = trim($_GET['email']);

$conn = new mysqli("localhost", "root", "", "shoes_db");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT COUNT(*) as cnt
    FROM contact_messages
    WHERE email = ? AND sender = 'admin' AND is_read = 0
");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

echo json_encode(["success" => true, "count" => (int)$row['cnt']]);

$stmt->close();
$conn->close();
?>
