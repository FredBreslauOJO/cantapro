import React from 'react';
import { X } from 'lucide-react';

export default function TermsOfServiceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-white flex flex-col animate-fadeIn font-sans select-none">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-6 border-b-4 border-black bg-white z-10 sticky top-0">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black">Termos de Serviço</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 text-black">
          <X size={24} />
        </button>
      </div>
      
      {/* Conteúdo do Texto Legal */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 text-black/80 space-y-6 pb-24">
        <p className="text-sm font-bold uppercase tracking-widest text-black/40">Última atualização: Junho de 2026</p>
        
        <div className="space-y-4 font-medium leading-relaxed">
          <p>Seja bem-vindo ao <strong>CANTA.PRO</strong>. Ao acessar ou usar nosso aplicativo, plataforma web ou qualquer serviço fornecido por nós, você concorda em cumprir e estar vinculado a estes Termos de Serviço ("Termos"). Se você não concorda com qualquer parte destes termos, você não deve utilizar o aplicativo.</p>

          <h3 className="text-xl font-black uppercase text-black mt-8">1. Definição do Serviço</h3>
          <p>O CANTA.PRO é uma plataforma de Software como Serviço (SaaS) que fornece ferramentas de organização de repertório, teleprompter (Modo Performance), edição de timecodes e compartilhamento de repertórios para músicos, bandas e profissionais do setor artístico. O serviço é oferecido em modalidades gratuitas (com limitações) e planos pagos por assinatura (Base e Pro).</p>

          <h3 className="text-xl font-black uppercase text-black mt-8">2. Cadastro e Segurança da Conta</h3>
          <p><strong>Idade Mínima:</strong> Ao criar uma conta, você declara ter capacidade legal para celebrar contratos.</p>
          <p><strong>Segurança:</strong> Você é o único responsável por manter a confidencialidade das suas credenciais de acesso (e-mail e login via Supabase Auth). Qualquer atividade realizada na sua conta será de sua inteira responsabilidade.</p>

          <h3 className="text-xl font-black uppercase text-black mt-8">3. Assinaturas, Faturamento e Cancelamento</h3>
          <p><strong>Processamento de Pagamentos:</strong> Todos os pagamentos e assinaturas são processados de forma segura através da plataforma Stripe. O CANTA.PRO não armazena os dados do seu cartão de crédito em servidores próprios.</p>
          <p><strong>Renovação Automática:</strong> As assinaturas (mensais ou anuais) são renovadas automaticamente ao final de cada período de faturamento, a menos que o usuário solicite o cancelamento antes da data de renovação através do "Portal do Cliente" integrado.</p>
          <p><strong>Reembolsos:</strong> Devido à natureza digital do serviço e à disponibilização imediata dos recursos premium, não realizamos reembolsos parciais ou estornos de períodos já iniciados ou utilizados.</p>

          <h3 className="text-xl font-black uppercase text-black mt-8">4. Alteração de Valores e Planos</h3>
          <p>O CANTA.PRO reserva-se o direito de alterar os valores das assinaturas (Planos Base, Pro ou futuros planos) ou modificar a estrutura dos recursos inclusos em cada modalidade a qualquer momento.</p>
          
          <div className="bg-yellow-50 p-5 border-2 border-black rounded-2xl my-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-black text-black flex items-center gap-2">
              <span>⚠️</span> CLÁUSULA DE AVISO PRÉVIO
            </p>
            <p className="text-sm mt-2 text-black/90 font-bold">
              Qualquer alteração nos valores de assinaturas recorrentes será comunicada aos usuários ativos com, no mínimo, 30 (trinta) dias de aviso prévio, através do e-mail cadastrado na plataforma ou de avisos destacados dentro do próprio aplicativo.
            </p>
            <p className="text-xs mt-2 text-black/60 font-medium">
              Caso o usuário não concorde com o novo valor estipulado, caberá a ele realizar o cancelamento de sua assinatura antes da próxima data de faturamento. A continuidade do uso do serviço após o prazo de 30 dias constituirá aceitação tácita dos novos valores.
            </p>
          </div>

          <h3 className="text-xl font-black uppercase text-black mt-8">5. Propriedade Intelectual e Responsabilidade pelo Conteúdo (Escudo de Direitos Autorais)</h3>
          <p className="font-black text-black border-b-2 border-black pb-1 inline-block uppercase tracking-wide text-xs bg-gray-100 px-2 py-0.5 rounded">Importante para a segurança jurídica da plataforma</p>
          <p className="mt-2"><strong>Propriedade do Aplicativo:</strong> O código-fonte, design, identidade visual, logotipos e estrutura do CANTA.PRO são de propriedade exclusiva do desenvolvedor e protegidos por leis de propriedade intelectual.</p>
          <p><strong>Conteúdo do Usuário:</strong> O usuário retém todos os direitos sobre os dados, textos, notas de palco e repertórios que inserir manualmente no aplicativo.</p>
          
          <div className="bg-red-50 p-5 border-2 border-black rounded-2xl my-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-black text-red-600 flex items-center gap-2 uppercase tracking-tight">
              <span>🚨</span> Isenção Total de Responsabilidade por Direitos Autorais
            </p>
            <p className="text-sm mt-2 text-black font-black uppercase tracking-tight">
              O CANTA.PRO funciona exclusivamente como uma ferramenta tecnológica de suporte e armazenamento em nuvem de textos inseridos de forma privada pelo usuário.
            </p>
            <ul className="list-disc pl-5 mt-3 text-sm space-y-2 text-black/90 font-bold">
              <li>A responsabilidade pela inserção de letras de músicas, cifras, arranjos ou qualquer conteúdo protegido por direitos autorais é 100% (cem por cento) do usuário.</li>
              <li>O CANTA.PRO não realiza triagem prévia, monitoramento, curadoria ou licencimento das letras digitadas ou coladas na plataforma.</li>
              <li>O usuário declara e garante que possui todas as autorizações, licenças ou direitos necessários para utilizar as letras das músicas em suas apresentações e repertórios.</li>
              <li>O CANTA.PRO, seu desenvolvedor e seus parceiros não serão, sob nenhuma hipótese, responsabilizados por infrações de direitos autorais, execuções públicas não autorizadas (junto ao ECAD ou órgãos similares), ou qualquer disputa jurídica decorrente do conteúdo armazenado pelo usuário em sua conta.</li>
            </ul>
          </div>

          <h3 className="text-xl font-black uppercase text-black mt-8">6. Limitação de Responsabilidade</h3>
          <p>O serviço é fornecido "no estado em que se encontra" (as is) e "conforme disponível". Embora busquemos a excelência técnica:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Não garantimos que o aplicativo funcionará de forma 100% ininterrupta, livre de bugs ou imune a quedas temporárias de servidor.</li>
            <li>Não nos responsabilizamos por falhas de conexão de internet do usuário durante apresentações ao vivo ou em ambientes de palco (sendo recomendado o uso prévio do recurso de sincronização offline PWA).</li>
            <li>Sob nenhuma circunstância o CANTA.PRO será responsável por danos indiretos, lucros cessantes ou prejuízos decorrentes do cancelamento de shows, falhas técnicas em dispositivos de terceiros (tablets, celulares) ou perda de dados por mau uso da plataforma.</li>
          </ul>

          <h3 className="text-xl font-black uppercase text-black mt-8">7. Rescisão e Suspensão de Uso</h3>
          <p>O CANTA.PRO se reserva o direito de suspender ou encerrar o acesso de qualquer usuário à plataforma, sem aviso prévio, caso seja detectado uso fraudulento, tentativas de engenharia reversa no código do aplicativo, ou violação de qualquer uma das cláusulas destes Termos.</p>

          <h3 className="text-xl font-black uppercase text-black mt-8">8. Legislação e Foro</h3>
          <p>Estes Termos são regidos e interpretados de acordo com as leis da República Federativa do Brasil. Fica eleito o Foro da Comarca de <strong>Bauru, São Paulo</strong>, com exclusão de qualquer outro, por mais privilegiado que seja, para dirimir quaisquer disputas ou controvérsias oriundas destes Termos.</p>
        </div>
      </div>
    </div>
  );
}