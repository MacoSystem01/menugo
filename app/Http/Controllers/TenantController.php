<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
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
            'plan'                  => 'required|in:mensual,trimestral,semestral,anual',
            'name'                  => 'required|string|max:150',
            'subdomain'             => ['required', 'string', 'max:50', 'regex:/^[a-z0-9]+$/'],
            'owner_name'            => 'required|string|max:150',
            'phone'                 => 'nullable|string|max:20',
            'email'                 => 'required|email|max:150',
            'password'              => 'required|string|min:8|confirmed',
            'restaurant_address'    => 'nullable|string|max:255',
            'restaurant_lat'        => 'nullable|numeric|between:-90,90',
            'restaurant_lng'        => 'nullable|numeric|between:-180,180',
        ]);

        $subdomain  = strtolower($data['subdomain']);
        $fullDomain = "{$subdomain}.{$baseDomain}";

        // Verificar que el subdominio no esté en uso
        if (\Stancl\Tenancy\Database\Models\Domain::where('domain', $fullDomain)->exists()) {
            return back()->withErrors(['subdomain' => 'Este subdominio ya está en uso.']);
        }

        // Crear tenant (dispara CreateDatabase + MigrateDatabase sincrónicamente)
        $tenant = Tenant::create([
            'id'   => Str::uuid(),
            'name' => $data['name'],
            'email'=> $data['email'],
            'plan' => $data['plan'],
            'type' => $data['type'],   // se guarda en columna data (JSON)
        ]);

        $tenant->domains()->create(['domain' => $fullDomain]);

        // Entrar al contexto del tenant para crear el usuario dueño
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

        // Intentar agregar el subdominio al hosts file automáticamente (solo si hay permisos)
        Artisan::call('tenant:host', ['subdomain' => $subdomain, '--write' => true]);
        $hostsWritten = str_contains(Artisan::output(), 'Agregado');

        return redirect()->route('register.success')
            ->with('tenant_name',  $data['name'])
            ->with('tenant_url',   "http://{$fullDomain}")
            ->with('tenant_email', $data['email'])
            ->with('hosts_warning', $hostsWritten ? null
                : "Agrega manualmente en el archivo hosts (como Administrador): 127.0.0.1 {$fullDomain}");
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
            'tenantName'  => session('tenant_name'),
            'tenantUrl'   => session('tenant_url'),
            'tenantEmail' => session('tenant_email'),
        ]);
    }


    public function index()
    {
        $tenants = Tenant::with('domains')->latest()->get()->map(fn($t) => [
            'id'         => $t->id,
            'name'       => $t->name,
            'email'      => $t->email,
            'plan'       => $t->plan,
            'active'     => $t->active ?? true,
            'subdomain'  => $t->domains->first()?->domain,
            'expires_at' => $t->expires_at,
            'created_at' => $t->created_at->format('d/m/Y'),
            'address'    => $this->getTenantAddress($t),
        ]);

        return Inertia::render('Admin/Tenants', compact('tenants'));
    }

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

    public function store(Request $request)
    {
        $data = $request->validate([
            'type'                  => 'required|in:restaurante,puesto',
            'plan'                  => 'required|in:mensual,trimestral,semestral,anual',
            'name'                  => 'required|string|max:150',
            'subdomain'             => ['required', 'string', 'max:50', 'regex:/^[a-z0-9\-]+$/'],
            'owner_name'            => 'required|string|max:150',
            'phone'                 => 'nullable|string|max:20',
            'email'                 => 'required|email|max:150',
            'password'              => 'required|string|min:8|confirmed',
            'restaurant_address'    => 'nullable|string|max:255',
            'restaurant_lat'        => 'nullable|numeric|between:-90,90',
            'restaurant_lng'        => 'nullable|numeric|between:-180,180',
        ]);

        $subdomain  = strtolower($data['subdomain']);
        $fullDomain = "{$subdomain}.Menugo.local";

        if (\Stancl\Tenancy\Database\Models\Domain::where('domain', $fullDomain)->exists()) {
            return back()->withErrors(['subdomain' => 'Este subdominio ya está en uso.']);
        }

        $tenant = Tenant::create([
            'id'         => Str::uuid(),
            'name'       => $data['name'],
            'email'      => $data['email'],
            'plan'       => $data['plan'],
            'type'       => $data['type'],
            'active'     => true,
            'expires_at' => now()->addDays(30),
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
        $tenant->delete();

        return back()->with('success', "Restaurante '{$name}' eliminado permanentemente.");
    }

    public function update(Request $request, string $id)
    {
        $tenant = Tenant::findOrFail($id);

        $data = $request->validate([
            'name'               => 'nullable|string|max:150',
            'email'              => 'nullable|email|max:150',
            'plan'               => 'nullable|string|in:mensual,trimestral,semestral,anual',
            'active'             => 'nullable|boolean',
            'expires_at'         => 'nullable|date',
            'restaurant_address' => 'nullable|string|max:255',
        ]);

        $address = array_key_exists('restaurant_address', $data) ? $data['restaurant_address'] : false;
        unset($data['restaurant_address']);

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
}
