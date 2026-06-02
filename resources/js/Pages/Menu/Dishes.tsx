import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Utensils, ToggleLeft, ToggleRight } from 'lucide-react';
import { usePlan } from '@/hooks/use-plan';

interface Category {
    id: number;
    name: string;
}

interface Dish {
    id: number;
    name: string;
    description: string | null;
    price: number;
    available: boolean;
    sort_order: number;
    category_id: number;
    category: string | null;
}

interface Props {
    dishes: Dish[];
    categories: Category[];
    dish_count: number;        // conteo real desde la DB (backend)
    dish_limit: number | null; // límite real según plan (backend) — null = ilimitado
    flash?: { success?: string; error?: string };
}

interface FormFields {
    category_id: number | string;
    name: string;
    description: string;
    price: number | string;
    sort_order: number;
    available: boolean;
}

const CAT_PALETTE = [
    { bg: 'rgba(251,146,60,0.18)', color: '#fb923c', border: 'rgba(251,146,60,0.45)' },
    { bg: 'rgba(34,211,238,0.18)', color: '#22d3ee', border: 'rgba(34,211,238,0.45)' },
    { bg: 'rgba(167,139,250,0.18)', color: '#a78bfa', border: 'rgba(167,139,250,0.45)' },
    { bg: 'rgba(52,211,153,0.18)', color: '#34d399', border: 'rgba(52,211,153,0.45)' },
    { bg: 'rgba(251,113,133,0.18)', color: '#fb7185', border: 'rgba(251,113,133,0.45)' },
    { bg: 'rgba(250,204,21,0.18)', color: '#facc15', border: 'rgba(250,204,21,0.45)' },
    { bg: 'rgba(96,165,250,0.18)', color: '#60a5fa', border: 'rgba(96,165,250,0.45)' },
    { bg: 'rgba(244,114,182,0.18)', color: '#f472b6', border: 'rgba(244,114,182,0.45)' },
    { bg: 'rgba(74,222,128,0.18)', color: '#4ade80', border: 'rgba(74,222,128,0.45)' },
    { bg: 'rgba(251,191,36,0.18)', color: '#fbbf24', border: 'rgba(251,191,36,0.45)' },
    { bg: 'rgba(129,140,248,0.18)', color: '#818cf8', border: 'rgba(129,140,248,0.45)' },
    { bg: 'rgba(45,212,191,0.18)', color: '#2dd4bf', border: 'rgba(45,212,191,0.45)' },
];

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

