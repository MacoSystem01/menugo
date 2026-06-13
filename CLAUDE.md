"
Respetando la estructura, Convicción del código, nomenclatura y estilo existente en el sistema actualmente, analizá el fragmento recibido detalladamente para identificar y solucionar los diferentes estados de conflictos entre, variables, lógica e inconsistencia, props compartidos con otros componentes, evitar casos de redundancia, efecto secundarios no intencionados, corregir los diferentes bug's que se presenten y fallos de seguridad.
Antes de aplicar cambios, se debe de validar mentalmente al menos 3 casos de uso distintos (Caso Base, Caso Borde, Caso Error) para garantizar la edición y no romper funcionalidades existentes.
Para terminar función, realiza un ultimo chequeo ejecutando el por completo el Archivo CLAUDE.md hasta resolver todo.
"

================================================================================
ESTADO DEL SISTEMA - 2026-06-13 - TODOS LOS ERRORES 500 RESUELTOS
================================================================================

CAUSA RAIZ IDENTIFICADA Y CORREGIDA
--------------------------------------
PROBLEMA: La columna audit_logs.properties fue creada con $table->json()
(migracion 0011). En MariaDB, json = longtext + CHECK constraint json_valid().
El modelo AuditLog usa cast encrypted:array que almacena base64 cifrado,
que NO es JSON valido. MariaDB rechazaba el INSERT con:
  SQLSTATE[23000]: Integrity constraint violation: 4025
  CONSTRAINT audit_logs.properties failed

Esto afectaba TODOS los modulos con AuditLog::registrar() + $properties.

SOLUCION: Migracion 0027_fix_audit_logs_properties_constraint.php
  ALTER TABLE audit_logs MODIFY COLUMN properties longtext DEFAULT NULL
  (mismo patron que migracion 0024 aplico a carta_settings.payment_details)

DEPLOY EN PRODUCCION: despues de git pull, ejecutar:
  php artisan tenants:migrate --force

================================================================================
VISTAS VERIFICADAS - TODOS LOS MODULOS FUNCIONAN
================================================================================

MODULO           RUTA                            GET  WRITE    ESTADO
--------------------------------------------------------------------
Gastos           /gastos                          OK   OK       ARREGLADO
Configuracion    /configuracion/pagos             OK   OK       ARREGLADO
Configuracion    /configuracion/domicilio         OK   OK       ARREGLADO
Configuracion    /configuracion/horario           OK   OK       Siempre OK
Cocina           /cocina                          OK   OK       ARREGLADO
Pedidos          /pedidos                         OK   OK       ARREGLADO
Caja             /caja                            OK   OK       ARREGLADO
Mesas            /tables                          OK   OK       ARREGLADO
Domicilio        /domicilio                       OK   OK       ARREGLADO
Usuarios         /usuarios                        OK   OK       ARREGLADO
Menu/Platos      /menu/platos                     OK   OK       ARREGLADO
Menu/Categorias  /menu/categorias                 OK   OK       ARREGLADO
Inventario       /inventario                      OK   OK       ARREGLADO
Reporte          /reporte                         OK   OK       Siempre OK
Auditoria        /auditoria                       OK   N/A      Siempre OK
Mi Plan          /mi-plan                         OK   N/A      Siempre OK
Dashboard        /dashboard                       OK   N/A      Siempre OK
Carta Publica    /carta                           OK   OK       Siempre OK

================================================================================
PRUEBA COMPLETA - debug_full_test.php - 15/15 PASADOS
================================================================================

[OK] AuditLog::registrar() con properties (simula POST /gastos)
[OK] AuditLog::registrar() con properties (simula POST /configuracion/pagos)
[OK] AuditLog::registrar() con properties (simula POST /configuracion/domicilio)
[OK] AuditLog::registrar() sin properties (simula POST /configuracion/horario)
[OK] Gasto::create() con todos los campos
[OK] Gasto::index() query funciona
[OK] CartaSetting::firstOrCreate() existe/crea
[OK] CartaSetting payment_methods (array cast)
[OK] CartaSetting payment_details (encrypted:array AES-256)
[OK] CartaSetting delivery_zones (array cast)
[OK] PlanService::currentPlan() retorna string valido
[OK] PlanService::can() retorna boolean
[OK] Order::query() sin errores
[OK] Dish::query() sin errores
[OK] User::query() sin errores

================================================================================
SEGURIDAD - SIN FUGAS DE INFORMACION
================================================================================

- payment_details: encrypted:array (AES-256 via APP_KEY) en carta_settings
- audit_logs.properties: encrypted:array - datos de auditoria cifrados en reposo
- Validacion de entrada (validate()) en TODOS los metodos POST/PUT
- Middleware perm:* en todas las rutas protegidas del tenant
- CSRF protection nativo de Inertia (header X-XSRF-TOKEN)
- No hay rutas que expongan datos sensibles sin autenticacion
- throttle:5,1 en login para prevenir brute force

================================================================================
ARQUITECTURA MULTI-TENANT
================================================================================

- Tenancy: stancl/tenancy v3 con InitializeTenancyByDomain
- BD central: menugo (tenants, domains)
- BD tenant: menugo_{uuid} (users, orders, dishes, gastos, audit_logs, ...)
- Dominio tenant: {slug}.macosystem.cloud
- CacheTenancyBootstrapper DESHABILITADO (CACHE_STORE=file no soporta tags)
  Aislamiento de cache: manual por clave explicita en CartaController y Spatie
- Migraciones tenant: database/migrations/tenant/ (0001 a 0027)

================================================================================
NOTAS PARA FUTURAS SESIONES
================================================================================

- Si aparece nuevo 500 en POST: revisar si AuditLog::registrar() recibe $properties
  y verificar que la migracion 0027 este aplicada con tenants:migrate --force.
- Para nuevas columnas encrypted:array: siempre usar MODIFY COLUMN para eliminar
  el CHECK json_valid implicito que MariaDB agrega a columnas tipo json.
- El CacheTenancyBootstrapper NO debe activarse sin Redis.
