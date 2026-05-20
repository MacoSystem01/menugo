import AppShell from '@/Layouts/AppShell';
import { Head, router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Upload, Trash2, Eye, EyeOff, ImagePlus, ExternalLink, Info, Images } from 'lucide-react';

interface Ad {
    id:         number;
    image_url:  string;
    title:      string | null;
    url:        string | null;
    sort_order: number;
    active:     boolean;
}

interface Props {
    ads:   Ad[];
    flash?: { success?: string; error?: string };
}

export default function Publicidad({ ads, flash }: Props) {
    const fileRef              = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    /* ── useForm es el método correcto de Inertia v3 para uploads ── */
    const form = useForm({
        image: null as File | null,
        title: '',
        url:   '',
    });

    function pickFile(file: File) {
        form.setData('image', file);
        setPreview(URL.createObjectURL(file));
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) pickFile(file);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.data.image) return;

        form.post('/admin/publicidad', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setPreview(null);
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    }

    function toggle(id: number) {
        router.patch(`/admin/publicidad/${id}/toggle`, {}, { preserveScroll: true });
    }

    function destroy(id: number) {
        if (!confirm('¿Eliminar este anuncio?')) return;
        router.delete(`/admin/publicidad/${id}`, { preserveScroll: true });
    }

    return (
        <AppShell variant="admin" title="Publicidad" subtitle="Slider de anuncios en la página de inicio">
            <Head title="SuperAdmin - Publicidad" />

            {flash?.success && (
                <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent font-medium">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {flash.error}
                </div>
            )}

            <div className="grid gap-8 xl:grid-cols-5">

                {/* ── Panel de subida (izquierda) ── */}
                <div className="xl:col-span-2">
                    <div className="rounded-2xl border border-border bg-card p-6 sticky top-24">
                        <h2 className="font-display text-base font-bold mb-5 flex items-center gap-2">
                            <ImagePlus className="h-4 w-4 text-primary" />
                            Nuevo anuncio
                        </h2>

                        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">

                            {/* Zona drag & drop */}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors overflow-hidden flex items-center justify-center
                                    ${dragging
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
                                style={{ minHeight: '180px' }}
                            >
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Vista previa"
                                        className="w-full object-cover"
                                        style={{ minHeight: '180px', maxHeight: '220px' }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                                            <Upload className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Arrastra una imagen</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">o haz clic para seleccionar</p>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">JPG · PNG · WebP · Máx. 5 MB</p>
                                    </div>
                                )}

                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) pickFile(f);
                                    }}
                                />
                            </div>
                            {form.errors.image && (
                                <p className="text-xs text-red-400 -mt-2">{form.errors.image}</p>
                            )}

                            {/* Si hay preview, botón para quitar */}
                            {preview && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        form.setData('image', null);
                                        setPreview(null);
                                        if (fileRef.current) fileRef.current.value = '';
                                    }}
                                    className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                                >
                                    × Quitar imagen
                                </button>
                            )}

                            {/* Título */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Título del establecimiento <span className="opacity-50">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={e => form.setData('title', e.target.value)}
                                    placeholder="Ej: La Trattoria Italiana"
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {form.errors.title && (
                                    <p className="text-xs text-red-400 mt-1">{form.errors.title}</p>
                                )}
                            </div>

                            {/* URL */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Enlace al menú o sitio <span className="opacity-50">(opcional)</span>
                                </label>
                                <input
                                    type="url"
                                    value={form.data.url}
                                    onChange={e => form.setData('url', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {form.errors.url && (
                                    <p className="text-xs text-red-400 mt-1">{form.errors.url}</p>
                                )}
                            </div>

                            {/* Tip */}
                            <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                                <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-400/90 leading-relaxed">
                                    Usa imágenes horizontales (16:9) de al menos 1200 × 675 px para mejor calidad.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={!form.data.image || form.processing}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Upload className="h-4 w-4" />
                                {form.processing ? 'Subiendo...' : 'Publicar anuncio'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Grid de anuncios publicados (derecha) ── */}
                <div className="xl:col-span-3">
                    <h2 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                        <Images className="h-4 w-4 text-muted-foreground" />
                        Anuncios publicados
                        <span className="text-sm font-normal text-muted-foreground">({ads.length})</span>
                    </h2>

                    {ads.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-16 text-center">
                            <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-semibold">Sin anuncios publicados</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sube la primera imagen para que aparezca en el slider de inicio.
                            </p>
                        </div>
                    ) : (
                        /* Grid 2 columnas — visible múltiples ads a la vez */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ads.map(ad => (
                                <div
                                    key={ad.id}
                                    className={`rounded-2xl border overflow-hidden transition-all ${
                                        ad.active
                                            ? 'border-border bg-card'
                                            : 'border-border/40 bg-card/50 opacity-60'
                                    }`}
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video overflow-hidden bg-muted/20">
                                        <img
                                            src={ad.image_url}
                                            alt={ad.title ?? `Anuncio #${ad.id}`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />

                                        {/* Título overlay */}
                                        {ad.title && (
                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
                                                <p className="text-xs font-bold text-white leading-tight truncate">
                                                    {ad.title}
                                                </p>
                                            </div>
                                        )}

                                        {/* Badge activo */}
                                        <div className={`absolute top-2 right-2 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full
                                            ${ad.active
                                                ? 'bg-green-500/95 text-white'
                                                : 'bg-zinc-800/90 text-zinc-400'}`}>
                                            {ad.active ? 'Activo' : 'Inactivo'}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            {ad.url ? (
                                                <a
                                                    href={ad.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[11px] text-primary hover:underline truncate"
                                                >
                                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{ad.url}</span>
                                                </a>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground">Sin enlace</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => toggle(ad.id)}
                                                title={ad.active ? 'Desactivar' : 'Activar'}
                                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                            >
                                                {ad.active
                                                    ? <EyeOff className="h-3.5 w-3.5" />
                                                    : <Eye className="h-3.5 w-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => destroy(ad.id)}
                                                title="Eliminar"
                                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
