import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
        max-height: 180px;
        opacity: 1;
        margin-top: .75rem;
      }
    `;
    document.head.appendChild(style);

    const setupFaqItems = () => {
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
