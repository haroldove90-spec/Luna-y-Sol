import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, WifiOff, Flag, ChevronRight, X, Info } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    title: "1. Carga Inteligente",
    description: "Antes de salir, revisa el inventario sugerido por la IA para asegurar que llevas lo que tus clientes necesitan.",
    icon: <Truck size={32} />
  },
  {
    title: "2. Venta Offline",
    description: "Vende en cualquier parte. Si no hay señal, tus ventas se guardan en el dispositivo y se sincronizan solas al volver.",
    icon: <WifiOff size={32} />
  },
  {
    title: "3. Cierre de Ruta",
    description: "Al finalizar, realiza el arqueo de caja y confirma el stock sobrante para liquidar tu jornada.",
    icon: <Flag size={32} />
  }
];

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(() => !localStorage.getItem('onboarding_completed'));
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      close();
    }
  };

  const close = () => {
    setIsOpen(false);
    localStorage.setItem('onboarding_completed', 'true');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-editorial-ink/90 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white max-w-sm w-full border border-editorial-ink shadow-2xl relative"
        >
          <button 
            onClick={close}
            className="absolute top-4 right-4 text-editorial-ink opacity-40 hover:opacity-100 transition-opacity"
          >
            <X size={20} />
          </button>

          <div className="p-10 space-y-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-editorial-ink">
                {steps[currentStep].icon}
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold tracking-[0.3em] opacity-40 uppercase">
                  Paso {currentStep + 1} de {steps.length}
                </p>
                <h3 className="text-2xl font-serif italic">{steps[currentStep].title}</h3>
                <p className="text-sm opacity-60 leading-relaxed font-sans">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 transition-all duration-500 rounded-full ${i === currentStep ? 'w-8 bg-editorial-ink' : 'w-2 bg-stone-200'}`} 
                />
              ))}
            </div>

            <button 
              onClick={next}
              className="w-full py-4 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 group active:scale-95 transition-all"
            >
              {currentStep === steps.length - 1 ? '¡EMPEZAR RUTA!' : 'SIGUIENTE PASO'}
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="bg-stone-50 p-4 border-t border-editorial-ink/5 flex items-center gap-3 justify-center">
             <Info size={14} className="opacity-40" />
             <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest">Manual Luna y Sol v1.0 PRO</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
