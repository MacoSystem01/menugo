import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CreditCard, Smartphone, Wifi, Banknote, ArrowRightLeft, Save, Info } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Detalle {
    titular?:    string;
    numero?:     string;
    link?:       string;
    tipo_cuenta?: 'ahorros' | 'corriente' | '';
    banco?:      string;
    nota?:       string;
}

interface Props {
    metodosActivos: string[];
    detalles:       Record<string, Detalle>;
    flash?: { success?: string; error?: string };
}

// ── Definición de métodos y sus campos ────────────────────────────────────────

interface CampoConfig {
    campo:       keyof Detalle;
    label:       string;
    placeholder: string;
    tipo:        'text' | 'tel' | 'select';
    opciones?:   { value: string; label: string }[];
}

const METODOS = [
    {
        key:         'efectivo',
        label:       'Efectivo',
        descripcion: 'Pago en efectivo al momento de la entrega o en caja.',
        icon:        Banknote,
        requerido:   true,
        campos:      [] as CampoConfig[],
    },
    {
        key:         'tarjeta',
        label:       'Tarjeta crédito / débito',
        descripcion: 'Pago con datáfono, tarjeta de crédito o débito.',
        icon:        CreditCard,
        requerido:   false,
        campos:      [
            { campo: 'nota' as const, label: 'Nota para el cliente (opcional)', placeholder: 'Ej: Se acepta Visa y Mastercard con datáfono.', tipo: 'text' as const },
        ] as CampoConfig[],
    },
    {
        key:         'nequi',
        label:       'Nequi',
        descripcion: 'Transferencia inmediata vía Nequi.',
        icon:        Smartphone,
        requerido:   false,
        campos:      [
            { campo: 'titular' as const, label: 'Titular de la cuenta',  placeholder: 'Nombre del propietario', tipo: 'text' as const },
            { campo: 'numero'  as const, label: 'Número de Nequi',        placeholder: '3001234567',            tipo: 'tel'  as const },
            { campo: 'link'    as const, label: 'Link de pago Nequi',     placeholder: 'https://cobros.nequi.com.co/...', tipo: 'text' as const },
        ] as CampoConfig[],
    },
    {
        key:         'daviplata',
        label:       'Daviplata',
        descripcion: 'Pago digital a través de Daviplata.',
        icon:        Smartphone,
        requerido:   false,
        campos:      [
            { campo: 'titular' as const, label: 'Titular de la cuenta',      placeholder: 'Nombre del propietario',          tipo: 'text' as const },
            { campo: 'numero'  as const, label: 'Número de Daviplata',        placeholder: '3001234567',                      tipo: 'tel'  as const },
            { campo: 'link'    as const, label: 'Link de pago Daviplata',     placeholder: 'https://daviplata.com/cobrar/...', tipo: 'text' as const },
            { campo: 'nota'    as const, label: 'Nota para el cliente (opcional)', placeholder: 'Ej: Escanea el QR o transfiere al número indicado.', tipo: 'text' as const },
        ] as CampoConfig[],
    },
    {
        key:         'pse',
        label:       'PSE',
        descripcion: 'Pago seguro en línea mediante débito bancario.',
        icon:        Wifi,
        requerido:   false,
        campos:      [
            { campo: 'banco'       as const, label: 'Banco',          placeholder: 'Ej: Bancolombia',     tipo: 'text'   as const },
            { campo: 'titular'     as const, label: 'Titular',         placeholder: 'Nombre del titular',  tipo: 'text'   as const },
            { campo: 'numero'      as const, label: 'Número de cuenta', placeholder: '1234567890',          tipo: 'text'   as const },
            { campo: 'tipo_cuenta' as const, label: 'Tipo de cuenta',   placeholder: '',                   tipo: 'select' as const,
              opciones: [{ value: '', label: 'Seleccionar...' }, { value: 'ahorros', label: 'Ahorros' }, { value: 'corriente', label: 'Corriente' }],
            },
        ] as CampoConfig[],
    },
    {
        key:         'transferencia',
        label:       'Transferencia bancaria',
        descripcion: 'Transferencia directa entre cuentas bancarias.',
        icon:        ArrowRightLeft,
        requerido:   false,
        campos:      [
            { campo: 'banco'       as const, label: 'Banco',          placeholder: 'Ej: Bancolombia',     tipo: 'text'   as const },
            { campo: 'titular'     as const, label: 'Titular',         placeholder: 'Nombre del titular',  tipo: 'text'   as const },
            { campo: 'numero'      as const, label: 'Número de cuenta', placeholder: '1234567890',          tipo: 'text'   as const },
            { campo: 'tipo_cuenta' as const, label: 'Tipo de cuenta',   placeholder: '',                   tipo: 'select' as const,
              opciones: [{ value: '', label: 'Seleccionar...' }, { value: 'ahorros', label: 'Ahorros' }, { value: 'corriente', label: 'Corriente' }],
            },
        ] as CampoConfig[],
    },
] as const;

