import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Loader2, LogIn, Lock, Mail } from 'lucide-react';

export function Login() {
  const [userIdentifier, setUserIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Si no tiene @, asumimos que es un nombre de usuario y agregamos el dominio por defecto
    const finalEmail = userIdentifier.includes('@') 
      ? userIdentifier 
      : `${userIdentifier.trim()}@lunaysol.com.mx`;

    const { error } = await supabase.auth.signInWithPassword({
      email: finalEmail,
      password,
    });

    if (error) {
      toast.error('Credenciales inválidas: ' + error.message);
    } else {
      toast.success('Sesión iniciada correctamente');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#F4F5F7] z-[100] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-editorial-ink shadow-2xl p-12 space-y-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-editorial-ink text-white rounded-full flex items-center justify-center mx-auto text-3xl font-serif italic mb-6">L</div>
          <h2 className="text-4xl font-serif italic">Luna y Sol</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Protocolo de Acceso Seguro</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 flex items-center gap-2">
              <Mail size={12} /> Usuario o Email
            </label>
            <input 
              type="text"
              required
              value={userIdentifier}
              onChange={(e) => setUserIdentifier(e.target.value)}
              className="w-full border-b border-editorial-ink/20 py-3 outline-none focus:border-editorial-ink transition-all font-mono text-sm uppercase"
              placeholder="EJ: ADMIN o ADMIN@LGS.COM"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 flex items-center gap-2">
              <Lock size={12} /> Contraseña
            </label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-editorial-ink/20 py-3 outline-none focus:border-editorial-ink transition-all font-mono text-sm"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-editorial-ink text-white py-5 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            ENTRAR AL SISTEMA
          </button>
        </form>

        <div className="pt-8 border-t border-editorial-ink/5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 leading-relaxed italic">
            EL ACCESO NO AUTORIZADO ESTÁ MONITOREADO // 2024 V1.0
          </p>
        </div>
      </div>
    </div>
  );
}
