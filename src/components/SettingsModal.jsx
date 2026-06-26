import React, { useState } from 'react';
import { X, LogOut, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function SettingsModal({ isOpen, onClose, onOpenPaywall }) {
  if (!isOpen) return null;

  const { user, profile, plan, logout } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', user.id);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[90] flex justify-end" onClick={onClose}>
      {/* Container que desliza */}
      <div 
        className="w-full max-w-md bg-white border-l-4 border-black h-full flex flex-col justify-between p-6 animate-slide-in select-none"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Topo do Menu */}
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="w-4 h-1 bg-gray-200 rounded-full mx-auto hidden" /> {/* Indicador visual */}
            <span className="text-xs font-black uppercase tracking-widest text-black/40">Minha Conta</span>
            <button onClick={onClose} className="p-1 text-black/40 hover:text-black transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Dados do Perfil */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-black border-2 border-black text-white font-black text-xl rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase">
              {name ? name.charAt(0) : user?.email?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                onBlur={handleSaveName}
                placeholder="SEU NOME / BANDA"
                className="font-black text-base uppercase bg-transparent outline-none border-b-2 border-transparent focus:border-black w-full placeholder-black/20"
              />
              <p className="text-xs font-bold text-black/40 truncate mt-0.5">{user?.email}</p>
            </div>
            <span className="px-2 py-1 bg-black/5 border border-black/10 text-[9px] font-black uppercase tracking-widest rounded-md text-black/60">
              {plan}
            </span>
          </div>

          {/* Botões Principais de Ação */}
          <div className="space-y-3">
            <button 
              onClick={() => { onClose(); onOpenPaywall(); }}
              className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-80 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:scale-95"
            >
              <Zap size={14} fill="white" /> Fazer Upgrade
            </button>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw size={14} /> Refazer Tutorial
            </button>
          </div>

          {/* Links Institucionais */}
          <div className="mt-8 border-t-2 border-gray-100 pt-6 space-y-4 text-sm font-black uppercase tracking-wide text-black/60">
            <a href="#" className="block hover:text-black transition-colors">Termos de Serviço</a>
            <a href="#" className="block hover:text-black transition-colors">FAQ</a>
            <a href="#" className="block hover:text-black transition-colors">Atendimento</a>
          </div>
        </div>

        {/* Rodapé do Menu */}
        <div>
          <button 
            onClick={() => { logout(); onClose(); }}
            className="w-full py-3 text-xs font-bold text-black/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <LogOut size={14} /> Sair da conta
          </button>

          <div className="border-t border-gray-100 mt-4 pt-4 text-[9px] font-bold text-black/30 uppercase tracking-wider space-y-0.5">
            <p className="font-black text-black/40">OJO STUDIO EXPERIÊNCIAS DIGITAIS LTDA</p>
            <p>NOME FANTASIA: OJO STUDIO</p>
            <p>CNPJ: 58.505.369/0001-36</p>
            <p>TODOS OS DIREITOS RESERVADOS.</p>
            <p>WWW.OJO-STUDIO.COM</p>
          </div>
        </div>

      </div>
    </div>
  );
}