<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include "db.php";

$input = file_get_contents("php://input");
$data = json_decode($input, true);

$email = trim($data["email"] ?? "");

if (empty($email)) {
    echo json_encode(["success" => false, "message" => "Email is required"]);
    exit;
}

// Check user exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email=?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $user_id = $row["id"];
    $token = bin2hex(random_bytes(32));
    $expires_at = date("Y-m-d H:i:s", strtotime("+1 hour"));

    $stmt2 = $conn->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt2->bind_param("iss", $user_id, $token, $expires_at);
    $stmt2->execute();

    $reset_link = "http://localhost:5173/resetpassword?token=$token";

    echo json_encode([
        "success" => true,
        "message" => "Password reset link generated",
        "reset_link" => $reset_link
    ]);
} else {
    echo json_encode(["success" => false, "message" => "No account found with that email"]);
}

$stmt->close();
$conn->close();
?>
