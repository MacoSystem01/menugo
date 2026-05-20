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

        User::create([
            'name'     => $data['owner_name'],
            'phone'    => $data['phone'] ?? null,
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'active'   => true,
        ]);

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
            'id'        => $t->id,
            'name'      => $t->name,
            'email'     => $t->email,
            'plan'      => $t->plan,
            'active'    => $t->active ?? true,
            'subdomain' => $t->domains->first()?->domain,
            'expires_at' => $t->expires_at,
            'created_at'=> $t->created_at->format('d/m/Y'),
        ]);

        return Inertia::render('Admin/Tenants', compact('tenants'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:150',
            'email'    => 'required|email|max:150',
            'subdomain'=> 'required|string|max:50|regex:/^[a-z0-9\-]+$/|unique:domains,domain',
            'plan'     => 'in:basico,pro,enterprise',
        ]);

        $subdomain = Str::slug($data['subdomain']);

        $tenant = Tenant::create([
            'id'    => Str::uuid(),
            'name'  => $data['name'],
            'email' => $data['email'],
            'plan'  => $data['plan'] ?? 'basico',
            'active' => true,
            'expires_at' => now()->addDays(30),
        ]);

        $tenant->domains()->create(['domain' => "{$subdomain}.Menugo.local"]);

        // Intentar auto-escribir hosts; si falla, notificar al admin
        Artisan::call('tenant:host', ['subdomain' => $subdomain, '--write' => true]);
        $hostsWritten = str_contains(Artisan::output(), 'Agregado');

        $msg = "Restaurante '{$data['name']}' creado en {$subdomain}.Menugo.local";
        if (! $hostsWritten) {
            $msg .= " — ⚠️ Agrega en hosts: 127.0.0.1 {$subdomain}.Menugo.local";
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
            'expires_at' => 'nullable|date',
            'plan'       => 'nullable|string',
            'active'     => 'nullable|boolean',
        ]);

        $tenant->update($data);

        return back()->with('success', 'Local actualizado correctamente.');
    }

    public function toggleStatus(string $id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update(['active' => !($tenant->active ?? true)]);
        $status = ($tenant->active ?? true) ? 'activado' : 'desactivado';
        return back()->with('success', "El restaurante '{$tenant->name}' ha sido {$status}.");
    }
}
