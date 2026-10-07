<?php
/**
 * ==============================================================================
 * ContractorLeads — Hostinger & GoDaddy Central Mail Gateway
 * ==============================================================================
 * Purpose: Relays outbound campaign and lead emails from Railway/Cloud servers
 * through Hostinger & GoDaddy authenticated mail systems with 100% SPF/DKIM compliance.
 *
 * Supports:
 * - 25 Hostinger Mailboxes across 5 domains (smtp.hostinger.com:465)
 * - 40 GoDaddy Mailboxes across 10 domains (smtpout.secureserver.net:465)
 * ==============================================================================
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ----------------------------------------------------------------------
// 1. Hostinger Mailboxes (25 across 5 domains)
// ----------------------------------------------------------------------
$HOSTINGER_MAILBOXES = [
    // 1. roofingagency.us (5)
    "gaurav@roofingagency.us"   => "7p+zii>=prC",
    "daniel@roofingagency.us"   => ";7tTw7=lUz",
    "ethan@roofingagency.us"    => "6sYsTSO?",
    "frank@roofingagency.us"    => "fuZo^Ssh2;W",
    "jake@roofingagency.us"     => "P1>>>#CVfCu",

    // 2. roofinggrowth.us (5)
    "gaurav@roofinggrowth.us"   => "p/mzZuB:7",
    "ryan@roofinggrowth.us"     => "~@JyD0$5b8&R",
    "daniel@roofinggrowth.us"   => "quG=+pFp4To;",
    "ethan@roofinggrowth.us"    => "Sw097y#yQxx+",
    "frank@roofinggrowth.us"    => "3jhzodD:",

    // 3. roofingmedia.us (5)
    "gaurav@roofingmedia.us"    => "4!d=?8FZq;",
    "jake@roofingmedia.us"      => "f?M5Dim/",
    "ryan@roofingmedia.us"      => "Wmy6tl?bi7:2",
    "daniel@roofingmedia.us"    => "ryjt7~Be",
    "ethan@roofingmedia.us"     => "5m>FFsvo",

    // 4. roofingpartners.us (5)
    "gaurav@roofingpartners.us" => "cO850%m05yv",
    "frank@roofingpartners.us"  => "5;T+N5KLt!",
    "jake@roofingpartners.us"   => "944jM0;u",
    "ryan@roofingpartners.us"   => "U004!t50!V?r",
    "daniel@roofingpartners.us" => "#p+0n46P@N=B",

    // 5. roofingclients.us (5)
    "gaurav@roofingclients.us"  => "iRR$zYmhuP0@",
    "ethan@roofingclients.us"   => "S!HSd2;6:bT",
    "frank@roofingclients.us"   => "0b>9*Xx1",
    "jake@roofingclients.us"    => "?3KAJ~~ef",
    "ryan@roofingclients.us"    => "/Q>rvne5uA"
];

// ----------------------------------------------------------------------
// 2. GoDaddy Mailboxes (40 across 10 domains)
// ----------------------------------------------------------------------
$GODADDY_PASS = "RAJOURIbranch@1997";
$GODADDY_MAILBOXES = [
    // 1. frankmillerconnect.com (4)
    "frank@frankmillerconnect.com"        => $GODADDY_PASS,
    "f.miller@frankmillerconnect.com"     => $GODADDY_PASS,
    "fmiller@frankmillerconnect.com"      => $GODADDY_PASS,
    "frank.miller@frankmillerconnect.com" => $GODADDY_PASS,

    // 2. frankmillernetwork.com (4)
    "frank@frankmillernetwork.com"        => $GODADDY_PASS,
    "f.miller@frankmillernetwork.com"     => $GODADDY_PASS,
    "fmiller@frankmillernetwork.com"      => $GODADDY_PASS,
    "frank.miller@frankmillernetwork.com" => $GODADDY_PASS,

    // 3. frankmillerreach.com (4)
    "frank@frankmillerreach.com"          => $GODADDY_PASS,
    "f.miller@frankmillerreach.com"       => $GODADDY_PASS,
    "fmiller@frankmillerreach.com"        => $GODADDY_PASS,
    "frank.miller@frankmillerreach.com"   => $GODADDY_PASS,

    // 4. frankmillercontact.com (4)
    "frank@frankmillercontact.com"        => $GODADDY_PASS,
    "f.miller@frankmillercontact.com"     => $GODADDY_PASS,
    "fmiller@frankmillercontact.com"      => $GODADDY_PASS,
    "frank.miller@frankmillercontact.com" => $GODADDY_PASS,

    // 5. meetfrankmiller.com (4)
    "frank@meetfrankmiller.com"           => $GODADDY_PASS,
    "f.miller@meetfrankmiller.com"        => $GODADDY_PASS,
    "fmiller@meetfrankmiller.com"         => $GODADDY_PASS,
    "frank.miller@meetfrankmiller.com"    => $GODADDY_PASS,

    // 6. connectwithbdefrank.com (4)
    "frank@connectwithbdefrank.com"       => $GODADDY_PASS,
    "f.miller@connectwithbdefrank.com"    => $GODADDY_PASS,
    "fmiller@connectwithbdefrank.com"     => $GODADDY_PASS,
    "frank.miller@connectwithbdefrank.com"=> $GODADDY_PASS,

    // 7. frankmillerhub.com (4)
    "frank@frankmillerhub.com"            => $GODADDY_PASS,
    "f.miller@frankmillerhub.com"         => $GODADDY_PASS,
    "fmiller@frankmillerhub.com"          => $GODADDY_PASS,
    "frank.miller@frankmillerhub.com"     => $GODADDY_PASS,

    // 8. frankmillerworks.com (4)
    "frank@frankmillerworks.com"          => $GODADDY_PASS,
    "f.miller@frankmillerworks.com"       => $GODADDY_PASS,
    "fmiller@frankmillerworks.com"        => $GODADDY_PASS,
    "frank.miller@frankmillerworks.com"   => $GODADDY_PASS,

    // 9. frankmillernetworks.com (4)
    "frank@frankmillernetworks.com"       => $GODADDY_PASS,
    "f.miller@frankmillernetworks.com"    => $GODADDY_PASS,
    "fmiller@frankmillernetworks.com"     => $GODADDY_PASS,
    "frank.miller@frankmillernetworks.com"=> $GODADDY_PASS,

    // 10. frankmillerconnects.com (4)
    "frank@frankmillerconnects.com"       => $GODADDY_PASS,
    "f.miller@frankmillerconnects.com"    => $GODADDY_PASS,
    "fmiller@frankmillerconnects.com"     => $GODADDY_PASS,
    "frank.miller@frankmillerconnects.com"=> $GODADDY_PASS
];

$ALL_MAILBOXES = array_merge($HOSTINGER_MAILBOXES, $GODADDY_MAILBOXES);

// Browser health check endpoint
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    echo json_encode([
        "ok" => true,
        "service" => "ContractorLeads Multi-Provider Mail Gateway",
        "status" => "ONLINE",
        "hostinger_mailboxes" => count($HOSTINGER_MAILBOXES),
        "godaddy_mailboxes" => count($GODADDY_MAILBOXES),
        "total_mailboxes" => count($ALL_MAILBOXES),
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

$domain = explode("@", $fromEmail)[1] ?? "sevenfigurestudio.us";
$isGoDaddy = isset($GODADDY_MAILBOXES[$fromEmail]) || (strpos($domain, "frankmiller") !== false) || ($domain === "meetfrankmiller.com") || ($domain === "connectwithbdefrank.com");

$smtpHost = $isGoDaddy ? "smtpout.secureserver.net" : "smtp.hostinger.com";
$password = $data["password"] ?? ($ALL_MAILBOXES[$fromEmail] ?? ($isGoDaddy ? $GODADDY_PASS : ""));

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
$headers[] = "X-Mailer: ContractorLeads-Gateway/3.0";
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
// Method 1: Authenticated Direct SMTP socket to Provider Mail Server (Port 465 SSL)
// ----------------------------------------------------------------------
function getSmtpResponse($socket) {
    $response = "";
    while ($line = fgets($socket, 515)) {
        $response .= $line;
        if (substr($line, 3, 1) === " ") break;
    }
    return $response;
}

$socket = @fsockopen("ssl://" . $smtpHost, 465, $errno, $errstr, 12);
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
                "provider" => $isGoDaddy ? "godaddy" : "hostinger",
                "to" => $to,
                "method" => "authenticated_smtp",
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
        "provider" => $isGoDaddy ? "godaddy" : "hostinger",
        "to" => $to,
        "method" => "native_mail"
    ]);
    exit;
}

http_response_code(500);
echo json_encode([
    "ok" => false,
    "error" => "Failed to deliver email through " . $smtpHost . ":465 or PHP mail(). Check credentials for " . $fromEmail
]);
