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

        return redirect()->route('register.success')
            ->with('tenant_name',  $data['name'])
            ->with('tenant_url',   "http://{$fullDomain}")
            ->with('tenant_email', $data['email']);
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

        $domain = $tenant->domains->first()->domain;

        return response()->json([
            'found' => true,
            'name'  => $tenant->name,
            'url'   => "http://{$domain}/login",
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
            'subdomain' => $t->domains->first()?->domain,
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
        ]);

        $tenant->domains()->create(['domain' => "{$subdomain}.menugo.local"]);

        return redirect()->route('admin.tenants')->with('success', "Restaurante '{$data['name']}' creado en {$subdomain}.menugo.local");
    }

    public function destroy(string $id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->delete(); // El evento TenantDeleted eliminará la BD automáticamente
        return back()->with('success', 'Restaurante eliminado.');
    }
}
