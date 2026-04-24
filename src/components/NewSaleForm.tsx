import React, { useState, useMemo, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
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
  X,
  FileText,
  RotateCcw,
  Loader2,
  FileDown,
  Wifi, 
  WifiOff, 
  RefreshCcw, 
  Database, 
  Printer, 
  MapPin, 
  Navigation, 
  AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useOfflineSync } from '../lib/useOfflineSync';
import { useReactToPrint } from 'react-to-print';
import { SaleTicket } from './SaleTicket';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  lat: number;
  lng: number;
}

interface CartItem extends Product {
  quantity: number;
}

// Mock Data for the Driver View
const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Tienda La Bendición', address: 'Calle 5 #10-20', taxId: '900123456-1', lat: 19.4326, lng: -99.1332 },
  { id: 'c2', name: 'Minimarket Luna', address: 'Av. Siempre Viva 742', taxId: '900987654-2', lat: 19.4350, lng: -99.1412 },
  { id: 'c3', name: 'Restaurante El Gourmet', address: 'Carrera 15 #45-12', taxId: '800555444-3', lat: 19.4270, lng: -99.1250 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', sku: 'AG-500', name: 'Agua Mineral 500ml', price: 1.5, truckStock: 45 },
  { id: 'p2', sku: 'RC-1.5', name: 'Refresco Cola 1.5L', price: 2.8, truckStock: 20 },
  { id: 'p3', sku: 'JN-1L', name: 'Jugo de Naranja 1L', price: 3.2, truckStock: 25 },
  { id: 'p4', sku: 'BT-200', name: 'Botana Mixta 200g', price: 2.1, truckStock: 15 },
];

interface NewSaleFormProps {
  driverId?: string;
  onCancel: () => void;
  onSuccess: (orderData: any) => void;
}

