import AppShell from '@/Layouts/AppShell';
import { Head, Link } from '@inertiajs/react';
import {
    TrendingUp, ShoppingBag, Users, DollarSign, ArrowUpRight,
    Clock, CheckCircle2, ChefHat, Bike, LayoutGrid, AlertCircle,
} from 'lucide-react';
import type {
    DashboardProps,
    FullDashboardProps,
    CajaDashboardProps,
    CocinaDashboardProps,
    MesaDashboardProps,
    DomicilioDashboardProps,
} from '@/types';

// ── Utilidades ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n);
}

const STATUS_LABEL: Record<string, string> = {
    pending:    'Pendiente',
    at_cash:    'En caja',
    in_kitchen: 'En cocina',
    cooking:    'Cocinando',
    ready:      'Listo',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
};

const STATUS_CLASS: Record<string, string> = {
    cooking:    'bg-primary/15 text-primary',
    in_kitchen: 'bg-primary/15 text-primary',
    ready:      'bg-accent/15 text-accent',
    delivered:  'bg-muted text-muted-foreground',
    cancelled:  'bg-red-500/15 text-red-400',
    at_cash:    'bg-yellow-500/15 text-yellow-400',
};

function payBadge(total: number, paid: number, status: string) {
    if (status === 'cancelled') return null;
    if (paid >= total && total > 0) return { label: 'Pagado',    cls: 'bg-green-500/15 text-green-400' };
    if (paid > 0)                   return { label: 'Abono',     cls: 'bg-yellow-500/15 text-yellow-400' };
    return                                 { label: 'Sin pago',  cls: 'bg-red-500/15 text-red-400' };
}

function KpiCard({
    label, value, icon: Icon, sub,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    sub?: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
            <div className="flex justify-between items-start">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{value}</div>
            {sub && (
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />{sub}
                </div>
            )}
        </div>
    );
}

// ── Dashboard Gerente / Administrador ──────────────────────────────────────────

