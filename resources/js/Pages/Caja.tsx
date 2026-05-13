import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    ShoppingBag, CheckCircle2, XCircle,
    ChevronDown, ChevronUp, DollarSign,
    Clock, CreditCard, AlertCircle, History,
} from 'lucide-react';

interface OrderItem {
    dish: string | null;
    quantity: number;
    unit_price: number;
}

interface ActiveOrder {
    id: number;
    customer_name: string;
    customer_phone: string;
    tipo: string;
    mesa: number | null;
    delivery_address: string | null;
    status: string;
    total: number;
    amount_paid: number;
    payment_method: string | null;
    items: OrderItem[];
    created_at: string;
}

interface Props {
    orders: ActiveOrder[];
    historial: ActiveOrder[];
    flash?: { success?: string; error?: string };
}

const PAYMENT_METHODS = [
    { value: 'efectivo',      label: 'Efectivo' },
    { value: 'tarjeta',       label: 'Tarjeta' },
    { value: 'nequi',         label: 'Nequi' },
    { value: 'daviplata',     label: 'Daviplata' },
    { value: 'pse',           label: 'PSE' },
    { value: 'transferencia', label: 'Transferencia' },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    efectivo: 'Efectivo', tarjeta: 'Tarjeta', nequi: 'Nequi',
    daviplata: 'Daviplata', pse: 'PSE', transferencia: 'Transferencia',
};

const STATUS_LABEL: Record<string, string> = {
    pending:    'Pendiente',
    at_cash:    'En caja',
    in_kitchen: 'En cocina',
    cooking:    'Cocinando',
    ready:      'Listo',
};

const STATUS_CLASS: Record<string, string> = {
    pending:    'bg-muted text-muted-foreground',
    at_cash:    'bg-primary/15 text-primary',
    in_kitchen: 'bg-blue-500/15 text-blue-400',
    cooking:    'bg-yellow-500/15 text-yellow-400',
    ready:      'bg-accent/15 text-accent',
};

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n);
}

type PayStatus = 'unpaid' | 'partial' | 'paid';

function payStatus(order: ActiveOrder): PayStatus {
    if (order.amount_paid <= 0) return 'unpaid';
    if (order.amount_paid < order.total) return 'partial';
    return 'paid';
}

const PAY_STATUS_LABEL: Record<PayStatus, string> = {
    unpaid:  'Sin pagar',
    partial: 'Pago parcial',
    paid:    'Pagado',
};

const PAY_STATUS_CLASS: Record<PayStatus, string> = {
    unpaid:  'bg-muted text-muted-foreground',
    partial: 'bg-yellow-500/15 text-yellow-400',
    paid:    'bg-accent/15 text-accent',
};

