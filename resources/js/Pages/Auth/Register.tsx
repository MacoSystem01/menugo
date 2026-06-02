import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Utensils, Zap, Globe2, MapPin, CreditCard, Upload, X, Clock, Landmark, Loader2 } from 'lucide-react';
import { LoginSearch } from '@/components/LoginSearch';

// ── Códigos de país ────────────────────────────────────────────────────────────
const COUNTRY_CODES = [
    { flag: '🇨🇴', name: 'Colombia',          dial: '+57'  },
    { flag: '🇲🇽', name: 'México',             dial: '+52'  },
    { flag: '🇦🇷', name: 'Argentina',          dial: '+54'  },
    { flag: '🇨🇱', name: 'Chile',              dial: '+56'  },
    { flag: '🇵🇪', name: 'Perú',               dial: '+51'  },
    { flag: '🇻🇪', name: 'Venezuela',          dial: '+58'  },
    { flag: '🇪🇨', name: 'Ecuador',            dial: '+593' },
    { flag: '🇧🇴', name: 'Bolivia',            dial: '+591' },
    { flag: '🇵🇾', name: 'Paraguay',           dial: '+595' },
    { flag: '🇺🇾', name: 'Uruguay',            dial: '+598' },
    { flag: '🇵🇦', name: 'Panamá',             dial: '+507' },
    { flag: '🇨🇷', name: 'Costa Rica',         dial: '+506' },
    { flag: '🇬🇹', name: 'Guatemala',          dial: '+502' },
    { flag: '🇭🇳', name: 'Honduras',           dial: '+504' },
    { flag: '🇳🇮', name: 'Nicaragua',          dial: '+505' },
    { flag: '🇸🇻', name: 'El Salvador',        dial: '+503' },
    { flag: '🇩🇴', name: 'Rep. Dominicana',    dial: '+1'   },
    { flag: '🇪🇸', name: 'España',             dial: '+34'  },
    { flag: '🇺🇸', name: 'Estados Unidos',     dial: '+1'   },
    { flag: '🇧🇷', name: 'Brasil',             dial: '+55'  },
] as const;

// ── Tipos ─────────────────────────────────────────────────────────────────────
type EstabType = 'restaurante' | 'puesto' | '';
type PlanKey   = 'starter' | 'basico' | 'trimestral' | 'semestral' | 'anual' | '';

// ── Constantes ─────────────────────────────────────────────────────────────────
const ESTAB_TYPES = [
    { key: 'restaurante' as const, icon: Utensils, label: 'Restaurante',           desc: 'Mesas, comandas, cocina y reportes' },
    { key: 'puesto'      as const, icon: Zap,      label: 'Puesto de Comida Rápida', desc: 'Ágil, móvil y sin complicaciones'  },
];

const PLANS = [
    { key: 'starter'    as const, emoji: '🎁', name: 'STARTER',    price: '$0',        period: 'gratis',   savings: null,          popular: false },
    { key: 'basico'     as const, emoji: '💳', name: 'BÁSICO',     price: '$34.900',   period: '/mes',     savings: null,          popular: false },
    { key: 'trimestral' as const, emoji: '📦', name: 'TRIMESTRAL', price: '$83.900',   period: '/3 meses', savings: 'Ahorras 20%', popular: false },
    { key: 'semestral'  as const, emoji: '⭐', name: 'PRO',        price: '$146.900',  period: '/6 meses', savings: 'Ahorras 30%', popular: true  },
    { key: 'anual'      as const, emoji: '🏆', name: 'ESCALA',     price: '$230.900',  period: '/año',     savings: 'Ahorras 45%', popular: false },
];

const STEPS = ['Negocio', 'Plan', 'Establecimiento', 'Tu cuenta'];

const BENEFITS = [
    '14 días de plan PRO gratis',
    'Migración asistida sin costo',
    'Soporte por WhatsApp',
    'Cancela cuando quieras',
];

// ── Helper subdominio ──────────────────────────────────────────────────────────
function toSlug(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '');
}

// ── Tipo para métodos de pago ──────────────────────────────────────────────────
interface PaymentMethod {
    id:           number;
    name:         string;
    account_info: string;
    instructions: string | null;
}

