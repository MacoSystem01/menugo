import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { LoginSearch } from '@/components/LoginSearch';
import {
    ArrowRight, Sparkles, Store, BarChart3, Truck, Utensils, ShieldCheck,
    Zap, Globe2, Star, Check, X, Menu, ChevronLeft, ChevronRight,
    Megaphone, Image, LayoutList, BadgePercent, Clock, CheckCircle2,
    Upload, Phone, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Advertisement {
    image_url: string;
    title:     string | null;
    url:       string | null;
}

interface SliderLogo {
    image_url:     string;
    business_name: string | null;
}

/* ─────────────────────────────────────────────
   Datos de planes compartidos entre modal y página
───────────────────────────────────────────── */
const plans = [
    {
        key: 'starter',
        name: 'STARTER',
        emoji: '🎁',
        price: '$0',
        period: 'para siempre',
        savings: 'Gratis',
        popular: false,
    },
    {
        key: 'basico',
        name: 'BÁSICO',
        emoji: '💳',
        price: '$34.900',
        period: '/mes',
        savings: null,
        popular: false,
    },
    {
        key: 'trimestral',
        name: 'TRIMESTRAL',
        emoji: '📦',
        price: '$83.900',
        period: '/3 meses',
        savings: 'Ahorras 20%',
        popular: false,
    },
    {
        key: 'semestral',
        name: 'PRO',
        emoji: '⭐',
        price: '$146.900',
        period: '/6 meses',
        savings: 'Ahorras 30%',
        popular: true,
    },
    {
        key: 'anual',
        name: 'ESCALA',
        emoji: '🏆',
        price: '$230.900',
        period: '/año',
        savings: 'Ahorras 45%',
        popular: false,
    },
];

/* ─────────────────────────────────────────────
   Modal de planes (aparece al entrar a Welcome)
───────────────────────────────────────────── */
function PlansModal({ onClose }: { onClose: () => void }) {
    function selectPlan(planKey: string) {
        router.visit(`/register?plan=${planKey}`);
    }

    // Cerrar con Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        /* Backdrop — overflow-y-auto + min-h-full para que el modal nunca quede fuera del viewport en mobile */
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ background: 'oklch(0 0 0 / 0.75)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="flex min-h-full items-center justify-center px-4 py-6">
            <div
                className="relative w-full max-w-4xl rounded-3xl border border-border overflow-hidden"
                style={{ background: 'oklch(0.14 0.018 50)' }}
            >
                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                    style={{ background: 'oklch(0.20 0.02 50)' }}
                    aria-label="Cerrar"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center gap-4">

                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
                        style={{
                            borderColor: 'oklch(0.85 0.18 110 / 0.4)',
                            background: 'oklch(0.85 0.18 110 / 0.08)',
                            color: 'oklch(0.85 0.18 110)',
                        }}
                    >
                        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        Oferta especial
                    </div>

                    {/* Título */}
                    <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                        Lleva tu negocio al{' '}
                        <span className="text-gradient-warm">siguiente nivel</span>
                    </h2>

                    {/* Subtítulo */}
                    <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                        Suscríbete a Menugo y accede a todas las herramientas para
                        gestionar tu restaurante de forma digital.
                    </p>

                    {/* Grid de planes */}
                    <div className="w-full mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {plans.map((plan) => (
                            <div key={plan.key} className="relative flex flex-col">

                                {/* Badge "MÁS POPULAR" encima del card */}
                                {plan.popular ? (
                                    <div className="mb-1.5 flex justify-center">
                                        <span
                                            className="text-[10px] font-bold tracking-widest rounded-full px-3 py-1"
                                            style={{
                                                background: 'oklch(0.85 0.18 110)',
                                                color: 'oklch(0.18 0.02 50)',
                                            }}
                                        >
                                            MÁS POPULAR
                                        </span>
                                    </div>
                                ) : (
                                    /* Espacio reservado para alinear las cards */
                                    <div className="mb-1.5 h-6.5" />
                                )}

                                {/* Tarjeta — clickeable */}
                                <button
                                    type="button"
                                    onClick={() => selectPlan(plan.key)}
                                    className="flex-1 flex flex-col items-center rounded-2xl p-4 gap-2 transition-all hover:scale-[1.03] hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-primary/60"
                                    style={{
                                        background: plan.popular
                                            ? 'oklch(0.18 0.03 120 / 0.35)'
                                            : 'oklch(0.19 0.02 50)',
                                        border: plan.popular
                                            ? '1.5px solid oklch(0.85 0.18 110 / 0.7)'
                                            : '1px solid oklch(0.30 0.02 55)',
                                    }}
                                >
                                    <span className="text-3xl" role="img" aria-label={plan.name}>
                                        {plan.emoji}
                                    </span>
                                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground">
                                        {plan.name}
                                    </span>
                                    <div className="font-display text-2xl font-bold leading-none">
                                        {plan.price}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {plan.period}
                                    </span>
                                    {plan.savings && (
                                        <span
                                            className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 mt-0.5"
                                            style={{
                                                background: 'oklch(0.85 0.18 110 / 0.15)',
                                                color: 'oklch(0.85 0.18 110)',
                                                border: '1px solid oklch(0.85 0.18 110 / 0.3)',
                                            }}
                                        >
                                            {plan.savings}
                                        </span>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <Button
                        variant="hero"
                        size="lg"
                        className="mt-4 w-full max-w-xs rounded-full text-base font-semibold group"
                        onClick={() => selectPlan('semestral')}
                    >
                        Registrarme ahora
                        <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        15 días de prueba gratis
                    </p>
                </div>
            </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Página principal Welcome
───────────────────────────────────────────── */
export default function Welcome({ advertisements = [], sliderLogos = [] }: { advertisements?: Advertisement[]; sliderLogos?: SliderLogo[] }) {
    const [showPlansModal, setShowPlansModal] = useState(true);

    return (
        <>
            <Head title="Menugo — Sistema multi-restaurante todo en uno" />

            {/* Modal de planes al entrar */}
            {showPlansModal && (
                <PlansModal onClose={() => setShowPlansModal(false)} />
            )}

            <div className="min-h-screen">
                <SiteHeader onOpenPlans={() => setShowPlansModal(true)} />
                <Hero ads={advertisements} />
                <Marquee logos={sliderLogos} />
                <Features />
                <ForEveryone />
                <Advertising ads={advertisements} logos={sliderLogos} />
                <Testimonials />
                <CTA onOpenPlans={() => setShowPlansModal(true)} />
                <SiteFooter />
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────
   Slider de publicidad — encaja en el Hero
───────────────────────────────────────────── */
function HeroSlider({ ads }: { ads: Advertisement[] }) {
    const [current, setCurrent] = useState(0);
    // 'tick' se incrementa al navegar manualmente para reiniciar el intervalo
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (ads.length <= 1) return;
        const id = setInterval(() => setCurrent(c => (c + 1) % ads.length), 5000);
        return () => clearInterval(id);
    }, [ads.length, tick]);

    function goNext() { setCurrent(c => (c + 1) % ads.length);              setTick(t => t + 1); }
    function goPrev() { setCurrent(c => (c - 1 + ads.length) % ads.length); setTick(t => t + 1); }
    function goTo(i: number) { setCurrent(i);                                setTick(t => t + 1); }

    const ad = ads[current];
    const Wrap = ad.url
        ? ({ children }: { children: React.ReactNode }) => (
            <a href={ad.url!} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                {children}
            </a>
          )
        : ({ children }: { children: React.ReactNode }) => <>{children}</>;

    return (
        <div className="relative rounded-3xl shadow-glow border border-border/50 overflow-hidden aspect-4/3 w-full bg-black/20">
            {/* Fondo difuminado para rellenar el espacio sin barras */}
            <img
                key={`bg-${current}`}
                src={ad.image_url}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40 pointer-events-none select-none"
            />
            <Wrap>
                <img
                    key={current}
                    src={ad.image_url}
                    alt={ad.title ?? 'Anuncio'}
                    className="relative w-full h-full object-contain z-10"
                />
            </Wrap>

            {/* Título overlay */}
            {ad.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-5 py-4 pointer-events-none">
                    <p className="font-display text-lg font-bold text-white leading-tight">{ad.title}</p>
                    {ad.url && <p className="text-xs text-white/60 mt-0.5">Ver menú →</p>}
                </div>
            )}

            {/* Prev / Next */}
            {ads.length > 1 && (
                <>
                    <button
                        onClick={goPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/65 transition-colors backdrop-blur-sm"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={goNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/65 transition-colors backdrop-blur-sm"
                        aria-label="Siguiente"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </>
            )}

            {/* Dots */}
            {ads.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {ads.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`rounded-full transition-all ${
                                i === current
                                    ? 'w-5 h-1.5 bg-white'
                                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                            }`}
                            aria-label={`Ir a slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Header — botón "Ver planes" abre el modal
───────────────────────────────────────────── */
function SiteHeader({ onOpenPlans }: { onOpenPlans: () => void }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 glass">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">

                <Link href="/" className="flex items-center gap-3 group shrink-0">
                    {/*
                        Logo grande sin recorte:
                        - Contenedor con dimensiones IGUALES (72×72 px) → círculo perfecto
                        - overflow-hidden → rounded-full hace clip real del contenido
                        - Sin padding interno → imagen usa todo el espacio disponible
                        - object-contain → escala el logo sin distorsión ni recorte
                        - 72 px cabe en el header h-20 (80 px) con 4 px de margen arriba/abajo
                    */}
                    <div className="relative shrink-0">
                        <div className="absolute -inset-1 bg-gradient-warm opacity-40 blur-md rounded-full group-hover:opacity-70 transition-opacity" />
                        <div className="relative h-[72px] w-[72px] rounded-full bg-white shadow-glow overflow-hidden transition-transform group-hover:scale-110">
                            <img
                                src="/logo-trans.png"
                                alt="Menugo"
                                className="h-full w-full object-contain"
                            />
                        </div>
                    </div>
                    <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                        Menu<span className="text-gradient-warm">Go</span>
                    </span>
                </Link>

                {/* Menu desktop */}
                <nav className="hidden items-center gap-10 md:flex">
                    <Link href="/" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Inicio</Link>
                    <a href="#features" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Funciones</a>
                    <Link href="/pricing" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Planes</Link>
                    <a href="#publicidad" className="relative text-base font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1.5">
                        <Megaphone className="h-4 w-4" />
                        Publicidad
                        <span className="absolute -top-2 -right-6 text-[9px] font-black uppercase tracking-wider bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 leading-none">nuevo</span>
                    </a>
                    <a href="#testimonios" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Clientes</a>
                </nav>

                {/* Botones desktop */}
                <div className="hidden md:flex items-center gap-4">
                    <LoginSearch triggerClass="flex items-center gap-1.5 text-base font-medium text-muted-foreground hover:text-foreground transition-colors" />
                    <Button variant="hero" size="lg" onClick={onOpenPlans}>
                        Empezar gratis
                    </Button>
                </div>

                {/* Hamburger móvil */}
                <button
                    className="md:hidden p-2 rounded-xl hover:bg-muted/60 transition-colors"
                    onClick={() => setMobileOpen(o => !o)}
                    aria-label="Abrir Menu"
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Menu móvil desplegable */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border bg-background/98 backdrop-blur-md px-6 py-4 space-y-1">
                    <Link href="/" className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-muted/50 transition-colors" onClick={() => setMobileOpen(false)}>Inicio</Link>
                    <a href="#features" className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-muted/50 transition-colors" onClick={() => setMobileOpen(false)}>Funciones</a>
                    <Link href="/pricing" className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-muted/50 transition-colors" onClick={() => setMobileOpen(false)}>Planes</Link>
                    <a href="#publicidad" className="flex items-center gap-2 rounded-xl px-3 py-3 text-base font-medium text-accent hover:bg-accent/10 transition-colors" onClick={() => setMobileOpen(false)}>
                        <Megaphone className="h-4 w-4" /> Publicidad
                    </a>
                    <a href="#testimonios" className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-muted/50 transition-colors" onClick={() => setMobileOpen(false)}>Clientes</a>
                    <div className="pt-4 mt-2 border-t border-border space-y-3">
                        <LoginSearch triggerClass="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors" />
                        <Button variant="hero" size="lg" onClick={() => { onOpenPlans(); setMobileOpen(false); }} className="w-full">
                            Empezar gratis
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
}


/* ─────────────────────────────────────────────
   Secciones
───────────────────────────────────────────── */
function Hero({ ads }: { ads: Advertisement[] }) {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 lg:pt-32 lg:pb-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs">
                            <Sparkles className="h-3.5 w-3.5 text-accent" />
                            <span className="text-muted-foreground">Nuevo · Panel SuperAdmin global</span>
                        </div>
                        <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                            Un sistema.<br />
                            <span className="text-gradient-warm">Todos tus locales.</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                            Desde food trucks callejeros hasta restaurantes premium — Menugo centraliza Menus, pedidos, mesas, inventario y métricas en un solo lugar.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link href="/register">
                                <Button variant="hero" size="xl" className="group">
                                    Empezar gratis
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href="/pricing">
                                <Button variant="outline" size="xl">Ver planes</Button>
                            </Link>
                        </div>
                        <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> 15 días gratis</div>
                            <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> Suscripción Gratis</div>
                            <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> Cancela cuando quieras</div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative animate-float">
                            <div className="absolute -inset-4 bg-gradient-warm opacity-30 blur-3xl rounded-[3rem]" />
                            {ads.length > 0 ? (
                                <HeroSlider ads={ads} />
                            ) : (
                                <img
                                    src="/images/hero-food.jpg"
                                    alt="Variedad de platos de restaurantes"
                                    className="relative rounded-3xl shadow-glow border border-border/50 object-cover aspect-4/3 w-full"
                                />
                            )}
                        </div>
                        <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-card">
                            <div className="text-xs text-muted-foreground">Pedidos hoy</div>
                            <div className="font-display text-2xl font-bold">1,284</div>
                            <div className="text-xs text-accent">↑ 23% vs ayer</div>
                        </div>
                        <div className="absolute -top-6 -right-6 glass rounded-2xl p-4 shadow-card">
                            <div className="text-xs text-muted-foreground">Locales activos</div>
                            <div className="font-display text-2xl font-bold">47</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

const FALLBACK_NAMES = [
    { name: 'TacoLab',     initials: 'TL' },
    { name: 'Sushi Nori',  initials: 'SN' },
    { name: 'Burger Forge',initials: 'BF' },
    { name: 'Arepa Street',initials: 'AS' },
    { name: 'La Trattoria',initials: 'LT' },
    { name: 'Wok Express', initials: 'WE' },
    { name: 'El Asador',   initials: 'EA' },
    { name: 'Poke House',  initials: 'PH' },
];

function LogoLightbox({ logo, onClose }: { logo: SliderLogo; onClose: () => void }) {
    // Bloquear scroll del body mientras el modal está abierto
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    // Cerrar con ESC
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'oklch(0 0 0 / 0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={onClose}
        >
            {/* Panel principal — detener propagación para no cerrar al hacer clic dentro */}
            <div
                className="relative w-full max-w-sm rounded-3xl border border-border/60 overflow-hidden shadow-2xl"
                style={{
                    background: 'oklch(0.16 0.018 50)',
                    animation: 'lightbox-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Borde superior con gradiente del primary */}
                <div className="h-1 w-full bg-linear-to-r from-primary/60 via-primary to-primary/60" />

                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 h-8 w-8 flex items-center justify-center rounded-full border border-border/60 bg-card/80 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/10 transition-all"
                    aria-label="Cerrar"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                </button>

                {/* Área del logo */}
                <div className="flex flex-col items-center gap-6 px-8 pt-8 pb-7">
                    {/* Marco blanco grande para el logo */}
                    <div
                        className="flex items-center justify-center rounded-2xl bg-white shadow-lg p-6"
                        style={{ width: '220px', height: '180px' }}
                    >
                        <img
                            src={logo.image_url}
                            alt={logo.business_name ?? 'Logo'}
                            className="max-h-full max-w-full object-contain"
                            draggable={false}
                        />
                    </div>

                    {/* Nombre del negocio */}
                    {logo.business_name && (
                        <div className="text-center space-y-1">
                            <h3 className="font-display text-2xl font-black tracking-tight text-foreground leading-tight">
                                {logo.business_name}
                            </h3>
                            <p className="text-xs text-muted-foreground/70 uppercase tracking-[0.2em]">
                                Negocio asociado
                            </p>
                        </div>
                    )}

                    {/* Separador decorativo */}
                    <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 h-px bg-border/40" />
                        <div className="flex gap-1">
                            {[0,1,2].map(i => (
                                <div key={i} className="h-1 w-1 rounded-full bg-primary/50" />
                            ))}
                        </div>
                        <div className="flex-1 h-px bg-border/40" />
                    </div>

                    {/* Badge "Confía en Menugo" */}
                    <div className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/8 px-4 py-2.5">
                        <div className="h-5 w-5 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                            <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-[11px] text-muted-foreground leading-none">Confía en</p>
                            <p className="text-sm font-black text-gradient-warm leading-tight">Menugo</p>
                        </div>
                    </div>
                </div>

                {/* Pie del modal */}
                <div className="px-8 pb-6 text-center">
                    <button
                        onClick={onClose}
                        className="w-full rounded-2xl border border-border/50 bg-muted/30 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

function Marquee({ logos = [] }: { logos?: SliderLogo[] }) {
    const hasLogos = logos.length > 0;
    const [activeLogo, setActiveLogo] = useState<SliderLogo | null>(null);

    /* Garantizar ≥10 tarjetas en el track para un loop visual continuo */
    const track = (() => {
        if (!hasLogos) return [];
        let set = [...logos];
        while (set.length < 10) set = [...set, ...logos];
        return [...set, ...set];   // duplicar para scroll infinito
    })();

    return (
        <>
        <section
            className="relative overflow-hidden border-y border-border/60 py-0"
            style={{ background: 'oklch(0.11 0.016 50)' }}
        >
            {/* Línea decorativa superior */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
            {/* Línea decorativa inferior */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
            {/* Resplandor central sutil */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-1/2 bg-primary/5 blur-3xl" />

            <div className="flex items-stretch min-h-[110px]">

                {/* ── Etiqueta fija izquierda ── */}
                <div
                    className="shrink-0 flex flex-col items-center justify-center gap-1 px-8 py-6 border-r border-border/60 z-10"
                    style={{ background: 'oklch(0.14 0.02 50)' }}
                >
                    <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/80 leading-none">Confían en</span>
                    <span className="font-display text-base font-black text-gradient-warm leading-tight">Menugo</span>
                    <div className="mt-1 flex gap-1">
                        {[0,1,2].map(i => (
                            <div key={i} className="h-0.5 w-3 rounded-full bg-primary/40" />
                        ))}
                    </div>
                </div>

                {/* ── Track con scroll infinito ── */}
                <div
                    className="flex-1 overflow-hidden relative"
                    style={{
                        maskImage: 'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)',
                    }}
                >
                    {hasLogos ? (
                        <div
                            className="animate-marquee flex items-center gap-5 py-5 w-max"
                            style={activeLogo ? { animationPlayState: 'paused' } : {}}
                        >
                            {track.map((logo, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setActiveLogo(logo)}
                                    className="group shrink-0 flex flex-col items-center gap-2.5 rounded-2xl border border-border/50 px-5 py-4 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_oklch(0.7_0.18_110_/_0.15)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                    style={{ background: 'oklch(0.17 0.02 50)', minWidth: '140px' }}
                                    aria-label={`Ver ${logo.business_name ?? 'logo'}`}
                                >
                                    {/* Marco blanco para el logo */}
                                    <div
                                        className="flex items-center justify-center rounded-xl bg-white/95 shadow-sm p-2.5 transition-transform duration-300 group-hover:scale-105"
                                        style={{ width: '80px', height: '64px' }}
                                    >
                                        <img
                                            src={logo.image_url}
                                            alt={logo.business_name ?? `Logo ${i + 1}`}
                                            className="max-h-full max-w-full object-contain"
                                            loading="lazy"
                                            draggable={false}
                                        />
                                    </div>
                                    {logo.business_name && (
                                        <span className="text-[11px] font-bold text-foreground/80 tracking-wide whitespace-nowrap leading-tight text-center group-hover:text-primary transition-colors">
                                            {logo.business_name}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Fallback sin logos reales */
                        <div className="animate-marquee flex items-center gap-5 py-5 w-max">
                            {[...FALLBACK_NAMES, ...FALLBACK_NAMES].map((item, i) => (
                                <div
                                    key={i}
                                    className="shrink-0 flex flex-col items-center gap-2.5 rounded-2xl border border-border/40 px-5 py-4 opacity-40"
                                    style={{ background: 'oklch(0.17 0.02 50)', minWidth: '140px' }}
                                >
                                    <div className="flex items-center justify-center rounded-xl bg-muted/30 text-muted-foreground font-black text-base"
                                        style={{ width: '80px', height: '64px' }}>
                                        {item.initials}
                                    </div>
                                    <span className="text-[11px] font-bold text-muted-foreground/60 tracking-wide whitespace-nowrap">
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* Lightbox — renderizado fuera del section para evitar z-index y overflow:hidden */}
        {activeLogo && (
            <LogoLightbox
                logo={activeLogo}
                onClose={() => setActiveLogo(null)}
            />
        )}
        </>
    );
}

function Features() {
    const features = [
        { icon: Store, title: 'Multi-tenant nativo', desc: 'Cada restaurante con su propio perfil, branding, Menu y equipo. Aislado y seguro.' },
        { icon: BarChart3, title: 'Panel SuperAdmin', desc: 'Métricas globales en tiempo real de todos los locales registrados en la plataforma.' },
        { icon: Utensils, title: 'Menus dinámicos', desc: 'Edita platos, precios y disponibilidad. Cambios en vivo sin reiniciar nada.' },
        { icon: Truck, title: 'Para puestos callejeros', desc: 'Diseñado también para food trucks y carritos. Móvil primero, súper liviano.' },
        { icon: ShieldCheck, title: 'Seguridad por diseño', desc: 'Roles, permisos y RLS. Tus datos y los de tus clientes siempre protegidos.' },
        { icon: Zap, title: 'Velocidad de chef', desc: 'Interfaz pulida para que el equipo se mueva tan rápido como tu cocina.' },
    ];
    return (
        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
            <div className="max-w-2xl">
                <span className="text-sm font-semibold text-primary">FUNCIONES</span>
                <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold">Todo lo que tu operación necesita.</h2>
                <p className="mt-4 text-muted-foreground">Una sola plataforma para gestionar uno o cien locales sin perder el control.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-glow">
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-warm">
                            <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ForEveryone() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 group">
                    <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl group-hover:bg-primary/30 transition-colors" />
                    <Utensils className="h-10 w-10 text-primary" />
                    <h3 className="mt-6 font-display text-3xl font-bold">Restaurantes organizados</h3>
                    <p className="mt-3 text-muted-foreground">Mesas, reservas, comandas, KDS, facturación. Lo que un restaurante moderno necesita para escalar.</p>
                    <ul className="mt-6 space-y-2 text-sm">
                        {['Gestión de mesas y reservas', 'Cocina conectada (KDS)', 'Reportes financieros'].map(i => (
                            <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" />{i}</li>
                        ))}
                    </ul>
                </div>
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 group">
                    <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl group-hover:bg-accent/30 transition-colors" />
                    <Truck className="h-10 w-10 text-accent" />
                    <h3 className="mt-6 font-display text-3xl font-bold">Comida rápida callejera</h3>
                    <p className="mt-3 text-muted-foreground">Para puestos, carritos y food trucks. Cobra, gestiona y crece desde el celular.</p>
                    <ul className="mt-6 space-y-2 text-sm">
                        {['Pedido y cobro express', 'Modo offline', 'QR para tu Menu digital'].map(i => (
                            <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" />{i}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
   Modal de publicidad — wizard 4 pasos
───────────────────────────────────────────── */
type AdType = 'banner' | 'slider' | 'combo';
type ModalStep = 1 | 2 | 3 | 4 | 'done';

const AD_LABELS: Record<AdType, string> = {
    banner: 'Banner Principal',
    slider: 'Slider de Negocios',
    combo:  'Combo publicitario',
};
const AD_PRICES: Record<AdType, string> = {
    banner: '$20.000/mes',
    slider: '$10.000/mes',
    combo:  '$25.000/mes',
};
const AD_IMG_HINT: Record<AdType, string> = {
    banner: 'Recomendado: 1200 × 900 px · JPG, PNG o WEBP · máx. 8 MB',
    slider: 'Recomendado: logo cuadrado 400 × 400 px · JPG, PNG o WEBP · máx. 8 MB',
    combo:  'Sube primero la imagen del banner (1200 × 900 px) · JPG, PNG o WEBP',
};

interface FoundTenant { id: string; name: string; subdomain: string | null; }
interface PayMethod    { id: number; name: string; account_info: string; instructions: string | null; }

function xsrfToken(): string {
    const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

function AdvertisingModal({ type, onClose }: { type: AdType; onClose: () => void }) {
    const [step,           setStep]          = useState<ModalStep>(1);

    // Paso 1 — restaurante
    const [searchQ,        setSearchQ]        = useState('');
    const [searchResults,  setSearchResults]  = useState<FoundTenant[]>([]);
    const [searching,      setSearching]      = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<FoundTenant | null>(null);

    // Paso 2 — identidad
    const [businessName,      setBusinessName]      = useState('');
    const [contactName,       setContactName]        = useState('');
    const [contactEmail,      setContactEmail]       = useState('');
    const [contactPhones,     setContactPhones]      = useState<string[]>(['']);
    const [phoneErrors,       setPhoneErrors]        = useState<string[]>([]);
    // Verificación de identidad contra el tenant
    const [verifying,         setVerifying]          = useState(false);
    const [identityVerified,  setIdentityVerified]   = useState(false);
    const [identityError,     setIdentityError]      = useState('');
    const [verifiedUserName,  setVerifiedUserName]   = useState('');
    const [verifiedRoleLabel, setVerifiedRoleLabel]  = useState('');
    const [verifiedPhone,     setVerifiedPhone]      = useState<string | null>(null);

    // Paso 3 — material
    const [imageFile,      setImageFile]      = useState<File | null>(null);
    const [imagePreview,   setImagePreview]   = useState<string | null>(null);
    const [aiEnhanced,     setAiEnhanced]     = useState(false);

    // Paso 4 — pago
    const [payMethods,     setPayMethods]     = useState<PayMethod[]>([]);
    const [proofFile,      setProofFile]      = useState<File | null>(null);
    const [submitting,     setSubmitting]     = useState(false);
    const [hasProof,       setHasProof]       = useState(false);
    const [error,          setError]          = useState('');

    // Cerrar con Escape
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    // Búsqueda de tenant con debounce
    useEffect(() => {
        if (searchQ.length < 2) { setSearchResults([]); return; }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const r = await fetch(`/api/tenants/search?q=${encodeURIComponent(searchQ)}`);
                setSearchResults(await r.json());
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [searchQ]);

    // Reset verificación cuando cambia el tenant seleccionado
    useEffect(() => {
        setIdentityVerified(false);
        setIdentityError('');
        setVerifiedUserName('');
        setVerifiedRoleLabel('');
        setVerifiedPhone(null);
        setContactEmail('');
        setContactName('');
        setContactPhones(['']);
        setPhoneErrors([]);
    }, [selectedTenant?.id]);

    // Verificación de identidad con debounce (solo si hay tenant seleccionado)
    useEffect(() => {
        if (!selectedTenant) return;
        if (!contactEmail || !contactEmail.includes('@')) {
            setIdentityVerified(false);
            setIdentityError('');
            return;
        }

        setVerifying(true);
        setIdentityVerified(false);
        setIdentityError('');

        const t = setTimeout(async () => {
            try {
                const r = await fetch('/api/advertising/verify-identity', {
                    method:  'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': xsrfToken(),
                    },
                    body: JSON.stringify({ tenant_id: selectedTenant.id, email: contactEmail }),
                });
                const data = await r.json();
                if (data.verified) {
                    setIdentityVerified(true);
                    setVerifiedUserName(data.user_name ?? '');
                    setVerifiedRoleLabel(data.role_label ?? '');
                    setVerifiedPhone(data.user_phone ?? null);
                    // Auto-rellenar nombre si está vacío
                    if (!contactName.trim() && data.user_name) setContactName(data.user_name);
                    // Auto-rellenar primer teléfono con el registrado en el sistema
                    if (data.user_phone) setContactPhones([data.user_phone]);
                } else {
                    setIdentityError(data.message ?? 'No se pudo verificar la identidad.');
                }
            } catch {
                setIdentityError('Error de conexión al verificar. Inténtalo de nuevo.');
            } finally {
                setVerifying(false);
            }
        }, 800);

        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTenant?.id, contactEmail]);

    // Cargar métodos de pago al llegar al paso 4
    useEffect(() => {
        if (step !== 4 || payMethods.length > 0) return;
        fetch('/api/payment-methods').then(r => r.json()).then(setPayMethods).catch(() => {});
    }, [step]);

    function handleImageSelect(file: File) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = e => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    }

    function goNext() {
        setError('');
        if (step === 2) {
            if (!contactEmail.trim()) { setError('El email es obligatorio.'); return; }
            if (!contactName.trim())  { setError('El nombre es obligatorio.'); return; }
            if (!selectedTenant && !businessName.trim()) {
                setError('Ingresa el nombre de tu negocio.'); return;
            }
            // Con tenant seleccionado: la identidad DEBE estar verificada
            if (selectedTenant && verifying) {
                setError('Verificando identidad, espera un momento…'); return;
            }
            if (selectedTenant && !identityVerified) {
                setError(identityError || 'Debes verificar tu identidad como Gerente o Administrador de este restaurante.');
                return;
            }
            // Validar teléfonos: si se ingresó valor, debe tener entre 8 y 10 dígitos
            const pErrors = contactPhones.map(p => {
                const val = p.trim();
                if (!val) return '';           // vacío → opcional, válido
                const digits = val.replace(/\D/g, '');
                if (digits.length <= 7)  return 'Debe tener más de 7 dígitos.';
                if (digits.length > 10)  return 'No puede superar los 10 dígitos.';
                return '';
            });
            if (pErrors.some(e => e)) {
                setPhoneErrors(pErrors);
                setError('Revisa los números de teléfono ingresados.');
                return;
            }
            setPhoneErrors([]);
        }
        if (step === 3 && !imageFile) { setError('Debes subir tu imagen.'); return; }
        setStep(s => ((s as number) + 1) as ModalStep);
    }

    async function handleSubmit() {
        setError('');
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('type',          type);
            fd.append('business_name', selectedTenant?.name ?? businessName);
            fd.append('contact_name',  contactName);
            fd.append('contact_email', contactEmail);
            contactPhones.filter(p => p.trim()).forEach(p => fd.append('contact_phones[]', p.trim()));
            if (selectedTenant) fd.append('tenant_id', selectedTenant.id);
            fd.append('image',        imageFile!);
            fd.append('ai_enhanced',  aiEnhanced ? '1' : '0');
            if (proofFile) fd.append('payment_proof', proofFile);

            const res = await fetch('/api/advertising/request', {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': xsrfToken() },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? 'Error al enviar la solicitud.');
            setHasProof(data.has_proof);
            setStep('done');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Ocurrió un error. Inténtalo de nuevo.');
        } finally {
            setSubmitting(false);
        }
    }

    const STEPS = [
        { n: 1, label: 'Restaurante' },
        { n: 2, label: 'Identidad' },
        { n: 3, label: 'Material' },
        { n: 4, label: 'Pago' },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                style={{ background: 'oklch(0.14 0.018 50)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Cabecera ── */}
                <div className="px-7 pt-7 pb-5 border-b border-border shrink-0">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">
                                {AD_LABELS[type]} · {AD_PRICES[type]}
                            </p>
                            <h2 className="font-display text-xl font-bold text-foreground">
                                {step === 'done' ? '¡Solicitud enviada!' : 'Solicitar espacio publicitario'}
                            </h2>
                        </div>
                        <button onClick={onClose}
                            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Indicador de pasos */}
                    {step !== 'done' && (
                        <div className="flex items-center">
                            {STEPS.map((s, i) => (
                                <div key={s.n} className="flex items-center gap-1 flex-1">
                                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                                        step === s.n ? 'text-accent' : (step as number) > s.n ? 'text-accent/60' : 'text-muted-foreground'
                                    }`}>
                                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                            step === s.n
                                                ? 'bg-accent text-accent-foreground'
                                                : (step as number) > s.n
                                                    ? 'bg-accent/20 text-accent'
                                                    : 'bg-muted text-muted-foreground'
                                        }`}>
                                            {(step as number) > s.n ? <Check className="h-2.5 w-2.5" /> : s.n}
                                        </div>
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`flex-1 h-px mx-2 ${(step as number) > s.n ? 'bg-accent/30' : 'bg-border'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Cuerpo ── */}
                <div className="px-7 py-6 overflow-y-auto flex-1">

                    {/* Paso 1 — Buscar restaurante */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Busca tu restaurante en nuestra plataforma para asociar tu anuncio. Si aún no estás registrado, puedes continuar igual.
                            </p>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQ}
                                    onChange={e => setSearchQ(e.target.value)}
                                    placeholder="Nombre del restaurante o subdominio…"
                                    autoFocus
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 pr-10"
                                />
                                {searching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Resultados */}
                            {searchResults.length > 0 && !selectedTenant && (
                                <div className="rounded-xl border border-border overflow-hidden">
                                    {searchResults.map(t => (
                                        <button key={t.id} type="button"
                                            onClick={() => { setSelectedTenant(t); setSearchQ(''); setSearchResults([]); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0">
                                            <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                                <Store className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                                                <p className="text-xs text-muted-foreground">{t.subdomain ?? t.id}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Tenant seleccionado */}
                            {selectedTenant && (
                                <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
                                    <div className="h-8 w-8 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                                        <Check className="h-4 w-4 text-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground">{selectedTenant.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedTenant.subdomain}</p>
                                    </div>
                                    <button type="button"
                                        onClick={() => { setSelectedTenant(null); setSearchQ(''); }}
                                        className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}

                            {searchQ.length >= 2 && searchResults.length === 0 && !searching && !selectedTenant && (
                                <p className="text-xs text-muted-foreground text-center py-1">
                                    Sin resultados. Continúa e ingresa tu información manualmente.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Paso 2 — Identidad */}
                    {step === 2 && (
                        <div className="space-y-4">

                            {/* Indicador del restaurante asociado */}
                            {selectedTenant ? (
                                <div className="flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5">
                                    <Store className="h-3.5 w-3.5 text-accent shrink-0" />
                                    <span className="text-sm font-semibold text-foreground truncate">{selectedTenant.name}</span>
                                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-accent shrink-0">Restaurante vinculado</span>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                                    <p className="text-xs text-amber-500/80 leading-relaxed">
                                        Sin restaurante vinculado. Ingresa tus datos para continuar.
                                    </p>
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {selectedTenant
                                    ? <>Ingresa el email de tu cuenta <strong className="text-foreground">Gerente o Administrador</strong> en <strong className="text-foreground">{selectedTenant.name}</strong>. Se verificará en tiempo real.</>
                                    : <>Ingresa los datos de contacto de la cuenta <strong className="text-foreground">Gerente o Administrador</strong> de tu negocio.</>
                                }
                            </p>

                            {/* Nombre del negocio — solo si no hay tenant seleccionado */}
                            {!selectedTenant && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                        Nombre del negocio <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" value={businessName}
                                        onChange={e => setBusinessName(e.target.value)}
                                        placeholder="Ej: Tacos La Esquina"
                                        autoFocus
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
                                </div>
                            )}

                            {/* Email — campo principal; dispara la verificación */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                    Email de Gerente/Admin <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={contactEmail}
                                        onChange={e => setContactEmail(e.target.value)}
                                        placeholder="tu@correo.com"
                                        autoFocus={!!selectedTenant}
                                        className={`w-full rounded-xl border px-3 py-2.5 pr-10 text-sm bg-input focus:outline-none focus:ring-2 transition-colors ${
                                            identityVerified
                                                ? 'border-accent/60 focus:ring-accent/40'
                                                : identityError
                                                    ? 'border-red-500/60 focus:ring-red-500/30'
                                                    : 'border-input focus:ring-accent/40'
                                        }`}
                                    />
                                    {/* Indicador de estado de verificación */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {verifying && (
                                            <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                        )}
                                        {!verifying && identityVerified && (
                                            <CheckCircle2 className="h-4 w-4 text-accent" />
                                        )}
                                        {!verifying && identityError && contactEmail.includes('@') && (
                                            <X className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                </div>

                                {/* Resultado de la verificación */}
                                {identityVerified && (
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/8 px-3 py-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                                        <span className="text-xs text-accent font-semibold">
                                            Verificado · {verifiedUserName}
                                        </span>
                                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-accent/70 shrink-0">
                                            {verifiedRoleLabel}
                                        </span>
                                    </div>
                                )}
                                {identityError && !verifying && contactEmail.includes('@') && (
                                    <p className="mt-1.5 text-xs text-red-400 leading-relaxed">{identityError}</p>
                                )}
                            </div>

                            {/* Nombre completo — bloqueado cuando el sistema lo completó desde la verificación */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                    Nombre completo <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={contactName}
                                        onChange={e => { if (!identityVerified) setContactName(e.target.value); }}
                                        readOnly={identityVerified && !!verifiedUserName}
                                        placeholder="Tu nombre y apellido"
                                        className={`w-full rounded-xl border border-input bg-input px-3 py-2.5 text-sm focus:outline-none transition-colors ${
                                            identityVerified && verifiedUserName
                                                ? 'cursor-not-allowed opacity-60 select-none'
                                                : 'focus:ring-2 focus:ring-accent/40'
                                        }`}
                                    />
                                    {identityVerified && verifiedUserName && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <CheckCircle2 className="h-4 w-4 text-accent/60" />
                                        </div>
                                    )}
                                </div>
                                {identityVerified && verifiedUserName && (
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                        Completado automáticamente — no editable.
                                    </p>
                                )}
                            </div>

                            {/* Teléfonos — múltiple, con badge de nombre e ícono + */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        Teléfono{' '}
                                        <span className="normal-case font-normal text-muted-foreground/60">(opcional)</span>
                                    </label>
                                    {contactPhones.length < 3 && (
                                        <button
                                            type="button"
                                            onClick={() => setContactPhones(p => [...p, ''])}
                                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <Plus className="h-3 w-3" /> Agregar otro
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {contactPhones.map((phone, idx) => {
                                        // El primer campo es bloqueado si viene del sistema (verificado)
                                        const isSystemPhone = idx === 0 && identityVerified && !!verifiedPhone;
                                        const displayName   = contactName.trim() || (identityVerified ? verifiedUserName : 'Contacto');
                                        const phoneErr      = phoneErrors[idx] ?? '';
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                {/* Badge con nombre del contacto */}
                                                <div className={`flex items-center gap-1.5 shrink-0 rounded-lg border px-2.5 py-2 h-[42px] ${
                                                    isSystemPhone
                                                        ? 'border-accent/25 bg-accent/5'
                                                        : phoneErr
                                                            ? 'border-red-400/40 bg-red-50/10'
                                                            : 'border-border bg-muted/30'
                                                }`}>
                                                    <Phone className={`h-3.5 w-3.5 shrink-0 ${isSystemPhone ? 'text-accent' : phoneErr ? 'text-red-400' : 'text-muted-foreground'}`} />
                                                    <span className="text-xs font-semibold text-foreground whitespace-nowrap max-w-[80px] truncate">
                                                        {displayName}
                                                    </span>
                                                </div>

                                                {/* Input del número */}
                                                <div className="relative flex-1">
                                                    <input
                                                        type="tel"
                                                        value={phone}
                                                        onChange={e => {
                                                            if (isSystemPhone) return;
                                                            const updated = [...contactPhones];
                                                            updated[idx] = e.target.value;
                                                            setContactPhones(updated);
                                                            // Limpiar error de este campo al editar
                                                            if (phoneErr) setPhoneErrors(errs => {
                                                                const copy = [...errs];
                                                                copy[idx] = '';
                                                                return copy;
                                                            });
                                                        }}
                                                        readOnly={isSystemPhone}
                                                        placeholder="300 000 0000"
                                                        className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none transition-colors ${
                                                            isSystemPhone
                                                                ? 'border-input bg-input cursor-not-allowed opacity-60 select-none'
                                                                : phoneErr
                                                                    ? 'border-red-400 bg-red-50/5 focus:ring-2 focus:ring-red-400/30'
                                                                    : 'border-input bg-input focus:ring-2 focus:ring-accent/40'
                                                        }`}
                                                    />
                                                    {isSystemPhone && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <CheckCircle2 className="h-4 w-4 text-accent/60" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Botón quitar — solo en filas adicionales */}
                                                {idx > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setContactPhones(p => p.filter((_, i) => i !== idx));
                                                            setPhoneErrors(errs => errs.filter((_, i) => i !== idx));
                                                        }}
                                                        className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                                                        title="Quitar"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                </div>
                                                {/* Mensaje de error del teléfono */}
                                                {phoneErr && (
                                                    <p className="text-[11px] text-red-400 pl-1 leading-tight">{phoneErr}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Aviso de seguridad cuando hay tenant */}
                            {selectedTenant && !identityVerified && !identityError && !verifying && (
                                <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                                    <Zap className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
                                    <span>Al ingresar tu email, el sistema verificará automáticamente que tienes permisos de <strong className="text-foreground">Gerente o Administrador</strong> en este restaurante.</span>
                                </div>
                            )}

                            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                        </div>
                    )}

                    {/* Paso 3 — Material publicitario */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground">{AD_IMG_HINT[type]}</p>

                            {/* Zona de carga */}
                            <label className={`block rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                                imagePreview ? 'border-accent/40' : 'border-border hover:border-accent/40'
                            }`}>
                                <input type="file" className="sr-only" accept="image/*"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
                                {imagePreview ? (
                                    <div className="relative group">
                                        <img src={imagePreview} alt="Vista previa"
                                            className="w-full h-48 object-contain rounded-2xl" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-2xl">
                                            <Upload className="h-6 w-6 text-white" />
                                            <p className="text-white text-xs font-semibold">Cambiar imagen</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-3 py-10">
                                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                                            <Image className="h-7 w-7 text-muted-foreground" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-foreground">Haz clic o arrastra tu imagen</p>
                                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP · máx. 8 MB</p>
                                        </div>
                                    </div>
                                )}
                            </label>

                            {/* Toggle IA */}
                            <div className={`rounded-xl border p-4 transition-colors ${aiEnhanced ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Optimizar con IA</p>
                                            <p className="text-xs text-muted-foreground">Formato, contraste y composición</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setAiEnhanced(a => !a)}
                                        className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${aiEnhanced ? 'bg-primary' : 'bg-muted'}`}>
                                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${aiEnhanced ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                                {aiEnhanced && (
                                    <p className="text-xs text-primary/80 mt-3 leading-relaxed">
                                        ✓ Nuestra IA ajustará el encuadre y composición de tu imagen para el máximo impacto visual en el espacio publicitario.
                                    </p>
                                )}
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                        </div>
                    )}

                    {/* Paso 4 — Pago */}
                    {step === 4 && (
                        <div className="space-y-5">
                            {/* Resumen de precio */}
                            <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{AD_LABELS[type]}</p>
                                    <p className="text-xs text-muted-foreground">Facturación mensual</p>
                                </div>
                                <p className="font-display text-2xl font-black text-accent">{AD_PRICES[type]}</p>
                            </div>

                            {/* Métodos de pago */}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Métodos de pago</p>
                                {payMethods.length === 0 ? (
                                    <div className="flex justify-center py-4">
                                        <div className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {payMethods.map(m => {
                                            const isUrl = /^https?:\/\//i.test(m.account_info.trim());
                                            return (
                                                <div key={m.id} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                                                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                                                    {isUrl ? (
                                                        <a
                                                            href={m.account_info.trim()}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-xs text-accent font-mono mt-0.5 hover:underline break-all"
                                                        >
                                                            <ArrowRight className="h-3 w-3 shrink-0" />
                                                            {m.account_info.trim()}
                                                        </a>
                                                    ) : (
                                                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{m.account_info}</p>
                                                    )}
                                                    {m.instructions && (
                                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.instructions}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Comprobante de pago */}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Comprobante de pago</p>
                                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <Zap className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                                        <span>Con comprobante → activación en <strong className="text-foreground">menos de 6 horas</strong></span>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>Sin comprobante → activación en las <strong className="text-foreground">próximas 24 horas</strong></span>
                                    </div>
                                    <label className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                                        proofFile ? 'border-accent/40 bg-accent/5' : 'border-dashed border-border hover:border-accent/40'
                                    }`}>
                                        <input type="file" className="sr-only" accept="image/*,.pdf"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) setProofFile(f); }} />
                                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${proofFile ? 'text-accent' : 'text-muted-foreground'}`} />
                                        <span className="text-xs text-muted-foreground truncate">
                                            {proofFile ? proofFile.name : 'Subir comprobante (opcional) — JPG, PNG, PDF'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        </div>
                    )}

                    {/* Confirmación */}
                    {step === 'done' && (
                        <div className="text-center py-4 space-y-4">
                            <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-8 w-8 text-accent" />
                            </div>
                            <div>
                                <p className="font-display text-lg font-bold text-foreground">¡Tu solicitud fue enviada!</p>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    {hasProof
                                        ? 'Revisaremos tu comprobante y activaremos tu publicidad en menos de 6 horas.'
                                        : 'Tu publicidad será revisada y activada en las próximas 24 horas. Sube tu comprobante para activación más rápida.'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-left space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Zap className="h-3.5 w-3.5 text-accent shrink-0" />
                                    <span>Activación estimada: <strong className="text-foreground">{hasProof ? '< 6 horas' : '< 24 horas'}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                                    <span>Te notificaremos a <strong className="text-foreground">{contactEmail}</strong></span>
                                </div>
                            </div>
                            <button type="button" onClick={onClose}
                                className="w-full rounded-xl bg-accent text-accent-foreground font-bold py-3 text-sm hover:bg-accent/90 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Pie de navegación ── */}
                {step !== 'done' && (
                    <div className="px-7 py-5 border-t border-border flex items-center justify-between gap-3 shrink-0">
                        <button type="button"
                            onClick={() => step === 1 ? onClose() : setStep(s => ((s as number) - 1) as ModalStep)}
                            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                            {step === 1 ? 'Cancelar' : '← Atrás'}
                        </button>

                        {step === 4 ? (
                            <button type="button" onClick={handleSubmit}
                                disabled={submitting || !imageFile}
                                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-50">
                                {submitting ? (
                                    <>
                                        <div className="h-4 w-4 rounded-full border-2 border-accent-foreground/40 border-t-accent-foreground animate-spin" />
                                        Enviando…
                                    </>
                                ) : (
                                    <><Megaphone className="h-4 w-4" /> Enviar solicitud</>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={goNext}
                                disabled={step === 2 && !!selectedTenant && (verifying || (!identityVerified))}
                                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {step === 2 && verifying
                                    ? <><div className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" /> Verificando…</>
                                    : <>Continuar <ArrowRight className="h-4 w-4" /></>
                                }
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Sección de publicidad — dos formatos con precio
───────────────────────────────────────────── */
function Advertising({ ads, logos }: { ads: Advertisement[]; logos: SliderLogo[] }) {
    const adFeatures   = ['Imagen o banner animado en el Hero', 'Link directo a tu menú o sitio web', 'Visible para cada visitante nuevo', 'Rotación automática entre anunciantes'];
    const logoFeatures = ['Tu logo en el carrusel de la landing', 'Nombre de tu negocio debajo del logo', 'Desfile continuo y animado', 'Actualización el mismo día'];

    const [modalType, setModalType] = useState<AdType | null>(null);

    return (
        <>
        {modalType && <AdvertisingModal type={modalType} onClose={() => setModalType(null)} />}

        <section id="publicidad" className="mx-auto max-w-7xl px-6 py-24">

            {/* Encabezado */}
            <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent">
                    <Megaphone className="h-4 w-4" /> Publicidad
                </span>
                <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold leading-tight">
                    Tu negocio frente a{' '}
                    <span className="text-gradient-warm">todos los visitantes</span>
                </h2>
                <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                    Dos formatos publicitarios para que tu marca esté presente cada vez que alguien visita Menugo. Activación inmediata, sin contratos largos.
                </p>
            </div>

            {/* Cards de los dos formatos */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">

                {/* ── Banner principal (MockUp) ── */}
                <div className="group relative rounded-3xl border border-border bg-card overflow-hidden transition-all hover:border-accent/50 hover:shadow-glow">

                    {/* Badge destacado */}
                    <div className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
                        <Image className="h-3 w-3" /> Banner Hero
                    </div>

                    {/* Preview vivo del slot de publicidad */}
                    <div className="relative h-64 overflow-hidden bg-black/10">
                        {ads.length > 0 ? (
                            <>
                                <img
                                    src={ads[0].image_url}
                                    aria-hidden="true"
                                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-30 pointer-events-none"
                                />
                                <img
                                    src={ads[0].image_url}
                                    alt={ads[0].title ?? 'Anuncio demo'}
                                    className="relative w-full h-full object-contain z-10"
                                />
                            </>
                        ) : (
                            /* Placeholder cuando no hay anuncios cargados */
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3"
                                style={{ background: 'linear-gradient(135deg, oklch(0.18 0.04 120 / 0.4), oklch(0.18 0.08 50 / 0.5))' }}>
                                <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-dashed border-accent/40 text-accent/50">
                                    <Image className="h-8 w-8" />
                                </div>
                                <p className="font-display text-lg font-bold text-foreground/60">Tu anuncio aquí</p>
                                <p className="text-xs text-muted-foreground">Formato recomendado: 1200 × 900 px</p>
                            </div>
                        )}

                        {/* Overlay con etiqueta "DEMO" */}
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">Vista previa del espacio publicitario</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido de la tarjeta */}
                    <div className="p-7">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div>
                                <h3 className="font-display text-2xl font-bold text-foreground">Banner Principal</h3>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                    Ocupa el slot más visible de la landing: el hero. Cada visitante nuevo verá tu negocio antes que cualquier otra cosa.
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="font-display text-4xl font-black text-accent leading-none">$20.000</div>
                                <div className="text-xs text-muted-foreground mt-1">por mes</div>
                            </div>
                        </div>

                        <ul className="space-y-2.5 mb-6">
                            {adFeatures.map(f => (
                                <li key={f} className="flex items-center gap-2.5 text-sm">
                                    <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15">
                                        <Check className="h-3 w-3 text-accent" />
                                    </div>
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            onClick={() => setModalType('banner')}
                            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-accent text-accent-foreground font-bold py-3.5 text-sm hover:bg-accent/90 active:scale-95 transition-all"
                        >
                            <Megaphone className="h-4 w-4" />
                            Anunciarme en el Banner · $20.000/mes
                        </button>
                    </div>
                </div>

                {/* ── Slider de logos ── */}
                <div className="group relative rounded-3xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-[0_0_40px_oklch(0.7_0.18_110_/_0.12)]">

                    {/* Badge */}
                    <div className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                        <LayoutList className="h-3 w-3" /> Slider de negocios
                    </div>

                    {/* Preview vivo del slider */}
                    <div className="relative h-64 flex items-center overflow-hidden"
                        style={{ background: 'oklch(0.13 0.015 50)' }}>
                        <div
                            className="flex-1 overflow-hidden"
                            style={{ maskImage: 'linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)' }}
                        >
                            {logos.length > 0 ? (
                                <div className="animate-marquee flex items-center gap-4 py-4 w-max">
                                    {[...logos, ...logos].map((logo, i) => (
                                        <div key={i} className="shrink-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3"
                                            style={{ background: 'oklch(0.20 0.02 50)', minWidth: '130px' }}>
                                            <img src={logo.image_url} alt={logo.business_name ?? ''} className="h-10 w-24 object-contain" loading="lazy" />
                                            {logo.business_name && (
                                                <span className="text-[10px] font-semibold text-muted-foreground tracking-wide whitespace-nowrap">{logo.business_name}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Placeholder logos */
                                <div className="flex items-center gap-4 px-8 py-4">
                                    {['TacoLab', 'Sushi Nori', 'Burger Co.', 'El Asador'].map((name, i) => (
                                        <div key={i} className="shrink-0 flex items-center justify-center rounded-2xl border border-border px-5 py-4 font-display font-bold text-sm opacity-40"
                                            style={{ background: 'oklch(0.20 0.02 50)', minWidth: '120px' }}>
                                            {name}
                                        </div>
                                    ))}
                                    <div className="shrink-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 px-5 py-4 font-display font-bold text-sm text-primary/50"
                                        style={{ background: 'oklch(0.20 0.02 50)', minWidth: '120px' }}>
                                        Tu logo →
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Overlay etiqueta demo */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end px-5 py-4"
                            style={{ background: 'linear-gradient(to top, oklch(0.13 0.015 50 / 0.7) 0%, transparent 50%)' }}>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Vista previa del carrusel</p>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-7">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div>
                                <h3 className="font-display text-2xl font-bold text-foreground">Slider de Negocios</h3>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                    Tu logo desfila continuamente por la banda de la landing. Presencia de marca constante con cada scroll.
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="font-display text-4xl font-black text-primary leading-none">$10.000</div>
                                <div className="text-xs text-muted-foreground mt-1">por mes</div>
                            </div>
                        </div>

                        <ul className="space-y-2.5 mb-6">
                            {logoFeatures.map(f => (
                                <li key={f} className="flex items-center gap-2.5 text-sm">
                                    <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15">
                                        <Check className="h-3 w-3 text-primary" />
                                    </div>
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            onClick={() => setModalType('slider')}
                            className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-primary text-primary font-bold py-3.5 text-sm hover:bg-primary/10 active:scale-95 transition-all"
                        >
                            <LayoutList className="h-4 w-4" />
                            Aparecer en el Slider · $10.000/mes
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Oferta combo ── */}
            <div className="mt-8 rounded-3xl border border-accent/25 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{ background: 'linear-gradient(135deg, oklch(0.18 0.04 120 / 0.15), oklch(0.16 0.02 50 / 0.5))' }}>
                <div className="flex items-center gap-5">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/15 border border-accent/25">
                        <BadgePercent className="h-7 w-7 text-accent" />
                    </div>
                    <div>
                        <p className="font-display text-xl font-bold text-foreground">Combo publicitario</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Banner Hero + Slider de negocios — máxima visibilidad al mejor precio</p>
                    </div>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right">
                        <div className="flex items-baseline gap-2">
                            <span className="line-through text-muted-foreground text-lg">$30.000</span>
                            <span className="font-display text-3xl font-black text-accent">$25.000</span>
                        </div>
                        <div className="text-xs text-accent font-bold">Ahorras $5.000 / mes</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalType('combo')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 active:scale-95 transition-all"
                    >
                        Quiero el combo <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </section>
        </>
    );
}

function Testimonials() {
    const t = [
        { name: 'Camila Restrepo', role: 'Dueña, TacoLab', text: 'Pasé de un cuaderno a controlar 3 puestos desde mi celular. Menugo cambió mi negocio.' },
        { name: 'Mateo Pérez', role: 'Gerente, La Trattoria', text: 'El panel SuperAdmin nos da visibilidad total. Sabemos qué local rinde más cada hora.' },
        { name: 'Lucía Gómez', role: 'Food truck Wok Express', text: 'Lo mejor: funciona offline. Nunca pierdo un pedido aunque se caiga el internet.' },
    ];
    return (
        <section id="testimonios" className="mx-auto max-w-7xl px-6 py-24">
            <div className="text-center max-w-2xl mx-auto">
                <span className="text-sm font-semibold text-primary">TESTIMONIOS</span>
                <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold">Restauranteros que ya cocinan distinto.</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
                {t.map(({ name, role, text }) => (
                    <div key={name} className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex gap-0.5 text-accent">
                            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                        </div>
                        <p className="mt-4 text-sm leading-relaxed">"{text}"</p>
                        <div className="mt-6">
                            <div className="font-semibold text-sm">{name}</div>
                            <div className="text-xs text-muted-foreground">{role}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function CTA({ onOpenPlans }: { onOpenPlans: () => void }) {
    return (
        <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 lg:p-20 text-center">
                <Globe2 className="absolute -top-10 -right-10 h-64 w-64 text-white/5" />
                <h2 className="font-display text-4xl sm:text-6xl font-bold text-primary-foreground">
                    Tu restaurante merece <br className="hidden sm:block" />moverse a la velocidad de hoy.
                </h2>
                <p className="mt-6 text-lg text-primary-foreground/80 max-w-xl mx-auto">
                    Empieza gratis en 60 segundos.
                </p>
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                    <Link href="/register">
                        <Button size="xl" className="bg-background text-foreground hover:bg-background/90">
                            Crear cuenta gratis <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button size="xl" variant="ghost" className="text-primary-foreground hover:bg-white/10" onClick={onOpenPlans}>
                        Ver planes
                    </Button>
                </div>
            </div>
        </section>
    );
}

function SiteFooter() {
    return (
        <footer className="border-t border-border mt-24">
            <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white rounded-full p-1.5 shadow">
                            <img src="/logo-trans.png" alt="Menugo" className="h-6 w-auto" />
                        </div>
                        <span className="font-display text-lg font-bold">Menugo</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">El sistema operativo para restaurantes modernos y puestos de comida.</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Producto</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Funciones</li><li>Planes</li><li>Integraciones</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Recursos</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Centro de ayuda</li><li>Comunidad</li><li>Blog</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Compañía</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Sobre nosotros</li><li>Contacto</li><li>Términos</li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Menugo — Sistema de gestión de restaurantes.
            </div>
        </footer>
    );
}
