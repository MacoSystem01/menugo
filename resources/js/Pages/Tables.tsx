import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, LayoutDashboard, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import type { OrderStatus, TableOrder } from '@/types';

interface TableRow {
    id: number;
    number: number;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved';
    qr_code: string;
    active_orders_count: number;
    orders: TableOrder[];
}

interface Props {
    tables: TableRow[];
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

function TableOrdersPanel({ orders }: { orders: TableOrder[] }) {
    const [expanded, setExpanded] = useState<number | null>(null);

    if (orders.length === 0) return null;

    const hasReady = orders.some(o => o.status === 'ready');

    return (
        <div className={`mt-3 border-t pt-3 space-y-2 ${hasReady ? 'border-accent/40' : 'border-border/60'}`}>
            {hasReady && (
                <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Pedido listo para servir
                </div>
            )}
            {orders.map(order => {
                const isExpanded = expanded === order.id;
                const isReady    = order.status === 'ready';

                return (
                    <div
                        key={order.id}
                        className={`rounded-xl border text-xs ${isReady ? 'border-accent/30 bg-accent/5' : 'border-border/60 bg-muted/10'}`}
                    >
                        {/* Cabecera del pedido */}
                        <button
                            onClick={() => setExpanded(isExpanded ? null : order.id)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold">#{order.id}</span>
                                <span className={`px-1.5 py-0.5 rounded-full font-medium ${ORDER_STATUS_CLASS[order.status]}`}>
                                    {ORDER_STATUS_LABEL[order.status]}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-muted-foreground">{order.items_count} ítem{order.items_count !== 1 ? 's' : ''} · {order.created_at}</span>
                                {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                            </div>
                        </button>

                        {/* Detalle de ítems */}
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

                        {/* Marcar entregado (solo cuando listo) */}
                        {isReady && (
                            <div className="border-t border-accent/20 px-3 py-2">
                                <button
                                    onClick={() => router.post(`/cocina/${order.id}/entregado`)}
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

export default function Tables({ tables, flash }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing]     = useState<TableRow | null>(null);

    useEffect(() => {
        const id = setInterval(() => router.reload({ only: ['tables'] }), 20_000);
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

    return (
        <AppShell title="Mesas" subtitle="Administra las mesas del local">
            <Head title="Mesas" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 text-sm">{flash.error}</div>
            )}

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
                                <div className="flex justify-between items-start mb-3">
                                    <div className="font-display text-3xl font-bold">{t.number}</div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[t.status]}`}>
                                        {STATUS_LABEL[t.status]}
                                    </span>
                                </div>

                                <div className="text-sm text-muted-foreground mb-1">Capacidad: {t.capacity} pers.</div>

                                {t.active_orders_count > 0 && (
                                    <div className="text-xs text-primary font-medium mt-1">
                                        {t.active_orders_count} pedido{t.active_orders_count > 1 ? 's' : ''} activo{t.active_orders_count > 1 ? 's' : ''}
                                    </div>
                                )}

                                {/* Pedidos activos con ciclo de vida */}
                                <TableOrdersPanel orders={t.orders} />

                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs hover:bg-muted transition-colors">
                                        <Pencil className="h-3.5 w-3.5" /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t)}
                                        disabled={t.active_orders_count > 0}
                                        className="flex items-center justify-center rounded-lg border border-border p-1.5 text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
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
                            {editing && (
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
