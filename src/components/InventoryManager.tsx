import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Truck, Package, ChevronRight, Save, Loader2, AlertCircle } from 'lucide-react';

export function InventoryManager() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [vRes, pRes] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('products').select('*')
    ]);

    if (vRes.error || pRes.error) {
      toast.error('Error al cargar datos logísticos');
    } else {
      setVehicles(vRes.data || []);
      setProducts(pRes.data || []);
    }
    setLoading(false);
  };

  const handleLoadVehicle = async () => {
    if (!selectedVehicle) return;
    setSaving(true);
    
    const items = Object.entries(assignments)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({
        vehicle_id: selectedVehicle.id,
        product_id: productId,
        quantity,
        updated_at: new Date().toISOString()
      }));

    if (items.length === 0) {
      toast.warning('No hay productos seleccionados para cargar');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('truck_inventory')
      .upsert(items, { onConflict: 'vehicle_id,product_id' });

    if (error) {
      toast.error('Error en la carga: ' + error.message);
    } else {
      toast.success(`Camión ${selectedVehicle.plate} cargado exitosamente`);
      setAssignments({});
      setSelectedVehicle(null);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-4" /> Inicializando sistema logístico...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="border-b border-editorial-ink pb-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Gestión de Suministros</h3>
        <p className="text-4xl font-serif italic mt-2">Carga Masiva de Unidades</p>
      </div>

      {!selectedVehicle ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map(v => (
            <button 
              key={v.id} 
              onClick={() => setSelectedVehicle(v)}
              className="bg-white border border-editorial-ink p-8 text-left group hover:bg-editorial-ink hover:text-white transition-all"
            >
              <Truck size={24} className="mb-6 opacity-40 group-hover:text-[var(--primary)] group-hover:opacity-100 transition-all" />
              <p className="text-2xl font-bold tracking-tighter mb-1 uppercase">{v.plate}</p>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 group-hover:opacity-60">{v.driver_name}</p>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-widest uppercase">Iniciar Carga</span>
                <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-editorial-ink p-8">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-editorial-ink/5">
                <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                  <Package size={16} /> Catálogo de Productos Disponibles
                </h4>
                <p className="text-[9px] font-mono leading-none py-1 px-2 bg-stone-100 uppercase font-bold">CARGA_ACTIVA: {selectedVehicle.plate}</p>
              </div>

              <div className="space-y-2">
                {products.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors border-b border-editorial-ink/5 last:border-0 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-editorial-ink/10 flex items-center justify-center text-[10px] font-bold group-hover:border-[var(--primary)] transition-all">
                        {p.unit}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-tight">{p.name}</p>
                        <p className="text-[9px] opacity-40 uppercase">{p.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-mono opacity-40">CANTIDAD:</span>
                      <input 
                        type="number"
                        min="0"
                        value={assignments[p.id] || ''}
                        onChange={(e) => setAssignments({...assignments, [p.id]: parseInt(e.target.value) || 0})}
                        className="w-20 bg-white border border-editorial-ink/20 py-1 px-3 text-center font-mono text-sm focus:border-editorial-ink outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24 space-y-6">
              <div className="bg-editorial-ink text-white p-8 space-y-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--primary)]">Resumen de Carga</p>
                <div className="space-y-4">
                   <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-[10px] font-bold uppercase opacity-40">Unidad:</span>
                      <span className="text-[10px] font-bold">{selectedVehicle.plate}</span>
                   </div>
                   <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-[10px] font-bold uppercase opacity-40">Operador:</span>
                      <span className="text-[10px] font-bold uppercase">{selectedVehicle.driver_name}</span>
                   </div>
                </div>

                <div className="space-y-4 pt-4">
                   <div className="flex items-start gap-3 p-4 bg-white/5 text-[9px] leading-relaxed">
                      <AlertCircle size={14} className="shrink-0 text-[var(--primary)]" />
                      <p className="opacity-60 uppercase tracking-wider italic">
                        Esta acción actualizará el stock físico del camión. Asegúrese de que el conteo de carga sea preciso antes de confirmar.
                      </p>
                   </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleLoadVehicle}
                    disabled={saving}
                    className="w-full py-5 bg-[var(--primary)] text-black text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    CONFIRMAR CARGA
                  </button>
                  <button 
                    onClick={() => setSelectedVehicle(null)}
                    className="w-full py-4 mt-2 text-[9px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                  >
                    CANCELAR Y VOLVER
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
