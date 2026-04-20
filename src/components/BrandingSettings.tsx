import React, { useState } from 'react';
import { Palette, Upload, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface BrandingConfig {
  primaryColor: string;
  sidebarBg: string;
  sidebarText: string;
  logoUrl: string;
  appName: string;
}

interface BrandingSettingsProps {
  config: BrandingConfig;
  onChange: (config: BrandingConfig) => void;
}

export function BrandingSettings({ config, onChange }: BrandingSettingsProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onChange(localConfig);
    localStorage.setItem('branding_config', JSON.stringify(localConfig));
    toast.success('Configuración de imagen corporativa actualizada');
  };

  const handleReset = () => {
    const defaults = {
      primaryColor: '#4ADE80',
      sidebarBg: '#2D2D3A',
      sidebarText: '#FFFFFF',
      logoUrl: '',
      appName: 'Luna y Sol'
    };
    setLocalConfig(defaults);
    onChange(defaults);
    localStorage.removeItem('branding_config');
    toast.info('Valores restaurados por defecto');
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-4xl">
      <div className="border-b border-editorial-ink pb-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Personalización Pro</h3>
        <p className="text-4xl font-serif italic mt-2">Imagen Corporativa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} /> Colores de Marca
            </h4>
            <div className="grid grid-cols-1 gap-6 p-6 bg-white border border-editorial-ink/10">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold opacity-40">Color Primario (Acción)</label>
                  <span className="text-[10px] font-mono">{localConfig.primaryColor}</span>
                </div>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={localConfig.primaryColor}
                    onChange={(e) => setLocalConfig({...localConfig, primaryColor: e.target.value})}
                    className="w-12 h-12 border-none cursor-pointer bg-transparent"
                  />
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: localConfig.primaryColor }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold opacity-40">Fondo del Menú</label>
                  <span className="text-[10px] font-mono">{localConfig.sidebarBg}</span>
                </div>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={localConfig.sidebarBg}
                    onChange={(e) => setLocalConfig({...localConfig, sidebarBg: e.target.value})}
                    className="w-12 h-12 border-none cursor-pointer bg-transparent"
                  />
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: localConfig.sidebarBg }}></div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Upload size={14} /> Identidad Visual
            </h4>
            <div className="p-6 bg-white border border-editorial-ink/10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold opacity-40">Nombre de la Aplicación</label>
                <input 
                  type="text"
                  value={localConfig.appName}
                  onChange={(e) => setLocalConfig({...localConfig, appName: e.target.value})}
                  className="w-full border-b border-editorial-ink/20 py-2 font-serif italic text-lg outline-none focus:border-editorial-ink transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold opacity-40">URL del Logo (Opcional)</label>
                <input 
                  type="text"
                  placeholder="https://tu-sitio.com/logo.png"
                  value={localConfig.logoUrl}
                  onChange={(e) => setLocalConfig({...localConfig, logoUrl: e.target.value})}
                  className="w-full border-b border-editorial-ink/20 py-2 font-mono text-xs outline-none focus:border-editorial-ink transition-all"
                />
                <p className="text-[9px] opacity-40">Se recomienda un logo circular con fondo transparente.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="border-l-2 border-editorial-ink pl-8 space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest">Vista Previa del Menú</h4>
            <div 
              className="w-64 aspect-[4/5] p-6 shadow-2xl flex flex-col items-center justify-between transition-all duration-500 rounded-sm"
              style={{ backgroundColor: localConfig.sidebarBg, color: localConfig.sidebarText }}
            >
              <div className="flex flex-col items-center space-y-4 mt-8">
                {localConfig.logoUrl ? (
                  <img src={localConfig.logoUrl} alt="Logo" className="w-20 h-20 rounded-full object-cover border-4" style={{ borderColor: localConfig.primaryColor }} referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-white border-4" style={{ backgroundColor: localConfig.primaryColor, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-3xl font-serif italic">{localConfig.appName.charAt(0)}</span>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-lg font-serif italic">{localConfig.appName}</p>
                  <p className="text-[8px] opacity-40 tracking-widest uppercase mt-1">SISTEMA EMPRESARIAL</p>
                </div>
              </div>

              <div className="w-full space-y-2 mb-8">
                 <div className="w-full h-8 flex items-center px-4 text-[10px] uppercase font-bold tracking-widest rounded-sm" style={{ backgroundColor: localConfig.primaryColor, color: '#000' }}>
                   Dashboard
                 </div>
                 <div className="w-full h-8 flex items-center px-4 text-[10px] uppercase font-bold tracking-widest opacity-40">
                   Ventas
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-12 border-t border-editorial-ink/5">
        <button 
          onClick={handleSave}
          className="px-10 py-5 bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 transition-transform active:scale-95 shadow-xl"
        >
          <Check size={16} /> APLICAR CAMBIOS
        </button>
        <button 
          onClick={handleReset}
          className="px-10 py-5 border border-editorial-ink text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-stone-50 transition-colors"
        >
          <RefreshCw size={16} /> RESTAURAR
        </button>
      </div>
    </div>
  );
}
