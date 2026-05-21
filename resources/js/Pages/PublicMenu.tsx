import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, X, ChevronLeft, Check, UtensilsCrossed, Bike, Clock, MapPin, AlertTriangle } from 'lucide-react';

// ── Google Maps helpers ───────────────────────────────────────────────────────

function loadMapsScript(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).google?.maps?.places) { resolve(); return; }
        if (document.getElementById('gm-public')) {
            document.getElementById('gm-public')!.addEventListener('load', () => resolve());
            return;
        }
        const s   = document.createElement('script');
        s.id      = 'gm-public';
        s.src     = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es`;
        s.async   = true;
        s.onload  = () => resolve();
        s.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
        document.head.appendChild(s);
    });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R    = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) ** 2
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
    id:          number;
    name:        string;
    description: string | null;
    price:       number;
    image_url:   string | null;
}

interface Category {
    id:          number;
    name:        string;
    description: string | null;
    dishes:      Dish[];
}

interface SocialLinks {
    instagram?: string;
    facebook?:  string;
    whatsapp?:  string;
    tiktok?:    string;
    twitter?:   string;
    youtube?:   string;
}

interface DeliveryZone {
    label:  string;
    min_km: number;
    max_km: number;
    price:  number;
}

interface PaymentDetail {
    titular?:    string;
    numero?:     string;
    link?:       string;
    banco?:      string;
    tipo_cuenta?: string;
    nota?:       string;
}

interface CartaSettings {
    primary_color:      string;
    bg_color:           string;
    text_color:         string;
    logo_size:          string;
    name_size:          string;
    slogan:             string | null;
    slogan_size:        string;
    banner_url:         string | null;
    payment_methods:    string[];
    payment_details:    Record<string, PaymentDetail>;
    social_links:       SocialLinks;
    delivery_enabled:   boolean;
    delivery_min_order: number;
    delivery_zones:     DeliveryZone[];
    restaurant_lat:     number | null;
    restaurant_lng:     number | null;
    google_maps_key:    string | null;
    work_schedule:      Record<string, { activo: boolean; apertura: string; cierre: string }> | null;
}

interface Table {
    id:               number;
    number:           string;
    has_active_orders: boolean;
}

interface Props {
    categories:  Category[];
    tenant_name: string;
    settings:    CartaSettings;
    tables:      Table[];
}

interface CartItem {
    dish:     Dish;
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
    xs: 'text-xs', sm: 'text-sm', md: 'text-base', lg: 'text-lg',
};
const PAYMENT_LABELS: Record<string, string> = {
    efectivo:      'Efectivo',
    pse:           'PSE',
    nequi:         'Nequi',
    daviplata:     'Daviplata',
    tarjeta:       'Tarjeta',
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

export default function PublicMenu({ categories, tenant_name, settings, tables }: Props) {
    const s = {
        primary: settings?.primary_color ?? '#e85d04',
        bg:      settings?.bg_color      ?? '#ffffff',
        text:    settings?.text_color    ?? '#1a1a1a',
    };

    const logoClass   = LOGO_SIZES[settings?.logo_size]    ?? 'h-10';
    const nameClass   = NAME_SIZES[settings?.name_size]    ?? 'text-xl';
    const sloganClass = SLOGAN_SIZES[settings?.slogan_size] ?? 'text-sm';
    const payMethods  = settings?.payment_methods?.length ? settings.payment_methods : ['efectivo'];

    // ── Estado operativo del restaurante ──────────────────────────────────────
    const [closedOverlay, setClosedOverlay] = useState(false);
    useEffect(() => {
        const schedule = settings?.work_schedule;
        if (!schedule) return;
        const DAY_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;
        const now      = new Date();
        const dayKey   = DAY_KEYS[now.getDay()];
        const todaySch = schedule[dayKey];
        if (!todaySch) return;
        if (!todaySch.activo) { setClosedOverlay(true); return; }
        const toMins = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
        const nowMins    = now.getHours() * 60 + now.getMinutes();
        const apertura   = toMins(todaySch.apertura);
        const cierre     = toMins(todaySch.cierre);
        if (nowMins < apertura || nowMins >= cierre) setClosedOverlay(true);
    }, [settings?.work_schedule]);

    // ── Cart state ─────────────────────────────────────────────────────────────
    const [cart,              setCart]              = useState<CartItem[]>([]);
    const [screen,            setScreen]            = useState<Screen>('menu');
    const [submitting,        setSubmitting]        = useState(false);
    const [errors,            setErrors]            = useState<Record<string, string>>({});
    const [success,           setSuccess]           = useState<{ name: string; total: number; paymentMethod: string } | null>(null);
    const [occupiedConfirmed, setOccupiedConfirmed] = useState(false);

    // ── Session timer (10 min) ─────────────────────────────────────────────────
    const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);
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
    const deliveryZones    = settings?.delivery_zones     ?? [];
    const deliveryEnabled  = settings?.delivery_enabled   ?? false;
    const deliveryMinOrder = settings?.delivery_min_order ?? 0;
    const restaurantLat    = settings?.restaurant_lat     ?? null;
    const restaurantLng    = settings?.restaurant_lng     ?? null;
    const googleMapsKey    = settings?.google_maps_key    ?? null;
    const hasMapsConfig    = !!(googleMapsKey && restaurantLat && restaurantLng);

    const addressInputRef        = useRef<HTMLInputElement>(null);
    const [addressValidated,     setAddressValidated]     = useState(false);
    const [deliveryCoords,       setDeliveryCoords]       = useState<{ lat: number; lng: number } | null>(null);
    const [deliveryKm,           setDeliveryKm]           = useState<number | null>(null);
    const [outOfCoverage,        setOutOfCoverage]        = useState(false);
    const [mapsReady,            setMapsReady]            = useState(false);
    const [warnModal,            setWarnModal]            = useState<{ title: string; message: string } | null>(null);
    const [addressSuggestions,   setAddressSuggestions]   = useState<Array<{display_name: string; lat: string; lon: string}>>([]);
    const [showSuggestions,      setShowSuggestions]      = useState(false);
    const [loadingSuggestions,   setLoadingSuggestions]   = useState(false);
    const nominatimTimeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestionsRef         = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState({
        customer_name:     '',
        customer_phone:    '',
        type:              'mesa' as 'mesa' | 'domicilio',
        table_id:          '',
        delivery_address:  '',
        delivery_zone_idx: null as number | null,
        payment_method:    payMethods[0],
        notes:             '',
    });

    function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
    }

    // ── Google Maps: cargar script y adjuntar autocomplete ────────────────────
    useEffect(() => {
        if (!googleMapsKey) return;
        loadMapsScript(googleMapsKey)
            .then(() => setMapsReady(true))
            .catch(() => { /* Maps no disponible, modo sin validación */ });
    }, [googleMapsKey]);

    useEffect(() => {
        if (!mapsReady || !addressInputRef.current || form.type !== 'domicilio') return;

        const ac = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
            types:  ['address'],
            fields: ['formatted_address', 'geometry'],
        });

        const listener = ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;

            const lat  = place.geometry.location.lat() as number;
            const lng  = place.geometry.location.lng() as number;
            const addr = place.formatted_address as string ?? '';

            setField('delivery_address', addr);
            setDeliveryCoords({ lat, lng });
            setAddressValidated(true);
            setOutOfCoverage(false);

            // Calcular distancia y auto-seleccionar zona si hay ubicación del restaurante
            if (restaurantLat && restaurantLng && deliveryZones.length > 0) {
                const km      = haversineKm(restaurantLat, restaurantLng, lat, lng);
                setDeliveryKm(km);
                const zoneIdx = deliveryZones.findIndex(z => km >= z.min_km && km <= z.max_km);
                if (zoneIdx >= 0) {
                    setForm(f => ({ ...f, delivery_zone_idx: zoneIdx, delivery_address: addr }));
                    setOutOfCoverage(false);
                } else {
                    setForm(f => ({ ...f, delivery_zone_idx: null, delivery_address: addr }));
                    setOutOfCoverage(true);
                }
            } else {
                // Sin ubicación del restaurante: solo validar dirección real, zona manual
                setForm(f => ({ ...f, delivery_address: addr }));
            }
        });

        return () => (window as any).google.maps.event.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapsReady, form.type]);

    // Limpiar estado de validación al cambiar la dirección manualmente
    function handleAddressInput(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setField('delivery_address', val);
        setAddressValidated(false);
        setDeliveryCoords(null);
        setDeliveryKm(null);
        setOutOfCoverage(false);
        setForm(f => ({ ...f, delivery_zone_idx: null, delivery_address: val }));

        // Nominatim autocomplete cuando no hay Google Maps key
        if (!googleMapsKey) {
            if (nominatimTimeoutRef.current) clearTimeout(nominatimTimeoutRef.current);
            if (val.trim().length >= 5) {
                nominatimTimeoutRef.current = setTimeout(() => fetchNominatim(val.trim()), 650);
            } else {
                setAddressSuggestions([]);
                setShowSuggestions(false);
            }
        }
    }

    async function fetchNominatim(query: string) {
        setLoadingSuggestions(true);
        try {
            const url  = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=es`;
            const res  = await fetch(url);
            const data = await res.json() as Array<{display_name: string; lat: string; lon: string}>;
            setAddressSuggestions(data);
            setShowSuggestions(data.length > 0);
        } catch {
            setAddressSuggestions([]);
            setShowSuggestions(false);
        } finally {
            setLoadingSuggestions(false);
        }
    }

    function selectNominatimSuggestion(suggestion: { display_name: string; lat: string; lon: string }) {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        setAddressValidated(true);
        setDeliveryCoords({ lat, lng });
        setShowSuggestions(false);
        setAddressSuggestions([]);
        setOutOfCoverage(false);

        if (restaurantLat && restaurantLng && deliveryZones.length > 0) {
            const km      = haversineKm(restaurantLat, restaurantLng, lat, lng);
            setDeliveryKm(km);
            const zoneIdx = deliveryZones.findIndex(z => km >= z.min_km && km <= z.max_km);
            if (zoneIdx >= 0) {
                setForm(f => ({ ...f, delivery_zone_idx: zoneIdx, delivery_address: suggestion.display_name }));
            } else {
                setForm(f => ({ ...f, delivery_zone_idx: null, delivery_address: suggestion.display_name }));
                setOutOfCoverage(true);
            }
        } else {
            setForm(f => ({ ...f, delivery_address: suggestion.display_name }));
        }
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
    const zoneIsAutoDetected = addressValidated && deliveryCoords !== null && restaurantLat !== null && restaurantLng !== null;
    const grandTotal  = totalPrice + deliveryFee;

    // ── Validaciones de domicilio ───────────────────────────────────────────────
    const belowMinOrder = form.type === 'domicilio'
        && deliveryEnabled
        && deliveryMinOrder > 0
        && totalPrice < deliveryMinOrder;

    const missingZone = form.type === 'domicilio'
        && deliveryEnabled
        && deliveryZones.length > 0
        && form.delivery_zone_idx === null
        && !outOfCoverage;

    // Dirección debe validarse via autocomplete (Google Maps o Nominatim) — sin importar si hay key
    const addressNotValidated = form.type === 'domicilio'
        && !addressValidated
        && form.delivery_address.trim().length > 0;

    // ── Submit ─────────────────────────────────────────────────────────────────
    const selectedTable     = form.type === 'mesa' && form.table_id
        ? tables.find(t => String(t.id) === form.table_id) ?? null
        : null;
    const tableIsOccupied   = selectedTable?.has_active_orders ?? false;
    const canSubmit         = (!tableIsOccupied || occupiedConfirmed)
        && !belowMinOrder
        && !missingZone
        && !outOfCoverage
        && !addressNotValidated;

    function submitOrder() {
        if (submitting) return;

        // ── Validaciones con popup ──────────────────────────────────────────────
        if (form.type === 'domicilio') {
            const addr = form.delivery_address.trim();

            if (!addr) {
                setWarnModal({
                    title:   'Dirección requerida',
                    message: 'Ingresa la dirección de entrega antes de confirmar el pedido.',
                });
                return;
            }

            if (!addressValidated) {
                setWarnModal({
                    title:   'Dirección no válida',
                    message: googleMapsKey && mapsReady
                        ? 'Escribe tu dirección y selecciónala del menú de sugerencias de Google Maps para confirmar que es real.'
                        : 'Escribe tu dirección y selecciónala de la lista de sugerencias para confirmar que es una ubicación real. No se aceptan direcciones inventadas.',
                });
                return;
            }

            if (outOfCoverage) {
                setWarnModal({
                    title:   'Fuera de zona de cobertura',
                    message: `Tu dirección está fuera del área de entrega${deliveryKm !== null ? ` (${deliveryKm.toFixed(1)} km del restaurante)` : ''}. Lamentablemente no podemos llegar a esa ubicación.`,
                });
                return;
            }

            if (missingZone) {
                setWarnModal({
                    title:   'Selecciona tu zona de entrega',
                    message: 'Debes elegir una zona de entrega para que podamos calcular el costo del domicilio.',
                });
                return;
            }

            if (belowMinOrder) {
                setWarnModal({
                    title:   'Pedido mínimo no alcanzado',
                    message: `El pedido mínimo para domicilio es ${fmt(deliveryMinOrder)}. Tu pedido actual es ${fmt(totalPrice)}. Agrega ${fmt(deliveryMinOrder - totalPrice)} más para continuar.`,
                });
                return;
            }
        }

        if (!canSubmit) return;
        setSubmitting(true);
        setErrors({});
        const snapshotTotal  = grandTotal;
        const snapshotName   = form.customer_name;
        const snapshotMethod = form.payment_method;
        router.post('/carta/pedido', {
            customer_name:     form.customer_name,
            customer_phone:    form.customer_phone,
            type:              form.type,
            table_id:          form.type === 'mesa' && form.table_id ? parseInt(form.table_id) : null,
            delivery_address:  form.type === 'domicilio' ? form.delivery_address || null : null,
            delivery_zone_idx: form.type === 'domicilio' ? form.delivery_zone_idx : null,
            delivery_lat:      form.type === 'domicilio' && deliveryCoords ? deliveryCoords.lat : null,
            delivery_lng:      form.type === 'domicilio' && deliveryCoords ? deliveryCoords.lng : null,
            payment_method:    form.payment_method,
            notes:             form.notes || null,
            confirmed:         occupiedConfirmed,
            items:             cart.map(i => ({ dish_id: i.dish.id, quantity: i.quantity })),
        }, {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onSuccess: () => {
                setSuccess({ name: snapshotName, total: snapshotTotal, paymentMethod: snapshotMethod });
                setCart([]);
                setScreen('menu');
                setOccupiedConfirmed(false);
                setForm({
                    customer_name: '', customer_phone: '', type: 'mesa',
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
    const todayKey     = DAY_KEYS_NOW[new Date().getDay()];
    const schedule     = settings?.work_schedule ?? null;

    function fmtHour(hhmm: string) {
        const [h, m] = hhmm.split(':').map(Number);
        const ampm   = h >= 12 ? 'p.m.' : 'a.m.';
        const h12    = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: s.bg, color: s.text }}>
            <Head title={`Carta — ${tenant_name}`} />

            {/* ── Overlay restaurante cerrado ── */}
            {closedOverlay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
                        style={{ backgroundColor: s.bg, color: s.text }}>

                        {/* Header */}
                        <div className="px-6 pt-8 pb-5 text-center border-b" style={{ borderColor: 'rgba(128,128,128,0.15)' }}>
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-4"
                                style={{ backgroundColor: `${s.primary}22` }}>
                                <Clock className="h-8 w-8" style={{ color: s.primary }} />
                            </div>
                            <h2 className="text-xl font-bold mb-1">{tenant_name}</h2>
                            <p className="text-sm font-semibold" style={{ color: s.primary }}>
                                Restaurante cerrado
                            </p>
                            <p className="text-xs mt-1 opacity-60">
                                {schedule?.[todayKey]?.activo === false
                                    ? 'Hoy no tenemos servicio. Consulta nuestros horarios.'
                                    : 'En este momento estamos fuera del horario de atención.'}
                            </p>
                        </div>

                        {/* Horarios */}
                        {schedule && (
                            <div className="px-6 py-5 space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-3">
                                    Horario de atención
                                </p>
                                {DAYS_LABELS.map(({ key, label }) => {
                                    const day     = schedule[key];
                                    const isToday = key === todayKey;
                                    return (
                                        <div key={key}
                                            className="flex items-center justify-between text-sm rounded-xl px-3 py-2"
                                            style={{
                                                backgroundColor: isToday ? `${s.primary}18` : 'transparent',
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
                        )}

                        {/* Footer */}
                        <div className="px-6 pb-7 text-center">
                            <p className="text-xs opacity-40">Vuelve pronto · {tenant_name}</p>
                        </div>
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
                className="sticky top-0 z-10 backdrop-blur-md border-b"
                style={{ backgroundColor: `${s.bg}f0`, borderColor: `${s.text}18` }}
            >
                <div className="max-w-5xl mx-auto px-3 sm:px-8 py-2.5 flex items-center gap-3">
                    {/* Logo: limitado a h-9 en móvil para no ocupar demasiado espacio */}
                    <img
                        src="/logo-trans.png"
                        alt={tenant_name}
                        className={`max-h-9 sm:max-h-12 md:${logoClass} w-auto shrink-0 object-contain`}
                    />
                    <div className="min-w-0 flex-1">
                        {/* Nombre: text-base en móvil, tamaño configurado en sm+ */}
                        <h1
                            className={`font-display font-bold leading-tight line-clamp-1 text-base sm:text-lg md:${nameClass}`}
                            style={{ color: s.text }}
                        >
                            {tenant_name}
                        </h1>
                        {settings?.slogan ? (
                            /* Slogan: siempre visible, text-xs en móvil */
                            <p
                                className={`text-xs sm:${sloganClass} line-clamp-1 opacity-70 mt-0.5`}
                                style={{ color: s.text }}
                            >
                                {settings.slogan}
                            </p>
                        ) : (
                            <p className="text-xs opacity-50" style={{ color: s.text }}>Nuestra carta</p>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Índice de categorías ── */}
            {categories.length > 1 && (
                <div
                    className="sticky top-[52px] z-10 backdrop-blur border-b lg:hidden"
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
                                                    {qty === 0 ? (
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
                                                    )}
                                                </div>
                                            </div>
                                            {dish.image_url && (
                                                <img
                                                    src={dish.image_url}
                                                    alt={dish.name}
                                                    className="shrink-0 h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover"
                                                    style={{ border: `1px solid ${s.text}20` }}
                                                />
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
                        key:    string;
                        href:   string;
                        icon:   React.ReactNode;
                        label:  string;
                        bg:     string;
                        glow:   string;
                    };

                    const links: SocialEntry[] = ([
                        sl.instagram && {
                            key: 'instagram', href: sl.instagram,
                            icon: <IgIcon />, label: 'Instagram',
                            bg:   'linear-gradient(135deg,#833ab4 0%,#fd1d1d 50%,#fcb045 100%)',
                            glow: 'rgba(253,29,29,0.45)',
                        },
                        sl.facebook && {
                            key: 'facebook', href: sl.facebook,
                            icon: <FbIcon />, label: 'Facebook',
                            bg:   '#1877F2',
                            glow: 'rgba(24,119,242,0.45)',
                        },
                        sl.whatsapp && {
                            key: 'whatsapp',
                            href: `https://wa.me/${sl.whatsapp.replace(/\D/g, '')}`,
                            icon: <WaIcon />, label: 'WhatsApp',
                            bg:   'linear-gradient(135deg,#128C7E 0%,#25D366 100%)',
                            glow: 'rgba(37,211,102,0.45)',
                        },
                        sl.tiktok && {
                            key: 'tiktok', href: sl.tiktok,
                            icon: <TkIcon />, label: 'TikTok',
                            bg:   'linear-gradient(135deg,#010101 0%,#2d2d2d 100%)',
                            glow: 'rgba(238,29,82,0.40)',
                        },
                        sl.twitter && {
                            key: 'twitter', href: sl.twitter,
                            icon: <XIcon />, label: 'X',
                            bg:   'linear-gradient(135deg,#1a1a1a 0%,#333 100%)',
                            glow: 'rgba(0,0,0,0.35)',
                        },
                        sl.youtube && {
                            key: 'youtube', href: sl.youtube,
                            icon: <YtIcon />, label: 'YouTube',
                            bg:   'linear-gradient(135deg,#c4302b 0%,#ff0000 100%)',
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
                                                chip.style.transform  = 'translateY(-3px) scale(1.12)';
                                                chip.style.boxShadow  = `0 8px 22px ${glow}`;
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            const chip = e.currentTarget.querySelector<HTMLSpanElement>('.social-chip');
                                            if (chip) {
                                                chip.style.transform  = '';
                                                chip.style.boxShadow  = `0 4px 12px ${glow}`;
                                            }
                                        }}
                                    >
                                        <span
                                            className="social-chip h-13 w-13 flex items-center justify-center rounded-2xl"
                                            style={{
                                                background:  bg,
                                                boxShadow:   `0 4px 12px ${glow}`,
                                                color:       '#ffffff',
                                                transition:  'transform 0.2s ease, box-shadow 0.2s ease',
                                                width:  '52px',
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
            {cart.length > 0 && screen === 'menu' && (
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
                        <h2 className="font-display font-bold text-base" style={{ color: s.text }}>Tu pedido</h2>
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
                                    <button
                                        onClick={() => addItem(item.dish)}
                                        className="h-7 w-7 flex items-center justify-center rounded-full"
                                        style={{ color: s.primary }}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
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
                        <button
                            onClick={() => setScreen('checkout')}
                            className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                            style={{ backgroundColor: s.primary, color: '#ffffff' }}
                        >
                            Hacer pedido
                        </button>
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
                        <h2 className="font-display font-bold text-base" style={{ color: s.text }}>Datos del pedido</h2>
                        <div className="w-9" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

                        {/* Nombre */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium" style={{ color: s.text }}>
                                Nombre completo <span style={{ color: s.primary }}>*</span>
                            </label>
                            <input
                                className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none"
                                style={{
                                    borderColor:     errors.customer_name ? '#ef4444' : `${s.text}25`,
                                    backgroundColor: `${s.text}06`,
                                    color:           s.text,
                                }}
                                placeholder="Tu nombre completo"
                                value={form.customer_name}
                                onChange={e => setField('customer_name', e.target.value)}
                            />
                            {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name}</p>}
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium" style={{ color: s.text }}>
                                Teléfono de contacto <span style={{ color: s.primary }}>*</span>
                            </label>
                            <input
                                type="tel"
                                className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none"
                                style={{
                                    borderColor:     errors.customer_phone ? '#ef4444' : `${s.text}25`,
                                    backgroundColor: `${s.text}06`,
                                    color:           s.text,
                                }}
                                placeholder="3001234567"
                                value={form.customer_phone}
                                onChange={e => setField('customer_phone', e.target.value)}
                            />
                            {errors.customer_phone && <p className="text-xs text-red-500">{errors.customer_phone}</p>}
                        </div>

                        {/* Tipo de servicio */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium" style={{ color: s.text }}>Tipo de servicio</label>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { val: 'mesa'      as const, Icon: UtensilsCrossed, label: 'Mesa' },
                                    { val: 'domicilio' as const, Icon: Bike,            label: 'Domicilio' },
                                ]).map(({ val, Icon, label }) => (
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
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors"
                                        style={{
                                            borderColor:     form.type === val ? s.primary : `${s.text}20`,
                                            backgroundColor: form.type === val ? `${s.primary}15` : 'transparent',
                                            color:           form.type === val ? s.primary : s.text,
                                        }}
                                    >
                                        <Icon className="h-4 w-4" /> {label}
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
                                            const occupied   = t.has_active_orders;
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
                                                        borderColor:     isSelected ? s.primary : occupied ? '#f97316' : `${s.text}20`,
                                                        backgroundColor: isSelected ? `${s.primary}20` : occupied ? 'rgba(249,115,22,0.08)' : 'transparent',
                                                        color:           isSelected ? s.primary : occupied ? '#f97316' : s.text,
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

                                <div className="relative">
                                    <input
                                        ref={addressInputRef}
                                        type="text"
                                        className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none pr-9"
                                        style={{
                                            borderColor:     errors.delivery_address || outOfCoverage
                                                ? '#ef4444'
                                                : addressValidated
                                                ? '#22c55e'
                                                : `${s.text}25`,
                                            backgroundColor: `${s.text}06`,
                                            color:           s.text,
                                        }}
                                        placeholder="Escribe tu dirección y selecciónala de la lista…"
                                        value={form.delivery_address}
                                        onChange={handleAddressInput}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                        onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                                        autoComplete="off"
                                    />
                                    {/* Indicador de estado */}
                                    {form.delivery_address.trim() && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base">
                                            {outOfCoverage          ? '🚫'
                                             : addressValidated     ? '✓'
                                             : loadingSuggestions   ? '⏳'
                                             : ''}
                                        </span>
                                    )}

                                    {/* Sugerencias Nominatim */}
                                    {!googleMapsKey && showSuggestions && addressSuggestions.length > 0 && (
                                        <div
                                            ref={suggestionsRef}
                                            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border shadow-xl overflow-hidden"
                                            style={{ backgroundColor: s.bg, borderColor: `${s.text}20` }}
                                        >
                                            {addressSuggestions.map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    className="w-full px-3 py-2.5 text-left text-xs transition-colors flex items-start gap-2"
                                                    style={{
                                                        color:        s.text,
                                                        borderBottom: idx < addressSuggestions.length - 1 ? `1px solid ${s.text}10` : 'none',
                                                    }}
                                                    onMouseDown={e => { e.preventDefault(); selectNominatimSuggestion(suggestion); }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${s.text}08`}
                                                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
                                                >
                                                    <MapPin className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />
                                                    <span className="leading-relaxed">{suggestion.display_name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Error o estado */}
                                {errors.delivery_address && (
                                    <p className="text-xs text-red-500">{errors.delivery_address}</p>
                                )}
                                {outOfCoverage && !errors.delivery_address && (
                                    <div className="flex items-start gap-1.5 rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2">
                                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-500">
                                            Esta dirección está fuera de nuestra zona de cobertura
                                            {deliveryKm !== null ? ` (${deliveryKm.toFixed(1)} km)` : ''}.
                                        </p>
                                    </div>
                                )}
                                {addressNotValidated && !outOfCoverage && form.delivery_address.trim() && (
                                    <p className="text-xs" style={{ color: s.text, opacity: 0.55 }}>
                                        {googleMapsKey && mapsReady
                                            ? 'Selecciona una dirección del menú de Google Maps para validarla.'
                                            : 'Selecciona una opción de la lista de sugerencias para confirmar la dirección.'}
                                    </p>
                                )}
                                {addressValidated && deliveryKm !== null && !outOfCoverage && (
                                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#22c55e' }}>
                                        <Check className="h-3 w-3" />
                                        Dirección válida · {deliveryKm.toFixed(1)} km del restaurante
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Zona de entrega */}
                        {form.type === 'domicilio' && deliveryEnabled && deliveryZones.length > 0 && !outOfCoverage && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: s.text }}>
                                    Zona de entrega
                                </label>

                                {zoneIsAutoDetected && selectedZone ? (
                                    <div
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm"
                                        style={{
                                            borderColor:     s.primary,
                                            backgroundColor: `${s.primary}12`,
                                            color:           s.text,
                                        }}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Check className="h-3.5 w-3.5 shrink-0" style={{ color: s.primary }} />
                                            <span>
                                                <span className="font-medium">{selectedZone.label}</span>
                                                <span className="opacity-55 ml-2 text-xs">
                                                    {selectedZone.min_km}–{selectedZone.max_km} km
                                                </span>
                                            </span>
                                        </span>
                                        <span className="font-bold shrink-0" style={{ color: s.primary }}>
                                            {selectedZone.price === 0 ? 'Gratis' : fmt(selectedZone.price)}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1.5">
                                            {deliveryZones.map((zone, idx) => {
                                                const selected = form.delivery_zone_idx === idx;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setForm(f => ({ ...f, delivery_zone_idx: idx }));
                                                            if (errors.delivery_zone_idx) setErrors(e => { const n = { ...e }; delete n.delivery_zone_idx; return n; });
                                                        }}
                                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors text-left"
                                                        style={{
                                                            borderColor:     selected ? s.primary : missingZone ? '#ef4444' : `${s.text}20`,
                                                            backgroundColor: selected ? `${s.primary}12` : 'transparent',
                                                            color:           s.text,
                                                        }}
                                                    >
                                                        <span>
                                                            <span className="font-medium">{zone.label}</span>
                                                            <span className="opacity-55 ml-2 text-xs">
                                                                {zone.min_km}–{zone.max_km} km
                                                            </span>
                                                        </span>
                                                        <span className="font-bold shrink-0" style={{ color: selected ? s.primary : s.text }}>
                                                            {zone.price === 0 ? 'Gratis' : fmt(zone.price)}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {(missingZone || errors.delivery_zone_idx) && (
                                            <p className="text-xs text-red-500">
                                                {errors.delivery_zone_idx ?? 'Selecciona una zona de entrega para continuar.'}
                                            </p>
                                        )}
                                    </>
                                )}

                                {/* Pedido mínimo */}
                                {deliveryMinOrder > 0 && (
                                    <div
                                        className="rounded-xl px-3 py-2 text-xs font-medium"
                                        style={{
                                            backgroundColor: belowMinOrder ? 'rgba(239,68,68,0.1)' : `${s.text}08`,
                                            color:           belowMinOrder ? '#ef4444' : s.text,
                                            opacity:         belowMinOrder ? 1 : 0.65,
                                            border:          belowMinOrder ? '1px solid rgba(239,68,68,0.35)' : 'none',
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
                                    color:           belowMinOrder ? '#ef4444' : s.text,
                                    opacity:         belowMinOrder ? 1 : 0.65,
                                    border:          belowMinOrder ? '1px solid rgba(239,68,68,0.35)' : 'none',
                                }}
                            >
                                {belowMinOrder
                                    ? `⚠ Mínimo para domicilio: ${fmt(deliveryMinOrder)} — faltan ${fmt(deliveryMinOrder - totalPrice)}`
                                    : `Pedido mínimo para domicilio: ${fmt(deliveryMinOrder)}`
                                }
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
                                            borderColor:     form.payment_method === method ? s.primary : `${s.text}20`,
                                            backgroundColor: form.payment_method === method ? `${s.primary}15` : 'transparent',
                                            color:           form.payment_method === method ? s.primary : s.text,
                                        }}
                                    >
                                        {PAYMENT_LABELS[method] ?? method}
                                    </button>
                                ))}
                            </div>
                            {errors.payment_method && <p className="text-xs text-red-500">{errors.payment_method}</p>}
                        </div>

                        {/* Notas */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium opacity-70" style={{ color: s.text }}>
                                Notas <span className="font-normal opacity-60">(opcional)</span>
                            </label>
                            <textarea
                                rows={2}
                                className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none resize-none"
                                style={{
                                    borderColor:     `${s.text}20`,
                                    backgroundColor: `${s.text}06`,
                                    color:           s.text,
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
                    </div>

                    <div className="px-4 py-4 border-t shrink-0" style={{ borderColor: `${s.text}15` }}>
                        <button
                            onClick={submitOrder}
                            disabled={submitting}
                            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ backgroundColor: s.primary, color: '#ffffff' }}
                        >
                            {submitting
                                ? 'Enviando pedido...'
                                : tableIsOccupied && !occupiedConfirmed
                                ? 'Confirma el pedido nuevo arriba ↑'
                                : `Confirmar pedido · ${fmt(grandTotal)}`}
                        </button>
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

            {/* ── Temporizador fijo esquina inferior izquierda ── */}
            {timeLeft !== null && (
                <div
                    className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg"
                    style={{ backgroundColor: timerColor(timeLeft, s.primary), color: '#ffffff' }}
                >
                    <Clock className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold leading-none">Vigencia Toma Pedido:</span>
                    <span className="font-mono text-sm font-bold leading-none">{fmtTimer(timeLeft)}</span>
                </div>
            )}

            {/* ── Modal de éxito ── */}
            {success && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center p-6"
                    style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
                        style={{ backgroundColor: s.bg }}
                    >
                        <div
                            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${s.primary}20` }}
                        >
                            <Check className="h-8 w-8" style={{ color: s.primary }} />
                        </div>
                        <h2 className="font-display text-2xl font-bold mb-1" style={{ color: s.text }}>
                            ¡Pedido enviado!
                        </h2>
                        <p className="text-sm opacity-65 mb-4" style={{ color: s.text }}>
                            Gracias, {success.name}. Tu pedido ha sido recibido.
                        </p>
                        <p className="font-display text-3xl font-bold mb-5" style={{ color: s.primary }}>
                            {fmt(success.total)}
                        </p>

                        {/* Bloque de pago Nequi */}
                        {success.paymentMethod === 'nequi' && (() => {
                            const detail   = settings.payment_details?.nequi;
                            const phone    = detail?.numero?.replace(/\D/g, '');
                            const amount   = Math.round(success.total);
                            const nequiUrl = detail?.link
                                ? detail.link
                                : phone
                                    ? `https://www.nequi.com.co/cobrar?cuenta=${phone}&monto=${amount}`
                                    : null;
                            return (
                                <div
                                    className="w-full mb-5 rounded-2xl border p-4 space-y-3 text-left"
                                    style={{ borderColor: `${s.primary}40`, backgroundColor: `${s.primary}08` }}
                                >
                                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.primary }}>
                                        Paga con Nequi
                                    </p>
                                    {detail?.titular && (
                                        <p className="text-sm" style={{ color: s.text }}>
                                            <span className="opacity-60">Titular: </span>
                                            <strong>{detail.titular}</strong>
                                        </p>
                                    )}
                                    {phone && (
                                        <p className="text-sm" style={{ color: s.text }}>
                                            <span className="opacity-60">Número: </span>
                                            <strong className="font-mono tracking-wider">{detail?.numero}</strong>
                                        </p>
                                    )}
                                    <p className="text-sm" style={{ color: s.text }}>
                                        <span className="opacity-60">Monto a pagar: </span>
                                        <strong>{fmt(success.total)}</strong>
                                    </p>
                                    {detail?.nota && (
                                        <p className="text-xs opacity-60" style={{ color: s.text }}>{detail.nota}</p>
                                    )}
                                    {nequiUrl ? (
                                        <a
                                            href={nequiUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mt-1"
                                            style={{ backgroundColor: s.primary, color: '#ffffff' }}
                                        >
                                            Abrir Nequi para pagar →
                                        </a>
                                    ) : (
                                        <p className="text-xs opacity-60" style={{ color: s.text }}>
                                            Realiza la transferencia al número indicado y menciona tu pedido.
                                        </p>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Bloque de pago Daviplata */}
                        {success.paymentMethod === 'daviplata' && (() => {
                            const detail      = settings.payment_details?.daviplata;
                            const phone       = detail?.numero?.replace(/\D/g, '');
                            const daviplataUrl = detail?.link ?? null;
                            return (
                                <div
                                    className="w-full mb-5 rounded-2xl border p-4 space-y-3 text-left"
                                    style={{ borderColor: `${s.primary}40`, backgroundColor: `${s.primary}08` }}
                                >
                                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.primary }}>
                                        Paga con Daviplata
                                    </p>
                                    {detail?.titular && (
                                        <p className="text-sm" style={{ color: s.text }}>
                                            <span className="opacity-60">Titular: </span>
                                            <strong>{detail.titular}</strong>
                                        </p>
                                    )}
                                    {phone && (
                                        <p className="text-sm" style={{ color: s.text }}>
                                            <span className="opacity-60">Número: </span>
                                            <strong className="font-mono tracking-wider">{detail?.numero}</strong>
                                        </p>
                                    )}
                                    <p className="text-sm" style={{ color: s.text }}>
                                        <span className="opacity-60">Monto a pagar: </span>
                                        <strong>{fmt(success.total)}</strong>
                                    </p>
                                    {detail?.nota && (
                                        <p className="text-xs opacity-60" style={{ color: s.text }}>{detail.nota}</p>
                                    )}
                                    {daviplataUrl ? (
                                        <a
                                            href={daviplataUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mt-1"
                                            style={{ backgroundColor: s.primary, color: '#ffffff' }}
                                        >
                                            Abrir Daviplata para pagar →
                                        </a>
                                    ) : (
                                        <p className="text-xs opacity-60" style={{ color: s.text }}>
                                            Realiza la transferencia al número indicado y menciona tu pedido.
                                        </p>
                                    )}
                                </div>
                            );
                        })()}

                        <button
                            onClick={() => setSuccess(null)}
                            className="w-full py-3 rounded-2xl text-sm font-semibold"
                            style={{
                                backgroundColor: ['nequi', 'daviplata'].includes(success.paymentMethod) ? 'transparent' : s.primary,
                                color:           ['nequi', 'daviplata'].includes(success.paymentMethod) ? s.primary : '#ffffff',
                                border:          ['nequi', 'daviplata'].includes(success.paymentMethod) ? `1.5px solid ${s.primary}` : 'none',
                            }}
                        >
                            Ver la carta
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
