import React from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function TermsOfServiceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-white flex flex-col animate-fadeIn font-sans select-none">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-6 border-b-4 border-black bg-white z-10 sticky top-0">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black truncate">
          Termos de Serviço e Uso
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 text-black shrink-0">
          <X size={24} />
        </button>
      </div>
      
      {/* Conteúdo do Texto Legal */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 text-black/80 space-y-6 pb-24">
        
        <div className="mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-black leading-none mb-2">
            Termos de Serviço e Condições Gerais de Uso — CANTA.PRO®
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Última Versão: 18 de julho de 2026.</p>
        </div>
        
        <div className="space-y-4 font-medium leading-relaxed text-sm sm:text-base">
          <p>
            Este contrato de adesão eletrônico regula as condições gerais de utilização do aplicativo web progressivo (PWA) <strong>CANTA.PRO</strong>, acessível através do endereço eletrônico oficial <a href="https://www.canta.pro/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-black">https://www.canta.pro/</a>, de propriedade, desenvolvimento e titularidade exclusiva da <strong>OJO STUDIO EXPERIÊNCIAS DIGITAIS LTDA</strong>, pessoa jurídica de direito privado inscrita no CNPJ sob o nº 58.505.369/0001-36, com sede na Rua Maria da Glória dos Santos Antunes, 1116, Residencial Villaggio, na cidade de Bauru - SP, CEP 17018-821, Brasil.
          </p>
          <p>
            Ao efetuar o cadastro, acessar a plataforma ou utilizar qualquer funcionalidade do CANTA.PRO, o usuário pessoa física ou jurídica adere integralmente a este documento e concorda em cumprir todas as suas cláusulas e as políticas anexas. A recusa em anuir com as cláusulas deste instrumento obsta a utilização do serviço, devendo o usuário interromper imediatamente o acesso.
          </p>

          <h3 className="text-lg sm:text-xl font-black uppercase text-black mt-10 mb-4 border-b-2 border-black/10 pb-2">
            Cláusula 1 — Das Definições e do Objeto do Contrato
          </h3>
          <p><strong>1.1. Natureza do Serviço:</strong> O CANTA.PRO consiste em um utilitário computacional em nuvem estruturado como Progressive Web Application (PWA) de teleprompting profissional e gestão técnica de repertórios (setlists) musicais.</p>
          <p><strong>1.2. Inexistência de Distribuição de Conteúdo Musical:</strong> A OJO STUDIO e o CANTA.PRO não atuam como agregadora, gravadora, editora, distribuidora de música, provedora de fonogramas ou licenciante de letras cifradas protegidas por direitos autorais. A plataforma fornece única e exclusivamente uma ferramenta de processamento lógico de dados de texto inseridos ou requeridos ativa e voluntariamente pelo usuário.</p>
          <p><strong>1.3. Concessão de Licença:</strong> O presente Contrato concede ao usuário uma licença de uso limitada, revogável, não-exclusiva, individual, temporária e intransferível para uso do software como serviço (SaaS), sem que ocorra qualquer transferência de direito autoral, propriedade industrial, titularidade de marca ou segredos de código-fonte ao licenciando.</p>
          <p><strong>1.4. Estrutura dos Planos:</strong> O serviço é disponibilizado sob o modelo freemium, dividindo-se entre Plano Gratuito (Free), Plano Básico (Basic) e Plano Profissional (Pro), cujos limites computacionais e recursos técnicos estão detalhados no site oficial.</p>

          <h3 className="text-lg sm:text-xl font-black uppercase text-black mt-10 mb-4 border-b-2 border-black/10 pb-2">
            Cláusula 2 — Do Cadastro e da Política de Uso Aceitável
          </h3>
          <p><strong>2.1. Requisitos de Acesso:</strong> O cadastro de contas de acesso ocorre via link de autenticação direta (magic link) direcionado ao e-mail fornecido pelo usuário ou mediante integração de login do provedor Google. O usuário garante a autenticidade das informações registradas.</p>
          <p><strong>2.2. Segurança:</strong> A conta criada é de uso pessoal e intransferível, respondendo o usuário de forma exclusiva por danos resultantes de uso indevido ou do compartilhamento ilícito de seu acesso com terceiros.</p>
          <p><strong>2.3. Uso Aceitável e Anti-Abuso:</strong> É expressamente proibido o uso de automações de terceiros (como bots, spiders, scrapers ou crawlers) para extrair dados, letras, cifras ou metadados da plataforma, bem como qualquer tentativa de sobrecarregar, fraudar ou comprometer a integridade dos servidores da OJO STUDIO.</p>

          <h3 className="text-lg sm:text-xl font-black uppercase text-black mt-10 mb-4 border-b-2 border-black/10 pb-2">
            Cláusula 3 — Dos Planos, Cobrança, Reajustes e Inadimplência
          </h3>
          <p><strong>3.1. Cobrança e Processamento:</strong> Os valores referentes às assinaturas são faturados de forma recorrente e antecipada (mensal ou anual). O processamento financeiro é administrado em caráter exclusivo pelo intermediador de pagamentos Stripe, via Pix ou Cartão de Crédito. As assinaturas renovam-se automaticamente, podendo ser canceladas a qualquer momento pelo usuário no painel administrativo, sem multas.</p>
          <p><strong>3.2. Período de Testes e Cupons:</strong> A ativação de períodos de teste promocionais (trial) do plano Pro exige o cadastro prévio de dados de pagamento. Salvo cancelamento anterior ao fim do prazo de testes, a plataforma efetuará a cobrança automática correspondente à mensalidade.</p>
          <p><strong>3.3. Inadimplência e Suspensão de Acesso:</strong> Caso o processamento do pagamento da assinatura falhe por qualquer motivo (cartão recusado, saldo insuficiente, etc.), o usuário terá um prazo de carência sistêmica para regularização. Findo este prazo sem o devido pagamento, a conta sofrerá downgrade automático e retornará aos limites restritos do Plano Gratuito (Free), com bloqueio imediato dos recursos premium.</p>
          
          <div className="bg-yellow-50 p-6 border-4 border-black rounded-2xl my-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-black text-black flex items-center gap-2 uppercase tracking-tight text-lg">
              <AlertTriangle size={24} className="text-yellow-500 fill-current" /> 3.4. Política de Reajuste e Alteração de Valores
            </p>
            <p className="text-sm mt-3 text-black/90 font-bold leading-relaxed">
              A OJO STUDIO reserva-se o direito de alterar e reajustar os valores dos planos de assinatura a qualquer momento. Toda e qualquer alteração de preço será comunicada aos usuários ativos através do e-mail cadastrado na plataforma com, no mínimo, 30 (trinta) dias de antecedência do próximo ciclo de faturamento.
            </p>
            <p className="text-sm mt-3 text-black/90 font-bold leading-relaxed">
              A continuidade da utilização do software e a não solicitação de cancelamento após esse período de 30 dias implicará no aceite tácito, irrevogável e automático dos novos valores contratados.
            </p>
          </div>

          <p><strong>3.5. Direito de Arrependimento:</strong> Em estrito cumprimento ao artigo 49 do Código de Defesa do Consumidor, o usuário poderá desistir da contratação no prazo improrrogável de até 7 (sete) dias corridos contados da confirmação de pagamento da primeira assinatura, promovendo-se o estorno integral via solicitação formal ao suporte (app@canta.pro).</p>

          <h3 className="text-lg sm:text-xl font-black uppercase text-black mt-10 mb-4 border-b-2 border-black/10 pb-2">
            Cláusula 4 — Da Propriedade Intelectual e Marca Registrada
          </h3>
          <p><strong>4.1. Direitos sobre a Tecnologia:</strong> Todos os direitos, titularidades e interesses relativos ao software, compreendendo o seu código-fonte, a arquitetura lógica de timecode, os algoritmos de autoplay e o design de interface, são protegidos por leis de propriedade intelectual e são de titularidade exclusiva da OJO STUDIO EXPERIÊNCIAS DIGITAIS LTDA. Absolutamente todos os direitos autorais estão reservados.</p>
          <p><strong>4.2. Marca Registrada:</strong> A denominação CANTA.PRO®, o logotipo e suas variações visuais são marcas registradas junto ao Instituto Nacional da Propriedade Industrial (INPI). O uso indevido, imitação, cópia ou veiculação da marca sem autorização expressa da OJO STUDIO ensejará as medidas judiciais cabíveis por violação de propriedade industrial.</p>
          <p><strong>4.3. Práticas Proibidas:</strong> Sob pena de exclusão da conta e responsabilização legal, é terminantemente vedado: realizar engenharia reversa do código; comercializar softwares derivados baseados no conjunto visual do CANTA.PRO; e mascarar avisos de copyright contidos na interface do aplicativo.</p>

          <h3 className="text-lg sm:text-xl font-black uppercase text-black mt-10 mb-4 border-b-2 border-black/10 pb-2">
            Cláusula 5 — Do Conteúdo Gerado pelo Usuário e APIs de Terceiros
          </h3>
          <p><strong>5.1. Responsabilidade Exclusiva:</strong> O CANTA.PRO atua estritamente como ferramenta tecnológica neutra, sendo fática e tecnologicamente impossível realizar monitoramento prévio de repertórios. Todo conteúdo, cifra ou letra digitado ou compartilhado é de responsabilidade estrita, exclusiva e cível do usuário gerador.</p>
          <p><strong>5.2. Garantias do Usuário:</strong> O usuário declara que possui as licenças aplicáveis (ECAD, CCLI, editoras musicais) para a projeção de composições protegidas em locais de execução pública (casas de shows, igrejas, etc.) ou ampara-se nas exceções legais para uso privado.</p>
          <p><strong>5.3. Intermediação de APIs Externas:</strong> A requisição de dados a partir de bases públicas de letras (como Vagalume ou LRCLIB) ocorre exclusivamente do lado do cliente (client-side requests), a comando individual do usuário. A OJO STUDIO não se responsabiliza pela conformidade legal, precisão ou interrupção de bases de dados mantidas por terceiros.</p>
          
          <div className="bg-red-50 p-6 border-4 border-black rounded-2xl my-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-black text-red-600 flex items-center gap-2 uppercase tracking-tight text-lg">
              <ShieldAlert size={24} className="text-red-500 fill-current" /> Isenção de Responsabilidade por Direitos Autorais
            </p>
            <p className="text-sm mt-3 text-black font-black uppercase tracking-tight">
              O CANTA.PRO funciona exclusivamente como uma ferramenta tecnológica de suporte e armazenamento em nuvem de textos inseridos de forma privada pelo usuário.
            </p>
            <ul className="list-disc pl-5 mt-4 text-sm space-y-2 text-black/90 font-bold">
              <li>A responsabilidade pela inserção de letras de músicas, cifras, arranjos ou qualquer conteúdo protegido por direitos autorais é 100% (cem por cento) do usuário.</li>
              <li>O CANTA.PRO não realiza triagem prévia, monitoramento, curadoria ou licencimento das letras digitadas ou coladas na plataforma.</li>
              <li>O usuário declara e garante que possui todas as autorizações, licenças ou direitos necessários para utilizar as letras das músicas em suas apresentações e repertórios.</li>
              <li>O CANTA.PRO, seu desenvolvedor e seus parceiros não serão, sob nenhuma hipótese, responsabilizados por infrações de direitos autorais, execuções públicas não autorizadas (junto ao ECAD ou órgãos similares), ou qualquer disputa jurídica decorrente do conteúdo armazenado pelo usuário em sua conta.</li>
            </ul>
          </div>

          <h3 className="text-lg sm:text-xl font-black uppercase text-black mt-10 mb-4 border-b-2 border-black/10 pb-2">
            Cláusula 6 — Do Procedimento de Notificação e Retirada (Notice and Takedown)
          </h3>
          <p><strong>6.1. Proteção Autoral:</strong> O CANTA.PRO respeita rigorosamente a propriedade intelectual. Em conformidade com o Marco Civil da Internet (Lei nº 12.965/2014) e a jurisprudência pátria, a plataforma adota o sistema de Notice and Takedown extrajudicial para infrações autorais.</p>
          <p><strong>6.2. Como Reportar:</strong> Titulares de direitos (editoras, artistas) que identificarem a distribuição não autorizada de obras via setlists públicos da plataforma devem encaminhar denúncia formal para o e-mail: <strong>app@canta.pro</strong>, contendo a indicação precisa da obra violada, a URL pública específica gerada pelo usuário infrator, comprovação de titularidade e dados de contato.</p>
          <p><strong>6.3. Bloqueio:</strong> Recebida a denúncia em conformidade, a plataforma procederá à suspensão preventiva da URL pública e notificará o usuário gerador. Inexistindo comprovação imediata de autorização legítima pelo usuário, a remoção daquele conteúdo em específico tornar-se-á definitiva no prazo de 48 horas.</p>

          <h3 className="text-lg sm:text-xl font-black uppercase text-black mt-10 mb-4 border-b-2 border-black/10 pb-2">
            Cláusula 7 — Da Limitação de Responsabilidade (SLA)
          </h3>
          <p><strong>7.1. Inexistência de Garantia de Infalibilidade:</strong> O usuário declara ciência de que sistemas baseados em nuvem estão sujeitos a interrupções fortuitas ou bugs. A obrigação assumida pela OJO STUDIO é estritamente de meio, e não de resultado garantido.</p>
          <p><strong>7.2. Exclusão de Danos Específicos:</strong> A OJO STUDIO e o CANTA.PRO não responderão civilmente por lucros cessantes, perdas de cachês, cancelamentos de shows ou prejuízos à imagem do músico decorrentes de falhas na exibição do teleprompter durante apresentações ao vivo, quedas na conexão de internet local do evento ou falhas no hardware do usuário (celular/tablet).</p>
          <p><strong>7.3. Teto Indenizatório Máximo (Cap):</strong> Caso reste comprovada judicialmente falha direta e culposa na prestação do serviço, o limite máximo pecuniário de responsabilidade indenizatória assumida pela OJO STUDIO será estritamente limitado e proporcional ao valor correspondente à somatória das mensalidades pagas pelo usuário reclamante nos últimos 12 (doze) meses anteriores ao fato gerador.</p>

          <h3 className="text-lg sm:text-xl font-black uppercase text-black mt-10 mb-4 border-b-2 border-black/10 pb-2">
            Cláusula 8 — Das Modificações e Atualizações Destes Termos
          </h3>
          <p><strong>8.1. Alterações:</strong> A OJO STUDIO reserva-se o direito de modificar, adicionar ou remover cláusulas deste instrumento a qualquer momento, visando a adequação à legislação vigente ou às novas funcionalidades do aplicativo.</p>
          <p><strong>8.2. Aceite Tácito:</strong> Atualizações significativas serão notificadas através de avisos na plataforma ou pelo e-mail cadastrado. O acesso contínuo e a utilização do CANTA.PRO após a publicação das alterações constitui total concordância e aceitação irrevogável dos novos Termos de Serviço.</p>

          <h3 className="text-lg sm:text-xl font-black uppercase text-black mt-10 mb-4 border-b-2 border-black/10 pb-2">
            Cláusula 9 — Da Lei Aplicável e do Foro de Eleição
          </h3>
          <p><strong>9.1. Legislação:</strong> Este instrumento é inteiramente regido e interpretado segundo as leis da República Federativa do Brasil.</p>
          <p><strong>9.2. Foro de Relações de Consumo:</strong> Para usuários enquadrados como consumidores finais sob a égide do CDC, faculta-se a eleição do foro correspondente ao seu domicílio.</p>
          <p><strong>9.3. Foro Corporativo (B2B):</strong> Para controvérsias decorrentes de relações institucionais, parcerias B2B com escolas de música ou disputas envolvendo o programa de afiliados, as partes elegem de forma irrevogável o foro da comarca de <strong>Bauru, Estado de São Paulo</strong>, local da sede corporativa da OJO STUDIO, com expressa renúncia a qualquer outro, por mais privilegiado que seja.</p>
        </div>
      </div>
    </div>
  );
}