import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

const PLAN_RANK: Record<string, number> = {
    starter: 0,
    pro:     1,
    premium: 2,
};

const PLAN_NAMES: Record<string, string> = {
    starter: 'Básico',
    pro:     'Pro',
    premium: 'Premium',
};

const FEATURE_PLAN: Record<string, string> = {
    orders:    'pro',
    analytics: 'pro',
    delivery:  'premium',
};

export function usePlan() {
    const { tenant_tier } = usePage<PageProps>().props;
    const plan = tenant_tier ?? 'starter';
    const rank = PLAN_RANK[plan] ?? 0;

    const can = (feature: string): boolean => {
        const required = FEATURE_PLAN[feature] ?? 'premium';
        return rank >= (PLAN_RANK[required] ?? 99);
    };

    const dishLimit = (): number | null => {
        return plan === 'starter' ? 15 : null;
    };

    const requiredPlanFor = (feature: string): string => {
        const key = FEATURE_PLAN[feature] ?? 'premium';
        return PLAN_NAMES[key] ?? key;
    };

    const planName = (): string => PLAN_NAMES[plan] ?? plan;

    return { plan, rank, can, dishLimit, requiredPlanFor, planName };
}
