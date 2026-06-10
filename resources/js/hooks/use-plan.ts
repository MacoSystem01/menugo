import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

const PLAN_RANK: Record<string, number> = {
    starter:    0,
    basico:     1,
    trimestral: 2,
    semestral:  3,
    anual:      4,
};

const PLAN_NAMES: Record<string, string> = {
    starter:    'Starter',
    basico:     'Básico',
    trimestral: 'Trimestral',
    semestral:  'Pro',
    anual:      'Escala',
};

const FEATURE_PLAN: Record<string, string> = {
    orders:    'basico',
    analytics: 'trimestral',
    delivery:  'anual',
};

export function usePlan() {
    const { tenant_plan } = usePage<PageProps>().props;
    const plan = tenant_plan ?? 'starter';
    const rank = PLAN_RANK[plan] ?? 0;

    const can = (feature: string): boolean => {
        const required = FEATURE_PLAN[feature] ?? 'anual';
        return rank >= (PLAN_RANK[required] ?? 99);
    };

    const dishLimit = (): number | null => {
        return plan === 'starter' ? 12 : null;
    };

    const requiredPlanFor = (feature: string): string => {
        const key = FEATURE_PLAN[feature] ?? 'anual';
        return PLAN_NAMES[key] ?? key;
    };

    const planName = (): string => PLAN_NAMES[plan] ?? plan;

    return { plan, rank, can, dishLimit, requiredPlanFor, planName };
}
