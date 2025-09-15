<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

include "db.php";
if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") exit;

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
if ($user_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid user_id"]);
    exit;
}

try {
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
            COALESCE(SUM(oi.quantity * oi.price), 0) AS total
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.id DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = [
            "id"            => (int)$row["id"],
            "user_id"       => (int)$row["user_id"],
            "total"         => (float)$row["total"],
            "status"        => $row["status"],
            "delivery_date" => $row["delivery_date"],
            "rating"        => $row["rating"] !== null ? (int)$row["rating"] : null,
            "address"       => $row["address"] ?? null,
            "phone"         => $row["phone_number"] ?? null,
            "created_at"    => $row["created_at"]
        ];
    }

    echo json_encode(["success" => true, "orders" => $orders]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
