import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, LayoutDashboard, ChevronDown, ChevronUp, CheckCircle2, Unlock, Bell, Clock, XCircle, QrCode, UtensilsCrossed } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { OrderStatus, TableOrder, TablelessOrder, PageProps } from '@/types';

interface TableRow {
    id: number;
    number: number;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved';
    qr_code: string;
    active_orders_count: number;
    orders: TableOrder[];
}

interface CancelledOrder {
    id: number;
    mesa: number | null;
    total: number;
}

interface Props {
    tables: TableRow[];
    recentCancellations: CancelledOrder[];
    tablelessOrders: TablelessOrder[];
    flash?: { success?: string; error?: string };
}

interface TableForm {
    number: number | string;
    capacity: number | string;
    status: string;
}

const STATUS_LABEL: Record<string, string> = {
    available: 'Disponible',
    occupied:  'Ocupada',
    reserved:  'Reservada',
};

const STATUS_CLASS: Record<string, string> = {
    available: 'bg-accent/15 text-accent',
    occupied:  'bg-primary/15 text-primary',
    reserved:  'bg-yellow-500/15 text-yellow-400',
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    pending:    'Pendiente',
    at_cash:    'En caja',
    in_kitchen: 'En cocina',
    cooking:    'Cocinando',
    ready:      'Listo',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
};

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
    pending:    'bg-muted text-muted-foreground',
    at_cash:    'bg-primary/15 text-primary',
    in_kitchen: 'bg-blue-500/15 text-blue-400',
    cooking:    'bg-yellow-500/15 text-yellow-400',
    ready:      'bg-accent/15 text-accent',
    delivered:  'bg-accent/15 text-accent',
    cancelled:  'bg-muted text-muted-foreground',
};

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// ── Pedidos activos dentro de la tarjeta de mesa ──────────────────────────────
function TableOrdersPanel({ orders }: { orders: TableOrder[] }) {
    const [expanded, setExpanded] = useState<number | null>(null);

    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    if (activeOrders.length === 0) return null;

    const hasReady = activeOrders.some(o => o.status === 'ready');

    return (
        <div className={`mt-3 border-t pt-3 space-y-2 ${hasReady ? 'border-accent/40' : 'border-border/60'}`}>
            {hasReady && (
                <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Pedido listo para servir
                </div>
            )}
            {activeOrders.map(order => {
                const isExpanded = expanded === order.id;
                const isReady    = order.status === 'ready';

                return (
                    <div
                        key={order.id}
                        className={`rounded-xl border text-xs transition-colors ${
                            isReady ? 'border-accent/30 bg-accent/5' : 'border-border/60 bg-muted/10'
                        }`}
                    >
                        <button
                            onClick={() => setExpanded(isExpanded ? null : order.id)}
                            className="w-full flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 px-3 py-2 text-left"
                        >
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="font-semibold">#{order.id}</span>
                                <span className={`px-1.5 py-0.5 rounded-full font-medium ${ORDER_STATUS_CLASS[order.status]}`}>
                                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-auto">
                                <span className="text-muted-foreground">
                                    {order.items_count} ítem{order.items_count !== 1 ? 's' : ''} · {order.created_at}
                                </span>
                                {isExpanded
                                    ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                    : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                }
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="border-t border-border/40 px-3 pb-2 pt-1.5 space-y-1">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-muted-foreground">
                                        <span>{item.quantity}× {item.dish ?? '—'}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-semibold pt-1 border-t border-border/40 mt-1">
                                    <span>Total</span>
                                    <span>{fmt(order.total)}</span>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-border/30 px-3 py-2">
                            <button
                                onClick={() => router.visit('/adiciones')}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/8 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" /> Adiciones
                            </button>
                        </div>

                        {order.status === 'pending' && (
                            <div className="border-t border-orange-500/20 px-3 py-2">
                                <div className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 py-1.5 text-xs text-orange-400 font-medium">
                                    <Clock className="h-3 w-3" /> Pendiente · En espera de cocina
                                </div>
                            </div>
                        )}

                        {isReady && (
                            <div className="border-t border-accent/20 px-3 py-2">
                                <button
                                    onClick={() => router.post(`/cocina/${order.id}/entregado`, { redirect_to: 'tables' })}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-accent py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Marcar entregado
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Fila de pedido entregado (historial) ───────────────────────────────────────
function DeliveredOrderRow({ order }: { order: TableOrder }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 text-xs">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 px-3 py-2 text-left"
            >
                <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold">#{order.id}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                        Entregado
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto text-muted-foreground">
                    <span>{order.items_count} ítem{order.items_count !== 1 ? 's' : ''} · {order.created_at}</span>
                    {expanded
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />
                    }
                </div>
            </button>

            {expanded && (
                <div className="border-t border-border/40 px-3 pb-2 pt-1.5 space-y-1">
                    {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-muted-foreground">
                            <span>{item.quantity}× {item.dish ?? '—'}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-1 border-t border-border/40 mt-1">
                        <span>Total</span>
                        <span>{fmt(order.total)}</span>
                    </div>
                </div>
            )}

            <div className="border-t border-border/30 px-3 py-2">
                <button
                    onClick={() => router.visit('/adiciones')}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/8 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" /> Adiciones
                </button>
            </div>
        </div>
    );
}

// ── Panel de pedidos de mesa sin número asignado ───────────────────────────────
function TablelessOrdersPanel({ orders }: { orders: TablelessOrder[] }) {
    const [expanded, setExpanded] = useState<number | null>(null);

    const active = orders.filter(o => o.status !== 'delivered');
    if (active.length === 0) return null;

    const hasReady = active.some(o => o.status === 'ready');

    return (
        <div className={`mb-6 rounded-2xl border-2 p-4 ${hasReady ? 'border-accent/50 bg-accent/5' : 'border-orange-500/40 bg-orange-500/5'}`}>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <UtensilsCrossed className={`h-4 w-4 shrink-0 ${hasReady ? 'text-accent' : 'text-orange-400'}`} />
                <h2 className={`font-display text-sm font-semibold ${hasReady ? 'text-accent' : 'text-orange-400'}`}>
                    Sin mesa asignada
                </h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${hasReady ? 'bg-accent/15 text-accent' : 'bg-orange-500/15 text-orange-400'}`}>
                    {active.length}
                </span>
                <span className="text-xs text-muted-foreground ml-1">· Pedidos de mesa sin número asignado</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {active.map(order => {
                    const isExpanded = expanded === order.id;
                    const isReady    = order.status === 'ready';

                    return (
                        <div
                            key={order.id}
                            className={`rounded-xl border text-xs transition-colors bg-card ${
                                isReady ? 'border-accent/30' : 'border-border/60'
                            }`}
                        >
                            <button
                                onClick={() => setExpanded(isExpanded ? null : order.id)}
                                className="w-full flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 px-3 py-2.5 text-left"
                            >
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                    <span className="font-semibold">#{order.id}</span>
                                    <span className="text-muted-foreground">{order.customer_name}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${ORDER_STATUS_CLASS[order.status]}`}>
                                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-auto text-muted-foreground">
                                    <span>{order.items_count} ítem{order.items_count !== 1 ? 's' : ''} · {order.created_at}</span>
                                    {isExpanded
                                        ? <ChevronUp className="h-3 w-3" />
                                        : <ChevronDown className="h-3 w-3" />
                                    }
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="border-t border-border/40 px-3 pb-2 pt-1.5 space-y-1">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-muted-foreground">
                                            <span>{item.quantity}× {item.dish ?? '—'}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-semibold pt-1 border-t border-border/40 mt-1">
                                        <span>Total</span>
                                        <span>{fmt(order.total)}</span>
                                    </div>
                                </div>
                            )}

                            {order.status === 'pending' && (
                                <div className="border-t border-orange-500/20 px-3 py-2">
                                    <div className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 py-1.5 text-xs text-orange-400 font-medium">
                                        <Clock className="h-3 w-3" /> Pendiente · En espera de cocina
                                    </div>
                                </div>
                            )}

                            {isReady && (
                                <div className="border-t border-accent/20 px-3 py-2">
                                    <button
                                        onClick={() => router.post(`/cocina/${order.id}/entregado`, { redirect_to: 'tables' })}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-accent py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Marcar entregado
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Historial del día agrupado por mesa ────────────────────────────────────────
function HistorySection({ tables, tablelessOrders }: { tables: TableRow[]; tablelessOrders: TablelessOrder[] }) {
    const tablesWithHistory    = tables.filter(t => t.orders.some(o => o.status === 'delivered'));
    const tablelessDelivered   = tablelessOrders.filter(o => o.status === 'delivered');
    if (tablesWithHistory.length === 0 && tablelessDelivered.length === 0) return null;

    return (
        <div className="mt-10 border-t border-border/50 pt-8">
            <div className="flex items-center gap-2 mb-6">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Historial del día
                </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {tablesWithHistory.map(t => {
                    const deliveredOrders = t.orders.filter(o => o.status === 'delivered');
                    const totalRevenue    = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
                    return (
                        <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-display text-2xl font-bold">{t.number}</span>
                                <span className="text-xs text-muted-foreground">
                                    {deliveredOrders.length} pedido{deliveredOrders.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                                Acumulado: <span className="font-semibold text-foreground">{fmt(totalRevenue)}</span>
                            </p>
                            <div className="space-y-2">
                                {deliveredOrders.map(order => (
                                    <DeliveredOrderRow key={order.id} order={order} />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {tablelessDelivered.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-display text-lg font-bold text-muted-foreground">Sin mesa</span>
                            <span className="text-xs text-muted-foreground">
                                {tablelessDelivered.length} pedido{tablelessDelivered.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                            Acumulado: <span className="font-semibold text-foreground">
                                {fmt(tablelessDelivered.reduce((s, o) => s + o.total, 0))}
                            </span>
                        </p>
                        <div className="space-y-2">
                            {tablelessDelivered.map(order => (
                                <div key={order.id} className="rounded-xl border border-green-500/20 bg-green-500/5 text-xs px-3 py-2">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span className="font-semibold text-foreground">#{order.id} · {order.customer_name}</span>
                                        <span>{order.created_at}</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span>{order.items_count} ítem{order.items_count !== 1 ? 's' : ''}</span>
                                        <span className="font-semibold">{fmt(order.total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Tables({ tables, recentCancellations, tablelessOrders, flash }: Props) {
    const { auth } = usePage<PageProps>().props;
    const canManageStatus = ['gerente', 'administrador'].includes(auth.user?.role ?? '');

    const [showModal,      setShowModal]      = useState(false);
    const [editing,        setEditing]        = useState<TableRow | null>(null);
    const [newReady,       setNewReady]       = useState(false);
    const [newCancelled,   setNewCancelled]   = useState<CancelledOrder[]>([]);
    const prevReadyIds     = useRef<Set<number>>(new Set());
    const prevCancelledIds = useRef<Set<number>>(new Set());
    const [qrTable,        setQrTable]        = useState<TableRow | null>(null);
    const qrContainerRef   = useRef<HTMLDivElement>(null);

    // Solicitar permiso de notificaciones al montar
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Detectar pedidos nuevos en "ready" en cada recarga y alertar
    useEffect(() => {
        const tableReadyIds     = tables.flatMap(t => t.orders.filter(o => o.status === 'ready').map(o => o.id));
        const tablelessReadyIds = tablelessOrders.filter(o => o.status === 'ready').map(o => o.id);
        const currentIds        = new Set([...tableReadyIds, ...tablelessReadyIds]);

        const addedIds = [...currentIds].filter(id => !prevReadyIds.current.has(id));

        if (addedIds.length > 0) {
            setNewReady(true);
            // Notificación del navegador
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🍽️ Pedido listo para entregar', {
                    body: `${addedIds.length} pedido${addedIds.length > 1 ? 's' : ''} esperando en mesa.`,
                    icon: '/logo-trans.png',
                });
            }
            // Ocultar badge después de 8 s
            const t = setTimeout(() => setNewReady(false), 8_000);
            prevReadyIds.current = currentIds;
            return () => clearTimeout(t);
        }

        prevReadyIds.current = currentIds;
    }, [tables, tablelessOrders]);

    // Detectar nuevas cancelaciones desde cocina y mostrar alerta
    useEffect(() => {
        const currentIds = new Set(recentCancellations.map(c => c.id));
        const added = recentCancellations.filter(c => !prevCancelledIds.current.has(c.id));

        if (added.length > 0) {
            setNewCancelled(added);
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('❌ Pedido cancelado desde cocina', {
                    body: added.map(c => `#${c.id}${c.mesa ? ` · Mesa ${c.mesa}` : ''}`).join(', '),
                    icon: '/logo-trans.png',
                });
            }
            const t = setTimeout(() => setNewCancelled([]), 15_000);
            prevCancelledIds.current = currentIds;
            return () => clearTimeout(t);
        }

        prevCancelledIds.current = currentIds;
    }, [recentCancellations]);

    useEffect(() => {
        const id = setInterval(() => router.reload({ only: ['tables', 'recentCancellations'] }), 20_000);
        return () => clearInterval(id);
    }, []);

    const form = useForm<TableForm>({ number: '', capacity: '', status: 'available' });

    function openCreate() {
        form.reset();
        setEditing(null);
        setShowModal(true);
    }

    function openEdit(t: TableRow) {
        form.setData({ number: t.number, capacity: t.capacity, status: t.status });
        setEditing(t);
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        form.reset();
        setEditing(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/tables/${editing.id}`, { onSuccess: closeModal });
        } else {
            form.post('/tables', { onSuccess: closeModal });
        }
    }

    function handleDelete(t: TableRow) {
        if (t.active_orders_count > 0) return;
        if (!confirm(`¿Eliminar mesa #${t.number}?`)) return;
        router.delete(`/tables/${t.id}`);
    }

    function imprimirQR(table: TableRow) {
        const url = `${window.location.origin}/carta?mesa=${table.qr_code}`;
        const svg = qrContainerRef.current?.querySelector('svg')?.outerHTML ?? '';
        const w   = window.open('', '_blank', 'width=340,height=480');
        if (!w) return;
        w.document.write(
            '<!DOCTYPE html><html><head><title>QR Mesa #' + table.number + '</title>' +
            '<style>body{text-align:center;font-family:sans-serif;padding:1.5rem;margin:0}' +
            'h2{margin:0 0 .75rem;font-size:1.1rem}' +
            'p{font-size:10px;color:#888;word-break:break-all;margin-top:.75rem}' +
            'svg{width:200px;height:200px}</style></head><body>' +
            '<h2>Mesa #' + table.number + '</h2>' + svg +
            '<p>' + url + '</p>' +
            '<scr' + 'ipt>window.onload=function(){window.print();}<\/scr' + 'ipt>' +
            '</body></html>'
        );
        w.document.close();
    }

    return (
        <AppShell title="Mesas" subtitle="Administra las mesas del local">
            <Head title="Mesas" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 text-sm">{flash.error}</div>
            )}

            {/* Alerta de pedido listo para entregar */}
            {newReady && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border-2 border-accent/60 bg-accent/10 px-4 py-3 animate-pulse">
                    <Bell className="h-5 w-5 text-accent shrink-0" />
                    <span className="text-sm font-semibold text-accent">
                        ¡Hay pedidos listos para entregar en mesa!
                    </span>
                </div>
            )}

            {/* Alerta de pedido cancelado desde cocina */}
            {newCancelled.length > 0 && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border-2 border-red-500/50 bg-red-500/10 px-4 py-3">
                    <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-red-400">
                            {newCancelled.length === 1 ? 'Pedido cancelado desde cocina' : 'Pedidos cancelados desde cocina'}
                        </p>
                        <p className="text-xs text-red-400/70 mt-0.5">
                            {newCancelled.map(c =>
                                `#${c.id}${c.mesa ? ` · Mesa ${c.mesa}` : ''} · ${fmt(c.total)}`
                            ).join(' — ')}
                        </p>
                    </div>
                </div>
            )}

            {/* Panel de pedidos de mesa sin número asignado */}
            <TablelessOrdersPanel orders={tablelessOrders} />

            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">{tables.length} {tables.length === 1 ? 'mesa' : 'mesas'}</p>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Plus className="h-4 w-4" /> Nueva mesa
                </button>
            </div>

            {/* Grid de mesas */}
            {tables.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <LayoutDashboard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin mesas</p>
                    <p className="text-sm text-muted-foreground mt-1">Agrega las mesas de tu local.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {tables.map(t => {
                        const hasReady = t.orders.some(o => o.status === 'ready');
                        return (
                            <div
                                key={t.id}
                                className={`rounded-2xl border p-5 transition-colors ${
                                    hasReady            ? 'border-accent/50 bg-accent/5' :
                                    t.status === 'occupied'  ? 'border-primary/40 bg-primary/5' :
                                    t.status === 'reserved'  ? 'border-yellow-500/40 bg-yellow-500/5' :
                                    'border-border bg-card'
                                }`}
                            >
                                {/* ── Número + Estado ── */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="font-display text-3xl font-bold">{t.number}</div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[t.status]}`}>
                                        {STATUS_LABEL[t.status]}
                                    </span>
                                </div>

                                {/* ── Acciones: Editar / QR / Eliminar / Liberar ── */}
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    <button
                                        onClick={() => openEdit(t)}
                                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs hover:bg-muted transition-colors"
                                    >
                                        <Pencil className="h-3.5 w-3.5" /> Editar
                                    </button>
                                    <button
                                        onClick={() => setQrTable(t)}
                                        className="flex items-center justify-center rounded-lg border border-border p-1.5 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                                        title="Ver código QR de mesa"
                                    >
                                        <QrCode className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t)}
                                        disabled={t.active_orders_count > 0}
                                        className="flex items-center justify-center rounded-lg border border-border p-1.5 text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title={t.active_orders_count > 0 ? 'No se puede eliminar con pedidos activos' : 'Eliminar mesa'}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {/* Liberar mesa (solo gerente/administrador, solo si está ocupada/reservada) */}
                                {canManageStatus && t.status !== 'available' && (
                                    <button
                                        onClick={() => {
                                            if (!confirm(`¿Marcar la Mesa #${t.number} como Disponible?`)) return;
                                            router.post(`/tables/${t.id}/liberar`);
                                        }}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-accent/40 bg-accent/8 py-1.5 text-xs text-accent hover:bg-accent/15 transition-colors mb-3"
                                    >
                                        <Unlock className="h-3.5 w-3.5" /> Liberar mesa
                                    </button>
                                )}

                                {/* ── Línea divisoria ── */}
                                <div className="border-t border-border/50 mb-3" />

                                {/* ── Info de la mesa ── */}
                                <div className="text-sm text-muted-foreground mb-1">Capacidad: {t.capacity} pers.</div>

                                {t.active_orders_count > 0 && (
                                    <div className="text-xs text-primary font-medium mt-1">
                                        {t.active_orders_count} pedido{t.active_orders_count > 1 ? 's' : ''} activo{t.active_orders_count > 1 ? 's' : ''}
                                    </div>
                                )}

                                {/* ── Pedidos activos con ciclo de vida ── */}
                                <TableOrdersPanel orders={t.orders} />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Historial de pedidos entregados del día ── */}
            <HistorySection tables={tables} tablelessOrders={tablelessOrders} />

            {/* Modal QR de mesa */}
            {qrTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center">
                        <h2 className="font-display text-lg font-bold mb-1">QR Mesa #{qrTable.number}</h2>
                        <p className="text-xs text-muted-foreground mb-5">
                            El cliente escanea este código para abrir la carta con la mesa pre-seleccionada.
                        </p>
                        <div ref={qrContainerRef} className="flex justify-center mb-5">
                            <div className="rounded-2xl border border-border bg-white p-4">
                                <QRCodeSVG
                                    value={`${window.location.origin}/carta?mesa=${qrTable.qr_code}`}
                                    size={180}
                                    level="M"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground break-all mb-5 px-2">
                            {`${window.location.origin}/carta?mesa=${qrTable.qr_code}`}
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setQrTable(null)}
                                className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted transition-colors"
                            >
                                Cerrar
                            </button>
                            <button
                                type="button"
                                onClick={() => imprimirQR(qrTable)}
                                className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Imprimir QR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <h2 className="font-display text-lg font-bold mb-5">{editing ? 'Editar mesa' : 'Nueva mesa'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">N° mesa <span className="text-red-400">*</span></label>
                                    <input type="number" min={1}
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.number} onChange={e => form.setData('number', e.target.value)} autoFocus />
                                    {form.errors.number && <p className="text-xs text-red-400 mt-1">{form.errors.number}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Capacidad <span className="text-red-400">*</span></label>
                                    <input type="number" min={1}
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.capacity} onChange={e => form.setData('capacity', e.target.value)} />
                                    {form.errors.capacity && <p className="text-xs text-red-400 mt-1">{form.errors.capacity}</p>}
                                </div>
                            </div>
                            {editing && canManageStatus && (
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Estado</label>
                                    <select className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.status} onChange={e => form.setData('status', e.target.value)}>
                                        <option value="available">Disponible</option>
                                        <option value="occupied">Ocupada</option>
                                        <option value="reserved">Reservada</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                                <button type="submit" disabled={form.processing} className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
                                    {form.processing ? 'Guardando...' : editing ? 'Guardar' : 'Crear mesa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
