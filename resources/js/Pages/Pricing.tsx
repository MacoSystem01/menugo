import { Head, Link, router } from '@inertiajs/react';
import { Check, X, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginSearch } from '@/components/LoginSearch';

const plans = [
    {
        key: 'starter',
        name: 'STARTER',
        price: '$20.000',
        period: 'COP / mes',
        desc: 'Ideal para empezar y digitalizar tu menú.',
        badge: null,
        features: ['Carta digital con QR', 'Registro de mesas', 'Módulo de cocina básico', 'Soporte por correo'],
        locked: ['Reportes avanzados', 'Delivery propio', 'Marca Blanca', 'Publicidad Gratuita'],
        cta: 'Elegir Starter',
        variant: 'outline' as const,
        popular: false,
        savings: null,
    },
    {
        key: 'pro',
        name: 'PRO',
        price: '$40.000',
        period: 'COP / mes',
        desc: 'Para negocios en crecimiento que necesitan control.',
        badge: 'Más popular',
        features: ['Todo lo de Starter', 'Gestión de inventario', 'Reportes de ventas', 'Delivery básico', 'Soporte por WhatsApp'],
        locked: ['Marca Blanca', 'Publicidad Gratuita'],
        cta: 'Elegir Pro',
        variant: 'hero' as const,
        popular: true,
        savings: 'Más elegido',
    },
    {
        key: 'premium',
        name: 'PREMIUM',
        price: '$60.000',
        period: 'COP / mes',
        desc: 'Todo incluido, marca blanca y beneficios extra.',
        badge: 'Beneficio total',
        features: ['Todo lo de Pro', 'Marca Blanca en el Menú', 'Publicidad Gratuita en Menugo', 'Delivery sin comisiones', 'Soporte prioritario 24/7'],
        locked: [],
        cta: 'Elegir Premium',
        variant: 'outline' as const,
        popular: false,
        savings: 'Todo incluido',
    },
];

function selectPlan(planKey: string) {
    router.visit(`/register?plan=${planKey}`);
}

export default function Pricing() {
    return (
        <>
            <Head title="Planes y precios — Menugo" />
            <div className="min-h-screen">

                {/* Header */}
                <header className="sticky top-0 z-50 glass">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="bg-white rounded-full p-1.5 shadow transition-transform group-hover:scale-110">
                                <img src="/logo-trans.png" alt="Menugo" className="h-7 w-auto" />
                            </div>
                            <span className="font-display text-xl font-bold tracking-tight">
                                Menu<span className="text-gradient-warm">Go</span>
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <LoginSearch triggerClass="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" />
                            <Link href="/register">
                                <Button variant="hero" size="sm">Empezar gratis</Button>
                            </Link>
                        </div>
                    </div>
                </header>

                <section className="mx-auto max-w-7xl px-6 py-20 text-center">

                    {/* ── Botón volver al inicio ── */}
                    <div className="flex justify-start mb-8">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                Volver al inicio
                            </Button>
                        </Link>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs">
                        <Sparkles className="h-3.5 w-3.5 text-accent" /> Precios transparentes
                    </div>
                    <h1 className="mt-6 font-display text-5xl sm:text-6xl font-bold">
                        Elige tu plan.<br /><span className="text-gradient-warm">Crece sin límites.</span>
                    </h1>
                    <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Acceso completo a todas las funciones. Sin comisiones ocultas.</p>

                    <div className="mt-16 grid gap-5 sm:grid-cols-1 md:grid-cols-3 text-left max-w-6xl mx-auto">
                        {plans.map(p => (
                            <div key={p.key}
                                className={`relative flex flex-col rounded-3xl border p-5 ${p.popular ? 'border-primary bg-card shadow-glow scale-[1.02]' : 'border-border bg-card hover:border-primary/50 transition-colors'}`}>
                                {p.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-warm px-3 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                                        MÁS POPULAR
                                    </div>
                                )}
                                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                                <div className="mt-3 flex items-baseline gap-1">
                                    <span className="font-display text-3xl font-bold tracking-tight">{p.price}</span>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground mt-0.5">{p.period}</span>

                                {p.badge && (
                                    <div className="mt-2">
                                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent border border-accent/20">
                                            {p.badge}
                                        </span>
                                    </div>
                                )}

                                <p className="mt-3 text-xs text-muted-foreground leading-relaxed grow">{p.desc}</p>

                                {/* ── Redirecciona a /register?plan=KEY ── */}
                                <Button
                                    variant={p.variant}
                                    size="sm"
                                    className="mt-5 w-full group"
                                    onClick={() => selectPlan(p.key)}
                                >
                                    {p.cta}
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                </Button>
                                {p.key !== 'starter' && (
                                    <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                                        🎁 15 días de cortesia - Gratis!
                                    </p>
                                )}

                                <ul className="mt-5 space-y-2">
                                    {p.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs text-foreground/90">
                                            <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" /> {f}
                                        </li>
                                    ))}
                                    {p.locked.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground/50 line-through">
                                            <X className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Menugo — Sistema de gestión de restaurantes.
                </footer>
            </div>
        </>
    );
}
