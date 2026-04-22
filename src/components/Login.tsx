import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Loader2, LogIn, Lock, Mail, Plus, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Si no tiene @, asumimos que es un nombre de usuario y agregamos el dominio por defecto
    const finalEmail = userIdentifier.trim().includes('@') 
      ? userIdentifier.trim()
      : `${userIdentifier.trim().toLowerCase()}@lunaysol.com.mx`;

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email: finalEmail,
        password: password.trim(),
        options: {
          data: {
            full_name: userIdentifier.split('@')[0] || 'Usuario',
            display_name: userIdentifier.split('@')[0] || 'Usuario',
            role: finalEmail.toLowerCase().includes('admin') ? 'admin' : 'driver',
          }
        }
      });
      
      if (error) {
        toast.error('Error al registrar: ' + error.message);
      } else {
        toast.success('Registro exitoso. Ahora puedes entrar.');
        setIsRegistering(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: password.trim(),
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Usuario o contraseña incorrectos. Verifica tus datos.');
        } else {
          toast.error('Error de acceso: ' + error.message);
        }
      } else {
        toast.success('Sesión iniciada correctamente');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#F4F5F7] z-[100] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-editorial-ink shadow-2xl p-12 space-y-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-editorial-ink text-white rounded-full flex items-center justify-center mx-auto text-3xl font-sans font-bold mb-6">L</div>
          <h2 className="text-4xl font-sans font-bold">Luna y Sol</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
            {isRegistering ? 'Registro de Nueva Cuenta' : 'Protocolo de Acceso Seguro'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 flex items-center gap-2">
              <Mail size={12} /> Usuario o Email
            </label>
            <input 
              type="text"
              required
              value={userIdentifier}
              onChange={(e) => setUserIdentifier(e.target.value)}
              className="w-full border-b border-editorial-ink/20 py-3 outline-none focus:border-editorial-ink transition-all font-sans text-sm"
              placeholder="Ej: admin o admin@lunaysol.com.mx"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 flex items-center gap-2">
              <Lock size={12} /> Contraseña
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-editorial-ink/20 py-3 outline-none focus:border-editorial-ink transition-all font-sans text-sm"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 opacity-40 hover:opacity-100 transition-opacity"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-editorial-ink text-white py-5 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (isRegistering ? <Plus size={16} /> : <LogIn size={16} />)}
              {isRegistering ? 'CREAR CUENTA' : 'ENTRAR AL SISTEMA'}
            </button>

            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-[9px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Registrate aquí'}
            </button>
          </div>
        </form>

        <div className="pt-8 border-t border-editorial-ink/5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 leading-relaxed">
            EL ACCESO NO AUTORIZADO ESTÁ MONITOREADO // 2024 V1.0
          </p>
        </div>
      </div>
    </div>
  );
}
