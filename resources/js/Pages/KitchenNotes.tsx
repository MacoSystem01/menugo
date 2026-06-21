import AppShell from '@/Layouts/AppShell';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Plus, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '@/types';

interface Note {
    id: number;
    type: string;
    description: string;
    order_id: number | null;
    order_turn_number: number | null;
    dish: string | null;
    author: string | null;
    created_at: string;
    verified_at: string | null;
    verified_by: string | null;
}

interface DishOption {
    id: number;
    name: string;
}

interface OrderOption {
    id: number;
    turn_number: number | null;
    customer_name: string;
}

interface Props {
    notes: Note[];
    dishes: DishOption[];
    orders: OrderOption[];
    flash?: { success?: string };
}

interface NoteForm {
    type: string;
    description: string;
    order_id: number | string;
    dish_id: number | string;
}

const TYPE_LABEL: Record<string, string> = {
    quemado:   'Quemado',
    cancelado: 'Cancelado',
    devuelto:  'Devuelto',
    dañado:    'Dañado',
    otro:      'Otro',
};

const TYPE_CLASS: Record<string, string> = {
    quemado:   'bg-red-500/15 text-red-400',
    cancelado: 'bg-muted text-muted-foreground',
    devuelto:  'bg-yellow-500/15 text-yellow-400',
    dañado:    'bg-orange-500/15 text-orange-400',
    otro:      'bg-blue-500/15 text-blue-400',
};

export default function KitchenNotes({ notes, dishes, orders, flash }: Props) {
    const { auth } = usePage<PageProps>().props;
    const [showModal, setShowModal] = useState(false);

    const canVerify = auth.user.roles.includes('administrador') || auth.user.roles.includes('gerente');

    const form = useForm<NoteForm>({ type: 'otro', description: '', order_id: '', dish_id: '' });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/cocina/novedades', { onSuccess: () => { form.reset(); setShowModal(false); } });
    }

    function verificar(id: number) {
        router.post(`/cocina/novedades/${id}/verificar`);
    }

    return (
        <AppShell title="Novedades" subtitle="Registro de incidencias en cocina">
            <Head title="Novedades de Cocina" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}

            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">{notes.length} novedad{notes.length !== 1 ? 'es' : ''}</p>
                <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Plus className="h-4 w-4" /> Registrar novedad
                </button>
            </div>

            {notes.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin novedades</p>
                    <p className="text-sm text-muted-foreground mt-1">No hay incidencias registradas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map(note => (
                        <div key={note.id} className={`rounded-2xl border bg-card p-5 ${note.verified_at ? 'border-accent/30' : 'border-border'}`}>
                            <div className="flex items-start gap-4">
                                <span className={`mt-0.5 shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_CLASS[note.type] ?? 'bg-muted text-muted-foreground'}`}>
                                    {TYPE_LABEL[note.type] ?? note.type}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">{note.description}</p>
                                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        {note.dish    && <span>Plato: {note.dish}</span>}
                                        {note.order_id && <span>Pedido #{note.order_turn_number ?? note.order_id}</span>}
                                        {note.author   && <span>Por: {note.author}</span>}
                                        <span>{note.created_at}</span>
                                    </div>

                                    {/* Estado de verificación */}
                                    {note.verified_at ? (
                                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent font-medium">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Verificado por {note.verified_by} · {note.verified_at}
                                        </div>
                                    ) : canVerify ? (
                                        <button
                                            onClick={() => verificar(note.id)}
                                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
                                        >
                                            <ShieldCheck className="h-3.5 w-3.5" /> Verificar
                                        </button>
                                    ) : (
                                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <ShieldCheck className="h-3.5 w-3.5" /> Pendiente de verificación
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <h2 className="font-display text-lg font-bold mb-5">Registrar novedad</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Tipo <span className="text-red-400">*</span></label>
                                <select
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.type}
                                    onChange={e => form.setData('type', e.target.value)}
                                >
                                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Descripción <span className="text-red-400">*</span></label>
                                <textarea
                                    rows={3}
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    value={form.data.description}
                                    onChange={e => form.setData('description', e.target.value)}
                                    placeholder="Describe la incidencia..."
                                    autoFocus
                                />
                                {form.errors.description && <p className="text-xs text-red-400 mt-1">{form.errors.description}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Pedido asociado</label>
                                    <select
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.order_id}
                                        onChange={e => form.setData('order_id', e.target.value)}
                                    >
                                        <option value="">Ninguno</option>
                                        {orders.map(o => <option key={o.id} value={o.id}>#{o.turn_number ?? o.id} {o.customer_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Plato asociado</label>
                                    <select
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.dish_id}
                                        onChange={e => form.setData('dish_id', e.target.value)}
                                    >
                                        <option value="">Ninguno</option>
                                        {dishes.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowModal(false); form.reset(); }}
                                    className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={form.processing}
                                    className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
                                    {form.processing ? 'Guardando...' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
