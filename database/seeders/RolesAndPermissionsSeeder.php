<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $all = [
            // Usuarios
            'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'usuarios.roles',
            // Carta
            'carta.ver', 'carta.editar',
            // Categorías
            'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
            // Platos
            'platos.ver', 'platos.crear', 'platos.editar', 'platos.eliminar',
            // Caja
            'caja.ver', 'caja.gestionar', 'caja.historial',
            // Pedidos
            'pedidos.ver', 'pedidos.crear', 'pedidos.editar', 'pedidos.cancelar',
            // Cocina
            'cocina.ver', 'cocina.gestionar',
            // Novedades
            'novedades.ver', 'novedades.crear', 'novedades.gestionar',
            // Mesa
            'mesa.ver', 'mesa.gestionar',
            // Domicilio
            'domicilio.ver', 'domicilio.gestionar',
            // Inventario
            'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.eliminar',
            // Reporte
            'reporte.ver',
            // Auditoría
            'auditoria.ver',
        ];

        foreach ($all as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        $roles = [
            // Gerente: acceso total
            'gerente' => $all,

            // Administrador: todo excepto crear/eliminar usuarios, cambiar roles,
            // historial de caja, cancelar pedidos, eliminar inventario y reportes
            'administrador' => array_values(array_diff($all, [
                'usuarios.crear', 'usuarios.eliminar', 'usuarios.roles',
                'caja.historial',
                'pedidos.cancelar',
                'inventario.eliminar',
                'reporte.ver',
            ])),

            // Caja: gestión completa de cobros
            'caja' => [
                'caja.ver', 'caja.gestionar', 'caja.historial',
                'pedidos.ver',
            ],

            // Cocina: pedidos de cocina + novedades + inventario lectura
            'cocina' => [
                'cocina.ver', 'cocina.gestionar',
                'novedades.ver', 'novedades.crear',
                'inventario.ver',
            ],

            // Mesa: pedidos propios + mesas + ver cocina (lectura)
            'mesa' => [
                'pedidos.ver', 'pedidos.crear',
                'mesa.ver', 'mesa.gestionar',
                'cocina.ver',
            ],

            // Domicilio: sus domicilios + ver pedidos propios
            'domicilio' => [
                'domicilio.ver', 'domicilio.gestionar',
                'pedidos.ver',
            ],
        ];

        foreach ($roles as $name => $perms) {
            $role = Role::firstOrCreate(['name' => $name]);
            $role->syncPermissions($perms);
        }
    }
}
