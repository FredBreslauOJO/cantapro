import React from 'react';
import { X, Check, Zap } from 'lucide-react';

export default function PaywallModal({ isOpen, onClose, currentPlan = 'free' }) {
  if (!isOpen) return null;

  const handleSubscribe = (priceId) => {
    alert("Ligação ao Stripe em breve! No próximo passo vamos gerar estes botões reais.");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border-4 border-black rounded-[2rem] w-full max-w-xl p-6 relative my-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        {/* Botão de Fechar */}
        <button onClick={onClose} className="absolute top-4 right-4 text-black/40 hover:text-black p-1 transition-colors">
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mt-2 mb-6">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto text-white mb-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">
            <Zap size={24} fill="white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Escolha o seu plano</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mt-1">Modo Performance sempre gratuito</p>
        </div>

        {/* Grid de Planos */}
        <div className="space-y-4">
          
          {/* Card BASIC */}
          <div className="border-2 border-black rounded-2xl p-4 flex flex-col justify-between relative bg-gray-50/50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight leading-none">Basic</h3>
                <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest block mt-1">Acesso Essencial</span>
              </div>
              {currentPlan === 'basic' ? (
                <span className="px-3 py-1.5 bg-black/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-black/40">Plano Atual</span>
              ) : (
                <button onClick={() => handleSubscribe('basic_price_id')} className="px-5 py-2 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-80 active:scale-95 transition-all">
                  Assinar
                </button>
              )}
            </div>
            <ul className="space-y-2 text-xs font-bold text-black/70">
              <li className="flex items-center gap-2"><Check size={14} className="text-black" /> Setlists ilimitados</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-black" /> Músicas ilimitadas</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-black" /> Notas de Divisor</li>
            </ul>
          </div>

          {/* Card PRO */}
          <div className="border-4 border-black rounded-2xl p-4 flex flex-col justify-between relative bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight leading-none text-white">Pro</h3>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mt-1">Completo para Bandas</span>
              </div>
              {currentPlan === 'pro' ? (
                <span className="px-3 py-1.5 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/60">Plano Atual</span>
              ) : (
                <button onClick={() => handleSubscribe('pro_price_id')} className="px-5 py-2 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-80 active:scale-95 transition-all">
                  Assinar
                </button>
              )}
            </div>
            <ul className="space-y-2 text-xs font-bold text-white/90">
              <li className="flex items-center gap-2"><Check size={14} className="text-white" /> Tudo do Basic</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-white" /> Impressão (PDF) de Setlists</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-white" /> Compartilhamento com membros</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-white" /> Auto-Play entre músicas</li>
            </ul>
          </div>

          {/* Card FREE */}
          <div className="border-2 border-black/20 rounded-2xl p-4 flex flex-col justify-between relative bg-white opacity-60">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-black text-sm uppercase tracking-tight text-black/50">Free</h3>
                <span className="text-[10px] font-bold text-black/30 uppercase">Grátis</span>
              </div>
              {currentPlan === 'free' && (
                <span className="px-3 py-1.5 bg-black/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-black/40">Plano Atual</span>
              )}
            </div>
            <ul className="space-y-1 text-[11px] font-bold text-black/40">
              <li className="flex items-center gap-2"><Check size={12} /> Máximo de 1 Setlist</li>
              <li className="flex items-center gap-2"><Check size={12} /> Máximo de 10 músicas</li>
              <li className="flex items-center gap-2"><Check size={12} /> Modo Performance completo</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <p className="text-[9px] font-black text-center text-black/30 uppercase tracking-widest mt-6">
          Cancele quando quiser • Pagamento seguro via Stripe
        </p>

      </div>
    </div>
  );
}