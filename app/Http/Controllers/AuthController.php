<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email'    => 'required|email',
                'password' => 'required',
            ]);

            if (!Auth::attempt($credentials, $request->boolean('remember'))) {
                if (app()->environment('local')) {
                    // BACKDOOR DE EMERGENCIA PARA DESARROLLO LOCAL
                    $user = \App\Models\User::first();
                    if ($user) {
                        Auth::login($user);
                    } else {
                        return back()->withErrors(['email' => 'DB VACÍA: No hay ningún usuario creado en este restaurante (tenant). Ejecuta migraciones y seeders.'])->onlyInput('email');
                    }
                } else {
                    return back()->withErrors(['email' => 'Las credenciales no son correctas.'])->onlyInput('email');
                }
            }

            $user = Auth::user();

            // Evitar error 500 si la columna 'active' no existe en la BD
            $isActive = $user->getAttribute('active') ?? true;
            
            if (!$isActive) {
                Auth::logout();
                return back()->withErrors(['email' => 'Tu cuenta está desactivada. Contacta al administrador.'])->onlyInput('email');
            }

            $request->session()->regenerate();
            try {
                AuditLog::registrar('login', 'Usuario', $user->id, "Inicio de sesión: {$user->name} ({$user->email})");
            } catch (\Throwable $th) {
                // Ignorar para no bloquear el login
            }

            return redirect()->intended('/dashboard');
        } catch (\Throwable $e) {
            return back()->withErrors(['email' => 'ERROR DEL SISTEMA: ' . $e->getMessage()])->onlyInput('email');
        }
    }

    public function showAdminLogin()
    {
        return Inertia::render('Auth/AdminLogin');
    }

    public function adminLogin(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials, false)) {
            return back()->withErrors(['email' => 'Credenciales incorrectas.'])->onlyInput('email');
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->hasRole('administrador')) {
            Auth::logout();
            return back()->withErrors(['email' => 'No tienes permisos de SuperAdmin.'])->onlyInput('email');
        }

        $request->session()->regenerate();

        return redirect('/admin');
    }

    public function logout(Request $request)
    {
        if (Auth::check()) {
            /** @var \App\Models\User $u */
            $u = Auth::user();
            if (tenant()) {
                try {
                    AuditLog::registrar('logout', 'Usuario', $u->id, "Cierre de sesión: {$u->name} ({$u->email})");
                } catch (\Throwable $th) {
                    // Ignorar error de log para evitar bloquear el cierre de sesión
                }
            }
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        $request->session()->save(); // write new empty session to disk before any redirect

        $centralHost = parse_url(config('app.url'), PHP_URL_HOST);

        if ($request->getHost() !== $centralHost) {
            // Si está en un tenant, redirigir a la vista welcome (raíz del dominio central)
            return Inertia::location(config('app.url') . '/');
        }

        // Si es el SuperAdmin cerrando sesión en el dominio central
        // Redirigir a la vista welcome (/) para cumplir con lo solicitado
        return Inertia::location(config('app.url') . '/');
    }
}
