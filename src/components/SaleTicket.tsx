import React from 'react';

interface TicketProps {
  order: {
    id: string | number;
    customerName: string;
    items: any[];
    total: number;
    timestamp: string;
  };
}

export const SaleTicket = React.forwardRef<HTMLDivElement, TicketProps>(({ order }, ref) => {
  const subtotal = order.total / 1.16;
  const ivatotal = order.total - subtotal;

  return (
    <div 
      ref={ref} 
      className="w-[80mm] p-4 bg-white text-black font-mono text-[11px] leading-tight"
      style={{ margin: '0 auto' }}
    >
      <div className="text-center mb-4 border-b border-dashed border-black pb-2">
        <h2 className="text-sm font-bold uppercase">LUNA Y SOL</h2>
        <p className="text-[9px]">SISTEMA DE VENTAS EN RUTA</p>
        <p className="text-[9px]">Calle Principal #123, CP 50000</p>
        <p className="text-[9px]">RFC: LYS240420-ABC</p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between uppercase">
          <span>Folio:</span>
          <span className="font-bold"># {order.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Fecha:</span>
          <span>{new Date(order.timestamp).toLocaleString('es-MX')}</span>
        </div>
        <div className="mt-2 text-[10px] font-bold uppercase">Cliente:</div>
        <div className="uppercase">{order.customerName}</div>
      </div>

      <div className="border-b border-dashed border-black mb-2"></div>
      
      <div className="mb-2">
        <div className="flex justify-between font-bold mb-1 uppercase">
          <span className="w-1/2">Producto</span>
          <span className="w-1/4 text-center">Cant</span>
          <span className="w-1/4 text-right">SubT</span>
        </div>
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between mb-1">
            <span className="w-1/2 uppercase text-[10px]">{item.name.substring(0, 15)}</span>
            <span className="w-1/4 text-center">{item.quantity}</span>
            <span className="w-1/4 text-right">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-b border-dashed border-black mb-2"></div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA (16%):</span>
          <span>${ivatotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-[12px] pt-1">
          <span>TOTAL:</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-6 pt-4 border-t border-dashed border-black">
        <p className="uppercase text-[9px]">Gracias por su compra</p>
        <p className="text-[8px] mt-1 italic">Este no es un comprobante fiscal</p>
        <div className="mt-4 flex justify-center">
            <div className="w-20 h-2 bg-black"></div>
        </div>
      </div>
    </div>
  );
});

SaleTicket.displayName = 'SaleTicket';
