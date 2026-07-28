import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Check, Clock, ChefHat, Package, Bike, X, AlertTriangle, ChevronLeft } from 'lucide-react';
import PaymentDetailBlock from '@/components/carta/PaymentDetailBlock';

interface OrderItem {
    dish: string | null;
    quantity: number;
    unit_price: number;
}

interface PaymentDetail {
    titular?: string;
    numero?: string;
    banco?: string;
    tipo_cuenta?: string;
    link?: string;
    nota?: string;
}

interface OrderData {
    id: number;
    status: 'pending' | 'in_kitchen' | 'cooking' | 'ready' | 'delivered' | 'cancelled';
    type: 'mesa' | 'domicilio' | 'mostrador';
    turn_number: number | null;
    customer_name: string;
    total: number;
    amount_paid: number;
    payment_method: string | null;
    payment_reported_at: string | null;
    mesa: string | null;
    created_at: string;
    items: OrderItem[];
}

interface Settings {
    primary_color: string;
    bg_color: string;
    text_color: string;
    logo_url: string | null;
    payment_details: Record<string, PaymentDetail>;
}

interface Props {
    token: string;
    tenant_name: string;
    settings: Settings;
    order: OrderData;
}

const DIGITAL_METHODS = ['nequi', 'daviplata', 'pse', 'transferencia'];

const STEPS: { key: OrderData['status']; label: string; Icon: typeof Clock }[] = [
    { key: 'pending', label: 'Pedido recibido', Icon: Clock },
    { key: 'in_kitchen', label: 'En cocina', Icon: ChefHat },
    { key: 'cooking', label: 'Preparando', Icon: ChefHat },
    { key: 'ready', label: 'Listo', Icon: Package },
    { key: 'delivered', label: 'Entregado', Icon: Bike },
];

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

