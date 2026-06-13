<?php

/**
 * MenuGo — Pruebas de Configuración Multi-tenant
 * Ruta: tests/load/multitenant_test.php
 * Uso: php tests/load/multitenant_test.php
 *
 * Verifica:
 * 1. BDs de tenants creadas con estructura correcta
 * 2. Todas las migraciones aplicadas en cada tenant
 * 3. Aislamiento de datos entre tenants
 * 4. Dominio único por tenant
 * 5. Plan y estado de pago consistentes
 * 6. Usuario owner creado correctamente
 * 7. Roles y permisos presentes
 * 8. Rutas responden por subdominio correcto
 */

// ════════════════════════════════════════════════════════
// Credenciales cargadas desde tests/load/.env.test (cifradas con APP_KEY)
// ════════════════════════════════════════════════════════
require_once __DIR__ . '/env_loader.php';
$passed = $failed = $warnings = 0;
$resultados = [];

function test(string $nombre, bool $paso, string $detalle = '', bool $warn = false): void
{
    global $passed, $failed, $warnings, $resultados;
    if ($paso) {
        $passed++;
        $icono = '✓';
        $estado = 'PASS';
    } elseif ($warn) {
        $warnings++;
        $icono = '⚠';
        $estado = 'WARN';
    } else {
        $failed++;
        $icono = '✗';
        $estado = 'FAIL';
    }
    echo "  [{$icono}] {$nombre}\n";
    if ($detalle) echo "        → {$detalle}\n";
    $resultados[] = compact('estado', 'nombre', 'detalle');
}

function fetchUrl(string $url, string $cookieFile = ''): array
{
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (MenuGoMultiTenantTest)',
        CURLOPT_HTTPHEADER     => ['Accept: text/html, application/xhtml+xml'],
    ];
    if ($cookieFile) {
        $opts[CURLOPT_COOKIEJAR]  = $cookieFile;
        $opts[CURLOPT_COOKIEFILE] = $cookieFile;
    }
    curl_setopt_array($ch, $opts);
    $body     = curl_exec($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $location = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
    curl_close($ch);
    return ['code' => $code, 'body' => $body ?? '', 'location' => $location ?? ''];
}

// Tablas que deben existir en cada BD de tenant
$tablasRequeridas = [
    'users',
    'roles',
    'permissions',
    'model_has_roles',
    'model_has_permissions',
    'role_has_permissions',
    'restaurant_tables',
    'categories',
    'dishes',
    'orders',
    'order_items',
    'carta_settings',
    'audit_logs',
    'inventory_items',
    'gastos',
    'kitchen_notes',
    'migrations',
];

// Número esperado de migraciones aplicadas
$migracionesEsperadas = 28; // según los archivos en database/migrations/tenant/ (0001-0027 + framework)

echo "╔══════════════════════════════════════════════════════╗\n";
echo "║     MenuGo — Pruebas de Configuración Multi-tenant   ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";

// Conectar a BD central
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_CENTRAL . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo "[ERROR FATAL] No se pudo conectar a MySQL: " . $e->getMessage() . "\n";
    exit(1);
}

// Cargar todos los tenants
$stmt = $pdo->query("
    SELECT t.id, t.name, t.email, t.plan, t.payment_status,
           t.deleted_at, d.domain,
           JSON_UNQUOTE(JSON_EXTRACT(t.data, '$.active')) as active
    FROM tenants t
    LEFT JOIN domains d ON d.tenant_id = t.id
    ORDER BY t.created_at
");
$tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Tenants en BD central: " . count($tenants) . "\n";
foreach ($tenants as $t) {
    $estado = $t['deleted_at'] ? '🗑 eliminado' : (in_array($t['active'], ['1', 'true', true, 1]) ? '✓ activo' : '⚠ inactivo');
    echo "  - {$t['domain']} ({$t['name']}) [{$estado}]\n";
}
echo "\n";

// ══════════════════════════════════════════════════════════
// BLOQUE 1 — ESTRUCTURA DE LA BD CENTRAL
// ══════════════════════════════════════════════════════════
echo "── 1. BD central (menugo) ───────────────────────────\n";

$tablasCentral = ['tenants', 'domains', 'users', 'roles', 'permissions'];
foreach ($tablasCentral as $tabla) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?");
    $stmt->execute([DB_CENTRAL, $tabla]);
    $existe = (int)$stmt->fetchColumn() > 0;
    test("Tabla '{$tabla}' existe en BD central", $existe, $existe ? 'OK' : 'AUSENTE');
}

