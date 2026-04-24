import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Save, 
  Lock,
  DollarSign,
  PackageCheck,
  History,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
  Truck
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function RouteSettlement() {
  const [operationalInventory, setOperationalInventory] = useState<any[]>([]);
  const [physicalStocks, setPhysicalStocks] = useState<Record<string, number>>({});
  const [isSettling, setIsSettling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentVehicleId, setCurrentVehicleId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'driver'>('driver');
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      setUserRole(profile.role as 'admin' | 'driver');
      
      if (profile.role === 'admin') {
        const { data: vList } = await supabase.from('vehicles').select('*');
        setAvailableVehicles(vList || []);
      }
    }

    // Try to find vehicle where this user is the driver
    // Trying common field names: driver_id, assigned_driver_id
    const { data: v1 } = await supabase
      .from('vehicles')
      .select('id')
      .eq('driver_id', user.id)
      .maybeSingle();
    
    if (v1) {
      setCurrentVehicleId(v1.id);
    } else {
      const { data: v2 } = await supabase
        .from('vehicles')
        .select('id')
        .eq('assigned_driver_id', user.id)
        .maybeSingle();
      if (v2) setCurrentVehicleId(v2.id);
    }
    
    setLoading(false);
  };

  const checkTodaySettlement = async (vehicleId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('route_settlements')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .gte('created_at', today)
      .limit(1);
    
    if (data && data.length > 0) {
      setSettled(true);
    } else {
      setSettled(false);
    }
  };

  useEffect(() => {
    if (currentVehicleId) {
      fetchOperationalData();
      fetchCloudOrders();
      checkTodaySettlement(currentVehicleId);
    }
  }, [currentVehicleId]);

  const fetchOperationalData = async () => {
    if (!currentVehicleId) return;
    setLoading(true);
    const { data: inv, error: invError } = await supabase
      .from('truck_inventory')
      .select('*, products(name, sku, unit)')
      .eq('vehicle_id', currentVehicleId);

    if (invError) {
      toast.error('Error al cargar inventario operacional');
    } else {
      setOperationalInventory(inv.map(item => ({
        id: item.product_id,
        sku: item.products.sku,
        name: item.products.name,
        initialStock: 0,
        loads: item.quantity
      })));
    }
    setLoading(false);
  };

  const [cloudOrders, setCloudOrders] = useState<any[]>([]);

  const fetchCloudOrders = async () => {
    if (!currentVehicleId) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), customers(name, credit_limit)')
      .eq('vehicle_id', currentVehicleId)
      .gte('created_at', today);

    if (!error && data) {
      setCloudOrders(data);
    }
  };

  // Merge IndexedDB orders with Cloud orders for reconciliation
  const pendingOrders = useLiveQuery(() => db.orders.where('status').equals('pending').toArray()) || [];

  const allOrders = useMemo(() => {
    const local = pendingOrders.map(o => ({
      ...o,
      total: o.total, // Ensure consistency
      order_items: o.items.map(i => ({ product_id: i.id, quantity: i.quantity }))
    }));
    return [...cloudOrders, ...local]; 
  }, [cloudOrders, pendingOrders]);
  
  const salesByProduct = useMemo(() => {
    const counts: Record<string, number> = {};
    allOrders.forEach(order => {
      if (order.order_items) {
          order.order_items.forEach((item: any) => {
            counts[item.product_id] = (counts[item.product_id] || 0) + item.quantity;
          });
      }
    });
    return counts;
  }, [allOrders]);

  const totalSalesAmount = useMemo(() => {
    return allOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  }, [allOrders]);

  const cashSales = useMemo(() => {
    return totalSalesAmount;
  }, [totalSalesAmount]);

  const reconciliationData = useMemo(() => {
    return operationalInventory.map(item => {
      const sales = salesByProduct[item.id] || 0;
      const theoretical = item.initialStock + item.loads - sales;
      const physical = physicalStocks[item.id] ?? theoretical;

      return {
        ...item,
        sales,
        theoreticalStock: theoretical,
        physicalStock: physical,
        difference: physical - theoretical,
      };
    });
  }, [salesByProduct, physicalStocks, operationalInventory]);

  const handlePhysicalStockChange = (id: string, value: string) => {
    const val = parseInt(value) || 0;
    setPhysicalStocks(prev => ({ ...prev, [id]: val }));
  };

  const handleFinalizeDay = async () => {
    setIsSettling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Try different column names for driver/user
      let insertError: any = null;
      
      const attemptInsert = async (colName: string) => {
        const { error } = await supabase
          .from('route_settlements')
          .insert([{
            vehicle_id: currentVehicleId,
            [colName]: user.id,
            total_sales: totalSalesAmount,
            cash_reported: totalSalesAmount,
            status: 'settled'
          }]);
        return error;
      };

      // Try driver_id first
      insertError = await attemptInsert('driver_id');
      
      if (insertError) {
        // Try user_id second
        const error2 = await attemptInsert('user_id');
        if (error2) {
          // Try assigned_driver_id third (just in case)
          const error3 = await attemptInsert('assigned_driver_id');
          if (error3) {
            throw insertError; // Report the initial error if all fail
          }
        }
      }

      toast.success('Día de ruta cerrado legalmente');
      setSettled(true);
    } catch (error) {
      toast.error('Falla en liquidación: ' + (error as Error).message);
    } finally {
      setIsSettling(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse uppercase font-bold tracking-widest opacity-40">Consultando Base de Datos Central...</div>;

  if (!currentVehicleId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-24 h-24 mb-8 text-black opacity-10">
          <Truck size={96} />
        </div>
        
        {userRole === 'admin' ? (
          <div className="max-w-xl w-full">
            <h3 className="text-3xl font-serif italic mb-8">Seleccionar Unidad para Liquidación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableVehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => setCurrentVehicleId(v.id)}
                  className="p-6 border border-editorial-ink/10 bg-white hover:border-editorial-ink transition-all flex flex-col items-center gap-2 group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 uppercase">Placas</span>
                  <span className="text-xl font-bold font-mono tracking-tighter uppercase">{v.license_plate}</span>
                  <span className="text-[9px] italic opacity-60 uppercase">{v.model}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-serif italic mb-4">Sin Unidad Asignada</h3>
            <p className="max-w-md text-stone-500 leading-relaxed mb-8">
              Tu cuenta no tiene una unidad de transporte asignada actualmente. 
              Contacta al administrador para asignar un camión antes de proceder con la liquidación de ruta.
            </p>
            <div className="p-6 border border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-[0.2em]">
              Estatus: Requiere Configuración de Flotilla
            </div>
          </>
        )}
      </div>
    );
  }

  if (settled) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 bg-white border-2 border-editorial-ink animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border-2 border-green-200">
          <CheckCircle2 className="text-green-600" size={48} />
        </div>
        <h2 className="text-4xl font-serif italic text-center mb-4">Día Finalizado Exitosamente</h2>
        <p className="text-sm font-mono opacity-60 text-center max-w-md uppercase tracking-widest leading-relaxed">
          La ruta ha sido liquidada y bloqueada para nuevas ventas hasta el próximo surtido.
        </p>
        <div className="mt-10 p-6 border border-editorial-ink/10 bg-editorial-bg w-full max-w-sm">
           <div className="flex justify-between text-xs font-bold mb-2">
             <span>FOLIO:</span>
             <span className="font-mono">LIQ-{new Date().toISOString().split('T')[0]}</span>
           </div>
           <div className="flex justify-between text-xs font-bold">
             <span>TOTAL LIQUIDADO:</span>
             <span className="font-mono font-serif italic text-lg">${totalSalesAmount.toFixed(2)}</span>
           </div>
        </div>
        <button onClick={() => setSettled(false)} className="mt-12 text-[10px] font-bold uppercase tracking-[0.4em] underline hover:text-stone-500">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 p-4 sm:p-0">
      {userRole === 'admin' && (
        <div className="flex justify-start">
          <button 
            onClick={() => setCurrentVehicleId(null)}
            className="px-6 py-3 border border-editorial-ink text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-ink hover:text-white transition-all flex items-center gap-2"
          >
            <ChevronLeft size={16} /> VOLVER A SELECCIÓN DE UNIDAD
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-editorial-ink text-white p-8 border border-editorial-ink">
          <DollarSign className="text-[#FF6321] mb-6" size={24} />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Ventas Totales (Día)</p>
          <h3 className="text-4xl font-serif italic">${totalSalesAmount.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-8 border border-editorial-ink">
          <Calculator className="opacity-40 mb-6" size={24} />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Efectivo Esperado</p>
          <h3 className="text-4xl font-serif italic">${totalSalesAmount.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-8 border border-editorial-ink">
          <History className="opacity-40 mb-6" size={24} />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Pedidos Realizados</p>
          <h3 className="text-4xl font-serif italic">{allOrders.length}</h3>
        </div>
        <div className={cn("p-8 border", reconciliationData.some(d => d.difference !== 0) ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50")}>
          <AlertTriangle className={reconciliationData.some(d => d.difference !== 0) ? "text-red-500" : "text-green-500"} size={24} />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Diferencia Inventario</p>
          <h3 className={cn("text-4xl font-serif italic", reconciliationData.some(d => d.difference !== 0) ? "text-red-600" : "text-green-600")}>
            {reconciliationData.reduce((acc, curr) => acc + Math.abs(curr.difference), 0)} u.
          </h3>
        </div>
      </div>

      <div className="bg-white border border-editorial-ink overflow-hidden">
        <div className="bg-editorial-ink text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <PackageCheck size={20} className="text-[#FF6321]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.4em]">Conciliación de Mercancía</h3>
          </div>
          <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">UNIDAD: {currentVehicleId || 'S/A'}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-editorial-ink bg-stone-100 uppercase text-[9px] font-bold tracking-widest">
                <th className="p-6">Designación // SKU</th>
                <th className="p-6 text-center">Inicial + Cargas</th>
                <th className="p-6 text-center">Ventas</th>
                <th className="p-6 text-center border-l border-editorial-ink/10 bg-editorial-bg/30">Teórico</th>
                <th className="p-6 text-center bg-stone-200">Físico</th>
                <th className="p-6 text-center">Diferencia</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {reconciliationData.map((item) => (
                <tr key={item.id} className="border-b border-editorial-ink/10">
                  <td className="p-6 border-r border-editorial-ink/5">
                    <p className="font-bold uppercase">{item.name}</p>
                    <p className="text-[9px] font-mono opacity-40">{item.sku}</p>
                  </td>
                  <td className="p-6 text-center font-mono opacity-60">{item.initialStock} + {item.loads}</td>
                  <td className="p-6 text-center font-bold text-stone-400">{item.sales}</td>
                  <td className="p-6 text-center font-serif italic text-xl bg-editorial-bg/10">{item.theoreticalStock}</td>
                  <td className="p-6 bg-stone-50/50">
                    <div className="flex justify-center">
                      <input 
                        type="number"
                        value={physicalStocks[item.id] ?? item.theoreticalStock}
                        onChange={(e) => handlePhysicalStockChange(item.id, e.target.value)}
                        className="w-20 text-center p-2 border-2 border-editorial-ink/10 focus:border-editorial-ink bg-white font-mono outline-none"
                      />
                    </div>
                  </td>
                  <td className={cn("p-6 text-center font-bold", item.difference !== 0 ? "text-red-500" : "text-green-500 opacity-40")}>
                    {item.difference === 0 ? '--' : item.difference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 p-8 bg-editorial-ink text-zinc-400 font-mono text-[11px] leading-relaxed relative border-l-8 border-[#FF6321]">
          <p className="text-white font-bold mb-4 uppercase tracking-[0.2em] flex items-center gap-2"><Lock size={14} className="text-[#FF6321]" /> Protocolo de Cierre</p>
          <p>Al finalizar el día, se bloqueará el acceso al terminal para este vehículo. Generará una liquidación irreversible para auditoría contable.</p>
        </div>
        <div className="w-full md:w-auto h-full space-y-4">
          <button 
            onClick={handleFinalizeDay}
            disabled={isSettling}
            className="w-full px-12 py-8 bg-editorial-ink text-white text-xs font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSettling ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
            Finalizar Día y Liquidar
          </button>
        </div>
      </div>
    </div>
  );
}
