import AppShell from '@/Layouts/AppShell';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Bike, CheckCircle2, Phone, PackageCheck, Bell } from 'lucide-react';
import type { PageProps } from '@/types';

interface DeliveryOrder {
    id: number;
    customer_name: string;
    customer_phone: string;
    delivery_address: string | null;
    delivery_phone: string | null;
    status: string;
    total: number;
    delivery_fee: number;
    delivery_user: string | null;
    delivery_user_id: number | null;
    items_count: number;
    notas: string | null;
    created_at: string;
    delivered_at: string | null;
}

interface DeliveryZone {
    label:  string;
    min_km: number;
    max_km: number;
    price:  number;
}

interface Repartidor {
    id: number;
    name: string;
}

interface Props {
    active:         DeliveryOrder[];
    repartidores:   Repartidor[];
    delivery_zones: DeliveryZone[];
    flash?: { success?: string; error?: string };
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function AsignarForm({ order, repartidores }: { order: DeliveryOrder; repartidores: Repartidor[] }) {
    const form = useForm({ delivery_user_id: String(order.delivery_user_id ?? '') });

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

export default function Domicilio({ active, repartidores, delivery_zones, flash }: Props) {
    const { auth } = usePage<PageProps>().props;

    const isAdmin      = auth.user.roles.includes('administrador') || auth.user.roles.includes('gerente');
    const isRepartidor = auth.user.roles.includes('domicilio');

    useEffect(() => {
        const id = setInterval(() => router.reload({ only: ['active', 'repartidores'] }), 20_000);
        return () => clearInterval(id);
    }, []);

    const pending   = active.filter(o => o.status === 'ready');
    const delivered = active.filter(o => o.status === 'delivered');

    // ── Alerta de pedidos sin repartidor ──────────────────────────────────────
    const sinRepartidor  = pending.filter(o => !o.delivery_user).length;
    const prevCountRef   = useRef<number | null>(null);
    const [newFlash, setNewFlash] = useState(false);

    useEffect(() => {
        if (prevCountRef.current !== null && sinRepartidor > prevCountRef.current) {
            setNewFlash(true);
            const t = setTimeout(() => setNewFlash(false), 4000);
            prevCountRef.current = sinRepartidor;
            return () => clearTimeout(t);
        }
        prevCountRef.current = sinRepartidor;
    }, [sinRepartidor]);

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

            {/* ── Alerta: pedidos listos sin repartidor ── */}
            {sinRepartidor > 0 && (
                <div className={`mb-5 rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors duration-700 ${
                    newFlash
                        ? 'bg-red-500/20 border-red-500/50'
                        : 'bg-amber-500/15 border-amber-500/30'
                }`}>
                    <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                    </span>
                    <Bell className={`h-4 w-4 shrink-0 ${newFlash ? 'text-red-400' : 'text-amber-400'}`} />
                    <p className={`text-sm font-semibold ${newFlash ? 'text-red-300' : 'text-amber-300'}`}>
                        {sinRepartidor === 1
                            ? '1 pedido de domicilio listo — esperando repartidor'
                            : `${sinRepartidor} pedidos de domicilio listos — esperando repartidor`}
                    </p>
                </div>
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
                        <div key={order.id} className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Color band side */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${order.delivery_user ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'}`} />
                            
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-display text-lg font-bold">#{order.id}</span>
                                    {order.delivery_user ? (
                                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/50 text-xs font-bold animate-pulse">
                                            En transporte
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/50 text-xs font-bold">
                                            En espera
                                        </span>
                                    )}
                                </div>
                                <span className="font-semibold text-sm">{fmt(order.total)}</span>
                            </div>

                            <div className="text-sm font-medium mb-1">{order.customer_name}</div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                <Phone className="h-3 w-3" />{order.customer_phone}
                                {order.delivery_phone && order.delivery_phone !== order.customer_phone && ` / ${order.delivery_phone}`}
                            </div>
                            {order.delivery_address && (
                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-3">
                                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />{order.delivery_address}
                                </div>
                            )}

                            {/* Repartidor asignado */}
                            {order.delivery_user ? (
                                <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-xs font-bold text-blue-300">
                                    <Bike className="h-4 w-4" /> Repartidor: {order.delivery_user}
                                </div>
                            ) : (
                                <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-300">
                                    <Bike className="h-4 w-4" /> Sin repartidor asignado
                                </div>
                            )}

                            <div className="text-xs text-muted-foreground mb-3 border-t border-border/50 pt-2">
                                {order.items_count} ítem{order.items_count !== 1 ? 's' : ''} · {order.created_at}
                            </div>

                            {/* Bloqueo: tarifa no asignada */}
                            {delivery_zones.length > 0 && order.delivery_fee === 0 && (
                                <div className="mb-2 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-400 font-medium">
                                    <span className="shrink-0 mt-0.5">⚠</span>
                                    <span>Sin tarifa de domicilio. Asígnala en <strong>Caja → Pedido → Tarifa de domicilio</strong> para poder despachar.</span>
                                </div>
                            )}

                            {/* Acciones */}
                            {(() => {
                                const bloqueado = delivery_zones.length > 0 && order.delivery_fee === 0;
                                return (
                                    <div className="space-y-2">
                                        {/* Asignar repartidor (admin/gerente) */}
                                        {isAdmin && !order.delivery_user && (
                                            <AsignarForm order={order} repartidores={repartidores} />
                                        )}

                                        {/* Tomar pedido (personal de domicilio) */}
                                        {isRepartidor && !order.delivery_user_id && (
                                            <button
                                                onClick={() => !bloqueado && tomar(order.id)}
                                                disabled={bloqueado}
                                                className={`w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                                                    bloqueado
                                                        ? 'border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50'
                                                        : 'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                                }`}
                                            >
                                                <PackageCheck className="h-4 w-4" /> Tomar pedido
                                            </button>
                                        )}

                                        {/* Marcar entregado (solo si tiene repartidor) */}
                                        {order.delivery_user && (
                                            <button
                                                onClick={() => !bloqueado && router.post(`/domicilio/${order.id}/entregar`)}
                                                disabled={bloqueado}
                                                className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                                    bloqueado
                                                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                                        : 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                                                }`}
                                            >
                                                <CheckCircle2 className="h-4 w-4" /> Notificar Entregado
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
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
                                    <th className="text-left px-6 py-3 font-medium">Estado</th>
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
                                            <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 border border-green-500/50 text-xs font-bold">
                                                Entregado
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium">{o.customer_name}</div>
                                            <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                                        </td>
                                        <td className="px-6 py-3 hidden md:table-cell text-muted-foreground text-xs">{o.delivery_address ?? '—'}</td>
                                        <td className="px-6 py-3 text-sm font-semibold text-blue-300">{o.delivery_user ?? <span className="text-muted-foreground font-normal">—</span>}</td>
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
