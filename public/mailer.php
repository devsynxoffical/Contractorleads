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

// ----------------------------------------------------------------------
// Mailboxes saved by users from the app (new mailboxes and corrected passwords).
// Stored OUTSIDE the public web folder so they can never be downloaded. If the
// private folder cannot be created, a .php store is used: requesting it over HTTP
// only runs its exit line and returns nothing.
// ----------------------------------------------------------------------
$STORE_GUARD = "<?php http_response_code(404); exit; ?>\n";
$PRIVATE_DIR = dirname(__DIR__) . "/contractorleads_private";
if (!is_dir($PRIVATE_DIR)) {
    @mkdir($PRIVATE_DIR, 0700, true);
}
$CUSTOM_ACCOUNTS_FILE = (is_dir($PRIVATE_DIR) && is_writable($PRIVATE_DIR))
    ? $PRIVATE_DIR . "/custom_accounts.json.php"
    : __DIR__ . "/custom_accounts.store.php";
$LEGACY_ACCOUNTS_FILE = __DIR__ . "/custom_accounts.json"; // old, publicly readable location

function loadCustomAccounts($file) {
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    if ($raw === false) return [];
    $raw = preg_replace('/^<\?php.*?\?>\s*/s', '', $raw);
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function saveCustomAccounts($file, $accounts, $guard) {
    $ok = @file_put_contents($file, $guard . json_encode($accounts, JSON_PRETTY_PRINT), LOCK_EX) !== false;
    if ($ok) @chmod($file, 0600);
    return $ok;
}

$CUSTOM_ACCOUNTS = loadCustomAccounts($CUSTOM_ACCOUNTS_FILE);

// Last SMTP port that worked per mail server (e.g. GoDaddy may only be reachable on 80 / 3535 from here).
$PORT_CACHE_FILE = dirname($CUSTOM_ACCOUNTS_FILE) . "/smtp_ports.store.php";
$PORT_CACHE = loadCustomAccounts($PORT_CACHE_FILE);

// One-time move of the old public file into the protected store, then delete it.
if (file_exists($LEGACY_ACCOUNTS_FILE)) {
    $legacy = json_decode(@file_get_contents($LEGACY_ACCOUNTS_FILE), true);
    if (is_array($legacy)) {
        foreach ($legacy as $lEmail => $lData) {
            if (!isset($CUSTOM_ACCOUNTS[$lEmail])) $CUSTOM_ACCOUNTS[$lEmail] = $lData;
        }
    }
    if (saveCustomAccounts($CUSTOM_ACCOUNTS_FILE, $CUSTOM_ACCOUNTS, $STORE_GUARD)) {
        @unlink($LEGACY_ACCOUNTS_FILE);
    }
}

// User-saved passwords take priority over the built-in ones.
foreach ($CUSTOM_ACCOUNTS as $cEmail => $cData) {
    if (!empty($cData["password"])) {
        $ALL_MAILBOXES[$cEmail] = $cData["password"];
    }
}

// Browser health check endpoint
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    echo json_encode([
        "ok" => true,
        "service" => "ContractorLeads Multi-Provider Mail Gateway",
        "status" => "ONLINE",
        "hostinger_mailboxes" => count($HOSTINGER_MAILBOXES),
        "godaddy_mailboxes" => count($GODADDY_MAILBOXES),
        "custom_mailboxes" => count($CUSTOM_ACCOUNTS),
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

// Allow enough time to try every SMTP port (GoDaddy: up to four) instead of being
// killed by the host's default limit.
@set_time_limit(120);

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

// ----------------------------------------------------------------------
// Action: SAVE_ACCOUNT — stores user's mailbox on Hostinger mailer.php
// ----------------------------------------------------------------------
if (($data["action"] ?? "") === "save_account") {
    $email = strtolower(trim($data["fromEmail"] ?? ""));
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(["ok" => false, "error" => "fromEmail is required"]);
        exit;
    }
    // Merge with what is already stored: an empty field never wipes a saved value.
    $prev = $CUSTOM_ACCOUNTS[$email] ?? [];
    $newPassword = (string)($data["password"] ?? "");
    $newHost = trim($data["host"] ?? "");
    $CUSTOM_ACCOUNTS[$email] = [
        "email" => $email,
        "fromName" => trim($data["fromName"] ?? "") !== "" ? trim($data["fromName"]) : ($prev["fromName"] ?? ""),
        "password" => $newPassword !== "" ? $newPassword : ($prev["password"] ?? ""),
        "host" => $newHost !== "" ? $newHost : ($prev["host"] ?? ""),
        "port" => intval($data["port"] ?? ($prev["port"] ?? 465)),
        "provider" => trim($data["provider"] ?? "") !== "" ? trim($data["provider"]) : ($prev["provider"] ?? "custom"),
        "updatedAt" => date("c")
    ];
    if (!saveCustomAccounts($CUSTOM_ACCOUNTS_FILE, $CUSTOM_ACCOUNTS, $STORE_GUARD)) {
        http_response_code(500);
        echo json_encode(["ok" => false, "error" => "Could not store the mailbox on the relay (storage not writable)."]);
        exit;
    }
    echo json_encode([
        "ok" => true,
        "message" => "Account successfully saved on Hostinger gateway",
        "email" => $email,
        "total_custom" => count($CUSTOM_ACCOUNTS)
    ]);
    exit;
}

// ----------------------------------------------------------------------
// Action: PORT_CHECK — which SMTP ports of a mail server this host can reach
// (shared hosting often blocks outgoing mail ports to other providers).
// ----------------------------------------------------------------------
if (($data["action"] ?? "") === "port_check") {
    $host = trim($data["host"] ?? "");
    if ($host === "" || !preg_match('/^[a-z0-9.-]+$/i', $host)) {
        http_response_code(400);
        echo json_encode(["ok" => false, "error" => "A valid host is required"]);
        exit;
    }
    $results = [];
    foreach ([465, 587, 3535, 80, 25] as $p) {
        $t0 = microtime(true);
        $sock = @fsockopen(($p === 465 ? "ssl://" : "tcp://") . $host, $p, $errno, $errstr, 6);
        $ms = intval((microtime(true) - $t0) * 1000);
        if ($sock) {
            stream_set_timeout($sock, 6);
            $banner = trim((string)fgets($sock, 515));
            fclose($sock);
            $results[] = ["port" => $p, "open" => true, "ms" => $ms, "banner" => substr($banner, 0, 80)];
        } else {
            $results[] = ["port" => $p, "open" => false, "ms" => $ms, "error" => trim($errstr) ?: "closed"];
        }
    }
    echo json_encode(["ok" => true, "host" => $host, "results" => $results]);
    exit;
}

// ----------------------------------------------------------------------
// Action: TEST — tests SMTP connection directly from Hostinger
// ----------------------------------------------------------------------
if (($data["action"] ?? "") === "test") {
    $fromEmail = strtolower(trim($data["fromEmail"] ?? ""));
    $password = !empty($data["password"]) ? $data["password"] : ($ALL_MAILBOXES[$fromEmail] ?? ($CUSTOM_ACCOUNTS[$fromEmail]["password"] ?? ""));
    $domain = explode("@", $fromEmail)[1] ?? "contractorleads.us";
    $isGoDaddy = isset($GODADDY_MAILBOXES[$fromEmail]) || (strpos($domain, "frankmiller") !== false) || ($domain === "meetfrankmiller.com");
    $host = !empty($data["host"]) ? trim($data["host"]) : (!empty($CUSTOM_ACCOUNTS[$fromEmail]["host"]) ? $CUSTOM_ACCOUNTS[$fromEmail]["host"] : ($isGoDaddy ? "smtpout.secureserver.net" : "smtp.hostinger.com"));
    $port = intval($data["port"] ?? (!empty($CUSTOM_ACCOUNTS[$fromEmail]["port"]) ? $CUSTOM_ACCOUNTS[$fromEmail]["port"] : 465));

    $connectErrors = [];
    foreach (smtpPortsFor($host, $port) as $tryPort) {
        list($socket, $sessionErr) = smtpOpenSession($host, $tryPort, $domain, 12);
        if (!$socket) {
            $connectErrors[] = $sessionErr;
            continue;
        }
        fputs($socket, "AUTH LOGIN\r\n");
        getSmtpResponse($socket);
        fputs($socket, base64_encode($fromEmail) . "\r\n");
        getSmtpResponse($socket);
        fputs($socket, base64_encode($password) . "\r\n");
        $authRes = getSmtpResponse($socket);
        fputs($socket, "QUIT\r\n");
        fclose($socket);

        if (substr($authRes, 0, 3) === "235") {
            rememberWorkingPort($host, $tryPort);
            echo json_encode(["ok" => true, "message" => "Connection & authentication verified on {$host}:{$tryPort}", "host" => $host, "port" => $tryPort]);
        } else {
            // The server answered: the login itself was refused, other ports will not help.
            http_response_code(500);
            echo json_encode(["ok" => false, "error" => "Auth failed for {$fromEmail} on {$host}:{$tryPort}: " . trim($authRes), "port" => $tryPort]);
        }
        exit;
    }
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "SMTP socket connection failed to {$host} on every port tried (" . implode(" | ", $connectErrors) . ")"]);
    exit;
}

