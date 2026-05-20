import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Users as UsersIcon, KeyRound, ToggleLeft, ToggleRight } from 'lucide-react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    roles: string[];
}

interface Props {
    users: UserRow[];
    roles: string[];
    flash?: { success?: string; error?: string };
}

interface UserForm {
    name: string; email: string; phone: string;
    password: string; password_confirmation: string;
    role: string; active: boolean;
}

interface PwdForm {
    password: string; password_confirmation: string;
}

const ROLE_LABEL: Record<string, string> = {
    administrador: 'Administrador',
    gerente:       'Gerente',
    caja:          'Caja',
    cocina:        'Cocina',
    mesa:          'Mesa',
    domicilio:     'Domicilio',
};

const ROLE_CLASS: Record<string, string> = {
    administrador: 'bg-accent/20 text-accent',
    gerente:       'bg-primary/20 text-primary',
    caja:          'bg-yellow-500/20 text-yellow-400',
    cocina:        'bg-orange-500/20 text-orange-400',
    mesa:          'bg-blue-500/20 text-blue-400',
    domicilio:     'bg-purple-500/20 text-purple-400',
};

export default function Users({ users, roles, flash }: Props) {
    const [modal, setModal]   = useState<'create' | 'edit' | 'pwd' | null>(null);
    const [target, setTarget] = useState<UserRow | null>(null);

    const form = useForm<UserForm>({
        name: '', email: '', phone: '', password: '', password_confirmation: '', role: '', active: true,
    });

    const pwdForm = useForm<PwdForm>({ password: '', password_confirmation: '' });

    function openCreate() {
        form.reset();
        setTarget(null);
        setModal('create');
    }

    function openEdit(u: UserRow) {
        form.setData({ name: u.name, email: u.email, phone: u.phone ?? '', password: '', password_confirmation: '', role: u.roles[0] ?? '', active: u.active });
        setTarget(u);
        setModal('edit');
    }

    function openPwd(u: UserRow) {
        pwdForm.reset();
        setTarget(u);
        setModal('pwd');
    }

    function closeModal() {
        setModal(null);
        form.reset();
        pwdForm.reset();
        setTarget(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (modal === 'edit' && target) {
            form.put(`/usuarios/${target.id}`, { onSuccess: closeModal });
        } else {
            form.post('/usuarios', { onSuccess: closeModal });
        }
    }

    function handlePwd(e: React.FormEvent) {
        e.preventDefault();
        if (!target) return;
        pwdForm.post(`/usuarios/${target.id}/password`, { onSuccess: closeModal });
    }

    function handleDelete(u: UserRow) {
        if (!confirm(`¿Eliminar al usuario "${u.name}"?`)) return;
        router.delete(`/usuarios/${u.id}`);
    }

    function toggleActive(u: UserRow) {
        router.put(`/usuarios/${u.id}`, { ...u, role: u.roles[0] ?? '', active: !u.active, password: '', password_confirmation: '' });
    }

    return (
        <AppShell title="Usuarios" subtitle="Gestiona el equipo de tu restaurante">
            <Head title="Usuarios" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}

            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">{users.length} {users.length === 1 ? 'usuario' : 'usuarios'}</p>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Plus className="h-4 w-4" /> Nuevo usuario
                </button>
            </div>

            {users.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <UsersIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin usuarios</p>
                    <p className="text-sm text-muted-foreground mt-1">Crea el primer miembro del equipo.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-3 font-medium">Usuario</th>
                                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Contacto</th>
                                <th className="text-left px-6 py-3 font-medium">Rol</th>
                                <th className="text-center px-6 py-3 font-medium">Estado</th>
                                <th className="text-right px-6 py-3 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary font-bold text-sm shrink-0">
                                                {u.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium">{u.name}</div>
                                                <div className="text-xs text-muted-foreground">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">{u.phone ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        {u.roles.length > 0
                                            ? <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ROLE_CLASS[u.roles[0]] ?? 'bg-muted text-muted-foreground'}`}>{ROLE_LABEL[u.roles[0]] ?? u.roles[0]}</span>
                                            : <span className="text-xs text-muted-foreground">Sin rol</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => toggleActive(u)} className="inline-flex items-center gap-1 text-xs">
                                            {u.active
                                                ? <><ToggleRight className="h-5 w-5 text-accent" /><span className="text-accent">Activo</span></>
                                                : <><ToggleLeft className="h-5 w-5 text-muted-foreground" /><span className="text-muted-foreground">Inactivo</span></>
                                            }
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex gap-2">
                                            <button onClick={() => openPwd(u)} title="Cambiar contraseña" className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                <KeyRound className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Modal usuario */}
            {(modal === 'create' || modal === 'edit') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <h2 className="font-display text-lg font-bold mb-5">{modal === 'edit' ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1.5">Nombre <span className="text-red-400">*</span></label>
                                    <input className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.name} onChange={e => form.setData('name', e.target.value)} placeholder="Nombre completo" autoFocus />
                                    {form.errors.name && <p className="text-xs text-red-400 mt-1">{form.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Email <span className="text-red-400">*</span></label>
                                    <input type="email" className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.email} onChange={e => form.setData('email', e.target.value)} />
                                    {form.errors.email && <p className="text-xs text-red-400 mt-1">{form.errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Teléfono</label>
                                    <input className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1.5">Rol <span className="text-red-400">*</span></label>
                                    <select className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.role} onChange={e => form.setData('role', e.target.value)}>
                                        <option value="">Seleccionar rol...</option>
                                        {roles.map(r => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
                                    </select>
                                    {form.errors.role && <p className="text-xs text-red-400 mt-1">{form.errors.role}</p>}
                                </div>
                                {modal === 'create' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Contraseña <span className="text-red-400">*</span></label>
                                            <input type="password" className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                value={form.data.password} onChange={e => form.setData('password', e.target.value)} />
                                            {form.errors.password && <p className="text-xs text-red-400 mt-1">{form.errors.password}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Confirmar</label>
                                            <input type="password" className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                value={form.data.password_confirmation} onChange={e => form.setData('password_confirmation', e.target.value)} />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                                <button type="submit" disabled={form.processing} className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
                                    {form.processing ? 'Guardando...' : modal === 'edit' ? 'Guardar cambios' : 'Crear usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal contraseña */}
            {modal === 'pwd' && target && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <h2 className="font-display text-lg font-bold mb-1">Cambiar contraseña</h2>
                        <p className="text-sm text-muted-foreground mb-5">{target.name}</p>
                        <form onSubmit={handlePwd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nueva contraseña</label>
                                <input type="password" className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={pwdForm.data.password} onChange={e => pwdForm.setData('password', e.target.value)} autoFocus />
                                {pwdForm.errors.password && <p className="text-xs text-red-400 mt-1">{pwdForm.errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Confirmar</label>
                                <input type="password" className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={pwdForm.data.password_confirmation} onChange={e => pwdForm.setData('password_confirmation', e.target.value)} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                                <button type="submit" disabled={pwdForm.processing} className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
                                    {pwdForm.processing ? 'Guardando...' : 'Actualizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
