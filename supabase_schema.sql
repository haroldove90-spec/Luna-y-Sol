-- RouteFlow SaaS - PostgreSQL Schema (Supabase Optimized)
-- This schema follows strict technical normalization and offline-first principles.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Audit Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Tables Definition

-- 3.1 Profiles Table (Managed by App and Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT,
    role TEXT DEFAULT 'driver',
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.2 Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.3 Vehicles Table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    assigned_driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.4 Truck Loads (Inventory Replenishment)
CREATE TABLE truck_loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES profiles(id),
    loaded_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE truck_load_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_load_id UUID NOT NULL REFERENCES truck_loads(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.5 Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tax_id TEXT UNIQUE, -- RFC/NIT/Social Security
    email TEXT,
    phone TEXT,
    address TEXT NOT NULL,
    coordinates_lat DOUBLE PRECISION,
    coordinates_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.6 Orders (Sales in Route)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES profiles(id),
    total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'delivered' CHECK (status IN ('delivered', 'pending', 'cancelled')),
    signature_url TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.7 Truck Inventory (Snapshot for Optimization)
-- While stock can be calculated, this table facilitates offline-first sync.
CREATE TABLE truck_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    last_sync_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(vehicle_id, product_id)
);

-- 3.8 Route Settlements
CREATE TABLE route_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID REFERENCES profiles(id),
    total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    cash_reported DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'settled',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Triggers and Functions
-- Create a profile whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email), 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_modtime BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. STOCK CALCULATION LOGIC EXPLANATION
/* 
Para conocer el stock actual de un producto 'P' en un camión 'V':
Stock Actual = (Total Cargado) - (Total Vendido)

Consulta SQL Sugerida:

SELECT 
    p.sku,
    p.name,
    v.license_plate,
    (
        COALESCE((SELECT SUM(tli.quantity) 
         FROM truck_load_items tli 
         JOIN truck_loads tl ON tl.id = tli.truck_load_id 
         WHERE tl.vehicle_id = v.id AND tli.product_id = p.id AND tl.status = 'completed'), 0)
        -
        COALESCE((SELECT SUM(oi.quantity) 
         FROM order_items oi 
         JOIN orders o ON o.id = oi.order_id 
         WHERE o.vehicle_id = v.id AND oi.product_id = p.id AND o.status = 'delivered'), 0)
    ) as current_stock
FROM products p
CROSS JOIN vehicles v
WHERE p.id = '[PRODUCT_ID]' AND v.id = '[VEHICLE_ID]';

Nota: En una implementación de alta escala, se recomienda usar una tabla de agregados (truck_inventory) 
actualizada por triggers para evitar escaneos costosos de historial en cada consulta de inventario móvil.
*/
