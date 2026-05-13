import AppShell from '@/Layouts/AppShell';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { MapPin, Bike, CheckCircle2, Phone, PackageCheck } from 'lucide-react';
import type { PageProps } from '@/types';

interface DeliveryOrder {
    id: number;
    customer_name: string;
    customer_phone: string;
    delivery_address: string | null;
    delivery_phone: string | null;
    status: string;
    total: number;
    delivery_user: string | null;
    delivery_user_id: number | null;
    items_count: number;
    notas: string | null;
    created_at: string;
    delivered_at: string | null;
}

interface Repartidor {
    id: number;
    name: string;
}

interface Props {
    active: DeliveryOrder[];
    repartidores: Repartidor[];
    flash?: { success?: string; error?: string };
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function AsignarForm({ order, repartidores }: { order: DeliveryOrder; repartidores: Repartidor[] }) {
    const form = useForm({ delivery_user_id: order.delivery_user_id ?? '' });

    return (
        <form
            onSubmit={e => { e.preventDefault(); form.put(`/domicilio/${order.id}/asignar`); }}
            className="flex gap-2 mt-3"
        >
            <select
                className="flex-1 h-8 rounded-lg border border-input bg-input px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.data.delivery_user_id}
                onChange={e => form.setData('delivery_user_id', e.target.value)}
            >
                <option value="">Asignar repartidor...</option>
                {repartidores.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button
                type="submit"
                disabled={!form.data.delivery_user_id || form.processing}
                className="h-8 px-3 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
                Asignar
            </button>
        </form>
    );
}

export default function Domicilio({ active, repartidores, flash }: Props) {
    const { auth } = usePage<PageProps>().props;

    const isAdmin      = auth.user.roles.includes('administrador') || auth.user.roles.includes('gerente');
    const isRepartidor = auth.user.roles.includes('domicilio');

    useEffect(() => {
        const id = setInterval(() => router.reload({ only: ['active', 'repartidores'] }), 20_000);
        return () => clearInterval(id);
    }, []);

    const pending   = active.filter(o => o.status === 'ready');
    const delivered = active.filter(o => o.status === 'delivered');

    function tomar(id: number) {
        router.post(`/domicilio/${id}/tomar`);
    }

    return (
        <AppShell title="Domicilio" subtitle="Gestión de pedidos a domicilio">
            <Head title="Domicilio" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 text-sm">{flash.error}</div>
            )}

            {/* Pendientes de despacho */}
            <h2 className="font-display text-base font-bold mb-3">
                Para despachar <span className="ml-2 text-sm font-normal text-muted-foreground">({pending.length})</span>
            </h2>

            {pending.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center mb-6">
                    <Bike className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Sin pedidos pendientes de despacho.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {pending.map(order => (
                        <div key={order.id} className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-display text-lg font-bold">#{order.id}</span>
                                <span className="font-semibold text-sm">{fmt(order.total)}</span>
                            </div>
                            <div className="text-sm font-medium mb-1">{order.customer_name}</div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                <Phone className="h-3 w-3" />{order.customer_phone}
                                {order.delivery_phone && order.delivery_phone !== order.customer_phone && ` / ${order.delivery_phone}`}
                            </div>
                            {order.delivery_address && (
                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-2">
                                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />{order.delivery_address}
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground mb-1">
                                {order.items_count} ítem{order.items_count !== 1 ? 's' : ''} · {order.created_at}
                            </div>

                            {/* Repartidor asignado */}
                            {order.delivery_user && (
                                <div className="text-xs text-accent font-medium mb-1">
                                    Repartidor: {order.delivery_user}
                                </div>
                            )}

                            {/* Asignar repartidor (admin/gerente) */}
                            {isAdmin && (
                                <AsignarForm order={order} repartidores={repartidores} />
                            )}

                            {/* Tomar pedido (personal de domicilio) */}
                            {isRepartidor && !order.delivery_user_id && (
                                <button
                                    onClick={() => tomar(order.id)}
                                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                                >
                                    <PackageCheck className="h-3.5 w-3.5" /> Tomar pedido
                                </button>
                            )}

                            {/* Marcar entregado */}
                            <button
                                onClick={() => router.post(`/domicilio/${order.id}/entregar`)}
                                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Marcar entregado
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Entregados hoy */}
            {delivered.length > 0 && (
                <>
                    <h2 className="font-display text-base font-bold mb-3 text-muted-foreground">
                        Entregados hoy <span className="ml-2 text-sm font-normal">({delivered.length})</span>
                    </h2>
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium">#</th>
                                    <th className="text-left px-6 py-3 font-medium">Cliente</th>
                                    <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Dirección</th>
                                    <th className="text-left px-6 py-3 font-medium">Repartidor</th>
                                    <th className="text-right px-6 py-3 font-medium">Total</th>
                                    <th className="text-right px-6 py-3 font-medium">Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {delivered.map(o => (
                                    <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-3 font-semibold">#{o.id}</td>
                                        <td className="px-6 py-3">
                                            <div>{o.customer_name}</div>
                                            <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                                        </td>
                                        <td className="px-6 py-3 hidden md:table-cell text-muted-foreground text-xs">{o.delivery_address ?? '—'}</td>
                                        <td className="px-6 py-3 text-sm">{o.delivery_user ?? <span className="text-muted-foreground">—</span>}</td>
                                        <td className="px-6 py-3 text-right font-semibold">{fmt(o.total)}</td>
                                        <td className="px-6 py-3 text-right text-muted-foreground">{o.delivered_at ?? o.created_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </AppShell>
    );
}
