import { useAuth } from '../lib/AuthContext';
import { userCache } from '../lib/userCache';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Music, Globe, Clock, ListMusic, Share2, Zap, ChevronRight, X, Play, CheckCircle2, Sparkles } from 'lucide-react';

const STEPS = [
  // --- A JORNADA FUNDAMENTAL ---
  {
    title: "1. Suas Letras",
    description: "Tudo começa aqui. Escreva, cole ou importe da internet para a sua Biblioteca Pessoal. Sem letras, não há show.",
    icon: <Music size={48} />,
    color: "bg-blue-400"
  },
  {
    title: "2. O Repertório",
    description: "Com as músicas salvas, monte a ordem do show! Adicione as canções, arraste para ordenar, crie pausas e insira comentários para a banda.",
    icon: <ListMusic size={48} />,
    color: "bg-green-400"
  },
  {
    title: "3. O Palco",
    description: "Aperte o PLAY. A tela fica preta para focar apenas na letra. Controle a rolagem e acesse seu roteiro a qualquer momento no menu superior.",
    icon: <Play size={48} className="ml-1" />,
    color: "bg-red-500"
  },
  {
    title: "Tudo Pronto!",
    description: "Você já sabe o essencial. Pode ir para o app agora ou tirar 1 minuto para conhecer nossas funcionalidades profissionais.",
    icon: <CheckCircle2 size={48} />,
    color: "bg-white",
    isMidpoint: true // Marca onde o tutorial básico termina
  },
  // --- RECURSOS AVANÇADOS (Opcionais) ---
  {
    title: "Busca Sincronizada",
    description: "Não perca tempo digitando. Importe letras com os tempos (timecodes) já sincronizados automaticamente direto da web.",
    icon: <Globe size={48} />,
    color: "bg-cyan-400"
  },
  {
    title: "Edite o Timecode",
    description: "Quer controle total? Ajuste o tempo exato de cada frase. O app até destaca as notas de palco em amarelo brilhante pra você.",
    icon: <Clock size={48} />,
    color: "bg-purple-400"
  },
  {
    title: "Compartilhe e Imprima",
    description: "A banda prefere o papel? Sem problema. Mande um link de colaboração no WhatsApp ou gere um PDF do setlist com um clique.",
    icon: <Share2 size={48} />,
    color: "bg-pink-400"
  },
  {
    title: "Pedais Bluetooth",
    description: "Toque com as mãos livres! Use seu pedal via Bluetooth (Setas/Espaço) para avançar as músicas ou pausar a rolagem.",
    icon: <Zap size={48} />,
    color: "bg-yellow-400"
  }
];

export default function Onboarding() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleFinish = () => {
    userCache.setItem(user?.id, 'hasSeenTutorial', 'true');
    navigate(location.state?.returnTo?.startsWith('/') && !location.state.returnTo.startsWith('//') ? location.state.returnTo : '/');
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const currentData = STEPS[currentStep];

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col font-sans text-white select-none">
      
      {/* Header - Progresso e Fechar */}
      <div className="p-6 flex justify-between items-center h-20 shrink-0">
        <div className="flex gap-1.5">
          {STEPS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'bg-white w-8' : idx < currentStep ? 'bg-white/40 w-3' : 'bg-white/20 w-3'
              }`}
            />
          ))}
        </div>
        <button onClick={handleFinish} className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white flex items-center gap-1 active:scale-95 transition-all p-2 -mr-2">
          Pular <X size={14} />
        </button>
      </div>

      {/* Conteúdo Central */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
        <div className={`w-32 h-32 ${currentData.color} rounded-3xl border-4 border-white flex items-center justify-center text-black mb-10 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-colors duration-500 animate-bounce`}>
          {currentData.icon}
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-4 leading-none text-white drop-shadow-md">
          {currentData.title}
        </h1>
        
        <p className="text-sm sm:text-base font-bold text-white/70 max-w-sm leading-relaxed">
          {currentData.description}
        </p>
      </div>

      {/* Footer - Controles e CTAs */}
      <div className="p-6 sm:p-8 shrink-0 min-h-[140px] flex flex-col justify-end">
        {currentData.isMidpoint ? (
          <div className="space-y-4 w-full animate-fadeIn">
            <button 
              onClick={handleFinish}
              className="w-full py-5 bg-yellow-400 text-black border-2 border-transparent rounded-2xl font-black uppercase tracking-[0.15em] text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-yellow-300 transition-all shadow-[0_6px_0_0_#ca8a04] active:translate-y-1.5 active:shadow-none"
            >
              Começar Agora
            </button>
            <button 
              onClick={nextStep}
              className="w-full py-4 text-white/60 hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Sparkles size={14} className="text-yellow-400" /> Conhecer Recursos Avançados
            </button>
          </div>
        ) : (
          <button aria-label="Próximo" 
            onClick={nextStep}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-[0_6px_0_0_#a3a3a3] active:translate-y-1.5 active:shadow-none"
          >
            {currentStep === STEPS.length - 1 ? "Ir para o App" : "Próximo Passo"}
            {currentStep !== STEPS.length - 1 && <ChevronRight size={18} className="-mr-1" />}
          </button>
        )}
      </div>

    </div>
  );
}