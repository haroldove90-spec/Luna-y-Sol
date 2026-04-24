import React, { useState, useEffect } from 'react';
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
  Palette,
  Menu,
  X as CloseIcon,
  DollarSign,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Loader2,
  FileText,
  LogOut, 
  User as UserIcon,
  UserPlus,
  Tag,
  BarChart3,
  History
} from 'lucide-react';
import { LoadPrediction } from './components/LoadPrediction';
import { SalesHistory } from './components/SalesHistory';
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
import RouteSettlement from './components/RouteSettlement';
import NewSaleForm from './components/NewSaleForm';
import { useOfflineSync } from './lib/useOfflineSync';
import { 
  ProductAdmin, 
  VehicleAdmin, 
  CustomerAdmin, 
  DriverAdmin 
} from './components/AdminModules';
import { Onboarding } from './components/Onboarding';
import { ErrorReport } from './components/ErrorReport';
import { BrandingSettings } from './components/BrandingSettings';
import { InventoryManager } from './components/InventoryManager';
import { DriverFleetView } from './components/DriverFleetView';
import { Login } from './components/Login';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { supabase } from './lib/supabase';

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
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'driver'>('driver');
  const [actualRole, setActualRole] = useState<'admin' | 'driver' | null>(null);

  const [activeTab, setActiveTab] = useState<any>(() => {
    return localStorage.getItem('luna_y_sol_active_tab') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('luna_y_sol_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole('driver');
        setActualRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleRole = () => {
    if (actualRole === 'admin') {
      setUserRole(prev => prev === 'admin' ? 'driver' : 'admin');
      toast.info(`Cambiado a vista de ${userRole === 'admin' ? 'Chofer' : 'Administrador'}`);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching role for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        const role = data.role as string;
        console.log('Found role in profile:', role);
        
        if (role === 'inactive') {
          toast.error('ACCESO DENEGADO', {
            description: 'Esta cuenta está desactivada por administración.',
            duration: 10000
          });
          supabase.auth.signOut();
          return;
        }

        const validRole = (role === 'admin' ? 'admin' : 'driver') as 'admin' | 'driver';
        setUserRole(validRole);
        setActualRole(validRole);
      } else {
        console.warn('Profile role fetch failed or not found, checking fallback:', error);
        // Fallback email check
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email?.toLowerCase() || '';
        
        // Hardcoded admin fallbacks for security/recovery
        if (userEmail.includes('admin') || userEmail === 'haroldove90@gmail.com') {
          console.log('Admin identified by email fallback');
          setUserRole('admin');
          setActualRole('admin');
        } else {
          console.log('User identified as driver (default)');
          setUserRole('driver');
          setActualRole('driver');
        }
      }
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
    }
  };

  useEffect(() => {
    if (userRole === 'driver' && session?.user?.id) {
      const channel = supabase
        .channel('driver-global-notifications')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'vehicles'
          },
          (payload) => {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            // Check if THIS driver is newly assigned or changed
            if (newData && newData.assigned_driver_id === session.user.id) {
               if (oldData?.assigned_driver_id !== session.user.id) {
                 toast.success('Nueva Unidad Asignada', {
                   description: `Se te ha vinculado la unidad ${newData.license_plate} (${newData.model}).`,
                   duration: 8000
                 });
               }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userRole, session?.user?.id]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  const [brandConfig, setBrandConfig] = useState(() => {
    const saved = localStorage.getItem('branding_config');
    return saved ? JSON.parse(saved) : {
      primaryColor: '#4ADE80',
      sidebarBg: '#2D2D3A',
      sidebarText: '#FFFFFF',
      logoUrl: '',
      appName: 'Luna y Sol'
    };
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', brandConfig.primaryColor);
    document.documentElement.style.setProperty('--sidebar-bg', brandConfig.sidebarBg);
    document.documentElement.style.setProperty('--bg-main', '#F4F5F7');
  }, [brandConfig]);

  const handleNavClick = (tab: any) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-editorial-bg text-editorial-ink font-sans overflow-hidden md:border-8 border-white box-border">
      {!session && <Login />}
      <Onboarding />
      <ErrorReport />
      <Toaster position="top-right" expand={false} richColors />
      <PWAInstallPrompt />
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-editorial-ink/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col shrink-0 transition-transform duration-300 md:relative md:translate-x-0 overflow-hidden shadow-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ backgroundColor: brandConfig.sidebarBg, color: brandConfig.sidebarText }}>
        <div className="p-10 flex flex-col items-center space-y-6 relative">
          <div className="w-24 h-24 rounded-full flex items-center justify-center border-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {brandConfig.logoUrl ? (
              <img src={brandConfig.logoUrl} alt="Logo" className="w-20 h-20 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-black" style={{ backgroundColor: brandConfig.primaryColor }}>
                <Users size={40} />
              </div>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold uppercase tracking-widest">{brandConfig.appName}</h1>
            <p className="text-[10px] opacity-40 uppercase tracking-[0.2em] mt-1">SISTEMA INTEGRAL</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-white opacity-40 hover:opacity-100">
            <CloseIcon size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 mt-2" style={{ color: brandConfig.primaryColor }}>DASHBOARD {">>>"}</p>
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="TABLERO" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleNavClick('dashboard')} 
            primaryColor={brandConfig.primaryColor}
          />
          
          {userRole === 'driver' && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 px-4 py-2 mt-6">Ventas</p>
              <NavItem 
                icon={<ShoppingCart size={18} />} 
                label="NUEVA VENTA" 
                active={activeTab === 'sale'} 
                onClick={() => handleNavClick('sale')} 
                primaryColor={brandConfig.primaryColor}
              />
              <NavItem 
                icon={<History size={18} />} 
                label="HISTORIAL" 
                active={activeTab === 'history'} 
                onClick={() => handleNavClick('history')} 
                primaryColor={brandConfig.primaryColor}
              />
              <NavItem 
                icon={<Users size={18} />} 
                label="MIS CLIENTES" 
                active={activeTab === 'customers'} 
                onClick={() => handleNavClick('customers')} 
                primaryColor={brandConfig.primaryColor}
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 px-4 py-2 mt-6">Logística</p>
              <NavItem 
                icon={<TruckIcon size={18} />} 
                label="MI UNIDAD" 
                active={activeTab === 'my-fleet'} 
                onClick={() => handleNavClick('my-fleet')} 
                primaryColor={brandConfig.primaryColor}
              />
              <NavItem 
                icon={<ClipboardCheck size={18} />} 
                label="LIQUIDACIÓN" 
                active={activeTab === 'settlement'} 
                onClick={() => handleNavClick('settlement')} 
                primaryColor={brandConfig.primaryColor}
              />
            </>
          )}
          
          {userRole === 'admin' && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 px-4 py-2 mt-6">Inventario</p>
              <NavItem 
                icon={<Package size={18} />} 
                label="BODEGA" 
                active={activeTab === 'inventory'} 
                onClick={() => handleNavClick('inventory')} 
                primaryColor={brandConfig.primaryColor}
              />
              <NavItem 
                icon={<Box size={18} />} 
                label="PRODUCTOS" 
                active={activeTab === 'products'} 
                onClick={() => handleNavClick('products')} 
                primaryColor={brandConfig.primaryColor}
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 px-4 py-2 mt-6">Administración</p>
              <NavItem 
                icon={<Users size={18} />} 
                label="CLIENTES" 
                active={activeTab === 'customers'} 
                onClick={() => handleNavClick('customers')} 
                primaryColor={brandConfig.primaryColor}
              />
              <NavItem 
                icon={<Users size={18} />} 
                label="CHOFERES" 
                active={activeTab === 'drivers'} 
                onClick={() => handleNavClick('drivers')} 
                primaryColor={brandConfig.primaryColor}
              />
              <NavItem 
                icon={<TruckIcon size={18} />} 
                label="FLOTILLA" 
                active={activeTab === 'fleet'} 
                onClick={() => handleNavClick('fleet')} 
                primaryColor={brandConfig.primaryColor}
              />
              <NavItem 
                icon={<BarChart3 size={18} />} 
                label="VENTAS POR CHOFER" 
                active={activeTab === 'history'} 
                onClick={() => handleNavClick('history')} 
                primaryColor={brandConfig.primaryColor}
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 px-4 py-2 mt-6">Configuración</p>
              <NavItem 
                icon={<Palette size={18} />} 
                label="BRANDING" 
                active={activeTab === 'branding'} 
                onClick={() => handleNavClick('branding')} 
                primaryColor={brandConfig.primaryColor}
              />
            </>
          )}

          <div className="pt-8 mt-auto border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
            {actualRole === 'admin' && (
              <button 
                onClick={toggleRole}
                className="w-full flex items-center gap-4 px-6 py-3 text-[10px] font-bold tracking-[0.2em] hover:bg-white/5 transition-colors text-amber-400"
              >
                <RefreshCcw size={18} /> MODO {userRole === 'admin' ? 'DEMO CHOFER' : 'ADMIN'}
              </button>
            )}
            <NavItem 
              icon={<LogOut size={18} />} 
              label="CERRAR SESIÓN" 
              active={false} 
              onClick={() => supabase.auth.signOut()} 
              primaryColor={brandConfig.primaryColor}
            />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        {activeTab !== 'sale' && (
          <header className="min-h-[4rem] bg-stone-50/50 backdrop-blur-md border-b border-editorial-ink/5 flex items-center justify-between px-6 md:px-10 sticky top-0 z-10">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden p-2 -ml-2 text-editorial-ink opacity-40"
              >
                <Menu size={24} />
              </button>
              <div className="hidden md:flex flex-col">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">Operaciones en tiempo real</p>
                <h3 className="text-xl font-serif italic text-editorial-ink leading-tight">
                  {activeTab === 'dashboard' ? 'Dashboard Ejecutivo' : 
                   activeTab === 'fleet' ? 'Gestión de Unidades' : 
                   activeTab === 'inventory' ? 'Control de Stock' : 
                   activeTab === 'products' ? 'Catálogo Maestro' :
                   activeTab === 'customers' ? 'Directorio Clientes' :
                   activeTab === 'branding' ? 'Imagen Corporativa' :
                   activeTab === 'my-fleet' ? 'Estatus de Unidad' :
                   activeTab === 'history' ? (userRole === 'admin' ? 'Auditoría de Ventas' : 'Mis Ventas') :
                   'Liquidación de Ruta'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-6">
               {/* Sincronización */}
               {pendingCount > 0 && (
                 <div className="flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full">
                    <RefreshCcw size={12} className={cn("text-[var(--primary)]", isSyncing && "animate-spin")} />
                    <span className="text-[9px] font-bold font-mono">{pendingCount}</span>
                 </div>
               )}

               <div className="h-8 w-px bg-editorial-ink/10" />

               <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                     <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest opacity-40">{userRole === 'admin' ? 'SISTEMA CENTRAL' : 'UNIDAD EN RUTA'}</span>
                     <span className="text-[10px] font-bold text-black px-2 py-0.5 rounded shadow-sm" style={{ backgroundColor: brandConfig.primaryColor }}>{userRole === 'admin' ? 'ADMINISTRADOR' : 'CHOFER'}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-editorial-ink/10 flex items-center justify-center text-black" style={{ backgroundColor: 'white' }}>
                    <UserIcon size={20} />
                  </div>
               </div>
            </div>
          </header>
        )}

        <div className={cn("flex-grow", activeTab === 'sale' ? "p-0" : "p-10")}>
          {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} userRole={userRole} userId={session?.user?.id} />}
          {activeTab === 'sale' && (
            <NewSaleForm 
              driverId={session?.user?.id}
              isAdmin={actualRole === 'admin'}
              onCancel={() => setActiveTab('dashboard')} 
              onSuccess={() => setActiveTab('dashboard')} 
            />
          )}
          {activeTab === 'settlement' && <RouteSettlement />}
          {activeTab === 'my-fleet' && <DriverFleetView driverId={session?.user?.id} />}
          
          {(actualRole === 'admin' || userRole === 'admin') && (
            <>
              {activeTab === 'fleet' && <VehicleAdmin />}
              {activeTab === 'inventory' && <InventoryManager />}
              {activeTab === 'products' && <ProductAdmin />}
              {activeTab === 'customers' && <CustomerAdmin userRole={userRole} />}
              {activeTab === 'drivers' && <DriverAdmin />}
              {activeTab === 'branding' && <BrandingSettings config={brandConfig} onChange={setBrandConfig} />}
              {activeTab === 'history' && <SalesHistory userRole={userRole} userId={session?.user?.id} />}
            </>
          )}
          {userRole === 'driver' && activeTab === 'history' && <SalesHistory userRole="driver" userId={session?.user?.id} />}
          {userRole === 'driver' && activeTab === 'customers' && <CustomerAdmin userRole="driver" />}
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

