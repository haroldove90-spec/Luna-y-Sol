import Dexie, { type Table } from 'dexie';

export interface OfflineOrder {
  id?: number;
  customerId: string;
  customerName: string;
  items: any[];
  total: number;
  status: 'pending' | 'synced' | 'failed';
  createdAt: string;
  error?: string;
}

export class LunaYSolDB extends Dexie {
  orders!: Table<OfflineOrder>;

  constructor() {
    super('LunaYSolDB');
    this.version(1).stores({
      orders: '++id, customerId, status, createdAt' // Primary key and indexed fields
    });
  }
}

export const db = new LunaYSolDB();
