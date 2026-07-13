import React from 'react';
import { X, Check, Zap, Crown } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function PaywallModal({ isOpen, onClose, currentPlan }) {
  const { user } = useAuth();
  if (!isOpen) return null;

  // LINKS OFICIAIS DE PRODUÇÃO (LIVE)
  const BASE_CHECKOUT_LINK = `https://buy.stripe.com/bJe28r4VTboafjVeP567S00?prefilled_email=${user?.email || ''}&locale=pt-BR`;
  const PRO_CHECKOUT_LINK = `https://buy.stripe.com/9B6eVddsp77U4FhbCT67S01?prefilled_email=${user?.email || ''}&locale=pt-BR`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn select-none bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] border-4 border-black relative max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors z-10 text-black">
          <X size={20} />
        </button>

        {/* Lado Esquerdo - Plano Base */}
        <div className="flex-1 p-8 md:p-12 border-b-4 md:border-b-0 md:border-r-4 border-black bg-white flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-black uppercase tracking-widest text-black mb-6 border border-black/10">
              <Zap size={14} /> Plano Base
            </div>
            
            <div className="mb-8">
              <span className="text-5xl font-black tracking-tighter text-black">R$4,99</span>
              <span className="text-sm font-bold text-black/40 uppercase tracking-widest ml-2">/mês</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm font-bold text-black/80"><Check size={18} className="text-black shrink-0 mt-0.5" /> Músicas e Repertórios Ilimitados</li>
              <li className="flex items-start gap-3 text-sm font-bold text-black/80"><Check size={18} className="text-black shrink-0 mt-0.5" /> Modo Performance (Teleprompter)</li>
              <li className="flex items-start gap-3 text-sm font-bold text-black/80"><Check size={18} className="text-black shrink-0 mt-0.5" /> Organização de Repertório (Arrastar/Soltar)</li>
              <li className="flex items-start gap-3 text-sm font-bold text-black/80"><Check size={18} className="text-black shrink-0 mt-0.5" /> Divisores e Notas de Palco</li>
              <li className="flex items-start gap-3 text-sm font-bold text-black/80"><Check size={18} className="text-black shrink-0 mt-0.5" /> Acesso Offline PWA</li>
            </ul>
          </div>

          <a 
            href={BASE_CHECKOUT_LINK}
            className="w-full py-5 bg-black text-white rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center hover:opacity-80 active:scale-95 transition-all text-center"
          >
            Assinar Base
          </a>
        </div>

        {/* Lado Direito - Plano Pro (Destaque) */}
        <div className="flex-1 p-8 md:p-12 bg-yellow-400 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black rounded-full text-xs font-black uppercase tracking-widest text-white mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
              <Crown size={14} className="text-yellow-400" /> Plano Pro
            </div>
            
            <div className="mb-8">
              <span className="text-5xl font-black tracking-tighter text-black">R$7,99</span>
              <span className="text-sm font-bold text-black/60 uppercase tracking-widest ml-2">/mês</span>
            </div>

            <p className="text-xs font-black uppercase tracking-widest text-black/60 mb-4">Tudo do Base, MAIS:</p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm font-bold text-black"><Check size={18} className="text-black shrink-0 mt-0.5" /> Compartilhamento Colab c/ Banda</li>
              <li className="flex items-start gap-3 text-sm font-bold text-black"><Check size={18} className="text-black shrink-0 mt-0.5" /> Geração de Repertório em PDF (Impressão)</li>
              <li className="flex items-start gap-3 text-sm font-bold text-black"><Check size={18} className="text-black shrink-0 mt-0.5" /> Editor de Timecode (Blocos Inteligentes)</li>
              <li className="flex items-start gap-3 text-sm font-bold text-black"><Check size={18} className="text-black shrink-0 mt-0.5" /> Sincronia Perfeita com a Música</li>
              <li className="flex items-start gap-3 text-sm font-bold text-black"><Check size={18} className="text-black shrink-0 mt-0.5" /> Suporte Prioritário</li>
            </ul>
          </div>

          <a 
            href={PRO_CHECKOUT_LINK}
            className="w-full py-5 bg-white border-2 border-black text-black rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center"
          >
            Assinar Pro
          </a>
        </div>

      </div>
    </div>
  );
}