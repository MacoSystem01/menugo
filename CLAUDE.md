"Respetando la estructura, Convicción del código, nomenclatura y estilo existente en el sistema actualmente, analizá el fragmento recibido detalladamente para identificar y solucionar los diferentes estados de conflictos entre variables, lógica e inconsistencia, props compartidos con otros componentes, evitar casos de redundancia, efecto secundarios no intencionados, corregir los diferentes bug's que se presenten y fallos de seguridad.
Antes de aplicar cambios, se debe de validar mentalmente al menos 3 casos de uso distintos (Caso Base, Caso Borde, Caso Error) para garantizar la edición y no romper funcionalidades existentes.
Para terminar función, realiza un ultimo chequeo ejecutando por completo el Archivo CLAUDE.md hasta resolver todo.
"
Con la información anterior y los parametros establecidos tenemos que realizar lo siguiente:

* Realiza pruebas con los diferentes archivos que estan en "\tests\load" y corrige conflicto o bug de seguridad que pueda a ver, dejando el sistema 100% seguro, con la información encriptada por completo y realizando pruebas de todo ello.

---

## Contexto del proyecto — MenuGo

### Stack

- **Backend:** Laravel 11 · PHP 8.2+ · MySQL
- **Multi-tenancy:** Stancl Tenancy v3 — subdominio por tenant, BD aislada por tenant
- **Frontend:** React 19 · TypeScript · Inertia.js v3 · Tailwind CSS v4 · Lucide React
- **Build:** Vite 7 + laravel-vite-plugin
- **Permisos:** Spatie Laravel Permission

### Arquitectura multi-tenant

Cada tenant opera en `{slug}.menugo.local` con su propia BD `menugo_{uuid}`.  
La BD central `menugo` almacena: tenants, domains, advertisements, plataforma.  
Dentro del contexto tenant, usar `tenant()` / `tenant('key')` para leer datos del tenant activo.

**Tipos de negocio** — `tenant('type')`:

| Valor | Negocio | Flujo de cobro |
|-------|---------|----------------|
| `'restaurante'` | Restaurante con mesas | `cocina_primero` (fijo) |
| `'puesto'` | Puesto de comida rápida / mostrador | Configurable: `pago_primero` o `cocina_primero` |

**Hook frontend:** `useBusinessType()` → `{ isPuesto, isRestaurante }` — archivo `resources/js/hooks/use-business-type.ts`.

### Flujos de pedido (`CartaSetting.order_flow`)

| Flujo | Comportamiento |
|-------|---------------|
| `pago_primero` | Cliente paga al crear el pedido → se envía a cocina ya cobrado |
| `cocina_primero` | Cocina prepara primero → cajero cobra cuando el pedido está en `ready` |

Restaurante siempre usa `cocina_primero`. Puesto lo configura en `/configuracion/flujo`.

### Estados de un pedido (`Order.status`)

`pending → in_kitchen → cooking → ready → delivered` · `cancelled`

`amount_paid` puede superar `total` cuando se cobra propina/servicio — esto es intencional y correcto.

### Props compartidos (disponibles en todos los componentes)

Vienen de `HandleInertiaRequests`. Acceder con `usePage<PageProps>().props`:

```
auth.user · tenant_name · tenant_type · tenant_plan
tenant_expires_at · tenant_days_left · tenant_is_trial
tenant_logo_url · central_url · support_whatsapp
flash.success · flash.error · flash.warning
flash.turn_number (número de turno tras crear pedido mostrador)
```

### Modelo `CartaSetting` — campos críticos

| Campo | Cast | Nota |
|-------|------|------|
| `payment_details` | `encrypted:array` | Datos bancarios AES-256. Nunca en texto plano. |
| `work_schedule` | `array` | `{ lun: { activo: bool, apertura: 'HH:MM', cierre: 'HH:MM' } }` |
| `order_flow` | string | `'pago_primero'` \| `'cocina_primero'` |
| `payment_methods` | `array` | Métodos habilitados por el tenant |

