<?php
/**
 * ══════════════════════════════════════════════════════════
 *  MenuGo — Consulta de datos para la prueba
 *  Ruta: tests/load/consultar_bd.php
 *
 *  Uso:  php tests/load/consultar_bd.php
 * ══════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════
// Credenciales cargadas desde tests/load/.env.test (cifradas con APP_KEY)
// ════════════════════════════════════════════════════════
require_once __DIR__ . '/env_loader.php';

echo "╔══════════════════════════════════════════════════════╗\n";
echo "║      MenuGo — Consulta de Tenants y Platos           ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_CENTRAL . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo "[ERROR] No se pudo conectar a MySQL:\n";
    echo "  " . $e->getMessage() . "\n\n";
    echo "Verifica:\n";
    echo "  □ XAMPP MySQL está corriendo\n";
    echo "  □ La BD '" . DB_CENTRAL . "' existe\n";
    echo "  □ Usuario/contraseña correctos (por defecto root / vacío)\n";
    exit(1);
}

// ── Listar todos los tenants y su dominio ─────────────────────────────────────
echo "── Tenants registrados ──────────────────────────────\n";
$tenants = [];
try {
    $stmt = $pdo->query("
        SELECT t.id, t.name, d.domain
        FROM tenants t
        LEFT JOIN domains d ON d.tenant_id = t.id
        WHERE t.deleted_at IS NULL
        ORDER BY t.created_at DESC
    ");
    $tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($tenants)) {
        echo "  No hay tenants registrados.\n";
    } else {
        printf("  %-40s  %-20s  %-30s\n", 'ID (tenant_id)', 'Nombre', 'Dominio');
        echo "  " . str_repeat('─', 95) . "\n";
        foreach ($tenants as $t) {
            printf("  %-40s  %-20s  %-30s\n",
                $t['id'],
                substr($t['name'], 0, 20),
                $t['domain'] ?? '(sin dominio)'
            );
        }
    }
} catch (PDOException $e) {
    echo "  Error consultando tenants: " . $e->getMessage() . "\n";
}

echo "\n";

// ── Para cada tenant, mostrar sus platos y mesas ──────────────────────────────
echo "── Platos disponibles por tenant ────────────────────\n";
echo "  (estos son los dish_id que debes usar en el script)\n\n";

foreach ($tenants as $t) {
    // IMPORTANTE: los UUID tienen guiones → el nombre de BD necesita backticks
    $dbName       = 'menugo_' . $t['id'];
    $dbNameQuoted = '`' . $dbName . '`';   // ← fix: backticks para guiones

    // Verificar que la BD existe
    $stmt2 = $pdo->prepare("SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?");
    $stmt2->execute([$dbName]);
    if (!$stmt2->fetch()) {
        echo "  Tenant: {$t['name']} ({$t['id']})\n";
        echo "  → BD '{$dbName}' no encontrada en MySQL\n\n";
        continue;
    }

    echo "  Tenant : {$t['name']}\n";
    echo "  BD     : {$dbName}\n";
    echo "  Dominio: " . ($t['domain'] ?? '—') . "\n";
    echo "  Slug   : " . (explode('.', $t['domain'] ?? '')[0] ?? '—') . "  ← usar como TENANT_SLUG\n\n";

    // Platos disponibles — usando backticks en el nombre de BD
    try {
        $stmt3 = $pdo->query("
            SELECT d.id, d.name, d.price, c.name AS categoria
            FROM {$dbNameQuoted}.dishes d
            LEFT JOIN {$dbNameQuoted}.categories c ON c.id = d.category_id
            WHERE d.available = 1
            ORDER BY d.id
            LIMIT 10
        ");
        $dishes = $stmt3->fetchAll(PDO::FETCH_ASSOC);

        if (empty($dishes)) {
            echo "  → No hay platos con available = 1\n";
            echo "     Crea al menos 2 platos desde el panel del restaurante\n";
        } else {
            printf("  %-6s  %-32s  %-12s  %-20s\n", 'ID', 'Nombre del plato', 'Precio', 'Categoría');
            echo "  " . str_repeat('─', 74) . "\n";
            foreach ($dishes as $d) {
                printf("  %-6s  %-32s  $%-11s  %-20s\n",
                    $d['id'],
                    substr($d['name'], 0, 32),
                    number_format($d['price'], 0, ',', '.'),
                    substr($d['categoria'] ?? '—', 0, 20)
                );
            }
            $ids = array_column($dishes, 'id');
            echo "\n  ✓ Usa estos en el script → DISH_ID_1 = {$ids[0]}, DISH_ID_2 = " . ($ids[1] ?? $ids[0]) . "\n";
        }
    } catch (PDOException $e) {
        echo "  → Error consultando platos: " . $e->getMessage() . "\n";
    }

    // Mesas
    try {
        $stmt4 = $pdo->query("
            SELECT id, number, status
            FROM {$dbNameQuoted}.restaurant_tables
            ORDER BY CAST(number AS UNSIGNED), number
            LIMIT 15
        ");
        $mesas = $stmt4->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($mesas)) {
            echo "\n  Mesas disponibles:\n";
            foreach ($mesas as $m) {
                printf("    ID: %-4s  Número: %-6s  Estado: %s\n", $m['id'], $m['number'], $m['status']);
            }
            $primeraMesa = $mesas[0]['id'];
            echo "\n  ✓ Usa table_id entre 1 y {$primeraMesa} en el script\n";
        } else {
            echo "\n  → No hay mesas creadas. Crea mesas desde el panel.\n";
        }
    } catch (PDOException $e) {
        echo "  → Error consultando mesas: " . $e->getMessage() . "\n";
    }

    echo "\n" . str_repeat('─', 60) . "\n\n";
}

echo "── Resumen: qué poner en simulate_orders.php ────────\n";
foreach ($tenants as $t) {
    $slug = explode('.', $t['domain'] ?? '')[0] ?? '';
    if ($slug) {
        echo "  define('TENANT_SLUG', '{$slug}');\n";
        echo "  define('BASE_HOST',   'menugo.local');\n";
        echo "  define('DISH_ID_1',   ???);  // ver tabla de arriba\n";
        echo "  define('DISH_ID_2',   ???);  // ver tabla de arriba\n\n";
    }
}
