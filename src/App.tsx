import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Package, 
  Users, 
  ShoppingCart, 
  ClipboardList, 
  TrendingUp,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  MoreVertical,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types based on the SQL schema
interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

interface Vehicle {
  id: string;
  licensePlate: string;
  model: string;
  driver: string;
  status: 'active' | 'maintenance' | 'retired';
  inventory: { productId: string; quantity: number }[];
}

// Mock Data
const MOCK_PRODUCTS: Product[] = [
  { id: '1', sku: 'PRD-001', name: 'Agua Mineral 500ml', price: 1.5, stock: 1200 },
  { id: '2', sku: 'PRD-002', name: 'Refresco Cola 1.5L', price: 2.8, stock: 850 },
  { id: '3', sku: 'PRD-003', name: 'Jugo de Naranja 1L', price: 3.2, stock: 450 },
  { id: '4', sku: 'PRD-004', name: 'Botana Mixta 200g', price: 2.1, stock: 600 },
];

const MOCK_VEHICLES: Vehicle[] = [
  { 
    id: 'v1', 
    licensePlate: 'ABC-1234', 
    model: 'Foton Aumark', 
    driver: 'Juan Pérez', 
    status: 'active',
    inventory: [
      { productId: '1', quantity: 45 },
      { productId: '2', quantity: 20 },
      { productId: '4', quantity: 15 },
    ]
  },
  { 
    id: 'v2', 
    licensePlate: 'XYZ-9876', 
    model: 'Isuzu ELF', 
    driver: 'María García', 
    status: 'active',
    inventory: [
      { productId: '1', quantity: 30 },
      { productId: '3', quantity: 25 },
    ]
  },
];

const SALES_DATA = [
  { name: 'Lun', ventas: 4000 },
  { name: 'Mar', ventas: 3000 },
  { name: 'Mie', ventas: 2000 },
  { name: 'Jue', ventas: 2780 },
  { name: 'Vie', ventas: 1890 },
  { name: 'Sab', ventas: 2390 },
  { name: 'Dom', ventas: 3490 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fleet' | 'inventory'>('dashboard');

  return (
    <div className="flex h-screen bg-editorial-bg text-editorial-ink font-sans overflow-hidden border-8 border-white box-border">
      {/* Sidebar */}
      <aside className="w-64 bg-editorial-bg border-r border-editorial-ink flex flex-col">
        <div className="p-10 border-b border-editorial-ink">
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.3em] font-bold uppercase opacity-60">Sistema v1.0.4</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-serif italic font-medium">Luna y Sol</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-4">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="TABLERO" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Truck size={18} />} 
            label="FLOTA" 
            active={activeTab === 'fleet'} 
            onClick={() => setActiveTab('fleet')} 
          />
          <NavItem 
            icon={<Package size={18} />} 
            label="INVENTARIO" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
          />
        </nav>

        <div className="p-8 border-t border-editorial-ink">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-editorial-ink rounded-full flex items-center justify-center text-white font-serif italic text-xl">
              A
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase leading-none tracking-wider">Sr. Arquitecto</p>
              <p className="text-[9px] opacity-60 mt-1 uppercase">Líder Logístico</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="h-24 bg-editorial-bg border-b border-editorial-ink flex items-end justify-between px-10 pb-6 sticky top-0 z-10">
          <div>
            <p className="text-[10px] tracking-[0.3em] font-bold uppercase opacity-60 mb-1">
              {activeTab === 'dashboard' ? 'ANALÍTICA EN TIEMPO REAL' : 
               activeTab === 'fleet' ? 'GESTIÓN LOGÍSTICA' : 'CADENA DE SUMINISTRO'}
            </p>
            <h1 className="text-5xl font-serif italic leading-none">
              {activeTab === 'dashboard' ? 'Resumen Ejecutivo' : 
               activeTab === 'fleet' ? 'Gestión de Unidades' : 'Control de Stock'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-editorial-ink opacity-40" size={16} />
              <input 
                type="text" 
                placeholder="BUSCAR ARCHIVO..." 
                className="pl-6 py-1 bg-transparent border-b border-editorial-ink/20 text-xs font-mono uppercase tracking-widest focus:border-editorial-ink outline-none w-48 transition-all"
              />
            </div>
            <p className="text-xs font-mono font-bold">2024//LOG</p>
          </div>
        </header>

        <div className="p-10 flex-grow">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'fleet' && <FleetView />}
          {activeTab === 'inventory' && <InventoryView />}
        </div>

        <footer className="mt-auto px-10 py-6 flex justify-between items-center text-[9px] uppercase tracking-[0.2em] font-bold border-t border-editorial-ink/10 opacity-40">
          <div>Especificación Técnica Confidencial</div>
          <div>Marco Logístico Propietario © 2024</div>
          <div>Solo Uso Interno</div>
        </footer>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-2 border transition-all duration-300",
        active 
          ? "bg-editorial-ink text-white border-editorial-ink" 
          : "text-editorial-ink border-transparent hover:border-editorial-ink/40"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[10px] font-bold tracking-[0.2em]">{label}</span>
      </div>
      {active && <ChevronRight size={14} />}
    </button>
  );
}

