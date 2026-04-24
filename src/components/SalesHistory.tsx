import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  FileDown,
  X as CloseIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

// Augment jsPDF type for autotable
interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
  lastAutoTable?: {
    finalY: number;
  };
}

export function SalesHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(name, address),
        profiles:driver_id(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) toast.error('Error al cargar historial: ' + error.message);
    else {
      const formatted = data?.map((o: any) => ({
        ...o,
        driver_name: o.profiles?.full_name || 'Desconocido'
      }));
      setOrders(formatted || []);
    }
    setLoading(false);
  };

  const handleDelete = async (order: any) => {
    if (!confirm('¿Seguro que desea eliminar este registro de venta?')) return;
    
    if (order.isLocal) {
        await db.orders.delete(parseInt(order.id.replace('LOCAL-', '')));
        toast.success('Venta local eliminada');
        return;
    }

    const { error } = await supabase.from('orders').delete().eq('id', order.id);
    if (error) toast.error('Error al eliminar: ' + error.message);
    else {
        toast.success('Venta eliminada del servidor');
        fetchOrders();
    }
  };

  const generatePDF = (order: any) => {
    try {
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 250]
      }) as jsPDFWithPlugin;

      const margin = 5;
      let y = 10;

      // Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LUNA Y SOL', 40, y, { align: 'center' });
      y += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('SISTEMA DE VENTAS EN RUTA', 40, y, { align: 'center' });
      y += 8;

      // Order info
      doc.setFontSize(9);
      doc.text(`Folio: # ${order.id}`, margin, y);
      y += 5;
      doc.text(`Fecha: ${format(new Date(order.created_at || order.timestamp), 'dd/MM/yyyy HH:mm')}`, margin, y);
      y += 5;
      doc.text(`Cliente: ${order.customers?.name || order.customerName}`, margin, y);
      y += 8;

      // Items table
      const items = order.order_items || order.items || [];
      const tableData = items.map((item: any) => [
        item.products?.name || item.name || 'P...',
        item.quantity,
        `$${(item.price || 0).toFixed(2)}`,
        `$${((item.price || 0) * item.quantity).toFixed(2)}`
      ]);

      doc.autoTable({
        startY: y,
        head: [['ART', 'CT', 'PU', 'TOT']],
        body: tableData,
        theme: 'plain',
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 10, halign: 'center' },
          2: { cellWidth: 12, halign: 'right' },
          3: { cellWidth: 13, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });

      const finalY = doc.lastAutoTable?.finalY || y + 40;
      y = finalY + 8;

      // Totals
      const total = order.total || 0;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`TOTAL: $${total.toFixed(2)}`, 75, y, { align: 'right' });
      
      y += 15;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text('ESTE NO ES UN COMPROBANTE FISCAL', 40, y, { align: 'center' });

      doc.save(`Ticket_${order.id}.pdf`);
      toast.success('PDF Generado');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar PDF');
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    if (editingOrder.isLocal) {
        await db.orders.update(parseInt(editingOrder.id.replace('LOCAL-', '')), {
            total: editingOrder.total
        });
        toast.success('Venta local actualizada');
        setEditingOrder(null);
        return;
    }

    const { error } = await supabase
        .from('orders')
        .update({ total: editingOrder.total })
        .eq('id', editingOrder.id);
    
    if (error) toast.error('Error al actualizar: ' + error.message);
    else {
        toast.success('Venta actualizada');
        fetchOrders();
        setEditingOrder(null);
    }
  };

  const localOrders = useLiveQuery(() => db.orders.where('status').anyOf(['pending', 'failed']).toArray()) || [];

  const allVisibleOrders = useMemo(() => {
    // Convert local Dexie orders to match the format of Supabase orders
    const local = localOrders.map(o => ({
      ...o,
      id: `LOCAL-${o.id}`,
      total: o.total,
      created_at: o.createdAt,
      customers: { name: o.customerName, address: o.status === 'failed' ? `Error: ${o.error}` : 'Resguardado Localmente' },
      isLocal: true,
      syncStatus: o.status
    }));
    
    // Normalize remote orders
    const remote = orders.map(o => ({
      ...o,
      total: o.total
    }));
    
    // Combine and sort by date
    const combined = [...local, ...remote];
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, localOrders]);

  const filteredOrders = allVisibleOrders.filter(o => 
    o.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-editorial-ink/10 pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Auditoría Comercial</h3>
          <p className="text-4xl font-sans mt-2">Historial de Ventas</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={16} />
             <input 
               placeholder="Buscar venta..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-12 pr-4 py-3 bg-stone-100 border-none text-[10px] font-bold tracking-widest focus:ring-1 ring-editorial-ink outline-none"
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
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Chofer</th>
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
                        <p className="text-[10px] font-bold uppercase tracking-widest">{order.driver_name || (order.isLocal ? 'YO (LOCAL)' : 'N/A')}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-lg font-sans font-bold">${order.total?.toFixed(2)}</p>
                      </td>
                      <td className="p-6">
                        {order.isLocal ? (
                          order.syncStatus === 'failed' ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-[9px] font-bold uppercase tracking-widest border border-red-200">
                               <AlertCircle size={10} /> FALLA SYNC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[9px] font-bold uppercase tracking-widest border border-amber-200">
                               <Clock size={10} /> PENDIENTE SYNC
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[9px] font-bold uppercase tracking-widest border border-green-200">
                            <CheckCircle2 size={10} /> ENTREGADO
                          </span>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => setSelectedOrder(order)}
                                className="p-3 hover:bg-stone-100 transition-all text-stone-400"
                                title="Ver Detalle"
                            >
                                <FileText size={16} />
                            </button>
                            <button 
                                onClick={() => setEditingOrder(order)}
                                className="p-3 hover:bg-stone-100 transition-all text-stone-400 hover:text-amber-600"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDelete(order)}
                                className="p-3 hover:bg-stone-100 transition-all text-stone-400 hover:text-red-600"
                                title="Borrar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[115] animate-in fade-in duration-300" 
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-[120] animate-in slide-in-from-right duration-500 flex flex-col">
          <div className="p-8 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Detalles de Venta</h3>
            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <CloseIcon size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-10">
            <div className="space-y-12">
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-2">Fecha de Emisión</p>
                  <p className="font-sans font-bold text-stone-800">{format(new Date(selectedOrder.created_at || selectedOrder.timestamp), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-2">Método de Cobro</p>
                  <p className="font-sans font-bold text-stone-800">CONTADO / EFVO.</p>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-6">Cliente Final</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-editorial-ink text-white flex items-center justify-center font-bold text-xl uppercase">
                    {selectedOrder.customers?.name?.charAt(0) || selectedOrder.customerName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-sans font-bold text-xl uppercase tracking-tighter text-editorial-ink">{selectedOrder.customers?.name || selectedOrder.customerName}</p>
                    <p className="text-[10px] font-mono opacity-40">{selectedOrder.customers?.address || 'SIN DIRECCIÓN REGISTRADA'}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-6">Conceptos Facturados</p>
                 <div className="space-y-4">
                    {(selectedOrder.order_items || selectedOrder.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-stone-50">
                        <div>
                           <p className="text-[11px] font-bold uppercase tracking-tighter">{item.products?.name || item.name || 'PRODUCTO'}</p>
                           <p className="text-[9px] font-mono opacity-40">{item.quantity} UNIDADES x ${ (item.price || 0).toFixed(2) }</p>
                        </div>
                        <p className="font-mono text-xs font-bold text-editorial-ink">${ ((item.price || 0) * item.quantity).toFixed(2) }</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-6">Evidencia de Entrega</p>
                <div className="aspect-video bg-stone-50 border border-dashed border-stone-200 flex items-center justify-center relative group overflow-hidden">
                   {selectedOrder.signature_url || selectedOrder.signatureUrl ? (
                      <img src={selectedOrder.signature_url || selectedOrder.signatureUrl} alt="Firma" className="max-h-full object-contain p-4" />
                   ) : (
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Sin Evidencia de Firma</span>
                   )}
                </div>
              </div>

              {(selectedOrder.lat && selectedOrder.lng) && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-6">Geolocalización de Venta</p>
                  <div className="p-4 bg-stone-50 border border-stone-100 flex items-center gap-3">
                     <AlertCircle size={14} className="text-blue-500" />
                     <p className="text-[9px] font-mono leading-none">CORD: {selectedOrder.lat.toFixed(4)}, {selectedOrder.lng.toFixed(4)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 border-t border-stone-100 bg-stone-50/50">
            <button 
                onClick={() => generatePDF(selectedOrder)}
                className="w-full py-5 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
            >
              <FileDown size={18} /> GENERAR ARCHIVO PDF
            </button>
          </div>
        </div>
      </>
    )}

    {editingOrder && (
        <div className="fixed inset-0 bg-editorial-ink/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 border-2 border-editorial-ink">
            <h4 className="text-xl font-serif italic mb-6">Editar Importe de Venta</h4>
            <form onSubmit={handleUpdateOrder} className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Importe Total ($)</label>
                    <input 
                        type="number"
                        step="0.01"
                        required
                        value={editingOrder.total || 0}
                        onChange={(e) => setEditingOrder({...editingOrder, total: parseFloat(e.target.value)})}
                        className="w-full border-b-2 border-stone-200 py-3 text-2xl font-sans font-bold focus:border-editorial-ink outline-none"
                    />
                </div>
                <div className="flex gap-4">
                    <button type="submit" className="flex-1 bg-editorial-ink text-white py-4 text-[10px] font-bold uppercase tracking-widest">GUARDAR</button>
                    <button type="button" onClick={() => setEditingOrder(null)} className="flex-1 border border-editorial-ink py-4 text-[10px] font-bold uppercase tracking-widest">CANCELAR</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
