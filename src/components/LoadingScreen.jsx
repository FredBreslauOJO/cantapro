import React, { useState, useEffect } from 'react';
import { Loader2, CloudOff } from 'lucide-react';

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

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 font-sans text-black select-none">
      <div className="flex flex-col items-center">
        
        <Loader2 size={40} className="animate-spin text-black mb-6" strokeWidth={1.5} />
        
        <h2 className="text-xs font-black uppercase tracking-widest text-black/50 text-center">
          {message}
        </h2>

        {/* ÁREA DE EMERGÊNCIA */}
        <div
          className={`transition-all duration-700 ease-out flex flex-col items-center mt-12 overflow-hidden ${
            showEmergency ? 'opacity-100 translate-y-0 h-auto' : 'opacity-0 translate-y-4 h-0 pointer-events-none'
          }`}
        >
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest text-center mb-4 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg">
            Demorando muito?
          </p>
          
          <button
            onClick={handleEmergencyClick}
            className="px-6 py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <CloudOff size={16} /> Forçar Modo Offline
          </button>
        </div>

      </div>
    </div>
  );
}