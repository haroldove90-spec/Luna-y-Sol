import Dexie, { type Table } from 'dexie';

export interface OfflineOrder {
  id?: number;
  vehicleId: string;
  driverId: string;
  customerId: string;
  customerName: string;
  items: any[];
  total: number;
  status: 'pending' | 'synced' | 'failed';
  createdAt: string;
  signatureUrl?: string;
  lat?: number | null;
  lng?: number | null;
  coords?: { lat: number, lng: number } | null;
  distanceWarn?: string | null;
  error?: string;
}

export class LunaYSolDB extends Dexie {
  orders!: Table<OfflineOrder>;

  constructor() {
    super('LunaYSolDB');
    this.version(2).stores({
      orders: '++id, customerId, vehicleId, driverId, status, createdAt' // Primary key and indexed fields
    });
  }
}

export const db = new LunaYSolDB();
