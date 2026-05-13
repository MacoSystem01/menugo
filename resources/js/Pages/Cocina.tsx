import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { Flame, Clock, CheckCircle2, ChevronRight, Bell, UtensilsCrossed, Bike } from 'lucide-react';

interface OrderItem {
    dish: string | null;
    quantity: number;
    notes: string | null;
}

interface KitchenOrder {
    id: number;
    customer_name: string;
    customer_phone: string;
    tipo: string;
    mesa: number | null;
    status: string;
    notas: string | null;
    payment_method: string | null;
    items: OrderItem[];
    tiempo: string;
    created_at: string;
}

interface RecentOrder {
    id: number;
    tipo: string;
    mesa: number | null;
    items_count: number;
    entregado: string;
}

interface Props {
    orders: KitchenOrder[];
    recientes: RecentOrder[];
}

const COLUMNS = [
    { key: 'in_kitchen', label: 'En espera',  color: 'border-yellow-500/40 bg-yellow-500/5', badge: 'bg-yellow-500/15 text-yellow-400' },
    { key: 'cooking',    label: 'Cocinando',  color: 'border-primary/40 bg-primary/5',      badge: 'bg-primary/15 text-primary' },
    { key: 'ready',      label: 'Listo',      color: 'border-accent/40 bg-accent/5',        badge: 'bg-accent/15 text-accent' },
];

const PAYMENT_LABELS: Record<string, string> = {
    efectivo: 'Efectivo', pse: 'PSE', nequi: 'Nequi',
    daviplata: 'Daviplata', tarjeta: 'Tarjeta', transferencia: 'Transferencia',
};

function ActionButton({ order }: { order: KitchenOrder }) {
    if (order.status === 'in_kitchen') {
        return (
            <button
                onClick={() => router.post(`/cocina/${order.id}/cocinar`)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                <Flame className="h-3.5 w-3.5" /> A cocinar
            </button>
        );
    }
    if (order.status === 'cooking') {
        return (
            <button
                onClick={() => router.post(`/cocina/${order.id}/listo`)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
            >
                <CheckCircle2 className="h-3.5 w-3.5" /> Marcar listo
            </button>
        );
    }
    if (order.status === 'ready') {
        return (
            <div className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-accent/10 border border-accent/20 py-2 text-xs text-accent font-medium">
                <ChevronRight className="h-3.5 w-3.5" />
                {order.tipo === 'domicilio' ? 'Esperando al repartidor' : 'Esperando en mesa'}
            </div>
        );
    }
    return null;
}

export default function Cocina({ orders, recientes }: Props) {
    const byStatus = (status: string) => orders.filter(o => o.status === status);
    const pending = byStatus('pending');

    return (
        <AppShell title="Cocina" subtitle="Panel de preparación de pedidos">
            <Head title="Cocina" />

            {/* ── Nuevos pedidos (carta QR) ── */}
            {pending.length > 0 && (
                <div className="mb-6 rounded-2xl border-2 border-orange-500/40 bg-orange-500/5 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="h-4 w-4 text-orange-400 animate-pulse" />
                        <h2 className="font-display text-base font-bold text-orange-400">Nuevos pedidos</h2>
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-orange-500/15 text-orange-400">
                            {pending.length}
                        </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {pending.map(order => (
                            <div key={order.id} className="rounded-xl border border-orange-500/20 bg-card p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-display text-base font-bold">#{order.id}</span>
                                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            {order.tipo === 'mesa'
                                                ? <><UtensilsCrossed className="h-3 w-3" /> Mesa {order.mesa ?? '—'}</>
                                                : <><Bike className="h-3 w-3" /> Domicilio</>
                                            }
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" /> {order.tiempo}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {order.customer_name}
                                    {order.payment_method && (
                                        <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-muted text-xs">
                                            {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
                                        </span>
                                    )}
                                </p>
                                <div className="space-y-1 mb-3">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="text-sm">
                                            <span className="font-semibold">{item.quantity}x</span> {item.dish ?? '—'}
                                            {item.notes && <span className="text-xs text-muted-foreground ml-1">({item.notes})</span>}
                                        </div>
                                    ))}
                                </div>
                                {order.notas && (
                                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 mb-3">{order.notas}</p>
                                )}
                                <button
                                    onClick={() => router.post(`/cocina/${order.id}/aceptar`)}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Aceptar pedido
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KDS Board */}
            <div className="grid gap-6 lg:grid-cols-3">
                {COLUMNS.map(col => {
                    const colOrders = byStatus(col.key);
                    return (
                        <div key={col.key} className={`rounded-2xl border-2 ${col.color} p-4`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-display text-base font-bold">{col.label}</h2>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${col.badge}`}>{colOrders.length}</span>
                            </div>

                            {colOrders.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">Sin pedidos</div>
                            ) : (
                                <div className="space-y-3">
                                    {colOrders.map(order => (
                                        <div key={order.id} className="rounded-xl border border-border bg-card p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-display text-base font-bold">#{order.id}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {order.tipo === 'mesa' ? `Mesa ${order.mesa ?? '—'}` : 'Domicilio'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />{order.tiempo}
                                                </div>
                                            </div>
                                            <div className="space-y-1 mb-3">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="text-sm">
                                                        <span className="font-semibold">{item.quantity}x</span> {item.dish ?? '—'}
                                                        {item.notes && <span className="text-xs text-muted-foreground ml-1">({item.notes})</span>}
                                                    </div>
                                                ))}
                                            </div>
                                            {order.notas && (
                                                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 mb-3">{order.notas}</p>
                                            )}
                                            <ActionButton order={order} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Entregados recientes (15 min) */}
            {recientes.length > 0 && (
                <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-display text-base font-bold mb-4 text-muted-foreground">Entregados (últimos 15 min)</h2>
                    <div className="flex flex-wrap gap-3">
                        {recientes.map(o => (
                            <div key={o.id} className="rounded-xl border border-border bg-muted/20 px-4 py-2.5 text-sm">
                                <span className="font-semibold">#{o.id}</span>
                                <span className="text-muted-foreground ml-2">{o.tipo === 'mesa' ? `Mesa ${o.mesa ?? '—'}` : 'Domicilio'} · {o.entregado}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppShell>
    );
}
