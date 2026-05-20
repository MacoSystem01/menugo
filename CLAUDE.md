Lee el archivo CLAUDE.md que está en la raíz del proyecto antes de hacer cualquier cosa.

Luego implementa la tarea activa "Tarifas de domicilio por rango de km" siguiendo exactamente este orden:

1. Crea `database/migrations/tenant/0015_add_delivery_zones_to_carta_settings.php`
2. Crea `database/migrations/tenant/0016_add_delivery_fee_to_orders.php`
3. Edita `app/Models/CartaSetting.php` — agrega a $fillable y $casts los campos delivery_zones, delivery_min_order, delivery_enabled
4. Edita `app/Models/Order.php` — agrega delivery_fee a $fillable
5. Edita `app/Http/Controllers/CartaController.php` — los 3 cambios: settingsArray(), saveSettings() y placeOrder()
6. Edita `resources/js/Pages/PublicMenu.tsx` — interfaz DeliveryZone, campo delivery_zone_idx en el form, selector de zona en checkout, línea de tarifa en resumen
7. Edita `resources/js/Pages/Menu/Carta.tsx` — sección "Servicio a domicilio" con toggle, monto mínimo y lista de zonas editables

Reglas de ejecución:
- Lee cada archivo existente completo ANTES de editarlo
- No toques ningún archivo que no esté en esa lista
- Después de cada archivo, escribe "✓ [nombre del archivo] listo — siguiente: [nombre del próximo]"
- Si encuentras algún conflicto o ambigüedad en la spec, descríbelo y propón la solución antes de continuar
- Al terminar todos los archivos, ejecuta: php artisan tenants:artisan "migrate --path=database/migrations/tenant"
- Luego ejecuta: npm run build
- Si el build falla, lee el error, corrígelo y vuelve a correr npm run build
- Al final reporta: archivos creados, archivos editados, resultado de la migración y resultado del build