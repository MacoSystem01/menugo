import AppShell from '@/Layouts/AppShell';
import { PageProps } from '@/types';
import { tipoBadgeCls, tipoDetalle } from '@/utils/order-tipo';
import { useBusinessType } from '@/hooks/use-business-type';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    ShoppingBag, CheckCircle2, XCircle,
    ChevronDown, ChevronUp, DollarSign,
    Clock, CreditCard, AlertCircle, History,
    Unlock, Power, AlertTriangle, Info, BadgeDollarSign, Ban,
} from 'lucide-react';

interface OrderItem {
    dish: string | null;
    quantity: number;
    unit_price: number;
    notes: string | null;
    is_addition: boolean;
}

interface DeliveryZone {
    label:  string;
    min_km: number;
    max_km: number;
    price:  number;
}

interface ActiveOrder {
    id: number;
    customer_name: string;
    customer_phone: string;
    tipo: string;
    table_id: number | null;
    mesa: number | null;
    turn_number: number | null;
    delivery_address: string | null;
    delivery_phone: string | null;
    status: string;
    total: number;
    delivery_fee: number;
    amount_paid: number;
    payment_method: string | null;
    payment_reported_at: string | null;
    notes: string | null;
    items: OrderItem[];
    created_at: string;
    delivered_at: string | null;
}

interface PaymentDetail {
    titular?:    string;
    numero?:     string;
    link?:       string;
    banco?:      string;
    tipo_cuenta?: string;
    nota?:       string;
}

interface Props {
    orders:         ActiveOrder[];
    historial:      ActiveOrder[];
    paymentMethods: string[];
    paymentDetails: Record<string, PaymentDetail>;
    delivery_zones: DeliveryZone[];
    needs_eod:      boolean;
    closing_time:   string | null;
    order_flow:     'pago_primero' | 'cocina_primero';
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

const PAYMENT_METHOD_COLORS: Record<string, string> = {
    efectivo:      'bg-green-500/15  text-green-400  border-green-500/30',
    tarjeta:       'bg-blue-500/15   text-blue-400   border-blue-500/30',
    nequi:         'bg-purple-500/15 text-purple-400 border-purple-500/30',
    daviplata:     'bg-red-500/15    text-red-400    border-red-500/30',
    pse:           'bg-cyan-500/15   text-cyan-400   border-cyan-500/30',
    transferencia: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
};

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
    pending:    'bg-muted          text-muted-foreground border-border/60',
    at_cash:    'bg-primary/15     text-primary          border-primary/30',
    in_kitchen: 'bg-blue-500/15    text-blue-400         border-blue-500/30',
    cooking:    'bg-yellow-500/15  text-yellow-400       border-yellow-500/30',
    ready:      'bg-accent/15      text-accent           border-accent/30',
    delivered:  'bg-green-500/15   text-green-400        border-green-500/30',
    cancelled:  'bg-red-500/15     text-red-400          border-red-500/30',
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
    unpaid:  'bg-muted         text-muted-foreground border-border/60',
    partial: 'bg-yellow-500/15 text-yellow-400       border-yellow-500/30',
    paid:    'bg-accent/15     text-accent            border-accent/30',
};

