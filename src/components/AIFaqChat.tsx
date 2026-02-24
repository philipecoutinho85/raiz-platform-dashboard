
import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircleQuestion, X, Send, ArrowLeft, Mail, ChevronRight, Search, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ─── FAQ Data ──────────────────────────────────────────────────────────
interface FaqItem {
  id: string;
  question: string;
  keywords: string[];
  answer: string[];
}

interface FaqCategory {
  id: string;
  title: string;
  icon: string;
  items: FaqItem[];
}

const faqData: FaqCategory[] = [
  {
    id: 'projetos',
    title: '📂 Projetos',
    icon: '📂',
    items: [
      {
        id: 'criar-projeto',
        question: 'Como criar meu primeiro projeto?',
        keywords: ['criar', 'projeto', 'primeiro', 'novo', 'campanha', 'iniciar'],
        answer: [
          '🎯 **Como criar seu primeiro projeto na Raiz Token:**',
          '',
          '**1. Faça login** na plataforma com sua conta.',
          '',
          '**2. Acesse "Criar Projeto"** no menu principal ou pelo Dashboard.',
          '',
          '**3. Preencha os dados obrigatórios:**',
          '• Título do projeto (claro e atrativo)',
          '• Descrição detalhada do que você pretende realizar',
          '• Meta de arrecadação (valor em R$)',
          '• Prazo da campanha',
          '• Categoria do projeto',
          '• Vídeo de apresentação (URL do YouTube)',
          '• Imagens ilustrativas do projeto',
          '',
          '**4. Aceite os termos** da plataforma e as regras para criadores.',
          '',
          '**5. Envie para aprovação.** Nossa equipe analisará seu projeto em até 48h.',
          '',
          '⚠️ **Importante:** Você pode ter apenas 1 projeto ativo por vez. Para criar um novo, o anterior precisa estar cancelado, expirado ou com prestação de contas aprovada.',
          '',
          '💡 **Dica:** Quanto mais detalhada for sua descrição e quanto melhor for seu vídeo, maiores são as chances de atrair apoiadores!'
        ]
      },
      {
        id: 'aprovar-projeto',
        question: 'Quanto tempo leva para aprovar meu projeto?',
        keywords: ['aprovar', 'aprovação', 'tempo', 'análise', 'pendente', 'revisar'],
        answer: [
          '⏱️ **Prazo de aprovação de projetos:**',
          '',
          'Nossa equipe analisa cada projeto cuidadosamente para garantir a qualidade da plataforma.',
          '',
          '**Prazo médio:** até **48 horas úteis** após o envio.',
          '',
          '**O que avaliamos:**',
          '• Clareza e viabilidade do projeto',
          '• Qualidade da descrição e imagens',
          '• Conformidade com os termos da plataforma',
          '• Vídeo de apresentação',
          '',
          '**Possíveis resultados:**',
          '✅ **Aprovado** — Seu projeto vai ao ar imediatamente',
          '❌ **Rejeitado** — Você receberá um motivo e poderá reenviar após ajustes',
          '',
          '📩 Você será notificado por e-mail e pela plataforma sobre o resultado.'
        ]
      },
      {
        id: 'editar-projeto',
        question: 'Posso editar meu projeto depois de publicado?',
        keywords: ['editar', 'alterar', 'modificar', 'atualizar', 'mudar', 'publicado'],
        answer: [
          '✏️ **Edição de projetos publicados:**',
          '',
          'Após a aprovação, você pode publicar **atualizações** no seu projeto para manter os apoiadores informados.',
          '',
          '**O que você pode fazer:**',
          '• Postar atualizações com textos e imagens',
          '• Adicionar fotos à galeria do projeto',
          '• Interagir nos comentários com apoiadores',
          '',
          '**O que NÃO pode ser alterado:**',
          '• Meta de arrecadação',
          '• Prazo da campanha',
          '• Dados fundamentais do projeto',
          '',
          '💡 Use as atualizações para mostrar o progresso e engajar seus apoiadores!'
        ]
      },
      {
        id: 'nao-consigo-criar',
        question: 'Não consigo criar meu projeto. O que fazer?',
        keywords: ['não consigo', 'criar', 'erro', 'bloqueado', 'verificação', 'identidade', 'stripe', 'impedido', 'não posso'],
        answer: [
          '🚫 **Não consegue criar seu projeto? Veja as possíveis causas:**',
          '',
          '**1. Verificação de Identidade (Stripe Connect) pendente**',
          'Antes de criar qualquer projeto, você precisa completar a verificação de identidade através do Stripe Connect.',
          '',
          '**Como resolver:**',
          '• Acesse seu **Perfil** (clique no avatar no canto superior direito)',
          '• Vá até a aba **"Recebimentos"**',
          '• Clique em **"Completar Verificação"**',
          '• Preencha seus dados bancários e envie os documentos solicitados (RG ou CNH)',
          '• Aguarde a aprovação do Stripe (geralmente em poucos minutos)',
          '',
          '✅ Após a verificação, o botão de criar projeto será liberado automaticamente.',
          '',
          '**2. Você já possui um projeto ativo**',
          'A plataforma permite apenas **1 projeto ativo por vez** (pendente ou aprovado).',
          '',
          '**Como resolver:**',
          '• Verifique em **"Meus Projetos"** se há algum projeto pendente ou ativo',
          '• O projeto anterior precisa estar cancelado, expirado ou com prestação de contas aprovada',
          '',
          '**3. Prestação de contas pendente**',
          'Se você teve um projeto anterior finalizado, precisa ter a prestação de contas **aprovada** pelo admin antes de criar um novo.',
          '',
          '📩 Se nenhuma dessas opções resolver, entre em contato com nosso suporte!'
        ]
      },
      {
        id: 'prestacao-contas',
        question: 'O que é a prestação de contas?',
        keywords: ['prestação', 'contas', 'accountability', 'comprovar', 'comprovante', 'relatório'],
        answer: [
          '📊 **Prestação de Contas na Raiz Token:**',
          '',
          'A prestação de contas é um pilar fundamental da plataforma, garantindo **transparência total** para os apoiadores.',
          '',
          '**Como funciona:**',
          '1. Após o encerramento da campanha, o criador deve prestar contas do uso dos recursos',
          '2. Envie comprovantes, notas fiscais e relatórios de como os recursos foram utilizados',
          '3. Os apoiadores e a equipe da Raiz Token analisam a prestação',
          '',
          '**Por que é importante:**',
          '• Aumenta sua **reputação** (RaizScore) na plataforma',
          '• Gera confiança para futuros projetos',
          '• É obrigatório para criar novos projetos',
          '',
          '⚠️ Sem prestação de contas aprovada, você não poderá criar novos projetos.'
        ]
      }
    ]
  },
  {
    id: 'pagamentos',
    title: '💳 Pagamentos e Tokens',
    icon: '💳',
    items: [
      {
        id: 'como-apoiar',
        question: 'Como apoiar um projeto?',
        keywords: ['apoiar', 'contribuir', 'doar', 'pagar', 'apoio', 'contribuição'],
        answer: [
          '🤝 **Como apoiar um projeto na Raiz Token:**',
          '',
          '**1.** Navegue pelo **Marketplace** e encontre um projeto que te inspire.',
          '',
          '**2.** Acesse a página do projeto e clique em **"Apoiar"**.',
          '',
          '**3.** Escolha o valor ou a quantidade de tokens que deseja contribuir.',
          '',
          '**4.** Finalize o pagamento com **cartão de crédito** de forma segura via Stripe.',
          '',
          '**Formas de apoio:**',
          '• 💳 Cartão de crédito (Visa, Mastercard, etc.)',
          '• 🪙 Tokens da plataforma (comprados previamente)',
          '',
          '✅ Após o pagamento, você aparecerá na lista de apoiadores do projeto e receberá atualizações.',
          '',
          '🔒 Todos os pagamentos são processados pelo **Stripe**, garantindo total segurança.'
        ]
      },
      {
        id: 'o-que-sao-tokens',
        question: 'O que são tokens e como funcionam?',
        keywords: ['token', 'tokens', 'moeda', 'comprar', 'funciona', 'usar'],
        answer: [
          '🪙 **Tokens na Raiz Token:**',
          '',
          'Os tokens são a moeda interna da plataforma, usados para apoiar projetos de forma simples e rápida.',
          '',
          '**Como adquirir tokens:**',
          '1. Acesse sua **Carteira** no menu',
          '2. Escolha a quantidade desejada',
          '3. Realize o pagamento via cartão de crédito',
          '',
          '**Como usar tokens:**',
          '• Apoie projetos usando seus tokens',
          '• Cada token tem um valor fixo em reais',
          '• Os tokens ficam disponíveis na sua carteira digital',
          '',
          '**Vantagens:**',
          '✅ Agilidade — apoie com poucos cliques',
          '✅ Praticidade — não precisa inserir dados do cartão toda vez',
          '✅ Visibilidade — acompanhe seu saldo em tempo real no header',
          '',
          '💡 Você pode ver seu saldo de tokens no topo da página, ao lado do sino de notificações.'
        ]
      },
      {
        id: 'reembolso',
        question: 'Como solicitar um reembolso?',
        keywords: ['reembolso', 'devolver', 'devolução', 'cancelar', 'estorno', 'dinheiro volta'],
        answer: [
          '💰 **Política de Reembolso da Raiz Token:**',
          '',
          '**Reembolso por cartão de crédito:**',
          '1. Acesse o projeto que você apoiou',
          '2. Localize a opção de **"Solicitar Reembolso"**',
          '3. Informe o motivo da solicitação',
          '4. O reembolso será processado em até **7 dias úteis**',
          '',
          '**Reembolso por boleto:**',
          '• Para pagamentos via boleto, entre em contato pelo formulário de contato',
          '• Informe os dados bancários para transferência',
          '',
          '**Condições:**',
          '• O reembolso pode ser solicitado dentro do período de carência',
          '• Projetos já finalizados podem ter regras específicas',
          '',
          '📩 Em caso de dúvidas, entre em contato pelo nosso **formulário de contato**.'
        ]
      }
    ]
  },
  {
    id: 'saques',
    title: '🏦 Saques e Recebimentos',
    icon: '🏦',
    items: [
      {
        id: 'como-sacar',
        question: 'Como sacar o dinheiro arrecadado?',
        keywords: ['sacar', 'saque', 'retirar', 'receber', 'dinheiro', 'arrecadado', 'transferir'],
        answer: [
          '🏦 **Como sacar seus recursos na Raiz Token:**',
          '',
          '**Pré-requisitos:**',
          '✅ Ter uma conta **Stripe Connect** configurada (em Perfil > Recebimentos)',
          '✅ Verificação de identidade completa',
          '✅ Projeto com arrecadação disponível para saque',
          '',
          '**Passo a passo:**',
          '1. Acesse **"Meus Projetos"**',
          '2. Selecione o projeto e vá para a seção de **Saques**',
          '3. Informe o valor desejado',
          '4. Confirme sua identidade (verificação por e-mail)',
          '5. Aceite o termo de responsabilidade',
          '6. Aguarde o processamento',
          '',
          '**Taxas:**',
          '• Taxa da plataforma: aplicada sobre o valor bruto',
          '• Taxa do Stripe: processamento do pagamento',
          '• O valor líquido é exibido antes da confirmação',
          '',
          '⏱️ **Prazo:** O processamento pode levar de 2 a 5 dias úteis após a aprovação.'
        ]
      },
      {
        id: 'configurar-recebimentos',
        question: 'Como configurar meus recebimentos (Stripe Connect)?',
        keywords: ['stripe', 'connect', 'recebimentos', 'configurar', 'conta', 'bancária', 'verificação'],
        answer: [
          '⚙️ **Configurando o Stripe Connect:**',
          '',
          'Para receber os valores arrecadados, você precisa configurar o **Stripe Connect**.',
          '',
          '**Passo a passo:**',
          '1. Acesse seu **Perfil**',
          '2. Clique na aba **"Recebimentos"**',
          '3. Clique em **"Completar Verificação"** ou **"Configurar Stripe Connect"**',
          '4. Você será redirecionado ao Stripe para preencher seus dados bancários e documentos',
          '5. Após a verificação, sua conta estará pronta para receber',
          '',
          '**Dados necessários:**',
          '• Documento de identidade (RG ou CNH)',
          '• Dados bancários (banco, agência, conta)',
          '• Comprovante de endereço',
          '',
          '⚠️ **Importante:** Sem a verificação do Stripe Connect, você não conseguirá criar projetos na plataforma.',
          '',
          '🔒 Todos os dados são processados diretamente pelo Stripe, com segurança bancária.'
        ]
      }
    ]
  },
  {
    id: 'conta',
    title: '👤 Minha Conta',
    icon: '👤',
    items: [
      {
        id: 'alterar-dados',
        question: 'Como alterar meus dados pessoais?',
        keywords: ['alterar', 'dados', 'perfil', 'nome', 'email', 'celular', 'endereço', 'foto', 'avatar'],
        answer: [
          '👤 **Alterando seus dados pessoais:**',
          '',
          '1. Clique no seu **avatar** no canto superior direito',
          '2. Selecione **"Perfil"**',
          '3. Edite os campos desejados:',
          '   • Nome e sobrenome',
          '   • Celular',
          '   • Endereço completo (CEP, rua, número, bairro, cidade, estado)',
          '   • Foto de perfil',
          '',
          '4. Clique em **"Salvar Alterações"**',
          '',
          '⚠️ **Campos que não podem ser alterados:**',
          '• CPF (cadastrado no registro)',
          '• E-mail (vinculado à autenticação)',
          '• Data de nascimento',
          '',
          '📸 Para alterar a foto, clique no avatar e faça upload de uma nova imagem.'
        ]
      },
      {
        id: 'esqueci-senha',
        question: 'Esqueci minha senha. Como recuperar?',
        keywords: ['senha', 'esqueci', 'recuperar', 'redefinir', 'trocar', 'reset'],
        answer: [
          '🔑 **Recuperação de senha:**',
          '',
          '1. Na tela de login, clique em **"Esqueci minha senha"**',
          '2. Digite o **e-mail** cadastrado na plataforma',
          '3. Clique em **"Enviar e-mail de recuperação"**',
          '4. Acesse seu e-mail e clique no link recebido',
          '5. Defina uma **nova senha** segura',
          '',
          '💡 **Dicas para uma senha segura:**',
          '• Use pelo menos 8 caracteres',
          '• Combine letras maiúsculas, minúsculas e números',
          '• Evite dados pessoais óbvios',
          '',
          '📩 Se não receber o e-mail, verifique a pasta de **spam/lixo eletrônico**.'
        ]
      },
      {
        id: 'excluir-conta',
        question: 'Como excluir minha conta?',
        keywords: ['excluir', 'deletar', 'apagar', 'remover', 'conta', 'cancelar conta'],
        answer: [
          '🗑️ **Exclusão de conta na Raiz Token:**',
          '',
          'Em conformidade com a **LGPD**, você tem o direito de solicitar a exclusão da sua conta.',
          '',
          '**Passo a passo:**',
          '1. Acesse seu **Perfil**',
          '2. Vá ao **Centro de Privacidade**',
          '3. Clique em **"Solicitar Exclusão de Conta"**',
          '4. Confirme a solicitação',
          '',
          '**Importante:**',
          '• Há um **período de carência de 90 dias** antes da exclusão definitiva',
          '• Durante esse período, você pode cancelar a solicitação',
          '• Após os 90 dias, todos os dados são removidos permanentemente',
          '• Projetos ativos devem ser finalizados antes da exclusão',
          '',
          '⚠️ Esta ação é **irreversível** após o período de carência.'
        ]
      },
      {
        id: 'privacidade-dados',
        question: 'Como protegem meus dados pessoais?',
        keywords: ['privacidade', 'lgpd', 'dados', 'proteção', 'segurança', 'informações'],
        answer: [
          '🔒 **Proteção de dados na Raiz Token (LGPD):**',
          '',
          'Levamos a proteção dos seus dados muito a sério.',
          '',
          '**Seus direitos:**',
          '• 📋 **Exportar seus dados** — Baixe todos os seus dados em JSON ou CSV',
          '• 🗑️ **Excluir sua conta** — Solicite a remoção completa',
          '• 👁️ **Consultar** — Veja quais dados armazenamos',
          '• ✏️ **Corrigir** — Altere dados incorretos',
          '',
          '**Medidas de segurança:**',
          '• Autenticação segura via Supabase Auth',
          '• Pagamentos processados pelo Stripe (PCI DSS)',
          '• 2FA obrigatório para administradores',
          '• Sanitização de todo conteúdo gerado por usuários',
          '• Criptografia de dados sensíveis',
          '',
          '📄 Consulte nossa **Política de Privacidade** completa em /privacy',
          '',
          '**DPO:** contato@raiztoken.com.br'
        ]
      }
    ]
  },
  {
    id: 'reputacao',
    title: '⭐ Reputação e Badges',
    icon: '⭐',
    items: [
      {
        id: 'raiz-score',
        question: 'O que é o RaizScore?',
        keywords: ['raiz', 'score', 'pontuação', 'reputação', 'nota', 'nível', 'level'],
        answer: [
          '⭐ **RaizScore — Sistema de Reputação:**',
          '',
          'O RaizScore é a pontuação de reputação dos criadores na plataforma.',
          '',
          '**Critérios avaliados:**',
          '• 📊 **Prestação de contas** — Transparência com apoiadores',
          '• 🎯 **Qualidade de entrega** — Cumprimento das promessas',
          '• 💬 **Engajamento** — Interação com a comunidade',
          '• 📈 **Histórico de sucesso** — Projetos bem-sucedidos anteriores',
          '• ⏰ **Tempo na plataforma** — Experiência acumulada',
          '• ✅ **Comportamento** — Respeito às regras',
          '• 🚫 **Denúncias** — Ausência de denúncias procedentes',
          '',
          '**Níveis de reputação:**',
          'Quanto maior seu score, mais confiança você transmite aos apoiadores e melhores oportunidades terá na plataforma.',
          '',
          '💡 Mantenha uma prestação de contas impecável para melhorar seu score!'
        ]
      },
      {
        id: 'badges',
        question: 'Como ganhar badges na plataforma?',
        keywords: ['badge', 'badges', 'conquista', 'medalha', 'selo', 'ganhar'],
        answer: [
          '🏅 **Sistema de Badges:**',
          '',
          'Badges são conquistas visuais que destacam suas realizações na plataforma.',
          '',
          '**Tipos de badges:**',
          '• 🤖 **Automáticos** — Concedidos automaticamente ao atingir critérios específicos',
          '• 🎖️ **Manuais** — Concedidos pela equipe Raiz Token para realizações especiais',
          '',
          '**Exemplos de conquistas:**',
          '• Primeiro projeto criado',
          '• Primeiro apoio realizado',
          '• Projeto 100% financiado',
          '• Prestação de contas aprovada',
          '• Apoiador frequente',
          '',
          '**Onde aparecem:**',
          '• No seu perfil público',
          '• Na página dos seus projetos',
          '• No ranking de apoiadores',
          '',
          '💡 Continue participando ativamente para desbloquear mais badges!'
        ]
      }
    ]
  },
  {
    id: 'suporte',
    title: '🛟 Suporte',
    icon: '🛟',
    items: [
      {
        id: 'contato-suporte',
        question: 'Como entrar em contato com o suporte?',
        keywords: ['contato', 'suporte', 'ajuda', 'falar', 'atendimento', 'email'],
        answer: [
          '📩 **Canais de atendimento:**',
          '',
          '**1. Central de Suporte (usuários logados):**',
          '• Acesse seu Perfil > aba "Suporte"',
          '• Abra uma nova conversa',
          '• Categorias: Apoio, Projeto, Perfil, Saque',
          '• Chat em tempo real com nossa equipe',
          '',
          '**2. Formulário de Contato (qualquer pessoa):**',
          '• Acesse a página **"Falar Conosco"** no menu',
          '• Preencha nome, e-mail, assunto e mensagem',
          '• Receba confirmação por e-mail',
          '',
          '**3. E-mail direto:**',
          '• raiztoken@gmail.com',
          '',
          '⏱️ **Tempo de resposta:** até 24 horas úteis',
          '',
          '💡 Para questões urgentes sobre pagamentos ou saques, use a Central de Suporte para atendimento prioritário.'
        ]
      },
      {
        id: 'denunciar-projeto',
        question: 'Como denunciar um projeto?',
        keywords: ['denunciar', 'denúncia', 'reportar', 'fraude', 'golpe', 'problema'],
        answer: [
          '🚨 **Denunciando um projeto:**',
          '',
          '**Passo a passo:**',
          '1. Acesse a página do projeto',
          '2. Clique no botão de **denúncia/report**',
          '3. Selecione o motivo da denúncia',
          '4. Descreva detalhadamente o problema',
          '5. Envie a denúncia',
          '',
          '**Motivos comuns:**',
          '• Conteúdo enganoso ou falso',
          '• Plágio ou violação de direitos autorais',
          '• Comportamento inadequado do criador',
          '• Uso indevido dos recursos arrecadados',
          '',
          '**O que acontece após a denúncia:**',
          '• Nossa equipe analisa em até **48 horas**',
          '• O projeto pode ser suspenso temporariamente',
          '• Você será notificado sobre o resultado',
          '',
          '🔒 Sua identidade como denunciante é **protegida**.'
        ]
      }
    ]
  }
];

