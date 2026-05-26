import { Link, router, usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';
import { PageProps, Role } from '@/types';
import SystemAlertBanner from '@/components/SystemAlertBanner';

// ── Iconos SVG inline ──────────────────────────────────────────────────────────
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
    'lock':             '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'menu':             '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    'x':                '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'building-2':       '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>',
    'bar-chart-3':      '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    'credit-card':      '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    'megaphone':        '<path d="m3 11 19-9-9 19-2-8-8-2z"/>',
    'image-ad':         '<rect width="18" height="14" x="3" y="5" rx="2"/><path d="m3 15 4-4 4 4 4-5 4 5"/><circle cx="8.5" cy="9.5" r="1.5"/>',
    'gallery-h':        '<rect width="4" height="8" x="2" y="8" rx="1"/><rect width="4" height="8" x="10" y="8" rx="1"/><rect width="4" height="8" x="18" y="8" rx="1"/><path d="M2 4h20"/><path d="M2 20h20"/>',
    'shield-check':     '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    'plus-circle':      '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
    'settings':         '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    'receipt':          '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M12 16H8"/>',
};

function Icon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={className}
            dangerouslySetInnerHTML={{ __html: paths[name] ?? '' }}
        />
    );
}

// ── Tipos de navegación ────────────────────────────────────────────────────────
type NavChild = { href: string; label: string; readOnly?: boolean; exact?: boolean };
type NavItem =
    | { href: string; label: string; icon: string; readOnly?: boolean; children?: never }
    | { label: string; icon: string; children: NavChild[]; href?: never; readOnly?: boolean };

