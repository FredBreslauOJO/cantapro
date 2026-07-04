import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function LoadingScreen({ message = "Carregando..." }) {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    // Inicia a contagem de 5 segundos em silêncio assim que a tela abre
    const timer = setTimeout(() => {
      setShowReload(true);
    }, 5000);

    // Se o componente carregar antes de 5s, ele se autodestrói e limpa o timer
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 font-sans text-black select-none">
      <div className="flex flex-col items-center">
        
        <Loader2 size={40} className="animate-spin text-black mb-6" strokeWidth={1.5} />
        
        <h2 className="text-xs font-black uppercase tracking-widest text-black/50 text-center">
          {message}
        </h2>

        {/* ÁREA DE EMERGÊNCIA (Oculta por padrão) */}
        <div
          className={`transition-all duration-700 ease-out flex flex-col items-center mt-12 overflow-hidden ${
            showReload ? 'opacity-100 translate-y-0 h-auto' : 'opacity-0 translate-y-4 h-0 pointer-events-none'
          }`}
        >
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center mb-4 border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg">
            A conexão está instável
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <RefreshCw size={16} /> Forçar Recarregamento
          </button>
        </div>

      </div>
    </div>
  );
}