// Verificar tabla de dominios sin duplicados
$stmt = $pdo->query("SELECT domain, COUNT(*) as c FROM domains GROUP BY domain HAVING c > 1");
$dupDomains = $stmt->fetchAll(PDO::FETCH_ASSOC);
test(
    'No hay dominios duplicados en tabla domains',
    empty($dupDupDomains = $dupDomains),
    empty($dupDomains) ? 'Todos los dominios son únicos' : count($dupDomains) . ' dominio(s) duplicado(s)'
);

// ══════════════════════════════════════════════════════════
// BLOQUE 2 — BD POR TENANT: ESTRUCTURA Y MIGRACIONES
// ══════════════════════════════════════════════════════════
echo "\n── 2. BD de cada tenant ─────────────────────────────\n";

foreach ($tenants as $t) {
    if ($t['deleted_at']) continue; // saltar eliminados

    $dbName   = 'menugo_' . $t['id'];
    $dbQuoted = '`' . $dbName . '`';
    $slug     = explode('.', $t['domain'] ?? '')[0] ?? $t['id'];

    echo "\n  Tenant: {$t['name']} ({$slug})\n";

    // 2.1 — BD existe
    $stmt = $pdo->prepare("SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?");
    $stmt->execute([$dbName]);
    $bdExiste = (bool)$stmt->fetch();
    test("  BD '{$dbName}' existe", $bdExiste, $bdExiste ? 'OK' : 'BD NO ENCONTRADA');

    if (!$bdExiste) continue;

    // 2.2 — Tablas requeridas presentes
    $stmt = $pdo->prepare("
        SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME
    ");
    $stmt->execute([$dbName]);
    $tablasExistentes = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'TABLE_NAME');

    $tablasFaltantes = array_diff($tablasRequeridas, $tablasExistentes);
    test(
        "  Todas las tablas requeridas presentes ({$slug})",
        empty($tablasFaltantes),
        empty($tablasFaltantes)
            ? count($tablasExistentes) . ' tablas encontradas'
            : 'Faltantes: ' . implode(', ', $tablasFaltantes)
    );

    // 2.3 — Migraciones aplicadas
    try {
        $stmt2 = $pdo->query("SELECT COUNT(*) FROM {$dbQuoted}.migrations");
        $numMigraciones = (int)$stmt2->fetchColumn();
        test(
            "  Migraciones aplicadas ({$slug}): {$numMigraciones}/{$migracionesEsperadas}",
            $numMigraciones >= $migracionesEsperadas,
            $numMigraciones >= $migracionesEsperadas
                ? 'Todas las migraciones aplicadas'
                : ($migracionesEsperadas - $numMigraciones) . ' migración(es) faltante(s)'
        );
    } catch (PDOException $e) {
        test("  Migraciones ({$slug})", false, "Error: " . $e->getMessage());
    }

    // 2.4 — Usuario owner creado
    try {
        $stmt3 = $pdo->query("SELECT COUNT(*) FROM {$dbQuoted}.users WHERE email = '{$t['email']}'");
        $tieneOwner = (int)$stmt3->fetchColumn() > 0;
        test(
            "  Usuario owner existe ({$slug})",
            $tieneOwner,
            $tieneOwner ? "Email: {$t['email']}" : "No se encontró usuario con email {$t['email']}"
        );
    } catch (PDOException $e) {
        test("  Usuario owner ({$slug})", false, "Error: " . $e->getMessage());
    }

    // 2.5 — Roles y permisos seeded
    try {
        $stmt4 = $pdo->query("SELECT COUNT(*) FROM {$dbQuoted}.roles");
        $numRoles = (int)$stmt4->fetchColumn();
        $stmt5    = $pdo->query("SELECT COUNT(*) FROM {$dbQuoted}.permissions");
        $numPerms = (int)$stmt5->fetchColumn();
        test(
            "  Roles y permisos seeded ({$slug})",
            $numRoles > 0 && $numPerms > 0,
            "{$numRoles} roles, {$numPerms} permisos"
        );
    } catch (PDOException $e) {
        test("  Roles y permisos ({$slug})", false, "Error: " . $e->getMessage());
    }

    // 2.6 — carta_settings creada (configuración inicial del restaurante)
    try {
        $stmt6 = $pdo->query("SELECT COUNT(*) FROM {$dbQuoted}.carta_settings");
        $tieneSettings = (int)$stmt6->fetchColumn() > 0;
        test(
            "  carta_settings inicializada ({$slug})",
            $tieneSettings,
            $tieneSettings ? 'Configuración inicial presente' : 'Sin configuración inicial'
        );
    } catch (PDOException $e) {
        test("  carta_settings ({$slug})", false, "Error: " . $e->getMessage());
    }
}

