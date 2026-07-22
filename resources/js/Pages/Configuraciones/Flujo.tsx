import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Save, Info, ChefHat, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Props {
    order_flow: 'pago_primero' | 'cocina_primero';
    flash?: { success?: string; error?: string };
}

const OPCIONES = [
    {
        value:       'pago_primero' as const,
        label:       'Mostrador (Pago → Cocina)',
        descripcion: 'El cliente paga primero en caja y el pedido se envía automáticamente a cocina para su preparación.',
        pasos: ['Pedido recibido', 'Cajero cobra', 'Cocina prepara', 'Entrega al cliente'],
        iconA: DollarSign,
        iconB: ChefHat,
        recomendado: 'Puesto de comida rápida, mostrador, take-away',
    },
    {
        value:       'cocina_primero' as const,
        label:       'Mesa (Cocina → Pago)',
        descripcion: 'El pedido va directo a cocina para preparación. El cobro se realiza en caja cuando el pedido está listo para entregar.',
        pasos: ['Pedido recibido', 'Cocina prepara', 'Pedido listo', 'Cajero cobra y entrega'],
        iconA: ChefHat,
        iconB: DollarSign,
        recomendado: 'Restaurante con servicio a la mesa, bares, domicilios',
    },
] as const;

export default function Flujo({ order_flow: initialFlow, flash }: Props) {
    const [selected,   setSelected]   = useState<'pago_primero' | 'cocina_primero'>(initialFlow);
    const [submitting, setSubmitting] = useState(false);

    function handleSave() {
        setSubmitting(true);
        router.post('/configuracion/flujo', { order_flow: selected }, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AppShell title="Flujo de pedido" subtitle="Define el orden en que se cobra y se preparan los pedidos">
            <Head title="Configuración · Flujo de pedido" />

            <div className="max-w-2xl space-y-6">

                {flash?.success && (
                    <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                        {flash.success}
                    </div>
                )}

                {/* Aviso */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                    <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-400/90">
                        Este ajuste cambia cómo interactúan la caja y la cocina. El cambio aplica a todos los pedidos nuevos desde el momento en que se guarda. Los pedidos ya activos continúan su flujo normal.
                    </p>
                </div>

                {/* Opciones */}
                <div className="space-y-4">
                    {OPCIONES.map(op => {
                        const isSelected = selected === op.value;
                        const IconA = op.iconA;
                        const IconB = op.iconB;

                        return (
                            <button
                                key={op.value}
                                type="button"
                                onClick={() => setSelected(op.value)}
                                className={`w-full text-left rounded-2xl border p-5 transition-all ${
                                    isSelected
                                        ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                        : 'border-border bg-card hover:border-border/80 hover:bg-muted/20'
                                }`}
                            >
                                {/* Cabecera de la opción */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Ícono de flujo */}
                                        <div className={`flex items-center gap-1.5 rounded-xl px-3 py-2 ${isSelected ? 'bg-primary/15' : 'bg-muted'}`}>
                                            <IconA className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <ArrowRight className={`h-3 w-3 ${isSelected ? 'text-primary/60' : 'text-muted-foreground/60'}`} />
                                            <IconB className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div>
                                            <span className={`font-semibold text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {op.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Indicador seleccionado */}
                                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                        isSelected ? 'border-primary bg-primary' : 'border-border'
                                    }`}>
                                        {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4">{op.descripcion}</p>

                                {/* Diagrama de pasos */}
                                <div className="flex items-center gap-1 flex-wrap">
                                    {op.pasos.map((paso, i) => (
                                        <div key={i} className="flex items-center gap-1">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                isSelected
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {paso}
                                            </span>
                                            {i < op.pasos.length - 1 && (
                                                <ArrowRight className={`h-3 w-3 shrink-0 ${isSelected ? 'text-primary/50' : 'text-muted-foreground/40'}`} />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Recomendado para */}
                                <p className={`text-xs mt-3 ${isSelected ? 'text-primary/70' : 'text-muted-foreground/60'}`}>
                                    <span className="font-semibold">Ideal para:</span> {op.recomendado}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Guardar */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={submitting || selected === initialFlow}
                        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4" />
                        {submitting ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>

            </div>
        </AppShell>
    );
}
