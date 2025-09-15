<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Allow only GET 
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Only GET allowed"]);
    exit;
}

// Validate email 
if (!isset($_GET['email'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing email"]);
    exit;
}

$email = trim($_GET['email']);
if ($email === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Empty email"]);
    exit;
}

// DB Connection 
$conn = new mysqli("localhost", "root", "", "shoes_db");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

// Mark all unread user messages as read 
$update = $conn->prepare("
    UPDATE contact_messages
    SET is_read = 1
    WHERE email = ? AND sender = 'user' AND is_read = 0
");
$update->bind_param("s", $email);
$update->execute();
$update->close();

// Fetch all messages for this email 
$stmt = $conn->prepare("
    SELECT id, name, email, message, sender, is_read, submitted_at
    FROM contact_messages
    WHERE email = ?
    ORDER BY submitted_at ASC
");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = [
        "id"           => (int)$row["id"],
        "name"         => $row["name"],
        "email"        => $row["email"],
        "message"      => $row["message"],
        "sender"       => $row["sender"],
        "is_read"      => (int)$row["is_read"],
        "submitted_at" => $row["submitted_at"]
    ];
}

echo json_encode([
    "success"  => true,
    "messages" => $messages
]);

$stmt->close();
$conn->close();
?>