export default function OrderTracking({ token, tenant_name, settings, order }: Props) {
    const s = {
        primary: settings?.primary_color ?? '#e85d04',
        bg: settings?.bg_color ?? '#ffffff',
        text: settings?.text_color ?? '#1a1a1a',
    };

    const [reporting, setReporting] = useState(false);

    // Refresca el estado del pedido cada 10s, mientras siga activo.
    useEffect(() => {
        if (order.status === 'delivered' || order.status === 'cancelled') return;
        const id = setInterval(() => router.reload({ only: ['order'] }), 10_000);
        return () => clearInterval(id);
    }, [order.status]);

    // Al llegar a un estado final, limpiar el aviso "Tienes un pedido en curso" de /carta
    // de inmediato — no esperar a que el cliente vuelva a esa pantalla para que se note.
    useEffect(() => {
        if (order.status !== 'delivered' && order.status !== 'cancelled') return;
        if (localStorage.getItem('menugo_tracking_token') === token) {
            localStorage.removeItem('menugo_tracking_token');
        }
    }, [order.status, token]);

    const stepIndex = STEPS.findIndex(st => st.key === order.status);
    const isPaid = order.amount_paid >= order.total;
    const isDigital = order.payment_method ? DIGITAL_METHODS.includes(order.payment_method) : false;

    function reportPayment() {
        if (reporting) return;
        setReporting(true);
        router.post(`/carta/pedido/${token}/ya-pague`, {}, {
            onFinish: () => setReporting(false),
        });
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: s.bg, color: s.text }}>
            <Head title={`Tu pedido — ${tenant_name}`} />

            <div className="max-w-md mx-auto px-4 py-8 space-y-6">
                <a
                    href="/carta"
                    className="inline-flex items-center gap-1.5 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: s.text }}
                >
                    <ChevronLeft className="h-4 w-4" /> Volver a la carta
                </a>

                <div className="text-center space-y-1">
                    {settings?.logo_url && (
                        <img src={settings.logo_url} alt={tenant_name} className="h-12 w-auto mx-auto object-contain mb-3" />
                    )}
                    <p className="text-sm opacity-60">{tenant_name}</p>
                    <h1 className="font-display text-2xl font-bold">Pedido #{order.turn_number ?? order.id}</h1>
                    {order.type === 'mostrador' && order.turn_number && (
                        <p className="font-display text-5xl font-black mt-2" style={{ color: s.primary }}>
                            #{order.turn_number}
                        </p>
                    )}
                </div>

                {/* ── Stepper de estado ── */}
                {order.status === 'cancelled' ? (
                    <div className="rounded-2xl border p-5 text-center space-y-2" style={{ borderColor: '#ef444440', backgroundColor: '#ef444410' }}>
                        <X className="h-8 w-8 mx-auto text-red-500" />
                        <p className="font-semibold text-red-500">Pedido cancelado</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border p-5" style={{ borderColor: `${s.text}15`, backgroundColor: `${s.text}05` }}>
                        <div className="flex items-center">
                            {STEPS.map((step, i) => {
                                const reached = i <= stepIndex;
                                return (
                                    <div key={step.key} className="flex-1 flex flex-col items-center text-center gap-1.5">
                                        <div className="flex items-center w-full">
                                            {i > 0 && (
                                                <div className="flex-1 h-0.5" style={{ backgroundColor: reached ? s.primary : `${s.text}20` }} />
                                            )}
                                            <div
                                                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                                                style={{
                                                    backgroundColor: reached ? s.primary : `${s.text}10`,
                                                    color: reached ? '#fff' : `${s.text}60`,
                                                }}
                                            >
                                                {i < stepIndex ? <Check className="h-4 w-4" /> : <step.Icon className="h-4 w-4" />}
                                            </div>
                                            {i < STEPS.length - 1 && (
                                                <div className="flex-1 h-0.5" style={{ backgroundColor: i < stepIndex ? s.primary : `${s.text}20` }} />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-medium leading-tight" style={{ color: reached ? s.primary : `${s.text}60` }}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Resumen del pedido ── */}
                <div className="rounded-2xl border p-4 space-y-2" style={{ borderColor: `${s.text}15`, backgroundColor: `${s.text}05` }}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-55">Resumen</p>
                    {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm gap-2">
                            <span className="truncate">{item.quantity}× {item.dish ?? '—'}</span>
                            <span className="font-semibold shrink-0">{fmt(item.unit_price * item.quantity)}</span>
                        </div>
                    ))}
                    <div className="border-t pt-2 flex items-center justify-between" style={{ borderColor: `${s.text}15` }}>
                        <span className="font-semibold">Total</span>
                        <span className="font-display font-bold text-base" style={{ color: s.primary }}>{fmt(order.total)}</span>
                    </div>
                </div>

                {/* ── Estado de pago ── */}
                {order.status !== 'cancelled' && (
                    <div className="space-y-3">
                        {isPaid ? (
                            <div className="flex items-center gap-2 rounded-2xl border p-4" style={{ borderColor: '#22c55e40', backgroundColor: '#22c55e10' }}>
                                <Check className="h-5 w-5 text-green-500 shrink-0" />
                                <span className="text-sm font-semibold text-green-600">Pago confirmado</span>
                            </div>
                        ) : order.payment_reported_at ? (
                            <div className="flex items-center gap-2 rounded-2xl border p-4" style={{ borderColor: '#f59e0b40', backgroundColor: '#f59e0b10' }}>
                                <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                                <span className="text-sm font-semibold text-amber-600">Pago reportado, verificando con el negocio</span>
                            </div>
                        ) : isDigital ? (
                            <>
                                <PaymentDetailBlock
                                    method={order.payment_method!}
                                    detail={settings.payment_details?.[order.payment_method!]}
                                    total={order.total}
                                    primary={s.primary}
                                    text={s.text}
                                    fmt={fmt}
                                />
                                <button
                                    onClick={reportPayment}
                                    disabled={reporting}
                                    className="w-full py-3 rounded-2xl text-sm font-semibold disabled:opacity-50"
                                    style={{ backgroundColor: s.primary, color: '#ffffff' }}
                                >
                                    {reporting ? 'Enviando...' : 'Ya pagué'}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 rounded-2xl border p-4" style={{ borderColor: `${s.text}20`, backgroundColor: `${s.text}05` }}>
                                <AlertTriangle className="h-5 w-5 opacity-50 shrink-0" />
                                <span className="text-sm opacity-70">Pago pendiente — paga directamente en caja/mostrador</span>
                            </div>
                        )}
                    </div>
                )}

                {order.status !== 'cancelled' ? (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <a
                            href={`/carta?add_to=${token}`}
                            className="flex items-center justify-center w-full py-3 rounded-2xl text-sm font-semibold border transition hover:opacity-80"
                            style={{ borderColor: `${s.primary}50`, color: s.primary, backgroundColor: `${s.primary}15` }}
                        >
                            Adición
                        </a>
                        <a
                            href="/carta"
                            className="flex items-center justify-center w-full py-3 rounded-2xl text-sm font-semibold border transition hover:opacity-80"
                            style={{ borderColor: `${s.text}20`, color: s.text }}
                        >
                            Nuevo pedido
                        </a>
                    </div>
                ) : (
                    <a
                        href="/carta"
                        className="flex items-center justify-center w-full py-3 rounded-2xl text-sm font-semibold border mt-4 transition hover:opacity-80"
                        style={{ borderColor: `${s.primary}50`, color: s.primary }}
                    >
                        Hacer otro pedido
                    </a>
                )}
            </div>
        </div>
    );
}