export default function Caja({ orders, historial, paymentMethods, paymentDetails, delivery_zones, needs_eod, closing_time, order_flow, flash }: Props) {
    const { props } = usePage<PageProps>();
    const userRole  = (props as any).auth?.user?.role ?? '';
    const { isPuesto } = useBusinessType();

    const tipLabel    = isPuesto ? 'Propina'        : 'Servicio';
    const tipOnLabel  = isPuesto ? 'Con Propina'    : 'Incluir Servicio';
    const tipOffLabel = isPuesto ? 'Sin Propina'    : 'Sin Servicio';

    const [eodConfirm,  setEodConfirm]  = useState(false);
    const [eodLoading,  setEodLoading]  = useState(false);

    useEffect(() => {
        const id = setInterval(() => router.reload({ only: ['orders', 'historial', 'needs_eod', 'closing_time', 'order_flow'] }), 20_000);
        return () => clearInterval(id);
    }, []);

    function ejecutarCierreJornada() {
        setEodLoading(true);
        router.post('/configuracion/cierre-jornada', {}, {
            onSuccess: () => { setEodConfirm(false); router.reload(); },
            onFinish:  () => setEodLoading(false),
        });
    }

    const [expanded, setExpanded]           = useState<number | null>(null);
    const [cancelOrder, setCancelOrder]     = useState<ActiveOrder | null>(null);
    // Modal "Otro Método de Pago"
    const [altOrder, setAltOrder]           = useState<ActiveOrder | null>(null);
    const [altMethod, setAltMethod]         = useState<string | null>(null);
    const [altWithTip, setAltWithTip]       = useState(false);
    // Orden mesa cuyo pago acaba de completarse → preguntar si liberar la mesa
    const [liberarOrder, setLiberarOrder]   = useState<ActiveOrder | null>(null);

    // Solo los entregados cuentan como recaudado; cancelados no generaron ingreso
    const deliveredHistorial = historial.filter(o => o.status === 'delivered');
    const cancelledHistorial = historial.filter(o => o.status === 'cancelled');

    // Pendiente real por cobrar: suma de lo que falta en pedidos activos
    const totalFalta = orders.reduce((s, o) => s + Math.max(0, o.total - o.amount_paid), 0);

    // Pagos Realizados: TODOS los pagos de pedidos activos + historial entregado (incluye propinas)
    const totalPagosRealizados =
        orders.reduce((s, o) => s + Math.min(o.amount_paid, o.total), 0) +
        deliveredHistorial.reduce((s, o) => s + o.amount_paid, 0);

    // Pago Efectivo: cobros en efectivo de todos los pedidos no cancelados (incluye propinas en entregados)
    const totalEfectivo =
        orders.filter(o => o.payment_method === 'efectivo')
            .reduce((s, o) => s + Math.min(o.amount_paid, o.total), 0) +
        deliveredHistorial.filter(o => o.payment_method === 'efectivo')
            .reduce((s, o) => s + o.amount_paid, 0);

    function confirmarAltPago() {
        if (!altOrder || !altMethod) return;
        const remaining  = Math.max(0, altOrder.total - altOrder.amount_paid);
        const tipAmt     = altWithTip ? Math.round(altOrder.total * 0.1) : 0;
        const amountSend = remaining + tipAmt;
        router.post(`/caja/${altOrder.id}/pagar`, {
            amount_paid:    amountSend,
            payment_method: altMethod,
        }, {
            onSuccess: () => {
                setAltOrder(null);
                setAltMethod(null);
                setAltWithTip(false);
                if (altOrder.tipo === 'mesa' && altOrder.table_id) {
                    setLiberarOrder(altOrder);
                }
            },
        });
    }

    // Solo se puede cancelar desde caja si la cocina aún no tomó el pedido
    const canCancelFromCaja = (s: string) => ['pending', 'at_cash'].includes(s);

    function confirmarCancelacion() {
        if (!cancelOrder) return;
        router.post(`/pedidos/${cancelOrder.id}/cancelar`, {}, {
            onFinish: () => setCancelOrder(null),
        });
    }

    function pagarDirecto(order: ActiveOrder, withTip: boolean) {
        const pendiente = Math.max(0, order.total - order.amount_paid);
        const tipAmt    = withTip ? Math.round(order.total * 0.1) : 0;
        router.post(`/caja/${order.id}/pagar`, {
            amount_paid:    pendiente + tipAmt,
            payment_method: order.payment_method ?? 'efectivo',
        }, {
            onSuccess: () => {
                if (order.tipo === 'mesa' && order.table_id) {
                    setLiberarOrder(order);
                }
            },
        });
    }

    function confirmarLiberarMesa(liberar: boolean) {
        if (liberar && liberarOrder?.table_id) {
            router.post(`/tables/${liberarOrder.table_id}/liberar`, {}, {
                onFinish: () => setLiberarOrder(null),
            });
        } else {
            setLiberarOrder(null);
        }
    }

    const canCancel = canCancelFromCaja;

    return (
        <AppShell title="Caja" subtitle="Control de cuentas y cobros">
            <Head title="Caja" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">
                    {flash.success}
                </div>
            )}

            {/* Aviso informativo */}
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-300/80 leading-relaxed">
                    {order_flow === 'cocina_primero' ? (
                        <>
                            <span className="font-semibold text-blue-300">Flujo: Cocina → Pago.</span>{' '}
                            Los pedidos van primero a cocina para preparación. El cobro se registra aquí cuando el pedido está <span className="font-medium text-blue-300">Listo</span> para entregar.
                        </>
                    ) : (
                        <>
                            <span className="font-semibold text-blue-300">Flujo: Pago → Cocina.</span>{' '}
                            El cobro se registra primero y el pedido pasa automáticamente a cocina. Todo pedido activo debe ser cancelado antes del cierre de jornada.
                        </>
                    )}
                </p>
            </div>

            {/* Banner cierre de jornada */}
            {needs_eod && (
                <div className="mb-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-start gap-3 flex-1">
                            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-300">
                                    Hora de cierre alcanzada{closing_time ? ` (${closing_time})` : ''}
                                </p>
                                <p className="text-xs text-red-300/70 mt-0.5">
                                    El horario de trabajo indica que el restaurante debería estar cerrado. Ejecuta el cierre de jornada para archivar los pedidos y liberar mesas.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {!eodConfirm ? (
                                <button
                                    onClick={() => setEodConfirm(true)}
                                    className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                                >
                                    <Power className="h-4 w-4" />
                                    Cerrar jornada
                                </button>
                            ) : (
                                <>
                                    <span className="text-xs text-red-300">¿Confirmar?</span>
                                    <button
                                        onClick={ejecutarCierreJornada}
                                        disabled={eodLoading}
                                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                        {eodLoading ? 'Cerrando...' : 'Sí, cerrar'}
                                    </button>
                                    <button
                                        onClick={() => setEodConfirm(false)}
                                        className="rounded-xl border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Resumen financiero */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {([
                    { label: 'Pedidos Registrados', value: String(orders.length + historial.length), Icon: ShoppingBag,  sub: 'Mesa + Domicilio',                                                                                                            hi: false },
                    { label: 'Cuentas Por Pagar', value: fmt(totalFalta),                         Icon: AlertCircle,  sub: 'Cuentas Pendientes por Pagar',                                                                                                hi: totalFalta > 0 },
                    { label: 'Pagos Realizados', value: fmt(totalPagosRealizados),                Icon: CheckCircle2, sub: 'Total Pagos Realizados',                                                                                                      hi: false },
                    { label: 'Pago Efectivo',    value: fmt(totalEfectivo),                       Icon: DollarSign,   sub: 'Pagos en Efectivo',                                                                                                            hi: false },
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
                        const ps           = payStatus(order);
                        const isExpanded   = expanded === order.id;
                        const isReadyToPay = order_flow === 'cocina_primero' && order.status === 'ready' && ps !== 'paid';
                        const remaining    = Math.max(0, order.total - order.amount_paid);

                        return (
                            <div key={order.id} className={`rounded-2xl border bg-card overflow-hidden transition-colors ${isReadyToPay ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border'}`}>

                                {/* ── Cabecera ── */}
                                <div className="flex items-start gap-4 px-6 py-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-display text-xl font-bold">#{order.id}</span>

                                            {/* Estado del pedido */}
                                            <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${STATUS_CLASS[order.status] ?? 'bg-muted text-muted-foreground border-border/60'}`}>
                                                {STATUS_LABEL[order.status] ?? order.status}
                                            </span>

                                            {/* Estado de pago */}
                                            <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${PAY_STATUS_CLASS[ps]}`}>
                                                {PAY_STATUS_LABEL[ps]}
                                            </span>

                                            {/* Mesa / Domicilio */}
                                            <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${tipoBadgeCls(order.tipo)}`}>
                                                {tipoDetalle(order.tipo, order.mesa)}
                                            </span>

                                            {/* Método de pago */}
                                            {order.payment_method && (
                                                <span className={`text-sm px-3 py-1 rounded-full font-semibold border inline-flex items-center gap-1.5 ${PAYMENT_METHOD_COLORS[order.payment_method] ?? 'bg-muted text-muted-foreground border-border'}`}>
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                    {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
                                                </span>
                                            )}

                                            {/* Cliente reportó pago desde su seguimiento */}
                                            {order.payment_reported_at && ps !== 'paid' && (
                                                <span
                                                    className="text-sm px-3 py-1 rounded-full font-semibold border bg-amber-500/15 text-amber-400 border-amber-500/40 inline-flex items-center gap-1.5"
                                                    title={`Reportado: ${order.payment_reported_at}`}
                                                >
                                                    🔔 Cliente reportó pago
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3 shrink-0" />
                                            {order.customer_name} · {order.customer_phone} · {order.created_at}
                                        </div>

                                        {['gerente', 'administrador'].includes(userRole) && order.delivery_address && (
                                            <div className="text-xs text-yellow-400 mt-0.5 flex items-center gap-1">
                                                <span>📍</span>
                                                <span>{order.delivery_address}</span>
                                            </div>
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
                                                <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-border/50 last:border-0">
                                                    <span className="flex items-center gap-1.5">
                                                        {item.quantity}× {item.dish ?? '—'}
                                                        {item.is_addition && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold leading-none">
                                                                Adición
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-muted-foreground">{fmt(item.unit_price * item.quantity)}</span>
                                                </div>
                                            ))}

                                            {/* Tarifa de domicilio */}
                                            {order.tipo === 'domicilio' && delivery_zones.length > 0 &&
                                             ['gerente', 'administrador', 'caja'].includes(userRole) && (
                                                <div className="pt-3 border-t border-border space-y-2">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        Tarifa de domicilio
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {delivery_zones.map((zone, zi) => {
                                                            const isActive = order.delivery_fee === zone.price;
                                                            return (
                                                                <button
                                                                    key={zi}
                                                                    type="button"
                                                                    onClick={() => router.post(`/caja/${order.id}/tarifa-domicilio`, { delivery_fee: zone.price })}
                                                                    className={`flex flex-col items-start px-3 py-2 rounded-xl border text-xs transition-colors ${
                                                                        isActive
                                                                            ? 'border-primary bg-primary/10 text-primary'
                                                                            : 'border-border hover:border-primary/50 hover:bg-muted text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    <span className="font-semibold">{zone.min_km}–{zone.max_km} km</span>
                                                                    <span className={isActive ? 'text-primary font-bold' : 'text-foreground font-bold'}>
                                                                        {zone.price === 0 ? 'Gratis' : fmt(zone.price)}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    {order.delivery_fee > 0 && (
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Domicilio: {fmt(order.delivery_fee)} · Total con domicilio: {fmt(order.total)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                                                <span>Total</span>
                                                <span>{fmt(order.total)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Acciones ── */}
                                <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/20 flex-wrap">
                                    {ps !== 'paid' && (() => {
                                        // pago_primero: siempre se puede cobrar
                                        // cocina_primero: solo cuando está ready o entregado sin cobrar
                                        const canPay    = order_flow === 'pago_primero'
                                            || order.status === 'ready'
                                            || order.status === 'delivered';
                                        const tipAmount = Math.round(order.total * 0.1);

                                        if (!canPay) {
                                            return (
                                                <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4 shrink-0" />
                                                    En preparación — el cobro se habilita cuando el pedido esté listo
                                                </div>
                                            );
                                        }

                                        return (
                                            <>
                                                {/* Con propina / Incluir servicio — pago directo */}
                                                <button
                                                    onClick={() => pagarDirecto(order, true)}
                                                    className="flex-1 inline-flex flex-col items-center justify-center gap-0.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400/60 transition-colors"
                                                >
                                                    <BadgeDollarSign className="h-5 w-5 shrink-0" />
                                                    <span>{tipOnLabel}</span>
                                                    <span className="text-xs font-normal opacity-70">+{fmt(tipAmount)}</span>
                                                </button>
                                                {/* Sin propina / Sin servicio — pago directo */}
                                                <button
                                                    onClick={() => pagarDirecto(order, false)}
                                                    className="flex-1 inline-flex flex-col items-center justify-center gap-0.5 rounded-xl bg-muted/30 border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border/80 transition-colors"
                                                >
                                                    <Ban className="h-5 w-5 shrink-0 opacity-60" />
                                                    <span>{tipOffLabel}</span>
                                                    <span className="text-xs font-normal opacity-50">solo total</span>
                                                </button>
                                                <button
                                                    onClick={() => { setAltOrder(order); setAltMethod(null); setAltWithTip(false); }}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
                                                >
                                                    <CreditCard className="h-4 w-4" /> Otro Método
                                                </button>
                                            </>
                                        );
                                    })()}

                                    {canCancel(order.status) && (
                                        <button
                                            onClick={() => setCancelOrder(order)}
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

            {/* ── Pagos realizados hoy ── */}
            <div className="mt-8">
                {/* Encabezado de sección */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <h2 className="font-display text-base font-bold">Pagos realizados</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {deliveredHistorial.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                {deliveredHistorial.length} cobrado{deliveredHistorial.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        {cancelledHistorial.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                {cancelledHistorial.length} cancelado{cancelledHistorial.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {historial.length === 0 ? (
                        /* Estado vacío */
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                                <History className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-sm">Sin pagos registrados</p>
                            <p className="text-xs text-muted-foreground mt-1">Los cobros del día aparecerán aquí en tiempo real.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="text-left px-5 py-3 font-medium">Fecha</th>
                                        <th className="text-left px-5 py-3 font-medium">#</th>
                                        <th className="text-left px-5 py-3 font-medium">Cliente</th>
                                        <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Método</th>
                                        <th className="text-right px-5 py-3 font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {historial.map(o => {
                                        const isCancelled = o.status === 'cancelled';
                                        return (
                                            <tr key={o.id} className={`transition-colors ${isCancelled ? 'bg-red-500/3 hover:bg-red-500/6' : 'hover:bg-muted/20'}`}>
                                                {/* Fecha */}
                                                <td className="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">
                                                    {o.created_at}
                                                </td>
                                                {/* # Pedido */}
                                                <td className="px-5 py-3">
                                                    <span className={`font-bold ${isCancelled ? 'text-muted-foreground' : 'text-primary'}`}>
                                                        #{o.id}
                                                    </span>
                                                </td>
                                                {/* Cliente */}
                                                <td className="px-5 py-3">
                                                    <div className={`font-medium leading-tight ${isCancelled ? 'text-muted-foreground' : ''}`}>
                                                        {o.customer_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {tipoDetalle(o.tipo, o.mesa, o.turn_number)}
                                                    </div>
                                                </td>
                                                {/* Método / Estado */}
                                                <td className="px-5 py-3 hidden sm:table-cell">
                                                    {isCancelled ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">
                                                            Cancelado
                                                        </span>
                                                    ) : o.payment_method ? (
                                                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                            <CreditCard className="h-3 w-3" />
                                                            {PAYMENT_METHOD_LABELS[o.payment_method] ?? o.payment_method}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                {/* Total cobrado (incluye propina si aplica) */}
                                                <td className="px-5 py-3 text-right">
                                                    {isCancelled ? (
                                                        <span className="font-display font-bold text-muted-foreground/50 line-through">
                                                            {fmt(o.total)}
                                                        </span>
                                                    ) : (
                                                        <div>
                                                            <span className="font-display font-bold text-accent">
                                                                {fmt(o.amount_paid)}
                                                            </span>
                                                            {o.amount_paid > o.total && (
                                                                <div className="text-[10px] text-yellow-400 font-medium">
                                                                    {tipLabel} +{fmt(o.amount_paid - o.total)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="border-t-2 border-border bg-muted/20">
                                    <tr>
                                        <td colSpan={3} className="px-5 py-3 text-sm font-semibold hidden sm:table-cell">
                                            Total recaudado hoy
                                            {cancelledHistorial.length > 0 && (
                                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                    (cancelados no incluidos)
                                                </span>
                                            )}
                                        </td>
                                        <td colSpan={3} className="px-5 py-3 text-sm font-semibold sm:hidden">Total</td>
                                        <td className="px-5 py-3 text-right font-display font-bold text-accent text-base">{fmt(totalPagosRealizados)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal: Otro Método de Pago ── */}
            {altOrder && (() => {
                const altPending   = Math.max(0, altOrder.total - altOrder.amount_paid);
                const altTipAmount = Math.round(altOrder.total * 0.1);
                const altTarget    = altPending + (altWithTip ? altTipAmount : 0);

                return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

                        {/* Cabecera */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <div>
                                <h3 className="font-display font-bold text-base">Otro Método de Pago</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Pedido #{altOrder.id} · {altOrder.customer_name} ·{' '}
                                    <span className="font-semibold text-primary">{fmt(altTarget)}</span>
                                    {altWithTip && (
                                        <span className="text-yellow-400 ml-1">(incl. {tipLabel.toLowerCase()})</span>
                                    )}
                                </p>
                            </div>
                            <button onClick={() => { setAltOrder(null); setAltMethod(null); setAltWithTip(false); }} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground">
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4 space-y-4">

                            {/* Toggle propina / servicio */}
                            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium">{tipOnLabel}</p>
                                    <p className="text-xs text-muted-foreground">10% adicional · {fmt(altTipAmount)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAltWithTip(v => !v)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                                        altWithTip ? 'bg-primary' : 'bg-muted border border-border/60'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        altWithTip ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Paso 1: Seleccionar método */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Selecciona el método</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {paymentMethods.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setAltMethod(m)}
                                            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                                                altMethod === m
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                                            }`}
                                        >
                                            <CreditCard className="h-4 w-4 shrink-0" />
                                            {PAYMENT_METHOD_LABELS[m] ?? m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Paso 2: Instrucciones según método */}
                            {altMethod && (() => {
                                const detail  = paymentDetails[altMethod];
                                const pending = altTarget;

                                return (
                                    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-2.5">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Instrucciones · {PAYMENT_METHOD_LABELS[altMethod] ?? altMethod}
                                        </p>

                                        {/* Efectivo */}
                                        {altMethod === 'efectivo' && (
                                            <div className="space-y-1.5 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Cobrar al cliente</span>
                                                    <span className="font-bold text-primary">{fmt(pending)}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Recibe el efectivo y registra el pago.</p>
                                            </div>
                                        )}

                                        {/* Nequi / Daviplata */}
                                        {(altMethod === 'nequi' || altMethod === 'daviplata') && (
                                            <div className="space-y-1.5 text-sm">
                                                {detail?.titular && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Titular</span>
                                                        <span className="font-semibold">{detail.titular}</span>
                                                    </div>
                                                )}
                                                {detail?.numero && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Número</span>
                                                        <span className="font-mono font-bold tracking-wider">{detail.numero}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between border-t border-border/50 pt-2">
                                                    <span className="text-muted-foreground">Monto a transferir</span>
                                                    <span className="font-bold text-primary">{fmt(pending)}</span>
                                                </div>
                                                {detail?.link && (
                                                    <a href={detail.link} target="_blank" rel="noreferrer"
                                                        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                                                        Abrir {PAYMENT_METHOD_LABELS[altMethod]} para pagar →
                                                    </a>
                                                )}
                                                {!detail?.numero && !detail?.link && (
                                                    <p className="text-xs text-muted-foreground italic">Sin datos configurados. Ve a Configuración → Métodos de pago.</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Tarjeta */}
                                        {altMethod === 'tarjeta' && (
                                            <div className="space-y-1.5 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Monto a cobrar</span>
                                                    <span className="font-bold text-primary">{fmt(pending)}</span>
                                                </div>
                                                {detail?.nota
                                                    ? <p className="text-xs text-muted-foreground">{detail.nota}</p>
                                                    : <p className="text-xs text-muted-foreground">Procesa el cobro en el datáfono y confirma.</p>
                                                }
                                            </div>
                                        )}

                                        {/* Transferencia / PSE */}
                                        {(altMethod === 'transferencia' || altMethod === 'pse') && (
                                            <div className="space-y-1.5 text-sm">
                                                {detail?.banco && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Banco</span>
                                                        <span className="font-semibold">{detail.banco}</span>
                                                    </div>
                                                )}
                                                {detail?.titular && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Titular</span>
                                                        <span className="font-semibold">{detail.titular}</span>
                                                    </div>
                                                )}
                                                {detail?.numero && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">No. de cuenta</span>
                                                        <span className="font-mono font-bold">{detail.numero}</span>
                                                    </div>
                                                )}
                                                {detail?.tipo_cuenta && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Tipo</span>
                                                        <span className="capitalize">{detail.tipo_cuenta}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between border-t border-border/50 pt-2">
                                                    <span className="text-muted-foreground">Monto a transferir</span>
                                                    <span className="font-bold text-primary">{fmt(pending)}</span>
                                                </div>
                                                {!detail?.numero && (
                                                    <p className="text-xs text-muted-foreground italic">Sin datos configurados. Ve a Configuración → Métodos de pago.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-3 px-6 pb-5">
                            <button
                                onClick={confirmarAltPago}
                                disabled={!altMethod}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <CheckCircle2 className="h-4 w-4" /> Confirmar pago
                            </button>
                            <button
                                onClick={() => { setAltOrder(null); setAltMethod(null); setAltWithTip(false); }}
                                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/20 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* ── Modal: Confirmar cancelación desde Caja ── */}
            {cancelOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                                <XCircle className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base">¿Cancelar pedido #{cancelOrder.id}?</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {cancelOrder.customer_name} · {tipoDetalle(cancelOrder.tipo, cancelOrder.mesa)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-xs text-amber-400 space-y-1 leading-relaxed">
                            <p className="font-semibold">Solo disponible antes de que cocina tome el pedido.</p>
                            <p className="opacity-80">Si el pedido ya está en cocina, la cancelación con motivo debe realizarla el rol <strong>Mesa</strong>.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                onClick={confirmarCancelacion}
                                className="flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                            >
                                <XCircle className="h-4 w-4" /> Sí, cancelar
                            </button>
                            <button
                                onClick={() => setCancelOrder(null)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/20 transition-colors"
                            >
                                No, volver
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: ¿Liberar mesa? (aparece después de cobrar un pedido de mesa) ── */}
            {liberarOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                                <Unlock className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base">¿Cambiar estado de la mesa?</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Mesa #{liberarOrder.mesa} · Pedido #{liberarOrder.id}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            ¿El cliente pagó y se marchó? Si es así, la mesa quedará <span className="text-accent font-semibold">Disponible</span> para nuevos clientes.
                        </p>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                onClick={() => confirmarLiberarMesa(true)}
                                className="flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                            >
                                <CheckCircle2 className="h-4 w-4" /> Sí, liberar mesa
                            </button>
                            <button
                                onClick={() => confirmarLiberarMesa(false)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/20 transition-colors"
                            >
                                No, continúa en mesa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
