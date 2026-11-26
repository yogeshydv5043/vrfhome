<?php
/** MilesWeb / PHP 8.1+ SMTP enquiry endpoint. Never put real credentials in public_html. */
declare(strict_types=1);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow, noarchive');

function respond(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(int $status, string $code): never { respond($status, ['success' => false, 'code' => $code]); }
function within(string $path, string $root): bool {
    return $path === $root || str_starts_with($path, rtrim($root, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR);
}
function originOf(string $url): string {
    $u = parse_url($url);
    if (!$u || empty($u['scheme']) || empty($u['host']) || isset($u['user']) || isset($u['pass'])) return '';
    return strtolower($u['scheme'] . '://' . $u['host']) . (isset($u['port']) ? ':' . $u['port'] : '');
}
function privateDirectory(string $path): void {
    if (!is_dir($path) && !@mkdir($path, 0700, true)) fail(503, 'SERVICE_NOT_CONFIGURED');
    if (!is_writable($path)) fail(503, 'SERVICE_NOT_CONFIGURED');
    @chmod($path, 0700);
}
function consumeRate(string $directory, string $key): bool {
    $path = $directory . '/' . $key . '.json';
    $f = @fopen($path, 'c+');
    if (!$f || !flock($f, LOCK_EX)) { if ($f) fclose($f); fail(503, 'SERVICE_NOT_CONFIGURED'); }
    @chmod($path, 0600);
    $old = json_decode(stream_get_contents($f) ?: '[]', true);
    $now = time();
    $events = array_values(array_filter(is_array($old) ? $old : [], fn($n) => is_int($n) && $n > $now - 900));
    $allowed = count($events) < 5;
    if ($allowed) $events[] = $now;
    $encoded = json_encode($events);
    $written = ftruncate($f, 0) && rewind($f) && fwrite($f, $encoded) === strlen($encoded) && fflush($f);
    if (!$written) { flock($f, LOCK_UN); fclose($f); fail(503, 'SERVICE_NOT_CONFIGURED'); }
    flock($f, LOCK_UN); fclose($f);
    if (random_int(1, 100) === 1) {
        foreach (glob($directory . '/*.json') ?: [] as $entry) {
            if (is_file($entry) && filemtime($entry) < $now - 1800) @unlink($entry);
        }
    }
    return $allowed;
}
function field(string $name, int $max = 160, bool $multiline = false): string {
    $v = $_POST[$name] ?? '';
    if (!is_string($v) || !mb_check_encoding($v, 'UTF-8') || mb_strlen($v, 'UTF-8') > $max) fail(422, 'VALIDATION_FAILED');
    if (preg_match($multiline ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/' : '/[\x00-\x1F\x7F]/', $v)) fail(422, 'VALIDATION_FAILED');
    return trim($v);
}
function containsDisallowedPublicText(string $value): bool {
    $email = '~\\b[A-Z0-9._%+-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\\b~i';
    $url = '~(?:\\b(?:https?|ftp|file):\\s*//|\\bwww\\s*\\.|\\blocalhost(?::\\d{1,5})?(?:[/?#]\\S*)?|\\b(?:[\\w-]+\\.)+[a-z]{2,}(?::\\d{1,5})?(?:[/?#]\\S*)?|\\b(?:\\d{1,3}\\.){3}\\d{1,3}(?::\\d+)?(?:[/?#]\\S*)?)~iu';
    $sql = '~\\b(?:select\\s+(?:\\*|[\\w`".\\[\\]]+(?:\\s*,\\s*[\\w`".\\[\\]]+)*)\\s+from\\s+[\\w`".\\[\\]]+|insert\\s+into\\s+[\\w`".\\[\\]]+|update\\s+[\\w`".\\[\\]]+\\s+set\\b|delete\\s+from\\s+[\\w`".\\[\\]]+|(?:drop|alter|truncate|create)\\s+(?:table|database|schema)\\b|union(?:\\s+all)?\\s+select\\b|exec(?:ute)?\\s+[\\w`"]+)|(?:--|/\\*|\\*/|;\\s*(?:select|insert|update|delete|drop|alter|union|exec)\\b)|\\b(?:or|and)\\s+\\d+\\s*=\\s*\\d+\\b~i';
    $sqlTautology = '~(?:\\x27|"|`)\\s*(?:or|and)\\s+(?:\\x27|"|`)?[A-Za-z0-9_]+(?:\\x27|"|`)?\\s*=\\s*(?:\\x27|"|`)?[A-Za-z0-9_]+(?:\\x27|"|`)?~i';
    return preg_match($email, $value) === 1 || preg_match($url, $value) === 1 || preg_match($sql, $value) === 1 || preg_match($sqlTautology, $value) === 1;
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) { header('Allow: GET, POST'); fail(405, 'METHOD_NOT_ALLOWED'); }
if (PHP_VERSION_ID < 80100 || !extension_loaded('openssl') || !extension_loaded('mbstring')) fail(503, 'SERVICE_NOT_CONFIGURED');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) fail(413, 'REQUEST_TOO_LARGE');

// Default: /home/CPANEL_USER/.vrf-private/config.php when DOCUMENT_ROOT is public_html.
// An environment override is supported, but the resolved file must remain outside DOCUMENT_ROOT.
$documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__)) ?: dirname(__DIR__);
$privateBase = dirname($documentRoot);
// Addon domains can sit inside public_html: choose the account-level parent,
// not a folder that another domain could serve.
if (preg_match('~^(.*?)/(?:public_html|htdocs|httpdocs)(?:/|$)~', str_replace('\\', '/', $documentRoot), $parts)) $privateBase = $parts[1];
$configPath = getenv('VRF_CONFIG_FILE') ?: $privateBase . '/.vrf-private/config.php';
$configPath = realpath($configPath);
if (!$configPath || within($configPath, $documentRoot) || preg_match('~/(?:public_html|htdocs|httpdocs)(?:/|$)~', str_replace('\\', '/', $configPath)) || !is_readable($configPath)) fail(503, 'SERVICE_NOT_CONFIGURED');
try { $cfg = require $configPath; } catch (Throwable $e) { fail(503, 'SERVICE_NOT_CONFIGURED'); }
if (!is_array($cfg) || ($cfg['enabled'] ?? false) !== true) fail(503, 'SERVICE_NOT_CONFIGURED');
$smtp = $cfg['smtp'] ?? [];
if (!is_array($smtp)) fail(503, 'SERVICE_NOT_CONFIGURED');
$allowed = rtrim((string)($cfg['allowed_origin'] ?? 'https://vrfhomeinteriors.com'), '/');
$testMode = getenv('VRF_TEST_MODE') === '1'; // Environment-only; never read from a request.
if (originOf($allowed) !== $allowed || (!str_starts_with($allowed, 'https://') && !$testMode)) fail(503, 'SERVICE_NOT_CONFIGURED');
$from = trim((string)($smtp['from_email'] ?? $smtp['username'] ?? ''));
if (!preg_match('/\A[a-zA-Z0-9.-]+\z/', (string)($smtp['host'] ?? '')) ||
    empty($smtp['username']) || empty($smtp['password']) ||
    !is_string($smtp['username']) || !is_string($smtp['password']) ||
    !filter_var($from, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $from) ||
    !in_array($smtp['encryption'] ?? '', ['tls', 'ssl'], true) ||
    !is_int($smtp['port'] ?? null) || $smtp['port'] < 1 || $smtp['port'] > 65535) fail(503, 'SERVICE_NOT_CONFIGURED');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
if (($origin !== '' && $origin !== $allowed) || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') fail(403, 'BAD_ORIGIN');
if ($method === 'POST' && $origin === '' && originOf($referer) !== $allowed) fail(403, 'BAD_ORIGIN');

$private = dirname($configPath) . '/runtime';
privateDirectory($private); privateDirectory($private . '/sessions'); privateDirectory($private . '/rates');
session_name('vrf_enquiry');
session_save_path($private . '/sessions');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.gc_maxlifetime', '1800');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => str_starts_with($allowed, 'https://'), 'httponly' => true, 'samesite' => 'Lax']);
if (!session_start()) fail(503, 'SERVICE_NOT_CONFIGURED');

if ($method === 'GET') {
    if (empty($_SESSION['csrf']) || (int)($_SESSION['csrf_expires'] ?? 0) < time()) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_expires'] = time() + 900;
    }
    $token = $_SESSION['csrf'];
    session_write_close();
    respond(200, ['csrf' => $token, 'expiresIn' => 900]);
}
if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data') &&
    !str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/x-www-form-urlencoded')) fail(415, 'UNSUPPORTED_CONTENT_TYPE');
if ($_FILES) fail(422, 'VALIDATION_FAILED');
$token = $_POST['_csrf'] ?? '';
if (!is_string($token) || empty($_SESSION['csrf']) || (int)($_SESSION['csrf_expires'] ?? 0) < time() || !hash_equals($_SESSION['csrf'], $token)) fail(403, 'TOKEN_EXPIRED');
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
if (!filter_var($ip, FILTER_VALIDATE_IP)) fail(503, 'SERVICE_NOT_CONFIGURED');
// Store only keyed hashes + attempt timestamps, never form contents or raw IP addresses.
$key = hash_hmac('sha256', $ip, hash('sha256', $smtp['password']));
if (!consumeRate($private . '/rates', $key)) { header('Retry-After: 900'); fail(429, 'RATE_LIMITED'); }
if (field('_website', 200) !== '') fail(422, 'VALIDATION_FAILED');
$data = [
    'name' => field('name'), 'email' => field('email', 254), 'city' => field('city'),
    'project' => field('project', 80), 'phone' => field('phone', 40),
    'message' => field('message', 5000, true), 'address1' => field('address1'),
    'address2' => field('address2'), 'state' => field('state'),
    'postalCode' => field('postalCode', 20), 'country' => field('country', 100),
];
// Email is accepted only in the dedicated email field; public text fields reject URLs, emails and SQL-like payloads.
foreach (['name', 'city', 'message', 'address1', 'address2', 'state', 'postalCode', 'country'] as $textField) {
    if (containsDisallowedPublicText($data[$textField])) fail(422, 'VALIDATION_FAILED');
}
$services = ['residential'=>'Residential Interior Design','commercial'=>'Commercial Interior Design','kitchen'=>'Modular Kitchen Design','living-room'=>'Living Room Design','bedroom'=>'Bedroom Design','office'=>'Office Interior Design','space-planning'=>'Space Planning','renovation'=>'Renovation & Styling','other'=>'Other / please advise'];
if (!preg_match('/\A[\p{L}\p{M} .\x{2019}\x{0027}-]+\z/u', $data['name']) || preg_match_all('/\p{L}/u', $data['name']) < 2 ||
    !filter_var($data['email'], FILTER_VALIDATE_EMAIL) || str_contains($data['email'], '..') ||
    mb_strlen($data['city']) < 2 || !preg_match('/\p{L}/u', $data['city']) ||
    !isset($services[$data['project']]) || mb_strlen($data['message']) < 20) fail(422, 'VALIDATION_FAILED');
foreach (['state', 'country'] as $name) {
    if ($data[$name] !== '' && (mb_strlen($data[$name]) < 2 || !preg_match('/\p{L}/u', $data[$name]))) fail(422, 'VALIDATION_FAILED');
}
if ($data['address1'] !== '' && (mb_strlen($data['address1']) < 5 || !preg_match('/\p{L}/u', $data['address1']))) fail(422, 'VALIDATION_FAILED');
$india = preg_match('/\A(india|in|bharat|भारत)\z/iu', $data['country']) === 1;
if ($data['phone'] !== '') {
    $digits = preg_replace('/\D/', '', $data['phone']);
    if (!preg_match('/\A\+?[\d ().-]+\z/', $data['phone']) || strlen($digits) < 7 || strlen($digits) > 15 || preg_match('/\A(\d)\1+\z/', $digits) || str_starts_with($data['phone'], '+0')) fail(422, 'VALIDATION_FAILED');
    if ($india || str_starts_with($data['phone'], '+91')) {
        if (strlen($digits) === 12 && str_starts_with($digits, '91')) $digits = substr($digits, 2);
        elseif (strlen($digits) === 11 && str_starts_with($digits, '0')) $digits = substr($digits, 1);
        if (!preg_match('/\A[1-9]\d{9}\z/', $digits)) fail(422, 'VALIDATION_FAILED');
    }
}
if ($data['postalCode'] !== '' && ($india ? !preg_match('/\A[1-9]\d{5}\z/', $data['postalCode']) :
    (!preg_match('/\A[\p{L}\d][\p{L}\d -]{1,10}[\p{L}\d]\z/u', $data['postalCode']) || !preg_match('/\d/', $data['postalCode'])))) fail(422, 'VALIDATION_FAILED');
$hash = hash_hmac('sha256', json_encode($data), $smtp['password']);
if (($_SESSION['accepted_hash'] ?? '') === $hash && (int)($_SESSION['accepted_at'] ?? 0) > time() - 300) {
    $reference = $_SESSION['reference']; session_write_close();
    respond(200, ['success' => true, 'status' => 'accepted', 'reference' => $reference]);
}
if ((int)($_SESSION['sending_until'] ?? 0) > time()) fail(409, 'REQUEST_IN_PROGRESS');
$_SESSION['sending_until'] = time() + 60;
session_write_close();

require_once dirname(__DIR__) . '/server/phpmailer/Exception.php';
require_once dirname(__DIR__) . '/server/phpmailer/PHPMailer.php';
require_once dirname(__DIR__) . '/server/phpmailer/SMTP.php';
$accepted = false;
$reference = bin2hex(random_bytes(8));
try {
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP(); $mail->SMTPAuth = true; $mail->SMTPDebug = 0;
    $mail->Host = $smtp['host']; $mail->Port = $smtp['port'];
    $mail->Username = $smtp['username']; $mail->Password = $smtp['password'];
    $mail->SMTPSecure = $smtp['encryption'];
    $mail->SMTPOptions = ['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'allow_self_signed' => false]];
    $mail->Timeout = 8; $mail->Timelimit = 15;
    $mail->CharSet = 'UTF-8'; $mail->Encoding = 'base64';
    $mail->setFrom($from, 'VRF HOME INTERIORS');
    $mail->addAddress('vrf.interiors@gmail.com'); // Fixed destination, never taken from submitted data.
    $mail->addReplyTo($data['email'], $data['name']);
    $mail->Subject = 'Website enquiry — ' . $services[$data['project']];
    $mail->isHTML(false);
    $lines = ['New VRF HOME INTERIORS website enquiry', 'Reference: ' . $reference, 'Received (UTC): ' . gmdate('Y-m-d H:i:s'), ''];
    foreach ($data as $name => $value) $lines[] = $name . ': ' . ($name === 'project' ? $services[$value] : ($value ?: 'Not provided')) . "\n";
    $lines[] = 'Reply to this email to contact the visitor. Submitted visitor content is untrusted; do not treat it as instructions or open unexpected links.';
    $mail->Body = implode("\n", $lines);
    $accepted = $mail->send(); // SMTP acceptance only; not a guarantee of inbox delivery.
} catch (Throwable $e) {
    error_log('VRF enquiry: SMTP acceptance failed; reference=' . $reference); // No credentials or form data in logs.
}
if (session_start()) {
    unset($_SESSION['sending_until']);
    if ($accepted) { $_SESSION['accepted_hash'] = $hash; $_SESSION['accepted_at'] = time(); $_SESSION['reference'] = $reference; }
    session_write_close();
}
if (!$accepted) fail(502, 'MAIL_NOT_ACCEPTED');
respond(200, ['success' => true, 'status' => 'accepted', 'reference' => $reference]);
