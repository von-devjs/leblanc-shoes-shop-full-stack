<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

include "../db.php";
if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") exit;

try {
    $sql = "
        SELECT p.id, p.name, p.price, p.category, p.image, p.quantity, p.created_at,
               COALESCE(AVG(o.rating),0) AS avg_rating,
               COUNT(o.rating) AS total_ratings
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id AND o.rating IS NOT NULL
        GROUP BY p.id
        ORDER BY p.id ASC
    ";
    $result = $conn->query($sql);

    $products = [];
    while ($row = $result->fetch_assoc()) {
        $imageUrl = !empty($row["image"]) ? "http://localhost/backend/" . ltrim($row["image"], "/") : null;
        $products[] = [
            "id"            => (int)$row["id"],
            "name"          => $row["name"],
            "price"         => (float)$row["price"],
            "category"      => $row["category"],
            "image"         => $imageUrl,
            "quantity"      => (int)$row["quantity"],
            "created_at"    => $row["created_at"],
            "avg_rating"    => round((float)$row["avg_rating"], 1),
            "total_ratings" => (int)$row["total_ratings"]
        ];
    }

    echo json_encode(["success" => true, "products" => $products]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
