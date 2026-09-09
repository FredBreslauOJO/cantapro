# Funcionamento offline

O aplicativo abre a conta previamente autenticada e o conteúdo já baixado antes de aguardar a rede. A sessão local é apenas um meio de exibir a cópia privada do aparelho: operações no servidor continuam sujeitas à autenticação e às políticas RLS.

## Armazenamento e atualização

- Um documento por conta no IndexedDB contém biblioteca, repertórios, ordem, letras, divisores e timecodes. A gravação é transacional; uma falha de download ou de gravação preserva a última cópia completa.
- Após autenticação online, a atualização ocorre em segundo plano ao abrir, recuperar conexão, voltar ao aplicativo e a cada minuto enquanto visível. “Verificar offline” permite solicitar uma nova tentativa e solicitar persistência ao navegador.
- Alterações confirmadas no servidor atualizam a cópia local. Exclusões e saída de repertórios removem o conteúdo correspondente. A conclusão de uma sincronização completa elimina cópias antigas redundantes.
- O teleprompter mantém a versão com que o show foi aberto. Para usar uma revisão recebida durante a apresentação, saia do teleprompter e abra novamente.
- O usuário escolhe quando instalar uma atualização do aplicativo. O botão fica fora do teleprompter.
- Sair da conta apaga seus dados locais e bloqueia respostas tardias da sessão antiga. Será necessário entrar novamente com internet e baixar o conteúdo.

## Antes de usar no palco

1. Abra o aplicativo com internet no aparelho que será usado no show.
2. Instale a atualização disponível e entre na conta, caso necessário.
3. Use “Verificar offline” e aguarde a indicação dos repertórios salvos e a data de atualização, sem erro de armazenamento.
4. Ative o modo avião, feche o aplicativo e abra novamente pelo mesmo atalho instalado. Confira o repertório e avance entre as músicas.

A primeira visita ao domínio e conteúdo nunca baixado exigem internet. O sistema operacional pode apagar dados quando o usuário limpa o navegador, usa navegação privada ou o aparelho fica sem espaço. A solicitação de persistência reduz esse risco quando concedida, mas não substitui a conferência antes do show. Edições no servidor exigem conexão; esta versão não implementa uma fila de edição offline.

## Validação automatizada

`npm test` inclui testes dos componentes reais de autenticação e teleprompter, com rede/sessão simuladas, e IndexedDB simulado: sessão expirada, renovação pendente, resposta tardia sem sessão, logout sem rede, isolamento entre contas, exclusão, preservação após transação abortada, reabertura do banco e estabilidade das letras durante sincronização. Inclui ainda regressões das políticas de banco e cobrança. `npm run lint` e `npm run build` validam o código e geram o precache do PWA.

Esses testes não equivalem a uma validação em Android físico nem simulam todas as políticas de armazenamento e atualização do Chrome. A conferência em modo avião no aparelho continua necessária para a homologação no dispositivo.