// ── Componente principal ──────────────────────────────────────────────────────

export default function Pagos({ metodosActivos, detalles: initialDetalles, flash }: Props) {
    const [activos,    setActivos]    = useState<Set<string>>(new Set(metodosActivos));
    const [detalles,   setDetalles]   = useState<Record<string, Detalle>>(initialDetalles ?? {});
    const [submitting, setSubmitting] = useState(false);

    function toggle(key: string) {
        if (key === 'efectivo') return;
        setActivos(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else               next.add(key);
            return next;
        });
    }

    function setDetalle(key: string, campo: keyof Detalle, valor: string) {
        setDetalles(prev => ({
            ...prev,
            [key]: { ...(prev[key] ?? {}), [campo]: valor },
        }));
    }

    function handleSave() {
        setSubmitting(true);
        // Solo enviar detalles de métodos activos y con campos
        const detallesActivos: Record<string, Detalle> = {};
        METODOS.forEach(m => {
            if (activos.has(m.key) && m.campos.length > 0 && detalles[m.key]) {
                detallesActivos[m.key] = detalles[m.key];
            }
        });
        router.post('/configuracion/pagos', {
            metodos:  [...activos],
            detalles: detallesActivos,
        }, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AppShell title="Métodos de pago" subtitle="Configura qué medios acepta tu comercio y sus datos de cuenta">
            <Head title="Configuración · Métodos de pago" />

            <div className="max-w-2xl space-y-6">

                {flash?.success && (
                    <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                        {flash.success}
                    </div>
                )}

                {/* Info */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                    <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-400/90">
                        Los métodos habilitados aparecerán como opciones al registrar un pago en Caja. Completa los datos de cuenta para que los clientes puedan realizar transferencias correctamente.
                    </p>
                </div>

                {/* Cards de métodos */}
                <div className="space-y-3">
                    {METODOS.map(m => {
                        const enabled  = activos.has(m.key);
                        const IconCmp  = m.icon;
                        const detalle  = detalles[m.key] ?? {};
                        const hasCamps = m.campos.length > 0;

                        return (
                            <div
                                key={m.key}
                                className={`rounded-2xl border transition-all ${
                                    enabled
                                        ? 'border-primary/40 bg-primary/5'
                                        : 'border-border bg-card'
                                }`}
                            >
                                {/* Cabecera del método */}
                                <div
                                    onClick={() => toggle(m.key)}
                                    className={`flex items-center gap-4 px-5 py-4 select-none ${m.requerido ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        <IconCmp className="h-5 w-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold text-sm ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {m.label}
                                            </span>
                                            {m.requerido && (
                                                <span className="text-[10px] px-1.5 py-px rounded-full bg-muted text-muted-foreground font-semibold uppercase tracking-wide">
                                                    Requerido
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{m.descripcion}</p>
                                    </div>

                                    <div className={`h-6 w-11 rounded-full relative shrink-0 transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}>
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </div>

                                {/* Campos de detalle — sólo si está activo y tiene campos */}
                                {enabled && hasCamps && (
                                    <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            Datos de la cuenta
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {m.campos.map(c => (
                                                <div key={c.campo} className={(c.campo === 'nota' || c.campo === 'link') ? 'sm:col-span-2' : ''}>
                                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                                        {c.label}
                                                    </label>
                                                    {c.tipo === 'select' ? (
                                                        <select
                                                            value={(detalle[c.campo] as string) ?? ''}
                                                            onChange={e => setDetalle(m.key, c.campo, e.target.value)}
                                                            className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        >
                                                            {c.opciones?.map(o => (
                                                                <option key={o.value} value={o.value}>{o.label}</option>
                                                            ))}
                                                        </select>
                                                    ) : c.campo === 'nota' ? (
                                                        <textarea
                                                            rows={2}
                                                            value={(detalle[c.campo] as string) ?? ''}
                                                            onChange={e => setDetalle(m.key, c.campo, e.target.value)}
                                                            placeholder={c.placeholder}
                                                            className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                                        />
                                                    ) : (
                                                        <input
                                                            type={c.tipo}
                                                            value={(detalle[c.campo] as string) ?? ''}
                                                            onChange={e => setDetalle(m.key, c.campo, e.target.value)}
                                                            placeholder={c.placeholder}
                                                            className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Botón guardar */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={submitting}
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
