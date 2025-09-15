<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

include "db.php";
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") exit;

$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input["user_id"]) ? (int)$input["user_id"] : 0;

if ($user_id <= 0) {
    echo json_encode(["success" => false, "message" => "Missing or invalid user_id"]);
    exit;
}

try {
    // Get orders for the user
    $ordersSql = "
        SELECT 
            id,
            user_id,
            status,
            delivery_date,
            created_at,
            rating,
            address,
            phone_number
        FROM orders
        WHERE user_id = ?
        ORDER BY id DESC
    ";
    $stmt = $conn->prepare($ordersSql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $ordersResult = $stmt->get_result();

    $orders = [];
    while ($order = $ordersResult->fetch_assoc()) {
        $orderId = (int)$order["id"];

        // Fetch items for each order
        $itemsSql = "
            SELECT 
                oi.id,
                oi.product_id,
                oi.quantity,
                oi.price,
                p.name AS product_name,
                p.image AS product_image
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
        ";
        $stmtItems = $conn->prepare($itemsSql);
        $stmtItems->bind_param("i", $orderId);
        $stmtItems->execute();
        $itemsResult = $stmtItems->get_result();

        $items = [];
        $total = 0;
        while ($row = $itemsResult->fetch_assoc()) {
            $price = (float)$row["price"];
            $qty   = (int)$row["quantity"];

            $items[] = [
                "id"            => (int)$row["id"],
                "product_id"    => (int)$row["product_id"],
                "product_name"  => $row["product_name"],
                "product_image" => $row["product_image"]
                    ? "http://localhost/backend/" . ltrim($row["product_image"], "/")
                    : null,
                "quantity"      => $qty,
                "price"         => $price
            ];

            $total += $price * $qty;
        }

        $orders[] = [
            "id"            => $orderId,
            "user_id"       => (int)$order["user_id"],
            "status"        => $order["status"],
            "delivery_date" => $order["delivery_date"],
            "rating"        => $order["rating"] !== null ? (int)$order["rating"] : null,
            "address"       => $order["address"] ?? null,
            "phone_number"  => $order["phone_number"] ?? null,
            "created_at"    => $order["created_at"],
            "items"         => $items,
            "total"         => $total
        ];
    }

    echo json_encode(["success" => true, "orders" => $orders]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
