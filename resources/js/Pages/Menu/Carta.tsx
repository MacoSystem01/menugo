import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useRef, useEffect } from 'react';
import {
    Copy, Check, ExternalLink, Download, Printer,
    ImagePlus, Trash2, Pencil, ToggleLeft, ToggleRight,
    X, ImageOff, Save, Upload,
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Dish {
    id: number;
    name: string;
    description: string | null;
    price: number;
    available: boolean;
    image_url: string | null;
    image: string | null;
}

interface Category {
    id: number;
    name: string;
    description: string | null;
    dishes: Dish[];
}

interface SocialLinks {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    whatsapp_message?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
}

interface DeliveryZone {
    label:  string;
    min_km: number;
    max_km: number;
    price:  number;
}

interface CartaSettings {
    primary_color:      string;
    bg_color:           string;
    text_color:         string;
    logo_size:          string;
    name_size:          string;
    slogan:             string | null;
    slogan_size:        string;
    banner_url:         string | null;
    payment_methods:    string[];
    social_links:       SocialLinks;
    delivery_enabled:   boolean;
    delivery_min_order: number;
    delivery_zones:     DeliveryZone[];
    restaurant_lat:     number | null;
    restaurant_lng:     number | null;
    restaurant_address: string | null;
    google_maps_key:    string | null;
}

interface DishForm {
    name: string;
    description: string;
    price: number | string;
    available: boolean;
}

interface Props {
    categories: Category[];
    public_url: string;
    tenant_name: string;
    settings: CartaSettings;
    flash?: { success?: string };
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n);
}

// ── Mapas de tamaño ───────────────────────────────────────────────────────────

const LOGO_SIZES: Record<string, string> = {
    sm: 'h-8', md: 'h-12', lg: 'h-16', xl: 'h-24',
};
const NAME_SIZES: Record<string, string> = {
    sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl', xl: 'text-4xl', '2xl': 'text-5xl',
};
const SLOGAN_SIZES: Record<string, string> = {
    xs: 'text-xs', sm: 'text-sm', md: 'text-base', lg: 'text-lg',
};

const ALL_PAYMENT_METHODS = [
    { key: 'efectivo', label: 'Efectivo' },
    { key: 'pse', label: 'PSE' },
    { key: 'nequi', label: 'Nequi' },
    { key: 'daviplata', label: 'Daviplata' },
    { key: 'tarjeta', label: 'Tarjeta' },
    { key: 'transferencia', label: 'Transferencia' },
];

// ── Componentes de UI ─────────────────────────────────────────────────────────

function SizeBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors
                ${active ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        >
            {label}
        </button>
    );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const safe = value || '#000000';
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={safe}
                    onChange={e => onChange(e.target.value)}
                    className="h-8 w-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                />
                <span className="font-mono text-xs text-muted-foreground w-16">{safe.toUpperCase()}</span>
            </div>
        </div>
    );
}

// ── Tarjeta de plato ──────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