// ─── Component ─────────────────────────────────────────────────────────

type ChatView = 'home' | 'category' | 'answer' | 'contact';

interface ChatMessage {
  role: 'bot' | 'user';
  content: string;
  isTyping?: boolean;
}

const AIFaqChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ChatView>('home');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingIndex]);

  // Typing animation effect
  useEffect(() => {
    if (!isAnimating || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'bot' || !lastMsg.isTyping) return;

    const fullLines = lastMsg.content.split('\n');
    if (typingIndex >= fullLines.length) {
      setMessages(prev =>
        prev.map((m, i) => i === prev.length - 1 ? { ...m, isTyping: false } : m)
      );
      setIsAnimating(false);
      return;
    }

    const delay = fullLines[typingIndex].trim() === '' ? 80 : Math.min(30 + fullLines[typingIndex].length * 2, 120);
    const timer = setTimeout(() => {
      setTypingIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [typingIndex, isAnimating, messages]);

  const startTypingAnswer = (answer: string[]) => {
    const fullContent = answer.join('\n');
    setTypingIndex(0);
    setIsAnimating(true);
    setMessages(prev => [...prev, { role: 'bot', content: fullContent, isTyping: true }]);
  };

  const handleSelectFaq = (item: FaqItem) => {
    setView('answer');
    setMessages(prev => [...prev, { role: 'user', content: item.question }]);
    setTimeout(() => startTypingAnswer(item.answer), 400);
  };

  const handleCategorySelect = (category: FaqCategory) => {
    setSelectedCategory(category);
    setView('category');
  };

  const handleBack = () => {
    if (view === 'answer') {
      setView(selectedCategory ? 'category' : 'home');
    } else if (view === 'category' || view === 'contact') {
      setView('home');
      setSelectedCategory(null);
    }
  };

  const handleReset = () => {
    setView('home');
    setSelectedCategory(null);
    setMessages([]);
    setSearchQuery('');
    setContactSent(false);
    setContactForm({ name: '', email: '', message: '' });
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSending(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      await fetch(`${supabaseUrl}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          category: 'apoio',
          title: 'Dúvida via Assistente Virtual',
          message: contactForm.message,
          hasAttachment: false,
        }),
      });
      setContactSent(true);
    } catch {
      // silent fail, show generic message
    } finally {
      setContactSending(false);
    }
  };

  // Search across all FAQs
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const results: FaqItem[] = [];
    for (const cat of faqData) {
      for (const item of cat.items) {
        if (
          item.question.toLowerCase().includes(q) ||
          item.keywords.some(k => k.includes(q))
        ) {
          results.push(item);
        }
      }
    }
    return results;
  }, [searchQuery]);

  const renderTypingContent = (msg: ChatMessage) => {
    if (!msg.isTyping) return msg.content;
    const lines = msg.content.split('\n');
    return lines.slice(0, typingIndex).join('\n');
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      let processed = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      
      if (line.trim() === '') return <br key={i} />;
      if (line.startsWith('• ')) {
        return <p key={i} className="ml-3 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed z-[60] rounded-full shadow-lg transition-all duration-300 flex items-center justify-center',
          'bg-primary text-primary-foreground hover:shadow-xl hover:scale-105',
          'w-14 h-14 md:w-16 md:h-16',
          'bottom-20 right-4 md:bottom-6 md:right-6',
          isOpen && 'scale-0 opacity-0 pointer-events-none'
        )}
        aria-label="Assistente virtual"
      >
        <MessageCircleQuestion className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </span>
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          'fixed z-[60] bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right',
          'bottom-20 right-4 md:bottom-6 md:right-6',
          'w-[calc(100vw-2rem)] max-w-[400px]',
          isOpen ? 'h-[70vh] max-h-[600px] scale-100 opacity-100' : 'h-0 scale-95 opacity-0 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shrink-0">
          {view !== 'home' && (
            <button onClick={handleBack} className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bot className="w-6 h-6 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">Assistente Raiz Token</h3>
              <p className="text-[10px] opacity-80">Tire suas dúvidas rapidamente</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {view !== 'home' && (
              <button onClick={handleReset} className="text-xs opacity-80 hover:opacity-100 px-2 py-1 rounded hover:bg-white/10 transition-colors">
                Início
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80 transition-opacity p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* HOME */}
          {view === 'home' && (
            <>
              <div className="bg-muted rounded-xl p-3">
                <p className="text-sm font-medium">👋 Olá! Sou o assistente da Raiz Token.</p>
                <p className="text-xs text-muted-foreground mt-1">Escolha um tema ou pesquise sua dúvida:</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Digite sua dúvida..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm h-10"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="space-y-1">
                  {searchResults.length > 0 ? (
                    searchResults.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectFaq(item)}
                        className="w-full text-left px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm flex items-center gap-2"
                      >
                        <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                        <span className="line-clamp-1">{item.question}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 text-primary"
                        onClick={() => { setView('contact'); setSearchQuery(''); }}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Enviar sua dúvida por e-mail
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Categories */}
              {searchQuery.length < 2 && (
                <div className="space-y-2">
                  {faqData.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium flex items-center justify-between group"
                    >
                      <span>{cat.title}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}

                  <button
                    onClick={() => setView('contact')}
                    className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium flex items-center justify-between group text-muted-foreground hover:text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Não encontrou? Fale conosco
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* CATEGORY */}
          {view === 'category' && selectedCategory && (
            <>
              <div className="bg-muted rounded-xl p-3">
                <p className="text-sm font-medium">{selectedCategory.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Selecione sua dúvida:</p>
              </div>
              <div className="space-y-1">
                {selectedCategory.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectFaq(item)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm flex items-center gap-2"
                  >
                    <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                    <span>{item.question}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setView('contact')}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-2 py-2"
              >
                Minha dúvida não está aqui →
              </button>
            </>
          )}

          {/* ANSWER (Chat messages) */}
          {view === 'answer' && (
            <>
              {messages.map((msg, idx) => (
                <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 space-y-0.5',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    {msg.role === 'bot' ? (
                      <>
                        {renderMarkdown(renderTypingContent(msg))}
                        {msg.isTyping && (
                          <span className="inline-flex gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                          </span>
                        )}
                      </>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* After answer is done, show follow-up options */}
              {messages.length > 0 && !messages[messages.length - 1]?.isTyping && (
                <div className="space-y-2 pt-2 border-t border-border mt-2">
                  <p className="text-xs text-muted-foreground text-center">Sua dúvida foi respondida?</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={handleReset} className="text-xs">
                      ✅ Sim, obrigado!
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setView('contact')} className="text-xs">
                      <Mail className="w-3 h-3 mr-1" />
                      Ainda tenho dúvidas
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* CONTACT FORM */}
          {view === 'contact' && (
            <>
              {contactSent ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <span className="text-3xl">✉️</span>
                  </div>
                  <p className="text-sm font-medium">Mensagem enviada com sucesso!</p>
                  <p className="text-xs text-muted-foreground">Responderemos em até 24 horas no e-mail informado.</p>
                  <Button size="sm" variant="outline" onClick={handleReset} className="text-xs mt-3">
                    Voltar ao início
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-sm font-medium">📩 Envie sua dúvida</p>
                    <p className="text-xs text-muted-foreground mt-1">Preencha o formulário e responderemos em até 24h.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
                      <Input
                        value={contactForm.name}
                        onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Seu nome"
                        className="text-sm h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">E-mail</label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="seu@email.com"
                        className="text-sm h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Sua dúvida</label>
                      <textarea
                        value={contactForm.message}
                        onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                        placeholder="Descreva sua dúvida em detalhes..."
                        rows={4}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                    </div>
                    <Button
                      onClick={handleContactSubmit}
                      disabled={contactSending || !contactForm.name || !contactForm.email || !contactForm.message}
                      className="w-full"
                      size="sm"
                    >
                      {contactSending ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Enviando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Enviar mensagem
                        </span>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 bg-muted/30 shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            Raiz Token — Conectando sonhos a apoiadores 🌱
          </p>
        </div>
      </div>
    </>
  );
};

export default AIFaqChat;
