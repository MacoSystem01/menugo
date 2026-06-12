<?php

namespace App\Http\Controllers;

use App\Models\PlatformPaymentMethod;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TenantController extends Controller
{
    // ── Registro público desde /register ─────────────────────────────────────

    public function publicRegister(Request $request)
    {
        $baseDomain = parse_url(config('app.url'), PHP_URL_HOST);

        $data = $request->validate([
            'type'                  => 'required|in:restaurante,puesto',
            'plan'                  => 'required|in:starter,basico,trimestral,semestral,anual',
            'name'                  => 'required|string|max:150',
            'subdomain'             => ['required', 'string', 'max:50', 'regex:/^[a-z0-9]+$/'],
            'owner_name'            => 'required|string|max:150',
            'phone'                 => 'nullable|string|max:30',
            'email'                 => 'required|email|max:150',
            'password'              => 'required|string|min:8|confirmed',
            'restaurant_address'    => 'nullable|string|max:255',
            'restaurant_lat'        => 'nullable|numeric|between:-90,90',
            'restaurant_lng'        => 'nullable|numeric|between:-180,180',
            'evidence'              => 'nullable|file|mimes:jpg,jpeg,png,pdf,webp|extensions:jpg,jpeg,png,pdf,webp|max:10240',
        ]);

        $subdomain  = strtolower($data['subdomain']);
        $fullDomain = "{$subdomain}.{$baseDomain}";

        if (\Stancl\Tenancy\Database\Models\Domain::where('domain', $fullDomain)->exists()) {
            return back()->withErrors(['subdomain' => 'Este subdominio ya está en uso.']);
        }

        // Determinar estado según plan: starter = gratis, pagos = trial 15 días
        $isPlanFree  = ($data['plan'] ?? '') === 'starter';
        $hasEvidence = $request->hasFile('evidence');

        if ($isPlanFree) {
            $paymentStatus = 'paid';
            $isActive      = true;
            $trialEndsAt   = null;
            $expiresAt     = now()->addYears(10);
        } else {
            $paymentStatus = 'trial';
            $isActive      = true;
            $trialEndsAt   = now()->addDays(15);
            $expiresAt     = now()->addDays(15);
        }

        $tenant = Tenant::create([
            'id'             => Str::uuid(),
            'name'           => $data['name'],
            'owner_name'     => $data['owner_name'],
            'email'          => $data['email'],
            'plan'           => $data['plan'],
            'type'           => $data['type'],
            'active'         => $isActive,
            'payment_status' => $paymentStatus,
            'expires_at'     => $expiresAt,
        ]);

        $tenant->domains()->create(['domain' => $fullDomain]);

        // Guardar evidencia de pago (fuera del contexto tenant)
        if ($hasEvidence) {
            $evidencePath = $request->file('evidence')->store("payment-evidence/{$tenant->id}", 'public');
            $tenant->update([
                'payment_evidence_path' => $evidencePath,
                'payment_evidence_at'   => now(),
            ]);
        }

        // Crear usuario dueño en la BD del tenant
        tenancy()->initialize($tenant);

        $dispatcher = User::getEventDispatcher();
        User::unsetEventDispatcher();
        $owner = User::create([
            'name'     => $data['owner_name'],
            'phone'    => $data['phone'] ?? null,
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'active'   => true,
        ]);
        User::setEventDispatcher($dispatcher);

        $owner->assignRole('gerente');

        if (!empty($data['restaurant_address'])) {
            $setting = \App\Models\CartaSetting::first() ?? new \App\Models\CartaSetting();
            $setting->restaurant_address = $data['restaurant_address'];
            $setting->restaurant_lat     = isset($data['restaurant_lat']) ? (float) $data['restaurant_lat'] : null;
            $setting->restaurant_lng     = isset($data['restaurant_lng']) ? (float) $data['restaurant_lng'] : null;
            $setting->save();
        }

        tenancy()->end();

        Artisan::call('tenant:host', ['subdomain' => $subdomain, '--write' => true]);

        return redirect()->route('register.success')
            ->with('tenant_name',    $data['name'])
            ->with('tenant_url',     "http://{$fullDomain}")
            ->with('tenant_email',   $data['email'])
            ->with('payment_status', $paymentStatus)
            ->with('has_evidence',   $hasEvidence)
            ->with('is_trial',       $paymentStatus === 'trial')
            ->with('trial_ends_at',  $trialEndsAt?->format('d/m/Y') ?? null);
    }

    public function find(Request $request)
    {
        $name = trim($request->query('name', ''));

        if (mb_strlen($name) < 2) {
            return response()->json(['found' => false, 'message' => 'Escribe al menos 2 caracteres.']);
        }

        $tenant = Tenant::with('domains')
            ->where('name', 'like', "%{$name}%")
            ->first();

        if (! $tenant || $tenant->domains->isEmpty()) {
            return response()->json(['found' => false, 'message' => 'No encontramos ningún negocio con ese nombre.']);
        }

        $domain   = $tenant->domains->first()->domain;
        $protocol = parse_url(config('app.url'), PHP_URL_SCHEME) ?? 'https';

        return response()->json([
            'found' => true,
            'name'  => $tenant->name,
            'url'   => "{$protocol}://{$domain}/login",
        ]);
    }

    public function registerSuccess()
    {
        if (! session()->has('tenant_name')) {
            return redirect('/register');
        }

        return Inertia::render('Auth/RegisterSuccess', [
            'tenantName'    => session('tenant_name'),
            'tenantUrl'     => session('tenant_url'),
            'tenantEmail'   => session('tenant_email'),
            'paymentStatus' => session('payment_status', 'pending_payment'),
            'hasEvidence'   => session('has_evidence', false),
            'isTrial'       => session('is_trial', false),
            'trialEndsAt'   => session('trial_ends_at', null),
        ]);
    }


    public function index()
    {
        $tenants = Tenant::with('domains')->latest()->get()->map(fn($t) => [
            'id'                   => $t->id,
            'name'                 => $t->name,
            'email'                => $t->email,
            'plan'                 => $t->plan,
            'active'               => $t->active ?? true,
            'payment_status'       => $t->payment_status ?? 'paid', // FIX: fallback 'active' era inválido
            'payment_evidence_path'=> $t->payment_evidence_path,
            'payment_evidence_at'  => $t->payment_evidence_at,
            'subdomain'            => $t->domains->first()?->domain,
            'expires_at'           => $t->expires_at,
            'created_at'           => $t->created_at->format('d/m/Y'),
            'address'              => $t->address,  // ← Ahora se incluye (está en la tabla central)
        ]);

        return Inertia::render('Admin/Tenants', compact('tenants'));
    }

    /**
     * Obtiene la dirección de un tenant inicializando su BD.
     * Sólo usar cuando se necesita para UN tenant específico, no en listados.
     */
    private function getTenantAddress(Tenant $tenant): ?string
    {
        try {
            tenancy()->initialize($tenant);
            $address = \App\Models\CartaSetting::first()?->restaurant_address;
            tenancy()->end();
            return $address ?: null;
        } catch (\Throwable) {
            tenancy()->end();
            return null;
        }
    }

    // Valores válidos de payment_status — usados en store(), update() y activateTenant()
    private const VALID_PAYMENT_STATUSES = ['pending_payment', 'pending_review', 'paid', 'overdue', 'cancelled'];

    public function store(Request $request)
    {
        $data = $request->validate([
            'type'                  => 'required|in:restaurante,puesto',
            'plan'                  => 'required|in:starter,basico,trimestral,semestral,anual',
            'name'                  => 'required|string|max:150',
            'subdomain'             => ['required', 'string', 'max:50', 'regex:/^[a-z0-9\-]+$/'],
            'owner_name'            => 'required|string|max:150',
            'phone'                 => 'nullable|string|max:20',
            'email'                 => 'required|email|max:150',
            'password'              => 'required|string|min:8|confirmed',
            'restaurant_address'    => 'nullable|string|max:255',
            'restaurant_lat'        => 'nullable|numeric|between:-90,90',
            'restaurant_lng'        => 'nullable|numeric|between:-180,180',
            // payment_status opcional al crear desde el admin — default 'paid' (ya confirmado)
            'payment_status'        => 'nullable|in:pending_payment,pending_review,paid,overdue,cancelled',
        ]);

        $baseDomain = parse_url(config('app.url'), PHP_URL_HOST);
        $subdomain  = strtolower($data['subdomain']);
        $fullDomain = "{$subdomain}.{$baseDomain}";

        if (\Stancl\Tenancy\Database\Models\Domain::where('domain', $fullDomain)->exists()) {
            return back()->withErrors(['subdomain' => 'Este subdominio ya está en uso.']);
        }

        $tenant = Tenant::create([
            'id'             => Str::uuid(),
            'name'           => $data['name'],
            'email'          => $data['email'],
            'plan'           => $data['plan'],
            'type'           => $data['type'],
            'active'         => true,
            'payment_status' => $data['payment_status'] ?? 'paid',
            'expires_at'     => now()->addDays(
                \App\Services\PlanService::planDays($data['plan'] ?? 'basico') ?? 30
            ),
        ]);

        $tenant->domains()->create(['domain' => $fullDomain]);

        tenancy()->initialize($tenant);

        $dispatcher = User::getEventDispatcher();
        User::unsetEventDispatcher();
        $owner = User::create([
            'name'     => $data['owner_name'],
            'phone'    => $data['phone'] ?? null,
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'active'   => true,
        ]);
        User::setEventDispatcher($dispatcher);

        $owner->assignRole('gerente');

        if (!empty($data['restaurant_address'])) {
            $setting = \App\Models\CartaSetting::first() ?? new \App\Models\CartaSetting();
            $setting->restaurant_address = $data['restaurant_address'];
            $setting->restaurant_lat     = isset($data['restaurant_lat']) ? (float) $data['restaurant_lat'] : null;
            $setting->restaurant_lng     = isset($data['restaurant_lng']) ? (float) $data['restaurant_lng'] : null;
            $setting->save();
        }

        tenancy()->end();

        Artisan::call('tenant:host', ['subdomain' => $subdomain, '--write' => true]);
        $hostsWritten = str_contains(Artisan::output(), 'Agregado');

        $msg = "Restaurante '{$data['name']}' creado en {$fullDomain}";
        if (! $hostsWritten) {
            $msg .= " — ⚠️ Agrega en hosts: 127.0.0.1 {$fullDomain}";
        }

        return redirect()->route('admin.tenants')->with('success', $msg);
    }

    public function destroy(string $id)
    {
        $tenant = Tenant::findOrFail($id);

        // Safety: refuse deletion if the tenant has active (non-cancelled) orders
        try {
            tenancy()->initialize($tenant);
            $activeOrders = \App\Models\Order::whereNotIn('status', ['delivered', 'cancelled'])->count();
            tenancy()->end();

            if ($activeOrders > 0) {
                return back()->withErrors([
                    'error' => "No se puede eliminar: el restaurante tiene {$activeOrders} pedido(s) activo(s).",
                ]);
            }
        } catch (\Throwable) {
            tenancy()->end();
        }

        $name = $tenant->name;

        // Eliminar dominios para liberar el subdominio
        $tenant->domains()->delete();

        // Eliminar la base de datos del tenant usando IF EXISTS (seguro si no existe)
        // Usamos SQL directo para evitar que Stancl relance la excepción desde sus listeners
        try {
            $dbName = $tenant->database()->getName();
            \DB::statement("DROP DATABASE IF EXISTS `{$dbName}`");
        } catch (\Throwable) {}

        // Soft-delete sin disparar el evento 'deleted' de Eloquent (que Stancl escucha
        // para hacer otro DROP DATABASE y causaría un segundo error)
        $tenant->updateQuietly(['deleted_at' => now()]);

        return back()->with('success', "Restaurante '{$name}' eliminado. El historial de facturación se conserva.");
    }

    public function update(Request $request, string $id)
    {
        $tenant = Tenant::findOrFail($id);

        $data = $request->validate([
            'name'               => 'nullable|string|max:150',
            'email'              => 'nullable|email|max:150',
            'plan'               => 'nullable|string|in:starter,basico,trimestral,semestral,anual',
            'active'             => 'nullable|boolean',
            'expires_at'         => 'nullable|date',
            'restaurant_address' => 'nullable|string|max:255',
            // Validar payment_status — evita que se guarden valores inválidos como 'active'
            'payment_status'     => 'nullable|in:pending_payment,pending_review,paid,overdue,cancelled',
        ]);

        $address = array_key_exists('restaurant_address', $data) ? $data['restaurant_address'] : false;
        unset($data['restaurant_address']);

        // Guardar la dirección en la tabla central de tenants
        if ($address !== false) {
            $data['address'] = $address ?: null;
        }

        // array_filter con fn($v) => $v !== null: preserva false y 0 (crítico para 'active' = false)
        $tenant->update(array_filter($data, fn($v) => $v !== null));

        if ($address !== false) {
            try {
                tenancy()->initialize($tenant);
                $setting = \App\Models\CartaSetting::firstOrCreate([]);
                $setting->restaurant_address = $address ?: null;
                $setting->save();
                tenancy()->end();
            } catch (\Throwable) {
                tenancy()->end();
            }
        }

        return back()->with('success', "'{$tenant->name}' actualizado correctamente.");
    }

    public function toggleStatus(string $id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update(['active' => !($tenant->active ?? true)]);
        $status = ($tenant->active ?? true) ? 'activado' : 'desactivado';
        return back()->with('success', "El restaurante '{$tenant->name}' ha sido {$status}.");
    }

    public function activateTenant(string $id)
    {
        $tenant   = Tenant::findOrFail($id);
        $planDays = \App\Services\PlanService::planDays($tenant->plan ?? 'basico');
        $expiresAt = $planDays
            ? now()->addDays($planDays)
            : now()->addYears(10); // starter o plan sin límite práctico

        $tenant->update([
            'active'         => true,
            'payment_status' => 'paid',
            'expires_at'     => $expiresAt,
        ]);
        return back()->with('success', "✅ '{$tenant->name}' activado correctamente. Pago confirmado.");
    }
}