function DishCard({ dish, onEdit }: { dish: Dish; onEdit: (d: Dish) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [imgError, setImgError] = useState<string | null>(null);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (inputRef.current) inputRef.current.value = '';
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            setImgError('Formato no válido. Usa JPG, PNG o WebP.');
            return;
        }
        if (file.size > MAX_BYTES) {
            setImgError(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 2 MB.`);
            return;
        }
        setImgError(null);
        const fd = new FormData();
        fd.append('image', file);
        setUploading(true);
        router.post(`/menu/carta/plato/${dish.id}/imagen`, fd, {
            forceFormData: true,
            onFinish: () => setUploading(false),
            onError: (errors) => { setUploading(false); setImgError(errors.image ?? 'No se pudo subir la imagen.'); },
        });
    }

    function removeImage() {
        if (!confirm('¿Eliminar la imagen de este plato?')) return;
        router.delete(`/menu/carta/plato/${dish.id}/imagen`);
    }

    function toggleAvailable() {
        router.put(`/menu/carta/plato/${dish.id}`, {
            name: dish.name, description: dish.description ?? '',
            price: dish.price, available: !dish.available,
        });
    }

    return (
        <div className={`rounded-2xl border bg-card overflow-hidden transition-colors ${dish.available ? 'border-border' : 'border-border/40 opacity-60'}`}>
            <div className="relative bg-muted/30 aspect-video overflow-hidden group">
                {dish.image_url ? (
                    <>
                        <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button onClick={() => inputRef.current?.click()} title="Cambiar imagen"
                                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm">
                                <ImagePlus className="h-5 w-5" />
                            </button>
                            <button onClick={removeImage} title="Eliminar imagen"
                                className="p-2.5 rounded-xl bg-red-500/40 hover:bg-red-500/60 text-white transition-colors backdrop-blur-sm">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <button onClick={() => inputRef.current?.click()} disabled={uploading}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors disabled:cursor-wait">
                        {uploading
                            ? <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            : <>
                                <ImagePlus className="h-8 w-8" />
                                <span className="text-xs font-medium">Agregar imagen</span>
                                <span className="text-[10px] text-muted-foreground/60">JPG · PNG · WebP · máx 2 MB</span>
                            </>
                        }
                    </button>
                )}
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                {uploading && dish.image_url && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    </div>
                )}
            </div>

            {imgError && (
                <div className="mx-3 mt-2.5 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2.5 text-xs text-red-400">
                    <span className="flex-1 leading-snug">{imgError}</span>
                    <button onClick={() => setImgError(null)} className="shrink-0 mt-0.5 hover:text-red-300 transition-colors">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-sm leading-snug flex-1">{dish.name}</h3>
                    <button onClick={() => onEdit(dish)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                </div>
                {dish.description
                    ? <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{dish.description}</p>
                    : <p className="text-xs text-muted-foreground/50 italic mb-3">Sin descripción</p>
                }
                <div className="flex items-center justify-between">
                    <span className="font-display text-base font-bold text-primary">{fmt(dish.price)}</span>
                    <button onClick={toggleAvailable} className="inline-flex items-center gap-1.5 text-xs">
                        {dish.available
                            ? <><ToggleRight className="h-5 w-5 text-accent" /><span className="text-accent">Disponible</span></>
                            : <><ToggleLeft className="h-5 w-5 text-muted-foreground" /><span className="text-muted-foreground">No disponible</span></>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal edición de plato ────────────────────────────────────────────────────

function EditModal({ dish, onClose }: { dish: Dish; onClose: () => void }) {
    const form = useForm<DishForm>({
        name: dish.name, description: dish.description ?? '',
        price: dish.price, available: dish.available,
    });
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/menu/carta/plato/${dish.id}`, { onSuccess: onClose });
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-lg font-bold">Editar plato</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Nombre <span className="text-red-400">*</span></label>
                        <input className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={form.data.name} onChange={e => form.setData('name', e.target.value)} autoFocus />
                        {form.errors.name && <p className="text-xs text-red-400 mt-1">{form.errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Descripción</label>
                        <textarea rows={3} className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            value={form.data.description} onChange={e => form.setData('description', e.target.value)}
                            placeholder="Ingredientes, preparación, alérgenos..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Precio <span className="text-red-400">*</span></label>
                        <input type="number" min={0} step={0.01} className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={form.data.price} onChange={e => form.setData('price', e.target.value)} />
                        {form.errors.price && <p className="text-xs text-red-400 mt-1">{form.errors.price}</p>}
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div onClick={() => form.setData('available', !form.data.available)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${form.data.available ? 'bg-accent' : 'bg-muted'}`}>
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.data.available ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-sm font-medium">Disponible en carta</span>
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                        <button type="submit" disabled={form.processing} className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
                            {form.processing ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Ubicación del restaurante (Google Maps autocomplete) ─────────────────────

function loadMapsScript(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).google?.maps?.places) { resolve(); return; }
        if (document.getElementById('gm-carta')) { resolve(); return; }
        const s = document.createElement('script');
        s.id  = 'gm-carta';
        s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es`;
        s.async = true;
        s.onload  = () => resolve();
        s.onerror = () => reject();
        document.head.appendChild(s);
    });
}

function RestaurantLocationSection({
    design,
    mapsKey,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    design:   any;
    mapsKey:  string | null;
}) {
    const inputRef                      = useRef<HTMLInputElement>(null);
    const [geocoding, setGeocoding]     = useState(false);
    const [geocodeError, setGeocodeError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapsKey || !inputRef.current) return;
        loadMapsScript(mapsKey).then(() => {
            if (!inputRef.current) return;
            const ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
                types:  ['address'],
                fields: ['formatted_address', 'geometry'],
            });
            ac.addListener('place_changed', () => {
                const place = ac.getPlace();
                if (!place.geometry?.location) return;
                design.setData('restaurant_lat',     place.geometry.location.lat());
                design.setData('restaurant_lng',     place.geometry.location.lng());
                design.setData('restaurant_address', place.formatted_address ?? '');
                if (inputRef.current) inputRef.current.value = place.formatted_address ?? '';
                setGeocodeError(null);
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapsKey]);

    async function geocodeWithNominatim() {
        const addr = design.data.restaurant_address?.trim();
        if (!addr) return;
        setGeocoding(true);
        setGeocodeError(null);
        try {
            const url  = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1&countrycodes=co&accept-language=es`;
            const res  = await fetch(url, { headers: { 'Accept-Language': 'es', 'User-Agent': 'MenuGo/1.0' } });
            const data = await res.json() as Array<{ lat: string; lon: string }>;
            if (data.length > 0) {
                design.setData('restaurant_lat', parseFloat(data[0].lat));
                design.setData('restaurant_lng', parseFloat(data[0].lon));
            } else {
                setGeocodeError('No se encontraron coordenadas para esta dirección. Intenta ser más específico.');
            }
        } catch {
            setGeocodeError('Error al obtener coordenadas. Verifica tu conexión e intenta de nuevo.');
        } finally {
            setGeocoding(false);
        }
    }

    const hasCoords = design.data.restaurant_lat && design.data.restaurant_lng;

    return (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    Ubicación del restaurante
                    {!mapsKey && (
                        <span className="text-[10px] font-normal text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-2 py-0.5">
                            Autocompletar inactivo · configura GOOGLE_MAPS_API_KEY en .env
                        </span>
                    )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Las coordenadas permiten calcular distancias y asignar automáticamente la zona de entrega del cliente.
                </p>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                    Dirección del establecimiento
                </label>
                <input
                    ref={inputRef}
                    type="text"
                    defaultValue={design.data.restaurant_address ?? ''}
                    onInput={(e) => {
                        const val = (e.target as HTMLInputElement).value;
                        design.setData('restaurant_address', val);
                        setGeocodeError(null);
                        if (!val) {
                            design.setData('restaurant_lat', null);
                            design.setData('restaurant_lng', null);
                        }
                    }}
                    placeholder={mapsKey ? 'Escribe la dirección y selecciona del menú…' : 'Escribe la dirección del establecimiento'}
                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {!mapsKey && design.data.restaurant_address && !hasCoords && (
                    <button
                        type="button"
                        onClick={geocodeWithNominatim}
                        disabled={geocoding}
                        className="text-xs text-primary underline underline-offset-2 disabled:opacity-50 hover:no-underline transition-all"
                    >
                        {geocoding ? 'Obteniendo coordenadas…' : 'Geocodificar dirección (obtener coordenadas automáticamente)'}
                    </button>
                )}
                {geocodeError && (
                    <p className="text-xs text-red-400">{geocodeError}</p>
                )}
            </div>

            {hasCoords ? (
                <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
                    <span className="text-xs text-accent font-medium">
                        Ubicación confirmada · {Number(design.data.restaurant_lat).toFixed(5)}, {Number(design.data.restaurant_lng).toFixed(5)}
                    </span>
                </div>
            ) : (
                <div className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">⚠</span>
                    <p className="text-xs text-amber-400">
                        Sin coordenadas del restaurante. La zona de entrega <strong>no se asignará automáticamente</strong> a los clientes
                        {mapsKey
                            ? ' — escribe la dirección y selecciona del menú desplegable.'
                            : ' — escribe la dirección y usa el botón para geocodificarla.'}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Carta({ categories, public_url, tenant_name, settings: initialSettings, flash }: Props) {
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState<Dish | null>(null);
    const [activeTab, setActiveTab] = useState<'builder' | 'design' | 'preview'>('builder');
    const qrRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // ── Formulario de diseño (local, guardado explícitamente) ─────────────────
    const design = useForm({
        primary_color: initialSettings.primary_color ?? '#e85d04',
        bg_color: initialSettings.bg_color ?? '#ffffff',
        text_color: initialSettings.text_color ?? '#1a1a1a',
        logo_size: initialSettings.logo_size ?? 'md',
        name_size: initialSettings.name_size ?? '2xl',
        slogan: initialSettings.slogan ?? '',
        slogan_size: initialSettings.slogan_size ?? 'sm',
        payment_methods: initialSettings.payment_methods?.length
            ? initialSettings.payment_methods
            : ['efectivo'],
        social_links: {
            instagram: initialSettings.social_links?.instagram ?? '',
            facebook: initialSettings.social_links?.facebook ?? '',
            whatsapp: initialSettings.social_links?.whatsapp ?? '',
            whatsapp_message: initialSettings.social_links?.whatsapp_message ?? '',
            tiktok: initialSettings.social_links?.tiktok ?? '',
            twitter: initialSettings.social_links?.twitter ?? '',
            youtube: initialSettings.social_links?.youtube ?? '',
        },
        delivery_enabled:    initialSettings.delivery_enabled    ?? false,
        delivery_min_order:  initialSettings.delivery_min_order  ?? 0,
        delivery_zones:      (initialSettings.delivery_zones     ?? []) as DeliveryZone[],
        restaurant_lat:      initialSettings.restaurant_lat      ?? null as number | null,
        restaurant_lng:      initialSettings.restaurant_lng      ?? null as number | null,
        restaurant_address:  initialSettings.restaurant_address  ?? '',
    });

    // ── Banner ────────────────────────────────────────────────────────────────
    const bannerRef = useRef<HTMLInputElement>(null);
    const [bannerUploading, setBannerUploading] = useState(false);
    const [bannerError, setBannerError] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(initialSettings.banner_url);

    function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (bannerRef.current) bannerRef.current.value = '';
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) { setBannerError('Formato no válido. Usa JPG, PNG o WebP.'); return; }
        if (file.size > 5 * 1024 * 1024) { setBannerError(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 5 MB.`); return; }
        setBannerError(null);
        const fd = new FormData();
        fd.append('banner', file);
        setBannerUploading(true);
        router.post('/menu/carta/banner', fd, {
            forceFormData: true,
            onSuccess: () => { setBannerUrl(URL.createObjectURL(file)); setBannerUploading(false); },
            onError: (errors) => { setBannerUploading(false); setBannerError(errors.banner ?? 'No se pudo subir el banner.'); },
        });
    }

    function deleteBanner() {
        if (!confirm('¿Eliminar el banner?')) return;
        router.delete('/menu/carta/banner', {
            onSuccess: () => setBannerUrl(null),
        });
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    const totalPlatos = categories.reduce((a, c) => a + c.dishes.length, 0);
    const totalDisponibles = categories.reduce((a, c) => a + c.dishes.filter(d => d.available).length, 0);
    const sinImagen = categories.reduce((a, c) => a + c.dishes.filter(d => !d.image_url).length, 0);

    // ── QR helpers ────────────────────────────────────────────────────────────
    function copyUrl() {
        navigator.clipboard.writeText(public_url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }

    async function downloadQR() {
        const svg = qrRef.current?.querySelector('svg');
        if (!svg) return;

        const SIZE = 400;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = SIZE;
        const ctx = canvas.getContext('2d')!;

        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, SIZE, SIZE);

        // Clonar SVG y quitar el <image> interno para evitar tainted-canvas
        const svgClone = svg.cloneNode(true) as SVGElement;
        svgClone.querySelectorAll('image').forEach(el => el.remove());
        svgClone.setAttribute('width', String(SIZE));
        svgClone.setAttribute('height', String(SIZE));

        // Dibujar el QR en el canvas
        await new Promise<void>((resolve) => {
            const qrImg = new Image();
            qrImg.onload = () => { ctx.drawImage(qrImg, 0, 0, SIZE, SIZE); resolve(); };
            qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svgClone))));
        });

        // Dibujar badge circular con logo centrado
        const primaryColor = design.data.primary_color || '#ff6b00';
        const BADGE = 108;          // diámetro del badge a 400px
        const BORDER = 5;
        const cx = SIZE / 2;
        const cy = SIZE / 2;

        // Sombra suave
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 12;

        // Círculo blanco de fondo
        ctx.beginPath();
        ctx.arc(cx, cy, BADGE / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Borde coloreado
        ctx.beginPath();
        ctx.arc(cx, cy, BADGE / 2, 0, Math.PI * 2);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = BORDER;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Logo dentro del badge
        await new Promise<void>((resolve) => {
            const logo = new Image();
            logo.onload = () => {
                const pad = 14;
                const s = BADGE - pad * 2;
                ctx.drawImage(logo, cx - s / 2, cy - s / 2, s, s);
                resolve();
            };
            logo.onerror = () => resolve();
            logo.src = '/logo-trans.png';
        });

        const a = document.createElement('a');
        a.download = `qr-carta-${tenant_name.toLowerCase().replace(/\s+/g, '-')}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
    }

    function printMenu() {
        const win = window.open('', '_blank');
        if (!win) {
            alert('El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio e intenta de nuevo.');
            return;
        }

        const { primary_color, bg_color, text_color } = design.data;

        /*
         * Cada categoría se renderiza como <table>.
         * El <thead> con el nombre y descripción se repite automáticamente
         * al inicio de cada nueva página cuando la tabla se parte — esto
         * garantiza que el cliente siempre vea a qué categoría pertenece
         * cada plato, sin importar en qué página esté.
         */
        const categoriesHtml = categories.map(cat => {
            const availableDishes = cat.dishes.filter(d => d.available);
            if (!availableDishes.length) return '';

            const rowsHtml = availableDishes.map(d => `
                <tr class="dish-row">
                    <td class="dish-img-cell">
                        ${d.image_url
                            ? `<img src="${d.image_url}" alt="${d.name}" />`
                            : `<div class="dish-img-placeholder"></div>`
                        }
                    </td>
                    <td class="dish-info">
                        <div class="dish-name">${d.name}</div>
                        ${d.description ? `<div class="dish-desc">${d.description}</div>` : ''}
                    </td>
                    <td class="dish-price">${fmt(d.price)}</td>
                </tr>
                <tr class="dish-separator"><td colspan="3"><hr /></td></tr>
            `).join('');

            return `
                <table class="category">
                    <thead>
                        <tr><th class="cat-title" colspan="3">${cat.name}</th></tr>
                        ${cat.description
                            ? `<tr><th class="cat-desc" colspan="3">${cat.description}</th></tr>`
                            : ''}
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
        }).join('');

        win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Carta — ${tenant_name}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: Georgia, 'Times New Roman', serif;
            color: ${text_color};
            background: ${bg_color};
            padding: 40px 48px;
            max-width: 800px;
            margin: 0 auto;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        /* ── Encabezado del documento ── */
        .header { text-align: center; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid ${primary_color}33; }
        .header img { height: 64px; width: auto; margin-bottom: 12px; }
        .header h1 { font-size: 30px; letter-spacing: 1px; color: ${text_color}; }
        .header .slogan { font-size: 12px; color: ${text_color}99; margin-top: 6px; font-style: italic; }

        /* ── Tabla de categoría ── */
        table.category {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
        }

        /* thead se repite automáticamente al inicio de cada página nueva */
        thead { display: table-header-group; }

        .cat-title {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: ${primary_color};
            border-bottom: 1.5px solid ${primary_color}44;
            padding: 0 0 6px 0;
            text-align: left;
            font-weight: 700;
            font-family: Georgia, 'Times New Roman', serif;
        }
        .cat-desc {
            font-size: 11px;
            color: ${text_color}88;
            padding: 4px 0 10px 0;
            font-style: italic;
            font-weight: normal;
            text-align: left;
        }

        /* ── Fila de plato ── */
        tr.dish-row {
            break-inside: avoid;
            page-break-inside: avoid;
        }
        td.dish-img-cell {
            width: 78px;
            padding: 10px 12px 10px 0;
            vertical-align: top;
        }
        td.dish-img-cell img {
            width: 68px; height: 68px;
            object-fit: cover;
            border-radius: 8px;
            display: block;
        }
        .dish-img-placeholder { width: 68px; height: 68px; display: block; }
        td.dish-info { padding: 10px 12px 10px 0; vertical-align: top; }
        .dish-name { font-size: 13px; font-weight: 700; margin-bottom: 3px; color: ${text_color}; }
        .dish-desc { font-size: 11px; color: ${text_color}88; line-height: 1.5; }
        td.dish-price {
            font-size: 14px; font-weight: 800;
            white-space: nowrap;
            color: ${primary_color};
            vertical-align: middle;
            text-align: right;
            padding: 10px 0;
        }
        tr.dish-separator td { padding: 0; }
        tr.dish-separator hr { border: none; border-top: 1px dotted ${text_color}22; margin: 0; }
        tr.dish-row:last-of-type + tr.dish-separator { display: none; }

        footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid ${text_color}22; font-size: 10px; color: ${text_color}66; }

        @media print {
            body { padding: 20px 28px; }
            td.dish-img-cell img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            /* Cada fila de plato nunca se parte a la mitad */
            tr.dish-row { break-inside: avoid; page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${'/logo-trans.png'}" alt="${tenant_name}" />
        <h1>${tenant_name}</h1>
        ${design.data.slogan ? `<p class="slogan">${design.data.slogan}</p>` : ''}
    </div>
    ${categoriesHtml || '<p style="text-align:center;opacity:.5">La carta está vacía.</p>'}
    <footer>Carta digital generada con Menugo</footer>
</body>
</html>`);

        win.document.close();
        // Esperar a que las imágenes carguen antes de imprimir
        win.addEventListener('load', () => {
            win.focus();
            win.print();
        });
    }

    // ── Preview styles ────────────────────────────────────────────────────────
    const previewStyle = {
        backgroundColor: design.data.bg_color,
        color: design.data.text_color,
    } as React.CSSProperties;

    return (
        <AppShell title="Carta" subtitle="Diseña tu carta y compártela con un código QR">
            <Head title="Carta" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}

            {sinImagen > 0 && activeTab === 'builder' && (
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 text-sm">
                    <ImageOff className="h-4 w-4 shrink-0" />
                    <span>{sinImagen} {sinImagen === 1 ? 'plato no tiene' : 'platos no tienen'} imagen.</span>
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-8">

                {/* ════ Panel principal ════ */}
                <div className="flex-1 min-w-0">

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 rounded-xl bg-muted/40 w-fit mb-6">
                        {([
                            ['builder', 'Constructor'],
                            ['design', 'Diseño'],
                            ['preview', 'Vista previa'],
                        ] as const).map(([tab, label]) => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                    }`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── TAB: Constructor ── */}
                    {activeTab === 'builder' && (
                        <div className="space-y-10">
                            {categories.length === 0 ? (
                                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                                    <p className="font-medium text-muted-foreground">Sin categorías activas.</p>
                                    <p className="text-sm text-muted-foreground mt-1">Crea categorías y platos para construir la carta.</p>
                                </div>
                            ) : categories.map(cat => (
                                <div key={cat.id}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <h2 className="font-display text-xl font-bold shrink-0">{cat.name}</h2>
                                        <div className="h-px flex-1 bg-border" />
                                        <span className="text-xs text-muted-foreground shrink-0">{cat.dishes.length} {cat.dishes.length === 1 ? 'plato' : 'platos'}</span>
                                    </div>
                                    {cat.description && <p className="text-sm text-muted-foreground -mt-2 mb-4">{cat.description}</p>}
                                    {cat.dishes.length === 0
                                        ? <p className="text-sm text-muted-foreground italic">Esta categoría no tiene platos.</p>
                                        : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {cat.dishes.map(dish => <DishCard key={dish.id} dish={dish} onEdit={setEditing} />)}
                                        </div>
                                    }
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── TAB: Diseño ── */}
                    {activeTab === 'design' && (
                        <form onSubmit={e => { e.preventDefault(); design.put('/menu/carta/settings'); }}
                            className="space-y-6 max-w-xl">

                            {/* Colores */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                                <h3 className="text-sm font-semibold">Colores</h3>
                                <ColorField label="Color primario" value={design.data.primary_color} onChange={v => design.setData('primary_color', v)} />
                                <ColorField label="Color de fondo" value={design.data.bg_color} onChange={v => design.setData('bg_color', v)} />
                                <ColorField label="Color de texto" value={design.data.text_color} onChange={v => design.setData('text_color', v)} />
                            </div>

                            {/* Tamaño del logo */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                                <h3 className="text-sm font-semibold">Tamaño del logo</h3>
                                <div className="flex flex-wrap gap-2">
                                    {[['sm', 'Pequeño'], ['md', 'Mediano'], ['lg', 'Grande'], ['xl', 'Extra grande']].map(([v, l]) => (
                                        <SizeBtn key={v} label={l} active={design.data.logo_size === v} onClick={() => design.setData('logo_size', v)} />
                                    ))}
                                </div>
                                <div className="flex items-end gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                                    <img src="/logo-trans.png" alt="Logo preview" className={`${LOGO_SIZES[design.data.logo_size] ?? 'h-12'} w-auto object-contain`} />
                                    <span className="text-xs text-muted-foreground">Vista previa</span>
                                </div>
                            </div>

                            {/* Nombre */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                                <h3 className="text-sm font-semibold">Tamaño del nombre del restaurante</h3>
                                <div className="flex flex-wrap gap-2">
                                    {[['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['xl', 'XL'], ['2xl', '2XL']].map(([v, l]) => (
                                        <SizeBtn key={v} label={l} active={design.data.name_size === v} onClick={() => design.setData('name_size', v)} />
                                    ))}
                                </div>
                                <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border overflow-hidden">
                                    <span className={`font-bold ${NAME_SIZES[design.data.name_size] ?? 'text-2xl'} leading-tight block truncate`}>{tenant_name}</span>
                                </div>
                            </div>

                            {/* Slogan */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                                <h3 className="text-sm font-semibold">Slogan</h3>
                                <input
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Ej: El sabor de siempre, la calidad de hoy..."
                                    value={design.data.slogan}
                                    onChange={e => design.setData('slogan', e.target.value)}
                                    maxLength={200}
                                />
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Tamaño del slogan</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[['xs', 'XS'], ['sm', 'S'], ['md', 'M'], ['lg', 'L']].map(([v, l]) => (
                                            <SizeBtn key={v} label={l} active={design.data.slogan_size === v} onClick={() => design.setData('slogan_size', v)} />
                                        ))}
                                    </div>
                                </div>
                                {design.data.slogan && (
                                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                                        <span className={`${SLOGAN_SIZES[design.data.slogan_size] ?? 'text-sm'} text-muted-foreground italic`}>{design.data.slogan}</span>
                                    </div>
                                )}
                            </div>

                            {/* Banner */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                                <h3 className="text-sm font-semibold">Banner de inicio</h3>
                                <p className="text-xs text-muted-foreground">Imagen de cabecera que aparece en la parte superior de la carta del cliente. JPG · PNG · WebP · máx 5 MB.</p>

                                {bannerUrl ? (
                                    <div className="relative rounded-xl overflow-hidden border border-border aspect-3/1">
                                        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button type="button" onClick={() => bannerRef.current?.click()}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm">
                                                <Upload className="h-3.5 w-3.5" /> Cambiar
                                            </button>
                                            <button type="button" onClick={deleteBanner}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/40 hover:bg-red-500/60 text-white text-xs font-medium backdrop-blur-sm">
                                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => bannerRef.current?.click()} disabled={bannerUploading}
                                        className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors disabled:cursor-wait">
                                        {bannerUploading
                                            ? <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                            : <>
                                                <Upload className="h-8 w-8" />
                                                <span className="text-sm font-medium">Subir banner</span>
                                            </>
                                        }
                                    </button>
                                )}

                                {bannerError && (
                                    <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2.5 text-xs text-red-400">
                                        <span className="flex-1">{bannerError}</span>
                                        <button type="button" onClick={() => setBannerError(null)}><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                )}

                                <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleBannerChange} />
                            </div>

                            {/* Métodos de pago */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                                <h3 className="text-sm font-semibold">Métodos de pago aceptados</h3>
                                <p className="text-xs text-muted-foreground">El cliente verá estas opciones al hacer el pedido desde la carta.</p>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_PAYMENT_METHODS.map(({ key, label }) => {
                                        const active = design.data.payment_methods.includes(key);
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => {
                                                    const cur = design.data.payment_methods;
                                                    const next = active
                                                        ? cur.filter(m => m !== key)
                                                        : [...cur, key];
                                                    if (next.length > 0) design.setData('payment_methods', next);
                                                }}
                                                className={`h-8 px-3 rounded-full text-xs font-medium transition-colors border ${active
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {design.errors.payment_methods && (
                                    <p className="text-xs text-red-400">{design.errors.payment_methods}</p>
                                )}
                            </div>

                            {/* Redes Sociales */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold">Redes Sociales</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Los íconos aparecen en el pie de la carta si hay al menos una red configurada.
                                        Dejá vacío lo que no uses.
                                    </p>
                                </div>
                                {([
                                    { key: 'instagram',        label: 'Instagram',                        placeholder: 'https://instagram.com/tu_restaurante',           type: 'url'      },
                                    { key: 'facebook',         label: 'Facebook',                         placeholder: 'https://facebook.com/tu_restaurante',            type: 'url'      },
                                    { key: 'whatsapp',         label: 'WhatsApp',                         placeholder: '573001234567  (solo números con código de país)', type: 'tel'      },
                                    { key: 'whatsapp_message', label: 'Mensaje de bienvenida (WhatsApp)', placeholder: 'Ej: ¡Hola! Quisiera hacer un pedido...',          type: 'textarea' },
                                    { key: 'tiktok',           label: 'TikTok',                           placeholder: 'https://tiktok.com/@tu_restaurante',             type: 'url'      },
                                    { key: 'twitter',          label: 'X / Twitter',                      placeholder: 'https://x.com/tu_restaurante',                   type: 'url'      },
                                    { key: 'youtube',          label: 'YouTube',                          placeholder: 'https://youtube.com/@tu_restaurante',            type: 'url'      },
                                ] as const).map(({ key, label, placeholder, type }) => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">{label}</label>
                                        {type === 'textarea' ? (
                                            <textarea
                                                className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                                rows={3}
                                                placeholder={placeholder}
                                                value={design.data.social_links[key] ?? ''}
                                                onChange={e => design.setData('social_links', {
                                                    ...design.data.social_links,
                                                    [key]: e.target.value,
                                                })}
                                            />
                                        ) : (
                                            <input
                                                type={type}
                                                className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder={placeholder}
                                                value={design.data.social_links[key] ?? ''}
                                                onChange={e => design.setData('social_links', {
                                                    ...design.data.social_links,
                                                    [key]: e.target.value,
                                                })}
                                            />
                                        )}
                                        {design.errors[`social_links.${key}` as keyof typeof design.errors] && (
                                            <p className="text-xs text-red-400">
                                                {design.errors[`social_links.${key}` as keyof typeof design.errors]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Servicio a domicilio */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold">Servicio a domicilio</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Activa el domicilio y configura las tarifas por zona.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => design.setData('delivery_enabled', !design.data.delivery_enabled)}
                                        className="shrink-0"
                                    >
                                        {design.data.delivery_enabled
                                            ? <ToggleRight className="h-8 w-8 text-accent" />
                                            : <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                                        }
                                    </button>
                                </div>

                                {design.data.delivery_enabled && (
                                    <div className="space-y-4 pt-2 border-t border-border">
                                        {/* Monto mínimo */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Pedido mínimo (COP) — 0 = sin mínimo
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                step={1}
                                                className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                value={design.data.delivery_min_order}
                                                onChange={e => design.setData('delivery_min_order', parseInt(e.target.value) || 0)}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Zonas */}
                                        <div className="space-y-3">
                                            {/* Anuncio contextual */}
                                            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
                                                <span className="text-primary shrink-0 text-xs mt-0.5">ℹ</span>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {design.data.delivery_zones.length > 1
                                                        ? 'Modo multi-zona: cada zona se asigna automáticamente por distancia entre el restaurante y el cliente. Requiere coordenadas del restaurante configuradas abajo.'
                                                        : 'La Zona de Cobertura define el valor del domicilio que se suma al total del pedido. Se asigna automáticamente a todos los pedidos a domicilio. Para diferenciar tarifas por distancia, usa "+ Agregar zona adicional".'}
                                                </p>
                                            </div>

                                            {/* Sin zonas */}
                                            {design.data.delivery_zones.length === 0 && (
                                                <p className="text-xs text-muted-foreground/50 italic px-1">
                                                    Sin tarifa configurada. El domicilio estará activo sin cobro adicional.
                                                </p>
                                            )}

                                            {/* Zona única simplificada */}
                                            {design.data.delivery_zones.length === 1 && (
                                                <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                                                    <span className="text-sm font-medium flex-1">
                                                        {design.data.delivery_zones[0].label || 'Zona de Cobertura'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs text-muted-foreground">$</span>
                                                        <input
                                                            type="number" min={0} step={500}
                                                            className="w-28 rounded-lg border border-input bg-input px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                            placeholder="0"
                                                            value={design.data.delivery_zones[0].price}
                                                            onChange={e => {
                                                                const zones = [...design.data.delivery_zones];
                                                                zones[0] = { ...zones[0], price: parseInt(e.target.value) || 0 };
                                                                design.setData('delivery_zones', zones);
                                                            }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => design.setData('delivery_zones', [])}
                                                        className="flex items-center justify-center p-1 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Multi-zona: cabecera + filas */}
                                            {design.data.delivery_zones.length > 1 && (
                                                <>
                                                    <div className="grid grid-cols-[1fr_52px_52px_80px_28px] gap-2 px-3">
                                                        <span className="text-[10px] text-muted-foreground/50">NOMBRE DE ZONA</span>
                                                        <span className="text-[10px] text-muted-foreground/50 text-center">KM MÍN.</span>
                                                        <span className="text-[10px] text-muted-foreground/50 text-center">KM MÁX.</span>
                                                        <span className="text-[10px] text-muted-foreground/50 text-center">TARIFA</span>
                                                        <span />
                                                    </div>
                                                    {design.data.delivery_zones.map((zone, idx) => {
                                                        const labelErr = design.errors[`delivery_zones.${idx}.label` as keyof typeof design.errors];
                                                        const hasErr   = !!labelErr;
                                                        return (
                                                            <div key={idx} className="space-y-0.5">
                                                                <div className="grid grid-cols-[1fr_52px_52px_80px_28px] items-center gap-2 rounded-xl bg-muted/30 px-3 py-2.5">
                                                                    <input
                                                                        className={`w-full rounded-lg border bg-input px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 ${hasErr ? 'border-red-500' : 'border-input'}`}
                                                                        placeholder="Nombre de zona *"
                                                                        value={zone.label}
                                                                        onChange={e => {
                                                                            const zones = [...design.data.delivery_zones];
                                                                            zones[idx] = { ...zones[idx], label: e.target.value };
                                                                            design.setData('delivery_zones', zones);
                                                                        }}
                                                                    />
                                                                    <input
                                                                        type="number" min={0} step={0.1}
                                                                        className="w-full rounded-lg border border-input bg-input px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                        placeholder="0" value={zone.min_km}
                                                                        onChange={e => {
                                                                            const zones = [...design.data.delivery_zones];
                                                                            zones[idx] = { ...zones[idx], min_km: parseFloat(e.target.value) || 0 };
                                                                            design.setData('delivery_zones', zones);
                                                                        }}
                                                                    />
                                                                    <input
                                                                        type="number" min={0} step={0.1}
                                                                        className="w-full rounded-lg border border-input bg-input px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                        placeholder="10" value={zone.max_km}
                                                                        onChange={e => {
                                                                            const zones = [...design.data.delivery_zones];
                                                                            zones[idx] = { ...zones[idx], max_km: parseFloat(e.target.value) || 0 };
                                                                            design.setData('delivery_zones', zones);
                                                                        }}
                                                                    />
                                                                    <input
                                                                        type="number" min={0} step={500}
                                                                        className="w-full rounded-lg border border-input bg-input px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                        placeholder="0" value={zone.price}
                                                                        onChange={e => {
                                                                            const zones = [...design.data.delivery_zones];
                                                                            zones[idx] = { ...zones[idx], price: parseInt(e.target.value) || 0 };
                                                                            design.setData('delivery_zones', zones);
                                                                        }}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => design.setData('delivery_zones',
                                                                            design.data.delivery_zones.filter((_, i) => i !== idx)
                                                                        )}
                                                                        className="flex items-center justify-center p-1 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                                {hasErr && (
                                                                    <p className="text-[10px] text-red-400 pl-3">{labelErr as string}</p>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            )}

                                            {/* Botón agregar */}
                                            <div className="flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => design.setData('delivery_zones', [
                                                        ...design.data.delivery_zones,
                                                        design.data.delivery_zones.length === 0
                                                            ? { label: 'Zona de Cobertura', min_km: 0, max_km: 9999, price: 0 }
                                                            : { label: '', min_km: 0, max_km: 0, price: 0 },
                                                    ])}
                                                    className="text-xs text-primary hover:underline font-medium"
                                                >
                                                    {design.data.delivery_zones.length === 0
                                                        ? '+ Agregar tarifa de domicilio'
                                                        : '+ Agregar zona adicional'}
                                                </button>
                                                {design.data.delivery_zones.length > 0 && (
                                                    <span className="text-xs text-muted-foreground/50">
                                                        {design.data.delivery_zones.length} zona{design.data.delivery_zones.length !== 1 ? 's' : ''} configurada{design.data.delivery_zones.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Vista previa */}
                                            {design.data.delivery_zones.length > 0 && (
                                                <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
                                                        Vista previa de tarifas
                                                    </p>
                                                    {design.data.delivery_zones.map((zone, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                                                {zone.label || <span className="italic opacity-40">Sin nombre</span>}
                                                                {design.data.delivery_zones.length > 1 && (
                                                                    <span className="opacity-40">{zone.min_km}–{zone.max_km} km</span>
                                                                )}
                                                            </span>
                                                            <span className="font-bold text-accent">
                                                                {zone.price === 0 ? 'Gratis' : `$ ${zone.price.toLocaleString('es-CO')}`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Ubicación del restaurante ── */}
                            <RestaurantLocationSection
                                design={design}
                                mapsKey={initialSettings.google_maps_key}
                            />

                            {/* Guardar */}
                            <button type="submit" disabled={design.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
                                <Save className="h-4 w-4" />
                                {design.processing ? 'Guardando...' : 'Guardar diseño'}
                            </button>
                        </form>
                    )}

                    {/* ── TAB: Vista previa ── */}
                    {activeTab === 'preview' && (
                        <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
                            <div ref={printRef} className="max-h-[78vh] overflow-y-auto" style={previewStyle}>

                                {/* Banner */}
                                {bannerUrl && (
                                    <div className="w-full aspect-3/1 overflow-hidden">
                                        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Header */}
                                <div className="text-center px-8 pt-8 pb-6 border-b" style={{ borderColor: `${design.data.primary_color}22` }}>
                                    <img src={'/logo-trans.png'} alt={tenant_name} className={`${LOGO_SIZES[design.data.logo_size] ?? 'h-12'} w-auto mx-auto mb-3`} />
                                    <h1 className={`font-display font-bold tracking-tight ${NAME_SIZES[design.data.name_size] ?? 'text-2xl'}`}
                                        style={{ color: design.data.text_color }}>
                                        {tenant_name}
                                    </h1>
                                    {design.data.slogan && (
                                        <p className={`mt-2 ${SLOGAN_SIZES[design.data.slogan_size] ?? 'text-sm'} opacity-70`}
                                            style={{ color: design.data.text_color }}>
                                            {design.data.slogan}
                                        </p>
                                    )}
                                </div>

                                {/* Categorías */}
                                <div className="px-8 py-8 space-y-10">
                                    {categories.length === 0
                                        ? <p className="text-center py-12 opacity-50">La carta está vacía.</p>
                                        : categories.map(cat => (
                                            <div key={cat.id}>
                                                <div className="flex items-center gap-3 mb-5">
                                                    <div className="h-[1.5px] flex-1 opacity-30" style={{ backgroundColor: design.data.primary_color }} />
                                                    <h2 className="font-display text-lg font-bold uppercase tracking-widest px-2"
                                                        style={{ color: design.data.primary_color }}>
                                                        {cat.name}
                                                    </h2>
                                                    <div className="h-[1.5px] flex-1 opacity-30" style={{ backgroundColor: design.data.primary_color }} />
                                                </div>
                                                {cat.description && (
                                                    <p className="text-xs text-center -mt-3 mb-5 opacity-60" style={{ color: design.data.text_color }}>{cat.description}</p>
                                                )}
                                                <div className="space-y-4">
                                                    {cat.dishes.map(dish => (
                                                        <div key={dish.id} className={`flex items-start gap-4 ${!dish.available ? 'opacity-40' : ''}`}>
                                                            {dish.image_url
                                                                ? <img src={dish.image_url} alt={dish.name} className="h-16 w-16 rounded-xl object-cover shrink-0 border" style={{ borderColor: `${design.data.text_color}22` }} />
                                                                : <div className="h-16 w-16 rounded-xl shrink-0 border border-dashed flex items-center justify-center" style={{ borderColor: `${design.data.text_color}33`, backgroundColor: `${design.data.text_color}08` }}>
                                                                    <ImageOff className="h-5 w-5 opacity-30" style={{ color: design.data.text_color }} />
                                                                </div>
                                                            }
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-baseline justify-between gap-2">
                                                                    <span className="font-semibold text-sm" style={{ color: design.data.text_color }}>{dish.name}</span>
                                                                    <span className="font-bold text-sm shrink-0" style={{ color: design.data.primary_color }}>{fmt(dish.price)}</span>
                                                                </div>
                                                                {dish.description && (
                                                                    <p className="text-xs mt-1 leading-relaxed opacity-65" style={{ color: design.data.text_color }}>{dish.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>

                                <div className="text-center pb-6 opacity-40 text-xs" style={{ color: design.data.text_color }}>
                                    Carta digital · Menugo
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ════ Panel derecho — QR + stats ════ */}
                <div className="xl:w-72 space-y-5 shrink-0">
                    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-5">
                        <div className="text-center">
                            <h2 className="font-display text-base font-bold">Código QR</h2>
                            <p className="text-xs text-muted-foreground mt-1">Tus clientes escanean esto</p>
                        </div>
                        <div className="relative w-full max-w-[340px] mx-auto aspect-square rounded-[3rem] p-1.5 overflow-hidden group shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] transition-all duration-500">
                            
                            <style dangerouslySetInnerHTML={{__html: `
                                @keyframes qr-spin-gradient {
                                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                                }
                                @keyframes qr-float {
                                    0%, 100% { transform: translateY(0px) scale(1.08); }
                                    50% { transform: translateY(-12px) scale(1.08); }
                                }
                                @keyframes qr-shine {
                                    0% { left: -100%; }
                                    20% { left: 200%; }
                                    100% { left: 200%; }
                                }
                            `}} />

                            {/* Borde animado giratorio (Efecto Láser / Neón) */}
                            <div 
                                className="absolute top-1/2 left-1/2 w-[250%] h-[250%] opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
                                style={{
                                    animation: 'qr-spin-gradient 3s linear infinite',
                                    background: `conic-gradient(from 0deg, transparent 0%, transparent 35%, ${design.data.primary_color || '#ff6b00'} 45%, ${design.data.primary_color || '#ff6b00'} 55%, transparent 65%, transparent 100%)`
                                }} 
                            />
                            
                            {/* Tarjeta interior */}
                            <div className="relative w-full h-full bg-white dark:bg-zinc-900 rounded-[2.8rem] p-6 flex flex-col items-center justify-center overflow-hidden z-10">
                                
                                {/* Aura interna del color primario */}
                                <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity duration-700"
                                    style={{ background: `radial-gradient(circle at 50% 50%, ${design.data.primary_color || '#ff6b00'} 0%, transparent 65%)` }}
                                />

                                {/* Contenedor del código QR con efecto de flotación 3D */}
                                <div ref={qrRef} 
                                    className="relative z-20 bg-white p-5 rounded-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.15)] border border-gray-100/50 group-hover:border-white transition-all duration-500"
                                    style={{ transformOrigin: 'center' }}
                                >
                                    <div className="transform group-hover:[animation:qr-float_3s_ease-in-out_infinite] transition-transform duration-500">
                                        <QRCodeSVG
                                            value={public_url}
                                            size={180}
                                            level="H"
                                            fgColor={design.data.primary_color || '#000000'}
                                            bgColor="transparent"
                                            imageSettings={{
                                                src: '/logo-trans.png',
                                                height: 56,
                                                width: 56,
                                                excavate: true,
                                            }}
                                            className="relative z-10"
                                        />
                                        
                                        {/* Logo central MUY llamativo */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                            <div className="relative w-[68px] h-[68px] flex items-center justify-center">
                                                {/* Anillos de pulsación */}
                                                <div className="absolute inset-[-30%] rounded-full animate-ping opacity-20" style={{ backgroundColor: design.data.primary_color || '#ff6b00', animationDuration: '2s' }} />
                                                <div className="absolute inset-[-10%] rounded-full animate-pulse opacity-40 blur-md" style={{ backgroundColor: design.data.primary_color || '#ff6b00' }} />
                                                
                                                {/* Insignia física */}
                                                <div 
                                                    className="relative bg-white w-full h-full rounded-full shadow-[0_12px_25px_rgba(0,0,0,0.3),inset_0_4px_6px_rgba(255,255,255,0.8)] flex items-center justify-center overflow-hidden z-10 transform group-hover:rotate-[360deg] transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-[4px]"
                                                    style={{ borderColor: design.data.primary_color || '#ff6b00' }}
                                                >
                                                    <div className="w-full h-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center p-1.5">
                                                        <img src={'/logo-trans.png'} alt="Logo" className="w-full h-full object-contain drop-shadow-md scale-110" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Etiqueta de acción que aparece */}
                                <div className="absolute bottom-5 z-20 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                                    <div 
                                        className="px-6 py-2.5 text-white text-[12px] uppercase tracking-[0.25em] font-black rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.4)] relative overflow-hidden"
                                        style={{ backgroundColor: design.data.primary_color || '#1a1a1a' }}
                                    >
                                        <div className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70" style={{ animation: 'qr-shine 3s infinite' }} />
                                        <span className="relative z-10 drop-shadow-md">¡Escanéame!</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
                            <span className="flex-1 text-xs text-muted-foreground truncate">{public_url}</span>
                            <button onClick={copyUrl} title="Copiar" className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <a href={public_url} target="_blank" rel="noreferrer" title="Abrir carta" className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                        <div className="w-full space-y-2">
                            <button onClick={downloadQR} className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                                <Download className="h-4 w-4" /> Descargar QR
                            </button>
                            <button onClick={printMenu} className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                                <Printer className="h-4 w-4" /> Imprimir carta
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado de la carta</h3>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Categorías', value: categories.length, color: 'text-foreground' },
                                { label: 'Platos', value: totalPlatos, color: 'text-foreground' },
                                { label: 'Disponibles', value: totalDisponibles, color: 'text-accent' },
                                { label: 'Sin imagen', value: sinImagen, color: sinImagen > 0 ? 'text-yellow-400' : 'text-accent' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{item.label}</span>
                                    <span className={`font-semibold ${item.color}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {editing && <EditModal dish={editing} onClose={() => setEditing(null)} />}
        </AppShell>
    );
}
