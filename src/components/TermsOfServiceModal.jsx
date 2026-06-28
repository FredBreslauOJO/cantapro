import React from 'react';
import { X } from 'lucide-react';

export default function TermsOfServiceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-white flex flex-col animate-fadeIn font-sans">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-6 border-b-4 border-black bg-white z-10 sticky top-0">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black">Termos de Serviço</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 text-black">
          <X size={24} />
        </button>
      </div>
      
      {/* Conteúdo do Texto Legal */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 text-black/80 space-y-6 pb-24">
        <p className="text-sm font-bold uppercase tracking-widest text-black/40">Última atualização: 28 de Junho de 2026</p>
        
        <div className="space-y-4 font-medium">
          <h3 className="text-xl font-black uppercase text-black mt-8">1. Aceitação dos Termos</h3>
          <p>Ao acessar e utilizar o aplicativo CANTA.PRO, você concorda em cumprir e ficar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.</p>

          <h3 className="text-xl font-black uppercase text-black mt-8">2. Uso do Serviço</h3>
          <p>O CANTA.PRO é uma ferramenta de auxílio para músicos e artistas. Você é inteiramente responsável pelos conteúdos (letras, cifras, timecodes) que insere na plataforma. Não nos responsabilizamos por perdas de dados em shows ao vivo.</p>

          <h3 className="text-xl font-black uppercase text-black mt-8">3. Assinaturas e Pagamentos</h3>
          <p>As funcionalidades PRO estão sujeitas a cobrança. Os pagamentos são processados por plataformas parceiras e a renovação é automática, a menos que cancelada antes do fim do ciclo de faturamento.</p>

          {/* Adicione o resto dos seus termos aqui depois... */}
          <br/><br/><br/>
        </div>
      </div>
    </div>
  );
}