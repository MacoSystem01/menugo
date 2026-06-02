import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export function useSupportWhatsapp() {
    const { support_whatsapp } = usePage<PageProps>().props;
    const number = support_whatsapp ?? '573172623919';

    const url = (message: string) =>
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    return { number, url };
}