export default function NewSaleForm({ driverId, onCancel, onSuccess }: NewSaleFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [truckProducts, setTruckProducts] = useState<Product[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<number | string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [distanceWarning, setDistanceWarning] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  useEffect(() => {
    fetchOperationalData();
  }, []);

  const fetchOperationalData = async () => {
    setLoadingItems(true);
    const [cRes, vRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('vehicles').select('*')
    ]);

    if (!cRes.error && cRes.data) setCustomers(cRes.data);
    if (!vRes.error && vRes.data) {
      setVehicles(vRes.data);
      if (vRes.data.length > 0) setSelectedVehicleId(vRes.data[0].id);
    }
    setLoadingItems(false);
  };

  useEffect(() => {
    if (selectedVehicleId) {
      fetchTruckStock();
    }
  }, [selectedVehicleId]);

  const fetchTruckStock = async () => {
    setLoadingItems(true);
    const { data: inv, error } = await supabase
      .from('truck_inventory')
      .select('*, products(*)')
      .eq('vehicle_id', selectedVehicleId);

    if (error) {
      toast.error('Error al cargar inventario del camión');
    } else {
      const productsWithStock = inv.map(item => ({
        ...item.products,
        truckStock: item.quantity
      }));
      setTruckProducts(productsWithStock);
    }
    setLoadingItems(false);
  };

  const { isOnline, saveOrder } = useOfflineSync();
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
  });

  const generateTicketPDF = (orderData: any) => {
    try {
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 200]
      });

      const margin = 5;
      let y = 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LUNA Y SOL', 40, y, { align: 'center' });
      y += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('SISTEMA DE VENTAS EN RUTA', 40, y, { align: 'center' });
      y += 8;

      doc.setFontSize(9);
      doc.text(`Folio: # ${lastSavedId || '...'}`, margin, y);
      y += 5;
      doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, y);
      y += 5;
      doc.text(`Cliente: ${selectedCustomer?.name || 'Venta al Público'}`, margin, y);
      y += 8;

      const items = cart.map(item => [
        item.name.substring(0, 15),
        item.quantity,
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.quantity).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: y,
        head: [['ART', 'CT', 'PU', 'TOT']],
        body: items,
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

      y = (doc as any).lastAutoTable.finalY + 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`TOTAL: $${total.toFixed(2)}`, 75, y, { align: 'right' });
      
      y += 15;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text('ESTE NO ES UN COMPROBANTE FISCAL', 40, y, { align: 'center' });

      doc.save(`Ticket_${lastSavedId || 'PENDIENTE'}.pdf`);
      toast.success('PDF Descargado');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar PDF');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const captureLocation = () => {
    if (!selectedCustomer) return;
    setIsLocating(true);
    setDistanceWarning(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        
        const dist = calculateDistance(latitude, longitude, selectedCustomer.lat, selectedCustomer.lng);
        if (dist > 200) {
          setDistanceWarning(`Estás a ${Math.round(dist)} metros del cliente. Ubicación no coincide.`);
        } else {
          setDistanceWarning(null);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Error de ubicación:', error);
        setIsLocating(false);
        alert('No se pudo obtener la ubicación. Por favor activa el GPS.');
      },
      { enableHighAccuracy: true }
    );
  };

  // Filters
  const filteredProducts = useMemo(() => {
    return truckProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, truckProducts]);

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.truckStock) {
          toast.error(`Stock insuficiente en camión (${product.truckStock} máx)`);
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.truckStock < 1) {
        toast.error('Producto sin disponibilidad en inventario móvil.');
        return prev;
      }
      toast.success(`${product.name} añadido`);
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
        if (newQty > item.truckStock) {
          toast.error(`Exceso de stock disponible (${item.truckStock} máx)`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const taxes = subtotal * 0.16; // 16% IVA
  const total = subtotal + taxes;

  const handleFinish = () => {
    if (!selectedCustomer || cart.length === 0) return;

    // Bloqueo por Geocerca (Activo)
    if (distanceWarning) {
      toast.error('Operación Bloqueada: La ubicación actual no coincide con la del cliente.');
      return;
    }

    // Check credit limit
    if (total > (selectedCustomer as any).credit_limit) {
      toast.error('Operación Rechazada: Excede límite de crédito del cliente.');
      return;
    }
    setShowSignature(true);
  };

  const confirmSaleWithSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Firma Obligatoria: El cliente debe confirmar el recibido.');
      return;
    }

    const signatureUrl = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
    saveOrderWithMetadata(signatureUrl);
  };

  const saveOrderWithMetadata = async (signatureUrl: string) => {
    setIsFinishing(true);
    try {
      const id = await saveOrder({
        vehicleId: selectedVehicleId,
        driverId: driverId || '',
        customerId: selectedCustomer?.id || '',
        customerName: selectedCustomer?.name || '',
        items: cart,
        total,
        signatureUrl,
        lat: currentCoords?.lat || null,
        lng: currentCoords?.lng || null,
        distanceWarn: distanceWarning
      });
      
      setLastSavedId(id as number);

      // Actualizar inventario en la nube si estamos online
      if (isOnline && selectedVehicleId) {
        try {
          for (const item of cart) {
            const currentProduct = truckProducts.find(p => p.id === item.id);
            const newQty = (currentProduct?.truckStock || 0) - item.quantity;
            
            await supabase
              .from('truck_inventory')
              .update({ quantity: newQty, updated_at: new Date().toISOString() })
              .eq('vehicle_id', selectedVehicleId)
              .eq('product_id', item.id);
          }
        } catch (err) {
          console.error('Error actualizando inventario en nube:', err);
        }
      }

      // Actualizar stock local
      setTruckProducts(prev => {
        return prev.map(p => {
          const itemInCart = cart.find(item => item.id === p.id);
          if (itemInCart) {
            return { ...p, truckStock: p.truckStock - itemInCart.quantity };
          }
          return p;
        });
      });
      
      // Stock Alerts (< 10%)
      cart.forEach(item => {
        const remaining = item.truckStock - item.quantity;
        if (remaining > 0 && remaining <= item.truckStock * 0.1) {
          toast.warning(`Stock Crítico: ${item.name} (${remaining} restan en camión)`);
        }
      });

      if (isOnline) {
        toast.success(`Orden #${id} sincronizada con la central.`);
      } else {
        toast.info('Sin conexión. Orden resguardada localmente.');
      }

      setShowSignature(false);
      setShowSuccess(true);
    } catch (error) {
      toast.error('Falla en procesamiento: ' + (error as Error).message);
    } finally {
      setIsFinishing(false);
    }
  };

  if (showSuccess) {
    return (
      <div 
        className="fixed inset-0 bg-editorial-bg z-50 flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500 overflow-y-auto cursor-pointer"
        onClick={() => onSuccess({})}
      >
        <div 
          className="flex flex-col items-center justify-center w-full max-w-lg cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => onSuccess({})}
            className="absolute top-8 right-8 p-3 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={32} strokeWidth={1} className="text-stone-400" />
          </button>

          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-100">
            <CheckCircle2 className="text-white" size={40} />
          </div>
          <h2 className="text-3xl font-sans font-bold text-center mb-2">Venta Completada</h2>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.2em] mb-12">Referencia: #{lastSavedId}</p>
          
          <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
            <button 
                  onClick={() => generateTicketPDF({})}
                  className="w-full py-5 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
            >
              <FileDown size={18} /> DESCARGAR TICKET PDF
            </button>
            <button 
              onClick={() => handlePrint()}
              className="w-full py-5 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Printer size={18} /> IMPRIMIR (TÉRMICA)
            </button>
            <button 
              onClick={() => onSuccess({})}
              className="w-full py-5 border border-editorial-ink text-editorial-ink text-[10px] font-bold uppercase tracking-[0.3em] active:scale-95 transition-all"
            >
              VOLVER AL INICIO
            </button>
          </div>
        </div>

        {/* Hidden ticket for printing */}
        <div className="hidden">
           {selectedCustomer && (
             <SaleTicket 
               ref={ticketRef} 
               order={{ 
                 id: lastSavedId || '...', 
                 customerName: selectedCustomer.name, 
                 items: cart, 
                 total, 
                 timestamp: new Date().toISOString() 
               }} 
             />
           )}
        </div>
      </div>
    );
  }

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
        <h2 className="text-3xl font-sans font-bold text-center mb-4">
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
            <h2 className="text-2xl font-sans font-bold">Nueva Venta</h2>
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
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <Users size={14} className="opacity-40" /> Cliente
            </h3>
            {selectedCustomer && (
              <button 
                onClick={captureLocation}
                disabled={isLocating}
                className={cn(
                  "flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-all",
                  currentCoords ? "bg-stone-50 border-stone-300 text-stone-600" : "bg-editorial-ink text-white"
                )}
              >
                {isLocating ? <RefreshCcw size={12} className="animate-spin" /> : currentCoords ? <Navigation size={12} /> : <MapPin size={12} />}
                {currentCoords ? 'UBICACIÓN REGISTRADA' : 'REGISTRAR VISITA'}
              </button>
            )}
          </div>
          
          {distanceWarning && (
            <div className="bg-red-50 border border-red-200 p-3 flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-[10px] font-bold text-red-700 uppercase leading-tight tracking-wider">
                ADVERTENCIA: {distanceWarning}
              </p>
            </div>
          )}

          {!selectedCustomer ? (
            <div className="space-y-3">
              {customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedCustomer(c)}
                  className="w-full text-left p-6 border border-editorial-ink/10 hover:border-editorial-ink transition-all group"
                >
                  <p className="text-sm font-bold uppercase tracking-wider mb-1">{c.name}</p>
                  <p className="text-[10px] font-mono opacity-40">{c.address}</p>
                </button>
              ))}
              {customers.length === 0 && !loadingItems && (
                <p className="text-center py-10 text-[10px] font-bold uppercase tracking-widest opacity-40">No hay clientes registrados</p>
              )}
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
            <span className="text-[10px] font-mono opacity-40">{truckProducts.length} ITEMS</span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-editorial-ink opacity-40" size={16} />
            <input 
              type="text" 
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-editorial-ink/10 text-xs font-bold tracking-widest focus:border-editorial-ink outline-none transition-all shadow-sm"
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
                    <p className="text-sm font-sans font-bold text-editorial-ink">${p.price}</p>
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
              <span className="text-2xl font-sans font-bold text-editorial-ink">${total.toFixed(2)}</span>
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

      {/* Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-editorial-ink/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-ink w-full max-w-lg p-8 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-editorial-ink/5 pb-4">
              <div>
                <h4 className="text-xl font-sans font-bold text-editorial-ink">Prueba de Entrega</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Conformidad del Cliente</p>
              </div>
              <button 
                onClick={() => setShowSignature(false)}
                className="p-2 hover:bg-stone-100 transition-colors"
                disabled={isFinishing}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
               <div className="p-4 bg-stone-50 border border-editorial-ink/10 rounded-sm">
                    <div className="flex justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase opacity-40">Pedido Total:</span>
                    <span className="text-sm font-sans font-bold">${total.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-editorial-ink/10 pt-4 bg-white">
                    <SignatureCanvas 
                      ref={signatureRef}
                      penColor="black"
                      canvasProps={{
                        className: "w-full h-48 cursor-crosshair border-2 border-dashed border-stone-200",
                        style: { background: '#fff' }
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <button 
                      onClick={() => signatureRef.current?.clear()}
                      className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2 hover:opacity-100 transition-opacity"
                    >
                      <RotateCcw size={10} /> LIMPIAR
                    </button>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-20">FIRMAR DENTRO DEL RECUADRO</span>
                  </div>
               </div>
            </div>

            <button 
              onClick={confirmSaleWithSignature}
              disabled={isFinishing}
              className="w-full py-5 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 transition-all font-mono"
            >
              {isFinishing ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              CONFIRMAR Y FINALIZAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
