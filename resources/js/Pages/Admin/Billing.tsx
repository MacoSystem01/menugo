import AppShell from '@/Layouts/AppShell';
import { Head } from '@inertiajs/react';
import { CreditCard, CheckCircle2, AlertCircle, Clock, Zap, Crown, Building } from 'lucide-react';

interface PlanStats {
    name: string;
    count: number;
    price: number;
    icon: any;
    color: string;
}

interface Props {
    stats: {
        por_plan: Record<string, number>;
        total_revenue: number;
    };
}

export default function Billing({ stats }: Props) {
    const plans: PlanStats[] = [
        { name: 'Básico',     count: stats.por_plan.basico ?? 0,     price: 25000, icon: Clock, color: 'text-zinc-500' },
        { name: 'Pro',        count: stats.por_plan.pro ?? 0,        price: 55000, icon: Zap, color: 'text-blue-500' },
        { name: 'Enterprise', count: stats.por_plan.enterprise ?? 0, price: 120000, icon: Crown, color: 'text-amber-500' },
    ];

    return (
        <AppShell title="Suscripciones y Facturación" subtitle="Control de ingresos y planes contratados" variant="admin">
            <Head title="SuperAdmin - Facturación" />

            <div className="grid gap-6 md:grid-cols-3 mb-10">
                <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ingresos Estimados (Mensual)</div>
                        <div className="text-3xl font-display font-bold text-foreground">
                            $ {new Intl.NumberFormat('es-CO').format(stats.total_revenue)}
                        </div>
                        <div className="mt-2 flex items-center text-[10px] text-green-600 font-bold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            <span>Pago al día en el 92% de locales</span>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Locales con Mora</div>
                        <div className="text-3xl font-display font-bold text-red-500">
                            {Math.floor(stats.por_plan.basico * 0.1 || 0)}
                        </div>
                        <div className="mt-2 flex items-center text-[10px] text-muted-foreground font-medium">
                            <AlertCircle className="h-3 w-3 mr-1 text-red-400" />
                            <span>Requieren atención inmediata</span>
                        </div>
                    </div>
                </div>
                
                <div className="rounded-3xl bg-zinc-900 p-6 text-white flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Siguiente Corte</div>
                        <div className="text-xl font-bold mt-1">28 de Mayo, 2026</div>
                    </div>
                    <button className="mt-4 w-full py-2.5 rounded-xl bg-white text-zinc-900 font-bold text-xs hover:bg-zinc-200 transition-colors">
                        Generar Reporte Fiscal
                    </button>
                </div>
            </div>

            <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Desglose por Planes
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                    <div key={plan.name} className="group rounded-3xl border border-border bg-card p-8 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-2xl bg-muted/50 ${plan.color}`}>
                                <plan.icon className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
                                {plan.count} Activos
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-2xl font-display font-bold">$ {new Intl.NumberFormat('es-CO').format(plan.price)}</span>
                            <span className="text-xs text-muted-foreground">/mes</span>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-border">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Recaudado</span>
                                <span className="font-bold">$ {new Intl.NumberFormat('es-CO').format(plan.count * plan.price)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${plan.color.replace('text', 'bg')}`} 
                                     style={{ width: `${(plan.count / (Object.values(stats.por_plan).reduce((a,b) => a+b, 0) || 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 p-8 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center bg-muted/5">
                <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <h3 className="text-sm font-bold text-foreground">Gestión de Pasarela</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    La integración con Wompi / MercadoPago está activa para el cobro automático de mensualidades.
                </p>
                <button className="mt-4 text-xs font-bold text-primary hover:underline">Configurar Webhooks</button>
            </div>
        </AppShell>
    );
}