function NavItem({ icon, label, active, onClick, primaryColor }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, primaryColor?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-6 py-3 transition-all duration-300 relative group",
        active 
          ? "opacity-100" 
          : "opacity-40 hover:opacity-100"
      )}
    >
      <div className="flex items-center gap-4">
        <div style={{ color: active ? primaryColor : 'inherit' }}>{icon}</div>
        <span className="text-[10px] font-bold tracking-[0.2em]">{label}</span>
      </div>
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full" style={{ backgroundColor: primaryColor }} />
      )}
      <ChevronRight size={14} className={cn("transition-transform", active ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:opacity-40")} />
    </button>
  );
}

function StatCard({ title, value, change, trend, icon }: { title: string, value: string, change: string, trend: 'up' | 'down', icon: React.ReactNode }) {
  return (
    <div className="bg-white p-8 border border-editorial-ink/5 relative overflow-hidden group hover:border-editorial-ink/20 transition-all rounded-2xl shadow-sm">
      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-black" style={{ backgroundColor: 'var(--primary)' }}>
          {icon}
        </div>
        <div className={cn(
          "text-[10px] font-mono font-bold tracking-tighter px-3 py-1 rounded-full",
          trend === 'up' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        )}>
          {trend === 'up' ? '▲' : '▼'} {change}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-2">{title}</p>
        <h3 className="text-4xl font-serif italic text-editorial-ink">{value}</h3>
      </div>
    </div>
  );
}

