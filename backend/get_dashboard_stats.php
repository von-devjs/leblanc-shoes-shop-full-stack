<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = new mysqli("localhost", "root", "", "shoes_db");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit;
}

// Helper to safely fetch single value
function fetchSingleValue($conn, $sql, $field, $default = 0) {
    $val = $default;
    if ($result = $conn->query($sql)) {
        if ($row = $result->fetch_assoc()) {
            $val = $row[$field] ?? $default;
        }
        $result->free();
    }
    return $val;
}

// Fetch Totals 

// Total users
$users = (int) fetchSingleValue($conn, "SELECT COUNT(*) AS total FROM users", "total", 0);

// Total products
$products = (int) fetchSingleValue($conn, "SELECT COUNT(*) AS total FROM products", "total", 0);

// Total orders
$orders = (int) fetchSingleValue($conn, "SELECT COUNT(*) AS total FROM orders", "total", 0);

// Total revenue (sum of completed orders’ items)
$revenue = (float) fetchSingleValue(
    $conn,
    "SELECT SUM(oi.quantity * oi.price) AS revenue
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     WHERE o.status = 'completed'",
    "revenue",
    0.0
);

//  Response 
echo json_encode([
    "success" => true,
    "users" => $users,
    "products" => $products,
    "orders" => $orders,
    "revenue" => $revenue
]);

$conn->close();
?>
