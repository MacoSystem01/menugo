import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function AdminLogin() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/login');
    };

    return (
        <>
            <Head title="Acceso SuperAdmin" />
            <div className="min-h-screen flex items-center justify-center bg-[oklch(0.10_0.01_50)] px-4">
                <div className="w-full max-w-sm space-y-8">

                    {/* Badge */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-white rounded-full p-2.5 shadow-lg">
                            <img src="/logo-trans.png" alt="MenuGo" className="h-12 w-auto" />
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40
                                         bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                            🔒 Zona de acceso restringido
                        </span>
                        <div className="text-center">
                            <h1 className="font-display text-xl font-bold text-foreground">Panel SuperAdmin</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">Solo personal autorizado</p>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-7 space-y-5">
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Correo</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="admin@menugo.com"
                                    autoComplete="email"
                                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-destructive/50 transition"
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Contraseña</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-destructive/50 transition"
                                />
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-destructive py-2.5 text-sm font-semibold
                                           text-white hover:brightness-110 disabled:opacity-60 transition"
                            >
                                {processing ? 'Verificando…' : 'Acceder al panel'}
                            </button>
                        </form>
                    </div>

                    <div className="text-center">
                        <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition">
                            ← Volver al acceso de restaurante
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
