import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { PlanGate } from '@/components/PlanGate';
import {
    TrendingUp, ShoppingBag, DollarSign, Bike,
    AlertTriangle, BarChart3, FileText, FileSpreadsheet,
    Download, TrendingDown, Printer, Package,
} from 'lucide-react';

interface Resumen {
    total_ventas:        number;
    total_pedidos:       number;
    pedidos_mesa:        number;
    pedidos_domicilio:   number;
    ticket_promedio:     number;
    total_gastos:        number;
}

interface TopPlato {
    name:     string;
    vendidos: number;
    ingresos: number;
}

interface VentaDia {
    fecha:   string;
    total:   number;
    pedidos: number;
}

interface Novedad {
    type:  string;
    total: number;
}

interface InventarioCritico {
    id:       number;
    name:     string;
    quantity: number;
    unit:     string;
    status:   string;
}

interface Props {
    resumen:            Resumen;
    top_platos:         TopPlato[];
    ventas_por_dia:     VentaDia[];
    novedades:          Novedad[];
    inventario_critico: InventarioCritico[];
    filters:            { desde: string; hasta: string };
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n);
}

const NOVEDAD_LABEL: Record<string, string> = {
    quemado:  'Quemado',
    cancelado:'Cancelado',
    devuelto: 'Devuelto',
    dañado:   'Dañado',
    otro:     'Otro',
};

const INV_STATUS: Record<string, { label: string; cls: string }> = {
    bajo:    { label: 'Stock bajo',  cls: 'text-amber-600 dark:text-amber-400' },
    agotado: { label: 'Agotado',     cls: 'text-red-500'                        },
    vencido: { label: 'Vencido',     cls: 'text-red-600'                        },
};

const REPORTES = [
    { tipo: 'caja',            label: 'Caja',            desc: 'Todos los pagos registrados'     },
    { tipo: 'cierre_caja',     label: 'Cierre de Caja',  desc: 'Resumen de efectivo por método'  },
    { tipo: 'cierre_datafono', label: 'Cierre Datáfono', desc: 'Transacciones electrónicas'       },
    { tipo: 'pedidos',         label: 'Pedidos',         desc: 'Historial completo de pedidos'   },
    { tipo: 'cocina',          label: 'Cocina',          desc: 'Listado general de pedidos'      },
    { tipo: 'novedades',       label: 'Novedades',       desc: 'Pérdidas y alertas de cocina'    },
    { tipo: 'domicilio',       label: 'Domicilio',       desc: 'Domicilios por repartidor'       },
    { tipo: 'inventario',      label: 'Inventario',      desc: 'Stock y bodega actual'           },
    { tipo: 'gastos',          label: 'Gastos',          desc: 'Gastos y egresos del período'    },
] as const;

// ── Spinner inline ──────────────────────────────────────────────────────────────
function Spin() {
    return <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />;
}

