import React, { useState, useMemo, useEffect } from 'react';
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
  DollarSign,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces
interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  unit: string;
  image_url?: string;
  category: string;
}

interface Vehicle {
  id: string;
  license_plate: string;
  model: string;
  assigned_driver_id: string | null;
  driver?: {
    full_name: string;
  };
}

interface Customer {
  id: string;
  name: string;
  address: string;
  credit_limit: number;
  lat?: number;
  lng?: number;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export function ProductAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Error al cargar productos: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    
    const productData = {
      sku: isEditing.sku,
      name: isEditing.name,
      price: isEditing.price,
      unit: isEditing.unit,
      category: isEditing.category
    };

    if (isEditing.id === 'new') {
      const { error } = await supabase.from('products').insert([productData]);
      if (error) toast.error('Error al crear producto: ' + error.message);
      else {
        toast.success('Producto creado');
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from('products').update(productData).eq('id', isEditing.id);
      if (error) toast.error('Error al actualizar producto: ' + error.message);
      else {
        toast.success('Producto actualizado');
        fetchProducts();
      }
    }
    setIsEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error('Error al eliminar: ' + error.message);
    else {
      toast.success('Producto eliminado');
      fetchProducts();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-editorial-ink pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Catálogo Maestro</h3>
          <p className="text-4xl font-sans mt-2">Productos y Precios</p>
        </div>
        <button 
          onClick={() => setIsEditing({ id: 'new', sku: '', name: '', price: 0, unit: 'PZA', category: '' })}
          className="flex items-center gap-3 px-6 py-3 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest"
        >
          <Plus size={16} /> NUEVO PRODUCTO
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-editorial-ink opacity-40" size={16} />
        <input 
          type="text" 
          placeholder="Buscar en archivo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-editorial-ink/10 text-xs font-bold tracking-widest focus:border-editorial-ink outline-none"
        />
      </div>

      <div className="bg-white border border-editorial-ink overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
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
                      <button onClick={() => handleDelete(p.id)} className="hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> cargando catálogo...</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-editorial-ink/10">
          {filtered.map(p => (
            <div key={p.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">{p.name}</p>
                  <p className="text-[10px] italic opacity-60">{p.category}</p>
                </div>
                <p className="text-lg font-serif italic font-bold">${p.price.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-mono opacity-40 uppercase">Unidad: {p.unit}</span>
                <div className="flex gap-4">
                  <button onClick={() => setIsEditing(p)} className="p-2 border border-editorial-ink/20"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 border border-red-100 text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          {loading && <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> cargando...</div>}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-editorial-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-ink w-full max-w-lg p-10 animate-in zoom-in-95 duration-300">
            <h4 className="text-2xl font-serif italic mb-8">Editar Registro</h4>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Código / SKU</label>
                  <input 
                    required
                    value={isEditing.sku}
                    onChange={(e) => setIsEditing({...isEditing, sku: e.target.value})}
                    className="w-full border-b-2 border-editorial-ink/10 py-2 font-mono uppercase tracking-wider focus:border-editorial-ink outline-none"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Nombre del Producto</label>
                  <input 
                    required
                    value={isEditing.name}
                    onChange={(e) => setIsEditing({...isEditing, name: e.target.value})}
                    className="w-full border-b-2 border-editorial-ink/10 py-2 font-bold uppercase tracking-wider focus:border-editorial-ink outline-none"
                  />
                </div>
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<{id: string, full_name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<Vehicle | null>(null);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriverData, setNewDriverData] = useState({ full_name: '', email: '' });

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'driver')
      .order('full_name'); 
    if (!error && data) setDrivers(data);
    setLoading(false);
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data: vData, error: vError } = await supabase
        .from('vehicles')
        .select('*, profiles:assigned_driver_id(full_name)')
        .order('license_plate');
      
      if (vError) throw vError;

      const formatted = vData.map((v: any) => ({
          ...v,
          driver: v.profiles
      }));
      setVehicles(formatted);
    } catch (err: any) {
      console.warn('Fallback fetch activated:', err.message);
      // Fallback logic for when join fails
      const { data: vehiclesRaw } = await supabase.from('vehicles').select('*').order('license_plate');
      const { data: profilesRaw } = await supabase.from('profiles').select('id, full_name');
      
      if (vehiclesRaw && profilesRaw) {
          const joined = vehiclesRaw.map(v => ({
              ...v,
              driver: profilesRaw.find(p => p.id === v.assigned_driver_id)
          }));
          setVehicles(joined);
      } else if (vehiclesRaw) {
          setVehicles(vehiclesRaw as any);
      }
    }
    setLoading(false);
  };

  const handleQuickDriverSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverData.full_name || !newDriverData.email) {
      toast.error('Nombre y Email son requeridos');
      return;
    }

    setLoading(true);
    try {
      const tempId = crypto.randomUUID();
      // Aseguramos que el select regrese el registro para tener el ID real generado por DB si aplica
      const { data: inserted, error: insErr } = await supabase
        .from('profiles')
        .insert([{
          id: tempId,
          full_name: newDriverData.full_name.trim().toUpperCase(),
          email: newDriverData.email.trim().toLowerCase(),
          role: 'driver'
        }])
        .select()
        .single();

      if (insErr) {
          if (insErr.code === '23505') throw new Error('Este email ya existe en el sistema.');
          throw insErr;
      }

      // IMPORTANTE: Priorizamos el ID que regresa Supabase
      const realId = inserted?.id || tempId;
      const driverName = (inserted?.full_name || newDriverData.full_name).toUpperCase();
      
      toast.success(`Chofer ${driverName} registrado`);
      
      // Actualizar catálogo local de inmediato para que el dropdown lo vea
      const newEntry = { id: realId, full_name: driverName };
      setDrivers(prev => {
        const exists = prev.some(d => d.id === realId);
        if (exists) return prev;
        return [...prev, newEntry].sort((a,b) => a.full_name.localeCompare(b.full_name));
      });
      
      // Sincronizar en fondo
      fetchDrivers();
      
      if (isEditing) {
          setIsEditing({ ...isEditing, assigned_driver_id: realId });
      }
      
      setIsAddingDriver(false);
      setNewDriverData({ full_name: '', email: '' });
    } catch (err: any) {
      console.error('Error al crear chofer rápido:', err);
      toast.error('No se pudo crear el chofer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (vehicle: Vehicle | null) => {
    fetchDrivers();
    setIsEditing(vehicle);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;

    // Clean data for Supabase
    const driverId = (isEditing.assigned_driver_id && isEditing.assigned_driver_id.trim() !== '') 
      ? isEditing.assigned_driver_id 
      : null;

    const vehicleData: any = {
      license_plate: isEditing.license_plate.toUpperCase().trim(),
      model: isEditing.model.trim(),
      assigned_driver_id: driverId
    };

    // Verificación de integridad local (más permisiva para evitar bloqueos por delay de estado)
    if (driverId && drivers.length > 0 && !drivers.some(d => d.id === driverId)) {
      console.warn('Driver selected not in local list, syncing...');
      await fetchDrivers();
    }

    try {
      if (isEditing.id === 'new') {
        const { error } = await supabase.from('vehicles').insert([vehicleData]);
        if (error) throw error;
        toast.success('Vehículo registrado exitosamente');
      } else {
        const { error } = await supabase.from('vehicles').update(vehicleData).eq('id', isEditing.id);
        if (error) throw error;
        toast.success('Registro de flotilla actualizado');
      }
      setIsEditing(null);
      fetchVehicles();
    } catch (error: any) {
      console.error('Error en operación de flotilla:', error);
      if (error.code === '23503') {
        toast.error(`Error: El id de chofer (${driverId}) no es válido o ya no existe. Intente recargar.`);
        fetchDrivers();
      } else if (error.code === '23505') {
        toast.error('Error: Ya existe una unidad registrada con estas placas.');
      } else {
        toast.error('No se pudo guardar: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar unidad?')) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Unidad eliminada');
      fetchVehicles();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-editorial-ink pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Gestión de Flotilla</h3>
          <p className="text-4xl font-sans mt-2">Unidades de Transporte</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { fetchVehicles(); fetchDrivers(); toast.info('Datos sincronizados'); }}
            className="flex items-center gap-3 px-6 py-3 border border-editorial-ink text-editorial-ink text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors"
          >
            <RefreshCcw size={16} className={cn(loading && "animate-spin")} /> ACTUALIZAR
          </button>
          <button 
            onClick={() => openEditModal({ id: 'new', license_plate: '', model: '', assigned_driver_id: '' })}
            className="flex items-center gap-3 px-6 py-3 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest"
          >
            <Plus size={16} /> NUEVA UNIDAD
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {vehicles.map(v => (
          <div key={v.id} className="bg-white border border-editorial-ink p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button onClick={() => openEditModal(v)} className="p-2 hover:text-amber-600 transition-colors"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(v.id)} className="p-2 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
            </div>
            <Truck size={24} className="mb-6 opacity-40 text-stone-500" />
            <p className="text-2xl font-bold tracking-tighter mb-2">{v.license_plate}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-6">{v.model}</p>
            <div className="pt-6 border-t border-editorial-ink/10 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-mono opacity-40 uppercase">Chofer Asignado:</p>
                <p className="text-[11px] font-bold uppercase tracking-wider">{v.driver?.full_name || 'SIN ASIGNAR'}</p>
              </div>
              <div className="w-12 h-1 bg-editorial-ink/10 group-hover:bg-editorial-ink transition-colors"></div>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-editorial-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-ink w-full max-w-lg p-10">
            <h4 className="text-2xl font-sans mb-8">Registro de Unidad</h4>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Placas</label>
                <input 
                  required value={isEditing.license_plate}
                  onChange={(e) => setIsEditing({...isEditing, license_plate: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-sans focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Modelo / Marca</label>
                <input 
                  required value={isEditing.model}
                  onChange={(e) => setIsEditing({...isEditing, model: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-sans focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Asignar Chofer</label>
                  <button 
                    type="button"
                    onClick={() => setIsAddingDriver(true)}
                    className="text-[10px] font-bold text-editorial-ink underline uppercase tracking-widest"
                  >
                    + Nuevo Chofer
                  </button>
                </div>

                {isAddingDriver ? (
                    <div className="p-6 bg-stone-50 border border-editorial-ink/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center mb-2">
                             <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Registro Rápido de Chofer</p>
                             <button type="button" onClick={() => setIsAddingDriver(false)}><X size={14} /></button>
                        </div>
                        <input 
                            placeholder="NOMBRE COMPLETO"
                            value={newDriverData.full_name}
                            onChange={(e) => setNewDriverData({...newDriverData, full_name: e.target.value})}
                            className="w-full border-b border-editorial-ink/20 bg-transparent py-2 text-xs font-bold uppercase tracking-wider focus:border-editorial-ink outline-none"
                        />
                        <input 
                            placeholder="EMAIL / USUARIO"
                            type="email"
                            value={newDriverData.email}
                            onChange={(e) => setNewDriverData({...newDriverData, email: e.target.value})}
                            className="w-full border-b border-editorial-ink/20 bg-transparent py-2 text-xs font-mono focus:border-editorial-ink outline-none"
                        />
                        <button 
                            type="button"
                            onClick={handleQuickDriverSave}
                            className="w-full bg-editorial-ink text-white py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
                        >
                            DAR DE ALTA Y ASIGNAR
                        </button>
                    </div>
                ) : (
                    <select 
                      value={isEditing.assigned_driver_id || ''}
                      onChange={(e) => setIsEditing({...isEditing, assigned_driver_id: e.target.value || null})}
                      className="w-full border-b-2 border-editorial-ink/10 py-3 font-sans focus:border-editorial-ink outline-none bg-transparent"
                    >
                      <option value="">Seleccionar Chofer</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                    </select>
                )}
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) toast.error('Error: ' + error.message);
    else setCustomers(data || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;

    const customerData = {
      name: isEditing.name,
      address: isEditing.address,
      credit_limit: isEditing.credit_limit
    };

    if (isEditing.id === 'new') {
      const { error } = await supabase.from('customers').insert([customerData]);
      if (error) toast.error(error.message);
      else {
        toast.success('Cliente registrado');
        fetchCustomers();
      }
    } else {
      const { error } = await supabase.from('customers').update(customerData).eq('id', isEditing.id);
      if (error) toast.error(error.message);
      else {
        toast.success('Perfil actualizado');
        fetchCustomers();
      }
    }
    setIsEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar cliente del archivo?')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Cliente eliminado');
      fetchCustomers();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-editorial-ink pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Directorio de Clientes</h3>
          <p className="text-4xl font-sans mt-2">Puntos de Entrega</p>
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
               <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-stone-50 hover:text-red-600"><Trash2 size={16} /></button>
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

export function DriverAdmin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<Profile | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    if (error) {
      toast.error('Error al cargar usuarios: ' + error.message);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const filtered = profiles.filter(p => 
    (p.full_name?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (p.email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    
    const updateData = {
      full_name: isEditing.full_name,
      role: isEditing.role,
      email: isEditing.email
    };

    if (isEditing.id === 'new') {
      const tempId = crypto.randomUUID();
      const { data: inserted, error: insErr } = await supabase.from('profiles').insert([{...updateData, id: tempId}]).select().single();
      
      if (insErr) {
        toast.error('Error al crear: ' + insErr.message);
      } else {
        const realProfile = inserted || { ...updateData, id: tempId, created_at: new Date().toISOString() };
        toast.success(`Perfil ${isEditing.full_name.toUpperCase()} creado`);
        
        // Optimistic update
        setProfiles(prev => [...prev, realProfile as Profile].sort((a,b) => a.full_name.localeCompare(b.full_name)));
        
        fetchProfiles();
        setIsEditing(null);
      }
    } else {
      const { error } = await supabase.from('profiles').update(updateData).eq('id', isEditing.id);
      if (error) toast.error('Error al actualizar: ' + error.message);
      else {
        toast.success('Perfil actualizado');
        fetchProfiles();
        setIsEditing(null);
      }
    }
  };

  const handleToggleRole = async (profile: Profile) => {
    const newRole = profile.role === 'admin' ? 'driver' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    if (error) toast.error('Error: ' + error.message);
    else {
      toast.success(`Rol cambiado a ${newRole}`);
      fetchProfiles();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-editorial-ink pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Gestión de Personal</h3>
          <p className="text-4xl font-sans mt-2">Choferes y Usuarios</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={() => { fetchProfiles(); toast.info('Listado actualizado'); }}
            className="flex items-center gap-3 px-6 py-3 border border-editorial-ink text-editorial-ink text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-all font-mono"
          >
            <RefreshCcw size={16} className={cn(loading && "animate-spin")} /> SINCRONIZAR
          </button>
           <button 
            onClick={() => setIsEditing({ id: 'new', full_name: '', role: 'driver', email: '', created_at: '' })}
            className="flex items-center gap-3 px-6 py-3 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest"
          >
            <Plus size={16} /> NUEVO CHOFER
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-editorial-ink opacity-40" size={16} />
        <input 
          type="text" 
          placeholder="Buscar personal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-editorial-ink/10 text-xs font-bold tracking-widest focus:border-editorial-ink outline-none"
        />
      </div>

      <div className="bg-white border border-editorial-ink overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-editorial-ink bg-stone-50">
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest">NOMBRE COMPLETO</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest">EMAIL / USUARIO</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest">ROL</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-editorial-ink/5 hover:bg-stone-50 transition-colors">
                <td className="p-4 font-bold uppercase tracking-wider">{p.full_name}</td>
                <td className="p-4 font-mono opacity-60 lowercase">{p.email}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-1 text-[9px] font-bold uppercase tracking-tighter",
                    p.role === 'admin' ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                  )}>
                    {p.role}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => handleToggleRole(p)} 
                      title="Cambiar Rol"
                      className="p-2 hover:bg-stone-100 transition-colors"
                    >
                      <Truck className={cn("transition-colors", p.role === 'driver' ? "text-blue-600" : "text-stone-300")} size={14} />
                    </button>
                    <button 
                      onClick={() => setIsEditing(p)} 
                      className="p-2 hover:bg-stone-100 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={async () => {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user && user.id === p.id) {
                          toast.error('No puedes eliminar tu propio perfil de administrador.');
                          return;
                        }

                        if (!confirm('¿Confirma la eliminación TOTAL de este perfil? Esta acción es irreversible.')) return;
                        
                        try {
                          // 1. Desvincular de vehículos (NULLABLE)
                          await supabase
                            .from('vehicles')
                            .update({ assigned_driver_id: null })
                            .eq('assigned_driver_id', p.id);
                          
                          // 2. Intentar borrar perfil
                          const { error: delErr, count } = await supabase
                            .from('profiles')
                            .delete({ count: 'exact' })
                            .eq('id', p.id);

                          if (delErr) {
                            if (delErr.code === '23503') {
                              throw new Error('Este chofer tiene historial de ventas. No puede ser borrado, solo inactivado (cambiando su rol).');
                            }
                            throw delErr;
                          }

                          // Si count es null o undefined, confiamos en que no hubo error
                          const deletedCount = count ?? 1;

                          if (deletedCount === 0) {
                            console.warn('Delete executed but count was 0. Probable RLS restriction.');
                            throw new Error('No se borró el registro. Verifique que tenga permisos de administrador.');
                          }

                          toast.success('Perfil eliminado correctamente');
                          
                          // Actualización local ATÓMICA e INMEDIATA
                          setProfiles(prev => prev.filter(item => item.id !== p.id));
                          
                          // Recargar de servidor para estar sincronizados al 100%
                          await fetchProfiles();
                        } catch (error: any) {
                          console.error('Delete error details:', error);
                          toast.error(error.message || 'Error al intentar eliminar');
                          fetchProfiles(); // Revertir si falló algo raro
                        }
                      }} 
                      className="p-2 hover:bg-stone-100 transition-colors hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> cargando personal...</td></tr>}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-editorial-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-ink w-full max-w-lg p-10">
            <h4 className="text-2xl font-serif italic mb-8">Editar Perfil</h4>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Nombre Completo</label>
                <input 
                  required
                  value={isEditing.full_name}
                  onChange={(e) => setIsEditing({...isEditing, full_name: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-bold uppercase tracking-wider focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Email / ID de Usuario</label>
                <input 
                  required
                  type="email"
                  value={isEditing.email}
                  onChange={(e) => setIsEditing({...isEditing, email: e.target.value.toLowerCase()})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-mono focus:border-editorial-ink outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Rol de Usuario</label>
                <select 
                  value={isEditing.role}
                  onChange={(e) => setIsEditing({...isEditing, role: e.target.value})}
                  className="w-full border-b-2 border-editorial-ink/10 py-2 font-bold focus:border-editorial-ink outline-none bg-transparent"
                >
                  <option value="driver">CHOFER / LOGÍSTICA</option>
                  <option value="admin">ADMINISTRADOR</option>
                </select>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 bg-editorial-ink text-white py-4 text-[10px] font-bold uppercase tracking-widest">GUARDAR CAMBIOS</button>
                <button type="button" onClick={() => setIsEditing(null)} className="flex-1 border border-editorial-ink py-4 text-[10px] font-bold uppercase tracking-widest">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
