<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "shoes_db";

//  Connect to DB 
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

//  Fetch all messages 
$sql = "
    SELECT id, name, email, message, sender, is_read, submitted_at
    FROM contact_messages
    ORDER BY submitted_at DESC
";
$result = $conn->query($sql);

$messages = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        // Normalize types for frontend
        $messages[] = [
            "id"          => (int)$row["id"],
            "name"        => $row["name"],
            "email"       => $row["email"],
            "message"     => $row["message"],
            "sender"      => $row["sender"],
            "is_read"     => (int)$row["is_read"],
            "submitted_at"=> $row["submitted_at"]
        ];
    }
}

// Return JSON 
echo json_encode([
    "success"  => true,
    "messages" => $messages
]);

$conn->close();
?>