// ── Detecta si un string es una URL clickeable ─────────────────────────────────
function isUrl(str: string): boolean {
    try { return /^https?:\/\//i.test(str) && Boolean(new URL(str)); }
    catch { return false; }
}

// ── Clase compartida para inputs ───────────────────────────────────────────────
const INPUT = 'w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition';

// ══════════════════════════════════════════════════════════════════════════════
export default function Register() {
    const urlPlan = typeof window !== 'undefined'
        ? (new URLSearchParams(window.location.search).get('plan') ?? '') as PlanKey
        : '' as PlanKey;

    const [step, setStep] = useState(1);

    // Estado local para el teléfono dividido en código + número
    const [phoneCode,   setPhoneCode]   = useState('+57');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Estado del modal de pago
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethods,   setPaymentMethods]   = useState<PaymentMethod[]>([]);
    const [fetchingMethods,  setFetchingMethods]  = useState(false);
    const [activeMethodIdx,  setActiveMethodIdx]  = useState(0);
    const evidenceRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        // paso 1
        type:                  '' as EstabType,
        // paso 2
        plan:                  urlPlan,
        // paso 3
        name:                  '',   // nombre del establecimiento
        subdomain:             '',
        restaurant_address:    '',
        restaurant_lat:        null as number | null,
        restaurant_lng:        null as number | null,
        // paso 4
        owner_name:            '',
        phone:                 '',
        email:                 '',
        password:              '',
        password_confirmation: '',
        evidence:              null as File | null,
    });

    // Auto-generar subdominio a partir del nombre del establecimiento
    useEffect(() => {
        setData('subdomain', toSlug(data.name));
    }, [data.name]);

    // Combinar código de país + número en el campo phone del formulario
    useEffect(() => {
        const num = phoneNumber.trim();
        setData('phone', num ? `${phoneCode} ${num}` : '');
    }, [phoneCode, phoneNumber]);

    // Cargar métodos de pago al abrir el modal
    useEffect(() => {
        if (!showPaymentModal || paymentMethods.length > 0) return;
        setFetchingMethods(true);
        fetch('/api/payment-methods')
            .then(r => r.json())
            .then((data: PaymentMethod[]) => setPaymentMethods(data))
            .catch(() => {})
            .finally(() => setFetchingMethods(false));
    }, [showPaymentModal]);

    // ── Validación por paso ──────────────────────────────────────────────────
    const ok: Record<number, boolean> = {
        1: !!data.type,
        2: !!data.plan,
        3: data.name.trim().length >= 2 && data.subdomain.length >= 2,
        4: !!data.owner_name.trim() && !!data.email.trim() &&
           data.password.length >= 8 && data.password === data.password_confirmation,
    };

    const next = () => { if (ok[step]) setStep(s => Math.min(s + 1, 4)); };
    const prev = () => setStep(s => Math.max(s - 1, 1));

    const submit: FormEventHandler = (e) => { e.preventDefault(); };

    const openPaymentModal = () => {
        if (!ok[4]) return;
        if (data.plan === 'starter') {
            post('/register'); // plan gratuito: submit directo sin modal de pago
        } else {
            setShowPaymentModal(true);
        }
    };

    const confirmAndSubmit = () => {
        setShowPaymentModal(false);
        post('/register');
    };

    const selectedType = ESTAB_TYPES.find(t => t.key === data.type);
    const selectedPlan = PLANS.find(p => p.key === data.plan);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <Head title="Crear cuenta — Menugo" />
            <div className="min-h-screen grid lg:grid-cols-2">

                {/* ════ Panel izquierdo: wizard ════ */}
                <div className="flex items-start justify-center bg-background px-8 py-12 order-2 lg:order-1 overflow-y-auto">
                    <form onSubmit={submit} className="w-full max-w-sm space-y-6">

                        {/* Navegación superior */}
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <ArrowLeft className="h-4 w-4" />
                                Volver al inicio
                            </Link>
                            <LoginSearch triggerClass="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors" />
                        </div>

                        {/* Logo mobile */}
                        <div className="flex lg:hidden justify-center">
                            <div className="bg-white rounded-full p-2 shadow-md">
                                <img src="/logo-trans.png" alt="Menugo" className="h-12 w-auto" />
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Paso {step} de {STEPS.length}</span>
                                <span className="font-medium text-foreground">{STEPS[step - 1]}</span>
                            </div>
                            <div className="flex gap-1.5">
                                {STEPS.map((_, i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-primary' : 'bg-border'}`} />
                                ))}
                            </div>
                        </div>

                        {/* ── Paso 1: Tipo de negocio ──────────────────────── */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div>
                                    <h1 className="font-display text-2xl font-bold">¿Qué tipo de negocio tienes?</h1>
                                    <p className="text-sm text-muted-foreground mt-1">Elige el que mejor describe tu establecimiento.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {ESTAB_TYPES.map(({ key, icon: Icon, label, desc }) => {
                                        const sel = data.type === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setData('type', key)}
                                                className={`flex flex-col items-center text-center gap-2.5 rounded-2xl border p-5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${sel ? 'border-primary bg-primary/10 shadow-glow' : 'border-border bg-card hover:border-primary/40'}`}
                                            >
                                                <div className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${sel ? 'bg-gradient-warm text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-semibold leading-tight ${sel ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                                                </div>
                                                {sel && (
                                                    <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary">
                                                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                            </div>
                        )}

                        {/* ── Paso 2: Plan de suscripción ──────────────────── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div>
                                    <h1 className="font-display text-2xl font-bold">Elige tu plan</h1>
                                    <p className="text-sm text-muted-foreground mt-1">Todos incluyen acceso completo. Sin costos ocultos.</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {PLANS.map(plan => {
                                        const sel = data.plan === plan.key;
                                        return (
                                            <div key={plan.key} className="flex flex-col">
                                                {/* Badge "MÁS POPULAR" (reserva espacio siempre) */}
                                                <div className="mb-1.5 h-5.5 flex justify-center">
                                                    {plan.popular && (
                                                        <span className="text-[10px] font-bold tracking-wider rounded-full px-3 py-0.5 bg-accent text-accent-foreground">
                                                            MÁS POPULAR
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('plan', plan.key)}
                                                    className={`flex-1 flex flex-col items-center text-center rounded-2xl border p-4 gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                                                        sel           ? 'border-primary bg-primary/10 shadow-glow' :
                                                        plan.popular  ? 'border-accent/50 bg-card hover:border-accent' :
                                                                        'border-border bg-card hover:border-primary/40'
                                                    }`}
                                                >
                                                    <span className="text-2xl">{plan.emoji}</span>
                                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{plan.name}</span>
                                                    <span className="font-display text-xl font-bold leading-none">{plan.price}</span>
                                                    <span className="text-[10px] text-muted-foreground">{plan.period}</span>
                                                    {plan.savings && (
                                                        <span className="text-[10px] font-semibold text-accent bg-accent/10 rounded-full px-2 py-0.5">
                                                            {plan.savings}
                                                        </span>
                                                    )}
                                                    {sel && (
                                                        <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary mt-0.5">
                                                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Aviso plan gratuito */}
                                {data.plan === 'starter' && (
                                    <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
                                        <p className="text-sm font-semibold text-accent">Plan gratuito — sin tarjeta requerida</p>
                                        <p className="text-xs text-accent/75 mt-0.5">Tu cuenta se activa de forma inmediata al registrarte.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Paso 3: Datos del establecimiento ────────────── */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <div>
                                    <h1 className="font-display text-2xl font-bold">
                                        {data.type === 'restaurante' ? 'Tu restaurante' : 'Tu puesto'}
                                    </h1>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Este nombre define tu espacio exclusivo dentro de Menugo.
                                    </p>
                                </div>

                                {/* Nombre */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">
                                        Nombre del {data.type === 'restaurante' ? 'restaurante' : 'puesto'}
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder={data.type === 'restaurante' ? 'Ej: La Trattoria' : 'Ej: Tacos El Compa'}
                                        className={INPUT}
                                        autoFocus
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>

                                {/* Subdominio */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">
                                        Subdominio de acceso
                                    </label>
                                    <div className="flex items-center rounded-xl border border-input bg-muted/40 overflow-hidden">
                                        <input
                                            type="text"
                                            value={data.subdomain}
                                            readOnly
                                            disabled
                                            placeholder="minegocio"
                                            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none cursor-default select-all"
                                        />
                                        <span className="pr-4 text-xs text-muted-foreground whitespace-nowrap select-none">.Menugo.com</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Se genera automáticamente a partir del nombre del establecimiento.
                                    </p>
                                    {errors.subdomain && <p className="text-xs text-destructive">{errors.subdomain}</p>}
                                </div>

                                {/* Preview del subdominio */}
                                {data.subdomain && (
                                    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
                                        <Globe2 className="h-4 w-4 text-primary shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tu URL de acceso</p>
                                            <p className="text-sm font-semibold text-primary">{data.subdomain}.Menugo.com</p>
                                        </div>
                                    </div>
                                )}

                                {/* Dirección del establecimiento */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        Dirección del establecimiento
                                        <span className="text-[10px] text-muted-foreground font-normal">(opcional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.restaurant_address}
                                        onChange={e => setData('restaurant_address', e.target.value)}
                                        placeholder="Ej: Carrera 5 #10-20, Cali"
                                        className={INPUT}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Paso 4: Datos del dueño / gerente ────────────── */}
                        {step === 4 && (
                            <div className="space-y-5">
                                <div>
                                    <h1 className="font-display text-2xl font-bold">Datos del administrador</h1>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        El dueño o gerente que administrará la cuenta.
                                    </p>
                                </div>

                                {/* Resumen de lo elegido */}
                                <div className="rounded-xl border border-border bg-card p-3 flex flex-wrap gap-2">
                                    {selectedType && (
                                        <span className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1 font-medium">
                                            {selectedType.label}
                                        </span>
                                    )}
                                    {selectedPlan && (
                                        <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-semibold">
                                            {selectedPlan.emoji} {selectedPlan.name} · {selectedPlan.price}
                                        </span>
                                    )}
                                    {data.subdomain && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent rounded-full px-3 py-1 font-medium">
                                            <Globe2 className="h-3 w-3" />
                                            {data.subdomain}.Menugo.com
                                        </span>
                                    )}
                                </div>

                                {/* Nombre del dueño */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Nombre completo</label>
                                    <input
                                        type="text"
                                        value={data.owner_name}
                                        onChange={e => setData('owner_name', e.target.value)}
                                        placeholder="Ej: Carlos Méndez"
                                        autoComplete="name"
                                        className={INPUT}
                                        autoFocus
                                    />
                                    {errors.owner_name && <p className="text-xs text-destructive">{errors.owner_name}</p>}
                                </div>

                                {/* Teléfono / WhatsApp — código + número */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Teléfono / WhatsApp</label>
                                    <div className="flex rounded-xl border border-input bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary/60 transition">
                                        {/* Selector de código de país */}
                                        <select
                                            value={phoneCode}
                                            onChange={e => setPhoneCode(e.target.value)}
                                            autoComplete="tel-country-code"
                                            className="shrink-0 bg-transparent pl-3 pr-2 py-2.5 text-sm text-foreground border-r border-input focus:outline-none cursor-pointer"
                                            aria-label="Código de país"
                                        >
                                            {COUNTRY_CODES.map((c, i) => (
                                                <option key={`${c.dial}-${i}`} value={c.dial}>
                                                    {c.flag} {c.name} ({c.dial})
                                                </option>
                                            ))}
                                        </select>
                                        {/* Campo de número */}
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                                            placeholder="300 000 0000"
                                            autoComplete="tel-national"
                                            className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                                        />
                                    </div>
                                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Correo electrónico</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        placeholder="tu@restaurante.com"
                                        autoComplete="email"
                                        className={INPUT}
                                    />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                                </div>

                                {/* Contraseñas */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">Contraseña</label>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            placeholder="Mín. 8 caracteres"
                                            autoComplete="new-password"
                                            className={INPUT}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">Confirmar</label>
                                        <input
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            placeholder="Repite"
                                            autoComplete="new-password"
                                            className={INPUT}
                                        />
                                    </div>
                                </div>
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>
                        )}

                        {/* ── Botones de navegación ─────────────────────────── */}
                        <div className="flex gap-3">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={prev}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Atrás
                                </button>
                            )}

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={next}
                                    disabled={!ok[step]}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-warm py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    Continuar <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openPaymentModal}
                                    disabled={processing || !ok[4]}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-warm py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    {processing ? 'Creando cuenta…' : 'Crear cuenta'}
                                    {!processing && <CreditCard className="h-4 w-4" />}
                                </button>
                            )}
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            ¿Ya registraste tu local?{' '}
                            <span className="text-foreground font-medium">
                                Accede desde tu subdominio personalizado.
                            </span>
                        </p>
                    </form>
                </div>

                {/* ════ Panel derecho: promo ════ */}
                <div className="hidden lg:flex relative bg-gradient-hero overflow-hidden order-1 lg:order-2 p-12 flex-col justify-between">
                    <div className="absolute inset-0 bg-gradient-radial opacity-40 pointer-events-none" />
                    <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                    <div className="relative flex items-center gap-3">
                        <div className="bg-white rounded-full p-2 shadow-md">
                            <img src="/logo-trans.png" alt="Menugo" className="h-10 w-auto" />
                        </div>
                        <span className="font-display text-xl font-bold text-primary-foreground">Menugo</span>
                    </div>

                    <div className="relative space-y-6">
                        <h2 className="font-display text-4xl font-bold text-primary-foreground leading-tight">
                            Únete a +500 restaurantes que ya operan con Menugo.
                        </h2>
                        <ul className="space-y-3">
                            {BENEFITS.map(b => (
                                <li key={b} className="flex items-center gap-3 text-primary-foreground">
                                    <div className="grid h-6 w-6 place-items-center rounded-full bg-white/20 shrink-0">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative glass rounded-2xl p-6">
                        <div className="text-3xl font-display font-bold text-primary-foreground">+47%</div>
                        <div className="text-sm text-primary-foreground/80 mt-1">
                            Aumento promedio en ventas el primer trimestre.
                        </div>
                    </div>
                </div>

            </div>
            {/* ── Modal de pago ──────────────────────────────────────────────── */}
            {showPaymentModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={() => !processing && setShowPaymentModal(false)}
                >
                    <div
                        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl flex flex-col overflow-hidden"
                        style={{ maxHeight: '90vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
                            <div>
                                <h2 className="font-display text-lg font-bold text-foreground">Completa tu pago</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Elige el método y sube tu comprobante</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !processing && setShowPaymentModal(false)}
                                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Plan seleccionado */}
                        {selectedPlan && (
                            <div className="px-6 pt-4 shrink-0">
                                <div className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
                                    <span className="text-2xl">{selectedPlan.emoji}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground">Plan {selectedPlan.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedPlan.period}</p>
                                    </div>
                                    <span className="font-display text-xl font-bold text-primary">{selectedPlan.price}</span>
                                </div>
                            </div>
                        )}

                        {/* Cuerpo scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                            {/* Métodos de pago */}
                            {fetchingMethods ? (
                                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-sm">Cargando métodos de pago…</span>
                                </div>
                            ) : paymentMethods.length === 0 ? (
                                <div className="rounded-xl border border-border bg-muted/40 px-4 py-6 text-center">
                                    <Landmark className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                                    <p className="text-sm text-muted-foreground">
                                        No hay métodos de pago configurados. Contáctanos para proceder.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Medios de pago disponibles
                                    </p>
                                    {paymentMethods.map((m, i) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setActiveMethodIdx(i)}
                                            className={`w-full text-left rounded-xl border p-4 transition-all ${
                                                activeMethodIdx === i
                                                    ? 'border-primary bg-primary/8'
                                                    : 'border-border bg-card hover:border-primary/40'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Landmark className="h-4 w-4 shrink-0 text-primary" />
                                                    <span className="font-semibold text-sm text-foreground truncate">{m.name}</span>
                                                </div>
                                                {activeMethodIdx === i && (
                                                    <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                                        <Check className="h-3 w-3 text-primary-foreground" />
                                                    </span>
                                                )}
                                            </div>
                                            {isUrl(m.account_info) ? (
                                                <a
                                                    href={m.account_info}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    onClick={e => e.stopPropagation()}
                                                    className="inline-block mt-1.5 text-sm text-primary underline underline-offset-2 hover:text-primary/80 break-all transition-colors"
                                                >
                                                    {m.account_info}
                                                </a>
                                            ) : (
                                                <p className="text-sm text-muted-foreground mt-1.5 font-mono tracking-wide">
                                                    {m.account_info}
                                                </p>
                                            )}
                                            {m.instructions && (
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed opacity-80">
                                                    {m.instructions}
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Upload de evidencia */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Comprobante de pago
                                    </p>
                                    <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">opcional</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => evidenceRef.current?.click()}
                                    className={`w-full rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                                        data.evidence
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/40'
                                    }`}
                                >
                                    {data.evidence ? (
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                                <Check className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{data.evidence.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(data.evidence.size / 1024).toFixed(0)} KB
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); setData('evidence', null); }}
                                                className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Arrastra o <span className="text-primary font-medium">selecciona</span> tu comprobante
                                            </p>
                                            <p className="text-xs text-muted-foreground/70 mt-0.5">JPG, PNG, PDF, WebP · máx 10 MB</p>
                                        </>
                                    )}
                                </button>
                                <input
                                    ref={evidenceRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={e => {
                                        const f = e.target.files?.[0] ?? null;
                                        setData('evidence', f);
                                        if (evidenceRef.current) evidenceRef.current.value = '';
                                    }}
                                />
                            </div>

                            {/* Info de tiempos de activación */}
                            <div className="rounded-xl bg-muted/60 border border-border px-4 py-3 flex gap-3">
                                <Clock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>
                                        <strong className="text-foreground">Con comprobante:</strong>{' '}
                                        activación en máx. <strong className="text-primary">6 horas</strong>
                                    </p>
                                    <p>
                                        <strong className="text-foreground">Sin comprobante:</strong>{' '}
                                        activación en máx. <strong className="text-foreground">24 horas</strong> una vez validemos el pago
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 pt-3 border-t border-border space-y-2 shrink-0">
                            <button
                                type="button"
                                onClick={confirmAndSubmit}
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-warm py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                {processing
                                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando…</>
                                    : <><CreditCard className="h-4 w-4" /> Confirmar y registrar</>
                                }
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                disabled={processing}
                                className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
