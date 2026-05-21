import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Clock, Save, Power, AlertTriangle } from 'lucide-react';

interface DaySchedule {
    activo:   boolean;
    apertura: string;
    cierre:   string;
}

interface Schedule {
    lun: DaySchedule;
    mar: DaySchedule;
    mie: DaySchedule;
    jue: DaySchedule;
    vie: DaySchedule;
    sab: DaySchedule;
    dom: DaySchedule;
}

interface Props {
    schedule:     Schedule;
    last_closing: string | null;
    flash?:       { success?: string; error?: string };
}

const DAYS: { key: keyof Schedule; label: string; jsDay: number }[] = [
    { key: 'lun', label: 'Lunes',     jsDay: 1 },
    { key: 'mar', label: 'Martes',    jsDay: 2 },
    { key: 'mie', label: 'Miércoles', jsDay: 3 },
    { key: 'jue', label: 'Jueves',    jsDay: 4 },
    { key: 'vie', label: 'Viernes',   jsDay: 5 },
    { key: 'sab', label: 'Sábado',    jsDay: 6 },
    { key: 'dom', label: 'Domingo',   jsDay: 0 },
];

const DEFAULT_DAY: DaySchedule = { activo: true, apertura: '08:00', cierre: '22:00' };

type OpStatus = 'abierto' | 'por_abrir' | 'cerrado_hoy' | 'dia_cerrado';

