<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;

class AuthController extends Controller
{
    // ── Password reset ────────────────────────────────────────────────────────

    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        ResetPasswordNotification::createUrlUsing(function ($notifiable, $token) {
            return request()->getSchemeAndHttpHost()
                . '/reset-password/' . $token
                . '?email=' . urlencode($notifiable->getEmailForPasswordReset());
        });

        Password::sendResetLink($request->only('email'));

        // Siempre responde con éxito para no revelar si el correo existe
        return back();
    }

    public function showResetForm(Request $request, string $token)
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->query('email', ''),
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect('/login')->with('success', 'Contraseña restablecida. Ya puedes iniciar sesión.');
        }

        $mensaje = match ($status) {
            Password::INVALID_TOKEN => 'El enlace de recuperación es inválido o ha expirado.',
            Password::INVALID_USER  => 'No encontramos una cuenta con ese correo.',
            default                 => 'No se pudo restablecer la contraseña. Intenta de nuevo.',
        };

        return back()->withErrors(['email' => $mensaje]);
    }

    // ── Auth views / login ────────────────────────────────────────────────────

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

            // Bloquear acceso si el tenant está pendiente de activación o vencido
            $paymentStatus = tenant()?->payment_status ?? 'paid';

            if (in_array($paymentStatus, ['overdue', 'cancelled', 'pending_payment', 'pending_review'])) {
                Auth::logout(); // no dejar sesión activa si el acceso está bloqueado

                $mensaje = match ($paymentStatus) {
                    'overdue'   => 'Tu suscripción ha vencido. Renueva tu plan para recuperar el acceso.',
                    'cancelled' => 'Tu cuenta ha sido cancelada. Contacta a soporte para más información.',
                    default     => 'Tu cuenta está pendiente de activación. Por favor espera la confirmación del pago.',
                };

                return back()
                    ->withErrors(['email' => $mensaje])
                    ->with('tenant_status', $paymentStatus)
                    ->onlyInput('email');
            }

            /** @var \App\Models\User $user */
            $user     = Auth::user();
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
            // Registrar el error real en logs sin exponer al usuario
            logger()->error('Login error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['email' => 'Ha ocurrido un error inesperado. Intenta de nuevo.'])->onlyInput('email');
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
        $welcomeUrl = rtrim((string) config('app.url', ''), '/') . '/';

        // Para requests AJAX (fetch) — devolver JSON
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json(['redirect' => $welcomeUrl]);
        }

        // Para requests Inertia normales
        if ($request->hasHeader('X-Inertia')) {
            return response('', 409)->header('X-Inertia-Location', $welcomeUrl);
        }

        return redirect()->away($welcomeUrl);
    }
}
