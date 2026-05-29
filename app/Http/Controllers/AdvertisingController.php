<?php

namespace App\Http\Controllers;

use App\Models\AdvertisingRequest;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AdvertisingController extends Controller
{
    /** Roles que pueden solicitar publicidad en nombre del restaurante */
    private const VALID_ROLES = ['gerente', 'administrador'];

    // ── API pública: buscar tenants activos ───────────────────────────────────

    public function searchTenants(Request $request): JsonResponse
    {
        $q = trim($request->query('q', ''));

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        // FIX: 'active' no es un payment_status válido — filtrar por 'paid' y active=true
        $tenants = Tenant::with('domains')
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                      ->orWhereHas('domains', fn($d) => $d->where('domain', 'like', "%{$q}%"));
            })
            ->whereNull('deleted_at')
            ->where('payment_status', 'paid')
            ->whereRaw("JSON_EXTRACT(`data`, '$.active') = true")
            ->limit(6)
            ->get()
            ->map(fn($t) => [
                'id'        => $t->id,
                'name'      => $t->name,
                'subdomain' => $t->domains->first()?->domain,
            ]);

        return response()->json($tenants);
    }

    // ── Verificar identidad: el email debe pertenecer a un Gerente/Admin ───────

    public function verifyIdentity(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => 'required|string',
            'email'     => 'required|email',
        ]);

        // FIX: 'active' no es un payment_status válido — verificar que sea 'paid' y active=true
        $tenant = Tenant::whereNull('deleted_at')
            ->where('payment_status', 'paid')
            ->whereRaw("JSON_EXTRACT(`data`, '$.active') = true")
            ->find($request->tenant_id);

        if (!$tenant) {
            return response()->json([
                'verified' => false,
                'message'  => 'El restaurante seleccionado no es válido o no está activo.',
            ], 422);
        }

        try {
            $result = $tenant->run(function () use ($request): array {
                $user = \App\Models\User::where('email', strtolower(trim($request->email)))
                    ->where('active', true)
                    ->first();

                if (!$user) {
                    return [
                        'verified' => false,
                        'message'  => 'No existe ninguna cuenta activa con ese correo en este restaurante.',
                    ];
                }

                // Verificar que tiene el rol requerido (Spatie Permission)
                $role = $user->roles
                    ->whereIn('name', self::VALID_ROLES)
                    ->first();

                if (!$role) {
                    return [
                        'verified' => false,
                        'message'  => 'La cuenta encontrada no tiene permisos de Gerente ni Administrador.',
                    ];
                }

                return [
                    'verified'   => true,
                    'user_name'  => $user->name,
                    'user_phone' => $user->phone ?? null,
                    'role'       => $role->name,
                    'role_label' => ucfirst($role->name),
                ];
            });
        } catch (Throwable) {
            return response()->json([
                'verified' => false,
                'message'  => 'No fue posible conectar con la base de datos del restaurante. Inténtalo de nuevo.',
            ], 503);
        }

        return response()->json($result, $result['verified'] ? 200 : 422);
    }

    // ── Crear solicitud de publicidad ─────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type'          => 'required|in:banner,slider,combo',
            'business_name' => 'required|string|max:120',
            'contact_name'  => 'required|string|max:120',
            'contact_email' => 'required|email|max:255',
            'contact_phones'   => 'nullable|array|max:3',
            'contact_phones.*' => 'nullable|string|max:30',
            'image'            => 'required|image|mimes:jpg,jpeg,png,webp|max:8192',
            'tenant_id'        => 'nullable|string',
            'ai_enhanced'      => 'nullable|boolean',
            'payment_proof'    => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        // ── Re-verificación de identidad al enviar (si se eligió tenant) ─────
        if ($request->filled('tenant_id')) {
            // FIX: 'active' no es un payment_status válido — verificar que sea 'paid' y active=true
            $tenant = Tenant::whereNull('deleted_at')
                ->where('payment_status', 'paid')
                ->whereRaw("JSON_EXTRACT(`data`, '$.active') = true")
                ->find($request->tenant_id);

            if (!$tenant) {
                return response()->json([
                    'message' => 'El restaurante seleccionado ya no es válido.',
                ], 422);
            }

            try {
                $verified = $tenant->run(function () use ($request): bool {
                    $user = \App\Models\User::where('email', strtolower(trim($request->contact_email)))
                        ->where('active', true)
                        ->first();

                    return $user && $user->roles->whereIn('name', self::VALID_ROLES)->isNotEmpty();
                });
            } catch (Throwable) {
                $verified = false;
            }

            if (!$verified) {
                return response()->json([
                    'message' => 'La verificación de identidad falló. El correo no corresponde a un Gerente o Administrador activo de este restaurante.',
                ], 403);
            }
        }

        // ── Guardar solicitud ─────────────────────────────────────────────────
        $imagePath = $request->file('image')->store('advertising-requests', 'public');

        $status    = 'pending_payment';
        $proofPath = null;
        $proofAt   = null;

        if ($request->hasFile('payment_proof')) {
            $proofPath = $request->file('payment_proof')->store('advertising-proofs', 'public');
            $proofAt   = now();
            $status    = 'pending_review';
        }

        $adRequest = AdvertisingRequest::create([
            'type'               => $request->type,
            'tenant_id'          => $request->tenant_id ?: null,
            'business_name'      => $request->business_name,
            'contact_name'       => $request->contact_name,
            'contact_email'      => strtolower(trim($request->contact_email)),
            'contact_phone'      => $this->serializePhones($request->input('contact_phones', [])),
            'image_path'         => $imagePath,
            'ai_enhanced'        => $request->boolean('ai_enhanced'),
            'payment_proof_path' => $proofPath,
            'payment_proof_at'   => $proofAt,
            'status'             => $status,
        ]);

        return response()->json([
            'success'   => true,
            'id'        => $adRequest->id,
            'has_proof' => $status === 'pending_review',
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Convierte el array de teléfonos en JSON, descartando vacíos. */
    private function serializePhones(array $phones): ?string
    {
        $clean = array_values(array_filter(array_map('trim', $phones)));
        return $clean ? json_encode($clean) : null;
    }
}
