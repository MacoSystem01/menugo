import AppShell from '@/Layouts/AppShell';
import { Head, Link } from '@inertiajs/react';
import { Building2, Users, TrendingUp, Globe2 } from 'lucide-react';

interface TenantRow {
    id: string;
    name: string;
    type: string;
    plan: string;
    subdomain: string | null;
    created_at: string;
}

interface Props {
    total: number;
    por_tipo: Record<string, number>;
    lista: TenantRow[];
}

const TIPO_LABEL: Record<string, string> = {
    restaurante: 'Restaurante',
    puesto:      'Puesto / Food truck',
};

const PLAN_CLASS: Record<string, string> = {
    anual:       'bg-accent/20 text-accent',
    semestral:   'bg-primary/20 text-primary',
    trimestral:  'bg-primary/15 text-primary',
    mensual:     'bg-muted text-muted-foreground',
};

const TIPO_COLORS: Record<string, string> = {
    restaurante: 'bg-primary',
    puesto:      'bg-accent',
};

export default function AdminDashboard({ total, por_tipo, lista }: Props) {
    const maxTipo = Math.max(...Object.values(por_tipo), 1);

    const kpis = [
        { label: 'Locales registrados', value: String(total),            icon: Building2 },
        { label: 'Restaurantes',         value: String(por_tipo.restaurante ?? 0), icon: Building2 },
        { label: 'Puestos / Food trucks', value: String(por_tipo.puesto ?? 0),    icon: TrendingUp },
        { label: 'Total usuarios dueños', value: String(total),           icon: Users },
    ];

    return (
        <AppShell variant="admin" title="Panel SuperAdmin" subtitle="Visibilidad global de todos los locales en MenuGo">
            <Head title="SuperAdmin" />

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex justify-between">
                            <div className="text-xs text-muted-foreground">{label}</div>
                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                                <Icon className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 font-display text-3xl font-bold">{value}</div>
                    </div>
                ))}
            </div>

            {/* Tabla + Breakdown */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="p-6 flex justify-between items-center border-b border-border">
                        <div>
                            <h2 className="font-display text-lg font-bold">Locales registrados</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Últimos {lista.length} registros</p>
                        </div>
                        <Link href="/admin/tenants" className="text-xs text-primary hover:underline">Ver todos</Link>
                    </div>

                    {lista.length === 0 ? (
                        <p className="p-6 text-sm text-muted-foreground text-center">No hay locales registrados aún.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium">Local</th>
                                    <th className="text-left px-6 py-3 font-medium">Plan</th>
                                    <th className="text-left px-6 py-3 font-medium">Dominio</th>
                                    <th className="text-right px-6 py-3 font-medium">Registro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {lista.map(t => (
                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-warm text-primary-foreground font-display font-bold">
                                                    {t.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{t.name}</div>
                                                    <div className="text-xs text-muted-foreground">{TIPO_LABEL[t.type] ?? t.type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium capitalize ${PLAN_CLASS[t.plan] ?? 'bg-muted text-muted-foreground'}`}>
                                                {t.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {t.subdomain ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                                            {t.created_at}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Globe2 className="h-4 w-4 text-primary" />
                            <h2 className="font-display text-lg font-bold">Por tipo</h2>
                        </div>
                        {Object.keys(por_tipo).length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin datos.</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(por_tipo).map(([tipo, n]) => (
                                    <div key={tipo}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>{TIPO_LABEL[tipo] ?? tipo}</span>
                                            <span className="font-semibold">{n}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full ${TIPO_COLORS[tipo] ?? 'bg-chart-3'}`}
                                                style={{ width: `${(n / maxTipo) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 text-primary-foreground">
                        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        <div className="text-xs uppercase tracking-wider opacity-80">Total locales</div>
                        <div className="font-display text-3xl font-bold mt-2">{total}</div>
                        <div className="mt-2 text-sm opacity-90">
                            {total === 0 ? 'Aún no hay locales.' : `${total} ${total === 1 ? 'local registrado' : 'locales registrados'}.`}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
