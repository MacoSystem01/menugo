import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, Save, Info, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';

interface Zona {
    label:  string;
    min_km: number | '';
    max_km: number | '';
    price:  number | '';
}

interface Props {
    delivery_enabled:   boolean;
    delivery_min_order: number;
    delivery_zones:     Zona[];
    flash?: { success?: string; error?: string };
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

const ZONA_VACIA: Zona = { label: '', min_km: '', max_km: '', price: '' };

export default function Domicilio({ delivery_enabled, delivery_min_order, delivery_zones, flash }: Props) {
    const [enabled,    setEnabled]    = useState(delivery_enabled);
    const [minOrder,   setMinOrder]   = useState<number | ''>(delivery_min_order ?? 0);
    const [zonas,      setZonas]      = useState<Zona[]>(delivery_zones.length > 0 ? delivery_zones : []);
    const [submitting, setSubmitting] = useState(false);
    const [errors,     setErrors]     = useState<Record<number, string>>({});

    function agregar() {
        const ultima = zonas[zonas.length - 1];
        const minKm  = ultima && ultima.max_km !== '' ? ultima.max_km : 0;
        setZonas(prev => [...prev, { ...ZONA_VACIA, min_km: minKm as number }]);
    }

    function eliminar(idx: number) {
        setZonas(prev => prev.filter((_, i) => i !== idx));
        setErrors(prev => {
            const next = { ...prev };
            delete next[idx];
            return next;
        });
    }

    function actualizar(idx: number, field: keyof Zona, value: string) {
        setZonas(prev => prev.map((f, i) => {
            if (i !== idx) return f;
            if (field === 'min_km' || field === 'max_km') {
                const n = value === '' ? '' : parseFloat(value);
                return { ...f, [field]: n };
            }
            if (field === 'price') {
                const n = value === '' ? '' : parseInt(value.replace(/\D/g, ''), 10);
                return { ...f, [field]: isNaN(n as number) ? '' : n };
            }
            return { ...f, [field]: value };
        }));
    }

    function validar(): boolean {
        const newErrors: Record<number, string> = {};
        if (enabled) {
            zonas.forEach((f, i) => {
                if (!f.label.trim())                                          newErrors[i] = 'El nombre de zona es requerido.';
                else if (f.min_km === '')                                     newErrors[i] = 'El km mínimo es requerido.';
                else if (f.max_km === '')                                     newErrors[i] = 'El km máximo es requerido.';
                else if ((f.max_km as number) <= (f.min_km as number))       newErrors[i] = 'El km máximo debe ser mayor al mínimo.';
                else if (f.price === '')                                      newErrors[i] = 'El precio es requerido.';
            });
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSave() {
        if (!validar()) return;
        setSubmitting(true);
        router.post('/configuracion/domicilio', {
            delivery_enabled:   enabled,
            delivery_min_order: minOrder === '' ? 0 : minOrder,
            delivery_zones:     enabled ? zonas : [],
        }, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AppShell title="Domicilio" subtitle="Configura el servicio de entrega a domicilio">
            <Head title="Configuración · Domicilio" />

            <div className="max-w-3xl space-y-6">

                {flash?.success && (
                    <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                        {flash.success}
                    </div>
                )}

                {/* Toggle principal */}
                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-sm">Servicio a domicilio</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Activa para que los clientes puedan seleccionar domicilio al hacer su pedido desde la carta.
                            </p>
                        </div>
                        <button type="button" onClick={() => setEnabled(e => !e)} className="shrink-0">
                            {enabled
                                ? <ToggleRight className="h-9 w-9 text-accent" />
                                : <ToggleLeft  className="h-9 w-9 text-muted-foreground" />
                            }
                        </button>
                    </div>
                </div>

                {/* Pedido mínimo */}
                {enabled && (
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div>
                            <h2 className="font-semibold text-sm">Pedido mínimo</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Monto mínimo para aceptar domicilios. Ingresa 0 para no tener límite.
                            </p>
                        </div>
                        <div className="relative max-w-xs">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">$</span>
                            <input
                                type="number"
                                min={0}
                                step={1000}
                                value={minOrder}
                                onChange={e => setMinOrder(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full rounded-xl border border-input bg-input pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        {typeof minOrder === 'number' && minOrder > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Pedido mínimo: <span className="font-semibold text-foreground">{fmt(minOrder)}</span>
                            </p>
                        )}
                    </div>
                )}

                {/* Info */}
                {enabled && (
                    <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-400/90">
                            Define zonas por kilómetro de distancia. El cliente seleccionará su zona al hacer el pedido y la tarifa se sumará al total.
                        </p>
                    </div>
                )}

                {/* Tabla de zonas */}
                {enabled && (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">

                        {/* Encabezado */}
                        <div className="grid grid-cols-[1fr_100px_100px_120px_44px] gap-3 px-5 py-3 bg-muted/20 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <span>Nombre de zona</span>
                            <span className="text-center">Km mín.</span>
                            <span className="text-center">Km máx.</span>
                            <span className="text-right">Tarifa</span>
                            <span />
                        </div>

                        {/* Filas */}
                        {zonas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <MapPin className="h-8 w-8 text-muted-foreground mb-3" />
                                <p className="font-medium text-sm">Sin zonas configuradas</p>
                                <p className="text-xs text-muted-foreground mt-1">Agrega el primer rango de distancia para establecer las tarifas.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {zonas.map((zona, idx) => (
                                    <div key={idx} className={`px-5 py-3 space-y-1 ${errors[idx] ? 'bg-red-500/5' : ''}`}>
                                        <div className="grid grid-cols-[1fr_100px_100px_120px_44px] gap-3 items-center">

                                            <input
                                                type="text"
                                                value={zona.label}
                                                onChange={e => actualizar(idx, 'label', e.target.value)}
                                                placeholder="Ej: Zona centro"
                                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={zona.min_km}
                                                onChange={e => actualizar(idx, 'min_km', e.target.value)}
                                                placeholder="0"
                                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={zona.max_km}
                                                onChange={e => actualizar(idx, 'max_km', e.target.value)}
                                                placeholder="5"
                                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />

                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={zona.price === '' ? '' : new Intl.NumberFormat('es-CO').format(zona.price as number)}
                                                    onChange={e => actualizar(idx, 'price', e.target.value)}
                                                    placeholder="5.000"
                                                    className="w-full rounded-lg border border-input bg-background pl-6 pr-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>

                                            <button
                                                onClick={() => eliminar(idx)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {errors[idx] && (
                                            <p className="text-xs text-red-400 pl-0.5">{errors[idx]}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
                            <button
                                onClick={agregar}
                                className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Agregar zona
                            </button>
                            {zonas.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {zonas.length} zona{zonas.length !== 1 ? 's' : ''} configurada{zonas.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Vista previa */}
                {enabled && zonas.length > 0 && zonas.every(f => f.label && f.min_km !== '' && f.max_km !== '' && f.price !== '') && (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="px-5 py-3 bg-muted/20 border-b border-border">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vista previa de tarifas</span>
                        </div>
                        <div className="divide-y divide-border/50">
                            {zonas.map((f, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium">{f.label || '—'}</p>
                                            <p className="text-xs text-muted-foreground">{f.min_km} – {f.max_km} km</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-accent tabular-nums">
                                        {(f.price as number) === 0 ? 'Gratis' : fmt(f.price as number)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Botón guardar */}
                <div className="flex justify-end">
                    <button
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