function toMins(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

function getDayStatus(day: DaySchedule, isToday: boolean, now: Date): OpStatus {
    if (!day.activo) return 'dia_cerrado';
    if (!isToday)    return 'abierto';
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (nowMins < toMins(day.apertura)) return 'por_abrir';
    if (nowMins >= toMins(day.cierre))  return 'cerrado_hoy';
    return 'abierto';
}

const STATUS_STYLE: Record<OpStatus, { label: string; className: string }> = {
    abierto:      { label: 'Abierto',    className: 'bg-accent/10 text-accent' },
    por_abrir:    { label: 'Por abrir',  className: 'bg-blue-500/10 text-blue-400' },
    cerrado_hoy:  { label: 'Cerrado',    className: 'bg-red-500/15 text-red-400' },
    dia_cerrado:  { label: 'Cerrado',    className: 'bg-muted text-muted-foreground' },
};

const TOGGLE_COLOR: Record<OpStatus, string> = {
    abierto:     'bg-primary',
    por_abrir:   'bg-blue-500',
    cerrado_hoy: 'bg-red-500',
    dia_cerrado: 'bg-muted-foreground/30',
};

export default function Horario({ schedule: initialSchedule, last_closing, flash }: Props) {
    const [schedule, setSchedule] = useState<Schedule>({
        lun: initialSchedule?.lun ?? DEFAULT_DAY,
        mar: initialSchedule?.mar ?? DEFAULT_DAY,
        mie: initialSchedule?.mie ?? DEFAULT_DAY,
        jue: initialSchedule?.jue ?? DEFAULT_DAY,
        vie: initialSchedule?.vie ?? DEFAULT_DAY,
        sab: initialSchedule?.sab ?? { activo: true, apertura: '09:00', cierre: '23:00' },
        dom: initialSchedule?.dom ?? { activo: false, apertura: '09:00', cierre: '21:00' },
    });
    const [saving,         setSaving]         = useState(false);
    const [closingJornada, setClosingJornada] = useState(false);
    const [showConfirm,    setShowConfirm]    = useState(false);
    const [now,            setNow]            = useState(() => new Date());

    // Actualiza el reloj cada minuto para que el badge cambie en tiempo real
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    const todayJsDay = now.getDay();

    function updateDay(key: keyof Schedule, field: keyof DaySchedule, value: boolean | string) {
        setSchedule(s => ({ ...s, [key]: { ...s[key], [field]: value } }));
    }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        router.post('/configuracion/horario', schedule as Record<string, DaySchedule>, {
            onFinish: () => setSaving(false),
        });
    }

    function handleCierreJornada() {
        setClosingJornada(true);
        setShowConfirm(false);
        router.post('/configuracion/cierre-jornada', {}, {
            onFinish: () => setClosingJornada(false),
        });
    }

    return (
        <AppShell title="Horario de trabajo" subtitle="Define el horario operativo por día y gestiona el cierre de jornada">
            <Head title="Horario de trabajo" />

            <div className="max-w-3xl space-y-6">

                {flash?.success && (
                    <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                        {flash.success}
                    </div>
                )}

                {/* Horario por día */}
                <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <h2 className="font-display text-base font-bold">Horario por día</h2>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-3">
                        Configura la hora de apertura y cierre estimado para cada día de la semana.
                    </p>

                    <div className="space-y-3">
                        {DAYS.map(({ key, label, jsDay }) => {
                            const day     = schedule[key];
                            const isToday = jsDay === todayJsDay;
                            const status  = getDayStatus(day, isToday, now);
                            const { label: statusLabel, className: statusClass } = STATUS_STYLE[status];
                            const toggleColor = TOGGLE_COLOR[status];
                            const dimmed  = status === 'dia_cerrado' || status === 'cerrado_hoy';

                            return (
                                <div
                                    key={key}
                                    className={`rounded-xl border p-4 transition-colors ${isToday ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'} ${dimmed ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex flex-wrap items-center gap-4">
                                        {/* Toggle activo */}
                                        <button
                                            type="button"
                                            onClick={() => updateDay(key, 'activo', !day.activo)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${toggleColor}`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${day.activo ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                                        </button>

                                        {/* Día */}
                                        <span className="w-24 text-sm font-medium text-foreground">
                                            {label}
                                            {isToday && <span className="ml-1.5 text-xs text-primary font-normal">(hoy)</span>}
                                        </span>

                                        {/* Horas */}
                                        <div className="flex items-center gap-3 ml-auto">
                                            <div className="flex items-center gap-1.5">
                                                <label className="text-xs text-muted-foreground">Apertura</label>
                                                <input
                                                    type="time"
                                                    value={day.apertura}
                                                    disabled={!day.activo}
                                                    onChange={e => updateDay(key, 'apertura', e.target.value)}
                                                    className="h-8 rounded-lg border border-input bg-input px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-40"
                                                />
                                            </div>
                                            <span className="text-muted-foreground text-xs">—</span>
                                            <div className="flex items-center gap-1.5">
                                                <label className="text-xs text-muted-foreground">Cierre</label>
                                                <input
                                                    type="time"
                                                    value={day.cierre}
                                                    disabled={!day.activo}
                                                    onChange={e => updateDay(key, 'cierre', e.target.value)}
                                                    className="h-8 rounded-lg border border-input bg-input px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-40"
                                                />
                                            </div>
                                        </div>

                                        {/* Badge de estado operativo */}
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? 'Guardando...' : 'Guardar horario'}
                        </button>
                    </div>
                </form>

                {/* Cierre de jornada */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Power className="h-4 w-4 text-red-400" />
                        <h2 className="font-display text-base font-bold">Cierre de jornada</h2>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Al cerrar la jornada, todos los pedidos activos son archivados y las mesas quedan liberadas para el inicio del siguiente turno. La información queda guardada en el historial.
                    </p>

                    {last_closing && (
                        <p className="text-xs text-muted-foreground">
                            Último cierre: <span className="font-medium text-foreground">{last_closing}</span>
                        </p>
                    )}

                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex gap-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-300/80">
                            Esta acción archiva todos los pedidos que no hayan sido cerrados. Asegúrate de haber cobrado o gestionado todas las cuentas pendientes antes de cerrar la jornada.
                        </p>
                    </div>

                    {!showConfirm ? (
                        <button
                            type="button"
                            onClick={() => setShowConfirm(true)}
                            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                            <Power className="h-4 w-4" />
                            Cerrar jornada
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-foreground">¿Confirmar cierre de jornada?</span>
                            <button
                                type="button"
                                onClick={handleCierreJornada}
                                disabled={closingJornada}
                                className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {closingJornada ? 'Cerrando...' : 'Sí, cerrar'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
