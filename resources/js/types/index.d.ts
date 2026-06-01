// ── Auth ──────────────────────────────────────────────────────────────────────

export type Role =
    | 'gerente'
    | 'administrador'
    | 'caja'
    | 'cocina'
    | 'mesa'
    | 'domicilio'
    | 'superadmin';

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    role: Role;
    roles: string[];
    permissions: string[];
}

export interface PageProps {
    auth: {
        user: User;
    };
    tenant_name?: string;
    tenant_address?: string;
    tenant_phone?: string;
    tenant_logo_url?: string | null;
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
    };
    [key: string]: unknown;
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export interface Category {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    sort_order: number;
    dishes_count: number;
}

export interface Dish {
    id: number;
    name: string;
    description: string | null;
    price: number;
    available: boolean;
    sort_order: number;
    category_id: number;
    category: string | null;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
    | 'pending'
    | 'at_cash'
    | 'in_kitchen'
    | 'cooking'
    | 'ready'
    | 'delivered'
    | 'cancelled';

export type OrderType = 'mesa' | 'domicilio';

export interface OrderItem {
    dish: string | null;
    quantity: number;
    unit_price: number;
    notes: string | null;
}

export interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    tipo: OrderType;
    mesa: number | null;
    delivery_address: string | null;
    status: OrderStatus;
    total: number;
    notas: string | null;
    items: OrderItem[];
    created_at: string;
}

// ── Tables ───────────────────────────────────────────────────────────────────

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface TableOrder {
    id: number;
    status: OrderStatus;
    total: number;
    items_count: number;
    items: Array<{ dish: string | null; quantity: number }>;
    created_at: string;
}

export interface RestaurantTable {
    id: number;
    number: number;
    capacity: number;
    status: TableStatus;
    qr_code: string;
    active_orders_count: number;
    orders: TableOrder[];
}

// ── Inventory ────────────────────────────────────────────────────────────────

export type InventoryStatus = 'ok' | 'bajo' | 'agotado' | 'vencido';

export interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_value: number;
    status: InventoryStatus;
    expiry_date: string | null;
    notes: string | null;
}

// ── Kitchen ───────────────────────────────────────────────────────────────────

export type KitchenNoteType = 'quemado' | 'cancelado' | 'devuelto' | 'dañado' | 'otro';

export interface KitchenNote {
    id: number;
    type: KitchenNoteType;
    description: string;
    order_id: number | null;
    dish: string | null;
    author: string | null;
    created_at: string;
    verified_at: string | null;
    verified_by: string | null;
}

// ── Tenants (Admin) ──────────────────────────────────────────────────────────

export interface TenantRow {
    id: string;
    name: string;
    type: string;
    plan: string;
    subdomain: string | null;
    created_at: string;
}

// ── Dashboard by role ─────────────────────────────────────────────────────────

interface DashboardPedidoReciente {
    id: number;
    resumen: string;
    total: number;
    amount_paid: number;
    status: string;
    tipo: string;
    mesa: number | null;
    tiempo: string;
}

interface DashboardTopPlato {
    name: string;
    vendidos: number;
    ingresos: number;
}

interface DashboardCola {
    id: number;
    tipo: string;
    mesa: number | null;
    status: string;
    items: Array<{ dish: string | null; quantity: number; notes: string | null }>;
    tiempo: string;
    mins: number;
}

interface DashboardMesa {
    id: number;
    number: number;
    status: string;
    pedidos: number;
    listos: number;
}

interface DashboardPedidoActivo {
    id: number;
    mesa: number | null;
    status: string;
    total: number;
    items: number;
    tiempo: string;
}

interface DashboardTransaccion {
    id: number;
    tipo: string;
    mesa: number | null;
    total: number;
    amount_paid: number;
    status: string;
    tiempo: string;
}

interface DashboardDomicilio {
    id: number;
    customer_name: string;
    customer_phone: string;
    delivery_address: string | null;
    status: string;
    total: number;
    delivery_user_id: number | null;
    items: number;
    tiempo: string;
}

export interface FullDashboardProps {
    dashboardRole: 'full';
    stats: { ventas_hoy: number; pedidos_hoy: number; clientes_hoy: number; ticket_promedio: number };
    pedidos_recientes: DashboardPedidoReciente[];
    top_platos: DashboardTopPlato[];
}

export interface CajaDashboardProps {
    dashboardRole: 'caja';
    stats: { ventas_hoy: number; pedidos_cobrados: number; pendientes_cobro: number };
    transacciones: DashboardTransaccion[];
}

export interface CocinaDashboardProps {
    dashboardRole: 'cocina';
    stats: { pendientes: number; cocinando: number; listos: number };
    cola: DashboardCola[];
}

export interface MesaDashboardProps {
    dashboardRole: 'mesa';
    mesas: DashboardMesa[];
    pedidos_activos: DashboardPedidoActivo[];
}

export interface DomicilioDashboardProps {
    dashboardRole: 'domicilio';
    stats: { pendientes: number; entregados: number };
    asignados: DashboardDomicilio[];
}

export type DashboardProps =
    | FullDashboardProps
    | CajaDashboardProps
    | CocinaDashboardProps
    | MesaDashboardProps
    | DomicilioDashboardProps;
