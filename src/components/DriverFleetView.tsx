import React, { useState, useEffect } from 'react';
import { Truck, Package, RefreshCcw, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  license_plate: string;
  model: string;
}

interface InventoryItem {
  product_id: string;
  quantity: number;
  products: {
    name: string;
    sku: string;
  };
}

export function DriverFleetView({ driverId }: { driverId: string | undefined }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (driverId) {
      fetchAssignedVehicle();
    }
  }, [driverId]);

  const fetchAssignedVehicle = async () => {
    setLoading(true);
    try {
      const { data: vData, error: vError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('assigned_driver_id', driverId)
        .maybeSingle();

      if (vError) throw vError;

      if (vData) {
        setVehicle(vData);
        // Fetch inventory for this vehicle
        const { data: invData, error: invError } = await supabase
          .from('truck_inventory')
          .select('*, products:product_id(name, sku)')
          .eq('vehicle_id', vData.id);

        if (invError) throw invError;
        setInventory(invData as any || []);
      } else {
        setVehicle(null);
      }
    } catch (error: any) {
      console.error('Error fetching driver unit:', error);
      toast.error('No se pudo cargar la información de la unidad');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <RefreshCcw className="animate-spin text-editorial-ink opacity-20" size={32} />
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Consultando asignación de unidad...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="bg-white border border-editorial-ink p-12 text-center space-y-6">
        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} className="text-stone-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-serif italic">Sin Unidad Asignada</h3>
          <p className="text-xs opacity-60 leading-relaxed max-w-xs mx-auto uppercase tracking-tighter">
            Actualmente no tienes un vehículo vinculado a tu cuenta. Contacta al administrador para asignar tu unidad de ruta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Unit Info Card */}
        <div className="lg:col-span-5">
           <div className="bg-editorial-ink text-white p-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)] text-green-400"></div>
              <div className="flex justify-between items-start mb-10">
                <div className="w-16 h-16 bg-white/5 flex items-center justify-center rounded-sm">
                  <Truck size={32} className="text-[var(--primary)]" />
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">Unidad Activa</span>
                </div>
              </div>

              <div className="space-y-1 mb-10">
                <h2 className="text-5xl font-bold tracking-tighter">{vehicle.license_plate}</h2>
                <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">{vehicle.model}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/10">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Estado de Carga</p>
                  <p className="text-sm font-mono font-bold">{inventory.length > 0 ? 'EN RUTA' : 'VACÍO'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Items Únicos</p>
                  <p className="text-sm font-mono font-bold">{inventory.length}</p>
                </div>
              </div>
           </div>
           
           <div className="mt-8 p-6 bg-stone-50 border border-editorial-ink/10 flex gap-4">
              <Info size={16} className="shrink-0 opacity-40" />
              <p className="text-[10px] font-serif italic leading-relaxed opacity-60">
                 Esta es la unidad oficial asignada para el registro de ventas y liquidaciones. Toda operación realizada estará vinculada a estos indicadores.
              </p>
           </div>
        </div>

        {/* Load Details */}
        <div className="lg:col-span-7">
           <div className="border border-editorial-ink">
              <div className="bg-stone-50 p-6 border-b border-editorial-ink flex justify-between items-center">
                 <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Inventario de Carga</h3>
                 <span className="px-3 py-1 bg-editorial-ink text-white text-[9px] font-bold font-mono">BODEGA_MÓVIL</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-editorial-ink bg-stone-100/50">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest">PRODUCTO</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-right">EN CAMIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {inventory.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-10 text-center opacity-40 italic uppercase tracking-widest text-[10px]">
                           No hay carga registrada para esta unidad.
                        </td>
                      </tr>
                    ) : (
                      inventory.map((item, idx) => (
                        <tr key={idx} className="border-b border-editorial-ink/5 hover:bg-stone-50 transition-colors">
                          <td className="p-4">
                             <p className="font-bold uppercase tracking-wider">{item.products?.name}</p>
                             <p className="text-[9px] font-mono opacity-40">{item.products?.sku}</p>
                          </td>
                          <td className="p-4 text-right">
                             <div className="inline-flex items-center gap-3">
                                <span className="text-xl font-bold font-mono">{item.quantity}</span>
                                <Package size={14} className="opacity-20" />
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </div>
           
           <button 
             onClick={fetchAssignedVehicle}
             className="w-full mt-6 py-4 flex items-center justify-center gap-3 border border-editorial-ink text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors"
           >
             <RefreshCcw size={14} /> Sincronizar Inventario
           </button>
        </div>
      </div>
    </div>
  );
}
