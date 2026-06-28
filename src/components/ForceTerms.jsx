import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TermsOfServiceModal from './TermsOfServiceModal';

// ATENÇÃO: Quando mudar o texto dos termos no futuro, altere esta data! 
// Isso forçará todos os usuários a aceitarem novamente.
export const CURRENT_TERMS_VERSION = "2026-06-28";

export default function ForceTerms({ user, onAccepted }) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    // Atualiza a assinatura no banco de dados
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, accepted_terms_version: CURRENT_TERMS_VERSION });
    
    if (!error) {
      onAccepted(); // Libera o aplicativo
    } else {
      console.error("Erro ao aceitar termos:", error);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fadeIn select-none">
        <div className="bg-white p-8 rounded-3xl max-w-sm w-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-black leading-none">Termos Atualizados</h2>
          <p className="text-sm font-bold text-black/60 mb-8">
            Nossos termos de serviço e privacidade mudaram. Para continuar sendo a estrela do palco com o CANTA.PRO, confirme sua leitura.
          </p>
          
          <button 
            onClick={() => setIsTermsOpen(true)} 
            className="w-full py-4 mb-4 border-2 border-black text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 active:scale-95 transition-all"
          >
            Ler os Termos
          </button>

          <button 
            onClick={handleAccept} 
            disabled={loading} 
            className="w-full py-4 bg-yellow-400 border-2 border-black text-black rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-yellow-300 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {loading ? "Aguarde..." : <><Check size={16} /> Aceitar e Continuar</>}
          </button>
        </div>
      </div>

      <TermsOfServiceModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </>
  );
}