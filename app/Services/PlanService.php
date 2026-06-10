<?php

namespace App\Services;

use Carbon\Carbon;

class PlanService
{
    private const PLAN_RANK = [
        'starter'    => 0,
        'basico'     => 1,
        'trimestral' => 2,
        'semestral'  => 3,
        'anual'      => 4,
    ];

    private const FEATURE_PLAN = [
        'orders'    => 'basico',     // Pedidos desde mesa
        'analytics' => 'trimestral', // Reportes y analytics
        'delivery'  => 'anual',      // Módulo domicilio completo
    ];

    private const DISH_LIMIT = [
        'starter'    => 12,
        'basico'     => null,
        'trimestral' => null,
        'semestral'  => null,
        'anual'      => null,
    ];

    public static function currentPlan(): string
    {
        try {
            $t = tenant();
            // tenant()->plan accede a la columna real
            // tenant('plan') accede al JSON data — no funciona para columnas reales
            return $t?->plan ?? 'starter';
        } catch (\Throwable) {
            return 'starter';
        }
    }

    public static function currentRank(): int
    {
        return self::PLAN_RANK[self::currentPlan()] ?? 0;
    }

    public static function can(string $feature): bool
    {
        $required      = self::FEATURE_PLAN[$feature] ?? 'anual';
        $required_rank = self::PLAN_RANK[$required]   ?? 99;
        return self::currentRank() >= $required_rank;
    }

    public static function dishLimit(): ?int
    {
        $plan = self::currentPlan();
        // array_key_exists distingue "clave con valor null" (ilimitado) de "clave inexistente" (desconocido → Starter)
        return array_key_exists($plan, self::DISH_LIMIT) ? self::DISH_LIMIT[$plan] : 30;
    }

    public static function requiredPlanFor(string $feature): string
    {
        return self::FEATURE_PLAN[$feature] ?? 'anual';
    }

    public static function planDisplayName(string $planKey): string
    {
        return match ($planKey) {
            'starter'    => 'Starter',
            'basico'     => 'Básico',
            'trimestral' => 'Trimestral',
            'semestral'  => 'Pro',
            'anual'      => 'Escala',
            default      => ucfirst($planKey),
        };
    }

    // Días que dura cada plan al renovar (null = no vence)
    private const PLAN_DAYS = [
        'starter'    => null,
        'basico'     => 30,
        'trimestral' => 90,
        'semestral'  => 180,
        'anual'      => 365,
    ];

    public static function planDays(string $planKey): ?int
    {
        return self::PLAN_DAYS[$planKey] ?? 30;
    }

    public static function isExpired(): bool
    {
        if (self::currentPlan() === 'starter') return false;

        try {
            $expiresAt = tenant()?->expires_at;
            if (!$expiresAt) return false;
            return now()->isAfter(Carbon::parse($expiresAt));
        } catch (\Throwable) {
            return false;
        }
    }

    public static function daysUntilExpiry(): ?int
    {
        $plan = self::currentPlan();
        if ($plan === 'starter') return null;

        try {
            $expiresAt = tenant()?->expires_at;
            if (!$expiresAt) return null;
            $expiry = \Carbon\Carbon::parse($expiresAt)->startOfDay();
            $today  = now()->startOfDay();
            $diff   = $today->diffInDays($expiry, false);
            return (int) $diff;
        } catch (\Throwable) {
            return null;
        }
    }
}
