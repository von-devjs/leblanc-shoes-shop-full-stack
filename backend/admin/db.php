<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "shoes_db";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "DB Connection failed"]));
}

header("Content-Type: application/json");
?>