// ----------------------------------------------------------------------
// IMAP FETCH action — lets the app read inboxes through this gateway when
// direct IMAP (port 993) is blocked from the app server.
// ----------------------------------------------------------------------
function imapCommand($sock, $tag, $cmd) {
    fputs($sock, $tag . " " . $cmd . "\r\n");
    $out = "";
    while (($line = fgets($sock, 8192)) !== false) {
        $out .= $line;
        if (strpos($line, $tag . " ") === 0) break;
    }
    return $out;
}

if (($data["action"] ?? "") === "fetch") {
    $mbox = strtolower(trim($data["fromEmail"] ?? ""));
    if (empty($mbox)) {
        http_response_code(400);
        echo json_encode(["ok" => false, "error" => "Missing fromEmail (mailbox) for fetch."]);
        exit;
    }
    $mDomain = explode("@", $mbox)[1] ?? "";
    $mGoDaddy = isset($GODADDY_MAILBOXES[$mbox]) || (strpos($mDomain, "frankmiller") !== false) || ($mDomain === "meetfrankmiller.com") || ($mDomain === "connectwithbdefrank.com");
    $imapHost = $mGoDaddy ? "imap.secureserver.net" : "imap.hostinger.com";
    $mPass = !empty($data["password"]) ? $data["password"] : ($ALL_MAILBOXES[$mbox] ?? ($mGoDaddy ? $GODADDY_PASS : ""));
    $limit = max(1, min(50, intval($data["limit"] ?? 25)));

    $sock = @stream_socket_client("ssl://" . $imapHost . ":993", $errno, $errstr, 12);
    if (!$sock) {
        http_response_code(502);
        echo json_encode(["ok" => false, "error" => "IMAP connect failed to " . $imapHost . ": " . $errstr]);
        exit;
    }
    stream_set_timeout($sock, 20);
    fgets($sock, 8192); // server greeting

    $login = imapCommand($sock, "XA1", 'LOGIN "' . addcslashes($mbox, '"\\') . '" "' . addcslashes($mPass, '"\\') . '"');
    if (!preg_match('/^XA1 OK/mi', $login)) {
        fclose($sock);
        http_response_code(401);
        echo json_encode(["ok" => false, "error" => "IMAP login failed for " . $mbox . " (check mailbox password)."]);
        exit;
    }

    imapCommand($sock, "XA2", "EXAMINE INBOX"); // read-only: never alters read/unread flags
    $search = imapCommand($sock, "XA3", "UID SEARCH ALL");
    preg_match('/\* SEARCH([\d ]*)/', $search, $sm);
    $uids = array_values(array_filter(explode(" ", trim($sm[1] ?? ""))));
    $total = count($uids);
    $uids = array_slice($uids, -$limit);

    $messages = [];
    foreach ($uids as $uid) {
        $resp = imapCommand($sock, "XF" . $uid, "UID FETCH " . $uid . " BODY.PEEK[]");
        if (preg_match('/\{(\d+)\}\r\n/', $resp, $lm, PREG_OFFSET_CAPTURE)) {
            $len = intval($lm[1][0]);
            $start = $lm[0][1] + strlen($lm[0][0]);
            $messages[] = ["uid" => intval($uid), "raw" => base64_encode(substr($resp, $start, $len))];
        }
    }
    imapCommand($sock, "XA9", "LOGOUT");
    fclose($sock);

    echo json_encode(["ok" => true, "mailbox" => $mbox, "total" => $total, "messages" => $messages]);
    exit;
}

