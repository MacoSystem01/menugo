import AppShell from '@/Layouts/AppShell';
import { Head, router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Upload, Trash2, Eye, EyeOff, ImagePlus, Info, Store } from 'lucide-react';
import AdRequestTable, { type AdRequest } from '@/components/AdRequestTable';

interface Logo {
    id:            number;
    image_url:     string;
    business_name: string | null;
    sort_order:    number;
    active:        boolean;
}

interface Props {
    logos:      Logo[];
    adRequests: AdRequest[];
    flash?: { success?: string; error?: string };
}

export default function PublicidadSlider({ logos, adRequests, flash }: Props) {
    const fileRef               = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const form = useForm({
        image:         null as File | null,
        business_name: '',
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

        form.post('/admin/publicidad-slider', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setPreview(null);
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    }

    function toggle(id: number) {
        router.patch(`/admin/publicidad-slider/${id}/toggle`, {}, { preserveScroll: true });
    }

    function destroy(id: number) {
        if (!confirm('¿Eliminar este logo?')) return;
        router.delete(`/admin/publicidad-slider/${id}`, { preserveScroll: true });
    }

    return (
        <AppShell variant="admin" title="Publicidad Slider" subtitle='Logos en la franja "Confían en Menugo"'>
            <Head title="SuperAdmin - Publicidad Slider" />

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

                {/* ── Panel de subida ── */}
                <div className="xl:col-span-2">
                    <div className="rounded-2xl border border-border bg-card p-6 sticky top-24">
                        <h2 className="font-display text-base font-bold mb-5 flex items-center gap-2">
                            <ImagePlus className="h-4 w-4 text-primary" />
                            Nuevo logo
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
                                style={{ minHeight: '160px' }}
                            >
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Vista previa"
                                        className="object-contain p-4"
                                        style={{ maxHeight: '140px' }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
                                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                                            <Upload className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Arrastra el logo</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">o haz clic para seleccionar</p>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">JPG · PNG · WebP · SVG · Máx. 2 MB</p>
                                    </div>
                                )}

                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
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

                            {/* Nombre del negocio */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Nombre del negocio <span className="opacity-50">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.data.business_name}
                                    onChange={e => form.setData('business_name', e.target.value)}
                                    placeholder="Ej: La Trattoria Italiana"
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {form.errors.business_name && (
                                    <p className="text-xs text-red-400 mt-1">{form.errors.business_name}</p>
                                )}
                            </div>

                            <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                                <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-400/90 leading-relaxed">
                                    Usa logos con fondo transparente (PNG/SVG) para mejor integración visual.
                                    Tamaño recomendado: 240 × 80 px.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={!form.data.image || form.processing}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Upload className="h-4 w-4" />
                                {form.processing ? 'Subiendo...' : 'Publicar logo'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Grid de logos publicados ── */}
                <div className="xl:col-span-3">
                    <h2 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        Logos publicados
                        <span className="text-sm font-normal text-muted-foreground">({logos.length})</span>
                    </h2>

                    {logos.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-16 text-center">
                            <Store className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-semibold">Sin logos publicados</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sube el primer logo para que aparezca en la franja "Confían en Menugo".
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {logos.map(logo => (
                                <div
                                    key={logo.id}
                                    className={`rounded-2xl border overflow-hidden transition-all ${
                                        logo.active
                                            ? 'border-border bg-card'
                                            : 'border-border/40 bg-card/50 opacity-60'
                                    }`}
                                >
                                    {/* Logo preview */}
                                    <div className="relative flex items-center justify-center bg-white/5 p-4" style={{ minHeight: '90px' }}>
                                        <img
                                            src={logo.image_url}
                                            alt={logo.business_name ?? `Logo #${logo.id}`}
                                            className="max-h-16 max-w-full object-contain"
                                            loading="lazy"
                                        />

                                        <div className={`absolute top-2 right-2 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full
                                            ${logo.active
                                                ? 'bg-green-500/95 text-white'
                                                : 'bg-zinc-800/90 text-zinc-400'}`}>
                                            {logo.active ? 'Activo' : 'Inactivo'}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-3 py-2.5 flex items-center justify-between gap-2 border-t border-border/50">
                                        <span className="text-[11px] text-muted-foreground truncate flex-1">
                                            {logo.business_name ?? <span className="italic opacity-50">Sin nombre</span>}
                                        </span>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => toggle(logo.id)}
                                                title={logo.active ? 'Desactivar' : 'Activar'}
                                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                            >
                                                {logo.active
                                                    ? <EyeOff className="h-3.5 w-3.5" />
                                                    : <Eye className="h-3.5 w-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => destroy(logo.id)}
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

            {/* ══ Reporte Publicitario ══════════════════════════════════════════════ */}
            <AdRequestTable requests={adRequests} context="slider" />

        </AppShell>
    );
}
