import { Step } from 'react-joyride';

export const supporterTourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h2 className="text-xl font-bold mb-2">Bem-vindo, Apoiador! 🌱</h2>
        <p>Vamos mostrar como apoiar projetos e usar seus tokens na Raiz Token.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="marketplace"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">1. Explorar Projetos</h3>
        <p>No Marketplace você encontra todos os projetos disponíveis para apoiar. Use filtros para encontrar projetos que combinam com você.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="tokens-display"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">2. Seus Tokens</h3>
        <p>Aqui você vê quantos tokens tem disponíveis. Cada token vale R$ 1,00 e pode ser usado para apoiar projetos.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="buy-tokens"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">3. Comprar Tokens</h3>
        <p>Clique aqui para comprar mais tokens. O valor mínimo é R$ 5,00 (5 tokens).</p>
        <p className="mt-2 text-sm text-muted-foreground">Pagamento seguro via Pagar.me</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-bold mb-2">4. Apoiar um Projeto</h3>
        <p>Na página do projeto, você pode:</p>
        <ul className="list-disc list-inside mt-2 text-sm">
          <li>Ver detalhes e vídeo de apresentação</li>
          <li>Conferir o RaizScore do criador</li>
          <li>Escolher quantos tokens quer doar</li>
          <li>Acompanhar o progresso da campanha</li>
        </ul>
      </div>
    ),
    placement: 'center',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-bold mb-2">5. Acompanhar Projetos</h3>
        <p>Após apoiar, você pode:</p>
        <ul className="list-disc list-inside mt-2 text-sm">
          <li>Ver novidades exclusivas</li>
          <li>Comentar e tirar dúvidas</li>
          <li>Reagir às atualizações</li>
          <li>Acompanhar a prestação de contas</li>
        </ul>
      </div>
    ),
    placement: 'center',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-bold mb-2">Proteção ao Apoiador</h3>
        <p className="text-sm">Se o projeto não atingir a meta ou for cancelado, seus tokens são devolvidos automaticamente!</p>
        <p className="mt-2 text-sm text-muted-foreground">A Raiz Token protege você.</p>
      </div>
    ),
    placement: 'center',
  },
];
