import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { LoginSearch } from '@/components/LoginSearch';
import {
    ArrowRight, Sparkles, Store, BarChart3, Truck, Utensils, ShieldCheck,
    Zap, Globe2, Star, Check, X, Menu, ChevronLeft, ChevronRight,
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
        key: 'mensual',
        name: 'MENSUAL',
        emoji: '💰',
        price: '$30.000',
        period: '/mes',
        savings: null,
        popular: false,
    },
    {
        key: 'trimestral',
        name: 'TRIMESTRAL',
        emoji: '📦',
        price: '$80.000',
        period: '/3 meses',
        savings: 'Ahorras 11%',
        popular: false,
    },
    {
        key: 'semestral',
        name: 'SEMESTRAL',
        emoji: '⭐',
        price: '$220.000',
        period: '/6 meses',
        savings: 'Ahorras 39%',
        popular: true,
    },
    {
        key: 'anual',
        name: 'ANUAL',
        emoji: '🏆',
        price: '$350.000',
        period: '/año',
        savings: 'Ahorras 51%',
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
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'oklch(0 0 0 / 0.75)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative w-full max-w-3xl rounded-3xl border border-border overflow-hidden"
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
                    <div className="w-full mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-warm opacity-40 blur-md rounded-full group-hover:opacity-70 transition-opacity" />
                        <div className="relative bg-white rounded-full p-2 shadow-glow transition-transform group-hover:scale-110">
                            <img src="/logo-trans.png" alt="Menugo" className="h-14 sm:h-20 w-auto" />
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

const FALLBACK_NAMES = ['TacoLab', 'Sushi Nori', 'Burger Forge', 'Arepa Street', 'La Trattoria', 'Wok Express', 'El Asador'];

function Marquee({ logos = [] }: { logos?: SliderLogo[] }) {
    const hasLogos = logos.length > 0;

    /* Duplicar para loop infinito; si hay pocos, rellenar hasta ≥8 primero */
    const track = (() => {
        if (!hasLogos) return [];
        let set = [...logos];
        while (set.length < 8) set = [...set, ...logos];
        return [...set, ...set];
    })();

    return (
        <div className="border-y border-border overflow-hidden" style={{ background: 'oklch(0.13 0.015 50)' }}>
            <div className="flex items-stretch">

                {/* ── Etiqueta fija izquierda ── */}
                <div className="shrink-0 flex flex-col justify-center gap-0.5 px-7 py-5 border-r border-border z-10"
                    style={{ background: 'oklch(0.16 0.018 50)' }}>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Confían en</span>
                    <span className="font-display text-sm font-bold text-gradient-warm leading-none">Menugo</span>
                </div>

                {/* ── Track con scroll infinito ── */}
                <div
                    className="flex-1 overflow-hidden relative"
                    style={{ maskImage: 'linear-gradient(to right, transparent, black 60px, black calc(100% - 60px), transparent)' }}
                >
                    {hasLogos ? (
                        <div className="animate-marquee flex items-center gap-4 py-4 w-max">
                            {track.map((logo, i) => (
                                <div
                                    key={i}
                                    className="shrink-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3 transition-colors hover:border-primary/40"
                                    style={{ background: 'oklch(0.20 0.02 50)', minWidth: '130px' }}
                                >
                                    <img
                                        src={logo.image_url}
                                        alt={logo.business_name ?? `Logo ${i + 1}`}
                                        className="h-12 w-28 object-contain"
                                        loading="lazy"
                                    />
                                    {logo.business_name && (
                                        <span className="text-[10px] font-semibold text-muted-foreground tracking-wide whitespace-nowrap">
                                            {logo.business_name}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Fallback sin logos: nombres en texto */
                        <div className="flex items-center gap-10 px-8 py-6 flex-wrap">
                            {FALLBACK_NAMES.map(name => (
                                <span key={name} className="font-display text-base font-semibold opacity-50 whitespace-nowrap">
                                    {name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
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