/**
 * Open an SMTP session ready for AUTH. Port 465 uses implicit SSL; every other port
 * (587, 3535, 80, 25) must upgrade with STARTTLS, so a password is never sent in clear.
 * Returns [socket, error].
 */
function smtpOpenSession($host, $port, $domain, $timeout) {
    $port = intval($port);
    $implicitSsl = $port === 465;
    $connectTimeout = min($timeout, 8);
    $socket = @fsockopen(($implicitSsl ? "ssl://" : "tcp://") . $host, $port, $errno, $errstr, $connectTimeout);
    if (!$socket) return [null, "SMTP socket connection failed to {$host}:{$port} ({$errstr})"];
    stream_set_timeout($socket, $timeout);
    getSmtpResponse($socket);
    fputs($socket, "EHLO " . $domain . "\r\n");
    $ehlo = getSmtpResponse($socket);
    if (!$implicitSsl) {
        if (stripos($ehlo, "STARTTLS") === false) {
            fclose($socket);
            return [null, "STARTTLS failed on {$host}:{$port}: server does not offer encryption on this port"];
        }
        fputs($socket, "STARTTLS\r\n");
        $tlsRes = getSmtpResponse($socket);
        if (substr($tlsRes, 0, 3) !== "220" || !@stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            return [null, "STARTTLS failed on {$host}:{$port}: " . trim($tlsRes)];
        }
        fputs($socket, "EHLO " . $domain . "\r\n");
        getSmtpResponse($socket);
    }
    return [$socket, ""];
}

