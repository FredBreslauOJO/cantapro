import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Clock, ListMusic, Move, Share2, Zap, ChevronRight, X } from 'lucide-react';

const STEPS = [
  {
    title: "Crie uma música",
    description: "Digite o nome da música e do artista, cole ou digite suas letras. Tudo fica salvo na sua biblioteca pessoal.",
    icon: <Music size={48} />,
    color: "bg-blue-400"
  },
  {
    title: "Edite Timecode",
    description: "Quer controle total? Crie blocos com tempo exato. No show, as letras aparecem no segundo que você precisa.",
    icon: <Clock size={48} />,
    color: "bg-purple-400"
  },
  {
    title: "Crie seu Setlist",
    description: "Combine suas músicas em repertórios. Clique em + ou - para montar a sequência perfeita para cada show.",
    icon: <ListMusic size={48} />,
    color: "bg-green-400"
  },
  {
    title: "Organize tudo",
    description: "Arraste para mudar a ordem e crie comentários (divisores) para lembrar de trocar de instrumento ou dar avisos.",
    icon: <Move size={48} />,
    color: "bg-orange-400"
  },
  {
    title: "Compartilhe e Imprima",
    description: "Mande o link para sua banda ou gere um PDF profissional para quem prefere o papel no palco.",
    icon: <Share2 size={48} />,
    color: "bg-pink-400"
  },
  {
    title: "Pronto para o show?",
    description: "Compatível com Pedais Bluetooth (Avançar/Voltar e Espaço). Você também pode Instalar o app pelo Menu Lateral para funcionar offline sem a barra do navegador!",
    icon: <Zap size={48} />,
    color: "bg-yellow-400"
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleFinish = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    navigate('/');
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col font-sans text-white">
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <div className="flex gap-1">
          {STEPS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 w-6 rounded-full transition-all ${idx === currentStep ? 'bg-white w-10' : 'bg-white/20'}`}
            />
          ))}
        </div>
        <button onClick={handleFinish} className="text-xs font-black uppercase tracking-widest opacity-50 hover:opacity-100 flex items-center gap-1">
          Pular <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className={`w-32 h-32 ${STEPS[currentStep].color} rounded-3xl border-4 border-white flex items-center justify-center text-black mb-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] animate-bounce`}>
          {STEPS[currentStep].icon}
        </div>
        
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none">
          {STEPS[currentStep].title}
        </h1>
        
        <p className="text-lg font-bold text-white/70 max-w-md leading-relaxed">
          {STEPS[currentStep].description}
        </p>
      </div>

      {/* Footer */}
      <div className="p-8">
        <button 
          onClick={nextStep}
          className="w-full py-6 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors shadow-[0_8px_0_0_#ccc] active:translate-y-1 active:shadow-none"
        >
          {currentStep === STEPS.length - 1 ? "Começar agora" : "Próximo"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}