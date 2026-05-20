<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::with('roles')
                ->where('is_system', false)
                ->orderBy('name')
                ->get()
                ->map(fn($u) => [
                    'id'     => $u->id,
                    'name'   => $u->name,
                    'email'  => $u->email,
                    'phone'  => $u->phone,
                    'active' => $u->active,
                    'roles'  => $u->roles->pluck('name')->toArray(),
                ]);
        } catch (\Throwable $e) {
            // Spatie no puede cargar roles (tablas sin seedear en este tenant)
            $users = collect();
            session()->flash('error', 'No se pudieron cargar los usuarios: ' . $e->getMessage());
        }

        $roles = [
            'gerente',
            'administrador',
            'caja',
            'cocina',
            'mesa',
            'domicilio',
        ];

        return Inertia::render('Users', compact('users', 'roles'));
    }

    private const ALLOWED_ROLES = ['gerente', 'administrador', 'caja', 'cocina', 'mesa', 'domicilio'];

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:150',
            'email'    => 'required|email|max:150|unique:users,email',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'role'     => ['required', 'string', 'in:' . implode(',', self::ALLOWED_ROLES)],
        ]);

        $user = User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'password'  => Hash::make($data['password']),
            'active'    => true,
            'is_system' => false,
        ]);

        $user->assignRole($data['role']);

        AuditLog::registrar('create', 'Usuario', $user->id, "Usuario '{$user->name}' creado con rol {$data['role']}", [
            'email' => $user->email,
            'role'  => $data['role'],
        ]);

        return back()->with('success', "Usuario '{$data['name']}' creado.");
    }

    public function update(Request $request, User $user)
    {
        abort_if($user->is_system, 403);

        $data = $request->validate([
            'name'   => 'required|string|max:150',
            'email'  => "required|email|max:150|unique:users,email,{$user->id}",
            'phone'  => 'nullable|string|max:20',
            'active' => 'boolean',
            'role'   => ['required', 'string', 'in:' . implode(',', self::ALLOWED_ROLES)],
        ]);

        $old = $user->getAttributes();
        $user->update([
            'name'   => $data['name'],
            'email'  => $data['email'],
            'phone'  => $data['phone'] ?? null,
            'active' => $data['active'],
        ]);

        $user->syncRoles([$data['role']]);

        AuditLog::registrar('update', 'Usuario', $user->id, "Usuario '{$user->name}' actualizado", [
            'old' => array_intersect_key($old, $data),
            'new' => $data,
        ]);

        return back()->with('success', 'Usuario actualizado.');
    }

    public function resetPassword(Request $request, User $user)
    {
        abort_if($user->is_system, 403);

        $data = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        AuditLog::registrar('update', 'Usuario', $user->id, "Contraseña reseteada para {$user->name} ({$user->email})");

        return back()->with('success', 'Contraseña actualizada.');
    }

    public function destroy(User $user)
    {
        abort_if($user->is_system, 403);

        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'No puedes eliminar tu propia cuenta.']);
        }

        $name  = $user->name;
        $id    = $user->id;
        $user->delete();

        AuditLog::registrar('delete', 'Usuario', $id, "Usuario '{$name}' eliminado");

        return back()->with('success', 'Usuario eliminado.');
    }
}
