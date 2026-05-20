import AppShell from '@/Layouts/AppShell';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Calculator, DollarSign, TrendingUp, TrendingDown, CheckCircle2, Banknote, Coins } from 'lucide-react';

interface Props {
    totalSistema: number;
    totalOrdenesHoy: number;
    resumenMetodos: Record<string, { cantidad: number; total: number }>;
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n);
}

const BILLETES = [100_000, 50_000, 20_000, 10_000, 5_000, 2_000, 1_000];
const MONEDAS  = [1_000, 500, 200, 100, 50];

const METHOD_LABELS: Record<string, string> = {
    efectivo:      'Efectivo',
    tarjeta:       'Tarjeta',
    nequi:         'Nequi',
    daviplata:     'Daviplata',
    pse:           'PSE',
    transferencia: 'Transferencia',
};

type Cantidades = Record<number, string>;

export default function CierreCaja({ totalSistema, totalOrdenesHoy, resumenMetodos }: Props) {
    const [cantidades, setCantidades] = useState<Cantidades>({});

    const totalContado = useMemo(() => {
        return [...BILLETES, ...MONEDAS].reduce((sum, denom) => {
            return sum + (parseInt(cantidades[denom] || '0', 10) || 0) * denom;
        }, 0);
    }, [cantidades]);

    const diferencia = totalContado - totalSistema;
    const cuadra     = diferencia === 0;
    const sobrante   = diferencia > 0;

    function setVal(denom: number, val: string) {
        const clean = val.replace(/\D/g, '');
        setCantidades(prev => ({ ...prev, [denom]: clean }));
    }

    function subtotal(denom: number) {
        return (parseInt(cantidades[denom] || '0', 10) || 0) * denom;
    }

    function limpiar() {
        setCantidades({});
    }

    return (
        <AppShell title="Cierre de Caja" subtitle="Arqueo de efectivo al cierre del turno">
            <Head title="Cierre de Caja" />

            {/* ── Resumen del sistema ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Efectivo registrado (sistema)</span>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="font-display text-2xl font-bold text-accent">{fmt(totalSistema)}</div>
                    <div className="text-xs text-muted-foreground mt-1">según pagos en efectivo hoy</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Efectivo contado (arqueo)</span>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="font-display text-2xl font-bold">{fmt(totalContado)}</div>
                    <div className="text-xs text-muted-foreground mt-1">según billetes y monedas ingresados</div>
                </div>

                <div className={`rounded-2xl border p-5 transition-colors ${
                    totalContado === 0
                        ? 'border-border bg-card'
                        : cuadra
                        ? 'border-green-500/30 bg-green-500/5'
                        : sobrante
                        ? 'border-accent/30 bg-accent/5'
                        : 'border-red-500/30 bg-red-500/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Diferencia</span>
                        {cuadra && totalContado > 0
                            ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                            : sobrante
                            ? <TrendingUp className="h-4 w-4 text-accent" />
                            : <TrendingDown className="h-4 w-4 text-red-400" />}
                    </div>
                    <div className={`font-display text-2xl font-bold ${
                        totalContado === 0
                            ? 'text-muted-foreground'
                            : cuadra
                            ? 'text-green-400'
                            : sobrante
                            ? 'text-accent'
                            : 'text-red-400'}`}>
                        {totalContado === 0 ? '—' : cuadra ? '¡Cuadra!' : fmt(Math.abs(diferencia))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {totalContado === 0 ? 'Ingrese las cantidades' : cuadra ? 'El arqueo es correcto' : sobrante ? 'sobrante' : 'faltante'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Calculadora de arqueo ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Billetes */}
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/20">
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                            <h2 className="font-display text-sm font-bold">Billetes</h2>
                        </div>
                        <div className="divide-y divide-border/50">
                            {BILLETES.map(denom => (
                                <div key={denom} className="flex items-center gap-4 px-5 py-3">
                                    <div className="w-28 shrink-0">
                                        <span className="text-sm font-semibold">{fmt(denom)}</span>
                                    </div>
                                    <span className="text-muted-foreground text-sm shrink-0">×</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={cantidades[denom] ?? ''}
                                        onChange={e => setVal(denom, e.target.value)}
                                        placeholder="0"
                                        className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <span className="text-muted-foreground text-sm shrink-0">=</span>
                                    <div className={`flex-1 text-right text-sm font-semibold ${subtotal(denom) > 0 ? 'text-accent' : 'text-muted-foreground/40'}`}>
                                        {subtotal(denom) > 0 ? fmt(subtotal(denom)) : '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between px-5 py-3 border-t-2 border-border bg-muted/20">
                            <span className="text-sm font-semibold">Subtotal billetes</span>
                            <span className="font-display text-base font-bold text-accent">
                                {fmt(BILLETES.reduce((s, d) => s + subtotal(d), 0))}
                            </span>
                        </div>
                    </div>

                    {/* Monedas */}
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/20">
                            <Coins className="h-4 w-4 text-muted-foreground" />
                            <h2 className="font-display text-sm font-bold">Monedas</h2>
                        </div>
                        <div className="divide-y divide-border/50">
                            {MONEDAS.map(denom => (
                                <div key={denom} className="flex items-center gap-4 px-5 py-3">
                                    <div className="w-28 shrink-0">
                                        <span className="text-sm font-semibold">{fmt(denom)}</span>
                                    </div>
                                    <span className="text-muted-foreground text-sm shrink-0">×</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={cantidades[denom] ?? ''}
                                        onChange={e => setVal(denom, e.target.value)}
                                        placeholder="0"
                                        className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <span className="text-muted-foreground text-sm shrink-0">=</span>
                                    <div className={`flex-1 text-right text-sm font-semibold ${subtotal(denom) > 0 ? 'text-accent' : 'text-muted-foreground/40'}`}>
                                        {subtotal(denom) > 0 ? fmt(subtotal(denom)) : '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between px-5 py-3 border-t-2 border-border bg-muted/20">
                            <span className="text-sm font-semibold">Subtotal monedas</span>
                            <span className="font-display text-base font-bold text-accent">
                                {fmt(MONEDAS.reduce((s, d) => s + subtotal(d), 0))}
                            </span>
                        </div>
                    </div>

                    {/* Total final */}
                    <div className={`rounded-2xl border p-5 flex items-center justify-between transition-colors ${
                        cuadra && totalContado > 0
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-border bg-card'}`}>
                        <div>
                            <div className="font-display text-sm font-bold">Total contado en caja</div>
                            <div className="text-xs text-muted-foreground mt-0.5">suma de billetes + monedas</div>
                        </div>
                        <div className={`font-display text-3xl font-bold ${cuadra && totalContado > 0 ? 'text-green-400' : ''}`}>
                            {fmt(totalContado)}
                        </div>
                    </div>

                    <button
                        onClick={limpiar}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                    >
                        Limpiar todos los campos
                    </button>
                </div>

                {/* ── Panel lateral: resumen por método ── */}
                <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="px-5 py-4 border-b border-border bg-muted/20">
                            <h2 className="font-display text-sm font-bold">Recaudo hoy por método</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{totalOrdenesHoy} orden{totalOrdenesHoy !== 1 ? 'es' : ''} cerrada{totalOrdenesHoy !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="divide-y divide-border/50">
                            {Object.keys(resumenMetodos).length === 0 ? (
                                <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                                    Sin pagos registrados hoy
                                </div>
                            ) : (
                                Object.entries(resumenMetodos).map(([method, data]) => (
                                    <div key={method} className="px-5 py-3 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium">{METHOD_LABELS[method] ?? method}</div>
                                            <div className="text-xs text-muted-foreground">{data.cantidad} pago{data.cantidad !== 1 ? 's' : ''}</div>
                                        </div>
                                        <span className="font-display text-sm font-bold text-accent">{fmt(data.total)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        {Object.keys(resumenMetodos).length > 0 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t-2 border-border bg-muted/20">
                                <span className="text-sm font-semibold">Total sistema</span>
                                <span className="font-display text-base font-bold">
                                    {fmt(Object.values(resumenMetodos).reduce((s, d) => s + d.total, 0))}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Resultado arqueo */}
                    {totalContado > 0 && (
                        <div className={`rounded-2xl border p-5 space-y-3 ${
                            cuadra
                                ? 'border-green-500/30 bg-green-500/5'
                                : sobrante
                                ? 'border-accent/30 bg-accent/5'
                                : 'border-red-500/30 bg-red-500/5'}`}>
                            <h3 className="font-display text-sm font-bold">Resultado del arqueo</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sistema (efectivo)</span>
                                    <span className="font-semibold">{fmt(totalSistema)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Contado en caja</span>
                                    <span className="font-semibold">{fmt(totalContado)}</span>
                                </div>
                                <div className={`flex justify-between pt-2 border-t font-bold ${
                                    cuadra ? 'text-green-400 border-green-500/20' : sobrante ? 'text-accent border-accent/20' : 'text-red-400 border-red-500/20'}`}>
                                    <span>{cuadra ? 'Cuadra exacto' : sobrante ? 'Sobrante' : 'Faltante'}</span>
                                    <span>{cuadra ? '✓' : fmt(Math.abs(diferencia))}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
