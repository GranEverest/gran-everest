<?php
// web/public/subscribe.php

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$email = isset($data['email']) ? trim($data['email']) : '';
$source = isset($data['source']) ? trim($data['source']) : 'unknown';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email']);
    exit;
}

// MAIL RECEIVER
$to = 'graneverestz7@gmail.com';
$subject = 'New GranEverest subscriber';

$body = "New email subscription received:\n\n";
$body .= "Email: " . $email . "\n";
$body .= "Source: " . $source . "\n";
$body .= "Date: " . date('c') . "\n";

$headers = "From: no-reply@graneverest.com\r\n";
$headers .= "Reply-To: no-reply@graneverest.com\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// @ para no romper la respuesta si falla el mail()
@mail($to, $subject, $body, $headers);

echo json_encode(['ok' => true]);
