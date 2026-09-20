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

if (empty($to) || empty($subject) || empty($fromEmail)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Missing required fields: to, subject, fromEmail"]);
    exit;
}

$domain = explode("@", $fromEmail)[1] ?? "roofingpartners.us";
$msgId = "<" . bin2hex(random_bytes(16)) . "@" . $domain . ">";

$headers = [];
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/html; charset=UTF-8";
$headers[] = "From: " . ($fromName ? "=?UTF-8?B?" . base64_encode($fromName) . "?= <" . $fromEmail . ">" : $fromEmail);
$headers[] = "Reply-To: " . $fromEmail;
$headers[] = "Message-ID: " . $msgId;
$headers[] = "Date: " . date("r");
$headers[] = "X-Mailer: ContractorLeads-Hostinger-Relay/2.0";

$finalBody = !empty($htmlContent) ? $htmlContent : nl2br(htmlspecialchars($textContent));

$sent = @mail($to, $subject, $finalBody, implode("\r\n", $headers), "-f" . $fromEmail);

if ($sent) {
    echo json_encode([
        "ok" => true,
        "messageId" => $msgId,
        "fromEmail" => $fromEmail,
        "to" => $to
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "ok" => false,
        "error" => "Internal mail delivery failed on Hostinger server"
    ]);
}
`;

async function deploy() {
  const sftp = new SftpClient();
  await sftp.connect({
    host: "185.232.14.208",
    port: 65002,
    username: "u880916130",
    password: "Allah512$$",
  });

  const targets = [
    "roofingpartners.us",
    "roofinggrowth.us",
    "roofingmedia.us",
    "roofingclients.us",
    "qualifiedleadsx.com"
  ];

  for (const domain of targets) {
    try {
      const remotePath = `/home/u880916130/domains/${domain}/public_html/mailer.php`;
      console.log(`Uploading mailer.php to ${domain}...`);
      await sftp.put(Buffer.from(phpScript), remotePath);
      console.log(`[SUCCESS] Deployed to https://${domain}/mailer.php`);
    } catch (e) {
      console.error(`[FAIL] Could not deploy to ${domain}:`, e.message);
    }
  }

  await sftp.end();
  console.log("Deployment to Hostinger completed!");
}

deploy().catch(console.error);
