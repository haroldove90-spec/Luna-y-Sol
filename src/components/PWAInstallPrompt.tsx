import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Wait a bit before showing to not annoy the user immediately
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[100]"
        >
          <div className="bg-editorial-ink text-white p-6 shadow-2xl border border-white/10 relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-[#FF6321] opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity" />
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-12 h-12 bg-[#FF6321] flex items-center justify-center shrink-0">
                <Smartphone className="text-white" size={24} />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em]">Nueva Experiencia</h4>
                  <Sparkles size={12} className="text-[#FF6321] animate-pulse" />
                </div>
                <p className="text-lg font-sans font-bold leading-tight mb-2">Instala Luna y Sol</p>
                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed mb-6 uppercase tracking-wider">
                  Acceso rápido, modo offline y mejor rendimiento para tus rutas.
                </p>
                
                <button
                  onClick={handleInstall}
                  className="w-full py-4 bg-white text-editorial-ink text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#FF6321] hover:text-white transition-all active:scale-95"
                >
                  <Download size={14} /> INSTALAR APP
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