export default function Caja({ orders, historial, flash }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [payingId, setPayingId] = useState<number | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState('efectivo');

    const totalAmount    = orders.reduce((s, o) => s + o.total, 0);
    const totalCobrado   = orders.reduce((s, o) => s + o.amount_paid, 0);
    const totalFalta     = totalAmount - totalCobrado;
    const totalCerrado   = historial.reduce((s, o) => s + o.amount_paid, 0);

    function cancelar(id: number) {
        if (!confirm('¿Cancelar este pedido?')) return;
        router.post(`/pedidos/${id}/cancelar`);
    }

    function openPayForm(order: ActiveOrder) {
        const remaining = Math.max(0, order.total - order.amount_paid);
        setPayAmount(String(remaining));
        setPayMethod(order.payment_method ?? 'efectivo');
        setPayingId(order.id);
        setExpanded(null);
    }

    function submitPago(id: number) {
        router.post(`/caja/${id}/pagar`, {
            amount_paid:    parseFloat(payAmount) || 0,
            payment_method: payMethod,
        }, { onSuccess: () => setPayingId(null) });
    }

    const canCancel = (s: string) => ['pending', 'at_cash'].includes(s);

    return (
        <AppShell title="Caja" subtitle="Control de cuentas y cobros">
            <Head title="Caja" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">
                    {flash.success}
                </div>
            )}

            {/* Resumen financiero */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {([
                    { label: 'Pedidos activos', value: String(orders.length),    Icon: ShoppingBag,  sub: 'en curso',           hi: false },
                    { label: 'Por cobrar',      value: fmt(totalFalta),          Icon: AlertCircle,  sub: 'pendiente en sala',  hi: totalFalta > 0 },
                    { label: 'Cobrado (sala)',   value: fmt(totalCobrado),        Icon: CheckCircle2, sub: 'pagado en curso',    hi: false },
                    { label: 'Recaudado hoy',   value: fmt(totalCerrado),        Icon: DollarSign,   sub: `${historial.length} cuenta${historial.length !== 1 ? 's' : ''} cerrada${historial.length !== 1 ? 's' : ''}`, hi: false },
                ] as const).map(({ label, value, Icon, sub, hi }) => (
                    <div key={label} className={`rounded-2xl border p-4 ${hi ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <Icon className={`h-4 w-4 ${hi ? 'text-red-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div className={`font-display text-xl font-bold ${hi ? 'text-red-400' : ''}`}>{value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                    </div>
                ))}
            </div>

            {orders.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin pedidos activos</p>
                    <p className="text-sm text-muted-foreground mt-1">Todos los pedidos han sido procesados.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => {
                        const ps        = payStatus(order);
                        const remaining = Math.max(0, order.total - order.amount_paid);
                        const isPaying  = payingId === order.id;
                        const isExpanded = expanded === order.id;

                        return (
                            <div key={order.id} className="rounded-2xl border border-border bg-card overflow-hidden">

                                {/* ── Cabecera ── */}
                                <div className="flex items-start gap-4 px-6 py-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-display text-lg font-bold">#{order.id}</span>

                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                                                {STATUS_LABEL[order.status] ?? order.status}
                                            </span>

                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_STATUS_CLASS[ps]}`}>
                                                {PAY_STATUS_LABEL[ps]}
                                            </span>

                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.tipo === 'mesa' ? 'bg-accent/15 text-accent' : 'bg-yellow-500/15 text-yellow-400'}`}>
                                                {order.tipo === 'mesa' ? `Mesa ${order.mesa ?? '—'}` : 'Domicilio'}
                                            </span>

                                            {order.payment_method && (
                                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground inline-flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" />
                                                    {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3 shrink-0" />
                                            {order.customer_name} · {order.customer_phone} · {order.created_at}
                                        </div>

                                        {order.delivery_address && (
                                            <div className="text-xs text-muted-foreground mt-0.5">{order.delivery_address}</div>
                                        )}
                                    </div>

                                    {/* Resumen financiero del pedido */}
                                    <div className="text-right shrink-0 space-y-0.5">
                                        <div className="font-display text-xl font-bold">{fmt(order.total)}</div>
                                        {ps !== 'unpaid' && (
                                            <div className="text-xs text-accent">Pagado: {fmt(order.amount_paid)}</div>
                                        )}
                                        {remaining > 0 && (
                                            <div className="text-xs text-red-400 font-semibold">Falta: {fmt(remaining)}</div>
                                        )}
                                    </div>
                                </div>

                                {/* ── Detalle expandible ── */}
                                <div className="border-t border-border">
                                    <button
                                        onClick={() => setExpanded(isExpanded ? null : order.id)}
                                        className="w-full flex items-center justify-between px-6 py-2.5 text-xs text-muted-foreground hover:bg-muted/20 transition-colors"
                                    >
                                        <span>Ver detalle · {order.items.length} ítem{order.items.length !== 1 ? 's' : ''}</span>
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="px-6 pb-4 space-y-1">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                                                    <span>{item.quantity}× {item.dish ?? '—'}</span>
                                                    <span className="text-muted-foreground">{fmt(item.unit_price * item.quantity)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-sm font-semibold pt-2">
                                                <span>Total</span>
                                                <span>{fmt(order.total)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Formulario de pago inline ── */}
                                {isPaying && (
                                    <div className="border-t border-border px-6 py-4 bg-muted/10 space-y-3">
                                        <p className="text-sm font-semibold">Registrar pago</p>
                                        <div className="flex gap-3 flex-wrap">
                                            <div className="flex-1 min-w-35">
                                                <label className="text-xs text-muted-foreground mb-1 block">Monto recibido</label>
                                                <input
                                                    type="number"
                                                    value={payAmount}
                                                    onChange={e => setPayAmount(e.target.value)}
                                                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                    min="0"
                                                    step="100"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="flex-1 min-w-35">
                                                <label className="text-xs text-muted-foreground mb-1 block">Método de pago</label>
                                                <select
                                                    value={payMethod}
                                                    onChange={e => setPayMethod(e.target.value)}
                                                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                >
                                                    {PAYMENT_METHODS.map(m => (
                                                        <option key={m.value} value={m.value}>{m.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => submitPago(order.id)}
                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                                            >
                                                <CheckCircle2 className="h-4 w-4" /> Confirmar pago
                                            </button>
                                            <button
                                                onClick={() => setPayingId(null)}
                                                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/20 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── Acciones ── */}
                                <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/20 flex-wrap">
                                    {ps !== 'paid' && !isPaying && (
                                        <button
                                            onClick={() => openPayForm(order)}
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            <DollarSign className="h-4 w-4" /> Registrar Pago
                                        </button>
                                    )}

                                    {canCancel(order.status) && (
                                        <button
                                            onClick={() => cancelar(order.id)}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
                                        >
                                            <XCircle className="h-4 w-4" /> Cancelar
                                        </button>
                                    )}

                                    {ps === 'paid' && (
                                        <div className="flex-1 flex items-center justify-center gap-2 text-sm text-accent font-medium">
                                            <CheckCircle2 className="h-4 w-4" /> Cuenta saldada
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Cobros de hoy ── */}
            {historial.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <h2 className="font-display text-base font-bold">Cobros de hoy</h2>
                        <span className="text-sm text-muted-foreground">({historial.length} cuenta{historial.length !== 1 ? 's' : ''} cerrada{historial.length !== 1 ? 's' : ''})</span>
                    </div>

                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                                <tr>
                                    <th className="text-left px-5 py-3 font-medium">#</th>
                                    <th className="text-left px-5 py-3 font-medium">Cliente</th>
                                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Tipo</th>
                                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Estado</th>
                                    <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Método</th>
                                    <th className="text-right px-5 py-3 font-medium">Total</th>
                                    <th className="text-right px-5 py-3 font-medium">Cobrado</th>
                                    <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {historial.map(o => {
                                    const ps = payStatus(o);
                                    return (
                                        <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-5 py-3 font-semibold">#{o.id}</td>
                                            <td className="px-5 py-3">
                                                <div className="font-medium">{o.customer_name}</div>
                                                <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                                            </td>
                                            <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                                                {o.tipo === 'mesa' ? `Mesa ${o.mesa ?? '—'}` : 'Domicilio'}
                                            </td>
                                            <td className="px-5 py-3 hidden md:table-cell">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[o.status] ?? 'bg-muted text-muted-foreground'}`}>
                                                    {STATUS_LABEL[o.status] ?? o.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground">
                                                {o.payment_method
                                                    ? <span className="inline-flex items-center gap-1"><CreditCard className="h-3 w-3" />{PAYMENT_METHOD_LABELS[o.payment_method] ?? o.payment_method}</span>
                                                    : '—'}
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold">{fmt(o.total)}</td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_STATUS_CLASS[ps]}`}>
                                                    {fmt(o.amount_paid)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right text-muted-foreground hidden md:table-cell">{o.created_at}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="border-t border-border bg-muted/20">
                                <tr>
                                    <td colSpan={5} className="px-5 py-3 text-sm font-semibold hidden md:table-cell">Total recaudado hoy</td>
                                    <td colSpan={5} className="px-5 py-3 text-sm font-semibold md:hidden">Total recaudado</td>
                                    <td className="px-5 py-3 text-right font-bold text-accent">{fmt(totalCerrado)}</td>
                                    <td colSpan={2} className="hidden md:table-cell" />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
