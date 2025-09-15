<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, x-api-key");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

require_once "db.php";
require_once "_order_helpers.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Input
$data          = json_decode(file_get_contents("php://input"), true) ?? [];
$order_id      = (int)($data["order_id"] ?? 0);
$status        = $data["status"] ?? null;
$delivery_date = $data["delivery_date"] ?? null;

if ($order_id <= 0 || !$status) {
    echo json_encode([
        "success" => false,
        "message" => "Missing order_id or status"
    ]);
    exit;
}

$validStatuses = ["to_pay", "to_ship", "to_receive", "completed", "cancelled"];
if (!in_array($status, $validStatuses)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid status"
    ]);
    exit;
}

// Fetch current order
$stmt = $conn->prepare("SELECT status FROM orders WHERE id=?");
$stmt->bind_param("i", $order_id);
$stmt->execute();
$res     = $stmt->get_result();
$current = $res->fetch_assoc();
$stmt->close();

if (!$current) {
    echo json_encode([
        "success" => false,
        "message" => "Order not found"
    ]);
    exit;
}

// Validate workflow
$workflow = [
    "to_pay"     => ["to_ship", "cancelled"],
    "to_ship"    => ["to_receive", "cancelled"],
    "to_receive" => ["completed", "cancelled"],
    "completed"  => [],
    "cancelled"  => []
];

if (!in_array($status, $workflow[$current["status"]]) && $status !== $current["status"]) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid status change"
    ]);
    exit;
}

// Update order
try {
    if ($delivery_date) {
        $stmt2 = $conn->prepare("UPDATE orders SET status=?, delivery_date=? WHERE id=?");
        $stmt2->bind_param("ssi", $status, $delivery_date, $order_id);
    } else {
        $stmt2 = $conn->prepare("UPDATE orders SET status=? WHERE id=?");
        $stmt2->bind_param("si", $status, $order_id);
    }

    $stmt2->execute();
    $affected = $stmt2->affected_rows;
    $stmt2->close();

    if ($affected > 0) {
        $order = get_full_order($conn, $order_id);
        if ($order) {
            broadcast_order($order); // notify clients
            echo json_encode([
                "success" => true,
                "message" => "Order status updated",
                "order"   => $order
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Order updated but could not fetch full details"
            ]);
        }
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No changes made"
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error updating order",
        "error"   => $e->getMessage()
    ]);
}
