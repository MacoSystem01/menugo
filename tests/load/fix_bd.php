<?php
/**
 * MenuGo — Correcciones de BD (ejecutar una sola vez)
 * C5: payment_status inválidos → 'paid'
 * C6: email prueba@prueba → prueba@menugo.local
 */

$validStatuses = ['pending_payment', 'pending_review', 'paid', 'overdue', 'cancelled'];

try {
    $pdo = new PDO(
        'mysql:host=127.0.0.1;port=3306;dbname=menugo;charset=utf8mb4',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "╔══════════════════════════════════════════════════════╗\n";
    echo "║     MenuGo — Correcciones de BD Central              ║\n";
    echo "╚══════════════════════════════════════════════════════╝\n\n";

    // ── Estado actual ────────────────────────────────────────────────────────────
    echo "── Estado actual de tenants activos ─────────────────\n";
    $stmt = $pdo->query("SELECT id, name, payment_status, email FROM tenants WHERE deleted_at IS NULL ORDER BY name");
    $tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($tenants as $t) {
        $psValido = in_array($t['payment_status'], $validStatuses);
        $emValido = (bool) filter_var($t['email'], FILTER_VALIDATE_EMAIL);
        $flags    = ($psValido ? '' : ' ← payment_status INVÁLIDO') . ($emValido ? '' : ' ← email INVÁLIDO');
        echo "  {$t['name']} | {$t['payment_status']} | {$t['email']}{$flags}\n";
    }
    echo "\n";

    // ── C5: Corregir payment_status inválidos ────────────────────────────────────
    echo "── C5: Corregir payment_status inválidos ────────────\n";
    $placeholders = implode(',', array_fill(0, count($validStatuses), '?'));
    $stmt5 = $pdo->prepare(
        "UPDATE tenants SET payment_status = 'paid'
         WHERE payment_status NOT IN ({$placeholders})
         AND deleted_at IS NULL"
    );
    $stmt5->execute($validStatuses);
    $afectados = $stmt5->rowCount();

    if ($afectados > 0) {
        echo "  ✓ {$afectados} tenant(s) corregidos: payment_status → 'paid'\n";
    } else {
        echo "  ✓ Sin cambios — todos los payment_status eran válidos\n";
    }

    // ── C6: Corregir email inválido prueba@prueba ────────────────────────────────
    echo "\n── C6: Corregir email inválido 'prueba@prueba' ──────\n";
    $stmt6 = $pdo->prepare(
        "UPDATE tenants SET email = 'prueba@menugo.local' WHERE email = 'prueba@prueba'"
    );
    $stmt6->execute();
    $afectados6 = $stmt6->rowCount();

    if ($afectados6 > 0) {
        echo "  ✓ Email corregido: prueba@prueba → prueba@menugo.local\n";

        // Buscar también el tenant con ese email para corregir en su BD
        $stmt6b = $pdo->query("SELECT id FROM tenants WHERE email = 'prueba@menugo.local'");
        $tenantPrueba = $stmt6b->fetch(PDO::FETCH_ASSOC);
        if ($tenantPrueba) {
            $dbName = '`menugo_' . $tenantPrueba['id'] . '`';
            try {
                $pdo->exec(
                    "UPDATE {$dbName}.users SET email = 'prueba@menugo.local' WHERE email = 'prueba@prueba'"
                );
                $userFixed = $pdo->query("SELECT ROW_COUNT()")->fetchColumn();
                echo "  ✓ Usuario en BD tenant también corregido ({$dbName})\n";
            } catch (PDOException $e2) {
                echo "  ⚠ No se pudo corregir en BD tenant: " . $e2->getMessage() . "\n";
            }
        }
    } else {
        echo "  ✓ Sin cambios — email 'prueba@prueba' no encontrado\n";
    }

    // ── Estado final ─────────────────────────────────────────────────────────────
    echo "\n── Estado final ─────────────────────────────────────\n";
    $stmt7 = $pdo->query("SELECT name, payment_status, email FROM tenants WHERE deleted_at IS NULL ORDER BY name");
    foreach ($stmt7->fetchAll(PDO::FETCH_ASSOC) as $t) {
        $psValido = in_array($t['payment_status'], $validStatuses);
        $emValido = (bool) filter_var($t['email'], FILTER_VALIDATE_EMAIL);
        $icono    = ($psValido && $emValido) ? '✓' : '✗';
        echo "  [{$icono}] {$t['name']} | {$t['payment_status']} | {$t['email']}\n";
    }

    // ── Verificación: ningún estado inválido queda ───────────────────────────────
    $stmt8 = $pdo->prepare(
        "SELECT COUNT(*) FROM tenants WHERE payment_status NOT IN ({$placeholders}) AND deleted_at IS NULL"
    );
    $stmt8->execute($validStatuses);
    $restantes = (int) $stmt8->fetchColumn();

    echo "\n";
    echo $restantes === 0
        ? "✓ Corrección C5 verificada: 0 payment_status inválidos en BD.\n"
        : "✗ Quedan {$restantes} registro(s) con payment_status inválido.\n";

    $stmt9 = $pdo->query("SELECT COUNT(*) FROM tenants WHERE email = 'prueba@prueba'");
    $emailsMalos = (int) $stmt9->fetchColumn();
    echo $emailsMalos === 0
        ? "✓ Corrección C6 verificada: email 'prueba@prueba' ya no existe.\n"
        : "✗ Quedan {$emailsMalos} registro(s) con email 'prueba@prueba'.\n";

} catch (PDOException $e) {
    echo "[ERROR FATAL] " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n✓ Correcciones de BD completadas.\n";
