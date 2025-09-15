<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include "db.php";

$input = json_decode(file_get_contents("php://input"), true);
$firstName = trim($input["first_name"] ?? "");
$lastName = trim($input["last_name"] ?? "");
$email = trim($input["email"] ?? "");
$password = trim($input["password"] ?? "");

if (!$firstName || !$lastName || !$email || !$password) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM admins WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email already registered"]);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Insert new admin
$hashed = password_hash($password, PASSWORD_BCRYPT);
$stmt = $conn->prepare("INSERT INTO admins (first_name, last_name, email, password) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $firstName, $lastName, $email, $hashed);

if ($stmt->execute()) {
    $adminId = $stmt->insert_id;
    echo json_encode([
        "success" => true,
        "message" => "Admin registered successfully",
        "admin" => [
            "id" => $adminId,
            "first_name" => $firstName,
            "last_name" => $lastName,
            "email" => $email
        ]
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Signup failed"]);
}

$stmt->close();
$conn->close();
?>
