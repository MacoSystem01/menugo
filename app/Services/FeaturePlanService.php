<?php

namespace App\Services;

class FeaturePlanService
{
    /**
     * Map of features included in each tier.
     * Tiers: 'starter', 'pro', 'premium'
     */
    protected static $features = [
        'starter' => [
            'menu',
            'caja',
            'pedidos',
            'tables',
        ],
        'pro' => [
            'menu',
            'caja',
            'pedidos',
            'tables',
            'cocina',
            'domicilio',
            'inventario',
        ],
        'premium' => [
            'menu',
            'caja',
            'pedidos',
            'tables',
            'cocina',
            'domicilio',
            'inventario',
            'reporte',
            'analytics',
            'roles_avanzados',
        ],
    ];

    /**
     * Returns true if the given tier has the requested feature.
     */
    public static function hasFeature(string $tier, string $feature): bool
    {
        $tier = strtolower($tier);
        if (!isset(self::$features[$tier])) {
            return false;
        }

        return in_array($feature, self::$features[$tier]);
    }

    /**
     * Returns the list of all features for a tier.
     */
    public static function getFeaturesForTier(string $tier): array
    {
        $tier = strtolower($tier);
        return self::$features[$tier] ?? [];
    }
}