function FullDashboard({ stats, pedidos_recientes, top_platos }: FullDashboardProps) {
    const maxVendidos = top_platos[0]?.vendidos ?? 1;

    const kpis = [
        { label: 'Ventas hoy',   value: fmt(stats.ventas_hoy),          icon: DollarSign,  sub: 'hoy' },
        { label: 'Pedidos',      value: String(stats.pedidos_hoy),       icon: ShoppingBag, sub: 'hoy' },
        { label: 'Clientes',     value: String(stats.clientes_hoy),      icon: Users,       sub: 'únicos' },
        { label: 'Ticket prom.', value: fmt(stats.ticket_promedio),      icon: TrendingUp,  sub: 'por pedido' },
    ];

    return (
        <AppShell title="Resumen del día" subtitle="Datos en tiempo real de tu restaurante">
            <Head title="Inicio" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Pedidos recientes */}
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-display text-lg font-bold">Pedidos recientes</h2>
                        <Link href="/pedidos" className="text-xs text-primary hover:underline">Ver todos</Link>
                    </div>
                    {pedidos_recientes.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">No hay pedidos aún hoy.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {pedidos_recientes.map(o => (
                                <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium">
                                            #{o.id} · <span className="text-muted-foreground font-normal">{o.resumen}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {o.tipo === 'mesa' ? `Mesa ${o.mesa ?? '—'}` : 'Domicilio'} · {o.tiempo}
                                        </div>
                                    </div>
                                    <div className="font-semibold text-sm shrink-0">{fmt(o.total)}</div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_CLASS[o.status] ?? 'bg-muted text-muted-foreground'}`}>
                                            {STATUS_LABEL[o.status] ?? o.status}
                                        </span>
                                        {(() => { const b = payBadge(o.total, o.amount_paid, o.status); return b && (
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${b.cls}`}>{b.label}</span>
                                        ); })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top del día */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-display text-lg font-bold mb-4">Top del día</h2>
                    {top_platos.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">Sin ventas registradas hoy.</p>
                    ) : (
                        <div className="space-y-4">
                            {top_platos.map((it, i) => (
                                <div key={it.name}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium">{i + 1}. {it.name}</span>
                                        <span className="text-muted-foreground">{fmt(it.ingresos)}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-gradient-warm" style={{ width: `${(it.vendidos / maxVendidos) * 100}%` }} />
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">{it.vendidos} vendidos</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}

// ── Dashboard Caja ─────────────────────────────────────────────────────────────

function CajaDashboard({ stats, transacciones }: CajaDashboardProps) {
    const kpis = [
        { label: 'Recaudado hoy',     value: fmt(stats.ventas_hoy),          icon: DollarSign,  sub: 'pagos recibidos' },
        { label: 'Cobros realizados', value: String(stats.pedidos_cobrados),  icon: CheckCircle2,sub: 'pedidos' },
        { label: 'Pendientes cobro',  value: String(stats.pendientes_cobro),  icon: AlertCircle, sub: 'en caja' },
    ];

    return (
        <AppShell title="Caja del día" subtitle="Resumen de cobros y pagos">
            <Head title="Inicio" />

            <div className="grid gap-4 sm:grid-cols-3">
                {kpis.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display text-lg font-bold">Últimas transacciones</h2>
                    <Link href="/caja" className="text-xs text-primary hover:underline">Ir a Caja</Link>
                </div>
                {transacciones.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Sin cobros registrados hoy.</p>
                ) : (
                    <div className="divide-y divide-border">
                        {transacciones.map(t => (
                            <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">
                                        #{t.id} · {t.tipo === 'mesa' ? `Mesa ${t.mesa ?? '—'}` : 'Domicilio'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{t.tiempo}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold">{fmt(t.amount_paid)}</div>
                                    {t.amount_paid < t.total && (
                                        <div className="text-xs text-muted-foreground">de {fmt(t.total)}</div>
                                    )}
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CLASS[t.status] ?? 'bg-muted text-muted-foreground'}`}>
                                    {STATUS_LABEL[t.status] ?? t.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

// ── Dashboard Cocina ───────────────────────────────────────────────────────────

const COCINA_STATUS_CLASS: Record<string, string> = {
    in_kitchen: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    cooking:    'bg-primary/15 text-primary border-primary/20',
    ready:      'bg-accent/15 text-accent border-accent/20',
};

function CocinaDashboard({ stats, cola }: CocinaDashboardProps) {
    const kpis = [
        { label: 'En espera',   value: String(stats.pendientes), icon: Clock,    sub: 'in_kitchen' },
        { label: 'Cocinando',   value: String(stats.cocinando),  icon: ChefHat,  sub: 'en preparación' },
        { label: 'Listos',      value: String(stats.listos),     icon: CheckCircle2, sub: 'para entregar' },
    ];

    return (
        <AppShell title="Cola de cocina" subtitle="Pedidos en preparación">
            <Head title="Inicio" />

            <div className="grid gap-4 sm:grid-cols-3">
                {kpis.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display text-lg font-bold">Pedidos activos</h2>
                    <Link href="/cocina" className="text-xs text-primary hover:underline">Ir a Cocina</Link>
                </div>
                {cola.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No hay pedidos en cola.</p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {cola.map(o => (
                            <div key={o.id}
                                className={`rounded-xl border p-4 ${COCINA_STATUS_CLASS[o.status] ?? 'bg-muted/10 border-border'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-sm">
                                        #{o.id} · {o.tipo === 'mesa' ? `Mesa ${o.mesa ?? '—'}` : 'Domicilio'}
                                    </span>
                                    <span className={`text-xs font-medium flex items-center gap-1 ${o.mins >= 15 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                        <Clock className="h-3 w-3" />{o.mins}m
                                    </span>
                                </div>
                                <div className="space-y-0.5">
                                    {o.items.map((item, i) => (
                                        <div key={i} className="text-xs">
                                            <span className="font-medium">{item.quantity}×</span> {item.dish ?? '—'}
                                            {item.notes && <span className="text-muted-foreground"> · {item.notes}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

// ── Dashboard Mesa ─────────────────────────────────────────────────────────────

const MESA_STATUS_COLOR: Record<string, string> = {
    available: 'bg-accent/10 border-accent/20 text-accent',
    occupied:  'bg-primary/10 border-primary/20 text-primary',
    reserved:  'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
};

function MesaDashboard({ mesas, pedidos_activos }: MesaDashboardProps) {
    return (
        <AppShell title="Estado de mesas" subtitle="Tus pedidos activos y mesas en servicio">
            <Head title="Inicio" />

            {/* Grid de mesas */}
            <div className="rounded-2xl border border-border bg-card p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display text-lg font-bold flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4 text-primary" /> Mesas
                    </h2>
                    <Link href="/tables" className="text-xs text-primary hover:underline">Ver todas</Link>
                </div>
                {mesas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin mesas configuradas.</p>
                ) : (
                    <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
                        {mesas.map(m => (
                            <div key={m.id}
                                className={`rounded-xl border p-3 text-center ${MESA_STATUS_COLOR[m.status] ?? 'bg-muted/10 border-border text-muted-foreground'}`}>
                                <div className="font-display font-bold text-xl">{m.number}</div>
                                <div className="text-[10px] font-medium capitalize mt-0.5">{m.status}</div>
                                {m.listos > 0 && (
                                    <div className="mt-1 text-[10px] bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 font-semibold">
                                        {m.listos} listo{m.listos > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pedidos activos */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display text-lg font-bold">Pedidos activos</h2>
                    <Link href="/pedidos" className="text-xs text-primary hover:underline">Nuevo pedido</Link>
                </div>
                {pedidos_activos.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Sin pedidos en curso.</p>
                ) : (
                    <div className="divide-y divide-border">
                        {pedidos_activos.map(o => (
                            <div key={o.id} className="py-3 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">
                                        #{o.id} · Mesa {o.mesa ?? '—'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {o.items} {o.items === 1 ? 'ítem' : 'ítems'} · {o.tiempo}
                                    </div>
                                </div>
                                <div className="font-semibold text-sm">{fmt(o.total)}</div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CLASS[o.status] ?? 'bg-muted text-muted-foreground'}`}>
                                    {STATUS_LABEL[o.status] ?? o.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

// ── Dashboard Domicilio ────────────────────────────────────────────────────────

const DOM_STATUS_CLASS: Record<string, string> = {
    ready:      'bg-accent/15 text-accent',
    in_kitchen: 'bg-yellow-500/15 text-yellow-400',
    cooking:    'bg-primary/15 text-primary',
    delivered:  'bg-muted text-muted-foreground',
};

function DomicilioDashboard({ stats, asignados }: DomicilioDashboardProps) {
    const kpis = [
        { label: 'Pendientes', value: String(stats.pendientes), icon: Bike,         sub: 'por salir' },
        { label: 'Entregados', value: String(stats.entregados), icon: CheckCircle2, sub: 'hoy' },
    ];

    const pendientes = asignados.filter(a => a.status !== 'delivered');
    const entregados = asignados.filter(a => a.status === 'delivered');

    return (
        <AppShell title="Mis domicilios" subtitle="Pedidos asignados para entrega">
            <Head title="Inicio" />

            <div className="grid gap-4 sm:grid-cols-2 mb-6">
                {kpis.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* Pendientes */}
            {pendientes.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-display text-lg font-bold">Por entregar</h2>
                        <Link href="/domicilio" className="text-xs text-primary hover:underline">Ver todos</Link>
                    </div>
                    <div className="space-y-3">
                        {pendientes.map(d => (
                            <div key={d.id} className="rounded-xl border border-border bg-muted/10 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold">#{d.id} · {d.customer_name}</div>
                                        {d.delivery_address && (
                                            <div className="text-xs text-muted-foreground mt-0.5 truncate">{d.delivery_address}</div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-0.5">{d.customer_phone} · {d.tiempo}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-semibold text-sm">{fmt(d.total)}</div>
                                        <span className={`mt-1 inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${DOM_STATUS_CLASS[d.status] ?? 'bg-muted text-muted-foreground'}`}>
                                            {STATUS_LABEL[d.status] ?? d.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Entregados hoy */}
            {entregados.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-display text-base font-bold mb-3 text-muted-foreground">Entregados hoy</h2>
                    <div className="divide-y divide-border">
                        {entregados.map(d => (
                            <div key={d.id} className="py-2.5 flex items-center justify-between gap-4">
                                <div className="text-sm text-muted-foreground">
                                    #{d.id} · {d.customer_name}
                                </div>
                                <div className="text-sm font-semibold text-muted-foreground">{fmt(d.total)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {asignados.length === 0 && (
                <div className="rounded-2xl border border-border bg-card p-10 text-center">
                    <Bike className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No tienes domicilios asignados hoy.</p>
                </div>
            )}
        </AppShell>
    );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function Dashboard(props: DashboardProps) {
    switch (props.dashboardRole) {
        case 'full':      return <FullDashboard {...props} />;
        case 'caja':      return <CajaDashboard {...props} />;
        case 'cocina':    return <CocinaDashboard {...props} />;
        case 'mesa':      return <MesaDashboard {...props} />;
        case 'domicilio': return <DomicilioDashboard {...props} />;
    }
}
