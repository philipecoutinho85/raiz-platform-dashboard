import { Step } from 'react-joyride';

export const creatorTourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h2 className="text-xl font-bold mb-2">Bem-vindo, Criador! 🌱</h2>
        <p>Vamos mostrar como criar e gerenciar seus projetos na Raiz Token.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="create-project-btn"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">1. Criar Projeto</h3>
        <p>Clique aqui para criar um novo projeto. Você precisará definir:</p>
        <ul className="list-disc list-inside mt-2 text-sm">
          <li>Título e descrição</li>
          <li>Meta de arrecadação</li>
          <li>Prazo da campanha</li>
          <li>Categoria do projeto</li>
          <li>Vídeo de apresentação</li>
        </ul>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="my-projects"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">2. Meus Projetos</h3>
        <p>Aqui você acompanha todos os seus projetos, vê o progresso e gerencia as campanhas.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="stats"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">3. Estatísticas</h3>
        <p>Acompanhe em tempo real:</p>
        <ul className="list-disc list-inside mt-2 text-sm">
          <li>Projetos ativos</li>
          <li>Total arrecadado</li>
          <li>Número de apoiadores</li>
        </ul>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-bold mb-2">4. Novidades do Projeto</h3>
        <p>Mantenha seus apoiadores engajados publicando novidades:</p>
        <ul className="list-disc list-inside mt-2 text-sm">
          <li>Atualizações públicas para todos</li>
          <li>Conteúdo exclusivo para apoiadores</li>
          <li>Fotos e relatórios de progresso</li>
        </ul>
      </div>
    ),
    placement: 'center',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-bold mb-2">5. Prestação de Contas</h3>
        <p>Após atingir a meta, você deve prestar contas:</p>
        <ul className="list-disc list-inside mt-2 text-sm">
          <li>Envie relatório detalhado</li>
          <li>Adicione fotos comprovando a execução</li>
          <li>Ganhe badges de confiabilidade</li>
        </ul>
      </div>
    ),
    placement: 'center',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-bold mb-2">Boas Práticas</h3>
        <ul className="list-disc list-inside text-sm">
          <li>Seja transparente sobre os custos</li>
          <li>Responda dúvidas dos apoiadores</li>
          <li>Publique novidades regularmente</li>
          <li>Cumpra os prazos prometidos</li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">Isso aumenta seu RaizScore!</p>
      </div>
    ),
    placement: 'center',
  },
];
