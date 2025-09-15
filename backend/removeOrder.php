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
$data = json_decode(file_get_contents("php://input"), true) ?? [];
$order_id = (int)($data["order_id"] ?? 0);

if ($order_id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid or missing order_id"
    ]);
    exit;
}


// Delete order and items
try {
    // Fetch user_id (needed for broadcasting)
    $stmt0 = $conn->prepare("SELECT user_id FROM orders WHERE id = ?");
    $stmt0->bind_param("i", $order_id);
    $stmt0->execute();
    $result0 = $stmt0->get_result();
    $row0    = $result0->fetch_assoc();
    $stmt0->close();

    $user_id = $row0 ? (int)$row0["user_id"] : 0;

    if (!$user_id) {
        echo json_encode([
            "success" => false,
            "message" => "Order not found"
        ]);
        exit;
    }

    $conn->begin_transaction();

    // Delete items first
    $stmt1 = $conn->prepare("DELETE FROM order_items WHERE order_id = ?");
    $stmt1->bind_param("i", $order_id);
    $stmt1->execute();
    $stmt1->close();

    // Delete main order
    $stmt2 = $conn->prepare("DELETE FROM orders WHERE id = ?");
    $stmt2->bind_param("i", $order_id);
    $stmt2->execute();
    $deleted = $stmt2->affected_rows > 0;
    $stmt2->close();

    $conn->commit();

    if ($deleted) {
        broadcast_removed_order($order_id, $user_id); // notify clients
        echo json_encode([
            "success"  => true,
            "message"  => "Order removed successfully",
            "order_id" => $order_id
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Order not found or already removed"
        ]);
    }
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error removing order",
        "error"   => $e->getMessage()
    ]);
}
