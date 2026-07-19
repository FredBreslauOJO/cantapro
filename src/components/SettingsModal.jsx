import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogOut, RefreshCw, Zap, CreditCard, Check, Loader2, Download, Plus, ArrowLeft, Settings, Mail, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import Logo from './Logo';
import TermsOfServiceModal from './TermsOfServiceModal';

export default function SettingsModal({ isOpen, onClose, onOpenPaywall }) {
  const navigate = useNavigate();
  const [render, setRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [view, setView] = useState('main'); 
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [installPlatform, setInstallPlatform] = useState(null);

  const { user, profile, plan, logout } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [savingStatus, setSavingStatus] = useState('idle'); 

  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [isResettingPwd, setIsResettingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setView('main');
      setEmailMessage('');
      setPwdMessage('');
      setNewEmail('');
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (profile?.full_name && !name) setName(profile.full_name);
  }, [profile]);

  if (!render) return null;

  const handleSaveName = async () => {
    if (!name || name === profile?.full_name) return;
    setSavingStatus('saving');
    const { error } = await supabase.from('profiles').update({ full_name: name, updated_at: new Date() }).eq('id', user.id);
    if (!error) {
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } else {
      setSavingStatus('idle');
    }
  };

  const handleInstallApp = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setInstallPlatform('ios');
    } else if (/android/i.test(userAgent)) {
      setInstallPlatform('android');
    } else {
      setInstallPlatform('desktop');
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || newEmail === user?.email) return;
    
    setIsUpdatingEmail(true);
    setEmailMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      setEmailMessage('Verifique o link enviado para seu e-mail atual e para o novo.');
      setNewEmail('');
    } catch (err) {
      setEmailMessage('Erro ao atualizar e-mail. Tente novamente.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleResetPassword = async () => {
    setIsResettingPwd(true);
    setPwdMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setPwdMessage('Link enviado para seu e-mail!');
    } catch (err) {
      setPwdMessage('Erro ao enviar link.');
    } finally {
      setIsResettingPwd(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-[90] flex justify-end transition-colors duration-300 ${animate ? 'bg-black/70 backdrop-blur-xs' : 'bg-black/0'}`} onClick={onClose}>
        <div className={`w-full max-w-md bg-white border-l-4 border-black h-full flex flex-col justify-between p-6 select-none transition-transform duration-300 transform ${animate ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          
          <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
            
            {view === 'main' ? (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-8">
                  <Logo className="h-5 text-black" />
                  <button onClick={onClose} className="p-1 text-black/40 hover:text-black transition-colors active:scale-95"><X size={20} /></button>
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
                  <button onClick={handleInstallApp} className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-80 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:scale-95 mb-6">
                    <Download size={14} /> Instalar Aplicativo
                  </button>

                  {plan === 'free' && (
                    <button onClick={() => { onClose(); onOpenPaywall(); }} className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-80 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:scale-95">
                      <Zap size={14} fill="white" /> Fazer Upgrade
                    </button>
                  )}
                  {plan !== 'free' && (
                    <a href="https://billing.stripe.com/p/login/bJe28r4VTboafjVeP567S00?locale=pt-BR" target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-yellow-400 border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95">
                      <CreditCard size={14} /> Gerenciar Assinatura
                    </a>
                  )}
                  <button onClick={() => { onClose(); navigate('/tutorial'); }} className="w-full py-4 border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <RefreshCw size={14} /> Refazer Tutorial
                  </button>
                </div>

                <div className="mt-8 border-t-2 border-gray-100 pt-6">
                  <p className="text-[11px] font-black uppercase tracking-widest text-black/50 mb-3 text-center">
                    Acompanhe as novidades
                  </p>
                  <a
                    href="https://www.instagram.com/canta.pro.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center text-center"
                  >
                    Siga-nos no Insta
                  </a>
                </div>

                <div className="mt-8 border-t-2 border-gray-100 pt-6 space-y-4 text-sm font-black tracking-wide text-black/60">
                  <button onClick={() => setIsTermsOpen(true)} className="block w-full text-left hover:text-black transition-colors">Termos de Serviço</button>
                  <a href="https://www.canta.pro" target="_blank" rel="noopener noreferrer" className="block hover:text-black transition-colors">FAQ</a>
                  <a href="https://www.canta.pro" target="_blank" rel="noopener noreferrer" className="block hover:text-black transition-colors">Atendimento</a>
                </div>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div className="flex items-center mb-8">
                  <button onClick={() => setView('main')} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                    <ArrowLeft size={20} strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 text-center pr-6">
                    <h2 className="text-lg font-black uppercase tracking-tight">Sua Conta</h2>
                  </div>
                </div>

                <div className="space-y-8">
                  
                  <div className="bg-gray-50 border-2 border-black rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail size={16} className="text-black" />
                      <h3 className="text-xs font-black uppercase tracking-widest">Alterar E-mail</h3>
                    </div>
                    <form onSubmit={handleChangeEmail} className="space-y-3">
                      <input
                        type="email" required placeholder="Novo e-mail"
                        value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-colors"
                      />
                      <button
                        type="submit" disabled={isUpdatingEmail || !newEmail}
                        className="w-full py-3 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-transform"
                      >
                        {isUpdatingEmail ? <Loader2 size={14} className="animate-spin" /> : "Atualizar E-mail"}
                      </button>
                    </form>
                    {emailMessage && <p className="mt-3 text-[10px] font-bold text-black/60 leading-tight">{emailMessage}</p>}
                  </div>

                  <div className="bg-gray-50 border-2 border-black rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Lock size={16} className="text-black" />
                      <h3 className="text-xs font-black uppercase tracking-widest">Segurança</h3>
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 mb-4 leading-relaxed">
                      Enviaremos um link seguro para o seu e-mail atual onde você poderá definir uma nova senha.
                    </p>
                    <button
                      onClick={handleResetPassword} disabled={isResettingPwd}
                      className="w-full py-3 bg-white text-black border-2 border-black rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform"
                    >
                      {isResettingPwd ? <Loader2 size={14} className="animate-spin" /> : "Solicitar Nova Senha"}
                    </button>
                    {pwdMessage && <p className="mt-3 text-[10px] font-bold text-black/60 leading-tight">{pwdMessage}</p>}
                  </div>

                  <div className="border-t-2 border-red-100 pt-6 mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-red-500">Zona de Perigo</h3>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 mb-4 leading-relaxed">
                      A exclusão da conta é irreversível e apagará todos os seus repertórios.
                    </p>
                    <a
                      href={`mailto:app@canta.pro?subject=Solicitação de Exclusão de Conta&body=Olá. Por favor, solicito a exclusão permanente da minha conta associada ao e-mail: ${user?.email}`}
                      className="w-full py-3 bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-500 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center transition-colors"
                    >
                      Solicitar Exclusão
                    </a>
                  </div>

                </div>
              </div>
            )}
          </div>
          
          <div className="pt-4 pb-2 border-t-2 border-gray-100/50 mt-2 shrink-0">
            {view === 'main' && (
              <>
                {/* BOTÃO GERENCIAR CONTA MOVIDO PARA O RODAPÉ */}
                <button onClick={() => setView('account')} className="w-full py-3 mb-2 text-xs font-bold text-black/60 hover:text-black hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                  <Settings size={14} /> Gerenciar Conta
                </button>
                
                <button onClick={() => { logout(); onClose(); }} className="w-full py-3 mb-4 text-xs font-bold text-black/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                  <LogOut size={14} /> Sair da conta
                </button>
              </>
            )}
            
            <div className="text-center text-[10px] font-bold text-black/30 space-y-1.5 leading-relaxed">
              <p>Feito por <a href="https://www.ojo-studio.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors underline decoration-black/20 underline-offset-2">OJO STUDIO</a></p>
              <p>Todos os direitos reservados.<br/>CANTA.PRO é uma marca registrada.</p>
            </div>
          </div>

        </div>
      </div>

      <TermsOfServiceModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      {installPlatform && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-end sm:justify-center p-4 animate-fadeIn" onClick={() => setInstallPlatform(null)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black">Instalar Aplicativo</h3>
            
            {installPlatform === 'ios' && (
              <>
                <p className="text-sm font-bold text-black/60 mb-6">Para instalar o CANTA.PRO no seu iPhone/iPad:</p>
                <div className="space-y-4 text-left font-black uppercase tracking-tight text-xs text-black/80">
                  <p className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl"><Plus size={18} className="text-blue-500 shrink-0"/> 1. Toque no ícone de Compartilhar no Safari.</p>
                  <p className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl"><Check size={18} className="text-black shrink-0"/> 2. Escolha "Adicionar à Tela de Início".</p>
                </div>
              </>
            )}

            {installPlatform === 'android' && (
              <>
                <p className="text-sm font-bold text-black/60 mb-6">Para instalar o CANTA.PRO no seu Android:</p>
                <div className="space-y-4 text-left font-black uppercase tracking-tight text-xs text-black/80">
                  <p className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl"><Download size={18} className="text-black shrink-0"/> 1. Toque no menu (3 pontinhos) do navegador.</p>
                  <p className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl"><Check size={18} className="text-black shrink-0"/> 2. Escolha "Adicionar à tela inicial" ou "Instalar".</p>
                </div>
              </>
            )}

            {installPlatform === 'desktop' && (
              <>
                <p className="text-sm font-bold text-black/60 mb-6">Para instalar o CANTA.PRO no seu Computador:</p>
                <div className="space-y-4 text-left font-black uppercase tracking-tight text-xs text-black/80">
                  <p className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl"><Download size={18} className="text-black shrink-0"/> 1. Procure o ícone de instalação na barra do navegador.</p>
                  <p className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl"><Check size={18} className="text-black shrink-0"/> 2. Clique em "Instalar".</p>
                </div>
              </>
            )}

            <button onClick={() => setInstallPlatform(null)} className="w-full py-4 mt-8 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all">Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}