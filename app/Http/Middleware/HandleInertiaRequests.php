<?php

namespace App\Http\Middleware;

use App\Models\CartaSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $authUser = null;

        if ($user = $request->user()) {
            // Manejo defensivo: si las tablas de Spatie aún no existen en este
            // tenant (DB sin seedear) se devuelven colecciones vacías en lugar
            // de lanzar una excepción que congela la petición.
            try {
                $role        = $user->getRoleNames()->first() ?? 'desconocido';
                $roles       = $user->getRoleNames();
                $permissions = $user->getAllPermissions()->pluck('name');
            } catch (\Throwable) {
                $role        = 'desconocido';
                $roles       = collect();
                $permissions = collect();
            }

            $authUser = [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'phone'       => $user->phone,
                'active'      => $user->active,
                'role'        => $role,
                'roles'       => $roles,
                'permissions' => $permissions,
            ];
        }

        $tenantName      = '';
        $tenantAddress   = '';
        $tenantPhone     = '';
        $tenantLogoUrl   = null;
        $tenantPlan      = null;
        $tenantExpiresAt = null;
        $tenantDaysLeft  = null;
        $tenantIsTrial   = false;
        $tenantType      = 'restaurante';
        try {
            if (function_exists('tenant') && tenant()) {
                $tenantName      = tenant('name')    ?? '';
                $tenantAddress   = tenant('address') ?? '';
                $tenantPhone     = tenant('phone')   ?? '';
                $tenantPlan      = tenant()?->plan   ?? 'starter';
                $tenantExpiresAt = tenant()?->expires_at;
                $tenantDaysLeft  = \App\Services\PlanService::daysUntilExpiry();
                $tenantIsTrial   = (tenant()?->payment_status ?? '') === 'trial';
                $tenantType      = tenant('type') ?? 'restaurante';
                $settings        = CartaSetting::first();
                $tenantLogoUrl   = $settings?->logo_url;
            }
        } catch (\Throwable) {
        }

        return [
            ...parent::share($request),
            'auth'            => ['user' => $authUser],
            'tenant_name'     => $tenantName,
            'tenant_address'  => $tenantAddress,
            'tenant_phone'    => $tenantPhone,
            'tenant_logo_url' => $tenantLogoUrl,
            'tenant_plan'       => $tenantPlan,
            'tenant_expires_at' => $tenantExpiresAt,
            'tenant_days_left'  => $tenantDaysLeft,
            'tenant_is_trial'   => $tenantIsTrial,
            'tenant_type'       => $tenantType,
            'central_url'       => config('app.url'),
            'support_whatsapp'  => config('app.support_whatsapp', env('SUPPORT_WHATSAPP', '573172623919')),
            'flash'       => [
                'success'       => $request->session()->get('success'),
                'error'         => $request->session()->get('error'),
                'warning'       => $request->session()->get('warning'),
                'tenant_status'  => $request->session()->get('tenant_status'),
                'turn_number'    => $request->session()->get('turn_number'),
                'tracking_token' => $request->session()->get('tracking_token'),
            ],
        ];
    }
}
