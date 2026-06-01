import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Save, ToggleLeft, ToggleRight, Plus, Trash2 } from 'lucide-react';

interface Zona {
    min_km: number | '';
    max_km: number | '';
    price:  number | '';
}

interface Props {
    delivery_enabled:   boolean;
    delivery_min_order: number;
    delivery_zones:     Array<{ label: string; min_km: number; max_km: number; price: number }>;
    flash?: { success?: string; error?: string };
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

const ZONA_VACIA: Zona = { min_km: '', max_km: '', price: '' };

export default function Domicilio({ delivery_enabled, delivery_zones, flash }: Props) {
    const [enabled, setEnabled]       = useState(delivery_enabled);
    const [zonas, setZonas]           = useState<Zona[]>(
        delivery_zones.length > 0
            ? delivery_zones.map(z => ({ min_km: z.min_km, max_km: z.max_km, price: z.price }))
            : []
    );
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors]         = useState<Record<number, string>>({});

    function agregar() {
        const ultima = zonas[zonas.length - 1];
        const minKm  = ultima && ultima.max_km !== '' ? (ultima.max_km as number) : 0;
        setZonas(prev => [...prev, { ...ZONA_VACIA, min_km: minKm }]);
    }

    function eliminar(idx: number) {
        setZonas(prev => prev.filter((_, i) => i !== idx));
        setErrors(prev => {
            const next = { ...prev };
            delete next[idx];
            return next;
        });
    }

    function actualizar(idx: number, field: keyof Zona, raw: string) {
        setZonas(prev => prev.map((z, i) => {
            if (i !== idx) return z;
            const n = raw === '' ? '' : field === 'price'
                ? parseInt(raw.replace(/\D/g, ''), 10) || ''
                : parseFloat(raw) || 0;
            return { ...z, [field]: n };
        }));
    }

    function validar(): boolean {
        const errs: Record<number, string> = {};
        if (enabled) {
            zonas.forEach((z, i) => {
                if (z.min_km === '')                                  errs[i] = 'El Km inicio es requerido.';
                else if (z.max_km === '')                             errs[i] = 'El Km máx. es requerido.';
                else if ((z.max_km as number) <= (z.min_km as number)) errs[i] = 'El Km máx. debe ser mayor al inicio.';
                else if (z.price === '')                              errs[i] = 'El costo es requerido.';
            });
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSave() {
        if (!validar()) return;
        setSubmitting(true);
        router.post('/configuracion/domicilio', {
            delivery_enabled:   enabled,
            delivery_min_order: 0,
            delivery_zones: enabled
                ? zonas.map(z => ({
                    label:  `${z.min_km}–${z.max_km} km`,
                    min_km: z.min_km,
                    max_km: z.max_km,
                    price:  z.price === '' ? 0 : z.price,
                }))
                : [],
        }, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AppShell title="Domicilio" subtitle="Configura las tarifas de entrega a domicilio por distancia">
            <Head title="Configuración · Domicilio" />

            <div className="max-w-2xl space-y-5">

                {flash?.success && (
                    <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                        {flash.success}
                    </div>
                )}

                {/* Toggle */}
                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-sm">Servicio a domicilio</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Activa para que los clientes puedan solicitar entrega a domicilio.
                            </p>
                        </div>
                        <button type="button" onClick={() => setEnabled(e => !e)} className="shrink-0">
                            {enabled
                                ? <ToggleRight className="h-9 w-9 text-accent" />
                                : <ToggleLeft className="h-9 w-9 text-muted-foreground" />
                            }
                        </button>
                    </div>
                </div>

                {/* Tabla de rangos */}
                {enabled && (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">

                        {/* Encabezado */}
                        <div className="px-5 py-3.5 border-b border-border">
                            <h2 className="font-semibold text-sm">Tarifas por distancia</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Define los rangos de kilómetros y el costo de envío correspondiente.
                                El Gerente o Administrador asignará la tarifa al procesar cada pedido.
                            </p>
                        </div>

                        {/* Cabecera de columnas */}
                        {zonas.length > 0 && (
                            <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 px-5 py-2.5 bg-muted/20 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <span>Km inicio</span>
                                <span>Km máx.</span>
                                <span>Costo del envío</span>
                                <span />
                            </div>
                        )}

                        {/* Filas */}
                        {zonas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                                <p className="font-medium text-sm text-muted-foreground">Sin rangos configurados</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    Agrega al menos un rango de distancia con su costo.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {zonas.map((zona, idx) => (
                                    <div key={idx} className={`px-5 py-3 space-y-1 ${errors[idx] ? 'bg-red-500/5' : ''}`}>
                                        <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 items-center">

                                            {/* Km inicio */}
                                            <div className="relative">
                                                <input
                                                    type="number" min="0" step="0.5"
                                                    value={zona.min_km}
                                                    onChange={e => actualizar(idx, 'min_km', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">km</span>
                                            </div>

                                            {/* Km máx */}
                                            <div className="relative">
                                                <input
                                                    type="number" min="0" step="0.5"
                                                    value={zona.max_km}
                                                    onChange={e => actualizar(idx, 'max_km', e.target.value)}
                                                    placeholder="5"
                                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">km</span>
                                            </div>

                                            {/* Costo */}
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">$</span>
                                                <input
                                                    type="number" min="0" step="500"
                                                    value={zona.price}
                                                    onChange={e => actualizar(idx, 'price', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full rounded-xl border border-input bg-input pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                />
                                            </div>

                                            {/* Eliminar */}
                                            <button
                                                type="button"
                                                onClick={() => eliminar(idx)}
                                                className="h-9 w-9 flex items-center justify-center rounded-xl border border-red-500/20 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {errors[idx] && (
                                            <p className="text-xs text-red-400 pt-0.5">{errors[idx]}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
                            <button
                                type="button"
                                onClick={agregar}
                                className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Agregar rango
                            </button>
                            {zonas.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {zonas.length} rango{zonas.length !== 1 ? 's' : ''} configurado{zonas.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Vista previa */}
                {enabled && zonas.length > 0 && zonas.every(z => z.min_km !== '' && z.max_km !== '' && z.price !== '') && (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="px-5 py-3 border-b border-border">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vista previa de tarifas</span>
                        </div>
                        <div className="divide-y divide-border/50">
                            {zonas.map((z, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3">
                                    <span className="text-sm text-muted-foreground">
                                        {z.min_km} – {z.max_km} km
                                    </span>
                                    <span className="font-bold text-accent tabular-nums">
                                        {(z.price as number) === 0 ? 'Gratis' : fmt(z.price as number)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Guardar */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={submitting}
                        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4" />
                        {submitting ? 'Guardando...' : 'Guardar configuración'}
                    </button>
                </div>

            </div>
        </AppShell>
    );
}
