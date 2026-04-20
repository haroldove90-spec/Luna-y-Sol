import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Save, 
  Lock,
  DollarSign,
  PackageCheck,
  History
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  initialStock: number;
  loads: number;
  sales: number;
  theoreticalStock: number;
  physicalStock: number;
}

// Mock inventory data for a specific vehicle (e.g., Driver 'Sr. Arquitecto')
const INITIAL_INVENTORY_DATA = [
  { id: '1', sku: 'AG-500', name: 'Agua Mineral 500ml', initialStock: 50, loads: 20 },
  { id: '2', sku: 'RC-1.5', name: 'Refresco Cola 1.5L', initialStock: 30, loads: 10 },
  { id: '3', sku: 'JN-1L', name: 'Jugo de Naranja 1L', initialStock: 25, loads: 15 },
  { id: '4', sku: 'BT-200', name: 'Botana Mixta 200g', price: 2.1, initialStock: 40, loads: 0 },
];

export default function RouteSettlement() {
  const [physicalStocks, setPhysicalStocks] = useState<Record<string, number>>({});
  const [isSettling, setIsSettling] = useState(false);
  const [settled, setSettled] = useState(false);

  // Get orders from IndexedDB (including pending ones)
  const allOrders = useLiveQuery(() => db.orders.toArray()) || [];

  // Calculate aggregation of sales per product from orders
  const salesByProduct = useMemo(() => {
    const counts: Record<string, number> = {};
    allOrders.forEach(order => {
      order.items.forEach((item: any) => {
        counts[item.id] = (counts[item.id] || 0) + item.quantity;
      });
    });
    return counts;
  }, [allOrders]);

  const totalSalesAmount = useMemo(() => {
    return allOrders.reduce((sum, order) => sum + order.total, 0);
  }, [allOrders]);

  // Reconciliation logic
  const reconciliationData = useMemo(() => {
    return INITIAL_INVENTORY_DATA.map(item => {
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
  }, [salesByProduct, physicalStocks]);

  const handlePhysicalStockChange = (id: string, value: string) => {
    const val = parseInt(value) || 0;
    setPhysicalStocks(prev => ({ ...prev, [id]: val }));
  };

  const handleFinalizeDay = () => {
    setIsSettling(true);
    
    // Generate settlement record
    const settlementSummary = {
      vehicleId: 'VEH-001',
      driverId: 'DRV-102',
      totalSales: totalSalesAmount,
      cashExpected: totalSalesAmount, // For simplicity in this demo
      items: reconciliationData,
      timestamp: new Date().toISOString()
    };

    console.log('--- RESUMEN DE LIQUIDACIÓN PARA route_settlements ---');
    console.log(JSON.stringify(settlementSummary, null, 2));

    // Simulate database write
    setTimeout(() => {
      setIsSettling(false);
      setSettled(true);
    }, 2000);
  };

  if (settled) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 bg-white border-2 border-editorial-ink animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border-2 border-green-200">
          <CheckCircle2 className="text-green-600" size={48} />
        </div>
        <h2 className="text-4xl font-serif italic text-center mb-4">Día Finalizado Exitosamente</h2>
        <p className="text-sm font-mono opacity-60 text-center max-w-md uppercase tracking-widest leading-relaxed">
          La ruta ha sido liquidada. Los inventarios se han actualizado y el vehículo está bloqueado para nuevas ventas hasta el próximo surtido.
        </p>
        <div className="mt-10 p-6 border border-editorial-ink/10 bg-editorial-bg w-full max-w-sm">
           <div className="flex justify-between text-xs font-bold mb-2">
             <span>FOLIO:</span>
             <span className="font-mono">LIQ-2024-0420</span>
           </div>
           <div className="flex justify-between text-xs font-bold">
             <span>TOTAL LIQUIDADO:</span>
             <span className="font-mono font-serif italic text-lg">${totalSalesAmount.toFixed(2)}</span>
           </div>
        </div>
        <button 
          onClick={() => setSettled(false)}
          className="mt-12 text-[10px] font-bold uppercase tracking-[0.4em] underline hover:text-stone-500"
        >
          Ver Historial de Cierres
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* KPI Summary Cards */}
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
        <div className={cn(
          "p-8 border",
          reconciliationData.some(d => d.difference !== 0) 
            ? "border-red-500 bg-red-50" 
            : "border-green-500 bg-green-50"
        )}>
          <AlertTriangle className={cn(
            "mb-6", 
            reconciliationData.some(d => d.difference !== 0) ? "text-red-500" : "text-green-500"
          )} size={24} />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Diferencia Inventario</p>
          <h3 className={cn(
            "text-4xl font-serif italic",
            reconciliationData.some(d => d.difference !== 0) ? "text-red-600" : "text-green-600"
          )}>
            {reconciliationData.reduce((acc, curr) => acc + Math.abs(curr.difference), 0)} u.
          </h3>
        </div>
      </div>

      {/* Inventory Reconciliation Table */}
      <div className="bg-white border border-editorial-ink overflow-hidden">
        <div className="bg-editorial-ink text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <PackageCheck size={20} className="text-[#FF6321]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.4em]">Conciliación de Mercancía en Ruta</h3>
          </div>
          <p className="text-[10px] font-mono opacity-50">UNIDAD: VEH-102 (SR. ARQUITECTO)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-editorial-ink bg-stone-100">
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest">Designación // SKU</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-center">Inicial + Cargas</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-center">Ventas Realizadas</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-center border-l border-editorial-ink/10 bg-editorial-bg/30">Stock Teórico</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-center bg-stone-200">Stock Físico (Sobras)</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-center">Diferencia</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {reconciliationData.map((item) => (
                <tr key={item.id} className="border-b border-editorial-ink/10 hover:bg-stone-50 transition-colors">
                  <td className="p-6 border-r border-editorial-ink/5">
                    <p className="font-bold uppercase tracking-wider">{item.name}</p>
                    <p className="text-[9px] font-mono opacity-40">{item.sku}</p>
                  </td>
                  <td className="p-6 text-center font-mono opacity-60">
                    {item.initialStock} + {item.loads}
                  </td>
                  <td className="p-6 text-center font-bold text-lg text-stone-400">
                    {item.sales}
                  </td>
                  <td className="p-6 text-center font-serif italic text-2xl border-l border-editorial-ink/10 bg-editorial-bg/10">
                    {item.theoreticalStock}
                  </td>
                  <td className="p-6 bg-stone-50/50">
                    <div className="flex justify-center">
                      <input 
                        type="number"
                        value={physicalStocks[item.id] ?? item.theoreticalStock}
                        onChange={(e) => handlePhysicalStockChange(item.id, e.target.value)}
                        className="w-24 text-center p-3 border-2 border-editorial-ink/20 focus:border-editorial-ink bg-white font-mono text-lg outline-none transition-all"
                      />
                    </div>
                  </td>
                  <td className={cn(
                    "p-6 text-center font-bold text-xl",
                    item.difference < 0 ? "text-red-500 bg-red-50/30" : 
                    item.difference > 0 ? "text-blue-500 bg-blue-50/30" : 
                    "text-green-500 opacity-40"
                  )}>
                    {item.difference === 0 ? '--' : item.difference > 0 ? `+${item.difference}` : item.difference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 p-8 bg-editorial-ink text-zinc-400 font-mono text-[11px] leading-relaxed relative border-l-8 border-[#FF6321]">
          <p className="text-white font-bold mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
            <Lock size={14} className="text-[#FF6321]" /> Protocolo de Cierre
          </p>
          <p className="mb-4">
            Al finalizar el día, se bloqueará el acceso al terminal de venta para este vehículo. El sistema generará una transacción de liquidación irreversible para auditoría contable.
          </p>
          <p className="italic opacity-50">
            // Las diferencias de inventario se reportarán automáticamente al jefe de almacén central.
          </p>
        </div>
        
        <div className="w-full md:w-auto h-full space-y-4">
          <button 
            onClick={handleFinalizeDay}
            disabled={isSettling}
            className={cn(
              "w-full px-12 py-8 bg-editorial-ink text-white text-xs font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all active:scale-[0.98]",
              isSettling && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSettling ? (
              <>
                <RefreshCcw className="animate-spin" size={20} />
                Procesando Liquidación...
              </>
            ) : (
              <>
                <Save size={20} />
                Finalizar Día y Liquidar
              </>
            )}
          </button>
          <p className="text-[9px] font-mono text-center opacity-30 italic">
            CONFIRMAR DISPONIBILIDAD DE CAJA FÍSICA ANTES DE PROCEDER
          </p>
        </div>
      </div>
    </div>
  );
}

function RefreshCcw({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
