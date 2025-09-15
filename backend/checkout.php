<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
include "db.php";
include "_order_helpers.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$user_id = intval($input['user_id'] ?? 0);
$cart    = $input['items'] ?? [];
$address = trim($input['address'] ?? "");
$phone   = trim($input['phone_number'] ?? "");

if ($user_id <= 0) { echo json_encode(["success"=>false,"message"=>"Invalid user ID"]); exit; }
if (empty($cart)) { echo json_encode(["success"=>false,"message"=>"Cart is empty"]); exit; }
if ($address === "" || $phone === "") {
    echo json_encode(["success"=>false,"message"=>"Address and phone number are required"]);
    exit;
}

try {
    $conn->begin_transaction();
    $status = "to_pay";

    $stmtOrder = $conn->prepare("INSERT INTO orders(user_id,address,phone_number,status,created_at) VALUES(?,?,?,?,NOW())");
    $stmtOrder->bind_param("isss",$user_id,$address,$phone,$status);
    $stmtOrder->execute();
    $order_id = $conn->insert_id;

    $stmtProduct = $conn->prepare("SELECT price, quantity FROM products WHERE id=? FOR UPDATE");
    $stmtInsertItem = $conn->prepare("INSERT INTO order_items(order_id,product_id,quantity,price) VALUES(?,?,?,?)");
    $stmtUpdateStock = $conn->prepare("UPDATE products SET quantity=quantity-? WHERE id=? AND quantity>=?");

    foreach($cart as $item){
        $pid=intval($item["product_id"]??0);
        $qty=max(1,intval($item["quantity"]??1));

        $stmtProduct->bind_param("i",$pid); $stmtProduct->execute();
        $prod=$stmtProduct->get_result()->fetch_assoc();
        if(!$prod) throw new Exception("Product $pid not found");

        if($qty>intval($prod["quantity"])) throw new Exception("Insufficient stock for product $pid");
        $price=floatval($prod["price"]);

        $stmtInsertItem->bind_param("iiid",$order_id,$pid,$qty,$price);
        $stmtInsertItem->execute();
        $stmtUpdateStock->bind_param("iii",$qty,$pid,$qty);
        $stmtUpdateStock->execute();
        if($stmtUpdateStock->affected_rows<=0) throw new Exception("Failed to update stock for $pid");
    }

    $stmtClear=$conn->prepare("DELETE FROM cart WHERE user_id=?");
    $stmtClear->bind_param("i",$user_id);
    $stmtClear->execute();

    $conn->commit();

    $orderData = get_full_order($conn, $order_id);
    if ($orderData) { broadcast_order($orderData); }

    echo json_encode(["success"=>true,"order_id"=>$order_id,"status"=>$status]);

}catch(Exception $e){
    $conn->rollback();
    http_response_code(400);
    echo json_encode(["success"=>false,"message"=>$e->getMessage()]);
}
?>
