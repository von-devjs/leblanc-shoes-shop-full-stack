<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

include "db.php";

// Preflight request (CORS)
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

//  Helper functions 
function base_url(): string {
    $proto = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
    $host = $_SERVER["HTTP_HOST"];
    return $proto . "://" . $host . "/backend/"; // force backend root
}

function full_image_url(?string $path): ?string {
    if (!$path) return null;
    if (preg_match("#^https?://#i", $path)) return $path; // already full URL
    return base_url() . ltrim($path, "/");
}

//  Get user_id safely 
$user_id = 0;
$raw = file_get_contents("php://input");
$body = json_decode($raw, true);

if (is_array($body) && isset($body["user_id"])) {
    $user_id = (int)$body["user_id"];
} elseif (isset($_GET["user_id"])) {
    $user_id = (int)$_GET["user_id"];
} elseif (isset($_POST["user_id"])) {
    $user_id = (int)$_POST["user_id"];
}

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Missing or invalid user_id"
    ]);
    exit;
}

// Query database 
try {
    $sql = "
        SELECT 
            c.id AS cart_id,
            c.quantity,
            p.id AS product_id,
            p.name,
            p.price,
            p.image
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ";
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception("Failed to prepare query: " . $conn->error);

    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();

    $cart = [];
    while ($row = $res->fetch_assoc()) {
        $cart[] = [
            "cart_id"    => (int)$row["cart_id"],
            "product_id" => (int)$row["product_id"],
            "quantity"   => (int)$row["quantity"],
            "name"       => $row["name"],
            "price"      => (float)$row["price"],
            "image"      => full_image_url($row["image"]),
        ];
    }

    echo json_encode([
        "success" => true,
        "cart"    => $cart
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
