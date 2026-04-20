import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Package, 
  Truck, 
  Users,
  MapPin,
  DollarSign
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces
interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  image_url?: string;
  category: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  driver_name: string;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  credit_limit: number;
  lat?: number;
  lng?: number;
}

export function ProductAdmin() {
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Agua Mineral 500ml', price: 1.5, unit: 'PZA', category: 'Bebidas' },
    { id: '2', name: 'Refresco Cola 1.5L', price: 2.8, unit: 'PZA', category: 'Bebidas' },
  ]);
  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    
    if (isEditing.id === 'new') {
      setProducts([...products, { ...isEditing, id: Math.random().toString() }]);
    } else {
      setProducts(products.map(p => p.id === isEditing.id ? isEditing : p));
    }
    setIsEditing(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-editorial-ink pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Catálogo Maestro</h3>
          <p className="text-4xl font-serif italic mt-2">Productos y Precios</p>
        </div>
        <button 
          onClick={() => setIsEditing({ id: 'new', name: '', price: 0, unit: 'PZA', category: '' })}
          className="flex items-center gap-3 px-6 py-3 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest"
        >
          <Plus size={16} /> NUEVO PRODUCTO
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-editorial-ink opacity-40" size={16} />
        <input 
          type="text" 
          placeholder="BUSCAR EN ARCHIVO..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-editorial-ink/10 text-xs font-bold uppercase tracking-widest focus:border-editorial-ink outline-none"
        />
      </div>

      <div className="bg-white border border-editorial-ink">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-editorial-ink bg-stone-50">
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest">PRODUCTO</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest">CATEGORÍA</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest">UNIDAD</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-right">PRECIO</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-editorial-ink/5 hover:bg-stone-50 transition-colors">
                <td className="p-4 font-bold uppercase tracking-wider">{p.name}</td>
                <td className="p-4 italic opacity-60">{p.category}</td>
                <td className="p-4 font-mono">{p.unit}</td>
                <td className="p-4 text-right font-serif italic text-lg">${p.price.toFixed(2)}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => setIsEditing(p)} className="hover:text-amber-600"><Edit2 size={14} /></button>
                    <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} className="hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-editorial-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-ink w-full max-w-lg p-10 animate-in zoom-in-95 duration-300">
            <h4 className="text-2xl font-serif italic mb-8">Editar Registro</h4>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Nombre del Producto</label>
                <input 
                  required
                  value={isEditing.name}
                  onChange={(e) => setIsEditing({...isEditing, name: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-bold uppercase tracking-wider focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Precio Unitario ($)</label>
                  <input 
                    type="number" step="0.01" required
                    value={isEditing.price}
                    onChange={(e) => setIsEditing({...isEditing, price: parseFloat(e.target.value)})}
                    className="w-full border-b-2 border-editorial-ink/10 py-2 font-mono focus:border-editorial-ink outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Unidad</label>
                  <select 
                    value={isEditing.unit}
                    onChange={(e) => setIsEditing({...isEditing, unit: e.target.value})}
                    className="w-full border-b-2 border-editorial-ink/10 py-2 font-bold focus:border-editorial-ink outline-none"
                  >
                    <option value="PZA">PZA</option>
                    <option value="KG">KG</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 bg-editorial-ink text-white py-4 text-[10px] font-bold uppercase tracking-widest">GUARDAR</button>
                <button type="button" onClick={() => setIsEditing(null)} className="flex-1 border border-editorial-ink py-4 text-[10px] font-bold uppercase tracking-widest">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function VehicleAdmin() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', plate: 'LYS-102', model: 'Isuzu ELF 300', driver_name: 'Sr. Arquitecto' },
    { id: '2', plate: 'LYS-205', model: 'GMC 3500', driver_name: 'Chofer Especialista' },
  ]);
  const [isEditing, setIsEditing] = useState<Vehicle | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    if (isEditing.id === 'new') {
      setVehicles([...vehicles, { ...isEditing, id: Math.random().toString() }]);
    } else {
      setVehicles(vehicles.map(v => v.id === isEditing.id ? isEditing : v));
    }
    setIsEditing(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-editorial-ink pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Gestión de Flotilla</h3>
          <p className="text-4xl font-serif italic mt-2">Unidades de Transporte</p>
        </div>
        <button 
          onClick={() => setIsEditing({ id: 'new', plate: '', model: '', driver_name: '' })}
          className="flex items-center gap-3 px-6 py-3 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest"
        >
          <Plus size={16} /> NUEVA UNIDAD
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {vehicles.map(v => (
          <div key={v.id} className="bg-white border border-editorial-ink p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setIsEditing(v)} className="p-2 hover:text-amber-600 transition-colors"><Edit2 size={16} /></button>
            </div>
            <Truck size={24} className="mb-6 opacity-40 text-stone-500" />
            <p className="text-2xl font-bold tracking-tighter mb-2">{v.plate}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-6">{v.model}</p>
            <div className="pt-6 border-t border-editorial-ink/10 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-mono opacity-40 uppercase">Chofer Asignado:</p>
                <p className="text-sm font-serif italic">{v.driver_name}</p>
              </div>
              <div className="w-12 h-1 bg-editorial-ink/10 group-hover:bg-editorial-ink transition-colors"></div>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-editorial-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-ink w-full max-w-lg p-10">
            <h4 className="text-2xl font-serif italic mb-8">Registro de Unidad</h4>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Placas</label>
                <input 
                  required value={isEditing.plate}
                  onChange={(e) => setIsEditing({...isEditing, plate: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-bold uppercase tracking-wider focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Modelo / Marca</label>
                <input 
                  required value={isEditing.model}
                  onChange={(e) => setIsEditing({...isEditing, model: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-bold focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Asignar Chofer</label>
                <input 
                  required value={isEditing.driver_name}
                  onChange={(e) => setIsEditing({...isEditing, driver_name: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-serif italic focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 bg-editorial-ink text-white py-4 text-[10px] font-bold uppercase tracking-widest">GUARDAR</button>
                <button type="button" onClick={() => setIsEditing(null)} className="flex-1 border border-editorial-ink py-4 text-[10px] font-bold uppercase tracking-widest">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomerAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Tienda La Bendición', address: 'Calle 5 #10-20', credit_limit: 5000 },
    { id: '2', name: 'Minimarket Luna', address: 'Av. Siempre Viva 742', credit_limit: 3500 },
  ]);
  const [isEditing, setIsEditing] = useState<Customer | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    if (isEditing.id === 'new') {
      setCustomers([...customers, { ...isEditing, id: Math.random().toString() }]);
    } else {
      setCustomers(customers.map(c => c.id === isEditing.id ? isEditing : c));
    }
    setIsEditing(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-editorial-ink pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Directorio de Clientes</h3>
          <p className="text-4xl font-serif italic mt-2">Puntos de Entrega</p>
        </div>
        <button 
          onClick={() => setIsEditing({ id: 'new', name: '', address: '', credit_limit: 0 })}
          className="flex items-center gap-3 px-6 py-3 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest"
        >
          <Plus size={16} /> NUEVO CLIENTE
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {customers.map(c => (
          <div key={c.id} className="bg-white border border-editorial-ink/10 flex items-center justify-between p-6 hover:border-editorial-ink transition-all group">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-editorial-bg flex items-center justify-center text-editorial-ink opacity-40">
                <Users size={20} />
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider">{c.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-mono opacity-40 flex items-center gap-1 uppercase"><MapPin size={10} /> {c.address}</span>
                  <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                  <span className="text-[10px] font-mono font-bold flex items-center gap-1 uppercase text-stone-600"><DollarSign size={10} /> LÍMITE: ${c.credit_limit}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => setIsEditing(c)} className="p-2 hover:bg-stone-50"><Edit2 size={16} /></button>
               <button onClick={() => setCustomers(customers.filter(item => item.id !== c.id))} className="p-2 hover:bg-stone-50 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-editorial-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-ink w-full max-w-lg p-10">
            <h4 className="text-2xl font-serif italic mb-8">Datos del Cliente</h4>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Razon Social</label>
                <input 
                  required value={isEditing.name}
                  onChange={(e) => setIsEditing({...isEditing, name: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-bold uppercase tracking-wider focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Dirección Completa</label>
                <input 
                  required value={isEditing.address}
                  onChange={(e) => setIsEditing({...isEditing, address: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Límite de Crédito ($)</label>
                <input 
                  type="number" required value={isEditing.credit_limit}
                  onChange={(e) => setIsEditing({...isEditing, credit_limit: parseFloat(e.target.value)})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-mono focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 bg-editorial-ink text-white py-4 text-[10px] font-bold uppercase tracking-widest">GUARDAR</button>
                <button type="button" onClick={() => setIsEditing(null)} className="flex-1 border border-editorial-ink py-4 text-[10px] font-bold uppercase tracking-widest">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