/** True when an error means "could not reach / secure the port" (worth trying the next port). */
function isSmtpConnectError($err) {
    return strpos($err, "SMTP socket connection failed") === 0 || strpos($err, "STARTTLS failed") === 0;
}

/** Ports to try: requested, last one that worked for this server, then provider fallbacks. */
function smtpPortsFor($host, $requested) {
    global $PORT_CACHE;
    $fallbacks = stripos($host, "secureserver.net") !== false ? [465, 587, 3535, 80] : [465, 587];
    $cached = intval($PORT_CACHE[strtolower($host)] ?? 0);
    $list = array_merge([intval($requested), $cached], $fallbacks);
    return array_values(array_unique(array_filter($list, function ($p) { return $p > 0; })));
}

function rememberWorkingPort($host, $port) {
    global $PORT_CACHE, $PORT_CACHE_FILE, $STORE_GUARD;
    $key = strtolower($host);
    if (intval($PORT_CACHE[$key] ?? 0) === intval($port)) return;
    $PORT_CACHE[$key] = intval($port);
    saveCustomAccounts($PORT_CACHE_FILE, $PORT_CACHE, $STORE_GUARD);
}

function getSmtpResponse($socket) {
    $response = "";
    while (!feof($socket) && ($line = fgets($socket, 515))) {
        $response .= $line;
        if (strlen($line) >= 4 && substr($line, 3, 1) === " ") break;
        if (strlen($line) === 3 || (strlen($line) === 5 && substr($line, 3) === "\r\n")) break;
    }
    return $response;
}

