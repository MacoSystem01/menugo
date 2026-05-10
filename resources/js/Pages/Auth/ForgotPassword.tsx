import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword() {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Recuperar contraseña" />
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="w-full max-w-sm space-y-8">

                    <div className="flex justify-center">
                        <div className="bg-white rounded-full p-2 shadow-md">
                            <img src="/logo-trans.png" alt="MenuGo" className="h-12 w-auto" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-7 space-y-5">
                        <div>
                            <h2 className="font-display text-xl font-bold text-foreground">Recuperar contraseña</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                            </p>
                        </div>

                        {wasSuccessful && (
                            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                                ✓ Revisa tu correo, enviamos el enlace de recuperación.
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Correo electrónico</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="tu@restaurante.com"
                                    autoComplete="email"
                                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold
                                           text-primary-foreground hover:brightness-110 disabled:opacity-60 transition"
                            >
                                {processing ? 'Enviando…' : 'Enviar enlace'}
                            </button>
                        </form>
                    </div>

                    <div className="text-center">
                        <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition">
                            ← Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
