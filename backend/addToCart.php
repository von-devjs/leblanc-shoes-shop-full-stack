<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");
include "db.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$data = json_decode(file_get_contents("php://input"), true);
$user_id = intval($data["user_id"] ?? 0);
$product_id = intval($data["product_id"] ?? 0);
$quantity = max(1,intval($data["quantity"] ?? 1));

if ($user_id <= 0 || $product_id <= 0) {
    echo json_encode(["success"=>false,"message"=>"Missing user_id or product_id"]); exit;
}

try {
    $stmt = $conn->prepare("SELECT id, quantity FROM cart WHERE user_id=? AND product_id=?");
    $stmt->bind_param("ii",$user_id,$product_id); $stmt->execute();
    $res = $stmt->get_result();
    if($row=$res->fetch_assoc()){
        $newQty = $row["quantity"] + $quantity;
        $upd = $conn->prepare("UPDATE cart SET quantity=? WHERE id=?");
        $upd->bind_param("ii",$newQty,$row["id"]); $upd->execute();
    } else {
        $ins = $conn->prepare("INSERT INTO cart (user_id,product_id,quantity) VALUES (?,?,?)");
        $ins->bind_param("iii",$user_id,$product_id,$quantity); $ins->execute();
    }

    // Return cart
    $cartStmt = $conn->prepare("
        SELECT c.id AS cart_id, c.quantity, p.id AS product_id, p.name, p.price, p.image
        FROM cart c JOIN products p ON c.product_id=p.id
        WHERE c.user_id=?");
    $cartStmt->bind_param("i",$user_id); $cartStmt->execute();
    $res = $cartStmt->get_result(); $cart=[];
    while($r=$res->fetch_assoc()) $cart[]=[
        "cart_id"=>(int)$r["cart_id"], "quantity"=>(int)$r["quantity"],
        "product_id"=>(int)$r["product_id"], "name"=>$r["name"],
        "price"=>(float)$r["price"], "image"=>$r["image"]
    ];
    echo json_encode(["success"=>true,"cart"=>$cart,"message"=>"Added to cart"]);
} catch(Exception $e){
    echo json_encode(["success"=>false,"message"=>$e->getMessage()]);
}
?>
