import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  MapPin, 
  ChevronRight,
  Download,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function SalesHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(name, address)
      `)
      .order('created_at', { ascending: false });

    if (error) toast.error('Error al cargar historial: ' + error.message);
    else setOrders(data || []);
    setLoading(false);
  };

  const filteredOrders = orders.filter(o => 
    o.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-editorial-ink/10 pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Auditoría Comercial</h3>
          <p className="text-4xl font-serif italic mt-2">Historial de Ventas</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={16} />
             <input 
               placeholder="BUSCAR VENTA..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-12 pr-4 py-3 bg-stone-100 border-none text-[10px] font-bold uppercase tracking-widest focus:ring-1 ring-editorial-ink outline-none"
             />
          </div>
          <button className="p-3 bg-editorial-ink text-white hover:bg-black transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <div className="bg-white border border-editorial-ink/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-editorial-ink/10">
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Folio / Fecha</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Cliente / Ubicación</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Monto Total</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Estado</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-editorial-ink/5 hover:bg-stone-50 transition-colors group">
                      <td className="p-6">
                        <p className="font-mono text-[10px] font-bold">#{order.id.split('-')[0].toUpperCase()}</p>
                        <p className="opacity-40 mt-1">{format(new Date(order.created_at), 'PPPp', { locale: es })}</p>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <User size={14} className="opacity-20" />
                          <div>
                            <p className="font-bold uppercase tracking-tight">{order.customers?.name}</p>
                            <p className="text-[10px] opacity-40 uppercase truncate max-w-[200px]">{order.customers?.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-lg font-serif italic font-bold">${order.total?.toFixed(2)}</p>
                      </td>
                      <td className="p-6">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[9px] font-bold uppercase tracking-widest border border-green-200">
                          <CheckCircle2 size={10} /> ENTREGADO
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="p-3 hover:bg-editorial-ink hover:text-white transition-all text-stone-400"
                        >
                          <FileText size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Sidebars */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-editorial-ink/60 backdrop-blur-sm z-[100] flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-start mb-12">
               <div>
                 <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Detalle de Operación</h4>
                 <p className="text-3xl font-serif italic mt-2">Venta #{selectedOrder.id.split('-')[0].toUpperCase()}</p>
               </div>
               <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                 <Search size={24} className="rotate-45" />
               </button>
            </div>

            <div className="space-y-12">
              <div className="grid grid-cols-2 gap-8 py-8 border-y border-editorial-ink/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase opacity-40">Fecha de Emisión</p>
                  <p className="font-bold">{format(new Date(selectedOrder.created_at), 'PPP', { locale: es })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase opacity-40">Método de Cobro</p>
                  <p className="font-bold uppercase">Contado / Efvo.</p>
                </div>
              </div>

              <div className="space-y-6">
                <h5 className="text-[10px] font-bold uppercase tracking-widest opacity-40 border-b border-editorial-ink/5 pb-2">Cliente Final</h5>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-editorial-ink text-white flex items-center justify-center font-serif italic text-xl">
                    {selectedOrder.customers?.name?.[0]}
                  </div>
                  <div>
                    <p className="text-xl font-bold uppercase tracking-tight">{selectedOrder.customers?.name}</p>
                    <p className="text-xs opacity-60 leading-relaxed mt-2">{selectedOrder.customers?.address}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h5 className="text-[10px] font-bold uppercase tracking-widest opacity-40 border-b border-editorial-ink/5 pb-2">Evidencia de Entrega</h5>
                {selectedOrder.signature_url ? (
                  <div className="bg-stone-50 border border-editorial-ink/10 p-4">
                    <img src={selectedOrder.signature_url} alt="Firma" className="max-h-32 object-contain mix-blend-multiply mx-auto" />
                    <p className="text-center text-[9px] font-bold uppercase opacity-20 mt-4 tracking-widest">Firma Digital Capturada en Dispositivo Móvil</p>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-stone-200 text-center text-[10px] font-bold uppercase opacity-20 tracking-widest">Sin Evidencia de Firma</div>
                )}
              </div>

              <div className="space-y-6">
                <h5 className="text-[10px] font-bold uppercase tracking-widest opacity-40 border-b border-editorial-ink/5 pb-2">Geolocalización de Venta</h5>
                {selectedOrder.lat && (
                   <div className="flex items-center gap-4 p-4 bg-editorial-ink text-white">
                      <MapPin size={20} className="text-[var(--primary)]" />
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest">Coordenadas del Punto</p>
                        <p className="font-mono text-xs mt-1">{selectedOrder.lat}, {selectedOrder.lng}</p>
                      </div>
                      <a 
                        href={`https://www.google.com/maps?q=${selectedOrder.lat},${selectedOrder.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 border border-white/20 hover:bg-white/10 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </a>
                   </div>
                )}
              </div>

              <button className="w-full py-5 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:shadow-xl transition-all">
                <Download size={16} /> GENERAR ARCHIVO PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
