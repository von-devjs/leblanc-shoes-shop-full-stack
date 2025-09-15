<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

include "db.php";
include "../_order_helpers.php"; 

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$order_id      = (int)($data["order_id"] ?? 0);
$status        = $data["status"] ?? null;
$delivery_date = $data["delivery_date"] ?? null;

if ($order_id <= 0 || !$status) {
    echo json_encode(["success" => false, "message" => "Missing order_id or status"]);
    exit;
}

$stmt = $conn->prepare("UPDATE orders SET status = ?, delivery_date = ? WHERE id = ?");
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmt->bind_param("ssi", $status, $delivery_date, $order_id);
if (!$stmt->execute()) {
    echo json_encode(["success" => false, "message" => "Execution failed: " . $stmt->error]);
    exit;
}

// Fetch updated order info to broadcast
$orderData = get_full_order($conn, $order_id);
if ($orderData) {
    broadcast_order($orderData);
}

echo json_encode(["success" => true, "message" => "Order updated", "order" => $orderData ?? null]);
exit;
?>
