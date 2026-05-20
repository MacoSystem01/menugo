import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Globe2, LogIn, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    tenantName:  string;
    tenantUrl:   string;
    tenantEmail: string;
}

export default function RegisterSuccess({ tenantName, tenantUrl, tenantEmail }: Props) {
    const loginUrl = `${tenantUrl}/login`;

    return (
        <>
            <Head title="¡Cuenta creada! — Menugo" />
            <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">

                {/* Card central */}
                <div className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-glow space-y-6">

                    {/* Ícono de éxito */}
                    <div className="flex justify-center">
                        <div className="grid h-20 w-20 place-items-center rounded-full bg-accent/15">
                            <CheckCircle2 className="h-10 w-10 text-accent" />
                        </div>
                    </div>

                    {/* Título */}
                    <div>
                        <h1 className="font-display text-3xl font-bold">
                            ¡Todo listo,{' '}
                            <span className="text-gradient-warm">{tenantName}</span>!
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Tu panel de gestión fue creado exitosamente.
                        </p>
                    </div>

                    {/* URL del panel */}
                    <div className="rounded-2xl border border-border bg-muted/40 p-4 text-left space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Globe2 className="h-3.5 w-3.5" /> Tu dominio de acceso
                        </div>
                        <a
                            href={loginUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block font-mono text-sm font-semibold text-primary break-all hover:underline"
                        >
                            {loginUrl}
                        </a>
                        <p className="text-xs text-muted-foreground">
                            Usa el email <span className="font-medium text-foreground">{tenantEmail}</span> y la contraseña que elegiste para iniciar sesión.
                        </p>
                    </div>

                    {/* CTA principal */}
                    <a href={loginUrl} className="block">
                        <Button variant="hero" size="lg" className="w-full gap-2 group">
                            <LogIn className="h-4 w-4" />
                            Ir a mi panel
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </a>

                    {/* Volver */}
                    <Link href="/" className="block">
                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                            Volver al inicio
                        </Button>
                    </Link>
                </div>

                {/* Footer mínimo */}
                <p className="mt-8 text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Menugo
                </p>
            </div>
        </>
    );
}
