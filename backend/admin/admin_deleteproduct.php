<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include "db.php";
if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") exit;

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = isset($data["id"]) ? (int)$data["id"] : 0;
    if ($id <= 0) throw new Exception("Missing product ID.");

    // read image path
    $q = $conn->prepare("SELECT image FROM products WHERE id=?");
    $q->bind_param("i", $id);
    $q->execute();
    $r = $q->get_result();
    $imageRel = ($row = $r->fetch_assoc()) ? $row["image"] : null;
    $q->close();

    // delete row
    $del = $conn->prepare("DELETE FROM products WHERE id=?");
    $del->bind_param("i", $id);
    if (!$del->execute()) {
        throw new Exception("DB delete failed: " . $conn->error);
    }

    // delete file (if present)
    if (!empty($imageRel)) {
        $abs = dirname(__DIR__) . "/" . ltrim($imageRel, "/"); // /htdocs/backend/uploads/...
        if (is_file($abs)) @unlink($abs);
    }

    echo json_encode(["success" => true, "message" => "Product deleted"]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
