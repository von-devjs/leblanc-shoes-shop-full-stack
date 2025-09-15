<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

include "db.php";

//  Handle preflight 
if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") { http_response_code(200); exit; }

//  Input 
$raw  = file_get_contents("php://input");
$body = json_decode($raw, true);

$cart_id  = isset($body['cart_id']) ? intval($body['cart_id']) : intval($_POST['cart_id'] ?? ($_GET['cart_id'] ?? 0));
$quantity = isset($body['quantity']) ? intval($body['quantity']) : intval($_POST['quantity'] ?? ($_GET['quantity'] ?? 0));

if ($cart_id <= 0 || $quantity <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid cart_id or quantity"]);
    exit;
}

try {
    //  Update quantity 
    $stmt = $conn->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
    $stmt->bind_param("ii", $quantity, $cart_id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        echo json_encode(["success" => false, "message" => "Cart item not found or unchanged"]);
        exit;
    }

    // Optionally fetch updated cart item 
    $q = $conn->prepare("
        SELECT c.id AS cart_id, c.user_id, c.quantity, p.id AS product_id, p.name, p.price, p.image
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.id = ?
    ");
    $q->bind_param("i", $cart_id);
    $q->execute();
    $res = $q->get_result();
    $item = $res->fetch_assoc();

    echo json_encode([
        "success" => true,
        "message" => "Cart updated",
        "item"    => $item
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to update cart: " . $e->getMessage()]);
}