**`isOpenNow()`** — siempre usar `filter_var($activo, FILTER_VALIDATE_BOOLEAN)`, nunca `(bool)` ni `empty()`. Inertia serializa `false` como el string `"false"` en FormData y `(bool) "false" === true` en PHP.

### Guard de cobro en backend

`OrderController::registrarPago()` y `cobrar()` rechazan el pago si:
```php
$orderFlow === 'cocina_primero' && !in_array($order->status, ['ready', 'delivered'])
```

`CartaController::store()` verifica `$cfg->isOpenNow()` antes de crear cualquier pedido.

### Auto-pago mostrador

Solo se auto-paga al crear si `order_flow === 'pago_primero'`:
```php
if ($data['type'] === 'mostrador' && $orderFlow === 'pago_primero') {
    $order->update(['amount_paid' => $total]);
}
```

### Propina / Servicio (10%)

Botones en `/caja`: **"Con Propina"** (Puesto) y **"Incluir Servicio"** (Restaurante).  
El frontend envía `amount_paid = pendiente + Math.round(total * 0.1)`.  
El backend acumula: `newAmount = order->amount_paid + request->amount_paid`.  
El historial muestra `amount_paid` con badge `"Propina +X"` cuando `amount_paid > total`.

### KDS Cocina (`Cocina.tsx`)

- **Puesto:** solo columna `ready` visible. Pedidos `pending` en sección "Nuevos pedidos" con "Marcar listo" (`pending → ready`).
- **Restaurante:** todas las columnas (`pending → in_kitchen → cooking → ready`).

### Rutas protegidas relevantes

| Ruta | Permiso |
|------|---------|
| `GET /caja` | `caja.ver` |
| `POST /caja/{order}/pagar` | `caja.gestionar` |
| `GET /cocina` | `cocina.ver` |
| `POST /cocina/{order}/listo` | `cocina.gestionar` |
| `GET /carta` | público |
| `POST /carta/pedido` | público · throttle 60/min |
| `/tables`, `/adiciones` | `restaurante.only` middleware |

### Comandos de desarrollo y deploy

```powershell
# Build (elimina public/hot automáticamente)
npm run build

# Verificar TypeScript en un archivo específico
npx tsc --noEmit 2>&1 | Select-String "NombreArchivo"

# Migraciones para todos los tenants
php artisan tenants:migrate

# Reset de BD de un tenant específico
php artisan tenants:migrate-fresh --tenants={uuid}

# Limpiar caché
php artisan config:clear && php artisan cache:clear
```

**Deploy:** solo via `git push` / `git pull`. Nunca rsync, ZIP ni copias manuales.  
**`public/hot`:** si hay bucle de recargas en dev, eliminar este archivo primero.

### Reglas de seguridad

- `payment_details` siempre encriptado (`encrypted:array`). Nunca exponer en texto plano.
- Precios se resuelven desde la BD en el backend — nunca confiar en valores del cliente.
- Métodos de pago se validan contra `CartaSetting::payment_methods` del tenant.
- Throttle: `POST /carta/pedido` → 60/min · `POST /login` → 5/min.
- Timezone de negocio: `America/Bogota` — usar `now('America/Bogota')` para lógica de horario.
- Nunca usar `(bool) $valor` para convertir booleanos de Inertia — usar `filter_var($valor, FILTER_VALIDATE_BOOLEAN)`.

### Patrones a evitar

- `empty()` para validar booleans que vienen de JSON/Inertia.
- Cachear `is_open_now` — es dinámico y debe calcularse por request.
- `->oldest()` en queries de `/caja` — usar `->latest()` (newest first).
- Modificar `public/build/` manualmente — lo genera Vite y es compartido entre tenants.
- Rutas de mesa/adiciones sin `middleware('restaurante.only')`.
- Lógica exclusiva de tipo de negocio solo en el frontend — siempre también en el backend.
