import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const extraFaqItems = [
  {
    question: 'Como posso apoiar um projeto?',
    answer: 'Crie sua conta, compre tokens com valor mínimo de R$5,00 e escolha o projeto que deseja apoiar. O apoio é feito com tokens dentro da plataforma.'
  },
  {
    question: 'O que acontece se eu mudar de ideia?',
    answer: 'Antes do encerramento do projeto, você pode solicitar reembolso conforme as regras aplicáveis. Nesse caso, os tokens correspondentes são removidos da carteira.'
  },
  {
    question: 'Os criadores são verificados?',
    answer: 'Sim. A plataforma possui validação de identidade e análise do projeto antes da publicação, reforçando segurança e responsabilidade.'
  },
  {
    question: 'O que é RaizScore?',
    answer: 'É um sinal de reputação da plataforma, usado para indicar consistência, transparência e histórico do criador ou do projeto.'
  },
  {
    question: 'O que são badges?',
    answer: 'Badges são sinais públicos que ajudam a comunicar verificações, marcos, reputação e boas práticas de transparência dentro da plataforma.'
  },
  {
    question: 'Existe prestação de contas?',
    answer: 'Sim. A prestação de contas é parte central da Raiz Token e ajuda o apoiador a acompanhar como o projeto evoluiu após receber apoio.'
  },
  {
    question: 'A Raiz Token é investimento?',
    answer: 'Não. A Raiz Token é uma plataforma de apoio a projetos. Token não é investimento, não gera rendimento e não representa participação societária.'
  }
];

const HomeFAQController = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') return;

    const style = document.createElement('style');
    style.setAttribute('data-raiz-home-faq-accordion', 'true');
    style.textContent = `
      .raiz-public-home #faq .space-y-4 > div {
        cursor: pointer;
        position: relative;
      }

      .raiz-public-home #faq .space-y-4 > div h3 {
        padding-right: 2rem;
      }

      .raiz-public-home #faq .space-y-4 > div h3::after {
        content: '+';
        position: absolute;
        right: 1.5rem;
        top: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(29, 140, 90, 0.1);
        color: #1D8C5A;
        font-size: 1rem;
        line-height: 1;
        transition: transform .24s ease, background .24s ease, color .24s ease;
      }

      .raiz-public-home #faq .space-y-4 > div.is-open h3::after {
        content: '–';
        background: #2D405D;
        color: #BADA9C;
        transform: rotate(180deg);
      }

      .raiz-public-home #faq .space-y-4 > div p {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        margin: 0;
        transition: max-height .28s ease, opacity .22s ease, margin-top .22s ease;
      }

      .raiz-public-home #faq .space-y-4 > div.is-open p {
        max-height: 220px;
        opacity: 1;
        margin-top: .75rem;
      }
    `;
    document.head.appendChild(style);

    const appendExtraFaqItems = () => {
      const faqList = document.querySelector<HTMLElement>('.raiz-public-home #faq .space-y-4');
      if (!faqList || faqList.dataset.raizExpandedFaq === 'true') return;

      const itemClass = 'bg-white border border-home-line rounded-[34px] p-6 shadow-home-glass';
      const titleClass = 'font-display text-xl font-extrabold text-home-900 mb-2';
      const answerClass = 'text-home-muted';

      extraFaqItems.forEach(({ question, answer }) => {
        const item = document.createElement('div');
        item.className = itemClass;
        item.innerHTML = `<h3 class="${titleClass}">${question}</h3><p class="${answerClass}">${answer}</p>`;
        faqList.appendChild(item);
      });

      faqList.dataset.raizExpandedFaq = 'true';
    };

    const setupFaqItems = () => {
      appendExtraFaqItems();

      const items = Array.from(document.querySelectorAll<HTMLElement>('.raiz-public-home #faq .space-y-4 > div'));

      items.forEach((item, index) => {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-expanded', 'false');
        item.dataset.raizFaqItem = String(index);
      });

      const toggleItem = (selected: HTMLElement) => {
        const items = Array.from(document.querySelectorAll<HTMLElement>('.raiz-public-home #faq .space-y-4 > div'));
        const willOpen = !selected.classList.contains('is-open');

        items.forEach((item) => {
          item.classList.remove('is-open');
          item.setAttribute('aria-expanded', 'false');
        });

        if (willOpen) {
          selected.classList.add('is-open');
          selected.setAttribute('aria-expanded', 'true');
        }
      };

      const handleClick = (event: Event) => {
        const target = event.target as HTMLElement | null;
        const item = target?.closest<HTMLElement>('.raiz-public-home #faq .space-y-4 > div');
        if (!item) return;
        toggleItem(item);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const target = event.target as HTMLElement | null;
        const item = target?.closest<HTMLElement>('.raiz-public-home #faq .space-y-4 > div');
        if (!item) return;
        event.preventDefault();
        toggleItem(item);
      };

      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeyDown);
      };
    };

    const cleanupListeners = setupFaqItems();

    return () => {
      cleanupListeners();
      style.remove();
    };
  }, [location.pathname]);

  return null;
};

export default HomeFAQController;
