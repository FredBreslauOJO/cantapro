import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle } from 'lucide-react';

export default function Success() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center animate-fadeIn selection:bg-yellow-400 selection:text-black">
      
      <div className="bg-white border-4 border-black p-8 sm:p-10 rounded-3xl max-w-md w-full shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] relative">
        
        {/* Ícone de Destaque */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 w-16 h-16 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Zap size={28} className="text-black fill-current" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black mt-6 mb-2">
          BEM VINDO AO CANTA.PRO
        </h1>
        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">
          Pagamento confirmado. O palco é todo seu.
        </p>
        
        <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-5 mb-8">
          <ul className="text-left space-y-4 text-black font-black text-[10px] sm:text-xs uppercase tracking-wider">
            <li className="flex items-center gap-3">
              <CheckCircle size={18} className="text-green-500" /> Setlists Ilimitados
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle size={18} className="text-green-500" /> Colaboração & Compartilhamento
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle size={18} className="text-green-500" /> Sincronia Timecode Ativada
            </li>
          </ul>
        </div>

        <button 
          onClick={() => navigate('/setlists')}
          className="w-full h-14 bg-yellow-400 text-black border-2 border-black rounded-xl font-black uppercase tracking-widest hover:bg-yellow-300 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          Ir para Meus Setlists
        </button>

      </div>
    </div>
  );
}