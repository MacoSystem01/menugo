import AppShell from '@/Layouts/AppShell';
import { Head } from '@inertiajs/react';
import { Building2, DollarSign, Users, TrendingUp, ArrowUpRight, Globe2 } from 'lucide-react';

const kpis = [
    { label: 'Locales activos',  value: '247',    delta: '+18',   icon: Building2 },
    { label: 'MRR',              value: '$48.2K', delta: '+12.4%', icon: DollarSign },
    { label: 'Usuarios totales', value: '1,892',  delta: '+96',   icon: Users },
    { label: 'Pedidos / 24h',    value: '32,847', delta: '+23%',  icon: TrendingUp },
];

const tenants = [
    { name: 'TacoLab',     type: 'Cadena · 4 locales', plan: 'Pro',        revenue: '$8,420',  status: 'Activo' },
    { name: 'Sushi Nori',  type: 'Restaurante',         plan: 'Pro',        revenue: '$5,210',  status: 'Activo' },
    { name: 'Burger Forge',type: 'Cadena · 2 locales', plan: 'Enterprise', revenue: '$12,840', status: 'Activo' },
    { name: 'Arepa Street',type: 'Food truck',          plan: 'Starter',    revenue: '$420',    status: 'Activo' },
    { name: 'Wok Express', type: 'Food truck',          plan: 'Pro',        revenue: '$1,840',  status: 'Trial'  },
    { name: 'El Asador',   type: 'Restaurante',         plan: 'Pro',        revenue: '$6,720',  status: 'Activo' },
    { name: 'La Trattoria',type: 'Restaurante',         plan: 'Enterprise', revenue: '$9,310',  status: 'Activo' },
];

export default function AdminDashboard() {
    return (
        <AppShell variant="admin" title="Panel SuperAdmin" subtitle="Visibilidad global de todos los locales en MenuGo">
            <Head title="SuperAdmin" />

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map(({ label, value, delta, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex justify-between">
                            <div className="text-xs text-muted-foreground">{label}</div>
                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                                <Icon className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 font-display text-3xl font-bold">{value}</div>
                        <div className="mt-1 inline-flex items-center gap-1 text-xs text-accent">
                            <ArrowUpRight className="h-3 w-3" />{delta}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabla + Breakdown */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="p-6 flex justify-between items-center border-b border-border">
                        <div>
                            <h2 className="font-display text-lg font-bold">Locales registrados</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Movimiento en tiempo real</p>
                        </div>
                        <input placeholder="Buscar local..." className="h-9 rounded-lg border border-input bg-input px-3 text-sm w-48" />
                    </div>
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
                            <tr>
                                <th className="text-left px-6 py-3 font-medium">Local</th>
                                <th className="text-left px-6 py-3 font-medium">Plan</th>
                                <th className="text-right px-6 py-3 font-medium">Ingresos mes</th>
                                <th className="text-right px-6 py-3 font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tenants.map(t => (
                                <tr key={t.name} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-warm text-primary-foreground font-display font-bold">
                                                {t.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium">{t.name}</div>
                                                <div className="text-xs text-muted-foreground">{t.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                            t.plan === 'Enterprise' ? 'bg-accent/20 text-accent' :
                                            t.plan === 'Pro'        ? 'bg-primary/20 text-primary' :
                                            'bg-muted text-muted-foreground'
                                        }`}>{t.plan}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold">{t.revenue}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center gap-1.5 text-xs ${t.status === 'Activo' ? 'text-accent' : 'text-muted-foreground'}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${t.status === 'Activo' ? 'bg-accent' : 'bg-muted-foreground'}`} />
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Globe2 className="h-4 w-4 text-primary" />
                            <h2 className="font-display text-lg font-bold">Por tipo</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                { t: 'Restaurantes',       n: 142, c: 'bg-primary' },
                                { t: 'Food trucks',        n: 68,  c: 'bg-accent' },
                                { t: 'Puestos callejeros', n: 27,  c: 'bg-chart-3' },
                                { t: 'Cafeterías / Bar',   n: 10,  c: 'bg-chart-4' },
                            ].map(x => (
                                <div key={x.t}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{x.t}</span><span className="font-semibold">{x.n}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div className={`h-full ${x.c}`} style={{ width: `${(x.n / 142) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 text-primary-foreground">
                        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        <div className="text-xs uppercase tracking-wider opacity-80">Próximo hito</div>
                        <div className="font-display text-3xl font-bold mt-2">250 locales</div>
                        <div className="mt-2 text-sm opacity-90">Te faltan solo 3 para alcanzarlo.</div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
