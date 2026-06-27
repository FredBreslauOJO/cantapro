import React, { useState, useEffect } from 'react';
import { X, LogOut, RefreshCw, Zap, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import Logo from './Logo';

export default function SettingsModal({ isOpen, onClose, onOpenPaywall }) {
  const [render, setRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  const { user, profile, plan, logout } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);

  // Lógica para sincronizar a animação de montagem e desmontagem do fade
  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!render) return null;

  const handleSaveName = async () => {
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', user.id);
    setSaving(false);
  };

  return (
    <div 
      className={`fixed inset-0 z-[90] flex justify-end transition-colors duration-300 ${
        animate ? 'bg-black/70 backdrop-blur-xs' : 'bg-black/0'
      }`} 
      onClick={onClose}
    >
      {/* Container Lateral Brutalista que desliza */}
      <div 
        className={`w-full max-w-md bg-white border-l-4 border-black h-full flex flex-col justify-between p-6 select-none transition-transform duration-300 transform ${
          animate ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        
        {/* Topo do Menu */}
        <div>
          {/* Header com a Logo Oficial Reduzida */}
          <div className="flex items-center justify-between mb-8">
            <Logo className="h-5 text-black" />
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
            
            {/* SÓ MOSTRA UPGRADE SE FOR FREE */}
            {plan === 'free' && (
              <button 
                onClick={() => { onClose(); onOpenPaywall(); }}
                className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-80 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:scale-95"
              >
                <Zap size={14} fill="white" /> Fazer Upgrade
              </button>
            )}

            {/* SÓ MOSTRA GERENCIAR ASSINATURA SE FOR BASE OU PRO */}
            {plan !== 'free' && (
              <a 
                href="https://billing.stripe.com/p/login/test_bJe28r4VTboafjVeP567S00" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-yellow-400 border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95"
              >
                <CreditCard size={14} /> Gerenciar Assinatura
              </a>
            )}

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
            <p>Feito com ❤︎ por OJO STUDIO</p>
            <p>TODOS OS DIREITOS RESERVADOS.</p>
            <p><a href="http://ojo-studio.com">ojo-studio.com</a></p>
          </div>
        </div>

      </div>
    </div>
  );
}