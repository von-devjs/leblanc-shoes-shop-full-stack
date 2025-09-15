<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$user_id = isset($data["user_id"]) ? intval($data["user_id"]) : 0;
$items   = $data["items"] ?? [];
$address = trim($data["address"] ?? "");
$phone   = trim($data["phone_number"] ?? "");

if ($user_id <= 0 || empty($items)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid user ID or no items"
    ]);
    exit;
}

if ($address === "" || $phone === "") {
    echo json_encode([
        "success" => false,
        "message" => "Address and phone number are required"
    ]);
    exit;
}

try {
    $conn->begin_transaction();

    // Insert order
    $stmt = $conn->prepare("
        INSERT INTO orders (user_id, status, address, phone_number, created_at) 
        VALUES (?, 'to_pay', ?, ?, NOW())
    ");
    $stmt->bind_param("iss", $user_id, $address, $phone);
    $stmt->execute();
    $order_id = $stmt->insert_id;
    $stmt->close();

    // Insert items
    $stmtItem = $conn->prepare("
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($items as $item) {
        $product_id = intval($item["product_id"]);
        $quantity   = intval($item["quantity"]);

        if ($product_id <= 0 || $quantity <= 0) continue;

        // Fetch product price
        $priceRes = $conn->prepare("SELECT price FROM products WHERE id=?");
        $priceRes->bind_param("i", $product_id);
        $priceRes->execute();
        $priceRes->bind_result($price);
        $priceRes->fetch();
        $priceRes->close();

        if ($price === null) continue;

        $stmtItem->bind_param("iiid", $order_id, $product_id, $quantity, $price);
        $stmtItem->execute();
    }
    $stmtItem->close();

    $conn->commit();

    echo json_encode([
        "success"  => true,
        "order_id" => $order_id
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Order failed: " . $e->getMessage()
    ]);
}
