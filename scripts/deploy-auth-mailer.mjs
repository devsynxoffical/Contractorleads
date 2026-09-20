import SftpClient from "ssh2-sftp-client";

const phpScript = `<?php
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
    echo json_encode(["ok" => false, "error" => "Method not allowed"]);
    exit;
}

$RELAY_SECRET = "ContractorLeads_Hostinger_Relay_Key_2026";
$authHeader = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
$body = file_get_contents("php://input");
$data = json_decode($body, true) ?? [];

$token = trim(str_replace("Bearer", "", $authHeader));
if ($token !== $RELAY_SECRET && ($data["secret"] ?? "") !== $RELAY_SECRET) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Unauthorized"]);
    exit;
}

$to = trim($data["to"] ?? "");
$subject = trim($data["subject"] ?? "");
$htmlContent = $data["html"] ?? "";
$textContent = $data["text"] ?? "";
$fromEmail = trim($data["fromEmail"] ?? "");
$fromName = trim($data["fromName"] ?? "Contractor Leads");

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

if (empty($to) || empty($subject) || empty($fromEmail)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Missing required fields"]);
    exit;
}

$socket = @fsockopen("ssl://smtp.hostinger.com", 465, $errno, $errstr, 15);
if (!$socket) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "SMTP socket connect failed: " . $errstr]);
    exit;
}

function getSmtpLine($socket) {
    $res = "";
    while ($str = fgets($socket, 515)) {
        $res .= $str;
        if (substr($str, 3, 1) === " ") break;
    }
    return $res;
}

getSmtpLine($socket);
fputs($socket, "EHLO roofingagency.us\\r\\n");
getSmtpLine($socket);
fputs($socket, "AUTH LOGIN\\r\\n");
getSmtpLine($socket);
fputs($socket, base64_encode($fromEmail) . "\\r\\n");
getSmtpLine($socket);
fputs($socket, base64_encode($password) . "\\r\\n");
$authRes = getSmtpLine($socket);

if (substr($authRes, 0, 3) !== "235") {
    fclose($socket);
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "SMTP Auth failed for " . $fromEmail]);
    exit;
}

fputs($socket, "MAIL FROM:<" . $fromEmail . ">\\r\\n");
getSmtpLine($socket);
fputs($socket, "RCPT TO:<" . $to . ">\\r\\n");
getSmtpLine($socket);
fputs($socket, "DATA\\r\\n");
getSmtpLine($socket);

$domain = explode("@", $fromEmail)[1] ?? "roofingagency.us";
$msgId = "<" . bin2hex(random_bytes(16)) . "@" . $domain . ">";
$boundary = "b_" . bin2hex(random_bytes(12));

$headers = [];
$headers[] = "From: " . ($fromName ? "=?UTF-8?B?" . base64_encode($fromName) . "?= <" . $fromEmail . ">" : $fromEmail);
$headers[] = "To: <" . $to . ">";
$headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
$headers[] = "Date: " . date("r");
$headers[] = "Message-ID: " . $msgId;
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: multipart/alternative; boundary=\\"" . $boundary . "\\"";

$bodyContent = implode("\\r\\n", $headers) . "\\r\\n\\r\\n";
$bodyContent .= "--" . $boundary . "\\r\\n";
$bodyContent .= "Content-Type: text/plain; charset=UTF-8\\r\\n";
$bodyContent .= "Content-Transfer-Encoding: 8bit\\r\\n\\r\\n";
$bodyContent .= (!empty($textContent) ? $textContent : strip_tags($htmlContent)) . "\\r\\n\\r\\n";

if (!empty($htmlContent)) {
    $bodyContent .= "--" . $boundary . "\\r\\n";
    $bodyContent .= "Content-Type: text/html; charset=UTF-8\\r\\n";
    $bodyContent .= "Content-Transfer-Encoding: 8bit\\r\\n\\r\\n";
    $bodyContent .= $htmlContent . "\\r\\n\\r\\n";
}
$bodyContent .= "--" . $boundary . "--\\r\\n";
$bodyContent .= ".\\r\\n";

fputs($socket, $bodyContent);
$finalRes = getSmtpLine($socket);
fputs($socket, "QUIT\\r\\n");
fclose($socket);

if (substr($finalRes, 0, 3) === "250") {
    echo json_encode(["ok" => true, "messageId" => $msgId, "response" => trim($finalRes)]);
} else {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "SMTP Delivery rejected: " . trim($finalRes)]);
}
`;

async function deploy() {
  const sftp = new SftpClient();
  try {
    console.log("Connecting to Hostinger SFTP (185.232.14.208:65002)...");
    await sftp.connect({
      host: "185.232.14.208",
      port: 65002,
      username: "u880916130",
      password: "Allah512$$",
      readyTimeout: 20000,
    });
    console.log("✅ Connected via SFTP successfully!");

    const targets = [
      "roofingagency.us",
      "roofinggrowth.us",
      "roofingmedia.us",
      "roofingpartners.us",
      "roofingclients.us",
    ];

    for (const domain of targets) {
      try {
        const remotePath = `/home/u880916130/domains/${domain}/public_html/mailer.php`;
        console.log(`Uploading authenticated mailer.php to ${domain}...`);
        await sftp.put(Buffer.from(phpScript), remotePath);
        console.log(`✅ Deployed https://${domain}/mailer.php`);
      } catch (e) {
        console.error(`❌ Failed on ${domain}:`, e.message);
      }
    }

    await sftp.end();
    console.log("🎉 All 5 domains updated with authenticated SMTP gateway!");
  } catch (err) {
    console.error("SFTP Error:", err.message);
  }
}

deploy();
