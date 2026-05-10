import AppShell from '@/Layouts/AppShell';
import { Head } from '@inertiajs/react';

export default function AdminDashboard() {
    return (
        <AppShell title="Panel Global" variant="admin">
            <Head title="SuperAdmin" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: 'Locales activos',  value: '—', icon: '🏪' },
                    { label: 'Usuarios totales', value: '—', icon: '👥' },
                    { label: 'Pedidos globales', value: '—', icon: '📦' },
                ].map(card => (
                    <div key={card.label} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                        <span className="text-3xl">{card.icon}</span>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
                            <p className="text-2xl font-bold font-display">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </AppShell>
    );
}
