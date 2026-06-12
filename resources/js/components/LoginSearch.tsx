import { useEffect, useRef, useState } from 'react';
import { Search, X, ExternalLink, Loader2 } from 'lucide-react';

interface SearchResult {
    found: boolean;
    name?: string;
    url?: string;
    message?: string;
}

interface Props {
    /** Estilo del botón disparador */
    triggerClass?: string;
}

export function LoginSearch({ triggerClass }: Props) {
    const [open, setOpen]       = useState(false);
    const [query, setQuery]     = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult]   = useState<SearchResult | null>(null);

    const inputRef     = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) inputRef.current?.focus();
        else { setQuery(''); setResult(null); }
    }, [open]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function onOutsideClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', onOutsideClick);
        return () => document.removeEventListener('mousedown', onOutsideClick);
    }, [open]);

    // Cerrar con Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    async function search() {
        if (query.trim().length < 2 || loading) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`/tenant/find?name=${encodeURIComponent(query.trim())}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setResult(data);
        } catch {
            setResult({ found: false, message: 'Error al buscar. Intenta de nuevo.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div ref={containerRef} className="relative">
            {/* Botón disparador */}
            <button
                type="button"
                onClick={() => setOpen(s => !s)}
                className={triggerClass ?? 'flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'}
            >
                {open
                    ? <X className="h-4 w-4" />
                    : <Search className="h-4 w-4" />
                }
                {open ? 'Cancelar' : 'Iniciar sesión'}
            </button>

            {/* Popover */}
            {open && (
                <div className="absolute right-0 top-full mt-3 w-80 rounded-2xl border border-border bg-card p-4 shadow-lg space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-medium text-foreground">Accede a tu panel</p>
                    <p className="text-xs text-muted-foreground -mt-1">
                        Escribe el nombre de tu negocio para encontrar tu subdominio de acceso.
                    </p>

                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => { setQuery(e.target.value); setResult(null); }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(); } }}
                            placeholder="Ej: La Tajada"
                            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                        />
                        <button
                            type="button"
                            onClick={search}
                            disabled={loading || query.trim().length < 2}
                            className="grid place-items-center rounded-xl bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Search className="h-4 w-4" />
                            }
                        </button>
                    </div>

                    {result && (
                        <div className={`rounded-xl px-4 py-3 text-sm ${
                            result.found
                                ? 'bg-accent/10 border border-accent/30'
                                : 'bg-destructive/10 border border-destructive/30'
                        }`}>
                            {result.found ? (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground truncate">{result.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{result.url}</p>
                                    </div>
                                    <a
                                        href={result.url}
                                        className="flex items-center gap-1 shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/80 transition"
                                    >
                                        Ir al panel
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            ) : (
                                <p className="text-destructive">{result.message}</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
