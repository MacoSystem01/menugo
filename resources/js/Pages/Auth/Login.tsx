import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login() {
    const flash = (usePage().props as any).flash as { success?: string } | undefined;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Iniciar sesión" />
            <div className="min-h-screen flex">

                {/* ── Panel izquierdo: hero ── */}
                <div className="hidden lg:flex w-1/2 flex-col justify-between p-12
                                bg-linear-to-br from-[oklch(0.18_0.04_45)] via-[oklch(0.22_0.06_40)] to-[oklch(0.14_0.03_30)]
                                border-r border-border relative overflow-hidden">

                    {/* Círculos decorativos */}
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                    {/* Logo */}
                    <div className="flex items-center gap-3 z-10">
                        <div className="bg-white rounded-full p-2 shadow-md">
                            <img
                                src="/logo-trans.png"
                                alt="Menugo"
                                className="h-12 w-auto object-contain"
                            />
                        </div>
                        <span className="text-2xl font-display font-bold text-foreground">Menugo</span>
                    </div>

                    {/* Centro */}
                    <div className="z-10 space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                            🍽️ Sistema de gestión restaurante
                        </div>
                        <h1 className="font-display text-4xl font-bold leading-tight text-foreground">
                            Todo tu restaurante<br />en un solo lugar
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-md">
                            Gestiona pedidos, cocina, caja, domicilios e inventario desde una plataforma unificada.
                        </p>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            {[
                                { label: 'Pedidos QR', desc: 'Sin contacto' },
                                { label: 'Tiempo real', desc: 'Cocina al instante' },
                                { label: 'Multi-rol', desc: '6 perfiles de acceso' },
                                { label: 'Reportes', desc: 'Datos por hora' },
                            ].map(s => (
                                <div key={s.label} className="rounded-xl border border-border bg-card/50 p-4">
                                    <p className="font-semibold text-foreground text-sm">{s.label}</p>
                                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonio */}
                    <div className="z-10 rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5">
                        <p className="text-sm text-muted-foreground italic">
                            "Desde que usamos Menugo los tiempos de espera bajaron un 40% y los errores en pedidos prácticamente desaparecieron."
                        </p>
                        <p className="mt-2 text-xs font-semibold text-primary">— Carlos M., Chef propietario</p>
                    </div>
                </div>

                {/* ── Panel derecho: formulario ── */}
                <div className="flex flex-1 flex-col items-center justify-center bg-background px-8 py-12">
                    <div className="w-full max-w-sm space-y-8">

                        {/* Logo mobile */}
                        <div className="flex lg:hidden justify-center">
                            <div className="bg-white rounded-full p-2 shadow-md">
                                <img
                                    src="/logo-trans.png"
                                    alt="Menugo"
                                    className="h-12 w-auto object-contain"
                                />
                            </div>
                        </div>

                        <div className="text-center">
                            <h2 className="font-display text-2xl font-bold text-foreground">Bienvenido de vuelta</h2>
                            <p className="text-muted-foreground text-sm mt-1">Ingresa tus credenciales para continuar</p>
                        </div>

                        {flash?.success && (
                            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent text-center">
                                {flash.success}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="block text-sm font-medium text-foreground text-center">Correo electrónico</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="tu@restaurante.com"
                                    autoComplete="email"
                                    className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground text-center
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                                {errors.email && <p className="text-xs text-destructive text-center">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-center gap-2">
                                    <label htmlFor="password" className="text-sm font-medium text-foreground">Contraseña</label>
                                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                                        ¿Olvidaste la contraseña?
                                    </Link>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground text-center
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                                {errors.password && <p className="text-xs text-destructive text-center">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={e => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-input accent-primary"
                                />
                                <label htmlFor="remember" className="text-sm text-muted-foreground">
                                    Recordarme
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold
                                           text-primary-foreground shadow-glow hover:brightness-110
                                           disabled:opacity-60 transition"
                            >
                                {processing ? 'Ingresando…' : 'Ingresar'}
                            </button>
                        </form>

                        {/* Botón de renovación si la cuenta está vencida */}
                        {(usePage().props as any).flash?.tenant_status === 'overdue' && (
                            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3">
                                <p className="text-xs text-destructive">
                                    🔒 Tu suscripción ha vencido. Renueva para recuperar el acceso completo.
                                </p>
                                <a
                                    href={`https://wa.me/${(usePage().props as any).support_whatsapp ?? '573172623919'}?text=${encodeURIComponent('Quiero renovar mi plan de MenúGO')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:brightness-110 transition"
                                >
                                    🔄 Renovar suscripción
                                </a>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
}
