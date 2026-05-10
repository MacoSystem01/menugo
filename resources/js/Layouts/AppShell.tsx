import { Link, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { PageProps } from '@/types';

// ── Icono SVG inline ───────────────────────────────────────────────────────────
const paths: Record<string, string> = {
    'home':             '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'users':            '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'utensils':         '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    'dollar-sign':      '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    'shopping-bag':     '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    'flame':            '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>',
    'layout-dashboard': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    'map-pin':          '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    'package':          '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>',
    'file-bar-chart':   '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 18v-2"/><path d="M12 18v-4"/><path d="M16 18v-6"/>',
    'chevron-down':     '<path d="m6 9 6 6 6-6"/>',
    'log-out':          '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    'sparkles':         '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    'layout-admin':     '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    'building-2':       '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>',
    'bar-chart-3':      '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    'credit-card':      '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
};

function Icon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={className}
            dangerouslySetInnerHTML={{ __html: paths[name] ?? '' }}
        />
    );
}

// ── Tipos de navegación ────────────────────────────────────────────────────────
type NavChild = { href: string; label: string };
type NavItem =
    | { href: string; label: string; icon: string; children?: never }
    | { label: string; icon: string; children: NavChild[]; href?: never };

const restaurantNav: NavItem[] = [
    { href: '/dashboard',        label: 'Inicio',     icon: 'home' },
    { href: '/usuarios',         label: 'Usuarios',   icon: 'users' },
    { label: 'Menú', icon: 'utensils', children: [
        { href: '/menu/categorias', label: 'Categoría' },
        { href: '/menu/platos',     label: 'Plato' },
    ]},
    { href: '/caja',             label: 'Caja',       icon: 'dollar-sign' },
    { href: '/pedidos',          label: 'Pedidos',    icon: 'shopping-bag' },
    { label: 'Cocina', icon: 'flame', children: [
        { href: '/cocina',           label: 'Cocina' },
        { href: '/cocina/novedades', label: 'Novedades' },
    ]},
    { href: '/tables',           label: 'Mesa',       icon: 'layout-dashboard' },
    { href: '/domicilio',        label: 'Domicilio',  icon: 'map-pin' },
    { href: '/inventario',       label: 'Inventario', icon: 'package' },
    { href: '/reporte',          label: 'Reporte',    icon: 'file-bar-chart' },
];

const adminNav: NavItem[] = [
    { href: '/admin',            label: 'Global',      icon: 'layout-dashboard' },
    { href: '/admin/tenants',    label: 'Locales',     icon: 'building-2' },
    { href: '/admin/analytics',  label: 'Analítica',   icon: 'bar-chart-3' },
    { href: '/admin/billing',    label: 'Facturación', icon: 'credit-card' },
];

// ── Submenú desplegable ────────────────────────────────────────────────────────
function SubMenu({
    item, currentPath, isOpen, onToggle,
}: {
    item: NavItem & { children: NavChild[] };
    currentPath: string;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const isChildActive = item.children.some(c => currentPath.startsWith(c.href));

    return (
        <div>
            <button
                onClick={onToggle}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors select-none
                    ${isOpen || isChildActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
            >
                <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <Icon
                    name="chevron-down"
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="mt-0.5 ml-3 pl-4 border-l border-sidebar-border space-y-0.5 pb-1">
                    {item.children.map((child) => {
                        const active = currentPath === child.href || currentPath.startsWith(child.href + '/');
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors
                                    ${active
                                        ? 'bg-primary/15 text-primary font-semibold'
                                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${active ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                                {child.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Componente principal ───────────────────────────────────────────────────────
interface Props {
    title: string;
    subtitle?: string;
    variant?: 'restaurant' | 'admin';
    children: ReactNode;
}

export default function AppShell({ title, subtitle, variant = 'restaurant', children }: Props) {
    const { url } = usePage();
    const nav = variant === 'admin' ? adminNav : restaurantNav;

    // Accordion: solo un submenú abierto a la vez se controla dentro de cada SubMenu
    // con el estado local; para accordion real necesitamos coordinar desde aquí.
    // Usamos un índice del item abierto.
    const [openIndex, setOpenIndex] = useState<number | null>(() => {
        return nav.findIndex(item =>
            item.children?.some(c => url.startsWith(c.href))
        );
    });

    return (
        <div className="min-h-screen flex bg-background">

            {/* ══ Sidebar ══ */}
            <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
                    <img src="/logo-trans.png" alt="MenuGo" className="h-10 w-auto" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        {variant === 'admin' ? 'SuperAdmin' : 'Restaurante'}
                    </span>
                </Link>

                {/* Navegación */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                    {nav.map((item, idx) => {
                        if (item.children) {
                            return (
                                <SubMenu
                                    key={item.label}
                                    item={item as NavItem & { children: NavChild[] }}
                                    currentPath={url}
                                    isOpen={openIndex === idx}
                                    onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
                                />
                            );
                        }

                        const active = url === item.href || url.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href!}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
                                    ${active
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
                            >
                                <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Pie */}
                <div className="border-t border-sidebar-border px-3 py-4">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground
                                   hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <Icon name="log-out" className="h-4 w-4" />
                        Cerrar sesión
                    </Link>
                </div>
            </aside>

            {/* ══ Contenido ══ */}
            <main className="flex-1 overflow-x-hidden">
                <header className="sticky top-0 z-10 glass border-b border-border px-6 lg:px-10 py-5">
                    <h1 className="font-display text-2xl font-bold">{title}</h1>
                    {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
                </header>
                <div className="px-6 lg:px-10 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
