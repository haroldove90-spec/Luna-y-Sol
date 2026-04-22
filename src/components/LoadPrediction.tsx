import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, ArrowRight, Package } from 'lucide-react';

interface SaleHistory {
  date: string;
  productId: string;
  name: string;
  quantity: number;
}

const MOCK_HISTORY: SaleHistory[] = [
  { date: '2024-04-14', productId: '1', name: 'Agua Mineral 500ml', quantity: 40 },
  { date: '2024-04-15', productId: '1', name: 'Agua Mineral 500ml', quantity: 55 },
  { date: '2024-04-16', productId: '1', name: 'Agua Mineral 500ml', quantity: 42 },
  { date: '2024-04-17', productId: '1', name: 'Agua Mineral 500ml', quantity: 60 },
  { date: '2024-04-14', productId: '2', name: 'Refresco Cola 1.5L', quantity: 15 },
  { date: '2024-04-15', productId: '2', name: 'Refresco Cola 1.5L', quantity: 25 },
  { date: '2024-04-18', productId: '2', name: 'Refresco Cola 1.5L', quantity: 20 },
];

export function LoadPrediction() {
  const suggestions = useMemo(() => {
    const totals: Record<string, { name: string, total: number, counts: number }> = {};
    
    MOCK_HISTORY.forEach(sale => {
      if (!totals[sale.productId]) {
        totals[sale.productId] = { name: sale.name, total: 0, counts: 0 };
      }
      totals[sale.productId].total += sale.quantity;
      totals[sale.productId].counts += 1;
    });

    return Object.entries(totals).map(([id, data]) => {
      const avg = data.total / 7; // Promedio diario basado en la semana
      const recommendation = Math.ceil(avg * 1.2); // Recomendación con 20% de margen de seguridad
      return { id, name: data.name, recommendation };
    });
  }, []);

  return (
    <div className="bg-stone-50 border border-editorial-ink/10 p-8 space-y-6">
      <div className="flex items-center gap-4 border-l-4 border-editorial-ink pl-6">
        <div className="w-10 h-10 rounded-full bg-editorial-ink flex items-center justify-center text-white">
          <Lightbulb size={20} />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.3em]">IA Predicción de Carga</h3>
          <p className="text-sm font-sans opacity-60">Sugerencias basadas en el historial de los últimos 7 días.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {suggestions.map(s => (
          <div key={s.id} className="bg-white border border-editorial-ink/5 p-6 flex justify-between items-center group hover:border-editorial-ink transition-all">
            <div className="flex items-center gap-4">
               <Package size={16} className="opacity-20 group-hover:opacity-100 transition-opacity" />
               <div>
                 <p className="text-[11px] font-bold uppercase tracking-wider">{s.name}</p>
                 <p className="text-[9px] font-mono opacity-40 uppercase">Historial semanal analizado</p>
               </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-sans font-bold text-editorial-ink">{s.recommendation}</p>
              <p className="text-[8px] font-bold uppercase tracking-tighter opacity-40">CARGA SUGERIDA</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-editorial-ink/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-mono opacity-40 uppercase">
          <TrendingUp size={12} /> Precisión del algoritmo: 88%
        </div>
        <button className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-2 transition-transform">
          APLICAR CARGA A CAMIÓN <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
