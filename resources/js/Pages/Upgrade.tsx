import AppShell from '@/Layouts/AppShell';
import { Head, Link, usePage } from '@inertiajs/react';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PageProps } from '@/types';

export default function Upgrade() {
    const { flash } = usePage<PageProps>().props;

    return (
        <AppShell title="Mejora tu plan" subtitle="Acceso restringido">
            <Head title="Mejora tu plan" />

            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto px-4">
                <div className="h-20 w-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6">
                    <Lock className="h-10 w-10" />
                </div>
                
                <h2 className="text-2xl font-bold font-display text-foreground mb-3">
                    Función no disponible en tu plan
                </h2>
                
                <p className="text-muted-foreground mb-8">
                    {flash?.error || 'Tu plan actual no incluye esta funcionalidad. Mejora tu suscripción para desbloquear esta y otras herramientas avanzadas que te ayudarán a escalar tu negocio.'}
                </p>

                <div className="bg-card border border-border p-5 rounded-2xl w-full text-left mb-8 space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                        Al mejorar tu plan obtienes:
                    </h3>
                    
                    <div className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Acceso total a todas las herramientas de MenúGO</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Gestión de inventario y domicilios sin límite</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Analítica profunda para tomar mejores decisiones</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Link
                        href="/dashboard"
                        className="flex-1 flex justify-center py-2.5 rounded-xl border border-input hover:bg-muted font-medium transition"
                    >
                        Volver al Inicio
                    </Link>
                    <Link
                        href="/mi-plan"
                        className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground hover:brightness-110 font-bold transition shadow-glow"
                    >
                        Ver Planes <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </AppShell>
    );
}
