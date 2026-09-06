import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, List, Play, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import Logo from '../components/Logo';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, isOnline } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const slides = [
    {
      icon: <Music size={48} className="text-yellow-400" />,
      title: "Sua Biblioteca",
      description: "Busque letras diretamente da internet ou adicione suas próprias músicas. Tudo fica salvo na nuvem."
    },
    {
      icon: <List size={48} className="text-yellow-400" />,
      title: "Crie Repertórios",
      description: "Organize suas músicas em Setlists. Arraste para reordenar e adicione divisores para pausas e trocas de palco."
    },
    {
      icon: <Play size={48} className="text-yellow-400" />,
      title: "Teleprompter",
      description: "Dê o play e a tela rolará automaticamente. Sem distrações. Tudo otimizado para o palco."
    }
  ];

  const finishTutorial = async () => {
    setSaving(true);
    
    // 1. Grava no Cache Local para ser instantâneo
    const cacheKey = user ? `canta_tutorial_${user.id}` : 'canta_tutorial_guest';
    localStorage.setItem(cacheKey, 'true');

    // 2. Grava DEFINITIVAMENTE no Banco de Dados (Supabase User Metadata)
    if (user && isOnline) {
      try {
        await supabase.auth.updateUser({ 
          data: { has_seen_tutorial: true } 
        });
      } catch (err) {
        console.error("Modo Offline: Tutorial salvo apenas localmente.");
      }
    }

    navigate('/', { replace: true });
  };

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      finishTutorial();
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-black text-white flex flex-col z-[100] select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <Logo className="h-6 text-white" />
        <button 
          onClick={finishTutorial}
          disabled={saving}
          className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors active:scale-95"
          aria-label="Pular Tutorial"
        >
          Pular <ChevronRight size={14} className="inline -mt-0.5" />
        </button>
      </div>

      {/* Content Carousel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border-2 border-white/10 shadow-[0_0_40px_rgba(250,204,21,0.1)]">
          {slides[step].icon}
        </div>
        
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
          {slides[step].title}
        </h2>
        
        <p className="text-sm font-medium text-white/60 max-w-xs leading-relaxed">
          {slides[step].description}
        </p>
      </div>

      {/* Footer Controls */}
      <div className="p-8 pb-12 flex flex-col items-center gap-8">
        
        {/* Page Dots */}
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${step === idx ? 'w-8 bg-yellow-400' : 'w-2 bg-white/20'}`} 
            />
          ))}
        </div>

        {/* Action Button */}
        <button 
          onClick={handleNext}
          disabled={saving}
          className="w-full max-w-sm py-4 bg-yellow-400 text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-300 active:scale-95 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] disabled:opacity-50"
        >
          {saving ? "Entrando..." : step === slides.length - 1 ? <><Check size={18} /> Começar</> : "Próximo"}
        </button>
      </div>

    </div>
  );
}