import AppShell from '@/Layouts/AppShell';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Save, Info, ChefHat, DollarSign, ArrowRight, CheckCircle2, Package, UtensilsCrossed, Bike, AlertTriangle } from 'lucide-react';

interface Props {
    order_flow: 'pago_primero' | 'cocina_primero';
    delivery_types: ('mostrador' | 'mesa' | 'domicilio')[];
    has_tables: boolean;
    flash?: { success?: string; error?: string };
    errors?: any;
}

const OPCIONES_FLUJO = [
    {
        value:       'pago_primero' as const,
        label:       'Pago Primero (Mostrador/Take-away)',
        descripcion: 'El cliente paga primero en caja y el pedido se envía automáticamente a cocina para su preparación.',
        pasos: ['Pedido recibido', 'Cajero cobra', 'Cocina prepara', 'Entrega al cliente'],
        iconA: DollarSign,
        iconB: ChefHat,
        recomendado: 'Puesto de comida rápida, mostrador, take-away',
    },
    {
        value:       'cocina_primero' as const,
        label:       'Cocina Primero (Servicio a la Mesa)',
        descripcion: 'El pedido va directo a cocina para preparación. El cobro se realiza en caja cuando el pedido está listo para entregar.',
        pasos: ['Pedido recibido', 'Cocina prepara', 'Pedido listo', 'Cajero cobra y entrega'],
        iconA: ChefHat,
        iconB: DollarSign,
        recomendado: 'Restaurante con servicio a la mesa, bares, domicilios',
    },
] as const;

const OPCIONES_ENTREGA = [
    { id: 'mostrador', label: 'Mostrador', Icon: Package, desc: 'Recogida en el local' },
    { id: 'mesa', label: 'Mesa', Icon: UtensilsCrossed, desc: 'Consumo en el local' },
    { id: 'domicilio', label: 'Domicilio', Icon: Bike, desc: 'Envío a dirección' },
] as const;

export default function Flujo({ order_flow: initialFlow, delivery_types: initialTypes, has_tables, flash, errors }: Props) {
    const [selectedFlow, setSelectedFlow] = useState<'pago_primero' | 'cocina_primero'>(initialFlow);
    const [selectedTypes, setSelectedTypes] = useState<('mostrador' | 'mesa' | 'domicilio')[]>(initialTypes);
    const [submitting, setSubmitting] = useState(false);

    const isChanged = selectedFlow !== initialFlow || 
                      selectedTypes.length !== initialTypes.length || 
                      !selectedTypes.every(t => initialTypes.includes(t));

    function toggleType(type: 'mostrador' | 'mesa' | 'domicilio') {
        if (type === 'mesa' && !has_tables) return; // No permitir si no hay mesas
        
        setSelectedTypes(prev => {
            if (prev.includes(type)) {
                // No permitir deseleccionar todo, obligar al menos 1
                if (prev.length === 1) return prev;
                return prev.filter(t => t !== type);
            }
            return [...prev, type];
        });
    }

    function handleSave() {
        setSubmitting(true);
        router.post('/configuracion/flujo', { 
            order_flow: selectedFlow,
            delivery_types: selectedTypes,
        }, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AppShell title="Flujo de Entrega" subtitle="Define los tipos de entrega y el orden de preparación">
            <Head title="Configuración · Flujo de Entrega" />

            <div className="max-w-3xl space-y-8 pb-10">

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                        {flash.success}
                    </div>
                )}
                {errors?.delivery_types && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {errors.delivery_types}
                    </div>
                )}

                {/* Tipos de Entrega */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold font-display flex items-center gap-2">
                        1. Tipos de Entrega Habilitados
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Selecciona las opciones que estarán disponibles para los clientes en tu carta digital.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {OPCIONES_ENTREGA.map(({ id, label, Icon, desc }) => {
                            const isSelected = selectedTypes.includes(id as any);
                            const isDisabled = id === 'mesa' && !has_tables;

                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => toggleType(id as any)}
                                    disabled={isDisabled}
                                    className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all ${
                                        isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/50 border-border/50' :
                                        isSelected
                                            ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-border bg-card hover:border-border/80'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 h-5 w-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                        </div>
                                    )}
                                    <div className={`p-3 rounded-xl mb-3 ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <span className={`font-semibold text-sm mb-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{desc}</span>
                                </button>
                            );
                        })}
                    </div>
                    {!has_tables && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-orange-500/90 font-medium bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Para habilitar la opción "Mesa" debes tener al menos una mesa registrada en el sistema. Puedes configurarlo en la sección de Mesas.</span>
                        </div>
                    )}
                </section>

                <div className="border-t border-border/50"></div>

                {/* Flujo de Pedido */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold font-display">
                        2. Orden de Preparación y Cobro
                    </h2>
                    
                    <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-600/90 dark:text-blue-400/90">
                            Este ajuste cambia cómo interactúan la caja y la cocina a nivel general. Aplica a los pedidos nuevos.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {OPCIONES_FLUJO.map(op => {
                            const isSelected = selectedFlow === op.value;
                            const IconA = op.iconA;
                            const IconB = op.iconB;

                            return (
                                <button
                                    key={op.value}
                                    type="button"
                                    onClick={() => setSelectedFlow(op.value)}
                                    className={`w-full text-left rounded-2xl border p-5 transition-all ${
                                        isSelected
                                            ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-border bg-card hover:border-border/80'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
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

                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                            isSelected ? 'border-primary bg-primary' : 'border-border'
                                        }`}>
                                            {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-4">{op.descripcion}</p>

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

                                    <p className={`text-xs mt-3 ${isSelected ? 'text-primary/70' : 'text-muted-foreground/60'}`}>
                                        <span className="font-semibold">Ideal para:</span> {op.recomendado}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Guardar */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={submitting || !isChanged}
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
