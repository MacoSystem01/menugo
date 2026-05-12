import AppShell from '@/Layouts/AppShell';
import { Head } from '@inertiajs/react';
import { TrendingUp, ShoppingBag, Users, DollarSign, ArrowUpRight } from 'lucide-react';

const stats = [
    { label: 'Ventas hoy',   value: '$2,847', delta: '+12.4%', icon: DollarSign },
    { label: 'Pedidos',      value: '184',    delta: '+23%',   icon: ShoppingBag },
    { label: 'Clientes',     value: '92',     delta: '+8.1%',  icon: Users },
    { label: 'Ticket prom.', value: '$15.4',  delta: '+3.2%',  icon: TrendingUp },
];

const recentOrders = [
    { id: '#1284', item: '2x Tacos al pastor + Coca', total: '$8.50',  status: 'En cocina', time: '2 min' },
    { id: '#1283', item: 'Burrito mixto',              total: '$12.00', status: 'Listo',     time: '5 min' },
    { id: '#1282', item: 'Quesadilla + nachos',        total: '$15.20', status: 'Entregado', time: '12 min' },
    { id: '#1281', item: '3x Tacos pollo',             total: '$9.00',  status: 'Entregado', time: '18 min' },
];

const topItems = [
    { name: 'Tacos al pastor',   sold: 47, revenue: '$211' },
    { name: 'Burrito mixto',     sold: 32, revenue: '$384' },
    { name: 'Quesadilla',        sold: 24, revenue: '$192' },
    { name: 'Nachos especiales', sold: 18, revenue: '$144' },
];

export default function Dashboard() {
    return (
        <AppShell title="Resumen del día" subtitle="Datos en tiempo real de tu restaurante">
            <Head title="Inicio" />

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map(({ label, value, delta, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="text-xs text-muted-foreground">{label}</div>
                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
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

            {/* Pedidos + Top */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-display text-lg font-bold">Pedidos recientes</h2>
                        <button className="text-xs text-primary hover:underline">Ver todos</button>
                    </div>
                    <div className="divide-y divide-border">
                        {recentOrders.map(o => (
                            <div key={o.id} className="py-3 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">
                                        {o.id} · <span className="text-muted-foreground font-normal">{o.item}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">hace {o.time}</div>
                                </div>
                                <div className="font-semibold text-sm">{o.total}</div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                    o.status === 'En cocina' ? 'bg-primary/15 text-primary' :
                                    o.status === 'Listo'     ? 'bg-accent/15 text-accent' :
                                    'bg-muted text-muted-foreground'
                                }`}>{o.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-display text-lg font-bold mb-4">Top del día</h2>
                    <div className="space-y-4">
                        {topItems.map((it, i) => (
                            <div key={it.name}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium">{i + 1}. {it.name}</span>
                                    <span className="text-muted-foreground">{it.revenue}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-gradient-warm" style={{ width: `${(it.sold / 47) * 100}%` }} />
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">{it.sold} vendidos</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
