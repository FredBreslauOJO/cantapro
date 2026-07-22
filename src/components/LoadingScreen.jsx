import React, { useState, useEffect } from 'react';
import { Loader2, CloudOff, RefreshCw } from 'lucide-react';

export default function LoadingScreen({ message = "Carregando..." }) {
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    // Inicia a contagem de 4 segundos em silêncio assim que a tela abre
    const timer = setTimeout(() => {
      setShowEmergency(true);
    }, 4000);

    // Se o componente carregar antes de 4s, ele se autodestrói e limpa o timer
    return () => clearTimeout(timer);
  }, []);

  const handleEmergencyClick = () => {
    // 1. Grava na sessão que o usuário exigiu o modo offline
    sessionStorage.setItem('canta_force_offline', 'true');
    // 2. Recarrega a página para o app nascer já sabendo dessa regra
    window.location.reload();
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-neutral-900 border-2 border-white/10 p-8 rounded-[2rem] w-[90%] max-w-sm flex flex-col items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-all">
        
        <Loader2 size={40} className="animate-spin text-white mb-4" strokeWidth={1.5} />
        
        <h2 className="text-xs font-black uppercase tracking-widest text-white/50 text-center">
          {message}
        </h2>

        {/* ÁREA DE EMERGÊNCIA (Revelada após 4s) */}
        <div
          className={`w-full transition-all duration-700 ease-out flex flex-col items-center overflow-hidden ${
            showEmergency ? 'opacity-100 mt-8 h-auto' : 'opacity-0 h-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleReload}
              className="w-full py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Recarregar
            </button>

            <button
              onClick={handleEmergencyClick}
              className="w-full py-4 bg-neutral-800 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CloudOff size={16} /> Forçar Modo Offline
            </button>
          </div>

          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center mt-5">
            Demorando muito para carregar?
          </p>
        </div>

      </div>
    </div>
  );
}