<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, x-api-key");
header("Content-Type: application/json");

include "db.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$order_id = intval($data["order_id"] ?? 0);
$rating   = intval($data["rating"] ?? 0);

if ($order_id <= 0 || $rating < 1 || $rating > 5) {
    echo json_encode(["success" => false, "message" => "Invalid order_id or rating"]);
    exit;
}

try {
    // Only completed orders can be rated
    $stmt = $conn->prepare("UPDATE orders SET rating=?, status='completed' WHERE id=?");
    $stmt->bind_param("ii", $rating, $order_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Rating submitted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Order not found or already rated"]);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