function StatCard({ title, value, change, trend, icon }: { title: string, value: string, change: string, trend: 'up' | 'down', icon: React.ReactNode }) {
  return (
    <div className="bg-white p-8 border border-editorial-ink/10 relative overflow-hidden group hover:border-editorial-ink transition-colors">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-400 via-stone-500 to-stone-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex justify-between items-start mb-6">
        <div className="text-editorial-ink opacity-40">
          {icon}
        </div>
        <div className={cn(
          "text-[10px] font-mono font-bold tracking-tighter",
          trend === 'up' ? "text-stone-600" : "text-stone-400"
        )}>
          {trend === 'up' ? '▲' : '▼'} {change}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-2">{title}</p>
        <h3 className="text-4xl font-serif italic translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{value}</h3>
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Ventas Diarias" 
          value="$12,450" 
          change="+12.5%" 
          trend="up" 
          icon={<ShoppingCart size={20} />} 
        />
        <StatCard 
          title="Pedidos" 
          value="142" 
          change="+4.3%" 
          trend="up" 
          icon={<ClipboardList size={20} />} 
        />
        <StatCard 
          title="En Camiones" 
          value="4,580" 
          change="-2.1%" 
          trend="down" 
          icon={<Package size={20} />} 
        />
        <StatCard 
          title="Eficiencia" 
          value="94.2%" 
          change="+1.2%" 
          trend="up" 
          icon={<TrendingUp size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <div className="mb-6 flex justify-between items-end border-b border-editorial-ink/10 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em]">Métrica de Desempeño</h3>
            <p className="text-[10px] font-mono opacity-40">AGREGADO_DELTA_SEMANAL</p>
          </div>
          <div className="h-[350px] w-full bg-white p-8 border border-editorial-ink/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SALES_DATA}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#1A1A1A', fontSize: 10, fontWeight: 700 }} />
                <YAxis hide />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1A1A1A', color: '#fff', border: 'none', fontFamily: 'monospace', fontSize: '10px' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="ventas" radius={0}>
                  {SALES_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1A1A1A' : '#D1D1D1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <div className="mb-6 border-l-2 border-editorial-ink pl-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-4">Inventario Base</h3>
            <p className="font-serif text-lg leading-tight italic opacity-70">
              Entidades de mayor rendimiento clasificadas por dispersión regional.
            </p>
          </div>
          <div className="space-y-4 flex-grow">
            {MOCK_PRODUCTS.map(product => (
              <div key={product.id} className="flex items-center justify-between group cursor-pointer border-b border-editorial-ink/5 pb-3">
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-mono opacity-20 group-hover:opacity-100 transition-opacity">0{product.id}</div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider">{product.name}</p>
                    <p className="text-[9px] font-mono opacity-40 group-hover:text-stone-500 transition-colors">{product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-serif italic">${product.price}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] border border-editorial-ink hover:bg-editorial-ink hover:text-white transition-all">
            Audit Archive
          </button>
        </div>
      </div>
    </div>
  );
}

function FleetView() {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end border-b border-editorial-ink pb-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.4em] opacity-40">Distribución de Unidades</h3>
          <p className="text-5xl font-serif italic mt-2">Flota de Transporte Activa</p>
        </div>
        <button className="flex items-center gap-3 px-6 py-3 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
          <Plus size={16} /> Desplegar Unidad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {MOCK_VEHICLES.map(vehicle => (
          <div key={vehicle.id} className="flex flex-col">
            <div className="bg-editorial-ink text-[#D1D1D1] p-8 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl">
               <div className="absolute top-0 left-0 w-full h-1 bg-stone-500"></div>
               <div className="flex justify-between items-start mb-6">
                 <div>
                    <p className="text-white text-lg font-bold mb-1 tracking-tighter">{vehicle.licensePlate}</p>
                    <p className="opacity-60 uppercase text-[9px] tracking-widest">{vehicle.model}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">OK</span>
                 </div>
               </div>
               
               <div className="space-y-3 pt-6 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="opacity-40">OPERADOR:</span>
                    <span className="text-white">{vehicle.driver.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-40">CAPACIDAD:</span>
                    <span className="text-white">85% LO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-40">ESTADO:</span>
                    <span className="text-white underline decoration-stone-600">EN RUTA</span>
                  </div>
               </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60">
               <button className="hover:text-black transition-colors">Espec. Técnica</button>
               <button className="hover:text-black transition-colors">Log de Sinc</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryView() {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="border border-editorial-ink">
        <div className="bg-editorial-ink text-white p-6 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-[0.4em]">Control de Stock Maestro</h3>
          <p className="text-[10px] font-mono opacity-50">REF_ID: 99x_INVENTARIO</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-editorial-ink bg-stone-100">
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest">ID//SKU</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest">Designación</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-right">Almacén</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-right">Carga Móvil</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {MOCK_PRODUCTS.map(product => (
                <tr key={product.id} className="border-b border-editorial-ink/10 hover:bg-stone-50 transition-colors group">
                  <td className="p-6 font-mono text-[9px] opacity-40">{product.sku}</td>
                  <td className="p-6 font-bold uppercase tracking-wider">{product.name}</td>
                  <td className="p-6 text-right font-serif italic text-lg">{product.stock}</td>
                  <td className="p-6 text-right font-serif italic text-lg text-stone-400">75</td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      <div className="border border-editorial-ink px-3 py-1 text-[9px] font-bold uppercase tracking-widest">Óptimo</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="border-l-2 border-editorial-ink pl-10 space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-[0.4em]">Auditoría de Integridad</h4>
            <p className="font-serif text-2xl leading-snug italic">
              "El inventario es dinámico. Calculamos el balance móvil como la suma de las cargas despachadas menos las ventas confirmadas."
            </p>
            <div className="bg-white border border-editorial-ink/10 p-6 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Lógica de Cálculo</p>
              <div className="font-mono text-xs bg-editorial-bg p-4 rounded-sm border-l-4 border-editorial-ink">
                SELECT (cant_carga - cant_vendida) AS stock_actual<br/>
                FROM inventario_camion WHERE vehiculo_id = :v_id;
              </div>
            </div>
        </div>
        <div className="bg-editorial-ink text-[#D1D1D1] p-10 font-mono text-[11px] leading-relaxed relative">
           <p className="text-blue-400 mb-4 font-bold uppercase tracking-widest">-- Nota de Arquitectura</p>
           <p className="mb-4 text-white/80">
             Para asegurar la consistencia offline-first, los ajustes se verifican mediante logs de delta sincronizados periódicamente.
           </p>
           <p className="opacity-40 italic">
             // Incluye lógica de disparadores automáticos actualizados vía Canales en Tiempo Real.
           </p>
        </div>
      </div>
    </div>
  );
}