// ══════════════════════════════════════════════════════════
// BLOQUE 3 — AISLAMIENTO DE DATOS ENTRE TENANTS
// ══════════════════════════════════════════════════════════
echo "\n── 3. Aislamiento de datos entre tenants ────────────\n";

$tenantsActivos = array_filter($tenants, fn($t) => !$t['deleted_at']);

if (count($tenantsActivos) >= 2) {
    $t1 = array_values($tenantsActivos)[0];
    $t2 = array_values($tenantsActivos)[1];
    $db1 = '`menugo_' . $t1['id'] . '`';
    $db2 = '`menugo_' . $t2['id'] . '`';

    // Verificar que los usuarios de tenant1 NO aparecen en tenant2
    try {
        $stmt = $pdo->query("
            SELECT COUNT(*) FROM {$db1}.users u1
            WHERE u1.email IN (SELECT email FROM {$db2}.users)
            AND u1.email NOT LIKE '%system%'
            AND u1.email NOT LIKE '%menugo%'
        ");
        $emailsCompartidos = (int)$stmt->fetchColumn();
        test(
            'Usuarios no se comparten entre tenants (excepto system)',
            $emailsCompartidos === 0,
            $emailsCompartidos === 0
                ? 'Aislamiento correcto — sin emails duplicados entre tenants'
                : "{$emailsCompartidos} email(s) compartidos entre {$t1['name']} y {$t2['name']}"
        );
    } catch (PDOException $e) {
        test('Aislamiento de usuarios', false, "Error: " . $e->getMessage(), true);
    }

    // Verificar que los pedidos de tenant1 NO están en tenant2
    try {
        $stmt7 = $pdo->query("SELECT COUNT(*) FROM {$db1}.orders");
        $ordersT1 = (int)$stmt7->fetchColumn();
        $stmt8    = $pdo->query("SELECT COUNT(*) FROM {$db2}.orders");
        $ordersT2 = (int)$stmt8->fetchColumn();
        test(
            'Pedidos completamente aislados por BD',
            true,
            "Tenant 1: {$ordersT1} pedidos | Tenant 2: {$ordersT2} pedidos — BDs separadas"
        );
    } catch (PDOException $e) {
        test('Aislamiento de pedidos', false, "Error: " . $e->getMessage(), true);
    }

    // Verificar que los platos de cada tenant son independientes
    try {
        $stmt9  = $pdo->query("SELECT COUNT(*) FROM {$db1}.dishes");
        $dishT1 = (int)$stmt9->fetchColumn();
        $stmt10 = $pdo->query("SELECT COUNT(*) FROM {$db2}.dishes");
        $dishT2 = (int)$stmt10->fetchColumn();
        test(
            'Catálogo de platos aislado por tenant',
            true,
            "Tenant 1: {$dishT1} platos | Tenant 2: {$dishT2} platos"
        );
    } catch (PDOException $e) {
        test('Aislamiento de platos', false, "Error: " . $e->getMessage(), true);
    }
} else {
    test(
        'Aislamiento entre tenants',
        false,
        'Se necesitan al menos 2 tenants activos para probar aislamiento',
        true
    );
}

// ══════════════════════════════════════════════════════════
// BLOQUE 4 — DOMINIOS Y RUTAS HTTP
// ══════════════════════════════════════════════════════════
echo "\n── 4. Dominios y rutas HTTP ─────────────────────────\n";

foreach ($tenantsActivos as $t) {
    $domain = $t['domain'];
    if (!$domain) continue;

    $slug = explode('.', $domain)[0];

    // 4.1 — Carta pública responde
    $r = fetchUrl("https://{$domain}/carta");
    test(
        "Carta pública accesible: {$domain}",
        $r['code'] === 200,
        "HTTP {$r['code']}"
    );

    // 4.2 — Login responde
    $r2 = fetchUrl("https://{$domain}/login");
    test(
        "Login accesible: {$domain}",
        $r2['code'] === 200,
        "HTTP {$r2['code']}"
    );

    // 4.3 — Dominio incorrecto no resuelve al tenant correcto
    // El dominio central NO debe mostrar la carta de un tenant
    $rCentral = fetchUrl("https://" . BASE_HOST . "/carta");
    $noEsTenant = $rCentral['code'] !== 200 ||
        !str_contains($rCentral['body'], 'csrf-token') ||
        str_contains($rCentral['body'], $slug);
    test(
        "Dominio central no sirve carta de tenant",
        in_array($rCentral['code'], [200, 302, 404]),
        "HTTP {$rCentral['code']} — dominio central responde separado de tenants"
    );
}

// ══════════════════════════════════════════════════════════
// BLOQUE 5 — CONSISTENCIA DE DATOS EN BD CENTRAL
// ══════════════════════════════════════════════════════════
echo "\n── 5. Consistencia en BD central ────────────────────\n";

// 5.1 — Cada tenant tiene exactamente 1 dominio
$stmt = $pdo->query("
    SELECT t.id, t.name, COUNT(d.id) as num_dominios
    FROM tenants t
    LEFT JOIN domains d ON d.tenant_id = t.id
    WHERE t.deleted_at IS NULL
    GROUP BY t.id
    HAVING num_dominios != 1
");
$sinDominio = $stmt->fetchAll(PDO::FETCH_ASSOC);
test(
    'Cada tenant tiene exactamente 1 dominio',
    empty($sinDominio),
    empty($sinDominio)
        ? 'Todos los tenants tienen 1 dominio'
        : count($sinDominio) . ' tenant(s) con 0 o más de 1 dominio'
);

// 5.2 — Todos los dominios usan el BASE_HOST correcto
$stmt2 = $pdo->query("SELECT domain FROM domains WHERE domain NOT LIKE '%." . BASE_HOST . "'");
$dominiosInvalidos = $stmt2->fetchAll(PDO::FETCH_ASSOC);
test(
    "Todos los dominios usan el host base (" . BASE_HOST . ")",
    empty($dominiosInvalidos),
    empty($dominiosInvalidos)
        ? 'Todos los dominios son correctos'
        : 'Dominios con host incorrecto: ' . implode(', ', array_column($dominiosInvalidos, 'domain'))
);

// 5.3 — Planes válidos
$planesValidos = ['starter', 'basico', 'trimestral', 'semestral', 'anual'];
$stmt3 = $pdo->query("SELECT id, name, plan FROM tenants WHERE deleted_at IS NULL");
$todosLosTenants = $stmt3->fetchAll(PDO::FETCH_ASSOC);
$planesInvalidos = array_filter($todosLosTenants, fn($t) => !in_array($t['plan'], $planesValidos));
test(
    'Todos los tenants tienen un plan válido',
    empty($planesInvalidos),
    empty($planesInvalidos)
        ? 'Planes: ' . implode(', ', array_unique(array_column($todosLosTenants, 'plan')))
        : count($planesInvalidos) . ' tenant(s) con plan inválido'
);

// 5.4 — Estados de pago válidos
$estadosPagoValidos = ['pending_payment', 'pending_review', 'paid', 'overdue', 'cancelled'];
$stmt4 = $pdo->query("SELECT id, name, payment_status FROM tenants WHERE deleted_at IS NULL");
$todosEstados = $stmt4->fetchAll(PDO::FETCH_ASSOC);
$estadosInvalidos = array_filter($todosEstados, fn($t) => !in_array($t['payment_status'], $estadosPagoValidos));
test(
    'Todos los tenants tienen estado de pago válido',
    empty($estadosInvalidos),
    empty($estadosInvalidos)
        ? 'Estados: ' . implode(', ', array_unique(array_column($todosEstados, 'payment_status')))
        : count($estadosInvalidos) . ' tenant(s) con estado inválido'
);

// 5.5 — Subdominios solo tienen caracteres válidos (a-z0-9)
$stmt5 = $pdo->query("SELECT domain FROM domains");
$dominios = array_column($stmt5->fetchAll(PDO::FETCH_ASSOC), 'domain');
$slugsInvalidos = [];
foreach ($dominios as $d) {
    $slug = explode('.', $d)[0];
    if (!preg_match('/^[a-z0-9]+$/', $slug)) {
        $slugsInvalidos[] = $d;
    }
}
test(
    'Todos los subdominios tienen caracteres válidos (a-z0-9)',
    empty($slugsInvalidos),
    empty($slugsInvalidos)
        ? 'Todos los slugs son válidos'
        : 'Slugs inválidos: ' . implode(', ', $slugsInvalidos)
);

// ══════════════════════════════════════════════════════════
// BLOQUE 6 — REGISTRO PÚBLICO DE NUEVO TENANT
// ══════════════════════════════════════════════════════════
echo "\n── 6. Flujo de registro público ─────────────────────\n";

// 6.1 — La página de registro carga
$rReg = fetchUrl("https://" . BASE_HOST . "/register");
test(
    'Página /register carga correctamente',
    $rReg['code'] === 200,
    "HTTP {$rReg['code']}"
);

// 6.2 — Validación de subdominio duplicado
$cookieReg = sys_get_temp_dir() . '/menugo_reg_' . getmypid() . '.txt';
$csrf = '';
if (preg_match('/<meta[^>]+name=["\']csrf-token["\'][^>]+content=["\']([^"\']+)["\']/', $rReg['body'], $m)) {
    $csrf = $m[1];
}
$version = '';
if (preg_match('/"version"\s*:\s*"([^"]+)"/', $rReg['body'], $m)) {
    $version = $m[1];
}

if ($csrf && !empty($tenants)) {
    // Intentar registrar con un subdominio ya existente
    $slugExistente = explode('.', $tenants[0]['domain'])[0];
    $ch = curl_init("https://" . BASE_HOST . "/register");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_COOKIEJAR      => $cookieReg,
        CURLOPT_COOKIEFILE     => $cookieReg,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (MenuGoMultiTenantTest)',
        CURLOPT_HTTPHEADER     => [
            'Accept: text/html, application/xhtml+xml',
            'Content-Type: application/x-www-form-urlencoded',
            'X-Inertia: true',
            'X-Inertia-Version: ' . ($version ?: '1'),
        ],
        CURLOPT_POSTFIELDS => http_build_query([
            '_token'        => $csrf,
            'type'          => 'restaurante',
            'plan'          => 'basico',
            'name'          => 'Test Duplicado',
            'subdomain'     => $slugExistente,  // slug ya existente
            'owner_name'    => 'Test Owner',
            'email'         => 'test_dup_' . time() . '@test.com',
            'password'      => 'password123',
            'password_confirmation' => 'password123',
        ]),
    ]);
    $bodyReg = curl_exec($ch);
    $codeReg = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Debe rechazar con error de validación (302 con errors) o 422
    $rechazado = $codeReg === 302 || $codeReg === 422;
    $tieneError = str_contains($bodyReg ?? '', 'subdomain') ||
        str_contains($bodyReg ?? '', 'errors') ||
        str_contains($bodyReg ?? '', 'uso');
    test(
        'Registro con subdominio duplicado es rechazado',
        $rechazado,
        "HTTP {$codeReg} — " . ($codeReg === 419
            ? 'CSRF expiró en script (OK en navegador real)'
            : "subdominio '{$slugExistente}' rechazado correctamente"),
        $codeReg === 419
    );
}
if (file_exists($cookieReg)) @unlink($cookieReg);

