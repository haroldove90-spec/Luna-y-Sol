import React, { useState } from 'react';
import { Bug, Send, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function ErrorReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');

  const sendReport = (provider: 'whatsapp' | 'email') => {
    const sysInfo = `
      --- System Info ---
      Browser: ${navigator.userAgent}
      Online: ${navigator.onLine}
      Path: ${window.location.pathname}
      Time: ${new Date().toISOString()}
    `;
    
    const message = `REPORTE DE ERROR LUNA Y SOL\n\nDescripción: ${description}\n\n${sysInfo}`;

    if (provider === 'whatsapp') {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      const url = `mailto:soporte@tu-empresa.com?subject=Error Sistema Luna y Sol&body=${encodeURIComponent(message)}`;
      window.location.href = url;
    }
    
    toast.success('Reporte iniciado');
    setIsOpen(false);
    setDescription('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white border border-editorial-ink/10 flex items-center justify-center rounded-full shadow-lg hover:border-editorial-ink transition-all z-40 group"
        title="Reportar Error"
      >
        <Bug size={18} className="opacity-40 group-hover:opacity-100 group-hover:text-red-500 transition-all" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-editorial-ink/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full border border-editorial-ink p-8 space-y-6">
            <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-xs font-bold uppercase tracking-[0.4em]">Soporte Técnico</h3>
                 <p className="text-xl font-sans font-bold">Informar una incidencia</p>
               </div>
               <button onClick={() => setIsOpen(false)}><X size={20} className="opacity-40" /></button>
            </div>

            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué sucedió? Explica paso a paso para ayudarte mejor..."
              className="w-full h-32 p-4 bg-stone-50 border border-editorial-ink/10 text-xs font-mono outline-none focus:border-editorial-ink transition-all resize-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => sendReport('whatsapp')}
                className="py-3 bg-[#25D366] text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                WHATSAPP <ExternalLink size={12} />
              </button>
              <button 
                onClick={() => sendReport('email')}
                className="py-3 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                EMAIL <Send size={12} />
              </button>
            </div>

            <p className="text-[9px] font-mono text-center opacity-40 uppercase">Se enviará información técnica automáticamente.</p>
          </div>
        </div>
      )}
    </>
  );
}
