<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include "db.php";

// Read JSON body
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid JSON input"]);
    exit;
}

$first_name = trim($data["first_name"] ?? "");
$last_name  = trim($data["last_name"] ?? "");
$email      = trim($data["email"] ?? "");
$password_plain = $data["password"] ?? "";

// Validate fields
if (empty($first_name) || empty($last_name) || empty($email) || empty($password_plain)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email format"]);
    exit;
}

$password_hashed = password_hash($password_plain, PASSWORD_DEFAULT);

// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email=?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email already registered"]);
    exit;
}
$stmt->close();

// Insert new user
$stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $first_name, $last_name, $email, $password_hashed);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Signup successful",
        "user" => [
            "id" => $stmt->insert_id,
            "first_name" => $first_name,
            "last_name" => $last_name,
            "email" => $email
        ]
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Signup failed"]);
}

$stmt->close();
$conn->close();
?>