// ── Badge de rol ───────────────────────────────────────────────────────────────
const ROLE_BADGE: Record<Role, { label: string; className: string }> = {
    gerente:       { label: 'Gerente',       className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
    administrador: { label: 'Administrador', className: 'bg-orange-400/15 text-orange-400 border-orange-400/20' },
    caja:          { label: 'Caja',          className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
    cocina:        { label: 'Cocina',        className: 'bg-red-400/15 text-red-400 border-red-400/20' },
    mesa:          { label: 'Mesa',          className: 'bg-green-400/15 text-green-400 border-green-400/20' },
    domicilio:     { label: 'Domicilio',     className: 'bg-purple-400/15 text-purple-400 border-purple-400/20' },
    superadmin:    { label: 'SuperAdmin',    className: 'bg-muted text-muted-foreground border-border' },
};

// ── Navegación por rol ─────────────────────────────────────────────────────────
const MenuGroup: NavItem = { label: 'Menú', icon: 'utensils', children: [
    { href: '/menu/carta',      label: 'Carta' },
    { href: '/menu/categorias', label: 'Categorías' },
    { href: '/menu/platos',     label: 'Platos' },
]};

const cocinaGroup: NavItem = { label: 'Cocina', icon: 'flame', children: [
    { href: '/cocina',           label: 'Cocina' },
    { href: '/cocina/novedades', label: 'Novedades' },
]};

const cocinaReadOnly: NavItem = { label: 'Cocina', icon: 'flame', readOnly: true, children: [
    { href: '/cocina', label: 'Cocina', readOnly: true },
]};

const mesaGroup: NavItem = { label: 'Mesa', icon: 'layout-dashboard', children: [
    { href: '/tables',    label: 'Mesas' },
    { href: '/adiciones', label: 'Adiciones' },
]};

const configuracionGroup: NavItem = { label: 'Configuraciones', icon: 'settings', children: [
    { href: '/configuracion/pagos',     label: 'Métodos de pago' },
    { href: '/configuracion/domicilio', label: 'Tarifas domicilio' },
    { href: '/configuracion/horario',   label: 'Horario trabajo' },
]};

const cajaGroup: NavItem = { label: 'Caja', icon: 'dollar-sign', children: [
    { href: '/caja',                  label: 'Caja',              exact: true },
    { href: '/caja/cierre/caja',      label: 'Cierre de Caja' },
    { href: '/caja/cierre/datafono',  label: 'Cierre de Datafono' },
]};

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
    gerente: [
        { href: '/dashboard', label: 'Inicio', icon: 'home' },
        { href: '/usuarios',  label: 'Usuarios', icon: 'users' },
        MenuGroup,
        cajaGroup,
        { href: '/pedidos',   label: 'Pedidos',   icon: 'shopping-bag' },
        cocinaGroup,
        mesaGroup,
        { href: '/domicilio', label: 'Domicilio', icon: 'map-pin' },
        { href: '/inventario',label: 'Inventario',icon: 'package' },
        { label: 'Reporte', icon: 'file-bar-chart', children: [
            { href: '/reporte',   label: 'General' },
            { href: '/auditoria', label: 'Auditoría' },
        ]},
        { href: '/gastos', label: 'Gastos', icon: 'receipt' },
        configuracionGroup,
    ],
    administrador: [
        { href: '/dashboard', label: 'Inicio',    icon: 'home' },
        { href: '/usuarios',  label: 'Usuarios',  icon: 'users' },
        MenuGroup,
        cajaGroup,
        { href: '/pedidos',   label: 'Pedidos',   icon: 'shopping-bag' },
        cocinaGroup,
        mesaGroup,
        { href: '/domicilio', label: 'Domicilio', icon: 'map-pin' },
        { href: '/inventario',label: 'Inventario',icon: 'package' },
        { href: '/gastos',    label: 'Gastos',    icon: 'receipt' },
        configuracionGroup,
    ],
    caja: [
        { href: '/dashboard', label: 'Inicio',  icon: 'home' },
        cajaGroup,
        { href: '/pedidos',   label: 'Pedidos', icon: 'shopping-bag' },
    ],
    cocina: [
        { href: '/dashboard',  label: 'Inicio',    icon: 'home' },
        cocinaGroup,
        { href: '/inventario', label: 'Inventario', icon: 'package', readOnly: true },
    ],
    mesa: [
        { href: '/dashboard', label: 'Inicio',  icon: 'home' },
        { href: '/pedidos',   label: 'Pedidos', icon: 'shopping-bag' },
        mesaGroup,
        cocinaReadOnly,
    ],
    domicilio: [
        { href: '/dashboard', label: 'Inicio',    icon: 'home' },
        { href: '/domicilio', label: 'Domicilio', icon: 'map-pin' },
        { href: '/pedidos',   label: 'Pedidos',   icon: 'shopping-bag' },
    ],
    superadmin: [
        { href: '/admin',                       label: 'Global',             icon: 'layout-dashboard' },
        { href: '/admin/tenants',               label: 'Locales',            icon: 'building-2' },
        { href: '/admin/billing',               label: 'Facturación',        icon: 'credit-card' },
        { href: '/admin/publicidad',            label: 'Publicidad MockUp',  icon: 'image-ad' },
        { href: '/admin/publicidad-slider',     label: 'Publicidad Slider',  icon: 'gallery-h' },
    ],
};

// ── SubMenu desplegable ────────────────────────────────────────────────────────
function SubMenu({
    item, currentPath, isOpen, onToggle,
}: {
    item: NavItem & { children: NavChild[] };
    currentPath: string;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const isChildActive = item.children.some(c =>
        c.exact ? currentPath === c.href : currentPath.startsWith(c.href)
    );

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
                {item.readOnly && (
                    <Icon name="lock" className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                )}
                <Icon name="chevron-down"
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="mt-0.5 ml-3 pl-4 border-l border-sidebar-border space-y-0.5 pb-1">
                    {item.children.map((child) => {
                        const active = child.exact
                            ? currentPath === child.href
                            : (currentPath === child.href || currentPath.startsWith(child.href + '/'));
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
                                <span className="flex-1">{child.label}</span>
                                {child.readOnly && (
                                    <Icon name="lock" className="h-3 w-3 text-muted-foreground/50" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Sidebar content (reutilizado en desktop y mobile) ─────────────────────────
function SidebarContent({
    nav, currentPath, openIndex, setOpenIndex, user, badge, onNavigate,
}: {
    nav: NavItem[];
    currentPath: string;
    openIndex: number | null;
    setOpenIndex: (i: number | null) => void;
    user: { name: string; role: string };
    badge: { label: string; className: string };
    onNavigate?: () => void;
}) {
    return (
        <>
            {/* Logo + badge */}
            <div className="px-4 py-6 border-b border-sidebar-border flex flex-col items-center justify-center text-center">
                <Link href="/" onClick={onNavigate} className="block transition-transform hover:scale-105">
                    <div className="mx-auto h-24 w-24 bg-white rounded-full flex items-center justify-center p-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
                        <img src="/logo-trans.png" alt="Menugo" className="h-full w-full object-contain" />
                    </div>
                </Link>
                <span className={`mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${badge.className}`}>
                    {badge.label}
                </span>
            </div>

            {/* Navegación */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {nav.map((item, idx) => {
                    if (item.children) {
                        return (
                            <SubMenu
                                key={item.label}
                                item={item as NavItem & { children: NavChild[] }}
                                currentPath={currentPath}
                                isOpen={openIndex === idx}
                                onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
                            />
                        );
                    }

                    const active = currentPath === item.href || currentPath.startsWith((item.href ?? '') + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href!}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
                                ${active
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
                        >
                            <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.readOnly && (
                                <Icon name="lock" className="h-3 w-3 text-muted-foreground/50" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Pie: usuario + logout */}
            <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
                <div className="px-3 py-2">
                    <div className="text-xs font-semibold text-sidebar-foreground truncate">{user.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{user.role}</div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if (onNavigate) onNavigate();
                        router.post('/logout');
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground
                               hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <Icon name="log-out" className="h-4 w-4" />
                    Cerrar sesión
                </button>
            </div>
        </>
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
    const { url, props } = usePage<PageProps>();
    const user  = props.auth.user;
    const role  = user?.role ?? 'gerente';
    const flash = props.flash;

    const nav   = variant === 'admin' ? NAV_BY_ROLE['superadmin'] : (NAV_BY_ROLE[role] ?? NAV_BY_ROLE['gerente']);
    const badge = ROLE_BADGE[role] ?? ROLE_BADGE['gerente'];

    const [openIndex, setOpenIndex] = useState<number | null>(() =>
        nav.findIndex(item => item.children?.some(c => url.startsWith(c.href)))
    );
    const [mobileOpen, setMobileOpen] = useState(false);

    // Cerrar sidebar móvil al cambiar de URL
    useEffect(() => { setMobileOpen(false); }, [url]);

    const sidebarProps = {
        nav, currentPath: url, openIndex, setOpenIndex,
        user: { name: user?.name ?? '', role },
        badge,
    };

    return (
        <div className="min-h-screen flex bg-background">

            {/* ══ Sidebar desktop ══ */}
            <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
                <SidebarContent {...sidebarProps} />
            </aside>

            {/* ══ Sidebar móvil (overlay) ══ */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    {/* Fondo oscuro */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Panel */}
                    <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col bg-sidebar border-r border-sidebar-border shadow-2xl">
                        <SidebarContent {...sidebarProps} onNavigate={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}

            {/* ══ Contenido ══ */}
            <main className="flex-1 overflow-x-hidden min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-10 glass border-b border-border px-4 lg:px-10 py-4 lg:py-5 flex items-center gap-4">
                    {/* Botón hamburguesa (solo móvil) */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors"
                        aria-label="Abrir Menu"
                    >
                        <Icon name="menu" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="font-display text-xl lg:text-2xl font-bold truncate">{title}</h1>
                        {subtitle && <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
                    </div>
                </header>

                {/* Flash messages */}
                {flash?.error && (
                    <div className="mx-4 lg:mx-10 mt-4 rounded-xl px-4 py-3 text-sm font-medium border bg-red-500/10 border-red-500/20 text-red-400">
                        {flash.error}
                    </div>
                )}
                {flash?.warning && (
                    <div className="mx-4 lg:mx-10 mt-4 rounded-xl px-4 py-3 text-sm font-medium border bg-yellow-500/10 border-yellow-500/20 text-yellow-400">
                        {flash.warning}
                    </div>
                )}
                {flash?.success && (
                    <div className="mx-4 lg:mx-10 mt-4 rounded-xl px-4 py-3 text-sm font-medium border bg-accent/10 border-accent/20 text-accent">
                        {flash.success}
                    </div>
                )}

                <div className="px-4 lg:px-10 py-6 lg:py-8">
                    {children}
                </div>
            </main>

            {/* ── Alertas del sistema: solo visible para variant="admin" ────────
                Aparece en TODAS las páginas del panel SuperAdmin automáticamente.
                El componente hace polling a /admin/system-health cada 90s.     */}
            {variant === 'admin' && <SystemAlertBanner />}
        </div>
    );
}
