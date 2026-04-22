import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type OfflineOrder } from './db';

import { supabase } from './supabase';

// Real Supabase sync function
async function syncToSupabase(order: OfflineOrder) {
  console.log('--- Sincronizando pedido con Supabase ---', order.id);
  
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([{
      customer_id: order.customerId,
      vehicle_id: order.vehicleId,
      driver_id: order.driverId,
      total_amount: order.total,
      status: 'delivered',
      signature_url: order.signatureUrl,
      lat: order.lat,
      lng: order.lng,
      created_at: order.createdAt
    }])
    .select();

  if (orderError) throw orderError;

  // Insert items
  const orderItems = order.items.map(item => ({
    order_id: orderData[0].id,
    product_id: item.id,
    quantity: item.quantity,
    unit_price: item.price,
    subtotal: item.price * item.quantity
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;
  
  return { success: true, id: orderData[0].id };
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get pending orders from IndexedDB
  const pendingOrders = useLiveQuery(
    () => db.orders.where('status').equals('pending').toArray()
  ) || [];

  const syncData = useCallback(async () => {
    if (!navigator.onLine || pendingOrders.length === 0 || isSyncing) return;

    setIsSyncing(true);
    console.log(`Iniciando sincronización de ${pendingOrders.length} pedidos...`);

    for (const order of pendingOrders) {
      try {
        const result = await syncToSupabase(order);
        if (result.success) {
          await db.orders.update(order.id!, { status: 'synced' });
          console.log(`Pedido ${order.id} sincronizado exitosamente.`);
        }
      } catch (error) {
        console.error(`Error sincronizando pedido ${order.id}:`, error);
        await db.orders.update(order.id!, { 
          status: 'failed', 
          error: (error as Error).message 
        });
      }
    }
    setIsSyncing(false);
  }, [pendingOrders, isSyncing]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and sync
    if (navigator.onLine) {
      syncData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncData]);

  const saveOrder = async (orderData: Omit<OfflineOrder, 'status' | 'createdAt'>) => {
    const newOrder: OfflineOrder = {
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const id = await db.orders.add(newOrder);
    
    // Attempt immediate sync if online
    if (navigator.onLine) {
      syncData();
    }
    
    return id;
  };

  return {
    isOnline,
    isSyncing,
    pendingCount: pendingOrders.length,
    saveOrder,
    syncData
  };
}
