import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, ShoppingCart, LayoutDashboard, CheckCircle2, XCircle, Bike, Eye, X, UtensilsCrossed, MapPin, Phone, ArrowLeft } from 'lucide-react';

interface TableDish {
    id: number;
    name: string;
    price: number;
    description: string | null;
}

interface TableCategory {
    id: number;
    name: string;
    dishes: TableDish[];
}

interface OrderItem {
    dish: string | null;
    quantity: number;
    unit_price: number;
    is_addition: boolean;
}

interface TableOrder {
    id: number;
    status: string;
    customer_name: string;
    total: number;
    amount_paid: number;
    is_active: boolean;
    items: OrderItem[];
    created_at: string;
}

interface TableRow {
    id: number;
    number: number;
    status: string;
    orders: TableOrder[];
}

interface DomicilioOrder {
    id: number;
    status: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string | null;
    total: number;
    amount_paid: number;
    is_active: boolean;
    items: OrderItem[];
    created_at: string;
}

interface DetailOrder {
    id: number;
    status: string;
    kind: 'mesa' | 'domicilio';
    tableNumber?: number;
    customer_name: string;
    customer_phone?: string;
    delivery_address?: string | null;
    total: number;
    items: OrderItem[];
    created_at: string;
}

interface Props {
    tables: TableRow[];
    domicilios: DomicilioOrder[];
    categories: TableCategory[];
    flash?: { success?: string; error?: string };
}

const CAT_PALETTE = [
    { bg: 'rgba(251,146,60,0.18)',  color: '#fb923c' },
    { bg: 'rgba(34,211,238,0.18)',  color: '#22d3ee' },
    { bg: 'rgba(167,139,250,0.18)', color: '#a78bfa' },
    { bg: 'rgba(52,211,153,0.18)',  color: '#34d399' },
    { bg: 'rgba(251,113,133,0.18)', color: '#fb7185' },
    { bg: 'rgba(250,204,21,0.18)',  color: '#facc15' },
    { bg: 'rgba(96,165,250,0.18)',  color: '#60a5fa' },
    { bg: 'rgba(244,114,182,0.18)', color: '#f472b6' },
];

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
    pending:    'bg-muted text-muted-foreground',
    at_cash:    'bg-primary/15 text-primary',
    in_kitchen: 'bg-blue-500/15 text-blue-400',
    cooking:    'bg-yellow-500/15 text-yellow-400',
    ready:      'bg-accent/15 text-accent',
    delivered:  'bg-green-500/15 text-green-400',
    cancelled:  'bg-red-500/15 text-red-400',
};

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// ── Modal de detalles: bottom-sheet en móvil, centrado en desktop ──────────────

