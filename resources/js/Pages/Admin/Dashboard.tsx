import AppShell from '@/Layouts/AppShell';
import { Head, Link } from '@inertiajs/react';
import { Building2, Users, TrendingUp, Globe2, ShieldCheck, ShieldAlert, CreditCard } from 'lucide-react';

interface TenantRow {
    id: string;
    name: string;
    type: string;
    plan: string;
    active: boolean;
    subdomain: string | null;
    created_at: string;
}

interface Props {
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        por_tipo: Record<string, number>;
        por_plan: Record<string, number>;
    };
    lista: TenantRow[];
    crecimiento: { month: string; count: number }[];
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
    pro:         'bg-blue-500/10 text-blue-500',
    enterprise:  'bg-amber-500/10 text-amber-500',
};

export default function AdminDashboard({ stats, lista }: Props) {
    const kpis = [
        { label: 'Locales registrados', value: String(stats.total),     icon: Building2, color: 'text-primary' },
        { label: 'Locales activos',     value: String(stats.activos),   icon: ShieldCheck, color: 'text-green-500' },
        { label: 'Locales inactivos',   value: String(stats.inactivos), icon: ShieldAlert, color: 'text-red-500' },
        { label: 'Planes Pro/Ent.',     value: String((stats.por_plan.pro ?? 0) + (stats.por_plan.enterprise ?? 0)), icon: CreditCard, color: 'text-accent' },
    ];

    return (
        <AppShell variant="admin" title="Dashboard Global" subtitle="Gestión centralizada de la plataforma Menugo">
            <Head title="SuperAdmin - Dashboard" />

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:shadow-primary/5">
                        <div className="flex justify-between items-start">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
                            <div className={`grid h-9 w-9 place-items-center rounded-xl bg-muted/50 ${color} group-hover:scale-110 transition-transform`}>
                                <Icon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 font-display text-3xl font-bold">{value}</div>
                        <div className="mt-2 flex items-center text-[10px] text-muted-foreground">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            <span>+12% este mes</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                {/* Tabla de locales recientes */}
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                    <div className="p-5 flex justify-between items-center border-b border-border bg-muted/10">
                        <div>
                            <h2 className="font-display text-base font-bold">Registros recientes</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Control de acceso y planes</p>
                        </div>
                        <Link href="/admin/tenants" className="text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                            Ver todos los locales
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/30">
                                <tr>
                                    <th className="text-left px-6 py-4 font-bold">Local / Tipo</th>
                                    <th className="text-left px-6 py-4 font-bold">Estado</th>
                                    <th className="text-left px-6 py-4 font-bold">Plan</th>
                                    <th className="text-right px-6 py-4 font-bold">Registro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {lista.map(t => (
                                    <tr key={t.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-hero text-white font-display font-bold shadow-sm">
                                                    {t.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.name}</div>
                                                    <div className="text-[11px] text-muted-foreground">{TIPO_LABEL[t.type] ?? t.type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${t.active ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-600'}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${t.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {t.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter ${PLAN_CLASS[t.plan] ?? 'bg-muted text-muted-foreground'}`}>
                                                {t.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[11px] font-mono text-muted-foreground">
                                            {t.created_at}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                            <Globe2 className="h-4 w-4 text-primary" />
                            <h2 className="font-display text-base font-bold text-foreground">Distribución de Negocio</h2>
                        </div>
                        
                        <div className="space-y-5">
                            <StatProgress label="Restaurantes" value={stats.por_tipo.restaurante ?? 0} total={stats.total} color="bg-primary" />
                            <StatProgress label="Puestos / Food Trucks" value={stats.por_tipo.puesto ?? 0} total={stats.total} color="bg-accent" />
                            <div className="pt-4 border-t border-border mt-4">
                                <StatProgress label="Plan Enterprise" value={stats.por_plan.enterprise ?? 0} total={stats.total} color="bg-amber-500" />
                                <StatProgress label="Plan Pro" value={stats.por_plan.pro ?? 0} total={stats.total} color="bg-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-zinc-900 p-6 text-white shadow-xl shadow-zinc-200 dark:shadow-none">
                        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
                        <div className="absolute top-4 right-4 text-primary/40"><TrendingUp className="h-12 w-12" /></div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Suscripciones Activas</div>
                        <div className="font-display text-4xl font-bold mt-2">{stats.activos}</div>
                        <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Ingresos est. mens.</span>
                            <span className="font-mono text-white text-sm font-bold">$ {new Intl.NumberFormat('es-CO').format(stats.activos * 50000)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

function StatProgress({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-[11px] mb-1.5 uppercase tracking-wide font-semibold">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground">{value} <span className="text-[9px] opacity-40">({Math.round(percent)}%)</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full transition-all duration-700 ${color}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}

