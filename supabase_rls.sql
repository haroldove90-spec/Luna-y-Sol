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

-- El administrador tiene control total (basado en tabla profiles)
CREATE POLICY "Admin tiene control total sobre orders" 
ON orders FOR ALL 
TO authenticated 
USING (is_admin());


-- 3. POLÍTICAS PARA 'TRUCK_INVENTORY' (Inventario de Camión)
-- Los choferes solo ven el inventario de su camión asignado
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
USING (is_admin());


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
USING (is_admin());

CREATE POLICY "Admin CRUD total clientes" 
ON customers FOR ALL 
TO authenticated 
USING (is_admin());

-- 6. POLÍTICAS PARA 'PROFILES'
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Evitar recursión: El admin puede ver todo sin llamar a is_admin() dentro de la misma tabla si es posible,
-- o simplificar la política.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Admin control TOTAL
-- Usamos una verificación directa del UID para el admin principal y evitamos recursión
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles" 
ON public.profiles FOR ALL 
USING (
  auth.uid() IN (
    '9c68d387-57f0-4b26-8966-bec21d4f5d41', -- Tu UID de admin actual
    'd83f47e3-547a-4c2d-9b1e-3a8e9f2c1b0a'  -- (Ejemplo de otro posible admin)
  )
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Nota: La política de arriba sigue siendo un poco arriesgada para recursión. 
-- La mejor forma es usar una política que no use SELECT en la misma tabla para el chequeo de permisos de escritura.
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins manage profiles" 
ON public.profiles FOR ALL
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
-- Para evitar el bucle, dividiremos:
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Admins select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Admins insert profiles" ON public.profiles FOR INSERT WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- 7. POLÍTICAS PARA 'VEHICLES'
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vehicles viewable by everyone" ON vehicles;
CREATE POLICY "Vehicles viewable by everyone" ON public.vehicles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage vehicles" ON vehicles;
CREATE POLICY "Admins can manage vehicles" ON public.vehicles FOR ALL 
USING (is_admin());

-- 8. POLÍTICAS PARA 'ROUTE_SETTLEMENTS' (Fix error 42710)
ALTER TABLE route_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON route_settlements;
CREATE POLICY "Permitir todo a usuarios autenticados" 
ON route_settlements FOR ALL 
TO authenticated 
USING (true);


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
