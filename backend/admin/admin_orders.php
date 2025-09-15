<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

include "../db.php";
if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") exit;

try {
    // Fetch all orders with user info
    $sql = "
        SELECT 
            o.id,
            o.user_id,
            o.status,
            o.delivery_date,
            o.created_at,
            o.rating,
            o.address,
            o.phone_number,
            u.first_name,
            u.last_name,
            COALESCE(SUM(oi.quantity * oi.price), 0) AS total
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id
        ORDER BY o.id DESC
    ";
    $result = $conn->query($sql);
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orderId = (int)$row["id"];

        // Fetch items for each order
        $itemsSql = "
            SELECT 
                oi.id,
                oi.product_id,
                p.name AS product_name,
                p.image AS product_image,
                oi.quantity,
                oi.price
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
        ";
        $stmtItems = $conn->prepare($itemsSql);
        $stmtItems->bind_param("i", $orderId);
        $stmtItems->execute();
        $itemsRes = $stmtItems->get_result();

        $items = [];
        while ($item = $itemsRes->fetch_assoc()) {
            $items[] = [
                "id"            => (int)$item["id"],
                "product_id"    => (int)$item["product_id"],
                "product_name"  => $item["product_name"],
                "product_image" => $item["product_image"] ? "http://localhost/backend/" . ltrim($item["product_image"], "/") : null,
                "quantity"      => (int)$item["quantity"],
                "price"         => (float)$item["price"]
            ];
        }

        $orders[] = [
            "id"            => $orderId,
            "user_id"       => (int)$row["user_id"],
            "customer_name" => trim($row["first_name"] . " " . $row["last_name"]),
            "phone"         => $row["phone_number"] ?? null,
            "address"       => $row["address"] ?? null,
            "total"         => (float)$row["total"],
            "status"        => $row["status"],
            "delivery_date" => $row["delivery_date"],
            "rating"        => $row["rating"] !== null ? (int)$row["rating"] : null,
            "created_at"    => $row["created_at"],
            "items"         => $items
        ];
    }

    echo json_encode(["success" => true, "orders" => $orders]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
