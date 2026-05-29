<?php
/**
 * MenuGo — Limpieza de pedidos de prueba (CORRECCIÓN 8)
 * Elimina pedidos creados por los scripts de carga/tests.
 * Ejecutar: php tests/load/clean_test_orders.php
 */

try {
    $pdo = new PDO(
        'mysql:host=127.0.0.1;port=3306;dbname=menugo;charset=utf8mb4',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "╔══════════════════════════════════════════════════════╗\n";
    echo "║     MenuGo — Limpieza de Pedidos de Prueba           ║\n";
    echo "╚══════════════════════════════════════════════════════╝\n\n";

    // Obtener todas las BDs de tenants
    $tenants = $pdo->query("SELECT id, name FROM menugo.tenants WHERE deleted_at IS NULL ORDER BY name")
                   ->fetchAll(PDO::FETCH_ASSOC);

    // Nombres de clientes de prueba (los que generan los scripts de carga/test)
    $testPatterns = [
        'Carga Test%', 'Cliente Prueba%', 'Funcional Master', 'Domicilio Master',
        'Estado Master', 'Dup Master', 'XSS Test', 'Test Recovery', 'Test Estado',
        'Test Duplicado', 'Verificador Entorno', 'Hacker Precio', 'CrossTenant Item',
        'SQL injection%', 'Test Borde%',
    ];

    $likeClause = implode(' OR ', array_map(fn($p) => "customer_name LIKE " . $pdo->quote($p), $testPatterns));

    $totalOrders    = 0;
    $totalItems     = 0;

    foreach ($tenants as $t) {
        $dbName = 'menugo_' . $t['id'];

        // Verificar que la BD exista
        try {
            $pdo->query("SELECT 1 FROM `{$dbName}`.orders LIMIT 1");
        } catch (PDOException) {
            echo "  ⚠ BD `{$dbName}` no existe — omitida\n";
            continue;
        }

        // Contar antes
        $cnt = (int) $pdo->query("SELECT COUNT(*) FROM `{$dbName}`.orders WHERE {$likeClause}")->fetchColumn();
        if ($cnt === 0) {
            echo "  [{$t['name']}] Sin pedidos de prueba — omitido\n";
            continue;
        }

        // Eliminar order_items referenciados
        $deletedItems = $pdo->exec(
            "DELETE oi FROM `{$dbName}`.order_items oi
             INNER JOIN `{$dbName}`.orders o ON o.id = oi.order_id
             WHERE {$likeClause}"
        );

        // Eliminar orders
        $deletedOrders = $pdo->exec(
            "DELETE FROM `{$dbName}`.orders WHERE {$likeClause}"
        );

        echo "  ✓ [{$t['name']}] {$deletedOrders} pedidos + {$deletedItems} items eliminados\n";
        $totalOrders += $deletedOrders;
        $totalItems  += $deletedItems;
    }

    echo "\n── Verificación final ─────────────────────────────────\n";
    $hayResiduos = false;
    foreach ($tenants as $t) {
        $dbName = 'menugo_' . $t['id'];
        try {
            $restantes = (int) $pdo->query("SELECT COUNT(*) FROM `{$dbName}`.orders WHERE {$likeClause}")->fetchColumn();
            if ($restantes > 0) {
                echo "  ✗ [{$t['name']}] Quedan {$restantes} pedidos de prueba\n";
                $hayResiduos = true;
            } else {
                echo "  ✓ [{$t['name']}] Sin residuos\n";
            }
        } catch (PDOException) {}
    }

    echo "\n";
    echo "  Total eliminado: {$totalOrders} pedidos, {$totalItems} items\n";
    echo $hayResiduos
        ? "✗ Quedan residuos — revisar manualmente.\n"
        : "✓ CORRECCIÓN 8 completada: BD limpia de datos de prueba.\n";

} catch (PDOException $e) {
    echo "[ERROR FATAL] " . $e->getMessage() . "\n";
    exit(1);
}
