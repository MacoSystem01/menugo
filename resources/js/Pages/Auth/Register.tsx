import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <>
            <Head title="Crear cuenta" />
            <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
                <div className="w-full max-w-sm space-y-8">

                    <div className="flex justify-center">
                        <div className="bg-white rounded-full p-2 shadow-md">
                            <img src="/logo-trans.png" alt="MenuGo" className="h-12 w-auto" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-7 space-y-5">
                        <div>
                            <h2 className="font-display text-xl font-bold text-foreground">Crear cuenta</h2>
                            <p className="text-sm text-muted-foreground mt-1">Regístra tu restaurante en MenuGo</p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Nombre del restaurante</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Mi Restaurante"
                                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Correo electrónico</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="tu@restaurante.com"
                                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
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
                                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Confirmar contraseña</label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold
                                           text-primary-foreground shadow-glow hover:brightness-110
                                           disabled:opacity-60 transition"
                            >
                                {processing ? 'Creando cuenta…' : 'Crear cuenta'}
                            </button>
                        </form>
                    </div>

                    <div className="text-center">
                        <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition">
                            ¿Ya tienes cuenta? Iniciar sesión →
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
