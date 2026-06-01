import { useEffect, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    AlertTriangle, Clock, HardDrive, TrendingDown,
    Megaphone, XCircle, X, ChevronRight, Bell,
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface SystemAlert {
    type:    'danger' | 'warning' | 'info';
    icon:    string;
    title:   string;
    message: string;
    action:  { label: string; url: string; method?: 'GET' | 'POST' } | null;
}

interface HealthResponse {
    alerts:       SystemAlert[];
    checked_at:   string;
    total_alerts: number;
}

// ── Mapa de iconos ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    'clock':           Clock,
    'alert-triangle':  AlertTriangle,
    'x-circle':        XCircle,
    'hard-drive':      HardDrive,
    'trending-down':   TrendingDown,
    'megaphone':       Megaphone,
};

// ── Colores por tipo ───────────────────────────────────────────────────────────

const TYPE_STYLE = {
    danger:  {
        wrapper: 'bg-red-950/60 border-red-700/60 text-red-100',
        icon:    'text-red-400',
        badge:   'bg-red-500/20 text-red-300',
        action:  'bg-red-600 hover:bg-red-500 text-white',
    },
    warning: {
        wrapper: 'bg-amber-950/60 border-amber-700/60 text-amber-100',
        icon:    'text-amber-400',
        badge:   'bg-amber-500/20 text-amber-300',
        action:  'bg-amber-600 hover:bg-amber-500 text-white',
    },
    info: {
        wrapper: 'bg-blue-950/60 border-blue-700/60 text-blue-100',
        icon:    'text-blue-400',
        badge:   'bg-blue-500/20 text-blue-300',
        action:  'bg-blue-600 hover:bg-blue-500 text-white',
    },
};

// ── Intervalo de sondeo: 90 segundos ──────────────────────────────────────────
// Suficientemente frecuente para alertas oportunas sin saturar el servidor.
const POLL_INTERVAL_MS = 90_000;

// ── Componente principal ───────────────────────────────────────────────────────

export default function SystemAlertBanner() {
    const [alerts, setAlerts]         = useState<SystemAlert[]>([]);
    const [dismissed, setDismissed]   = useState<Set<string>>(new Set());
    const [checkedAt, setCheckedAt]   = useState<string>('');
    const [minimized, setMinimized]   = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const fetchHealth = useCallback(async () => {
        try {
            const res = await fetch('/admin/system-health', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const data: HealthResponse = await res.json();
            setAlerts(data.alerts ?? []);
            setCheckedAt(data.checked_at ?? '');
        } catch {
            // Ignorar errores de red — no bloquear la UI del admin
        }
    }, []);

    useEffect(() => {
        // Carga inicial tras 2 segundos para no bloquear el render de la página
        const initial = setTimeout(fetchHealth, 2000);
        // Sondeo periódico
        const interval = setInterval(fetchHealth, POLL_INTERVAL_MS);
        return () => { clearTimeout(initial); clearInterval(interval); };
    }, [fetchHealth]);

    // Limpiar dismissed cuando llegan nuevas alertas (puede haber cambiado el estado)
    const visibleAlerts = alerts.filter(a => !dismissed.has(a.title));

    if (visibleAlerts.length === 0) return null;

    // ── Badge mínimo cuando está colapsado ────────────────────────────────────
    if (minimized) {
        const hasDanger  = visibleAlerts.some(a => a.type === 'danger');
        const hasWarning = visibleAlerts.some(a => a.type === 'warning');
        const badgeColor = hasDanger ? 'bg-red-600' : hasWarning ? 'bg-amber-500' : 'bg-blue-500';

        return (
            <button
                onClick={() => setMinimized(false)}
                className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-white text-sm font-medium ${badgeColor} hover:opacity-90 transition-opacity`}
                title="Ver alertas del sistema"
            >
                <Bell className="h-4 w-4" />
                {visibleAlerts.length} alerta{visibleAlerts.length !== 1 ? 's' : ''}
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[420px] max-w-[calc(100vw-2rem)] flex flex-col gap-2 pointer-events-none">
            {/* Header strip */}
            <div className="flex items-center justify-between bg-zinc-900/95 border border-zinc-700/60 rounded-t-xl px-3 py-2 pointer-events-auto backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                    <Bell className="h-3.5 w-3.5 text-amber-400" />
                    <span>Alertas del sistema</span>
                    {checkedAt && (
                        <span className="text-zinc-500">· actualizado {checkedAt}</span>
                    )}
                </div>
                <button
                    onClick={() => setMinimized(true)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Minimizar"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Alert cards */}
            <div className="flex flex-col gap-1.5 pointer-events-auto max-h-[70vh] overflow-y-auto">
                {visibleAlerts.map((alert) => {
                    const style   = TYPE_STYLE[alert.type];
                    const IconCmp = ICON_MAP[alert.icon] ?? AlertTriangle;

                    return (
                        <div
                            key={alert.title}
                            className={`flex gap-3 items-start p-3 border rounded-xl shadow-lg backdrop-blur-sm ${style.wrapper}`}
                        >
                            <div className={`mt-0.5 shrink-0 ${style.icon}`}>
                                <IconCmp className="h-4 w-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-tight">{alert.title}</p>
                                <p className="text-xs mt-1 opacity-80 leading-relaxed">{alert.message}</p>

                                {alert.action && (
                                    <button
                                        disabled={loadingAction === alert.title}
                                        onClick={async () => {
                                            if (alert.action!.method === 'POST') {
                                                setLoadingAction(alert.title);
                                                try {
                                                    const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
                                                    await fetch(alert.action!.url, {
                                                        method: 'POST',
                                                        headers: { 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                                                        credentials: 'same-origin',
                                                    });
                                                    await fetchHealth();
                                                } finally {
                                                    setLoadingAction(null);
                                                }
                                            } else {
                                                router.visit(alert.action!.url);
                                            }
                                        }}
                                        className={`mt-2 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-colors disabled:opacity-50 ${style.action}`}
                                    >
                                        {loadingAction === alert.title ? 'Procesando…' : alert.action.label}
                                        {loadingAction !== alert.title && <ChevronRight className="h-3 w-3" />}
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => setDismissed(prev => new Set(prev).add(alert.title))}
                                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
                                title="Descartar"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
