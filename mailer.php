<?php
/**
 * ContractorLeads Hostinger Mail Gateway / Relay
 * Bypasses cloud host outbound SMTP port restrictions (Railway, AWS, etc.)
 */
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Method not allowed. Use POST."]);
    exit;
}

$RELAY_SECRET = "ContractorLeads_Hostinger_Relay_Key_2026";
$authHeader = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
$rawBody = file_get_contents("php://input");
$data = json_decode($rawBody, true) ?? [];

$token = trim(str_replace("Bearer", "", $authHeader));
if ($token !== $RELAY_SECRET && ($data["secret"] ?? "") !== $RELAY_SECRET) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Unauthorized: Invalid relay secret."]);
    exit;
}

$to = trim($data["to"] ?? "");
$subject = trim($data["subject"] ?? "");
$htmlContent = $data["html"] ?? "";
$textContent = $data["text"] ?? "";
$fromEmail = trim($data["fromEmail"] ?? "");
$fromName = trim($data["fromName"] ?? "Contractor Leads");

if (empty($to) || empty($subject) || empty($fromEmail)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Missing required fields: to, subject, or fromEmail"]);
    exit;
}

$domain = explode("@", $fromEmail)[1] ?? "roofingagency.us";
$msgId = "<" . bin2hex(random_bytes(16)) . "@" . $domain . ">";
$boundary = "b_" . bin2hex(random_bytes(12));

$headers = [];
$headers[] = "From: " . ($fromName ? "=?UTF-8?B?" . base64_encode($fromName) . "?= <" . $fromEmail . ">" : $fromEmail);
$headers[] = "Reply-To: " . $fromEmail;
$headers[] = "Return-Path: <" . $fromEmail . ">";
$headers[] = "Message-ID: " . $msgId;
$headers[] = "Date: " . date("r");
$headers[] = "MIME-Version: 1.0";
$headers[] = "X-Mailer: ContractorLeads-Hostinger-Relay/2.0";
$headers[] = "Content-Type: multipart/alternative; boundary=\"" . $boundary . "\"";

$bodyContent = implode("\r\n", $headers) . "\r\n\r\n";
$bodyContent .= "--" . $boundary . "\r\n";
$bodyContent .= "Content-Type: text/plain; charset=UTF-8\r\n";
$bodyContent .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$bodyContent .= (!empty($textContent) ? $textContent : strip_tags($htmlContent)) . "\r\n\r\n";

if (!empty($htmlContent)) {
    $bodyContent .= "--" . $boundary . "\r\n";
    $bodyContent .= "Content-Type: text/html; charset=UTF-8\r\n";
    $bodyContent .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $bodyContent .= $htmlContent . "\r\n\r\n";
}
$bodyContent .= "--" . $boundary . "--\r\n";

// Method 1: Try local PHP mail() with Hostinger envelope sender
$mailSent = @mail($to, $subject, "", implode("\r\n", $headers), "-f" . $fromEmail);

if ($mailSent) {
    echo json_encode([
        "ok" => true,
        "messageId" => $msgId,
        "fromEmail" => $fromEmail,
        "to" => $to,
        "method" => "hostinger_mail"
    ]);
    exit;
}

// Method 2: Fallback to direct local Hostinger SMTP socket connection on port 465
$PASSWORDS = [
  "gaurav@roofingagency.us" => "7p+zii>=prC",
  "daniel@roofingagency.us" => ";7tTw7=lUz",
  "ethan@roofingagency.us" => "6sYsTSO?",
  "frank@roofingagency.us" => "fuZo^Ssh2;W",
  "jake@roofingagency.us" => "P1>>>#CVfCu",
  "gaurav@roofinggrowth.us" => "p/mzZuB:7",
  "ryan@roofinggrowth.us" => "~@JyD0$5b8&R",
  "daniel@roofinggrowth.us" => "quG=+pFp4To;",
  "ethan@roofinggrowth.us" => "Sw097y#yQxx+",
  "frank@roofinggrowth.us" => "3jhzodD:",
  "gaurav@roofingmedia.us" => "4!d=?8FZq;",
  "jake@roofingmedia.us" => "f?M5Dim/",
  "ryan@roofingmedia.us" => "Wmy6tl?bi7:2",
  "daniel@roofingmedia.us" => "ryjt7~Be",
  "ethan@roofingmedia.us" => "5m>FFsvo",
  "gaurav@roofingpartners.us" => "cO850%m05yv",
  "frank@roofingpartners.us" => "5;T+N5KLt!",
  "jake@roofingpartners.us" => "944jM0;u",
  "ryan@roofingpartners.us" => "U004!t50!V?r",
  "daniel@roofingpartners.us" => "#p+0n46P@N=B",
  "gaurav@roofingclients.us" => "iRR$zYmhuP0@",
  "ethan@roofingclients.us" => "S!HSd2;6:bT",
  "frank@roofingclients.us" => "0b>9*Xx1",
  "jake@roofingclients.us" => "?3KAJ~~ef",
  "ryan@roofingclients.us" => "/Q>rvne5uA"
];

$password = $data["password"] ?? ($PASSWORDS[strtolower($fromEmail)] ?? "");
$socket = @fsockopen("ssl://smtp.hostinger.com", 465, $errno, $errstr, 10);
if (!$socket) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Local Hostinger socket failed: " . $errstr]);
    exit;
}

function getSmtpLine($s) {
    $res = "";
    while ($str = fgets($s, 515)) {
        $res .= $str;
        if (substr($str, 3, 1) === " ") break;
    }
    return $res;
}

getSmtpLine($socket);
fputs($socket, "EHLO " . $domain . "\r\n");
getSmtpLine($socket);
fputs($socket, "AUTH LOGIN\r\n");
getSmtpLine($socket);
fputs($socket, base64_encode($fromEmail) . "\r\n");
getSmtpLine($socket);
fputs($socket, base64_encode($password) . "\r\n");
$authRes = getSmtpLine($socket);

if (substr($authRes, 0, 3) !== "235") {
    fclose($socket);
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "SMTP Auth failed for " . $fromEmail]);
    exit;
}

fputs($socket, "MAIL FROM:<" . $fromEmail . ">\r\n");
getSmtpLine($socket);
fputs($socket, "RCPT TO:<" . $to . ">\r\n");
getSmtpLine($socket);
fputs($socket, "DATA\r\n");
getSmtpLine($socket);
fputs($socket, $bodyContent . "\r\n.\r\n");
$finalRes = getSmtpLine($socket);
fputs($socket, "QUIT\r\n");
fclose($socket);

if (substr($finalRes, 0, 3) === "250") {
    echo json_encode(["ok" => true, "messageId" => $msgId, "method" => "hostinger_smtp", "response" => trim($finalRes)]);
} else {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "SMTP Delivery rejected: " . trim($finalRes)]);
}
