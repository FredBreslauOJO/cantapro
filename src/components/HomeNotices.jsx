import React, { useState } from 'react';

// ============================================================================
// ÁREA ADMINISTRATIVA DE AVISOS E DICAS (MODIFIQUE APENAS AQUI!)
// ============================================================================

// 1. AVISO FIXO (Manutenção, Atualizações Críticas)
// Para ativar, mude o null para um objeto. Exemplo:
// const FIXED_ALERT = { title: "⚠️ MANUTENÇÃO", text: "Estaremos offline hoje às 02h." };
const FIXED_ALERT = null;

// 2. DICAS ROTATIVAS (Sorteada caso o FIXED_ALERT seja null)
const DICAS_ROTATIVAS = [
  {
    title: "DICA",
    text: "Você sabia que dá pra imprimir os setlists, num formato bem bonito, prontinho para o palco?\nEntão, aquele teu baterista que é analógico, vai ficar atualizado com o resto da banda."
  },
  {
    title: "COLABORAÇÃO EM BANDA",
    text: "Ao compartilhar um setlist com a sua banda, qualquer mudança que você fizer na ordem das músicas reflete no celular deles na mesma hora."
  },
  {
    title: "MODO PERFORMANCE PRO",
    text: "Assinantes do plano Pro podem sincronizar o tempo das letras com a música (Timecode). A letra rola sozinha e você não precisa tocar na tela no meio do show."
  },
  {
    title: "ALTO CONTRASTE",
    text: "O visual do CANTA.PRO foi desenhado especificamente para ambientes escuros. O fundo preto economiza bateria do seu tablet no palco e não ofusca a sua visão."
  }
];
// ============================================================================

export default function HomeNotices() {
  // Sorteia a dica ou pega o aviso fixo assim que o componente nasce
  const [currentTip] = useState(() => {
    if (FIXED_ALERT) return FIXED_ALERT;
    return DICAS_ROTATIVAS[Math.floor(Math.random() * DICAS_ROTATIVAS.length)];
  });

  if (!currentTip) return null;

  return (
    <div className="mt-6 bg-black rounded-[2rem] p-6 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
      <h3 className="text-white font-black uppercase tracking-widest text-sm mb-3">
        {currentTip.title}
      </h3>
      <p className="text-white/90 text-xs font-medium leading-relaxed max-w-[95%] whitespace-pre-wrap">
        {currentTip.text}
      </p>
      {/* LED Vermelho no canto */}
      <div className="absolute bottom-6 right-6 w-1.5 h-1.5 bg-red-500 rounded-sm"></div>
    </div>
  );
}