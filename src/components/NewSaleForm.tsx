import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ChevronLeft,
  Package,
  CreditCard,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces based on schema
interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  truckStock: number;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  taxId: string;
}

interface CartItem extends Product {
  quantity: number;
}

// Mock Data for the Driver View
const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Tienda La Bendición', address: 'Calle 5 #10-20', taxId: '900123456-1' },
  { id: 'c2', name: 'Minimarket Luna', address: 'Av. Siempre Viva 742', taxId: '900987654-2' },
  { id: 'c3', name: 'Restaurante El Gourmet', address: 'Carrera 15 #45-12', taxId: '800555444-3' },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', sku: 'AG-500', name: 'Agua Mineral 500ml', price: 1.5, truckStock: 45 },
  { id: 'p2', sku: 'RC-1.5', name: 'Refresco Cola 1.5L', price: 2.8, truckStock: 20 },
  { id: 'p3', sku: 'JN-1L', name: 'Jugo de Naranja 1L', price: 3.2, truckStock: 25 },
  { id: 'p4', sku: 'BT-200', name: 'Botana Mixta 200g', price: 2.1, truckStock: 15 },
];

interface NewSaleFormProps {
  onCancel: () => void;
  onSuccess: (orderData: any) => void;
}

import { useOfflineSync } from '../lib/useOfflineSync';
import { Wifi, WifiOff, RefreshCcw, Database } from 'lucide-react';

export default function NewSaleForm({ onCancel, onSuccess }: NewSaleFormProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);

  const { isOnline, saveOrder } = useOfflineSync();

  // Filters
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.truckStock) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > item.truckStock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const taxes = subtotal * 0.16; // 16% IVA
  const total = subtotal + taxes;

  const handleFinish = async () => {
    if (!selectedCustomer || cart.length === 0) return;
    setIsFinishing(true);
    
    try {
      const id = await saveOrder({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        items: cart,
        total,
      });
      
      setLastSavedId(id as number);

      // We give a small delay to show the success state
      setTimeout(() => {
        onSuccess({ id, status: isOnline ? 'synced' : 'pending' });
      }, 1500);
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      setIsFinishing(false);
    }
  };

  if (isFinishing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-editorial-ink rounded-full flex items-center justify-center mb-8">
          {isOnline ? (
            <RefreshCcw className="text-[#FF6321] animate-spin" size={32} />
          ) : (
            <Database className="text-[#FF6321] animate-pulse" size={32} />
          )}
        </div>
        <h2 className="text-3xl font-serif italic text-center mb-4">
          {isOnline ? 'Sincronizando Venta...' : 'Venta Guardada Localmente'}
        </h2>
        <p className="text-sm font-mono opacity-40 uppercase tracking-widest text-center px-8">
          {isOnline 
            ? 'Transmitiendo datos al servidor central' 
            : 'Sin conexión: El pedido se subirá automáticamente al recuperar internet'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-editorial-bg animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <header className="p-6 border-b border-editorial-ink flex items-center justify-between sticky top-0 bg-editorial-bg z-20">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-stone-200 transition-colors rounded-full text-editorial-ink">
            <ChevronLeft size={24} />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 leading-none mb-1">Módulo de Chofer</p>
            <h2 className="text-2xl font-serif italic">Nueva Venta</h2>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
          isOnline ? "text-green-600 border-green-200 bg-green-50" : "text-stone-400 border-stone-200 bg-stone-50"
        )}>
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Customer Selector */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Users size={14} className="opacity-40" /> Cliente
          </h3>
          {!selectedCustomer ? (
            <div className="space-y-3">
              {MOCK_CUSTOMERS.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedCustomer(c)}
                  className="w-full text-left p-6 border border-editorial-ink/10 hover:border-editorial-ink transition-all group"
                >
                  <p className="text-sm font-bold uppercase tracking-wider mb-1">{c.name}</p>
                  <p className="text-[10px] font-mono opacity-40">{c.address}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-editorial-ink text-[#D1D1D1] relative group">
              <div className="absolute top-2 right-2">
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <p className="text-white font-bold uppercase tracking-widest mb-1">{selectedCustomer.name}</p>
              <p className="text-[10px] font-mono opacity-60 mb-2">{selectedCustomer.taxId}</p>
              <div className="h-px bg-white/10 my-3" />
              <p className="text-[10px] opacity-40 uppercase">Dirección de Entrega:</p>
              <p className="text-[10px] text-white/80">{selectedCustomer.address}</p>
            </div>
          )}
        </section>

        {/* Product Search & List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <Package size={14} className="opacity-40" /> Catálogo en Camión
            </h3>
            <span className="text-[10px] font-mono opacity-40">{MOCK_PRODUCTS.length} ITEMS</span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-editorial-ink opacity-40" size={16} />
            <input 
              type="text" 
              placeholder="BUSCAR PRODUCTO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-editorial-ink/10 text-xs font-bold uppercase tracking-widest focus:border-editorial-ink outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-4">
            {filteredProducts.map(p => {
              const inCart = cart.find(item => item.id === p.id);
              return (
                <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-editorial-ink/5">
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-tighter">{p.name}</p>
                    <div className="flex gap-4 mt-1">
                      <p className="text-[9px] font-mono opacity-40">SKU: {p.sku}</p>
                      <p className={cn(
                        "text-[9px] font-bold uppercase tracking-widest",
                        p.truckStock <= 5 ? "text-red-500" : "text-stone-400"
                      )}>Stock: {p.truckStock}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-serif italic font-bold text-editorial-ink">${p.price}</p>
                    {inCart ? (
                      <div className="flex items-center gap-3 bg-editorial-bg border border-editorial-ink/10 px-2 py-1">
                        <button onClick={() => updateQuantity(p.id, -1)} className="p-1 text-editorial-ink hover:text-red-500">
                          <Minus size={14} />
                        </button>
                        <span className="text-xs font-mono font-bold w-4 text-center">{inCart.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(p.id, 1)} 
                          className={cn("p-1", inCart.quantity >= p.truckStock ? "text-gray-200" : "text-editorial-ink hover:text-green-600")}
                          disabled={inCart.quantity >= p.truckStock}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(p)}
                        disabled={p.truckStock === 0}
                        className={cn(
                          "w-10 h-10 border flex items-center justify-center transition-all",
                          p.truckStock === 0 ? "border-stone-100 text-stone-200" : "border-editorial-ink hover:bg-editorial-ink hover:text-white"
                        )}
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer / Summary Bar */}
      {cart.length > 0 && selectedCustomer && (
        <div className="p-8 bg-white border-t border-editorial-ink shadow-[0_-10px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-full duration-300">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-40">
              <span>Subtotal</span>
              <span className="font-mono text-editorial-ink">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-40">
              <span>IVA (16%)</span>
              <span className="font-mono text-editorial-ink">${taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-stone-100">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-editorial-ink">Total a Cobrar</span>
              <span className="text-2xl font-serif italic font-bold text-editorial-ink">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            onClick={handleFinish}
            className="w-full py-5 bg-editorial-ink text-white text-xs font-bold uppercase tracking-[0.4em] hover:bg-[#2A2A2A] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <CreditCard size={18} />
            Finalizar Pedido
          </button>
        </div>
      )}
    </div>
  );
}
