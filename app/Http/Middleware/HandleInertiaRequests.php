<?php

namespace App\Http\Middleware;

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

        return [
            ...parent::share($request),
            'auth'   => ['user' => $authUser],
            'flash'  => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
            ],
        ];
    }
}
