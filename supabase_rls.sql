-- CONFIGURACIÓN DE SEGURIDAD ROBUSTA (RLS) - SISTEMA LUNA Y SOL
-- Ejecutar en el Editor SQL de Supabase

-- 1. Habilitar RLS en tablas críticas
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA 'ORDERS' (Ventas)
-- Los choferes pueden crear ventas pero no editarlas ni borrarlas
CREATE POLICY "Choferes pueden insertar sus propias ventas" 
ON orders FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Choferes pueden ver sus propias ventas" 
ON orders FOR SELECT 
TO authenticated 
USING (auth.uid() = driver_id);

-- El administrador tiene control total
CREATE POLICY "Admin tiene control total sobre orders" 
ON orders FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');


-- 3. POLÍTICAS PARA 'TRUCK_INVENTORY' (Inventario de Camión)
-- Los choferes solo ven el inventario de su camión asignado
-- Necesitamos unir con vehicles para verificar la asignación
CREATE POLICY "Choferes ven solo su inventario asignado" 
ON truck_inventory FOR SELECT 
TO authenticated 
USING (
  vehicle_id IN (
    SELECT id FROM vehicles WHERE assigned_driver_id = auth.uid()
  )
);

CREATE POLICY "Admin gestiona todo el inventario" 
ON truck_inventory FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');


-- 4. POLÍTICAS PARA 'PRODUCTS' Y 'CUSTOMERS' (Maestros)
-- Los choferes solo lectura
CREATE POLICY "Lectura pública para autenticados" 
ON products FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Lectura clientes para autenticados" 
ON customers FOR SELECT 
TO authenticated 
USING (true);

-- Admin CRUD total
CREATE POLICY "Admin CRUD total productos" 
ON products FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin CRUD total clientes" 
ON customers FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');


-- 5. FUNCIÓN DE ALERTA DE STOCK BAJO (Edge Function Logic)
-- Esta lógica se ejecutaría en un trigger o Edge Function
/*
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  stock_pct FLOAT;
  truck_plate TEXT;
BEGIN
  stock_pct := (NEW.quantity::FLOAT / NEW.max_capacity::FLOAT) * 100;
  
  IF stock_pct < 10 THEN
    SELECT license_plate INTO truck_plate FROM vehicles WHERE id = NEW.vehicle_id;
    -- Aquí se dispararía la notificación Push vía API externa
    PERFORM net.http_post(
      'https://api.push-service.com/send',
      json_build_object(
        'title', '⚠️ Alerta de Stock',
        'body', 'El camión ' || truck_plate || ' tiene stock crítico del producto ' || NEW.product_name
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/