// ── Barra de progreso limpia ────────────────────────────────────────────────────
function Bar({ pct, primary = false }: { pct: number; primary?: boolean }) {
    return (
        <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-300 ${primary ? 'bg-primary/70' : 'bg-foreground/25'}`}
                style={{ width: `${Math.max(pct * 100, pct > 0 ? 3 : 0)}%` }}
            />
        </div>
    );
}

// ── Etiqueta de sección ─────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-4">
            {children}
        </p>
    );
}

export default function Reporte({
    resumen, top_platos, ventas_por_dia, novedades, inventario_critico, filters,
}: Props) {
    const [desde, setDesde]         = useState(filters.desde);
    const [hasta, setHasta]         = useState(filters.hasta);
    const [downloading, setDownloading] = useState<string | null>(null);

    function applyFilters() {
        router.get('/reporte', { desde, hasta }, { preserveState: true });
    }

    async function descargar(tipo: string, formato: string) {
        const key = `${tipo}-${formato}`;
        if (downloading) return;
        setDownloading(key);
        try {
            const params = new URLSearchParams({ tipo, formato, desde, hasta });
            const res = await fetch(`/reporte/exportar?${params}`, {
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });
            if (!res.ok) throw new Error('Error al generar el reporte');
            const blob   = await res.blob();
            const ext    = formato === 'xlsx' ? 'xlsx' : 'pdf';
            const suffix = formato === 'pos' ? '_pos' : '';
            const url    = URL.createObjectURL(blob);
            const a      = document.createElement('a');
            a.href       = url;
            a.download   = `${tipo}_${desde}_${hasta}${suffix}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            alert('No se pudo generar el reporte. Intenta de nuevo.');
        } finally {
            setDownloading(null);
        }
    }

    const maxVentas   = Math.max(...ventas_por_dia.map(d => d.total), 1);
    const maxVendidos = Math.max(...top_platos.map(p => p.vendidos), 1);

    const kpis = [
        { label: 'Ventas del período',  value: fmt(resumen.total_ventas),         icon: DollarSign,   main: true  },
        { label: 'Pedidos totales',     value: String(resumen.total_pedidos),      icon: ShoppingBag,  main: false },
        { label: 'Ticket promedio',     value: fmt(resumen.ticket_promedio),       icon: TrendingUp,   main: false },
        { label: 'Domicilios',          value: String(resumen.pedidos_domicilio),  icon: Bike,         main: false },
        { label: 'Gastos del período',  value: fmt(resumen.total_gastos),          icon: TrendingDown, main: false },
    ] as const;

    return (
        <AppShell title="Reporte" subtitle="Análisis de ventas y operaciones">
            <Head title="Reporte" />
            <PlanGate feature="analytics">

            {/* ── Filtro de período ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-4 items-end mb-6 p-4 rounded-2xl border border-border bg-card">
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Desde</label>
                    <input
                        type="date" value={desde}
                        onChange={e => setDesde(e.target.value)}
                        className="h-9 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Hasta</label>
                    <input
                        type="date" value={hasta}
                        onChange={e => setHasta(e.target.value)}
                        className="h-9 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <button
                    onClick={applyFilters}
                    className="h-9 px-5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Aplicar
                </button>
            </div>

            {/* ── KPIs ──────────────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
                {kpis.map(({ label, value, icon: Icon, main }) => (
                    <div
                        key={label}
                        className={`rounded-2xl border p-5 ${main ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {label}
                            </span>
                            <Icon className={`h-3.5 w-3.5 ${main ? 'text-primary/60' : 'text-muted-foreground/40'}`} />
                        </div>
                        <div className={`font-display text-2xl font-bold tracking-tight ${main ? 'text-primary' : 'text-foreground'}`}>
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Ventas por día + Top platos ───────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2 mb-6">

                {/* Ventas por día */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-muted-foreground/60" />
                        <h2 className="font-semibold text-sm text-foreground">Ventas por día</h2>
                    </div>
                    <SectionLabel>Período seleccionado</SectionLabel>

                    {ventas_por_dia.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Sin datos en el rango.</p>
                    ) : (
                        <div className="space-y-3.5">
                            {ventas_por_dia.map(day => (
                                <div key={day.fecha}>
                                    <div className="flex justify-between items-baseline text-sm mb-1.5">
                                        <span className="text-muted-foreground text-xs">
                                            {new Date(day.fecha + 'T12:00').toLocaleDateString('es-CO', {
                                                weekday: 'short', day: 'numeric', month: 'short',
                                            })}
                                        </span>
                                        <div className="text-right">
                                            <span className="font-semibold text-foreground text-sm">{fmt(day.total)}</span>
                                            <span className="text-muted-foreground/60 text-xs ml-2">{day.pedidos} ped.</span>
                                        </div>
                                    </div>
                                    <Bar pct={day.total / maxVentas} primary />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top platos */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-semibold text-sm text-foreground mb-1">Top platos</h2>
                    <SectionLabel>Por unidades vendidas</SectionLabel>

                    {top_platos.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Sin datos en el rango.</p>
                    ) : (
                        <div className="space-y-4">
                            {top_platos.map((p, i) => (
                                <div key={p.name}>
                                    <div className="flex justify-between items-baseline text-sm mb-1.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[10px] font-bold text-muted-foreground/50 w-4 shrink-0 text-right">
                                                {i + 1}
                                            </span>
                                            <span className="font-medium text-foreground truncate">{p.name}</span>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <span className="font-semibold text-foreground text-sm">{fmt(p.ingresos)}</span>
                                            <span className="text-muted-foreground/60 text-xs ml-2">{p.vendidos} uds.</span>
                                        </div>
                                    </div>
                                    <div className="pl-6">
                                        <Bar pct={p.vendidos / maxVendidos} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Novedades + Inventario crítico ────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2 mb-6">

                {/* Novedades de cocina */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground/60" />
                        <h2 className="font-semibold text-sm text-foreground">Novedades de cocina</h2>
                    </div>
                    <SectionLabel>Pérdidas y alertas registradas</SectionLabel>

                    {novedades.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Sin novedades en el rango.</p>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {novedades.map(n => (
                                <div key={n.type} className="flex justify-between items-center py-2.5 text-sm">
                                    <span className="text-foreground/80">{NOVEDAD_LABEL[n.type] ?? n.type}</span>
                                    <span className="font-semibold tabular-nums text-foreground">{n.total}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Inventario crítico */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-muted-foreground/60" />
                        <h2 className="font-semibold text-sm text-foreground">Inventario crítico</h2>
                    </div>
                    <SectionLabel>Productos con atención requerida</SectionLabel>

                    {inventario_critico.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Todo el inventario está en orden.</p>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {inventario_critico.map(item => {
                                const st = INV_STATUS[item.status];
                                return (
                                    <div key={item.id} className="flex justify-between items-center py-2.5 text-sm">
                                        <div>
                                            <span className="font-medium text-foreground/80">{item.name}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {item.quantity} {item.unit}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-semibold ${st?.cls ?? 'text-muted-foreground'}`}>
                                            {st?.label ?? item.status}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Exportar reportes ─────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-1">
                    <Download className="h-4 w-4 text-muted-foreground/60" />
                    <h2 className="font-semibold text-sm text-foreground">Exportar reportes</h2>
                </div>
                <SectionLabel>Período seleccionado · Excel · PDF carta (A4) · PDF POS (80 mm)</SectionLabel>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {REPORTES.map(({ tipo, label, desc }) => {
                        const loadingXlsx = downloading === `${tipo}-xlsx`;
                        const loadingPdf  = downloading === `${tipo}-pdf`;
                        const loadingPos  = downloading === `${tipo}-pos`;

                        const btnCls = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/30 transition-colors disabled:opacity-40 disabled:cursor-wait';

                        return (
                            <div key={tipo} className="rounded-xl border border-border bg-muted/5 p-4">
                                <div className="font-semibold text-sm text-foreground mb-0.5">{label}</div>
                                <div className="text-xs text-muted-foreground mb-3 leading-relaxed">{desc}</div>
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button onClick={() => descargar(tipo, 'xlsx')} disabled={!!downloading} className={btnCls} title="Exportar Excel">
                                        {loadingXlsx ? <><Spin /> ...</> : <><FileSpreadsheet className="h-3 w-3" /> Excel</>}
                                    </button>
                                    <button onClick={() => descargar(tipo, 'pdf')} disabled={!!downloading} className={btnCls} title="Exportar PDF carta (A4)">
                                        {loadingPdf ? <><Spin /> ...</> : <><FileText className="h-3 w-3" /> PDF</>}
                                    </button>
                                    <button onClick={() => descargar(tipo, 'pos')} disabled={!!downloading} className={btnCls} title="Exportar PDF POS (80 mm)">
                                        {loadingPos ? <><Spin /> ...</> : <><Printer className="h-3 w-3" /> POS</>}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            </PlanGate>
        </AppShell>
    );
}
