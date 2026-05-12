<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TenantController extends Controller
{
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
