<?php
/**
 * ==============================================================================
 * ContractorLeads — Hostinger Central Mail Gateway
 * ==============================================================================
 * Purpose: Relays outbound campaign and lead emails from Railway/Cloud servers
 * through Hostinger's authenticated mail system with 100% SPF/DKIM compliance.
 *
 * All 25 mailboxes across 5 domains are pre-configured with secure credentials.
 * ==============================================================================
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle CORS preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// 25 Mailboxes across all 5 domains
$MAILBOX_PASSWORDS = [
    // 1. roofingagency.us (5 mailboxes)
    "gaurav@roofingagency.us"   => "7p+zii>=prC",
    "daniel@roofingagency.us"   => ";7tTw7=lUz",
    "ethan@roofingagency.us"    => "6sYsTSO?",
    "frank@roofingagency.us"    => "fuZo^Ssh2;W",
    "jake@roofingagency.us"     => "P1>>>#CVfCu",

    // 2. roofinggrowth.us (5 mailboxes)
    "gaurav@roofinggrowth.us"   => "p/mzZuB:7",
    "ryan@roofinggrowth.us"     => "~@JyD0$5b8&R",
    "daniel@roofinggrowth.us"   => "quG=+pFp4To;",
    "ethan@roofinggrowth.us"    => "Sw097y#yQxx+",
    "frank@roofinggrowth.us"    => "3jhzodD:",

    // 3. roofingmedia.us (5 mailboxes)
    "gaurav@roofingmedia.us"    => "4!d=?8FZq;",
    "jake@roofingmedia.us"      => "f?M5Dim/",
    "ryan@roofingmedia.us"      => "Wmy6tl?bi7:2",
    "daniel@roofingmedia.us"    => "ryjt7~Be",
    "ethan@roofingmedia.us"     => "5m>FFsvo",

    // 4. roofingpartners.us (5 mailboxes)
    "gaurav@roofingpartners.us" => "cO850%m05yv",
    "frank@roofingpartners.us"  => "5;T+N5KLt!",
    "jake@roofingpartners.us"   => "944jM0;u",
    "ryan@roofingpartners.us"   => "U004!t50!V?r",
    "daniel@roofingpartners.us" => "#p+0n46P@N=B",

    // 5. roofingclients.us (5 mailboxes)
    "gaurav@roofingclients.us"  => "iRR$zYmhuP0@",
    "ethan@roofingclients.us"   => "S!HSd2;6:bT",
    "frank@roofingclients.us"   => "0b>9*Xx1",
    "jake@roofingclients.us"    => "?3KAJ~~ef",
    "ryan@roofingclients.us"    => "/Q>rvne5uA"
];

// Health check endpoint for browser testing
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    echo json_encode([
        "ok" => true,
        "service" => "ContractorLeads Hostinger Mail Gateway",
        "status" => "ONLINE",
        "mailboxes_configured" => count($MAILBOX_PASSWORDS),
        "domains" => [
            "roofingagency.us",
            "roofinggrowth.us",
            "roofingmedia.us",
            "roofingpartners.us",
            "roofingclients.us"
        ],
        "timestamp" => date("c")
    ], JSON_PRETTY_PRINT);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Method not allowed. Send a POST request."]);
    exit;
}

// Authentication Verification
$RELAY_SECRET = "ContractorLeads_Hostinger_Relay_Key_2026";
$authHeader = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
$rawBody = file_get_contents("php://input");
$data = json_decode($rawBody, true) ?? [];

$token = trim(str_replace("Bearer", "", $authHeader));
if ($token !== $RELAY_SECRET && ($data["secret"] ?? "") !== $RELAY_SECRET) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Unauthorized. Invalid relay token."]);
    exit;
}

$to = trim($data["to"] ?? "");
$subject = trim($data["subject"] ?? "");
$htmlContent = $data["html"] ?? "";
$textContent = $data["text"] ?? "";
$fromEmail = strtolower(trim($data["fromEmail"] ?? ""));
$fromName = trim($data["fromName"] ?? "Contractor Leads");

if (empty($to) || empty($subject) || empty($fromEmail)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Missing required fields: to, subject, or fromEmail."]);
    exit;
}

// Resolve password from pre-configured mailbox pool or payload
$password = $data["password"] ?? ($MAILBOX_PASSWORDS[$fromEmail] ?? "");

if (empty($password)) {
    // Secondary fallback lookup for alternate passwords
    $SECONDARY_PASSWORDS = [
        "gaurav@roofingpartners.us" => "m~16B>z^eQ2",
        "jake@roofingpartners.us"   => "Zd6ygm+w~",
        "ryan@roofingpartners.us"   => "w#W8;H8B$~",
        "daniel@roofingpartners.us" => "D?x5>xeT>1l"
    ];
    $password = $SECONDARY_PASSWORDS[$fromEmail] ?? "";
}

$domain = explode("@", $fromEmail)[1] ?? "roofingagency.us";
$msgId = "<" . bin2hex(random_bytes(16)) . "@" . $domain . ">";
$boundary = "b_" . bin2hex(random_bytes(12));

$headers = [];
$headers[] = "From: " . ($fromName ? "=?UTF-8?B?" . base64_encode($fromName) . "?= <" . $fromEmail . ">" : $fromEmail);
$headers[] = "To: <" . $to . ">";
$headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
$headers[] = "Reply-To: " . $fromEmail;
$headers[] = "Return-Path: <" . $fromEmail . ">";
$headers[] = "Message-ID: " . $msgId;
$headers[] = "Date: " . date("r");
$headers[] = "MIME-Version: 1.0";
$headers[] = "X-Mailer: ContractorLeads-Hostinger-Gateway/2.0";
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

// ----------------------------------------------------------------------
// Method 1: Authenticated Direct SMTP to Hostinger Mail Server (Port 465 SSL)
// ----------------------------------------------------------------------
function getSmtpResponse($socket) {
    $response = "";
    while ($line = fgets($socket, 515)) {
        $response .= $line;
        if (substr($line, 3, 1) === " ") break;
    }
    return $response;
}

$socket = @fsockopen("ssl://smtp.hostinger.com", 465, $errno, $errstr, 12);
if ($socket) {
    getSmtpResponse($socket);
    fputs($socket, "EHLO " . $domain . "\r\n");
    getSmtpResponse($socket);
    fputs($socket, "AUTH LOGIN\r\n");
    getSmtpResponse($socket);
    fputs($socket, base64_encode($fromEmail) . "\r\n");
    getSmtpResponse($socket);
    fputs($socket, base64_encode($password) . "\r\n");
    $authRes = getSmtpResponse($socket);

    if (substr($authRes, 0, 3) === "235") {
        fputs($socket, "MAIL FROM:<" . $fromEmail . ">\r\n");
        getSmtpResponse($socket);
        fputs($socket, "RCPT TO:<" . $to . ">\r\n");
        getSmtpResponse($socket);
        fputs($socket, "DATA\r\n");
        getSmtpResponse($socket);
        fputs($socket, $bodyContent . "\r\n.\r\n");
        $sendRes = getSmtpResponse($socket);
        fputs($socket, "QUIT\r\n");
        fclose($socket);

        if (substr($sendRes, 0, 3) === "250") {
            echo json_encode([
                "ok" => true,
                "messageId" => $msgId,
                "fromEmail" => $fromEmail,
                "to" => $to,
                "method" => "hostinger_authenticated_smtp",
                "response" => trim($sendRes)
            ]);
            exit;
        }
    } else {
        fclose($socket);
    }
}

// ----------------------------------------------------------------------
// Method 2: Fallback to PHP native mail()
// ----------------------------------------------------------------------
$plainHeaders = [];
$plainHeaders[] = "From: " . ($fromName ? "=?UTF-8?B?" . base64_encode($fromName) . "?= <" . $fromEmail . ">" : $fromEmail);
$plainHeaders[] = "Reply-To: " . $fromEmail;
$plainHeaders[] = "MIME-Version: 1.0";
$plainHeaders[] = "Content-Type: text/html; charset=UTF-8";
$plainHeaders[] = "Message-ID: " . $msgId;

$finalHtmlBody = !empty($htmlContent) ? $htmlContent : nl2br(htmlspecialchars($textContent));
$mailSent = @mail($to, $subject, $finalHtmlBody, implode("\r\n", $plainHeaders), "-f" . $fromEmail);

if ($mailSent) {
    echo json_encode([
        "ok" => true,
        "messageId" => $msgId,
        "fromEmail" => $fromEmail,
        "to" => $to,
        "method" => "hostinger_php_mail"
    ]);
    exit;
}

http_response_code(500);
echo json_encode([
    "ok" => false,
    "error" => "Failed to deliver email through Hostinger SMTP socket and PHP mail(). Check mailbox password."
]);