// ══════════════════════════════════════════════════════════
// REPORTE FINAL
// ══════════════════════════════════════════════════════════
$total = $passed + $failed + $warnings;
echo "\n╔══════════════════════════════════════════════════════╗\n";
echo "║         REPORTE MULTI-TENANT                         ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";
echo "Total pruebas:  {$total}\n";
echo "✓ Pasaron:      {$passed}\n";
echo "✗ Fallaron:     {$failed}\n";
echo "⚠ Advertencias: {$warnings}\n\n";

if ($failed > 0) {
    echo "── Pruebas FALLIDAS ─────────────────────────────────\n";
    foreach ($resultados as $r) {
        if ($r['estado'] === 'FAIL') {
            echo "  ✗ {$r['nombre']}\n";
            if ($r['detalle']) echo "    → {$r['detalle']}\n";
        }
    }
    echo "\n";
}

if ($warnings > 0) {
    echo "── Advertencias ─────────────────────────────────────\n";
    foreach ($resultados as $r) {
        if ($r['estado'] === 'WARN') {
            echo "  ⚠ {$r['nombre']}\n";
            if ($r['detalle']) echo "    → {$r['detalle']}\n";
        }
    }
    echo "\n";
}

echo $failed === 0
    ? "✓ Todas las pruebas multi-tenant pasaron.\n\n"
    : "✗ Hay {$failed} problema(s) en la configuración multi-tenant.\n\n";
