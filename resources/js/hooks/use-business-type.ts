import { usePage } from '@inertiajs/react';
import type { BusinessType, PageProps } from '@/types';

export function useBusinessType() {
    const { tenant_type } = usePage<PageProps>().props;
    const type: BusinessType = tenant_type ?? 'restaurante';

    return {
        type,
        isRestaurante:  type === 'restaurante',
        isPuesto:       type === 'puesto',
    };
}
