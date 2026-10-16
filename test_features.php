<?php
require __DIR__ . "/vendor/autoload.php";
$app = require_once __DIR__ . "/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Http;

echo "--- INICIANDO PRUEBAS DE USO DE FUNCIONES PREMIUM ---\n\n";

// 1. Crear o buscar un tenant Premium
$tenant = Tenant::firstOrCreate(
    ["id" => "test-premium-tenant"],
    [
        "name" => "Restaurante Test Premium",
        "tier" => "premium",
        "plan" => "anual",
        "billing_cycle" => "yearly",
        "payment_status" => "paid",
        "data" => ["active" => true],
    ]
);
echo "1. Tenant Premium configurado: {$tenant->name} (Tier: {$tenant->tier})\n";

// Asegurar que tiene un dominio
$tenant->domains()->firstOrCreate(["domain" => "test-premium"]);

// Crear un usuario Gerente en el tenant para la prueba de identidad
$tenant->run(function () {
    $user = User::firstOrCreate(
        ["email" => "gerente@test.com"],
        ["name" => "Gerente Test", "password" => bcrypt("password"), "active" => true]
    );
    // Asignar rol si no tiene
    if (!$user->hasRole("gerente")) {
        $role = \Spatie\Permission\Models\Role::firstOrCreate(["name" => "gerente", "guard_name" => "web"]);
        $user->assignRole($role);
    }
});
echo "2. Usuario Gerente creado dentro del Tenant.\n";

// Simular la solicitud HTTP de búsqueda de tenants para el modal de publicidad
$requestSearch = Illuminate\Http\Request::create("/api/tenants/search", "GET", ["q" => "Test Premium"]);
$responseSearch = app()->handle($requestSearch);
echo "3. Búsqueda de Tenants (Advertising Modal):\n";
echo "   Status: " . $responseSearch->getStatusCode() . "\n";
$searchData = json_decode($responseSearch->getContent(), true);
$found = collect($searchData)->firstWhere("id", "test-premium-tenant");
if ($found) {
    echo "   OK: Tenant encontrado en la búsqueda.\n";
    echo "   OK: Tier retornado = " . ($found["tier"] ?? "N/A") . "\n";
    if ($found["tier"] === "premium") {
        echo "   -> EXITO: El frontend ocultara el pago porque el tier es Premium.\n";
    } else {
        echo "   -> FALLO: El tier no es premium.\n";
    }
} else {
    echo "   -> FALLO: No se encontró el tenant en la búsqueda.\n";
}

// Simular la solicitud HTTP de verificación de identidad
$requestVerify = Illuminate\Http\Request::create("/api/advertising/verify-identity", "POST", [
    "tenant_id" => "test-premium-tenant",
    "email" => "gerente@test.com",
]);
$responseVerify = app()->handle($requestVerify);
echo "4. Verificación de Identidad (Advertising Modal):\n";
echo "   Status: " . $responseVerify->getStatusCode() . "\n";
$verifyData = json_decode($responseVerify->getContent(), true);
if (isset($verifyData["verified"]) && $verifyData["verified"]) {
    echo "   OK: Identidad verificada correctamente (Rol: {$verifyData["role_label"]}).\n";
} else {
    echo "   -> FALLO: No se pudo verificar la identidad.\n";
    echo "   Razón: " . ($verifyData["message"] ?? "Desconocida") . "\n";
}

// 5. Verificar PublicMenu.tsx is_premium flag (CartaController)
$requestMenu = Illuminate\Http\Request::create("/", "GET");
$requestMenu->headers->set("Host", "test-premium.localhost");
app("url")->forceRootUrl("http://test-premium.localhost");

try {
    $responseMenu = app()->handle($requestMenu);
    echo "5. Carga de Carta Digital:\n";
    echo "   Status: " . $responseMenu->getStatusCode() . "\n";
    $content = $responseMenu->getContent();
    if (strpos($content, "\"is_premium\":true") !== false || strpos($content, "\"is_premium\": true") !== false) {
        echo "   OK: La variable is_premium se esta inyectando correctamente en el frontend (Inertia).\n";
    } else {
        echo "   -> FALLO: is_premium no se encontro en el json de Inertia.\n";
    }
} catch (\Exception $e) {
    echo "   Error al cargar el menu: " . $e->getMessage() . "\n";
}

echo "\n--- PRUEBAS FINALIZADAS ---\n";

