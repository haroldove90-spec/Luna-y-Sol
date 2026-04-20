import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type OfflineOrder } from './db';

// Mock Supabase sync function
async function syncToSupabase(order: OfflineOrder) {
  console.log('--- Intentando sincronizar pedido con Supabase ---', order);
  
  // Simulamos un retraso de red
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulamos éxito
  return { success: true, id: order.id };
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
