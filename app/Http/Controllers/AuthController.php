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
                return back()->withErrors(['email' => 'Las credenciales no son correctas.'])->onlyInput('email');
            }

            $user = Auth::user();

            /** @var \App\Models\User $user */
            $isActive = $user->active ?? true;
            
            if (!$isActive) {
                Auth::logout();
                return back()->withErrors(['email' => 'Tu cuenta está desactivada. Contacta al administrador.'])->onlyInput('email');
            }

            $request->session()->regenerate();
            try {
                AuditLog::registrar('login', 'Usuario', $user->id, "Inicio de sesión: {$user->name} ({$user->email})");
            } catch (\Throwable) {
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
                } catch (\Throwable) {
                    // Ignorar error de log para evitar bloquear el cierre de sesión
                }
            }
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        $request->session()->save(); // write new empty session to disk before any redirect

        // Redirigir siempre a la página de bienvenida del dominio central
        $welcomeUrl = rtrim(config('app.url'), '/') . '/';

        if ($request->hasHeader('X-Inertia')) {
            return response('', 409)->header('X-Inertia-Location', $welcomeUrl);
        }

        return redirect()->away($welcomeUrl);
    }
}
