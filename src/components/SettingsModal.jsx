import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogOut, RefreshCw, Zap, CreditCard, Check, Loader2, Download, Share, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import Logo from './Logo';
import TermsOfServiceModal from './TermsOfServiceModal';

export default function SettingsModal({ isOpen, onClose, onOpenPaywall }) {
  const navigate = useNavigate();
  const [render, setRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false); // Modal do iOS

  const { user, profile, plan, logout } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [savingStatus, setSavingStatus] = useState('idle'); 

  // Detecta se é um iPhone/iPad
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setTimeout(() => setAnimate(true), 10);
      setName(profile?.full_name || "");
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, profile]);

  if (!render) return null;

  const handleSaveName = async () => {
    if (!name || name === profile?.full_name) return;
    setSavingStatus('saving');
    const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name: name, updated_at: new Date() });
    if (!error) {
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } else {
      setSavingStatus('idle');
    }
  };

  const handleInstallApp = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
    } else if (window.deferredInstallPrompt) {
      // Gatilho mágico do Android/Chrome
      window.deferredInstallPrompt.prompt();
      const { outcome } = await window.deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') window.deferredInstallPrompt = null;
    } else {
      alert("O aplicativo já está instalado no seu dispositivo ou seu navegador não suporta esta função.");
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-[90] flex justify-end transition-colors duration-300 ${animate ? 'bg-black/70 backdrop-blur-xs' : 'bg-black/0'}`} onClick={onClose}>
        <div className={`w-full max-w-md bg-white border-l-4 border-black h-full flex flex-col justify-between p-6 select-none transition-transform duration-300 transform ${animate ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          
          <div>
            <div className="flex items-center justify-between mb-8">
              <Logo className="h-5 text-black" />
              <button onClick={onClose} className="p-1 text-black/40 hover:text-black transition-colors"><X size={20} /></button>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-black border-2 border-black text-white font-black text-xl rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase">
                {name ? name.charAt(0) : user?.email?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1 relative">
                <input 
                  type="text" value={name} onChange={e => setName(e.target.value)} onBlur={handleSaveName}
                  placeholder="SEU NOME / BANDA" className="font-black text-base uppercase bg-transparent outline-none border-b-2 border-transparent focus:border-black w-full placeholder-black/20 pr-6"
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  {savingStatus === 'saving' && <Loader2 size={14} className="animate-spin text-black/20" />}
                  {savingStatus === 'saved' && <Check size={14} className="text-green-500" />}
                </div>
                <p className="text-xs font-bold text-black/40 truncate mt-0.5">{user?.email}</p>
              </div>
              <span className="px-2 py-1 bg-black/5 border border-black/10 text-[9px] font-black uppercase tracking-widest rounded-md text-black/60">{plan}</span>
            </div>

            <div className="space-y-3">
              {/* BOTÃO DE INSTALAÇÃO */}
              <button onClick={handleInstallApp} className="w-full py-4 bg-green-400 border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-green-300 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 mb-6">
                <Download size={14} /> Instalar Aplicativo
              </button>

              {plan === 'free' && (
                <button onClick={() => { onClose(); onOpenPaywall(); }} className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-80 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:scale-95">
                  <Zap size={14} fill="white" /> Fazer Upgrade
                </button>
              )}
              {plan !== 'free' && (
                <a href="https://billing.stripe.com/p/login/bJe28r4VTboafjVeP567S00" target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-yellow-400 border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95">
                  <CreditCard size={14} /> Gerenciar Assinatura
                </a>
              )}
              <button onClick={() => { onClose(); navigate('/tutorial'); }} className="w-full py-4 border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-95">
                <RefreshCw size={14} /> Refazer Tutorial
              </button>
            </div>

            <div className="mt-8 border-t-2 border-gray-100 pt-6 space-y-4 text-sm font-black uppercase tracking-wide text-black/60">
              <button onClick={() => setIsTermsOpen(true)} className="block w-full text-left hover:text-black transition-colors">Termos de Serviço</button>
              <a href="https://www.canta.pro" target="_blank" rel="noopener noreferrer" className="block hover:text-black transition-colors">FAQ</a>
              <a href="https://www.canta.pro" target="_blank" rel="noopener noreferrer" className="block hover:text-black transition-colors">Atendimento</a>
            </div>
          </div>
          
          <div>
            <button onClick={() => { logout(); onClose(); }} className="w-full py-3 text-xs font-bold text-black/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
              <LogOut size={14} /> Sair da conta
            </button>
          </div>
        </div>
      </div>

      <TermsOfServiceModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      {/* MODAL DE TUTORIAL PARA O IOS */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-end sm:justify-center p-4 animate-fadeIn" onClick={() => setShowIOSPrompt(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black">Instalar no iPhone</h3>
            <p className="text-sm font-bold text-black/60 mb-6">Para instalar o CANTA.PRO no seu celular, siga estes 2 passos rápidos:</p>
            <div className="space-y-4 text-left font-black uppercase tracking-tight text-xs text-black/80">
              <p className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl"><Share size={18} className="text-blue-500"/> 1. Toque no ícone de Compartilhar no Safari.</p>
              <p className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl"><Plus size={18} className="text-black"/> 2. Escolha "Adicionar à Tela de Início".</p>
            </div>
            <button onClick={() => setShowIOSPrompt(false)} className="w-full py-4 mt-8 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs active:scale-95">Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}