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
    title: "ALTO CONTRASTE",
    text: "O visual do CANTA.PRO foi desenhado especificamente para ambientes escuros. O fundo preto economiza bateria do seu tablet no palco e não ofusca a sua visão."
  },
  {
    title: "IMPRESSÃO DE SETLISTS",
    text: "Entre na edição do seu setlist e clique no ícone da impressora. O app gera um PDF lindo e formatado, prontinho para compartilhar ou imprimir. Perfeito para ler no palco!"
  },
  {
    title: "IMPORTAÇÃO INTELIGENTE",
    text: "Na busca de letras na Web, você pode escolher baixar a música com 'Timecode' (sincronizada para rolar sozinha) ou 'Plain' (texto tradicional para você editar do seu jeito)."
  },
  {
    title: "COMPARTILHE NO WHATSAPP",
    text: "Na edição do setlist, clique no ícone de compartilhar. O app cria uma mensagem pronta com o link do show. É só colar no grupo do WhatsApp da banda e todos entram na mesma hora!"
  },
  {
    title: "SINTONIA FINA DA BANDA",
    text: "Chega de perder o papel do repertório. Organize sua banda para não perder nenhum detalhe. O setlist fica na nuvem e todo mundo tem acesso à ordem das músicas em tempo real."
  },
  {
    title: "DIVISORES E NOTAS DE PALCO",
    text: "Sabia que você pode criar divisores entre as músicas? Use-os para organizar pausas, troca de afinação ou lembrar o momento de falar com o público. Tudo sem sair do flow do show."
  },
  {
    title: "MODO PERFORMANCE PRO",
    text: "Assinantes do plano Pro podem sincronizar o tempo das letras com a música (Timecode). A letra rola sozinha e você não precisa tocar na tela enquanto toca seu instrumento."
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