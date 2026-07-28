import { Head, router } from '@inertiajs/react';
import { useBusinessType } from '@/hooks/use-business-type';
import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, X, ChevronLeft, Check, UtensilsCrossed, Bike, Clock, MapPin, AlertTriangle, ZoomIn, Package } from 'lucide-react';
import PaymentDetailBlock from '@/components/carta/PaymentDetailBlock';

// ── Google Maps helpers ───────────────────────────────────────────────────────

function loadMapsScript(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).google?.maps?.places) { resolve(); return; }
        if (document.getElementById('gm-public')) {
            document.getElementById('gm-public')!.addEventListener('load', () => resolve());
            return;
        }
        const s = document.createElement('script');
        s.id = 'gm-public';
        s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es`;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
        document.head.appendChild(s);
    });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Íconos de redes sociales (SVG inline) ─────────────────────────────────────

function IgIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
    );
}

function FbIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
    );
}

function WaIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
    );
}

function TkIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function YtIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    );
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Dish {
    id: number;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
}

interface Category {
    id: number;
    name: string;
    description: string | null;
    dishes: Dish[];
}

interface SocialLinks {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    whatsapp_message?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
}

interface DeliveryZone {
    label: string;
    min_km: number;
    max_km: number;
    price: number;
}

interface PaymentDetail {
    titular?: string;
    numero?: string;
    banco?: string;
    tipo_cuenta?: string;
    link?: string;
    nota?: string;
}

interface CartaSettings {
    primary_color: string;
    bg_color: string;
    text_color: string;
    logo_size: string;
    name_size: string;
    slogan: string | null;
    slogan_size: string;
    banner_url: string | null;
    payment_methods: string[];
    payment_details: Record<string, PaymentDetail>;
    social_links: SocialLinks;
    delivery_enabled: boolean;
    delivery_min_order: number;
    delivery_zones: DeliveryZone[];
    logo_url: string | null;
    restaurant_lat: number | null;
    restaurant_lng: number | null;
    restaurant_address: string | null;
    work_schedule: Record<string, { activo: boolean; apertura: string; cierre: string }> | null;
}

interface Table {
    id: number;
    number: string;
    has_active_orders: boolean;
}

interface Props {
    categories: Category[];
    tenant_name: string;
    settings: CartaSettings;
    tables: Table[];
    initial_table_id?: number;
    orders_enabled: boolean;
    is_open_now?: boolean;
    now_iso?: string;
}

interface CartItem {
    dish: Dish;
    quantity: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n);
}

const LOGO_SIZES: Record<string, string> = {
    sm: 'h-8', md: 'h-10', lg: 'h-14', xl: 'h-20',
};
const NAME_SIZES: Record<string, string> = {
    sm: 'text-lg', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl', '2xl': 'text-4xl',
};
const SLOGAN_SIZES: Record<string, string> = {
    xs: 'text-xs', sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl',
};
const PAYMENT_LABELS: Record<string, string> = {
    efectivo: 'Efectivo',
    pse: 'PSE',
    nequi: 'Nequi',
    daviplata: 'Daviplata',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
};

const ORDER_TIMEOUT = 600; // 10 minutes in seconds

function fmtTimer(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function timerColor(s: number, primary: string): string {
    if (s > 300) return primary;   // > 5 min: brand color
    if (s > 120) return '#f59e0b'; // 2–5 min: amber
    return '#ef4444';              // < 2 min: red
}

type Screen = 'menu' | 'cart' | 'checkout';

// ── Componente principal ──────────────────────────────────────────────────────

export default function PublicMenu({ categories, tenant_name, settings, tables, initial_table_id, orders_enabled, is_open_now }: Props) {
    const { isPuesto } = useBusinessType();

    const s = {
        primary: settings?.primary_color ?? '#e85d04',
        bg: settings?.bg_color ?? '#ffffff',
        text: settings?.text_color ?? '#1a1a1a',
    };

    const logoClass = LOGO_SIZES[settings?.logo_size] ?? 'h-10';
    const nameClass = NAME_SIZES[settings?.name_size] ?? 'text-xl';
    const sloganClass = SLOGAN_SIZES[settings?.slogan_size] ?? 'text-sm';
    const payMethods = settings?.payment_methods?.length ? settings.payment_methods : ['efectivo'];

    // ── Lightbox ───────────────────────────────────────────────────────────────
    const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightbox]);

    // ── Cart state ─────────────────────────────────────────────────────────────
    const [cart, setCart] = useState<CartItem[]>([]);
    const [screen, setScreen] = useState<Screen>('menu');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState<{ name: string; total: number; paymentMethod: string; turnNumber?: number; trackingToken?: string } | null>(null);
    const [includeServiceModal, setIncludeServiceModal] = useState(true);
    const [occupiedConfirmed, setOccupiedConfirmed] = useState(false);

    // ── Adiciones (Modo adición) ───────────────────────────────────────────────
    const [additionToken, setAdditionToken] = useState<string | null>(null);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const addToken = params.get('add_to');
        if (addToken) {
            setAdditionToken(addToken);
            setScreen('menu'); // Force menu screen
        }
    }, []);

    // ── Link de seguimiento del último pedido (persistido en este navegador) ──
    const [trackingLink, setTrackingLink] = useState<string | null>(null);
    useEffect(() => {
        const token = localStorage.getItem('menugo_tracking_token');
        if (!token) return;
        // Verificar que el pedido siga activo antes de mostrar el aviso —
        // si ya fue entregado/cancelado, limpiar el storage en vez de mostrar un aviso obsoleto.
        fetch(`/carta/pedido/${token}/estado`)
            .then(r => r.json())
            .then((data: { status: string | null; is_active?: boolean }) => {
                if (data.status === null || data.is_active === false) {
                    localStorage.removeItem('menugo_tracking_token');
                    setTrackingLink(null);
                } else {
                    setTrackingLink(token);
                }
            })
            .catch(() => setTrackingLink(token));
    }, []);
    function dismissTrackingLink() {
        localStorage.removeItem('menugo_tracking_token');
        setTrackingLink(null);
    }

    // ── Buscar pedido sin token (número de pedido del día + teléfono) ─────────
    const [lookupOpen, setLookupOpen] = useState(false);
    const [lookupForm, setLookupForm] = useState({ turn_number: '', second_factor: '' });
    const [lookupSubmitting, setLookupSubmitting] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);

    function submitLookup() {
        if (lookupSubmitting || !lookupForm.turn_number || !lookupForm.second_factor) return;
        setLookupSubmitting(true);
        setLookupError(null);
        router.post('/carta/seguimiento', lookupForm, {
            onError: (errs: any) => {
                setLookupError(errs.lookup ?? errs.turn_number ?? errs.customer_phone ?? 'No se pudo buscar el pedido.');
                setLookupSubmitting(false);
            },
            onFinish: () => setLookupSubmitting(false),
        });
    }

    // ── Session timer (10 min) ─────────────────────────────────────────────────
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [timedOut, setTimedOut] = useState(false);

    // Start timer on first item; stop when cart empties
    useEffect(() => {
        if (cart.length > 0 && timerRef.current === null) {
            setTimeLeft(ORDER_TIMEOUT);
            timerRef.current = setInterval(() => {
                setTimeLeft(t => (t !== null && t > 1) ? t - 1 : 0);
            }, 1000);
        }
        if (cart.length === 0 && timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setTimeLeft(null);
        }
    }, [cart.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle timeout
    useEffect(() => {
        if (timeLeft !== 0 || timerRef.current === null) return;
        clearInterval(timerRef.current);
        timerRef.current = null;
        setCart([]);
        setScreen('menu');
        setTimedOut(true);
        setTimeLeft(null);
    }, [timeLeft]);

    // ── Checkout form ──────────────────────────────────────────────────────────
    const deliveryZones = settings?.delivery_zones ?? [];
    const deliveryEnabled = settings?.delivery_enabled ?? false;
    const deliveryMinOrder = settings?.delivery_min_order ?? 0;
    const restaurantLat = settings?.restaurant_lat ?? null;
    const restaurantLng = settings?.restaurant_lng ?? null;
    const addressInputRef = useRef<HTMLInputElement>(null);
    const [warnModal, setWarnModal] = useState<{ title: string; message: string } | null>(null);

    const allowedDeliveryTypes = settings?.delivery_types || (isPuesto ? ['mostrador', 'mesa', 'domicilio'] : ['mesa', 'domicilio']);
    const defaultType = allowedDeliveryTypes.length > 0 ? allowedDeliveryTypes[0] : (isPuesto ? 'mostrador' : 'mesa');

    const [form, setForm] = useState({
        customer_name: '',
        customer_phone: '',
        type: defaultType as 'mesa' | 'domicilio' | 'mostrador',
        table_id: initial_table_id ? String(initial_table_id) : '',
        delivery_address: '',
        delivery_zone_idx: null as number | null,
        payment_method: payMethods[0],
        notes: '',
    });

    function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
    }


    function handleAddressInput(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setField('delivery_address', val);
        setForm(f => ({ ...f, delivery_zone_idx: deliveryZones.length === 1 ? 0 : null, delivery_address: val }));
    }

    // ── Cart helpers ───────────────────────────────────────────────────────────
    function cartQty(dishId: number) {
        return cart.find(i => i.dish.id === dishId)?.quantity ?? 0;
    }

    function addItem(dish: Dish) {
        setCart(c => {
            const idx = c.findIndex(i => i.dish.id === dish.id);
            if (idx >= 0) return c.map((i, j) => j === idx ? { ...i, quantity: i.quantity + 1 } : i);
            return [...c, { dish, quantity: 1 }];
        });
    }

    function removeItem(dish: Dish) {
        setCart(c => {
            const idx = c.findIndex(i => i.dish.id === dish.id);
            if (idx < 0) return c;
            if (c[idx].quantity === 1) return c.filter((_, j) => j !== idx);
            return c.map((i, j) => j === idx ? { ...i, quantity: i.quantity - 1 } : i);
        });
    }

    function deleteItem(dishId: number) {
        setCart(c => c.filter(i => i.dish.id !== dishId));
    }

    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = cart.reduce((s, i) => s + i.dish.price * i.quantity, 0);

    const selectedZone = form.type === 'domicilio' && form.delivery_zone_idx !== null
        ? (deliveryZones[form.delivery_zone_idx] ?? null)
        : null;
    const deliveryFee = selectedZone?.price ?? 0;
    const grandTotal = totalPrice + deliveryFee;

    // ── Validaciones de domicilio ───────────────────────────────────────────────
    const belowMinOrder = form.type === 'domicilio'
        && deliveryEnabled
        && deliveryMinOrder > 0
        && totalPrice < deliveryMinOrder;

    // ── Submit ─────────────────────────────────────────────────────────────────
    const selectedTable = form.type === 'mesa' && form.table_id
        ? tables.find(t => String(t.id) === form.table_id) ?? null
        : null;
    const tableIsOccupied = selectedTable?.has_active_orders ?? false;
    const canSubmit = additionToken 
        ? true 
        : ((!tableIsOccupied || occupiedConfirmed) && !belowMinOrder);

    function submitOrder() {
        if (submitting) return;

        // ── Validaciones por tipo de entrega ───────────────────────────────────────

        if (!additionToken) {
            if (form.type === 'mesa') {
                if (!form.table_id) {
                    setErrors(e => ({ ...e, table_id: 'Selecciona una mesa.' }));
                    return;
                }
            }

            if (form.type === 'domicilio') {
                const newErrs: Record<string, string> = {};
                if (!form.customer_name.trim()) newErrs.customer_name = 'Ingresa el nombre del cliente.';
                const addr = form.delivery_address.trim();
                if (!addr) newErrs.delivery_address = 'Ingresa la dirección de entrega.';
                if (!form.customer_phone.trim()) newErrs.customer_phone = 'Ingresa el número de contacto.';
                if (Object.keys(newErrs).length > 0) {
                    setErrors(e => ({ ...e, ...newErrs }));
                    return;
                }
                if (belowMinOrder) {
                    setWarnModal({
                        title: 'Pedido mínimo no alcanzado',
                        message: `El pedido mínimo para domicilio es ${fmt(deliveryMinOrder)}. Tu pedido actual es ${fmt(totalPrice)}. Agrega ${fmt(deliveryMinOrder - totalPrice)} más para continuar.`,
                    });
                    return;
                }
            }
        }

        if (!canSubmit) return;
        setSubmitting(true);
        setErrors({});
        const snapshotTotal = grandTotal;
        const selectedTableNum = form.type === 'mesa' && form.table_id
            ? (tables.find(t => String(t.id) === form.table_id)?.number ?? form.table_id)
            : null;
        const snapshotName = form.type === 'mesa'
            ? (selectedTableNum ? `Mesa #${selectedTableNum}` : 'Mesa')
            : form.customer_name || 'Cliente';
        const snapshotMethod = form.payment_method;
        const itemsPayload = cart.map(i => ({ dish_id: i.dish.id, quantity: i.quantity }));

        if (additionToken) {
            router.post(`/carta/pedido/${additionToken}/adicion`, {
                items: itemsPayload,
            }, {
                onError: (errs) => { setErrors(errs); setSubmitting(false); },
                onSuccess: () => {
                    // Si se usó desde /pedidos (waiter view), redirigir de vuelta a /pedidos
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('waiter') === 'true') {
                        window.location.href = '/pedidos';
                    } else {
                        window.location.href = `/carta/pedido/${additionToken}`;
                    }
                }
            });
            return;
        }

        router.post('/carta/pedido', {
            customer_name: form.customer_name || null,
            customer_phone: form.type === 'domicilio' ? form.customer_phone || null : null,
            type: form.type,
            table_id: form.type === 'mesa' && form.table_id ? parseInt(form.table_id) : null,
            delivery_address: form.type === 'domicilio' ? form.delivery_address || null : null,
            delivery_zone_idx: form.type === 'domicilio' ? form.delivery_zone_idx : null,
            delivery_lat: null,
            delivery_lng: null,
            payment_method: form.payment_method,
            notes: form.notes || null,
            confirmed: occupiedConfirmed,
            items: itemsPayload,
        }, {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onSuccess: (page: any) => {
                const turnNumber: number | undefined = page?.props?.flash?.turn_number;
                const trackingToken: string | undefined = page?.props?.flash?.tracking_token;
                setSuccess({ name: snapshotName, total: snapshotTotal, paymentMethod: snapshotMethod, turnNumber, trackingToken });
                if (trackingToken) {
                    localStorage.setItem('menugo_tracking_token', trackingToken);
                    setTrackingLink(trackingToken);
                }
                setCart([]);
                setScreen('menu');
                setOccupiedConfirmed(false);
                setForm({
                    customer_name: '', customer_phone: '', type: defaultType as 'mesa' | 'domicilio' | 'mostrador',
                    table_id: '', delivery_address: '', delivery_zone_idx: null,
                    payment_method: payMethods[0], notes: '',
                });
                setSubmitting(false);
            },
        });
    }

    // ── Datos para el overlay de cierre ─────────────────────────────────────
    const DAYS_LABELS: { key: string; label: string }[] = [
        { key: 'lun', label: 'Lunes' }, { key: 'mar', label: 'Martes' },
        { key: 'mie', label: 'Miércoles' }, { key: 'jue', label: 'Jueves' },
        { key: 'vie', label: 'Viernes' }, { key: 'sab', label: 'Sábado' },
        { key: 'dom', label: 'Domingo' },
    ];
    const DAY_KEYS_NOW = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;
    const todayKey = DAY_KEYS_NOW[new Date().getDay()];
    const schedule = settings?.work_schedule ?? null;

    function fmtHour(hhmm: string) {
        const [h, m] = hhmm.split(':').map(Number);
        const ampm = h >= 12 ? 'p.m.' : 'a.m.';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: s.bg, color: s.text }}>
            <Head title={`Carta — ${tenant_name}`} />

            {/* ── Banner restaurante cerrado ── */}
            {!is_open_now && (
                <div className="w-full border-b px-4 py-5" style={{ backgroundColor: `${s.primary}08`, borderColor: `${s.primary}20` }}>
                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* Header */}
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <Clock className="h-5 w-5" style={{ color: s.primary }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm" style={{ color: s.primary }}>
                                    Estamos cerrados ahora
                                </h3>
                                <p className="text-xs mt-1 opacity-60">
                                    {schedule?.[todayKey]?.activo === false
                                        ? 'Hoy no tenemos servicio. Consulta nuestros horarios.'
                                        : 'En este momento estamos fuera del horario de atención.'}
                                </p>
                            </div>
                        </div>

                        {/* Horarios */}
                        {schedule && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-widest opacity-40">
                                    Horario de atención
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {DAYS_LABELS.map(({ key, label }) => {
                                        const day = schedule[key];
                                        const isToday = key === todayKey;
                                        return (
                                            <div key={key}
                                                className="flex items-center justify-between text-sm rounded-lg px-3 py-2"
                                                style={{
                                                    backgroundColor: isToday ? `${s.primary}12` : 'transparent',
                                                    fontWeight: isToday ? 600 : 400,
                                                }}>
                                                <span style={{ color: isToday ? s.primary : undefined }}>
                                                    {label}{isToday && ' (hoy)'}
                                                </span>
                                                {day?.activo
                                                    ? <span className="text-xs opacity-80">{fmtHour(day.apertura)} – {fmtHour(day.cierre)}</span>
                                                    : <span className="text-xs opacity-40">Cerrado</span>
                                                }
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Banner ── */}
            {settings?.banner_url && (
                <div className="w-full aspect-3/1 overflow-hidden">
                    <img src={settings.banner_url} alt={`${tenant_name} banner`} className="w-full h-full object-cover" />
                </div>
            )}

            {/* ── Cabecera sticky ── */}
            <header
                className="sticky top-0 z-10 backdrop-blur-md border-b shadow-md"
                style={{ backgroundColor: `${s.bg}f5`, borderColor: `${s.text}15` }}
            >
                <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-5">
                    {/* Logo */}
                    <img
                        src={settings?.logo_url ?? '/logo-trans.png'}
                        alt={tenant_name}
                        className={`${logoClass} w-auto max-w-[30%] shrink-0 object-contain drop-shadow-md`}
                    />

                    {/* Textos */}
                    <div className="min-w-0 flex-1 space-y-1">
                        <h1
                            className={`font-display font-extrabold leading-tight tracking-tight ${nameClass} line-clamp-2`}
                            style={{ color: s.text }}
                        >
                            {tenant_name}
                        </h1>

                        {settings?.slogan && (
                            <p
                                className={`${sloganClass} font-medium leading-snug line-clamp-2 opacity-75`}
                                style={{ color: s.text }}
                            >
                                {settings.slogan}
                            </p>
                        )}

                        {(settings?.restaurant_address || settings?.social_links?.whatsapp) && (
                            <div className="flex items-center flex-wrap gap-x-5 gap-y-1 pt-0.5">
                                {settings.restaurant_address && (
                                    <span
                                        className="flex items-center gap-1.5 text-sm font-medium opacity-65"
                                        style={{ color: s.text }}
                                    >
                                        📍 {settings.restaurant_address}
                                    </span>
                                )}
                                {settings.social_links?.whatsapp && (
                                    <a
                                        href={`https://wa.me/${settings.social_links.whatsapp.replace(/\D/g, '')}${settings.social_links.whatsapp_message ? `?text=${encodeURIComponent(settings.social_links.whatsapp_message)}` : ''}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1.5 text-sm font-bold opacity-85 hover:opacity-100 transition-opacity"
                                        style={{ color: s.primary }}
                                    >
                                        💬 {settings.social_links.whatsapp}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Aviso de pedido en seguimiento ── */}
            {additionToken ? (
                <div className="w-full border-b px-4 sm:px-8 py-3" style={{ backgroundColor: '#f59e0b15', borderColor: '#f59e0b40' }}>
                    <div className="max-w-5xl mx-auto flex items-center gap-3">
                        <Plus className="h-4 w-4 shrink-0 text-amber-500" />
                        <span className="flex-1 text-sm font-semibold text-amber-600">
                            Modo Adición: Agrega productos a tu pedido en curso
                        </span>
                        <a
                            href={`/carta/pedido/${additionToken}`}
                            className="shrink-0 text-sm font-bold text-amber-600 underline-offset-2 hover:underline"
                        >
                            Cancelar
                        </a>
                    </div>
                </div>
            ) : trackingLink && (
                <div className="w-full border-b px-4 sm:px-8 py-3" style={{ backgroundColor: `${s.primary}10`, borderColor: `${s.primary}25` }}>
                    <div className="max-w-5xl mx-auto flex items-center gap-3">
                        <Clock className="h-4 w-4 shrink-0" style={{ color: s.primary }} />
                        <span className="flex-1 text-sm font-medium" style={{ color: s.text }}>
                            Tienes un pedido en curso
                        </span>
                        <a
                            href={`/carta?add_to=${trackingLink}`}
                            className="shrink-0 text-sm font-bold text-amber-500 underline-offset-2 hover:underline mr-2"
                        >
                            Adición
                        </a>
                        <a
                            href={`/carta/pedido/${trackingLink}`}
                            className="shrink-0 text-sm font-bold underline-offset-2 hover:underline"
                            style={{ color: s.primary }}
                        >
                            Ver seguimiento →
                        </a>
                        <button
                            onClick={dismissTrackingLink}
                            aria-label="Ocultar aviso de seguimiento"
                            className="shrink-0 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
                            style={{ color: s.text }}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Buscar mi pedido sin link guardado ── */}
            {!trackingLink && (
                <div className="w-full border-b px-4 sm:px-8 py-2.5" style={{ borderColor: `${s.text}10` }}>
                    <div className="max-w-5xl mx-auto">
                        {!lookupOpen ? (
                            <button
                                onClick={() => setLookupOpen(true)}
                                className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
                                style={{ color: s.text }}
                            >
                                ¿Ya hiciste un pedido hoy? Consulta su estado →
                            </button>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 py-1">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-medium opacity-60" style={{ color: s.text }}>
                                        Número de pedido (de hoy)
                                    </label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                                        style={{ borderColor: `${s.text}25`, backgroundColor: `${s.text}06`, color: s.text }}
                                        placeholder="Ej: 4"
                                        value={lookupForm.turn_number}
                                        onChange={e => setLookupForm(f => ({ ...f, turn_number: e.target.value }))}
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-medium opacity-60" style={{ color: s.text }}>
                                        Nombre o Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                                        style={{ borderColor: `${s.text}25`, backgroundColor: `${s.text}06`, color: s.text }}
                                        placeholder="Tu nombre o teléfono"
                                        value={lookupForm.second_factor}
                                        onChange={e => setLookupForm(f => ({ ...f, second_factor: e.target.value }))}
                                    />
                                </div>
                                <button
                                    onClick={submitLookup}
                                    disabled={lookupSubmitting}
                                    className="shrink-0 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                                    style={{ backgroundColor: s.primary, color: '#ffffff' }}
                                >
                                    {lookupSubmitting ? 'Buscando...' : 'Buscar'}
                                </button>
                                <button
                                    onClick={() => { setLookupOpen(false); setLookupError(null); }}
                                    className="shrink-0 px-3 py-2 rounded-xl text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
                                    style={{ color: s.text }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                        {lookupError && <p className="text-xs text-red-500 mt-1.5">{lookupError}</p>}
                    </div>
                </div>
            )}

            {/* ── Índice de categorías ── */}
            {categories.length > 1 && (
                <div
                    className="sticky top-[128px] z-10 backdrop-blur border-b lg:hidden"
                    style={{ backgroundColor: `${s.bg}f5`, borderColor: `${s.text}15` }}
                >
                    <div className="max-w-5xl mx-auto px-4 sm:px-8">
                        <div className="flex gap-2 overflow-x-auto py-2.5 scrollbar-none">
                            {categories.map(cat => (
                                <a
                                    key={cat.id}
                                    href={`#cat-${cat.id}`}
                                    className="shrink-0 h-8 px-4 rounded-full text-xs font-medium transition-colors border"
                                    style={{ borderColor: `${s.text}25`, color: s.text }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${s.primary}18`;
                                        (e.currentTarget as HTMLAnchorElement).style.color = s.primary;
                                        (e.currentTarget as HTMLAnchorElement).style.borderColor = `${s.primary}50`;
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '';
                                        (e.currentTarget as HTMLAnchorElement).style.color = s.text;
                                        (e.currentTarget as HTMLAnchorElement).style.borderColor = `${s.text}25`;
                                    }}
                                >
                                    {cat.name}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Contenido ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 lg:flex lg:gap-10">

                {/* Sidebar categorías — sólo desktop */}
                {categories.length > 1 && (
                    <aside className="hidden lg:block w-44 shrink-0">
                        <div className="sticky top-20 space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-40 px-2" style={{ color: s.text }}>Categorías</p>
                            {categories.map(cat => (
                                <a
                                    key={cat.id}
                                    href={`#cat-${cat.id}`}
                                    className="flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all"
                                    style={{ color: s.text }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${s.primary}14`; (e.currentTarget as HTMLAnchorElement).style.color = s.primary; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = ''; (e.currentTarget as HTMLAnchorElement).style.color = s.text; }}
                                >
                                    {cat.name}
                                </a>
                            ))}
                        </div>
                    </aside>
                )}

                <main className="flex-1 min-w-0 space-y-10 pb-28">

                    {/* Aviso solo menú digital — visible para plan starter */}
                    {!orders_enabled && (
                        <div
                            className="rounded-2xl border p-5 text-center space-y-2"
                            style={{ borderColor: `${s.text}20`, backgroundColor: `${s.text}06` }}
                        >
                            <div className="text-3xl">📋</div>
                            <p className="font-semibold text-sm" style={{ color: s.text }}>
                                Solo menú digital
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: s.text, opacity: 0.65 }}>
                                Este restaurante usa MenúGO para mostrar su carta digital.
                                Para hacer tu pedido, comunícate directamente con el staff.
                            </p>
                        </div>
                    )}

                    {categories.length === 0 ? (
                        <div className="text-center py-20" style={{ color: `${s.text}70` }}>
                            <p className="text-lg font-medium">La carta está siendo preparada.</p>
                            <p className="text-sm mt-1">Vuelve pronto.</p>
                        </div>
                    ) : (
                        categories.map(cat => (
                            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-36 lg:scroll-mt-28">
                                <div className="mb-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="h-[1.5px] flex-1 opacity-25" style={{ backgroundColor: s.primary }} />
                                        <h2 className="font-display text-lg font-bold uppercase tracking-widest px-1" style={{ color: s.primary }}>
                                            {cat.name}
                                        </h2>
                                        <div className="h-[1.5px] flex-1 opacity-25" style={{ backgroundColor: s.primary }} />
                                    </div>
                                    {cat.description && (
                                        <p className="text-sm text-center mt-1 opacity-60" style={{ color: s.text }}>
                                            {cat.description}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {cat.dishes.map(dish => {
                                        const qty = cartQty(dish.id);
                                        return (
                                            <div
                                                key={dish.id}
                                                className="flex items-start gap-4 rounded-2xl p-4 border"
                                                style={{ borderColor: `${s.text}15`, backgroundColor: `${s.text}05` }}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-base leading-snug" style={{ color: s.text }}>
                                                        {dish.name}
                                                    </div>
                                                    {dish.description && (
                                                        <p className="text-sm mt-1 leading-relaxed opacity-65" style={{ color: s.text }}>
                                                            {dish.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                                                        <div className="font-display text-lg font-bold" style={{ color: s.primary }}>
                                                            {fmt(dish.price)}
                                                        </div>
                                                        {orders_enabled && is_open_now && (qty === 0 ? (
                                                            <button
                                                                onClick={() => addItem(dish)}
                                                                className="flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-semibold"
                                                                style={{ backgroundColor: s.primary, color: '#ffffff' }}
                                                            >
                                                                <Plus className="h-3.5 w-3.5" /> Agregar
                                                            </button>
                                                        ) : (
                                                            <div
                                                                className="flex items-center gap-1 rounded-full border"
                                                                style={{ borderColor: `${s.primary}50` }}
                                                            >
                                                                <button
                                                                    onClick={() => removeItem(dish)}
                                                                    className="h-8 w-8 flex items-center justify-center rounded-full"
                                                                    style={{ color: s.primary }}
                                                                >
                                                                    <Minus className="h-3.5 w-3.5" />
                                                                </button>
                                                                <span className="w-5 text-center text-sm font-bold" style={{ color: s.primary }}>
                                                                    {qty}
                                                                </span>
                                                                <button
                                                                    onClick={() => addItem(dish)}
                                                                    className="h-8 w-8 flex items-center justify-center rounded-full"
                                                                    style={{ color: s.primary }}
                                                                >
                                                                    <Plus className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {dish.image_url && (
                                                    <button
                                                        onClick={() => setLightbox({ url: dish.image_url!, name: dish.name })}
                                                        className="shrink-0 relative group rounded-xl focus:outline-none focus-visible:ring-2"
                                                        style={{ ['--tw-ring-color' as string]: s.primary }}
                                                        aria-label={`Ver imagen de ${dish.name}`}
                                                    >
                                                        <img
                                                            src={dish.image_url}
                                                            alt={dish.name}
                                                            className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover"
                                                            style={{ border: `1px solid ${s.text}20` }}
                                                        />
                                                        <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors duration-200">
                                                            <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow" />
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))
                    )}
                </main>
            </div>

            {/* ── Footer ── */}
            <footer className="border-t mt-12 pb-8" style={{ borderColor: `${s.text}15` }}>
                {/* Redes sociales */}
                {(() => {
                    const sl = settings?.social_links ?? {};

                    type SocialEntry = {
                        key: string;
                        href: string;
                        icon: React.ReactNode;
                        label: string;
                        bg: string;
                        glow: string;
                    };

                    const links: SocialEntry[] = ([
                        sl.instagram && {
                            key: 'instagram', href: sl.instagram,
                            icon: <IgIcon />, label: 'Instagram',
                            bg: 'linear-gradient(135deg,#833ab4 0%,#fd1d1d 50%,#fcb045 100%)',
                            glow: 'rgba(253,29,29,0.45)',
                        },
                        sl.facebook && {
                            key: 'facebook', href: sl.facebook,
                            icon: <FbIcon />, label: 'Facebook',
                            bg: '#1877F2',
                            glow: 'rgba(24,119,242,0.45)',
                        },
                        sl.whatsapp && {
                            key: 'whatsapp',
                            href: `https://wa.me/${sl.whatsapp.replace(/\D/g, '')}${sl.whatsapp_message ? `?text=${encodeURIComponent(sl.whatsapp_message)}` : ''}`,
                            icon: <WaIcon />, label: 'WhatsApp',
                            bg: 'linear-gradient(135deg,#128C7E 0%,#25D366 100%)',
                            glow: 'rgba(37,211,102,0.45)',
                        },
                        sl.tiktok && {
                            key: 'tiktok', href: sl.tiktok,
                            icon: <TkIcon />, label: 'TikTok',
                            bg: 'linear-gradient(135deg,#010101 0%,#2d2d2d 100%)',
                            glow: 'rgba(238,29,82,0.40)',
                        },
                        sl.twitter && {
                            key: 'twitter', href: sl.twitter,
                            icon: <XIcon />, label: 'X',
                            bg: 'linear-gradient(135deg,#1a1a1a 0%,#333 100%)',
                            glow: 'rgba(0,0,0,0.35)',
                        },
                        sl.youtube && {
                            key: 'youtube', href: sl.youtube,
                            icon: <YtIcon />, label: 'YouTube',
                            bg: 'linear-gradient(135deg,#c4302b 0%,#ff0000 100%)',
                            glow: 'rgba(255,0,0,0.45)',
                        },
                    ] as (SocialEntry | false)[]).filter((x): x is SocialEntry => Boolean(x));

                    if (links.length === 0) return null;

                    return (
                        <div className="pt-8 pb-5">
                            <p className="text-center text-[11px] font-semibold uppercase tracking-widest mb-5 opacity-40"
                                style={{ color: s.text }}>
                                Seguinos
                            </p>
                            <div className="flex justify-center gap-4 flex-wrap">
                                {links.map(({ key, href, icon, label, bg, glow }) => (
                                    <a
                                        key={key}
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        aria-label={label}
                                        className="flex flex-col items-center gap-2"
                                        style={{ textDecoration: 'none' }}
                                        onMouseEnter={e => {
                                            const chip = e.currentTarget.querySelector<HTMLSpanElement>('.social-chip');
                                            if (chip) {
                                                chip.style.transform = 'translateY(-3px) scale(1.12)';
                                                chip.style.boxShadow = `0 8px 22px ${glow}`;
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            const chip = e.currentTarget.querySelector<HTMLSpanElement>('.social-chip');
                                            if (chip) {
                                                chip.style.transform = '';
                                                chip.style.boxShadow = `0 4px 12px ${glow}`;
                                            }
                                        }}
                                    >
                                        <span
                                            className="social-chip h-13 w-13 flex items-center justify-center rounded-2xl"
                                            style={{
                                                background: bg,
                                                boxShadow: `0 4px 12px ${glow}`,
                                                color: '#ffffff',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                width: '52px',
                                                height: '52px',
                                            }}
                                        >
                                            {icon}
                                        </span>
                                        <span className="text-[10px] font-medium opacity-45" style={{ color: s.text }}>
                                            {label}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                <p className="text-center text-xs opacity-35 pt-2" style={{ color: s.text }}>
                    {tenant_name} · Carta digital por{' '}
                    <span className="font-semibold" style={{ color: s.primary }}>Menugo</span>
                </p>
            </footer>

            {/* ── Barra flotante del carrito ── */}
            {orders_enabled && cart.length > 0 && screen === 'menu' && (
                <div className="fixed bottom-0 left-0 right-0 z-20 p-4">
                    <div className="max-w-5xl mx-auto">
                        <button
                            onClick={() => setScreen('cart')}
                            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl shadow-xl font-semibold"
                            style={{ backgroundColor: s.primary, color: '#ffffff' }}
                        >
                            <span className="flex items-center gap-2.5">
                                <span
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                                >
                                    {totalItems}
                                </span>
                                Ver pedido
                            </span>
                            <span className="text-lg font-bold">{fmt(totalPrice)}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Hoja: carrito ── */}
            {screen === 'cart' && (
                <div className="fixed inset-0 z-30 flex justify-end">
                    {/* Backdrop desktop */}
                    <div className="hidden lg:block absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={() => setScreen('menu')} />
                    {/* Panel */}
                    <div className="relative flex flex-col w-full lg:w-[440px] shadow-2xl" style={{ backgroundColor: s.bg }}>
                        <div
                            className="flex items-center justify-between px-4 py-4 border-b shrink-0"
                            style={{ borderColor: `${s.text}15` }}
                        >
                            <button onClick={() => setScreen('menu')} className="p-2 -ml-2 rounded-xl" style={{ color: s.text }}>
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <div className="flex flex-col items-center">
                                <h2 className="font-display font-bold text-base" style={{ color: s.text }}>Tu pedido</h2>
                                {timeLeft !== null && (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold mt-0.5" style={{ color: timerColor(timeLeft, s.primary) }}>
                                        <Clock className="h-3 w-3" /> {fmtTimer(timeLeft)}
                                    </span>
                                )}
                            </div>
                            <div className="w-9" />
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {cart.map(item => (
                                <div
                                    key={item.dish.id}
                                    className="flex items-center gap-3 rounded-2xl p-3 border"
                                    style={{ borderColor: `${s.text}12`, backgroundColor: `${s.text}04` }}
                                >
                                    {item.dish.image_url && (
                                        <img
                                            src={item.dish.image_url}
                                            alt={item.dish.name}
                                            className="h-14 w-14 rounded-xl object-cover shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm leading-snug truncate" style={{ color: s.text }}>
                                            {item.dish.name}
                                        </p>
                                        <p className="text-sm font-bold mt-0.5" style={{ color: s.primary }}>
                                            {fmt(item.dish.price * item.quantity)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-full border shrink-0" style={{ borderColor: `${s.primary}40` }}>
                                        <button
                                            onClick={() => removeItem(item.dish)}
                                            className="h-7 w-7 flex items-center justify-center rounded-full"
                                            style={{ color: s.primary }}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-5 text-center text-sm font-bold" style={{ color: s.primary }}>
                                            {item.quantity}
                                        </span>
                                        {is_open_now && (
                                            <button
                                                onClick={() => addItem(item.dish)}
                                                className="h-7 w-7 flex items-center justify-center rounded-full"
                                                style={{ color: s.primary }}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteItem(item.dish.id)}
                                        className="p-1.5 rounded-xl shrink-0"
                                        style={{ color: s.text, opacity: 0.4 }}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="px-4 py-4 border-t space-y-3 shrink-0" style={{ borderColor: `${s.text}15` }}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium opacity-70" style={{ color: s.text }}>Total</span>
                                <span className="font-display text-xl font-bold" style={{ color: s.primary }}>
                                    {fmt(totalPrice)}
                                </span>
                            </div>
                            {is_open_now === false ? (
                                <div className="w-full py-3 rounded-2xl text-sm font-semibold text-center opacity-60 border"
                                    style={{ borderColor: `${s.text}25`, color: s.text }}>
                                    Estamos cerrados — no se pueden realizar pedidos
                                </div>
                            ) : (
                                <button
                                    onClick={() => setScreen('checkout')}
                                    className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                                    style={{ backgroundColor: s.primary, color: '#ffffff' }}
                                >
                                    Hacer pedido
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Hoja: checkout ── */}
            {screen === 'checkout' && (
                <div className="fixed inset-0 z-30 flex justify-end">
                    {/* Backdrop desktop */}
                    <div className="hidden lg:block absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={() => setScreen('cart')} />
                    {/* Panel */}
                    <div className="relative flex flex-col w-full lg:w-[440px] shadow-2xl" style={{ backgroundColor: s.bg }}>
                        <div
                            className="flex items-center justify-between px-4 py-4 border-b shrink-0"
                            style={{ borderColor: `${s.text}15` }}
                        >
                            <button onClick={() => setScreen('cart')} className="p-2 -ml-2 rounded-xl" style={{ color: s.text }}>
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <div className="flex flex-col items-center">
                                <h2 className="font-display font-bold text-base" style={{ color: s.text }}>Datos del pedido</h2>
                                {timeLeft !== null && (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold mt-0.5" style={{ color: timerColor(timeLeft, s.primary) }}>
                                        <Clock className="h-3 w-3" /> {fmtTimer(timeLeft)}
                                    </span>
                                )}
                            </div>
                            <div className="w-9" />
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

                            {/* Tipo de servicio — va PRIMERO */}
                            {!additionToken && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium" style={{ color: s.text }}>Tipo de entrega</label>
                                        <div className={`grid gap-2 ${allowedDeliveryTypes.length === 3 ? 'grid-cols-3' : allowedDeliveryTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {([
                                        { val: 'mostrador' as const, Icon: Package, label: 'Mostrador' },
                                        { val: 'mesa' as const, Icon: UtensilsCrossed, label: 'Mesa' },
                                        { val: 'domicilio' as const, Icon: Bike, label: 'Domicilio' },
                                    ]).filter(o => allowedDeliveryTypes.includes(o.val)).map(({ val, Icon, label }) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => {
                                                setForm(f => ({
                                                    ...f,
                                                    type: val,
                                                    // Auto-seleccionar zona única al cambiar a domicilio
                                                    delivery_zone_idx: val === 'domicilio' && deliveryZones.length === 1 ? 0 : null,
                                                }));
                                                if (errors.type) setErrors(e => { const n = { ...e }; delete n.type; return n; });
                                            }}
                                            className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors"
                                            style={{
                                                borderColor: form.type === val ? s.primary : `${s.text}20`,
                                                backgroundColor: form.type === val ? `${s.primary}15` : 'transparent',
                                                color: form.type === val ? s.primary : s.text,
                                            }}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mesa */}
                            {form.type === 'mesa' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" style={{ color: s.text }}>Mesa</label>
                                    {tables.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {tables.map(t => {
                                                const isSelected = form.table_id === String(t.id);
                                                const occupied = t.has_active_orders;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setField('table_id', String(t.id));
                                                            setOccupiedConfirmed(false);
                                                        }}
                                                        className="relative h-10 w-10 rounded-xl border text-sm font-semibold transition-colors"
                                                        style={{
                                                            borderColor: isSelected ? s.primary : occupied ? '#f97316' : `${s.text}20`,
                                                            backgroundColor: isSelected ? `${s.primary}20` : occupied ? 'rgba(249,115,22,0.08)' : 'transparent',
                                                            color: isSelected ? s.primary : occupied ? '#f97316' : s.text,
                                                        }}
                                                    >
                                                        {t.number}
                                                        {occupied && (
                                                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs opacity-50" style={{ color: s.text }}>
                                            No hay mesas registradas.
                                        </p>
                                    )}

                                    {/* Aviso de mesa ocupada */}
                                    {tableIsOccupied && (
                                        <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-3 space-y-2">
                                            <p className="text-xs font-semibold text-orange-500">
                                                ⚠️ Esta mesa ya tiene un pedido activo.
                                            </p>
                                            <p className="text-xs" style={{ color: s.text, opacity: 0.7 }}>
                                                Para agregar productos al pedido en curso, comunícate con el personal. Si deseas hacer un pedido nuevo e independiente, confírmalo.
                                            </p>
                                            {!occupiedConfirmed ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setOccupiedConfirmed(true)}
                                                    className="w-full rounded-lg border border-orange-500/60 py-1.5 text-xs font-semibold text-orange-500 hover:bg-orange-500/10 transition-colors"
                                                >
                                                    Confirmar pedido nuevo e independiente
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400">
                                                    <Check className="h-3.5 w-3.5" /> Confirmado — se creará un pedido nuevo
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {errors.table_id && <p className="text-xs text-red-500">{errors.table_id}</p>}
                                </div>
                            )}

                            {/* Dirección domicilio */}
                            {form.type === 'domicilio' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: s.text }}>
                                        <MapPin className="h-3.5 w-3.5" />
                                        Dirección de entrega
                                    </label>

                                    <input
                                        ref={addressInputRef}
                                        type="text"
                                        className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none"
                                        style={{
                                            borderColor: errors.delivery_address ? '#ef4444' : `${s.text}25`,
                                            backgroundColor: `${s.text}06`,
                                            color: s.text,
                                        }}
                                        placeholder="Ej: Cra 15 # 23-45, Barrio Los Álamos, Cali"
                                        value={form.delivery_address}
                                        onChange={handleAddressInput}
                                        autoComplete="off"
                                    />

                                    {errors.delivery_address && (
                                        <p className="text-xs text-red-500">{errors.delivery_address}</p>
                                    )}
                                </div>
                            )}

                            {/* Costo de domicilio - asignado automáticamente por el sistema */}
                            {form.type === 'domicilio' && deliveryEnabled && deliveryZones.length > 0 && (
                                <div className="space-y-2">
                                    {selectedZone && (
                                        <>
                                            <label className="text-sm font-medium" style={{ color: s.text }}>
                                                Costo máximo del domicilio
                                            </label>
                                            <div
                                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm"
                                                style={{
                                                    borderColor: s.primary,
                                                    backgroundColor: `${s.primary}12`,
                                                    color: s.text,
                                                }}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Check className="h-3.5 w-3.5 shrink-0" style={{ color: s.primary }} />
                                                    <span>
                                                        <span className="font-medium">{selectedZone.label}</span>
                                                        {deliveryZones.length > 1 && (
                                                            <span className="opacity-55 ml-2 text-xs">
                                                                {selectedZone.min_km}–{selectedZone.max_km} km
                                                            </span>
                                                        )}
                                                    </span>
                                                </span>
                                                <span className="font-bold shrink-0" style={{ color: s.primary }}>
                                                    {selectedZone.price === 0 ? 'Gratis' : fmt(selectedZone.price)}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {/* Pedido mínimo */}
                                    {deliveryMinOrder > 0 && (
                                        <div
                                            className="rounded-xl px-3 py-2 text-xs font-medium"
                                            style={{
                                                backgroundColor: belowMinOrder ? 'rgba(239,68,68,0.1)' : `${s.text}08`,
                                                color: belowMinOrder ? '#ef4444' : s.text,
                                                opacity: belowMinOrder ? 1 : 0.65,
                                                border: belowMinOrder ? '1px solid rgba(239,68,68,0.35)' : 'none',
                                            }}
                                        >
                                            {belowMinOrder
                                                ? `⚠ Mínimo para domicilio: ${fmt(deliveryMinOrder)} — faltan ${fmt(deliveryMinOrder - totalPrice)}`
                                                : `Pedido mínimo para domicilio: ${fmt(deliveryMinOrder)}`
                                            }
                                        </div>
                                    )}

                                    {/* Error backend de pedido mínimo */}
                                    {errors.delivery_min_order && (
                                        <p className="text-xs text-red-500">{errors.delivery_min_order}</p>
                                    )}
                                </div>
                            )}

                            {/* Pedido mínimo (cuando no hay zonas pero sí hay mínimo) */}
                            {form.type === 'domicilio' && deliveryEnabled && deliveryZones.length === 0 && deliveryMinOrder > 0 && (
                                <div
                                    className="rounded-xl px-3 py-2 text-xs font-medium"
                                    style={{
                                        backgroundColor: belowMinOrder ? 'rgba(239,68,68,0.1)' : `${s.text}08`,
                                        color: belowMinOrder ? '#ef4444' : s.text,
                                        opacity: belowMinOrder ? 1 : 0.65,
                                        border: belowMinOrder ? '1px solid rgba(239,68,68,0.35)' : 'none',
                                    }}
                                >
                                    {belowMinOrder
                                        ? `⚠ Mínimo para domicilio: ${fmt(deliveryMinOrder)} — faltan ${fmt(deliveryMinOrder - totalPrice)}`
                                        : `Pedido mínimo para domicilio: ${fmt(deliveryMinOrder)}`
                                    }
                                </div>
                            )}

                            {/* Nombre — para todos los pedidos */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" style={{ color: s.text }}>
                                    Nombre del cliente <span style={{ color: s.primary }}>*</span>
                                </label>
                                    <input
                                        className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none"
                                        style={{
                                            borderColor: errors.customer_name ? '#ef4444' : `${s.text}25`,
                                            backgroundColor: `${s.text}06`,
                                            color: s.text,
                                        }}
                                        placeholder="Nombre del cliente"
                                        value={form.customer_name}
                                        onChange={e => setField('customer_name', e.target.value)}
                                    />
                                    {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name}</p>}
                                </div>

                            {/* Teléfono — solo para Domicilio */}
                            {form.type === 'domicilio' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: s.text }}>
                                        Número de contacto <span style={{ color: s.primary }}>*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none"
                                        style={{
                                            borderColor: errors.customer_phone ? '#ef4444' : `${s.text}25`,
                                            backgroundColor: `${s.text}06`,
                                            color: s.text,
                                        }}
                                        placeholder="3001234567"
                                        value={form.customer_phone}
                                        onChange={e => setField('customer_phone', e.target.value)}
                                    />
                                    {errors.customer_phone && <p className="text-xs text-red-500">{errors.customer_phone}</p>}
                                </div>
                            )}

                            {/* Método de pago */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" style={{ color: s.text }}>Método de pago</label>
                                <div className="flex flex-wrap gap-2">
                                    {payMethods.map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setField('payment_method', method)}
                                            className="h-9 px-4 rounded-full border text-sm font-medium transition-colors"
                                            style={{
                                                borderColor: form.payment_method === method ? s.primary : `${s.text}20`,
                                                backgroundColor: form.payment_method === method ? `${s.primary}15` : 'transparent',
                                                color: form.payment_method === method ? s.primary : s.text,
                                            }}
                                        >
                                            {PAYMENT_LABELS[method] ?? method}
                                        </button>
                                    ))}
                                </div>
                                {errors.payment_method && <p className="text-xs text-red-500">{errors.payment_method}</p>}
                            </div>
                                </>
                            )}

                            {/* Notas */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium opacity-70" style={{ color: s.text }}>
                                    Notas <span className="font-normal opacity-60">(opcional)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none resize-none"
                                    style={{
                                        borderColor: `${s.text}20`,
                                        backgroundColor: `${s.text}06`,
                                        color: s.text,
                                    }}
                                    placeholder="Alergias, instrucciones especiales..."
                                    value={form.notes}
                                    onChange={e => setField('notes', e.target.value)}
                                />
                            </div>

                            {/* Resumen */}
                            <div
                                className="rounded-2xl border p-4 space-y-2"
                                style={{ borderColor: `${s.text}15`, backgroundColor: `${s.text}05` }}
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-55" style={{ color: s.text }}>
                                    Resumen
                                </p>
                                {cart.map(item => (
                                    <div key={item.dish.id} className="flex items-center justify-between text-sm gap-2">
                                        <span className="truncate" style={{ color: s.text }}>
                                            {item.quantity}× {item.dish.name}
                                        </span>
                                        <span className="font-semibold shrink-0" style={{ color: s.text }}>
                                            {fmt(item.dish.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                                {selectedZone && (
                                    <div className="flex items-center justify-between text-sm gap-2">
                                        <span className="opacity-70" style={{ color: s.text }}>
                                            + Domicilio ({selectedZone.label})
                                        </span>
                                        <span className="font-semibold shrink-0" style={{ color: s.text }}>
                                            {deliveryFee === 0 ? 'Gratis' : fmt(deliveryFee)}
                                        </span>
                                    </div>
                                )}
                                <div
                                    className="border-t pt-2 flex items-center justify-between"
                                    style={{ borderColor: `${s.text}15` }}
                                >
                                    <span className="font-semibold" style={{ color: s.text }}>Total</span>
                                    <span className="font-display font-bold text-base" style={{ color: s.primary }}>
                                        {fmt(grandTotal)}
                                    </span>
                                </div>
                            </div>

                            {errors.items && (
                                <p className="text-xs text-red-500 text-center">{errors.items}</p>
                            )}

                            {errors.server_error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl mt-4">
                                    <p className="text-sm text-red-600 font-medium">
                                        {errors.server_error}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-4 border-t shrink-0" style={{ borderColor: `${s.text}15` }}>
                            {!orders_enabled && (
                                <div
                                    className="rounded-2xl border p-5 text-center space-y-2 mb-3"
                                    style={{ borderColor: `${s.text}20`, backgroundColor: `${s.text}06` }}
                                >
                                    <div className="text-3xl">📋</div>
                                    <p className="font-semibold text-sm" style={{ color: s.text }}>
                                        Solo menú digital
                                    </p>
                                    <p className="text-xs leading-relaxed" style={{ color: s.text, opacity: 0.65 }}>
                                        Este restaurante usa MenúGO para mostrar su carta digital.
                                        Para hacer tu pedido, comunícate directamente con el staff.
                                    </p>
                                </div>
                            )}
                            {is_open_now === false ? (
                                <div className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center border"
                                    style={{ borderColor: `${s.text}25`, color: s.text, opacity: 0.55 }}>
                                    Estamos cerrados — pedidos no disponibles
                                </div>
                            ) : (
                                <button
                                    onClick={submitOrder}
                                    disabled={!orders_enabled || submitting}
                                    className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: s.primary, color: '#ffffff' }}
                                >
                                    {submitting
                                        ? 'Enviando...'
                                        : tableIsOccupied && !occupiedConfirmed
                                            ? 'Confirma el pedido nuevo arriba ↑'
                                            : additionToken
                                                ? `Confirmar adición · ${fmt(grandTotal)}`
                                                : `Confirmar pedido · ${fmt(grandTotal)}`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Popup de error de validación (dirección / zona / mínimo) ── */}
            {warnModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setWarnModal(null)}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl shadow-2xl"
                        style={{ backgroundColor: s.bg }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
                            {/* Ícono */}
                            <div
                                className="h-16 w-16 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
                            >
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>

                            {/* Texto */}
                            <div className="space-y-1.5">
                                <h3
                                    className="font-display text-lg font-bold"
                                    style={{ color: s.text }}
                                >
                                    {warnModal.title}
                                </h3>
                                <p
                                    className="text-sm leading-relaxed"
                                    style={{ color: s.text, opacity: 0.65 }}
                                >
                                    {warnModal.message}
                                </p>
                            </div>

                            {/* Botón corregir */}
                            <button
                                className="w-full py-3.5 rounded-2xl text-sm font-semibold mt-1"
                                style={{ backgroundColor: s.primary, color: '#ffffff' }}
                                onClick={() => setWarnModal(null)}
                            >
                                Corregir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal de tiempo agotado ── */}
            {timedOut && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
                        style={{ backgroundColor: s.bg }}
                    >
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
                            <Clock className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: s.text }}>
                            Tiempo agotado
                        </h2>
                        <p className="text-sm leading-relaxed mb-6" style={{ color: s.text, opacity: 0.65 }}>
                            Tu sesión de pedido expiró luego de <strong style={{ opacity: 1 }}>10 minutos</strong> de inactividad.
                            Los productos seleccionados fueron removidos del carrito.
                            Puedes volver a hacer tu selección cuando quieras.
                        </p>
                        <button
                            onClick={() => setTimedOut(false)}
                            className="w-full py-3 rounded-2xl text-sm font-semibold"
                            style={{ backgroundColor: s.primary, color: '#ffffff' }}
                        >
                            Volver a la carta
                        </button>
                    </div>
                </div>
            )}

            {/* ── Temporizador fijo esquina inferior izquierda — solo en la carta, las hojas de carrito/checkout lo muestran en su cabecera ── */}
            {timeLeft !== null && screen === 'menu' && (() => {
                const cartBarVisible = orders_enabled && cart.length > 0;
                return (
                    <div
                        className="fixed left-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg"
                        style={{
                            backgroundColor: timerColor(timeLeft, s.primary), color: '#ffffff',
                            bottom: cartBarVisible ? '88px' : '16px',
                        }}
                    >
                        <Clock className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-semibold leading-none">Vigencia Toma Pedido:</span>
                        <span className="font-mono text-sm font-bold leading-none">{fmtTimer(timeLeft)}</span>
                    </div>
                );
            })()}

            {/* ── Modal de éxito ── */}
            {success && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center p-6"
                    style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                >
                    <div
                        className="w-full max-w-md rounded-3xl p-6 md:p-8 text-center shadow-2xl"
                        style={{ backgroundColor: s.bg }}
                    >
                        <div
                            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${s.primary}20` }}
                        >
                            <Check className="h-8 w-8" style={{ color: s.primary }} />
                        </div>
                        <h2 className="font-display text-2xl font-bold mb-1" style={{ color: s.text }}>
                            ¡Pedido enviado!
                        </h2>
                        <p className="text-sm opacity-65 mb-3" style={{ color: s.text }}>
                            Gracias, {success.name}. Tu pedido ha sido recibido.
                        </p>
                        
                        <div className="flex flex-col items-center gap-1 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-sm" style={{ color: s.text }}>
                                <input 
                                    type="checkbox" 
                                    checked={includeServiceModal} 
                                    onChange={(e) => setIncludeServiceModal(e.target.checked)}
                                    className="rounded border-gray-300 focus:ring-2"
                                    style={{ color: s.primary }}
                                />
                                <span className="opacity-80">Incluir Servicio (10%)</span>
                            </label>
                            <p className="font-display text-3xl font-bold" style={{ color: s.primary }}>
                                {fmt(includeServiceModal ? success.total * 1.10 : success.total)}
                            </p>
                        </div>

                        {/* Número de turno — solo para pedidos de mostrador */}
                        {success.turnNumber && (
                            <div
                                className="w-full mb-4 rounded-2xl py-4 text-center"
                                style={{ backgroundColor: `${s.primary}12`, border: `2px solid ${s.primary}30` }}
                            >
                                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: s.primary, opacity: 0.7 }}>
                                    Tu número de turno
                                </p>
                                <p className="font-display text-6xl font-black leading-none" style={{ color: s.primary }}>
                                    #{success.turnNumber}
                                </p>
                                <p className="text-xs mt-2" style={{ color: s.text, opacity: 0.55 }}>
                                    Te llamamos cuando esté listo
                                </p>
                            </div>
                        )}

                        {/* Bloque de pagos */}
                        <div className="text-left mb-4 space-y-2">
                            <div className="flex items-center gap-2 rounded-xl border p-2.5 mb-1" style={{ borderColor: `${s.text}20`, backgroundColor: `${s.text}05` }}>
                                <AlertTriangle className="h-4 w-4 opacity-50 shrink-0" style={{ color: s.text }} />
                                <span className="text-xs opacity-70 leading-snug" style={{ color: s.text }}>Pago pendiente — abona en caja o transfiere a uno de estos medios:</span>
                            </div>
                            {Object.keys(settings.payment_details || {}).length > 0 && (
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {Object.keys(settings.payment_details).map(method => (
                                        <PaymentDetailBlock
                                            key={method}
                                            method={method}
                                            detail={settings.payment_details[method]}
                                            total={includeServiceModal ? success.total * 1.10 : success.total}
                                            primary={s.primary}
                                            text={s.text}
                                            fmt={fmt}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Link de seguimiento del pedido */}
                        {success.trackingToken && (
                            <a
                                href={`/carta/pedido/${success.trackingToken}`}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mb-3"
                                style={{ backgroundColor: s.primary, color: '#ffffff' }}
                            >
                                Seguir mi pedido →
                            </a>
                        )}

                        <button
                            onClick={() => setSuccess(null)}
                            className="w-full py-3 rounded-2xl text-sm font-semibold"
                            style={{
                                backgroundColor: ['nequi', 'daviplata', 'pse', 'transferencia'].includes(success.paymentMethod) ? 'transparent' : s.primary,
                                color: ['nequi', 'daviplata', 'pse', 'transferencia'].includes(success.paymentMethod) ? s.primary : '#ffffff',
                                border: ['nequi', 'daviplata', 'pse', 'transferencia'].includes(success.paymentMethod) ? `1.5px solid ${s.primary}` : 'none',
                            }}
                        >
                            Ver la carta
                        </button>
                    </div>
                </div>
            )}

            {/* ── Lightbox: imagen expandida del producto ── */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative max-w-md w-full flex flex-col items-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute -top-10 right-0 flex items-center justify-center h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Cerrar imagen"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <img
                            src={lightbox.url}
                            alt={lightbox.name}
                            className="w-full rounded-2xl object-contain shadow-2xl"
                            style={{ maxHeight: '75vh' }}
                        />
                        <p className="mt-3 text-white/75 text-sm font-medium text-center">
                            {lightbox.name}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