export default function Dishes({ dishes, categories, dish_count, dish_limit, flash }: Props) {
    // Usar valores del servidor (fuente de verdad real) en lugar del hook
    const { planName, requiredPlanFor } = usePlan();
    const limit = dish_limit;                              // null = ilimitado
    const atLimit = limit !== null && dish_count >= limit;  // usa conteo real de DB
    const nearLimit = limit !== null && dish_count >= limit - 5 && !atLimit;

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Dish | null>(null);
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState<number | null>(null);

    const form = useForm<FormFields>({
        category_id: '',
        name: '', description: '', price: '', sort_order: 0, available: true,
    });

    const colorMap = useMemo(() => {
        const map = new Map<number, typeof CAT_PALETTE[0]>();
        categories.forEach((cat, i) => map.set(cat.id, CAT_PALETTE[i % CAT_PALETTE.length]));
        return map;
    }, [categories]);

    const usedCategories = categories.filter(c => dishes.some(d => d.category_id === c.id));

    const filtered = dishes.filter(d => {
        const matchesCat = activeCat === null || d.category_id === activeCat;
        const matchesSearch = !search.trim()
            || d.name.toLowerCase().includes(search.toLowerCase())
            || (d.category ?? '').toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    function openCreate() {
        form.reset();
        if (activeCat !== null) form.setData('category_id', activeCat);
        setEditing(null);
        setShowModal(true);
    }

    function openEdit(dish: Dish) {
        form.setData({
            category_id: dish.category_id,
            name: dish.name,
            description: dish.description ?? '',
            price: dish.price,
            sort_order: dish.sort_order,
            available: dish.available,
        });
        setEditing(dish);
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
            form.put(`/menu/platos/${editing.id}`, { onSuccess: closeModal });
        } else {
            form.post('/menu/platos', { onSuccess: closeModal });
        }
    }

    function handleDelete(dish: Dish) {
        if (!confirm(`¿Eliminar "${dish.name}"?`)) return;
        router.delete(`/menu/platos/${dish.id}`);
    }

    function toggleAvailable(dish: Dish) {
        router.put(`/menu/platos/${dish.id}`, {
            category_id: dish.category_id,
            name: dish.name,
            description: dish.description ?? '',
            price: dish.price,
            sort_order: dish.sort_order,
            available: !dish.available,
        });
    }

    const tableRows: React.ReactNode[] = [];
    let lastCatId: number | null = null;

    filtered.forEach(dish => {
        if (activeCat === null && dish.category_id !== lastCatId) {
            lastCatId = dish.category_id;
            const sepColor = colorMap.get(dish.category_id);
            tableRows.push(
                <tr key={`sep-${dish.category_id}`}
                    style={{ backgroundColor: sepColor ? sepColor.bg : undefined }}>
                    <td colSpan={5} className="px-6 py-2">
                        <span className="text-xs font-bold uppercase tracking-widest"
                            style={{ color: sepColor?.color }}>
                            {dish.category ?? 'Sin categoría'}
                        </span>
                    </td>
                </tr>
            );
        }

        tableRows.push(
            <tr key={dish.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                    <div className="font-medium">{dish.name}</div>
                    {dish.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                            {dish.description}
                        </div>
                    )}
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                    {(() => {
                        const c = colorMap.get(dish.category_id);
                        return (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                                style={{ backgroundColor: c?.bg, color: c?.color, borderColor: c?.border }}>
                                {dish.category ?? '—'}
                            </span>
                        );
                    })()}
                </td>
                <td className="px-6 py-4 text-right font-semibold">{fmt(dish.price)}</td>
                <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleAvailable(dish)} className="inline-flex items-center gap-1 text-xs">
                        {dish.available
                            ? <><ToggleRight className="h-5 w-5 text-accent" /><span className="text-accent">Sí</span></>
                            : <><ToggleLeft className="h-5 w-5 text-muted-foreground" /><span className="text-muted-foreground">No</span></>
                        }
                    </button>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="inline-flex gap-2">
                        <button onClick={() => openEdit(dish)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(dish)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    });

    return (
        <AppShell title="Platos" subtitle="Gestiona los platos de tu Menu">
            <Head title="Platos" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">
                    {flash.success}
                </div>
            )}

            {/* Banner de límite — solo visible si el plan tiene límite (starter) */}
            {limit !== null && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm flex items-center gap-3 ${atLimit
                        ? 'border-destructive/40 bg-destructive/5 text-destructive'
                        : nearLimit
                            ? 'border-amber-400/40 bg-amber-400/5 text-amber-700'
                            : 'border-border bg-muted/30 text-muted-foreground'
                    }`}>
                    <span>{atLimit ? '🔒' : '⚠️'}</span>
                    <span>
                        {atLimit
                            ? `Límite de ${limit} platos alcanzado en el plan ${planName()}. Actualiza al plan ${requiredPlanFor('orders')} para agregar más.`
                            : `Plan ${planName()}: ${dish_count}/${limit} platos usados.`
                        }
                    </span>
                </div>
            )}

            {/* Barra superior */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                <input
                    placeholder="Buscar plato..."
                    className="h-9 rounded-xl border border-input bg-input px-3 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button
                    onClick={openCreate}
                    disabled={atLimit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="h-4 w-4" /> Nuevo plato
                </button>
            </div>

            {/* Pills de categoría */}
            {usedCategories.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-5">
                    <button
                        onClick={() => setActiveCat(null)}
                        className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${activeCat === null
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        Todos
                        <span className="ml-1.5 opacity-70">({dishes.length})</span>
                    </button>
                    {usedCategories.map(cat => {
                        const count = dishes.filter(d => d.category_id === cat.id).length;
                        const c = colorMap.get(cat.id);
                        const isActive = activeCat === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCat(isActive ? null : cat.id)}
                                className="h-7 px-3 rounded-full text-xs font-semibold border transition-all"
                                style={{
                                    backgroundColor: isActive ? c?.color : c?.bg,
                                    color: isActive ? '#0d0d0d' : c?.color,
                                    borderColor: c?.border,
                                    boxShadow: isActive ? `0 0 8px ${c?.border}` : undefined,
                                }}
                            >
                                {cat.name}
                                <span className="ml-1.5 opacity-70">({count})</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Tabla */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <Utensils className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">{search || activeCat ? 'Sin resultados' : 'Sin platos'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {search || activeCat
                            ? 'Intenta con otro término o categoría.'
                            : 'Agrega el primer plato a tu Menu.'}
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-3 font-medium">Plato</th>
                                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Categoría</th>
                                <th className="text-right px-6 py-3 font-medium">Precio</th>
                                <th className="text-center px-6 py-3 font-medium">Disponible</th>
                                <th className="text-right px-6 py-3 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tableRows}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal crear/editar */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <h2 className="font-display text-lg font-bold mb-5">
                            {editing ? 'Editar plato' : 'Nuevo plato'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Error de límite de plan */}
                            {(form.errors as Record<string, string>).plan_limit && (
                                <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                                    <span>🔒</span>
                                    <span>{(form.errors as Record<string, string>).plan_limit}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Categoría <span className="text-red-400">*</span>
                                </label>
                                <select
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.category_id}
                                    onChange={e => form.setData('category_id', Number(e.target.value))}
                                >
                                    <option value="">Seleccionar categoría...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {form.errors.category_id && (
                                    <p className="text-xs text-red-400 mt-1">{form.errors.category_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Nombre <span className="text-red-400">*</span>
                                </label>
                                <input
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.name}
                                    onChange={e => form.setData('name', e.target.value)}
                                    placeholder="Ej: Tacos al pastor..."
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Descripción</label>
                                <textarea
                                    rows={2}
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    value={form.data.description}
                                    onChange={e => form.setData('description', e.target.value)}
                                    placeholder="Descripción opcional..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Precio <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number" min={0} step={0.01}
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.price}
                                    onChange={e => form.setData('price', e.target.value)}
                                    placeholder="0"
                                />
                                {form.errors.price && (
                                    <p className="text-xs text-red-400 mt-1">{form.errors.price}</p>
                                )}
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
                                    {form.processing ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear plato'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}