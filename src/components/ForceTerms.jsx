import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TermsOfServiceModal from './TermsOfServiceModal';

export const CURRENT_TERMS_VERSION = "2026-06-28";

export default function ForceTerms({ user, onAccepted }) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAccept = async () => {
    setLoading(true);
    setErrorMsg('');
    
    // ATUALIZAÇÃO: Usando update direto invés de upsert para não barrar no RLS
    const { error } = await supabase
      .from('profiles')
      .update({ accepted_terms_version: CURRENT_TERMS_VERSION })
      .eq('id', user.id);
    
    if (!error) {
      onAccepted(); 
    } else {
      console.error("Erro ao aceitar termos:", error);
      setErrorMsg("Falha na conexão. Verifique sua internet e tente novamente.");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fadeIn select-none">
        <div className="bg-white p-8 rounded-3xl max-w-sm w-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-black leading-none">Termos Atualizados</h2>
          <p className="text-sm font-bold text-black/60 mb-6">
            Nossos termos de serviço e privacidade mudaram. Para continuar sendo a estrela do palco com o CANTA.PRO, confirme sua leitura.
          </p>
          
          {errorMsg && (
            <div className="bg-red-50 text-red-600 border-2 border-red-200 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl mb-6">
              {errorMsg}
            </div>
          )}

          <button 
            onClick={() => setIsTermsOpen(true)} 
            className="w-full py-4 mb-4 border-2 border-black text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 active:scale-95 transition-all"
          >
            Ler os Termos
          </button>

          <button 
            onClick={handleAccept} 
            disabled={loading} 
            className="w-full py-4 bg-yellow-400 border-2 border-black text-black rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-yellow-300 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
          >
            {loading ? "Aguarde..." : <><Check size={16} /> Aceitar e Continuar</>}
          </button>
        </div>
      </div>

      <TermsOfServiceModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </>
  );
}