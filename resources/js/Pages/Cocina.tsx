import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Flame, Clock, CheckCircle2, ChevronRight, Bell, UtensilsCrossed, Bike, PlusCircle, Check, XCircle, Package } from 'lucide-react';
import { useBusinessType } from '@/hooks/use-business-type';

interface OrderItem {
    id: number;
    dish: string | null;
    quantity: number;
    notes: string | null;
    is_addition: boolean;
    is_prepared: boolean;
}

interface KitchenOrder {
    id: number;
    customer_name: string;
    tipo: string;
    turno: number | null;
    mesa: number | null;
    status: string;
    notas: string | null;
    payment_method: string | null;
    es_adicion: boolean;
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

// ── Lista de ítems con checkboxes por ítem ─────────────────────────────────────
function ItemList({
    items,
    interactive,
    checked,
    onToggle,
}: {
    items: OrderItem[];
    interactive: boolean;
    checked: Record<string, boolean>;
    onToggle: (item: OrderItem) => void;
}) {
    return (
        <div className="space-y-1.5">
            {items.map((item) => {
                const key  = String(item.id);
                // En modo interactivo usa el estado local del checkbox.
                // En modo no-interactivo (columna Listo): ítems originales siempre "done",
                // adiciones según su is_prepared real.
                const done = interactive
                    ? (checked[key] ?? false)
                    : (!item.is_addition || (checked[key] ?? item.is_prepared));

                return (
                    <div
                        key={item.id}
                        onClick={() => interactive && onToggle(item)}
                        className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-all
                            ${interactive ? 'cursor-pointer select-none' : ''}
                            ${done ? 'bg-green-500/8 opacity-50' : interactive ? 'bg-muted/20 hover:bg-muted/40' : ''}
                            ${item.is_addition && !done ? 'border border-cyan-500/20' : ''}`}
                    >
                        {/* Checkbox circular */}
                        {interactive && (
                            <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors
                                ${done
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-muted-foreground/40 bg-transparent'}`}
                            >
                                {done && <Check className="h-2.5 w-2.5 text-white stroke-3" />}
                            </div>
                        )}

                        {/* Adición indicator — solo para adiciones pendientes */}
                        {item.is_addition && !done && (
                            <PlusCircle className="h-3.5 w-3.5 shrink-0 text-cyan-400 mt-0.5" />
                        )}

                        <div className={`flex-1 min-w-0 ${done ? 'line-through text-muted-foreground' : ''}`}>
                            <span className={`text-sm ${done ? '' : 'font-semibold'} ${item.is_addition && !done ? 'text-cyan-300' : ''}`}>
                                {item.quantity}× {item.dish ?? '—'}
                            </span>
                            {item.notes && (
                                <span className="text-xs text-muted-foreground ml-1.5">({item.notes})</span>
                            )}
                        </div>

                        {/* Check visual cuando está listo */}
                        {done && (
                            <Check className="h-3.5 w-3.5 shrink-0 text-green-400 mt-0.5" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Progreso de ítems: X/Y listos ──────────────────────────────────────────────
function ItemProgress({ total, done }: { total: number; done: number }) {
    if (total === 0 || done === 0) return null;
    const allDone = done === total;
    return (
        <div className={`flex items-center gap-2 mb-2 text-xs font-semibold
            ${allDone ? 'text-green-400' : 'text-muted-foreground'}`}>
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${allDone ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${(done / total) * 100}%` }}
                />
            </div>
            <span className="shrink-0">
                {allDone ? '¡Todo listo!' : `${done} / ${total} platos`}
            </span>
        </div>
    );
}

// ── Botón de acción según estado ───────────────────────────────────────────────
function ActionButton({ order, hasPendingItems }: { order: KitchenOrder; hasPendingItems: boolean }) {
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
            <div className="space-y-1.5">
                {hasPendingItems && (
                    <p className="text-xs text-yellow-400 text-center font-medium">
                        Marca todos los platos como preparados primero
                    </p>
                )}
                <button
                    onClick={() => router.post(`/cocina/${order.id}/listo`)}
                    disabled={hasPendingItems}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-xs font-semibold text-accent-foreground transition-colors ${hasPendingItems ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent/90'}`}
                >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Marcar listo
                </button>
            </div>
        );
    }
    if (order.status === 'ready') {
        if (order.tipo === 'mostrador') {
            return (
                <button
                    onClick={() => router.post(`/cocina/${order.id}/entregado`, { redirect_to: 'cocina' })}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Entregar
                </button>
            );
        }
        return (
            <div className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-accent/10 border border-accent/20 py-2 text-xs text-accent font-medium">
                <ChevronRight className="h-3.5 w-3.5" />
                {order.tipo === 'domicilio' ? 'Esperando al repartidor' : 'Esperando al personal de mesa'}
            </div>
        );
    }
    return null;
}

// ── Tarjeta del KDS board (con checkboxes interactivos) ────────────────────────
function KdsCard({
    order,
    checked,
    onToggle,
}: {
    order: KitchenOrder;
    checked: Record<string, boolean>;
    onToggle: (item: OrderItem) => void;
}) {
    const interactive = order.status !== 'ready';
    // En columna "Listo" (no interactiva) los ítems originales se consideran siempre listos,
    // igual que la lógica de `done` en ItemList.
    const doneCnt = order.items.filter(item =>
        interactive
            ? (checked[String(item.id)] ?? false)
            : !item.is_addition || (checked[String(item.id)] ?? item.is_prepared)
    ).length;
    // Bloquear "Marcar listo" si CUALQUIER ítem (original o adición) aún no está preparado.
    const hasPendingItems = order.items.some(i => !(checked[String(i.id)] ?? i.is_prepared));

    return (
        <div className={`rounded-xl border bg-card p-4 ${order.es_adicion ? 'border-cyan-500/30' : 'border-border'}`}>
            {/* Número de turno para mostrador — prominente cuando está listo */}
            {order.tipo === 'mostrador' && order.turno && order.status === 'ready' && (
                <div className="text-center mb-3 py-3 rounded-xl bg-green-500/10 border border-green-500/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-0.5">¡Listo! Llamar turno</p>
                    <p className="font-display text-4xl font-black text-green-400">#{order.turno}</p>
                </div>
            )}

            {/* Cabecera */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-base font-bold">#{order.id}</span>
                    {order.tipo === 'mostrador' && order.turno && order.status !== 'ready' && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                            Turno #{order.turno}
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {order.tipo === 'mesa'
                            ? `Mesa ${order.mesa ?? '—'}`
                            : order.tipo === 'mostrador'
                                ? 'Mostrador'
                                : 'Domicilio'}
                    </span>
                    {order.es_adicion && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 uppercase tracking-wide">
                            Adición
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />{order.tiempo}
                </div>
            </div>

            {/* Barra de progreso */}
            <ItemProgress total={order.items.length} done={doneCnt} />

            {/* Ítems con checkboxes */}
            <div className="mb-3">
                <ItemList
                    items={order.items}
                    interactive={interactive}
                    checked={checked}
                    onToggle={onToggle}
                />
            </div>

            {/* Nota del pedido */}
            {order.notas && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 mb-3">
                    {order.notas}
                </p>
            )}

            <ActionButton order={order} hasPendingItems={hasPendingItems} />

            <div className="mt-2 pt-2 border-t border-border/20">
                <button
                    onClick={() => {
                        if (!confirm(`¿Cancelar el pedido #${order.id}? Esta acción no se puede deshacer.`)) return;
                        router.post(`/cocina/${order.id}/cancelar`);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-500/25 py-1.5 text-xs font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-colors"
                >
                    <XCircle className="h-3.5 w-3.5" /> Cancelar pedido
                </button>
            </div>
        </div>
    );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function Cocina({ orders, recientes }: Props) {
    const { isPuesto } = useBusinessType();

    // Estado de checkboxes keyed por item.id — inicializado desde is_prepared de BD
    const [checked, setChecked] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        for (const order of orders) {
            for (const item of order.items) {
                initial[String(item.id)] = item.is_prepared;
            }
        }
        return initial;
    });

    // Sincronizar: agregar ítems nuevos desde BD, quitar ítems ya no presentes
    useEffect(() => {
        setChecked(prev => {
            const next: Record<string, boolean> = {};
            for (const order of orders) {
                for (const item of order.items) {
                    const key = String(item.id);
                    // Mantener estado local si ya existe; si es nuevo, usar valor de BD
                    next[key] = key in prev ? prev[key] : item.is_prepared;
                }
            }
            return next;
        });
    }, [orders]);

    useEffect(() => {
        const id = setInterval(() => router.reload({ only: ['orders', 'recientes'] }), 15_000);
        return () => clearInterval(id);
    }, []);

    function toggleItem(item: OrderItem) {
        const key    = String(item.id);
        const newVal = !(checked[key] ?? item.is_prepared);
        // Actualización optimista
        setChecked(prev => ({ ...prev, [key]: newVal }));
        // Persistir en BD sin resetear el estado del componente
        router.post(
            `/cocina/items/${item.id}/preparado`,
            { is_prepared: newVal },
            { preserveState: true, preserveScroll: true },
        );
    }

    const byStatus = (status: string) => orders.filter(o => o.status === status);

    const pendingFresh    = byStatus('pending').filter(o => !o.es_adicion);
    const pendingAdiccion = byStatus('pending').filter(o => o.es_adicion);

    const visibleColumns = isPuesto
        ? COLUMNS.filter(c => c.key === 'ready')
        : COLUMNS;

    return (
        <AppShell title="Cocina" subtitle="Panel de preparación de pedidos">
            <Head title="Cocina" />

            {/* ── Adiciones a pedidos existentes ── */}
            {pendingAdiccion.length > 0 && (
                <div className="mb-6 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/5 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <PlusCircle className="h-4 w-4 text-cyan-400 animate-pulse" />
                        <h2 className="font-display text-base font-bold text-cyan-400">Adiciones a pedidos</h2>
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-cyan-500/15 text-cyan-400">
                            {pendingAdiccion.length}
                        </span>
                        <span className="text-xs text-cyan-400/60 ml-1">· Solo los ítems nuevos a preparar</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {pendingAdiccion.map(order => (
                            <div key={order.id} className="rounded-xl border border-cyan-500/30 bg-card p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-display text-base font-bold">#{order.id}</span>
                                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            {order.tipo === 'mesa'
                                                ? <><UtensilsCrossed className="h-3 w-3" /> Mesa {order.mesa ?? '—'}</>
                                                : order.tipo === 'mostrador'
                                                    ? <><Package className="h-3 w-3" /> Mostrador</>
                                                    : <><Bike className="h-3 w-3" /> Domicilio</>
                                            }
                                        </span>
                                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 uppercase tracking-wide">
                                            Adición
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" /> {order.tiempo}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    {order.customer_name}
                                    {order.payment_method && (
                                        <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-muted text-xs">
                                            {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
                                        </span>
                                    )}
                                </p>
                                <div className="mb-3 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
                                    <ItemList
                                        items={order.items}
                                        interactive={false}
                                        checked={checked}
                                        onToggle={toggleItem}
                                    />
                                </div>
                                {order.notas && (
                                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 mb-3">{order.notas}</p>
                                )}
                                <button
                                    onClick={() => router.post(
                                        order.tipo === 'mostrador'
                                            ? `/cocina/${order.id}/listo`
                                            : `/cocina/${order.id}/aceptar`
                                    )}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2 text-xs font-semibold text-white hover:bg-cyan-600 transition-colors"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {order.tipo === 'mostrador' ? 'Marcar listo' : 'Preparar adición'}
                                </button>
                                <div className="mt-2 pt-2 border-t border-border/20">
                                    <button
                                        onClick={() => {
                                            if (!confirm(`¿Cancelar el pedido #${order.id}? Esta acción no se puede deshacer.`)) return;
                                            router.post(`/cocina/${order.id}/cancelar`);
                                        }}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-500/25 py-1.5 text-xs font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-colors"
                                    >
                                        <XCircle className="h-3.5 w-3.5" /> Cancelar pedido
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Nuevos pedidos frescos (QR) ── */}
            {pendingFresh.length > 0 && (
                <div className="mb-6 rounded-2xl border-2 border-orange-500/40 bg-orange-500/5 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="h-4 w-4 text-orange-400 animate-pulse" />
                        <h2 className="font-display text-base font-bold text-orange-400">Nuevos pedidos</h2>
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-orange-500/15 text-orange-400">
                            {pendingFresh.length}
                        </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {pendingFresh.map(order => (
                            <div key={order.id} className="rounded-xl border border-orange-500/20 bg-card p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-display text-base font-bold">#{order.id}</span>
                                        {order.tipo === 'mostrador' && order.turno && (
                                            <span className="ml-1.5 text-sm font-bold text-primary">· Turno #{order.turno}</span>
                                        )}
                                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            {order.tipo === 'mesa'
                                                ? <><UtensilsCrossed className="h-3 w-3" /> Mesa {order.mesa ?? '—'}</>
                                                : order.tipo === 'mostrador'
                                                    ? <><Package className="h-3 w-3" /> Mostrador</>
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
                                <div className="mb-3">
                                    <ItemList
                                        items={order.items}
                                        interactive={false}
                                        checked={checked}
                                        onToggle={toggleItem}
                                    />
                                </div>
                                {order.notas && (
                                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 mb-3">{order.notas}</p>
                                )}
                                <button
                                    onClick={() => router.post(
                                        order.tipo === 'mostrador'
                                            ? `/cocina/${order.id}/listo`
                                            : `/cocina/${order.id}/aceptar`
                                    )}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {order.tipo === 'mostrador' ? 'Marcar listo' : 'Aceptar pedido'}
                                </button>
                                <div className="mt-2 pt-2 border-t border-border/20">
                                    <button
                                        onClick={() => {
                                            if (!confirm(`¿Cancelar el pedido #${order.id}? Esta acción no se puede deshacer.`)) return;
                                            router.post(`/cocina/${order.id}/cancelar`);
                                        }}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-500/25 py-1.5 text-xs font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-colors"
                                    >
                                        <XCircle className="h-3.5 w-3.5" /> Cancelar pedido
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── KDS Board: En espera / Cocinando / Listo (puesto: solo Listo) ── */}
            <div className={`grid gap-6 ${visibleColumns.length === 1 ? '' : 'lg:grid-cols-3'}`}>
                {visibleColumns.map(col => {
                    const colOrders = byStatus(col.key);
                    return (
                        <div key={col.key} className={`rounded-2xl border-2 ${col.color} p-4`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-display text-base font-bold">{col.label}</h2>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${col.badge}`}>
                                    {colOrders.length}
                                </span>
                            </div>

                            {colOrders.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">Sin pedidos</div>
                            ) : (
                                <div className="space-y-3">
                                    {colOrders.map(order => (
                                        <KdsCard
                                            key={order.id}
                                            order={order}
                                            checked={checked}
                                            onToggle={toggleItem}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Entregados recientes (15 min) ── */}
            {recientes.length > 0 && (
                <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-display text-base font-bold mb-4 text-muted-foreground">
                        Entregados (últimos 15 min)
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {recientes.map(o => (
                            <div key={o.id} className="rounded-xl border border-border bg-muted/20 px-4 py-2.5 text-sm">
                                <span className="font-semibold">#{o.id}</span>
                                <span className="text-muted-foreground ml-2">
                                    {o.tipo === 'mesa'
                                        ? `Mesa ${o.mesa ?? '—'}`
                                        : o.tipo === 'mostrador'
                                            ? 'Mostrador'
                                            : 'Domicilio'} · {o.entregado}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppShell>
    );
}
