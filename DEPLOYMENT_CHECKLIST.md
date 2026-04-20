# 🚀 Checklist de Despliegue (Go-Live) - Luna y Sol

Sigue estos pasos para pasar de desarrollo a producción de forma segura.

## 1. Configuración de Dominio y SSL
- **Dashboard de Vercel/CloudRun**: Ve a la sección de "Domains".
- **Añadir Dominio**: Registra `app.lunaysol.com`.
- **Configuración DNS**: Apunta los registros CNAME o A según provea tu plataforma.
- **SSL**: Asegúrate de que el certificado (Let's Encrypt) esté activo. El Modo Offline del PWA **REQUIERE HTTPS** para funcionar.

## 2. Variables de Entorno (Producción)
Separa tus datos de prueba de los finales.
- Configura en el panel de producción:
  - `VITE_SUPABASE_URL`: Tu URL del proyecto de producción.
  - `VITE_SUPABASE_ANON_KEY`: Tu llave anónima de producción.
  - `GEMINI_API_KEY`: (Si aplica para las sugerencias de carga).

## 3. Optimización PWA
- Verifica que el archivo `sw.js` esté siendo servido con el header `Service-Worker-Allowed`.
- Comprueba en el Panel de Auditoría (Lighthouse) que el Manifest es válido y la app se puede instalar en Android/iOS.

## 4. Limpieza de Datos (Día 0)
Antes de entregar al cliente, limpia la base de datos de pruebas.
- **ADVERTENCIA**: Esto borrará todas las ventas de prueba de la base de datos de Supabase.

```sql
-- SCRIPT DE LIMPIEZA TOTAL
TRUNCATE TABLE order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;
-- Nota: No borrar 'products' o 'customers' si ya cargaste el catálogo final.
```

## 5. Pruebas Finales (Smoke Test)
1. **Login**: Acceso correcto como Administrador y como Chofer.
2. **Venta Offline**: Activar modo avión, guardar venta, desactivar modo avión -> Confirmar sincronización.
3. **Reporte Error**: Enviar un reporte de prueba por WhatsApp.

---
**Puesta en Marcha Exitosa v1.0**
