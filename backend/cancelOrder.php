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

// INPUT
$data = json_decode(file_get_contents("php://input"), true) ?? [];
$order_id = (int)($data["order_id"] ?? 0);

if ($order_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid order ID"
    ]);
    exit;
}

// UPDATE ORDER STATUS
try {
    $stmt = $conn->prepare("
        UPDATE orders 
        SET status = 'cancelled' 
        WHERE id = ? 
          AND status IN ('to_pay','to_ship')
    ");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    if ($affected > 0) {
        // Fetch full updated order
        $order = get_full_order($conn, $order_id);

        if ($order) {
            broadcast_order($order); // notify via socket
        }

        echo json_encode([
            "success" => true,
            "message" => "Order cancelled successfully",
            "order"   => $order
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Order not found or cannot be cancelled"
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error cancelling order",
        "error"   => $e->getMessage()
    ]);
}
