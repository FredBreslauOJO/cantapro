import React from 'react';
import { X, Check, Zap, Shield } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function PaywallModal({ isOpen, onClose, currentPlan }) {
  const { user } = useAuth();

  if (!isOpen) return null;

  // Seus Links de Pagamento do Stripe (Modo de Teste)
  const STRIPE_BASE_LINK = "https://buy.stripe.com/test_9B6eVddsp77U4FhbCT67S01";
  const STRIPE_PRO_LINK = "https://buy.stripe.com/test_bJe28r4VTboafjVeP567S00";

  // Função para injetar o e-mail do usuário logado no link do Stripe
  const getCheckoutUrl = (baseLink) => {
    if (!user || !user.email) return baseLink;
    // O parâmetro prefilled_email preenche o e-mail automaticamente no checkout do Stripe
    return `${baseLink}?prefilled_email=${encodeURIComponent(user.email)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto select-none animate-fadeIn">
      
      {/* Container Principal (Brutalismo Preto/Branco) */}
      <div className="bg-white border-4 border-black w-full max-w-2xl rounded-3xl p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black hover:bg-gray-100 transition-colors active:scale-95"
        >
          <X size={18} />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mt-2 mb-8">
          <span className="bg-yellow-400 border-2 border-black text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block mb-3">
            Acesse seu Palco
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-black">Escolha seu Plano</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">Crie repertórios sem limites e domine o show</p>
        </div>

        {/* Grid de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PLANO BASE */}
          <div className="border-3 border-black rounded-2xl p-5 flex flex-col justify-between relative bg-gray-50/50">
            <div>
              <p className="font-black text-sm uppercase tracking-wider text-black">Plano Base</p>
              <div className="flex items-baseline gap-1 mt-2 mb-4">
                <span className="text-2xl font-black text-black">R$ 6,99</span>
                <span className="text-xs font-bold text-gray-400 uppercase">/ mês</span>
              </div>
              <ul className="space-y-2.5 text-xs font-bold uppercase text-black/70">
                <li className="flex items-center gap-2 text-black"><Check size={14} className="text-green-600 stroke-[3]" /> Até 5 Setlists</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600 stroke-[3]" /> Músicas Ilimitadas</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600 stroke-[3]" /> Modo Performance</li>
                <li className="flex items-center gap-2 text-gray-300 line-through"><Check size={14} /> Sincronia Timecode</li>
              </ul>
            </div>
            
            <a 
              href={getCheckoutUrl(STRIPE_BASE_LINK)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full mt-6 h-12 rounded-xl border-2 border-black flex items-center justify-center font-black text-xs uppercase tracking-widest transition-all text-center active:scale-95 ${
                currentPlan === 'base'
                  ? 'bg-gray-200 text-black/40 cursor-default pointer-events-none'
                  : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              {currentPlan === 'base' ? 'Seu Plano Atual' : 'Assinar Base'}
            </a>
          </div>

          {/* PLANO PRO (Destaque) */}
          <div className="border-4 border-black rounded-2xl p-5 flex flex-col justify-between relative bg-black text-white shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]">
            <span className="absolute -top-3 right-4 bg-yellow-400 border-2 border-black text-black font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              RECOMENDADO
            </span>
            <div>
              <p className="font-black text-sm uppercase tracking-wider text-yellow-400 flex items-center gap-1">
                <Zap size={14} fill="currentColor" /> Plano Pro
              </p>
              <div className="flex items-baseline gap-1 mt-2 mb-4">
                <span className="text-2xl font-black text-white">R$ 10,99</span>
                <span className="text-xs font-bold text-white/40 uppercase">/ mês</span>
              </div>
              <ul className="space-y-2.5 text-xs font-bold uppercase text-white/80">
                <li className="flex items-center gap-2 text-white"><Check size={14} className="text-yellow-400 stroke-[3]" /> Setlists Ilimitados</li>
                <li className="flex items-center gap-2 text-white"><Check size={14} className="text-yellow-400 stroke-[3]" /> Músicas Ilimitadas</li>
                <li className="flex items-center gap-2 text-white"><Check size={14} className="text-yellow-400 stroke-[3]" /> Modo Performance</li>
                <li className="flex items-center gap-2 text-white"><Check size={14} className="text-yellow-400 stroke-[3]" /> Sincronia Timecode PRO</li>
              </ul>
            </div>
            
            <a 
              href={getCheckoutUrl(STRIPE_PRO_LINK)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full mt-6 h-12 rounded-xl border-2 border-black flex items-center justify-center font-black text-xs uppercase tracking-widest transition-all text-center active:scale-95 ${
                currentPlan === 'pro'
                  ? 'bg-neutral-800 text-white/30 cursor-default pointer-events-none border-neutral-700'
                  : 'bg-yellow-400 text-black shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:bg-yellow-300'
              }`}
            >
              {currentPlan === 'pro' ? 'Seu Plano Atual' : 'Virar PRO'}
            </a>
          </div>

        </div>

        {/* Rodapé de Segurança */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8 border-t border-gray-100 pt-4">
          <Shield size={12} /> Pagamento seguro processado pelo Stripe
        </div>

      </div>
    </div>
  );
}