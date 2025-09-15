<?php
// BROADCAST SETTINGS
define("BROADCAST_API_KEY", "supersecret123");
define("BROADCAST_URL", "http://localhost:3001/broadcastOrder");

// Fetch full order with items, products, and totals
if (!function_exists("get_full_order")) {
    function get_full_order(mysqli $conn, int $order_id): ?array {
        if ($order_id <= 0) return null;

        // Fetch order & user info 
        $sql = "SELECT o.id, o.user_id, o.status, o.delivery_date, o.rating, o.created_at,
                       u.first_name, u.last_name, u.email
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                WHERE o.id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) return null;
        $stmt->bind_param("i", $order_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $orderRow = $res->fetch_assoc();
        $stmt->close();

        if (!$orderRow) return null;

        // Fetch order items & product info 
        $sqlItems = "SELECT oi.id AS item_id, oi.product_id, oi.quantity, oi.price,
                            p.name AS product_name, p.image AS product_image
                     FROM order_items oi
                     LEFT JOIN products p ON p.id = oi.product_id
                     WHERE oi.order_id = ?";
        $stmt2 = $conn->prepare($sqlItems);
        if (!$stmt2) return null;
        $stmt2->bind_param("i", $order_id);
        $stmt2->execute();
        $itemsRes = $stmt2->get_result();

        $items = [];
        $total = 0.0;

        //  Host (for absolute image URL) 
        $host = (isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] === "on" ? "https" : "http")
              . "://{$_SERVER['HTTP_HOST']}";

        while ($row = $itemsRes->fetch_assoc()) {
            $qty   = (int)$row["quantity"];
            $price = (float)$row["price"];

            // Image path fix: convert DB path -> absolute URL
            $dbPath = $row["product_image"] ?? "";
            $dbPath = ltrim($dbPath, "/"); // remove leading slash if any

            $basePath = !empty($dbPath)
                ? "/backend/" . $dbPath
                : "/backend/uploads/default.png";

            $fullPath = $_SERVER["DOCUMENT_ROOT"] . $basePath;

            if ($dbPath && file_exists($fullPath)) {
                $imagePath = $host . $basePath . "?v=" . filemtime($fullPath);
            } else {
                $imagePath = $host . $basePath;
            }

            $items[] = [
                "id"            => (int)$row["item_id"],
                "product_id"    => (int)$row["product_id"],
                "product_name"  => $row["product_name"] ?? "Unknown Product",
                "product_image" => $imagePath,
                "quantity"      => $qty,
                "price"         => $price,
                "subtotal"      => $qty * $price
            ];

            $total += $qty * $price;
        }
        $stmt2->close();

        return [
            "id"            => (int)$orderRow["id"],
            "user_id"       => (int)$orderRow["user_id"],
            "customer_name" => trim(($orderRow["first_name"] ?? "") . " " . ($orderRow["last_name"] ?? "")),
            "email"         => $orderRow["email"] ?? null,
            "status"        => $orderRow["status"],
            "delivery_date" => $orderRow["delivery_date"] ?? null,
            "rating"        => isset($orderRow["rating"]) ? (int)$orderRow["rating"] : null,
            "created_at"    => $orderRow["created_at"],
            "items"         => $items,
            "total"         => $total
        ];
    }
}

// Broadcast order (generic)
if (!function_exists("broadcast_order")) {
    function broadcast_order(array $payload): bool {
        $ch = curl_init(BROADCAST_URL);
        $json = json_encode($payload);

        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "Content-Type: application/json",
                "x-api-key: " . BROADCAST_API_KEY
            ],
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_TIMEOUT        => 3,
        ]);

        $result   = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $result !== false && $httpCode >= 200 && $httpCode < 300;
    }
}

// Broadcast removal
if (!function_exists("broadcast_removed_order")) {
    function broadcast_removed_order(int $order_id, int $user_id): bool {
        return broadcast_order([
            "id"      => $order_id,
            "user_id" => $user_id,
            "removed" => true
        ]);
    }
}

// Broadcast update (full order data)
if (!function_exists("broadcast_updated_order")) {
    function broadcast_updated_order(mysqli $conn, int $order_id): bool {
        $order = get_full_order($conn, $order_id);
        if (!$order) return false;
        return broadcast_order($order);
    }
}
