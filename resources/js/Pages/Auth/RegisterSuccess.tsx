import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Clock, Globe2, LogIn, ArrowRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    tenantName:    string;
    tenantUrl:     string;
    tenantEmail:   string;
    paymentStatus: 'pending_payment' | 'pending_review' | 'active';
    hasEvidence:   boolean;
}

export default function RegisterSuccess({ tenantName, tenantUrl, tenantEmail, paymentStatus, hasEvidence }: Props) {
    const loginUrl = `${tenantUrl}/login`;
    const isPending = paymentStatus === 'pending_payment' || paymentStatus === 'pending_review';

    return (
        <>
            <Head title="¡Cuenta creada! — Menugo" />
            <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">

                <div className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-glow space-y-6">

                    {/* Ícono */}
                    <div className="flex justify-center">
                        <div className={`grid h-20 w-20 place-items-center rounded-full ${isPending ? 'bg-amber-500/15' : 'bg-accent/15'}`}>
                            {isPending
                                ? <Clock className="h-10 w-10 text-amber-500" />
                                : <CheckCircle2 className="h-10 w-10 text-accent" />
                            }
                        </div>
                    </div>

                    {/* Título */}
                    <div>
                        {isPending ? (
                            <>
                                <h1 className="font-display text-3xl font-bold">
                                    ¡Registro exitoso,{' '}
                                    <span className="text-gradient-warm">{tenantName}</span>!
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Tu cuenta está pendiente de activación. Te notificaremos por email cuando esté lista.
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="font-display text-3xl font-bold">
                                    ¡Todo listo,{' '}
                                    <span className="text-gradient-warm">{tenantName}</span>!
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Tu panel de gestión fue creado exitosamente.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Estado de activación */}
                    {isPending && (
                        <div className={`rounded-2xl border px-5 py-4 text-left space-y-3 ${
                            hasEvidence
                                ? 'border-amber-500/30 bg-amber-500/8'
                                : 'border-border bg-muted/40'
                        }`}>
                            <div className="flex items-center gap-2">
                                {hasEvidence
                                    ? <Upload className="h-4 w-4 text-amber-500 shrink-0" />
                                    : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                }
                                <p className="text-sm font-semibold text-foreground">
                                    {hasEvidence ? 'Comprobante recibido' : 'Pago pendiente de verificación'}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {hasEvidence
                                    ? 'Recibimos tu comprobante de pago. Un administrador verificará el pago y activará tu cuenta en un máximo de 6 horas.'
                                    : 'Una vez realices el pago y lo verifiquemos, activaremos tu cuenta. El proceso puede tomar hasta 24 horas.'}
                            </p>
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                                <Clock className="h-3.5 w-3.5" />
                                Tiempo estimado de activación: máx. {hasEvidence ? '6 horas' : '24 horas'}
                            </div>
                        </div>
                    )}

                    {/* URL del panel */}
                    <div className="rounded-2xl border border-border bg-muted/40 p-4 text-left space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Globe2 className="h-3.5 w-3.5" /> Tu dominio de acceso
                        </div>
                        <p className="font-mono text-sm font-semibold text-primary break-all">
                            {loginUrl}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Usa el email <span className="font-medium text-foreground">{tenantEmail}</span> y la contraseña que elegiste para iniciar sesión.
                        </p>
                    </div>

                    {/* CTA principal — solo si está activo */}
                    {!isPending && (
                        <a href={loginUrl} className="block">
                            <Button variant="hero" size="lg" className="w-full gap-2 group">
                                <LogIn className="h-4 w-4" />
                                Ir a mi panel
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </a>
                    )}

                    {/* Volver */}
                    <Link href="/" className="block">
                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                            Volver al inicio
                        </Button>
                    </Link>
                </div>

                <p className="mt-8 text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Menugo
                </p>
            </div>
        </>
    );
}
