import React from 'react';
import { X, Check, Zap, Shield, Minus } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function PaywallModal({ isOpen, onClose, currentPlan }) {
  const { user } = useAuth();

  if (!isOpen) return null;

  const STRIPE_BASE_LINK = "https://buy.stripe.com/test_9B6eVddsp77U4FhbCT67S01";
  const STRIPE_PRO_LINK = "https://buy.stripe.com/test_bJe28r4VTboafjVeP567S00";

  const getCheckoutUrl = (baseLink) => {
    if (!user || !user.email) return baseLink;
    return `${baseLink}?prefilled_email=${encodeURIComponent(user.email)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto select-none animate-fadeIn">
      <div className="bg-white border-4 border-black w-full max-w-4xl rounded-3xl p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
        
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black hover:bg-gray-100 transition-colors active:scale-95">
          <X size={18} />
        </button>

        <div className="text-center mt-2 mb-8">
          <span className="bg-yellow-400 border-2 border-black text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block mb-3">
            Evolua sua Performance
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-black">Escolha seu Plano</h2>
        </div>

        {/* Comparativo de Planos (3 Colunas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* FREE */}
          <div className="border-2 border-gray-200 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <p className="font-black text-xs uppercase tracking-wider text-gray-500">Free</p>
              <div className="flex items-baseline gap-1 mt-1 mb-4">
                <span className="text-xl font-black text-gray-400">R$ 0,00</span>
              </div>
              <ul className="space-y-3 text-[10px] font-bold uppercase text-gray-500">
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-gray-400" /> 1 Setlist apenas</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-gray-400" /> Até 10 músicas</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-gray-400" /> Modo Performance</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-gray-400" /> Aceitar convites (Somente visualização)</li>
                <li className="flex items-start gap-2 opacity-40"><Minus size={14} className="mt-0.5" /> Arquivar Setlists</li>
                <li className="flex items-start gap-2 opacity-40"><Minus size={14} className="mt-0.5" /> Compartilhar & Editar com amigos</li>
                <li className="flex items-start gap-2 opacity-40"><Minus size={14} className="mt-0.5" /> Modo Timecode</li>
                <li className="flex items-start gap-2 opacity-40"><Minus size={14} className="mt-0.5" /> Impressão de Setlists</li>
              </ul>
            </div>
          </div>

          {/* BASE */}
          <div className="border-3 border-black rounded-2xl p-4 flex flex-col justify-between bg-gray-50">
            <div>
              <p className="font-black text-sm uppercase tracking-wider text-black">Base</p>
              <div className="flex items-baseline gap-1 mt-1 mb-4">
                <span className="text-2xl font-black text-black">R$ 6,99</span><span className="text-xs font-bold text-gray-400">/mês</span>
              </div>
              <ul className="space-y-3 text-[10px] font-bold uppercase text-black/80">
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-green-600 stroke-[3]" /> Até 5 Setlists</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-green-600 stroke-[3]" /> Músicas Ilimitadas</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-green-600 stroke-[3]" /> Modo Performance</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-green-600 stroke-[3]" /> Aceitar convites</li>
                <li className="flex items-start gap-2 opacity-40"><Minus size={14} className="mt-0.5" /> Arquivar Setlists</li>
                <li className="flex items-start gap-2 opacity-40"><Minus size={14} className="mt-0.5" /> Compartilhar & Editar com amigos</li>
                <li className="flex items-start gap-2 opacity-40"><Minus size={14} className="mt-0.5" /> Modo Timecode</li>
                <li className="flex items-start gap-2 opacity-40"><Minus size={14} className="mt-0.5" /> Impressão de Setlists</li>
              </ul>
            </div>
            <a href={getCheckoutUrl(STRIPE_BASE_LINK)} target="_blank" rel="noopener noreferrer" className={`w-full mt-6 h-10 rounded-xl border-2 border-black flex items-center justify-center font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${currentPlan === 'base' ? 'bg-gray-200 text-black/40 pointer-events-none' : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'}`}>
              {currentPlan === 'base' ? 'Plano Atual' : 'Assinar Base'}
            </a>
          </div>

          {/* PRO */}
          <div className="border-4 border-black rounded-2xl p-4 flex flex-col justify-between bg-black text-white shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] relative">
            <span className="absolute -top-3 right-4 bg-yellow-400 border-2 border-black text-black font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md">PRO</span>
            <div>
              <p className="font-black text-sm uppercase tracking-wider text-yellow-400 flex items-center gap-1"><Zap size={14} fill="currentColor" /> Pro</p>
              <div className="flex items-baseline gap-1 mt-1 mb-4">
                <span className="text-2xl font-black text-white">R$ 10,99</span><span className="text-xs font-bold text-white/40">/mês</span>
              </div>
              <ul className="space-y-3 text-[10px] font-bold uppercase text-white/90">
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-yellow-400 stroke-[3]" /> Setlists Ilimitados</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-yellow-400 stroke-[3]" /> Músicas Ilimitadas</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-yellow-400 stroke-[3]" /> Modo Performance</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-yellow-400 stroke-[3]" /> Aceitar convites</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-yellow-400 stroke-[3]" /> Arquivar Setlists</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-yellow-400 stroke-[3]" /> Compartilhar (Colaborativo)</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-yellow-400 stroke-[3]" /> Modo Timecode</li>
                <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-yellow-400 stroke-[3]" /> Impressão de Setlists</li>
              </ul>
            </div>
            <a href={getCheckoutUrl(STRIPE_PRO_LINK)} target="_blank" rel="noopener noreferrer" className={`w-full mt-6 h-10 rounded-xl border-2 border-black flex items-center justify-center font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${currentPlan === 'pro' ? 'bg-neutral-800 text-white/30 pointer-events-none' : 'bg-yellow-400 text-black shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:bg-yellow-300'}`}>
              {currentPlan === 'pro' ? 'Plano Atual' : 'Virar PRO'}
            </a>
          </div>

        </div>
        
        <div className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-6 flex items-center justify-center gap-1"><Shield size={10} /> Pagamento seguro via Stripe</div>
      </div>
    </div>
  );
}