function DashboardView({ onNavigate, userRole, userId }: { onNavigate: (tab: any) => void, userRole: 'admin' | 'driver', userId?: string }) {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayCash: 0,
    totalOrders: 0,
    lowStockTrucks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userRole, userId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch orders for today
    let query = supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', today);

    if (userRole === 'driver' && userId) {
      query = query.eq('driver_id', userId);
    }

    const { data: orders, error: ordersError } = await query;

    // Fetch truck inventory for alerts (global for admin, specific for driver)
    let stockQuery = supabase
      .from('truck_inventory')
      .select('quantity, vehicle_id')
      .lt('quantity', 5);

    if (userRole === 'driver' && userId) {
      // Find the vehicle assigned to this driver first
      const { data: vInfo } = await supabase.from('vehicles').select('id').eq('assigned_driver_id', userId).maybeSingle();
      if (vInfo) {
        stockQuery = stockQuery.eq('vehicle_id', vInfo.id);
      } else {
        // No vehicle, no stock alerts
        stockQuery = stockQuery.eq('vehicle_id', 'none'); 
      }
    }

    const { data: stock, error: stockError } = await stockQuery;

    if (!ordersError && orders) {
      const sales = orders.reduce((acc, o) => acc + (o.total || 0), 0);
      
      // Calculate low stock trucks (unique vehicles with low stock items)
      const uniqueVehicles = new Set(stock?.map(s => s.vehicle_id));

      setStats({
        todaySales: sales,
        todayCash: sales * 0.85, // Assuming 85% is cash for this sector
        totalOrders: orders.length,
        lowStockTrucks: uniqueVehicles.size
      });
    }
    setLoading(false);
  };

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
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-stone-50 border border-editorial-ink/10 p-6 rounded-sm">
        <div className="flex-1">
          <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Herramientas de Control</h4>
          <p className="text-xl font-serif italic">Operaciones del Ciclo Actual</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button 
            onClick={() => onNavigate('sale')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg active:scale-95"
          >
            <ShoppingCart size={16} /> NUEVA VENTA
          </button>
          <button 
            onClick={exportToCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-white border border-editorial-ink text-[10px] font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors"
          >
            <FileSpreadsheet size={16} /> EXPORTAR CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <StatCard 
          title="Ventas de Hoy" 
          value={`$${stats.todaySales.toLocaleString()}`} 
          change="+0.0%" 
          trend="up" 
          icon={<ShoppingCart size={20} />} 
        />
        <StatCard 
          title="Efectivo a Recibir" 
          value={`$${stats.todayCash.toLocaleString()}`} 
          change="Auditando" 
          trend="up" 
          icon={<DollarSign size={20} />} 
        />
        <StatCard 
          title="Pedidos Totales" 
          value={stats.totalOrders.toString()} 
          change="+0" 
          trend="up" 
          icon={<ClipboardList size={20} />} 
        />
        <StatCard 
          title="Alerta de Stock" 
          value={`${stats.lowStockTrucks} Unidades`} 
          change="Crítico" 
          trend={stats.lowStockTrucks > 0 ? "down" : "up"} 
          icon={<AlertTriangle size={20} className={stats.lowStockTrucks > 0 ? "text-red-600" : "text-green-600"} />} 
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
                <Bar dataKey="ventas" radius={[4, 4, 0, 0]}>
                  {SALES_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === SALES_DATA.length - 1 ? 'var(--primary)' : '#D1D1D1'} />
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
          <button 
            onClick={() => onNavigate('inventory')}
            className="mt-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] border border-editorial-ink hover:bg-editorial-ink hover:text-white transition-all"
          >
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
                  <td className="p-6 text-right font-sans text-lg">{product.stock}</td>
                  <td className="p-6 text-right font-sans text-lg text-stone-400">75</td>
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
            <p className="font-sans text-2xl leading-snug">
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
