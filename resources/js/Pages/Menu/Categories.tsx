import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight, ChevronUp, ChevronDown } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    sort_order: number;
    dishes_count: number;
}

interface Props {
    categories: Category[];
    flash?: { success?: string; error?: string };
}

interface FormFields {
    name: string;
    description: string;
    sort_order: number;
    active: boolean;
}

export default function Categories({ categories, flash }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing]     = useState<Category | null>(null);

    const nextPosition = (categories.length > 0
        ? Math.max(...categories.map(c => c.sort_order)) + 1
        : 1);

    const form = useForm<FormFields>({ name: '', description: '', sort_order: nextPosition, active: true });

    function openCreate() {
        form.reset();
        form.setData('sort_order', nextPosition);
        setEditing(null);
        setShowModal(true);
    }

    function openEdit(cat: Category) {
        form.setData({ name: cat.name, description: cat.description ?? '', sort_order: cat.sort_order, active: cat.active });
        setEditing(cat);
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        form.reset();
        setEditing(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/menu/categorias/${editing.id}`, { onSuccess: closeModal });
        } else {
            form.post('/menu/categorias', { onSuccess: closeModal });
        }
    }

    function handleDelete(cat: Category) {
        if (!confirm(`¿Eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`)) return;
        router.delete(`/menu/categorias/${cat.id}`);
    }

    function toggleActive(cat: Category) {
        router.put(`/menu/categorias/${cat.id}`, {
            name: cat.name,
            description: cat.description ?? '',
            sort_order: cat.sort_order,
            active: !cat.active,
        });
    }

    function reorder(cat: Category, direction: 'up' | 'down') {
        router.post(`/menu/categorias/${cat.id}/reorder`, { direction });
    }

    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);

    return (
        <AppShell title="Categorías" subtitle="Organiza tu Menu por categorías">
            <Head title="Categorías" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 text-sm">{flash.error}</div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">
                    {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
                </p>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" /> Nueva categoría
                </button>
            </div>

            {/* Lista */}
            {sorted.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin categorías</p>
                    <p className="text-sm text-muted-foreground mt-1">Crea la primera categoría para empezar a organizar tu Menu.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                            <tr>
                                <th className="text-center px-4 py-3 font-medium w-24">Posición</th>
                                <th className="text-left px-6 py-3 font-medium">Categoría</th>
                                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Descripción</th>
                                <th className="text-center px-6 py-3 font-medium">Platos</th>
                                <th className="text-center px-6 py-3 font-medium">Estado</th>
                                <th className="text-right px-6 py-3 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sorted.map((cat, idx) => (
                                <tr key={cat.id} className="hover:bg-muted/20 transition-colors">

                                    {/* Posición + flechas */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={() => reorder(cat, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-0.5 rounded hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-muted-foreground hover:text-foreground"
                                                    title="Subir"
                                                >
                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => reorder(cat, 'down')}
                                                    disabled={idx === sorted.length - 1}
                                                    className="p-0.5 rounded hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-muted-foreground hover:text-foreground"
                                                    title="Bajar"
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <span className="w-6 text-center text-xs font-mono text-muted-foreground tabular-nums">
                                                {cat.sort_order}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 font-medium">{cat.name}</td>
                                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{cat.description ?? '—'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                            {cat.dishes_count}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => toggleActive(cat)} className="inline-flex items-center gap-1 text-xs">
                                            {cat.active
                                                ? <><ToggleRight className="h-5 w-5 text-accent" /><span className="text-accent">Activa</span></>
                                                : <><ToggleLeft className="h-5 w-5 text-muted-foreground" /><span className="text-muted-foreground">Inactiva</span></>
                                            }
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex gap-2">
                                            <button
                                                onClick={() => openEdit(cat)}
                                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                                disabled={cat.dishes_count > 0}
                                                title={cat.dishes_count > 0 ? 'Tiene platos asociados' : 'Eliminar'}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal crear/editar */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <h2 className="font-display text-lg font-bold mb-5">
                            {editing ? 'Editar categoría' : 'Nueva categoría'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Nombre <span className="text-red-400">*</span>
                                </label>
                                <input
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.name}
                                    onChange={e => form.setData('name', e.target.value)}
                                    placeholder="Ej: Entradas, Bebidas..."
                                    autoFocus
                                />
                                {form.errors.name && <p className="text-xs text-red-400 mt-1">{form.errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Descripción</label>
                                <input
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.description}
                                    onChange={e => form.setData('description', e.target.value)}
                                    placeholder="Descripción opcional..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Posición en el Menu
                                </label>
                                <input
                                    type="number" min={1}
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.sort_order}
                                    onChange={e => form.setData('sort_order', Math.max(1, Number(e.target.value)))}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Si la posición ya está ocupada, las demás categorías se desplazarán automáticamente.
                                </p>
                                {form.errors.sort_order && <p className="text-xs text-red-400 mt-1">{form.errors.sort_order}</p>}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
                                >
                                    {form.processing ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
