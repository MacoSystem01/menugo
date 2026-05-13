import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderItem {
    dish: string | null;
    quantity: number;
    unit_price: number;
    notes: string | null;
}

interface OrderRow {
    id: number;
    customer_name: string;
    customer_phone: string;
    tipo: string;
    mesa: number | null;
    delivery_address: string | null;
    status: string;
    total: number;
    notas: string | null;
    items: OrderItem[];
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Filters {
    status?: string;
    tipo?: string;
    fecha?: string;
}

interface Props {
    orders: Paginated<OrderRow>;
    filters: Filters;
    flash?: { success?: string; error?: string };
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
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
    pending:    'bg-muted text-muted-foreground',
    at_cash:    'bg-yellow-500/15 text-yellow-400',
    in_kitchen: 'bg-primary/15 text-primary',
    cooking:    'bg-primary/20 text-primary',
    ready:      'bg-accent/15 text-accent',
    delivered:  'bg-muted text-muted-foreground',
    cancelled:  'bg-red-500/15 text-red-400',
};

export default function Orders({ orders, filters, flash }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [localFilters, setLocal] = useState<Filters>(filters);

    function applyFilters(newFilters: Filters) {
        setLocal(newFilters);
        router.get('/pedidos', newFilters as Record<string, string>, { preserveState: true });
    }

    function cancelar(id: number) {
        if (!confirm('¿Cancelar este pedido?')) return;
        router.post(`/pedidos/${id}/cancelar`);
    }

    return (
        <AppShell title="Pedidos" subtitle="Historial de todos los pedidos">
            <Head title="Pedidos" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select
                    value={localFilters.status ?? ''}
                    onChange={e => applyFilters({ ...localFilters, status: e.target.value || undefined })}
                    className="h-9 rounded-xl border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Todos los estados</option>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select
                    value={localFilters.tipo ?? ''}
                    onChange={e => applyFilters({ ...localFilters, tipo: e.target.value || undefined })}
                    className="h-9 rounded-xl border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Todos los tipos</option>
                    <option value="mesa">Mesa</option>
                    <option value="domicilio">Domicilio</option>
                </select>
                <input
                    type="date"
                    value={localFilters.fecha ?? ''}
                    onChange={e => applyFilters({ ...localFilters, fecha: e.target.value || undefined })}
                    className="h-9 rounded-xl border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {(localFilters.status || localFilters.tipo || localFilters.fecha) && (
                    <button onClick={() => applyFilters({})} className="h-9 rounded-xl border border-border px-3 text-xs text-muted-foreground hover:bg-muted transition-colors">
                        Limpiar filtros
                    </button>
                )}
                <span className="ml-auto text-sm text-muted-foreground self-center">{orders.total} pedidos</span>
            </div>

            {orders.data.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin pedidos</p>
                    <p className="text-sm text-muted-foreground mt-1">No hay pedidos que coincidan con los filtros.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-3 font-medium">#</th>
                                <th className="text-left px-6 py-3 font-medium">Cliente</th>
                                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Tipo</th>
                                <th className="text-left px-6 py-3 font-medium">Estado</th>
                                <th className="text-right px-6 py-3 font-medium">Total</th>
                                <th className="text-right px-6 py-3 font-medium hidden md:table-cell">Fecha</th>
                                <th className="text-center px-6 py-3 font-medium">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.data.map(o => (
                                <React.Fragment key={o.id}>
                                    <tr className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 font-semibold">#{o.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{o.customer_name}</div>
                                            <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                                            {o.tipo === 'mesa' ? `Mesa ${o.mesa ?? '—'}` : 'Domicilio'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CLASS[o.status] ?? 'bg-muted text-muted-foreground'}`}>
                                                {STATUS_LABEL[o.status] ?? o.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold">{fmt(o.total)}</td>
                                        <td className="px-6 py-4 text-right text-muted-foreground hidden md:table-cell">{o.created_at}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                                            >
                                                {expanded === o.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expanded === o.id && (
                                        <tr key={`${o.id}-detail`} className="bg-muted/10">
                                            <td colSpan={7} className="px-8 py-4">
                                                <div className="space-y-1 mb-3">
                                                    {o.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between text-sm">
                                                            <span>{item.quantity}x {item.dish ?? '—'}{item.notes ? ` (${item.notes})` : ''}</span>
                                                            <span className="text-muted-foreground">{fmt(item.unit_price * item.quantity)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {o.notas && <p className="text-xs text-muted-foreground">Nota: {o.notas}</p>}
                                                {!['delivered', 'cancelled'].includes(o.status) && (
                                                    <button
                                                        onClick={() => cancelar(o.id)}
                                                        className="mt-3 text-xs text-red-400 hover:underline"
                                                    >
                                                        Cancelar pedido
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    {/* Paginación */}
                    {orders.last_page > 1 && (
                        <div className="flex justify-center gap-1 p-4 border-t border-border">
                            {orders.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={`min-w-[2rem] h-8 px-2 rounded-lg text-xs font-medium transition-colors
                                        ${link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground disabled:opacity-40'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    );
}
