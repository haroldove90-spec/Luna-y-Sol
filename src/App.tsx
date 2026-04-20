import React, { useState } from 'react';
import { Toaster, toast } from 'sonner';
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
  Filter,
  ClipboardCheck,
  Wifi,
  WifiOff,
  RefreshCcw,
  Box,
  Truck as TruckIcon,
  Settings,
  Menu,
  X as CloseIcon,
  DollarSign,
  AlertTriangle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { LoadPrediction } from './components/LoadPrediction';
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

import RouteSettlement from './components/RouteSettlement';
import NewSaleForm from './components/NewSaleForm';
import { useOfflineSync } from './lib/useOfflineSync';
import { ProductAdmin, VehicleAdmin, CustomerAdmin } from './components/AdminModules';

import { Onboarding } from './components/Onboarding';
import { ErrorReport } from './components/ErrorReport';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fleet' | 'inventory' | 'sale' | 'settlement' | 'products' | 'customers'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  const handleNavClick = (tab: any) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-editorial-bg text-editorial-ink font-sans overflow-hidden md:border-8 border-white box-border">
      <Onboarding />
      <ErrorReport />
      <Toaster position="top-right" expand={false} richColors />
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-editorial-ink/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-editorial-bg border-r border-editorial-ink flex flex-col shrink-0 transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-10 border-b border-editorial-ink flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.3em] font-bold uppercase opacity-60">Sistema v1.0.4</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-serif italic font-medium">Luna y Sol</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2">
            <CloseIcon size={20} />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 px-4 mt-2">Operación</p>
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="TABLERO" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleNavClick('dashboard')} 
          />
          <NavItem 
            icon={<ShoppingCart size={18} />} 
            label="NUEVA VENTA" 
            active={activeTab === 'sale'} 
            onClick={() => handleNavClick('sale')} 
          />
          <NavItem 
            icon={<ClipboardCheck size={18} />} 
            label="LIQUIDACIÓN" 
            active={activeTab === 'settlement'} 
            onClick={() => handleNavClick('settlement')} 
          />

          <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 px-4 mt-6">Administración</p>
          <NavItem 
            icon={<Box size={18} />} 
            label="PRODUCTOS" 
            active={activeTab === 'products'} 
            onClick={() => handleNavClick('products')} 
          />
          <NavItem 
            icon={<Users size={18} />} 
            label="CLIENTES" 
            active={activeTab === 'customers'} 
            onClick={() => handleNavClick('customers')} 
          />
          <NavItem 
            icon={<TruckIcon size={18} />} 
            label="FLOTILLA" 
            active={activeTab === 'fleet'} 
            onClick={() => handleNavClick('fleet')} 
          />
          <NavItem 
            icon={<Package size={18} />} 
            label="BODEGA" 
            active={activeTab === 'inventory'} 
            onClick={() => handleNavClick('inventory')} 
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
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        {activeTab !== 'sale' && (
          <header className="min-h-[6rem] md:h-28 bg-editorial-bg border-b border-editorial-ink flex flex-col md:flex-row items-start md:items-end justify-between px-6 md:px-10 pb-6 pt-6 md:pt-0 sticky top-0 z-10 transition-all gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <Menu size={24} />
              </button>
              <div>
                <p className="text-[9px] md:text-[10px] tracking-[0.3em] font-bold uppercase opacity-60 mb-1">
                  {activeTab === 'dashboard' ? 'ANALÍTICA EN TIEMPO REAL' : 
                   activeTab === 'fleet' ? 'GESTIÓN LOGÍSTICA' : 
                   activeTab === 'inventory' ? 'CADENA DE SUMINISTRO' : 
                   activeTab === 'products' ? 'SISTEMA CENTRAL' :
                   activeTab === 'customers' ? 'ACTIVOS COMERCIALES' :
                   'CIERRE DE OPERACIONES'}
                </p>
                <h1 className="text-3xl md:text-5xl font-serif italic leading-none whitespace-nowrap">
                  {activeTab === 'dashboard' ? 'Dashboard Ejecutivo' : 
                   activeTab === 'fleet' ? 'Gestión de Unidades' : 
                   activeTab === 'inventory' ? 'Control de Stock' : 
                   activeTab === 'products' ? 'Catálogo Maestro' :
                   activeTab === 'customers' ? 'Directorio Clientes' :
                   'Liquidación de Ruta'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end">
              {/* Sync Indicator */}
              <div className="flex items-center gap-3 px-3 py-1.5 border border-editorial-ink/10 bg-white/50">
                {isOnline ? (
                  <Wifi size={14} className="text-green-600" />
                ) : (
                  <WifiOff size={14} className="text-stone-400" />
                )}
                <div className="h-4 w-px bg-editorial-ink/10" />
                {pendingCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <RefreshCcw size={14} className={cn("text-[#FF6321]", isSyncing && "animate-spin")} />
                    <span className="text-[10px] font-mono font-bold">{pendingCount} PENDIENTE{pendingCount !== 1 && 'S'}</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono opacity-40 uppercase">Sincronizado</span>
                )}
              </div>

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
        )}

        <div className={cn("flex-grow", activeTab === 'sale' ? "p-0" : "p-10")}>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'fleet' && <VehicleAdmin />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'products' && <ProductAdmin />}
          {activeTab === 'customers' && <CustomerAdmin />}
          {activeTab === 'sale' && (
            <NewSaleForm 
              onCancel={() => setActiveTab('dashboard')} 
              onSuccess={(data) => {
                console.log('Venta exitosa:', data);
                setActiveTab('dashboard');
              }} 
            />
          )}
          {activeTab === 'settlement' && <RouteSettlement />}
        </div>

        {activeTab !== 'sale' && (
          <footer className="mt-auto px-10 py-6 flex justify-between items-center text-[9px] uppercase tracking-[0.2em] font-bold border-t border-editorial-ink/10 opacity-40">
            <div>Especificación Técnica Confidencial</div>
            <div>Marco Logístico Propietario © 2024</div>
            <div>Solo Uso Interno</div>
          </footer>
        )}
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
  const exportToCSV = () => {
    const headers = ['Fecha', 'Ventas', 'Pedidos', 'Efectivo'];
    const data = [
      ['2024-04-20', '12450', '142', '8230'],
      ...SALES_DATA.map(d => [d.name, d.ventas, '20', (d.ventas * 0.7).toFixed(2)])
    ];
    
    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_luna_y_sol_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-12">
      <div className="flex justify-between items-center bg-stone-50 border border-editorial-ink/10 p-6 rounded-sm">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Herramientas de Control</h4>
          <p className="text-xl font-serif italic">Operaciones del Ciclo Actual</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-3 px-6 py-3 bg-white border border-editorial-ink text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors"
        >
          <FileSpreadsheet size={16} /> EXPORTAR REPORTE (.CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <StatCard 
          title="Ventas de Hoy" 
          value="$12,450" 
          change="+12.5%" 
          trend="up" 
          icon={<ShoppingCart size={20} />} 
        />
        <StatCard 
          title="Efectivo a Recibir" 
          value="$8,230" 
          change="Auditando" 
          trend="up" 
          icon={<DollarSign size={20} />} 
        />
        <StatCard 
          title="Pedidos Totales" 
          value="142" 
          change="+4.3%" 
          trend="up" 
          icon={<ClipboardList size={20} />} 
        />
        <StatCard 
          title="Alerta de Stock" 
          value="3 Camiones" 
          change="Crítico" 
          trend="down" 
          icon={<AlertTriangle size={20} className="text-red-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 overflow-hidden">
          <div className="mb-6 flex justify-between items-end border-b border-editorial-ink/10 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em]">Producto Más Vendido</h3>
            <p className="text-[10px] font-mono opacity-40">TENDENCIA_DIARIA</p>
          </div>
          <div className="h-[300px] md:h-[400px] w-full bg-white p-4 md:p-8 border border-editorial-ink/5 overflow-hidden">
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
                    <Cell key={`cell-${index}`} fill={index === SALES_DATA.length - 1 ? '#1A1A1A' : '#D1D1D1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <div className="mb-6 border-l-2 border-editorial-ink pl-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-4">Stock Crítico en Flota</h3>
            <p className="font-serif text-lg leading-tight italic opacity-70">
              Unidades que requieren reabastecimiento inmediato para cumplir ruta.
            </p>
          </div>
          <div className="space-y-4 flex-grow">
            {[
              { id: 'v1', plate: 'LYS-102', stock: '12%', status: 'crítico' },
              { id: 'v2', plate: 'LYS-205', stock: '18%', status: 'bajo' },
              { id: 'v3', plate: 'LYS-301', stock: '22%', status: 'bajo' },
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between group border-b border-editorial-ink/5 pb-3">
                <div className="flex items-center gap-4">
                  <TruckIcon size={16} className={cn(item.status === 'crítico' ? "text-red-500" : "text-amber-500")} />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider">{item.plate}</p>
                    <p className="text-[9px] font-mono opacity-40 uppercase">{item.status}</p>
                  </div>
                </div>
                <p className="text-sm font-mono font-bold">{item.stock}</p>
              </div>
            ))}
          </div>
          <button className="mt-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] border border-editorial-ink hover:bg-editorial-ink hover:text-white transition-all">
            VER REPORTE DE BODEGA
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
    <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
      <section className="space-y-6">
        <div className="border-l-4 border-editorial-ink pl-6 mb-8">
          <h3 className="text-2xl font-serif italic">Predicción Inteligente</h3>
          <p className="text-xs opacity-60">Análisis de carga automática basado en demanda regional.</p>
        </div>
        <LoadPrediction />
      </section>

      <section className="border border-editorial-ink">
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
      </section>

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
