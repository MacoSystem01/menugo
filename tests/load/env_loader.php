<?php
/**
 * Cargador de credenciales de prueba — descifra valores del .env.test usando APP_KEY.
 * Incluir al inicio de cada script de test: require_once __DIR__ . '/env_loader.php';
 *
 * Las credenciales están cifradas con AES-256-CBC usando la APP_KEY del proyecto.
 * Para regenerar .env.test: php tests/load/_gen_encrypted_env.php
 */

(static function (): void {
    $envTest = __DIR__ . '/.env.test';
    $mainEnv = __DIR__ . '/../../.env';

    if (!file_exists($envTest)) {
        fwrite(STDERR, "[ERROR] tests/load/.env.test no encontrado.\n");
        fwrite(STDERR, "Ejecuta: php tests/load/_gen_encrypted_env.php\n");
        exit(1);
    }

    // Leer APP_KEY del .env principal
    $appKey = '';
    foreach (file($mainEnv) as $line) {
        if (str_starts_with(trim($line), 'APP_KEY=')) {
            $appKey = trim(explode('=', $line, 2)[1]);
            break;
        }
    }
    if (str_starts_with($appKey, 'base64:')) {
        $appKey = base64_decode(substr($appKey, 7));
    }
    if (strlen($appKey) !== 32) {
        fwrite(STDERR, "[ERROR] APP_KEY inválida (" . strlen($appKey) . " bytes, se esperan 32).\n");
        exit(1);
    }

    // Parsear y descifrar cada variable
    foreach (file($envTest) as $line) {
        $line = trim($line);
        if (!$line || str_starts_with($line, '#')) {
            continue;
        }
        [$k, $v] = array_pad(explode('=', $line, 2), 2, '');
        $k = trim($k);
        $v = trim($v);

        if (str_starts_with($v, 'ENC:')) {
            $decoded = base64_decode(substr($v, 4));
            $iv      = substr($decoded, 0, 16);
            $ct      = substr($decoded, 16);
            $plain   = openssl_decrypt($ct, 'aes-256-cbc', $appKey, OPENSSL_RAW_DATA, $iv);
            if ($plain === false) {
                fwrite(STDERR, "[ERROR] No se pudo descifrar '$k'. ¿APP_KEY cambió?\n");
                exit(1);
            }
            $v = $plain;
        }

        if ($k !== '' && !defined($k)) {
            define($k, $v);
        }
    }
})();