function OrderDetailModal({ order, onClose }: { order: DetailOrder; onClose: () => void }) {
    const originalItems = order.items.filter(i => !i.is_addition);
    const additionItems = order.items.filter(i => i.is_addition);
    const originalTotal = originalItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const additionTotal = additionItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[80vh]">

                {/* Handle bar (móvil) */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-border" />
                </div>

                {/* Encabezado */}
                <div className="px-5 py-4 bg-muted/30 border-b border-border/60 flex items-start justify-between gap-3 shrink-0">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {order.kind === 'domicilio'
                                ? <Bike className="h-4 w-4 text-muted-foreground shrink-0" />
                                : <UtensilsCrossed className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <span className="font-bold text-base">Pedido #{order.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CLASS[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                                {STATUS_LABEL[order.status] ?? order.status}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {order.kind === 'mesa' ? `Mesa ${order.tableNumber}` : 'Domicilio'} · {order.created_at}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Info del cliente */}
                <div className="px-5 py-3 border-b border-border/40 space-y-1.5 shrink-0">
                    <p className="text-sm font-semibold">{order.customer_name}</p>
                    {order.customer_phone && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            {order.customer_phone}
                        </p>
                    )}
                    {order.delivery_address && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {order.delivery_address}
                        </p>
                    )}
                </div>

                {/* Ítems — zona scrollable */}
                <div className="px-5 py-3 space-y-1 overflow-y-auto flex-1">
                    {originalItems.length > 0 && (
                        <>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                Pedido original
                            </p>
                            {originalItems.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm py-0.5">
                                    <span className="text-foreground">
                                        <span className="font-semibold tabular-nums">{item.quantity}×</span>{' '}
                                        {item.dish ?? '—'}
                                    </span>
                                    <span className="tabular-nums text-muted-foreground text-xs ml-3 shrink-0">{fmt(item.unit_price * item.quantity)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/30 mt-1.5">
                                <span>Subtotal original</span>
                                <span className="tabular-nums font-semibold">{fmt(originalTotal)}</span>
                            </div>
                        </>
                    )}

                    {additionItems.length > 0 && (
                        <div className="pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-1.5">
                                Adiciones ({additionItems.length})
                            </p>
                            {additionItems.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm py-0.5">
                                    <span className="text-foreground flex items-center gap-1.5">
                                        <span className="font-semibold tabular-nums">{item.quantity}×</span>{' '}
                                        {item.dish ?? '—'}
                                        <span className="px-1 py-px rounded-full bg-yellow-500/15 text-yellow-400 font-semibold leading-none" style={{ fontSize: '9px' }}>+</span>
                                    </span>
                                    <span className="tabular-nums text-muted-foreground text-xs ml-3 shrink-0">{fmt(item.unit_price * item.quantity)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-xs text-yellow-400/80 pt-1.5 border-t border-border/30 mt-1.5">
                                <span>Subtotal adiciones</span>
                                <span className="tabular-nums font-semibold">{fmt(additionTotal)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Total */}
                <div className="px-5 py-4 bg-muted/20 border-t border-border/60 flex justify-between items-center shrink-0">
                    <span className="font-semibold text-sm">Total del pedido</span>
                    <span className="font-bold text-base tabular-nums text-foreground">{fmt(order.total)}</span>
                </div>
            </div>
        </div>
    );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function Adiciones({ tables, domicilios, categories, flash }: Props) {
    useEffect(() => {
        const id = setInterval(() => router.reload({ only: ['tables', 'domicilios'] }), 20_000);
        return () => clearInterval(id);
    }, []);

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [detailOrder, setDetailOrder]         = useState<DetailOrder | null>(null);
    const [cart, setCart]                       = useState<Record<number, number>>({});
    const [search, setSearch]                   = useState('');
    const [submitting, setSubmitting]           = useState(false);

    type SelectedCtx =
        | { type: 'mesa';      table: TableRow;      order: TableOrder }
        | { type: 'domicilio'; order: DomicilioOrder };

    const selectedCtx = useMemo((): SelectedCtx | null => {
        for (const t of tables) {
            const o = t.orders.find(o => o.id === selectedOrderId);
            if (o) return { type: 'mesa', table: t, order: o };
        }
        const d = domicilios.find(o => o.id === selectedOrderId);
        if (d) return { type: 'domicilio', order: d };
        return null;
    }, [tables, domicilios, selectedOrderId]);

    const cartItems = useMemo(() =>
        Object.entries(cart)
            .filter(([, qty]) => qty > 0)
            .flatMap(([dishId, qty]) => {
                const dish = categories.flatMap(c => c.dishes).find(d => d.id === Number(dishId));
                return dish ? [{ dish, qty }] : [];
            }),
        [cart, categories]
    );

    const cartTotal = cartItems.reduce((s, { dish, qty }) => s + dish.price * qty, 0);
    const cartCount = cartItems.reduce((s, { qty }) => s + qty, 0);

    function setQty(dishId: number, delta: number) {
        setCart(prev => ({ ...prev, [dishId]: Math.max(0, (prev[dishId] ?? 0) + delta) }));
    }

    const filteredCategories = useMemo(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase();
        return categories
            .map(c => ({ ...c, dishes: c.dishes.filter(d => d.name.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q)) }))
            .filter(c => c.dishes.length > 0);
    }, [categories, search]);

    function selectActiveOrder(orderId: number) {
        if (selectedOrderId === orderId) {
            setSelectedOrderId(null);
        } else {
            setSelectedOrderId(orderId);
            setCart({});
            setSearch('');
        }
    }

    function handleSubmit() {
        if (!selectedOrderId || cartItems.length === 0) return;
        setSubmitting(true);
        router.post(`/adiciones/${selectedOrderId}/agregar`, {
            items: cartItems.map(({ dish, qty }) => ({ dish_id: dish.id, quantity: qty })),
        }, {
            onSuccess: () => { setCart({}); setSubmitting(false); },
            onError:   () => setSubmitting(false),
        });
    }

    // ── Fila de pedido ─────────────────────────────────────────────────────────

    function OrderRow({
        order, isSelected, onSelect, onDetail, dim = false, isMesa,
    }: {
        order: TableOrder | DomicilioOrder;
        isSelected: boolean;
        onSelect: () => void;
        onDetail: () => void;
        dim?: boolean;
        isMesa: boolean;
    }) {
        const isClosed    = !order.is_active;
        const isDelivered = order.status === 'delivered';

        return (
            <div className={`border-b border-border/50 last:border-b-0 transition-colors
                ${isSelected
                    ? isClosed
                        ? 'bg-yellow-500/8 border-l-[3px] border-l-yellow-500'
                        : 'bg-primary/8 border-l-[3px] border-l-primary'
                    : dim
                        ? 'border-l-[3px] border-l-transparent opacity-70'
                        : 'border-l-[3px] border-l-transparent'
                }
            `}>
                <div className="flex items-center gap-2 px-4 py-3.5 sm:py-2.5">

                    {/* Zona de selección */}
                    <button onClick={onSelect} className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {!isMesa && <Bike className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                            <span className={`text-sm font-bold ${isSelected && !isClosed ? 'text-primary' : isClosed ? 'text-muted-foreground' : ''}`}>
                                #{order.id}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_CLASS[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                                {STATUS_LABEL[order.status] ?? order.status}
                            </span>
                            {isClosed && (isDelivered
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                                : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />)}
                            {isSelected && !isClosed && (
                                <span className="text-xs font-semibold text-primary">← agregando</span>
                            )}
                        </div>

                        {'customer_phone' in order && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">{order.customer_name}</div>
                        )}
                        {'delivery_address' in order && order.delivery_address && (
                            <div className="text-xs text-muted-foreground truncate">{order.delivery_address}</div>
                        )}

                        <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                            <span>{order.items.length} ítem{order.items.length !== 1 ? 's' : ''} · {order.created_at}</span>
                            <span className="font-semibold tabular-nums ml-2 shrink-0">{fmt(order.total)}</span>
                        </div>
                    </button>

                    {/* Botón Ver detalles — ícono grande en móvil */}
                    <button
                        onClick={onDetail}
                        title="Ver detalles"
                        className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-2 sm:py-1.5 sm:gap-1 rounded-xl sm:rounded-lg border border-border/60 hover:bg-muted transition-colors shrink-0 text-muted-foreground hover:text-foreground"
                    >
                        <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden sm:inline text-xs">Detalles</span>
                    </button>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────────────────────────────────────

    return (
        <AppShell title="Adiciones" subtitle="Historial y adiciones de pedidos por mesa y domicilio">
            <Head title="Adiciones" />

            {detailOrder && (
                <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
            )}

            {tables.length === 0 && domicilios.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center">
                    <LayoutDashboard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin pedidos hoy</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Los pedidos del día aparecerán aquí agrupados por mesa o domicilio.
                    </p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">

                    {/* ══ Panel izquierdo: lista de pedidos ══ */}
                    <div className={`space-y-4 ${selectedCtx ? 'hidden lg:block' : ''}`}>

                        {/* Hint visible solo en móvil */}
                        <p className="lg:hidden text-xs text-center text-muted-foreground py-1">
                            Toca un pedido activo para agregar productos
                        </p>

                        {tables.length > 0 && (
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                                Pedidos de hoy · {tables.length} mesa{tables.length !== 1 ? 's' : ''}
                            </p>
                        )}

                        {tables.map(t => {
                            const activeCount  = t.orders.filter(o => o.is_active).length;
                            const closedOrders = t.orders.filter(o => !o.is_active);
                            const activeOrders = t.orders.filter(o => o.is_active);
                            const tableTotal   = t.orders.reduce((s, o) => s + o.total, 0);

                            return (
                                <div key={t.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                                    <div className="px-4 py-3 bg-muted/20 border-b border-border/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="font-display text-2xl font-bold leading-none">{t.number}</span>
                                            <div className="text-xs text-muted-foreground">
                                                <div>{t.orders.length} pedido{t.orders.length !== 1 ? 's' : ''} hoy</div>
                                                {activeCount > 0 && (
                                                    <div className="text-primary font-semibold">{activeCount} activo{activeCount !== 1 ? 's' : ''}</div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold tabular-nums">{fmt(tableTotal)}</span>
                                    </div>

                                    {activeOrders.length > 0 && (
                                        <div className="divide-y divide-border/50">
                                            {activeOrders.map(o => (
                                                <OrderRow
                                                    key={o.id}
                                                    order={o}
                                                    isSelected={selectedOrderId === o.id}
                                                    onSelect={() => selectActiveOrder(o.id)}
                                                    onDetail={() => setDetailOrder({
                                                        id: o.id, status: o.status, kind: 'mesa',
                                                        tableNumber: t.number,
                                                        customer_name: o.customer_name,
                                                        total: o.total, items: o.items, created_at: o.created_at,
                                                    })}
                                                    isMesa
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {closedOrders.length > 0 && (
                                        <div className={`divide-y divide-border/40 ${activeOrders.length > 0 ? 'border-t border-dashed border-border/60' : ''}`}>
                                            {closedOrders.map(o => (
                                                <OrderRow
                                                    key={o.id}
                                                    order={o}
                                                    isSelected={selectedOrderId === o.id}
                                                    onSelect={() => selectActiveOrder(o.id)}
                                                    onDetail={() => setDetailOrder({
                                                        id: o.id, status: o.status, kind: 'mesa',
                                                        tableNumber: t.number,
                                                        customer_name: o.customer_name,
                                                        total: o.total, items: o.items, created_at: o.created_at,
                                                    })}
                                                    dim
                                                    isMesa
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {domicilios.length > 0 && (
                            <>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-2">
                                    Domicilios hoy · {domicilios.length} pedido{domicilios.length !== 1 ? 's' : ''}
                                </p>
                                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                                    {domicilios.filter(o => o.is_active).map(o => (
                                        <OrderRow
                                            key={o.id}
                                            order={o}
                                            isSelected={selectedOrderId === o.id}
                                            onSelect={() => selectActiveOrder(o.id)}
                                            onDetail={() => setDetailOrder({
                                                id: o.id, status: o.status, kind: 'domicilio',
                                                customer_name: o.customer_name,
                                                customer_phone: o.customer_phone,
                                                delivery_address: o.delivery_address,
                                                total: o.total, items: o.items, created_at: o.created_at,
                                            })}
                                            isMesa={false}
                                        />
                                    ))}
                                    {domicilios.filter(o => !o.is_active).map(o => (
                                        <OrderRow
                                            key={o.id}
                                            order={o}
                                            isSelected={selectedOrderId === o.id}
                                            onSelect={() => selectActiveOrder(o.id)}
                                            onDetail={() => setDetailOrder({
                                                id: o.id, status: o.status, kind: 'domicilio',
                                                customer_name: o.customer_name,
                                                customer_phone: o.customer_phone,
                                                delivery_address: o.delivery_address,
                                                total: o.total, items: o.items, created_at: o.created_at,
                                            })}
                                            dim
                                            isMesa={false}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ══ Panel derecho: catálogo ══ */}
                    {selectedCtx ? (
                        <div className="space-y-3">

                            {/* Barra de navegación sticky — solo móvil */}
                            <div className="lg:hidden sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/60 flex items-center gap-3 px-1 py-2.5 -mx-1 mb-1">
                                <button
                                    onClick={() => { setSelectedOrderId(null); setCart({}); }}
                                    className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted transition-colors shrink-0"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold leading-tight truncate">
                                        Pedido #{selectedCtx.order.id}
                                        {selectedCtx.type === 'mesa'
                                            ? ` · Mesa ${selectedCtx.table.number}`
                                            : ` · ${selectedCtx.order.customer_name}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-tight">
                                        {fmt(selectedCtx.order.total)}
                                        {cartCount > 0 && (
                                            <span className="text-accent font-semibold"> + {fmt(cartTotal)}</span>
                                        )}
                                    </p>
                                </div>
                                {cartCount > 0 && (
                                    <span className="shrink-0 flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </div>

                            {/* Banner pedido seleccionado — solo desktop */}
                            <div className="hidden lg:flex rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4 flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-primary">
                                        Pedido #{selectedCtx.order.id} ·{' '}
                                        {selectedCtx.type === 'mesa'
                                            ? `Mesa ${selectedCtx.table.number}`
                                            : `Domicilio · ${selectedCtx.order.customer_name}`}
                                    </p>
                                    {selectedCtx.type === 'domicilio' && selectedCtx.order.delivery_address && (
                                        <p className="text-xs text-muted-foreground truncate">{selectedCtx.order.delivery_address}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Total actual: <span className="font-semibold">{fmt(selectedCtx.order.total)}</span>
                                        {cartCount > 0 && (
                                            <span className="ml-2 text-accent font-semibold">+ {fmt(cartTotal)} en adición</span>
                                        )}
                                    </p>
                                </div>
                                {cartCount > 0 && (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-semibold">
                                        {cartCount} ítem{cartCount !== 1 ? 's' : ''} en carrito
                                    </span>
                                )}
                            </div>

                            {/* Buscador — text-base previene zoom automático en iOS */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar plato..."
                                    className="w-full rounded-xl border border-input bg-input pl-9 pr-4 py-3 sm:py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            {/* Catálogo */}
                            {filteredCategories.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-10">
                                    Sin resultados para "{search}"
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {filteredCategories.map((cat, catIdx) => {
                                        const c = CAT_PALETTE[catIdx % CAT_PALETTE.length];
                                        return (
                                            <div key={cat.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                                                <div className="px-4 py-2.5" style={{ backgroundColor: c.bg }}>
                                                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: c.color }}>
                                                        {cat.name}
                                                    </span>
                                                </div>
                                                <div className="divide-y divide-border/40">
                                                    {cat.dishes.map(dish => {
                                                        const qty = cart[dish.id] ?? 0;
                                                        return (
                                                            <div
                                                                key={dish.id}
                                                                className={`flex items-center gap-3 px-4 py-4 sm:py-3 transition-colors ${qty > 0 ? 'bg-primary/5' : ''}`}
                                                            >
                                                                {/* Nombre + descripción + precio (precio debajo en móvil) */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium leading-snug">{dish.name}</div>
                                                                    {dish.description && (
                                                                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{dish.description}</div>
                                                                    )}
                                                                    {/* Precio visible solo en móvil (debajo del nombre) */}
                                                                    <div className={`text-sm font-bold tabular-nums mt-1 sm:hidden ${qty > 0 ? 'text-primary' : 'text-foreground'}`}>
                                                                        {fmt(dish.price)}
                                                                    </div>
                                                                </div>

                                                                {/* Precio visible solo en desktop */}
                                                                <span className="hidden sm:block text-sm font-semibold shrink-0 tabular-nums">
                                                                    {fmt(dish.price)}
                                                                </span>

                                                                {/* Controles +/- con botones táctiles grandes en móvil */}
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button
                                                                        onClick={() => setQty(dish.id, -1)}
                                                                        disabled={qty === 0}
                                                                        className="h-10 w-10 sm:h-7 sm:w-7 rounded-xl sm:rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                                    >
                                                                        <Minus className="h-4 w-4 sm:h-3 sm:w-3" />
                                                                    </button>
                                                                    <span className={`w-8 text-center text-base sm:text-sm font-bold tabular-nums ${qty > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                                                        {qty || '—'}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setQty(dish.id, +1)}
                                                                        className="h-10 w-10 sm:h-7 sm:w-7 rounded-xl sm:rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                                                                    >
                                                                        <Plus className="h-4 w-4 sm:h-3 sm:w-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Carrito sticky: sin bordes laterales y anclado al fondo en móvil */}
                            {cartCount > 0 && (
                                <div className="sticky bottom-0 sm:bottom-4 -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-t sm:border border-accent/40 bg-card/98 backdrop-blur-sm shadow-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4 text-accent shrink-0" />
                                        <span className="text-sm font-semibold flex-1 truncate">
                                            Adición · #{selectedCtx.order.id}
                                            {selectedCtx.type === 'mesa' ? ` · Mesa ${selectedCtx.table.number}` : ' · Domicilio'}
                                        </span>
                                        <span className="text-accent font-bold tabular-nums shrink-0">{fmt(cartTotal)}</span>
                                    </div>
                                    <div className="space-y-1 border-t border-border/50 pt-2">
                                        {cartItems.map(({ dish, qty }) => (
                                            <div key={dish.id} className="flex justify-between text-xs text-muted-foreground">
                                                <span className="truncate mr-2">{qty}× {dish.name}</span>
                                                <span className="tabular-nums shrink-0">{fmt(dish.price * qty)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-xs font-semibold pt-1.5 border-t border-border/40">
                                            <span>Nuevo total</span>
                                            <span className="tabular-nums text-foreground">{fmt(selectedCtx.order.total + cartTotal)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="w-full rounded-xl bg-primary py-3.5 sm:py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Agregando...' : `Agregar ${cartCount} ítem${cartCount !== 1 ? 's' : ''} al pedido`}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden lg:flex rounded-2xl border border-border bg-card p-16 flex-col items-center justify-center text-center">
                            <ShoppingCart className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="font-medium">Selecciona un pedido activo</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Elige un pedido activo (mesa o domicilio) para agregar productos.
                                <br />Los pedidos entregados o cancelados se muestran como historial.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    );
}