// ----------------------------------------------------------------------
// Action 3: EMAIL VERIFIER via Hostinger Gateway
// Connects to destination MX servers on Port 25 to verify mailbox existence
// ----------------------------------------------------------------------
if (($data["action"] ?? "") === "verify") {
    $email = strtolower(trim($data["email"] ?? ""));
    $emails = is_array($data["emails"] ?? null) ? $data["emails"] : ($email ? [$email] : []);

    if (empty($emails)) {
        http_response_code(400);
        echo json_encode(["ok" => false, "error" => "No email provided for verification."]);
        exit;
    }

    $results = [];

    foreach ($emails as $em) {
        $em = strtolower(trim($em));
        if (empty($em) || !filter_var($em, FILTER_VALIDATE_EMAIL)) {
            $results[] = [
                "email" => $em,
                "status" => "invalid",
                "score" => 0,
                "verdict" => "Invalid email format syntax",
                "smtpCheck" => "skipped"
            ];
            continue;
        }

        $domain = substr(strrchr($em, "@"), 1);
        $mxHosts = [];
        $mxWeights = [];

        if (!getmxrr($domain, $mxHosts, $mxWeights) || empty($mxHosts)) {
            $results[] = [
                "email" => $em,
                "status" => "invalid",
                "score" => 10,
                "verdict" => "No mail exchanger (MX) records found for domain",
                "smtpCheck" => "failed"
            ];
            continue;
        }

        array_multisort($mxWeights, $mxHosts);
        $targetMx = $mxHosts[0];

        // Attempt direct SMTP handshake (Port 25) with 5-second timeout
        $sock = @fsockopen($targetMx, 25, $errno, $errstr, 5);
        if (!$sock) {
            $results[] = [
                "email" => $em,
                "status" => "risky",
                "score" => 65,
                "verdict" => "Domain & MX active, but direct mailbox ping timed out or blocked: (" . $errno . ") " . $errstr,
                "smtpCheck" => "unreachable",
                "mx" => $targetMx
            ];
            continue;
        }

        stream_set_timeout($sock, 6);
        $banner = getSmtpResponse($sock);

        fputs($sock, "EHLO sevenfigurestudio.us\r\n");
        $ehloRes = getSmtpResponse($sock);
        if (substr($ehloRes, 0, 1) === "5") {
            fputs($sock, "HELO sevenfigurestudio.us\r\n");
            getSmtpResponse($sock);
        }

        fputs($sock, "MAIL FROM:<verify@sevenfigurestudio.us>\r\n");
        $mailRes = getSmtpResponse($sock);

        fputs($sock, "RCPT TO:<" . $em . ">\r\n");
        $rcptRes = getSmtpResponse($sock);

        fputs($sock, "QUIT\r\n");
        fclose($sock);

        $code = intval(substr($rcptRes, 0, 3));
        if ($code === 250 || $code === 251) {
            $results[] = [
                "email" => $em,
                "status" => "valid",
                "score" => 98,
                "verdict" => "Verified deliverable mailbox (SMTP 250 OK)",
                "smtpCheck" => "passed",
                "response" => trim($rcptRes)
            ];
        } else if ($code >= 500 && $code < 600) {
            $results[] = [
                "email" => $em,
                "status" => "invalid",
                "score" => 10,
                "verdict" => "Mailbox does not exist (Server rejected with code " . $code . ")",
                "smtpCheck" => "failed",
                "response" => trim($rcptRes)
            ];
        } else {
            $results[] = [
                "email" => $em,
                "status" => "risky",
                "score" => 60,
                "verdict" => "Temporary response from server (code " . $code . ")",
                "smtpCheck" => "greylisted",
                "response" => trim($rcptRes)
            ];
        }
    }

    echo json_encode([
        "ok" => true,
        "results" => $results,
        "single" => count($results) === 1 ? $results[0] : null
    ]);
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

// Server: requested > saved by the user > provider default.
$savedAccount = $CUSTOM_ACCOUNTS[$fromEmail] ?? [];
$smtpHost = !empty($data["host"]) ? trim($data["host"]) : (!empty($savedAccount["host"]) ? $savedAccount["host"] : ($isGoDaddy ? "smtpout.secureserver.net" : "smtp.hostinger.com"));
// An empty password means "use the stored one" (PHP ?? would keep the empty string).
$password = !empty($data["password"]) ? $data["password"] : $ALL_MAILBOXES[$fromEmail] ?? ($isGoDaddy ? $GODADDY_PASS : "");

$msgId = "<" . bin2hex(random_bytes(16)) . "@" . $domain . ">";
$boundary = "b_" . bin2hex(random_bytes(12));

$headers = [];
$headers[] = "From: " . ($fromName ? "=?UTF-8?B?" . base64_encode($fromName) . "?= <" . $fromEmail . ">" : $fromEmail);
$headers[] = "To: <" . $to . ">";
$headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
$headers[] = "Reply-To: <" . $fromEmail . ">";
$headers[] = "Return-Path: <" . $fromEmail . ">";
$headers[] = "Message-ID: " . $msgId;
$headers[] = "Date: " . date("r");
$headers[] = "MIME-Version: 1.0";
// 2024 Google & Yahoo compliance headers (mandatory for inboxing)
$headers[] = "List-Unsubscribe: <mailto:unsubscribe@" . $domain . "?subject=unsubscribe>";
$headers[] = "List-Unsubscribe-Post: List-Unsubscribe=One-Click";

// Custom headers (Warmup markers, In-Reply-To, References)
if (!empty($data["headers"]) && is_array($data["headers"])) {
    foreach ($data["headers"] as $hKey => $hVal) {
        $headers[] = trim($hKey) . ": " . trim($hVal);
    }
}

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
// Method 1: Authenticated Direct SMTP socket to Provider Mail Server
// ----------------------------------------------------------------------
function sendViaSmtpSocket($host, $port, $domain, $fromEmail, $password, $to, $bodyContent, $msgId, $provider) {
    list($socket, $sessionErr) = smtpOpenSession($host, $port, $domain, 15);
    if (!$socket) {
        return ["ok" => false, "error" => $sessionErr];
    }
    fputs($socket, "AUTH LOGIN\r\n");
    getSmtpResponse($socket);
    fputs($socket, base64_encode($fromEmail) . "\r\n");
    getSmtpResponse($socket);
    fputs($socket, base64_encode($password) . "\r\n");
    $authRes = getSmtpResponse($socket);

    if (substr($authRes, 0, 3) !== "235") {
        fclose($socket);
        return ["ok" => false, "error" => "Auth failed on {$host}:{$port}: " . trim($authRes)];
    }

    fputs($socket, "MAIL FROM:<" . $fromEmail . ">\r\n");
    getSmtpResponse($socket);
    fputs($socket, "RCPT TO:<" . $to . ">\r\n");
    $rcptRes = getSmtpResponse($socket);
    if (substr($rcptRes, 0, 3) !== "250" && substr($rcptRes, 0, 3) !== "251") {
        fclose($socket);
        return ["ok" => false, "error" => "Recipient rejected by {$host}: " . trim($rcptRes)];
    }

    fputs($socket, "DATA\r\n");
    getSmtpResponse($socket);
    fputs($socket, $bodyContent . "\r\n.\r\n");
    $sendRes = getSmtpResponse($socket);
    fputs($socket, "QUIT\r\n");
    fclose($socket);

    if (substr($sendRes, 0, 3) === "250") {
        return [
            "ok" => true,
            "messageId" => $msgId,
            "fromEmail" => $fromEmail,
            "provider" => $provider,
            "to" => $to,
            "method" => "authenticated_smtp",
            "port" => $port,
            "response" => trim($sendRes)
        ];
    }

    return ["ok" => false, "error" => "Delivery failed: " . trim($sendRes)];
}

// Try primary and secondary ports
$requestedPort = intval($data["port"] ?? ($savedAccount["port"] ?? 0));
$portsToTry = smtpPortsFor($smtpHost, $requestedPort);
$lastSmtpErr = "";

foreach ($portsToTry as $port) {
    $res = sendViaSmtpSocket($smtpHost, $port, $domain, $fromEmail, $password, $to, $bodyContent, $msgId, $isGoDaddy ? "godaddy" : "hostinger");
    if ($res["ok"]) {
        rememberWorkingPort($smtpHost, $port);
        echo json_encode($res);
        exit;
    }
    $lastSmtpErr = $res["error"];
    // Only an unreachable port is worth retrying on the next one (not a refused login or recipient).
    if (!isSmtpConnectError($res["error"])) break;
}

// ----------------------------------------------------------------------
// NEVER fall back to PHP native mail() for ANY provider.
// On Hostinger, PHP mail() routes via relay.mailchannels.net which is
// blocked by Microsoft Office 365, Proofpoint, and Spamhaus, resulting
// in immediate delivery bounces. All mail MUST be authenticated SMTP.
// ----------------------------------------------------------------------
http_response_code(500);
echo json_encode([
    "ok" => false,
    "error" => "Authenticated SMTP delivery failed on " . $smtpHost . " (" . $lastSmtpErr . "). Refused unauthenticated mail() fallback to protect domain reputation and prevent MailChannels bounces."
]);


