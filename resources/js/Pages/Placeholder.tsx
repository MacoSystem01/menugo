import AppShell from '@/Layouts/AppShell';
import { Head } from '@inertiajs/react';

interface Props {
    title: string;
    icon?: string;
}

export default function Placeholder({ title, icon = '🔧' }: Props) {
    return (
        <AppShell title={title}>
            <Head title={title} />
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 mb-6 text-4xl">
                    {icon}
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">{title}</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Esta sección está en desarrollo. Pronto estará disponible.
                </p>
            </div>
        </AppShell>
    );
}
