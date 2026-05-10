import { Head, Link } from '@inertiajs/react';

const plans = [
    {
        name: 'Básico',
        price: '$0',
        period: 'Gratis para siempre',
        features: ['1 usuario', 'Hasta 50 pedidos/mes', 'Módulo de pedidos QR', 'Soporte por email'],
        cta: 'Empezar gratis',
        href: '/register',
        highlight: false,
    },
    {
        name: 'Pro',
        price: '$29',
        period: 'por mes',
        features: ['Usuarios ilimitados', 'Pedidos ilimitados', 'Todos los módulos', 'Reportes avanzados', 'Soporte prioritario'],
        cta: 'Empezar Pro',
        href: '/register',
        highlight: true,
    },
    {
        name: 'Enterprise',
        price: 'A medida',
        period: 'contáctanos',
        features: ['Multi-sucursal', 'Integraciones personalizadas', 'SLA garantizado', 'Manager dedicado'],
        cta: 'Contactar ventas',
        href: '/register',
        highlight: false,
    },
];

export default function Pricing() {
    return (
        <>
            <Head title="Precios" />
            <div className="min-h-screen bg-background flex flex-col">
                <header className="flex items-center justify-between px-8 py-5 border-b border-border">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-white rounded-full p-1.5 shadow">
                            <img src="/logo-trans.png" alt="MenuGo" className="h-8 w-auto" />
                        </div>
                        <span className="font-display font-bold text-foreground text-lg">MenuGo</span>
                    </Link>
                    <Link href="/login" className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card transition">
                        Iniciar sesión
                    </Link>
                </header>

                <main className="flex-1 flex flex-col items-center px-6 py-20 gap-12">
                    <div className="text-center space-y-3">
                        <h1 className="font-display text-4xl font-bold text-foreground">Planes y precios</h1>
                        <p className="text-muted-foreground max-w-md">Sin costos ocultos. Cancela cuando quieras.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        {plans.map(plan => (
                            <div
                                key={plan.name}
                                className={`rounded-2xl border p-7 flex flex-col gap-5 ${
                                    plan.highlight
                                        ? 'border-primary bg-primary/5 shadow-glow'
                                        : 'border-border bg-card'
                                }`}
                            >
                                {plan.highlight && (
                                    <span className="self-start rounded-full bg-primary/20 border border-primary/30 px-3 py-0.5 text-xs font-semibold text-primary">
                                        Más popular
                                    </span>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">{plan.name}</p>
                                    <p className="font-display text-3xl font-bold text-foreground mt-1">{plan.price}</p>
                                    <p className="text-xs text-muted-foreground">{plan.period}</p>
                                </div>
                                <ul className="flex-1 space-y-2">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                                            <span className="text-primary">✓</span> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={plan.href}
                                    className={`w-full rounded-xl py-2.5 text-sm font-semibold text-center transition ${
                                        plan.highlight
                                            ? 'bg-primary text-primary-foreground hover:brightness-110'
                                            : 'border border-border text-foreground hover:bg-background'
                                    }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}
