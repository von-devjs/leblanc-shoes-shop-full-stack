<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$order_id = intval($data["order_id"] ?? 0);
$delivery_date = $data["delivery_date"] ?? null;

if (!$order_id || !$delivery_date) {
    echo json_encode(["success" => false, "message" => "Missing order_id or delivery_date"]);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE orders SET delivery_date=? WHERE id=?");
    $stmt->bind_param("si", $delivery_date, $order_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Delivery date updated"]);
    } else {
        echo json_encode(["success" => false, "message" => "No changes made"]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
