import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const COMUNIDADE_EMPREENDE_COVER = 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop';
const COMUNIDADE_EMPREENDE_FALLBACK = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" role="img" aria-label="Comunidade Empreende">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2D405D"/>
      <stop offset="0.55" stop-color="#1D8C5A"/>
      <stop offset="1" stop-color="#BADA9C"/>
    </linearGradient>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <circle cx="720" cy="120" r="180" fill="#ffffff" opacity="0.12"/>
  <circle cx="170" cy="480" r="220" fill="#ffffff" opacity="0.10"/>
  <rect x="115" y="135" width="670" height="330" rx="44" fill="#ffffff" opacity="0.18"/>
  <g fill="#ffffff" opacity="0.92">
    <circle cx="280" cy="270" r="52"/>
    <circle cx="450" cy="250" r="62"/>
    <circle cx="620" cy="270" r="52"/>
    <rect x="210" y="335" width="140" height="70" rx="35"/>
    <rect x="365" y="325" width="170" height="82" rx="41"/>
    <rect x="550" y="335" width="140" height="70" rx="35"/>
  </g>
  <text x="450" y="515" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="800" fill="#ffffff">Comunidade Empreende</text>
</svg>
`)}`;

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

    const ensureComunidadeEmpreendeCover = () => {
      const projectCards = Array.from(document.querySelectorAll<HTMLElement>('.raiz-public-home #projetos article'));
      const comunidadeCard = projectCards.find((card) => card.textContent?.includes('Comunidade Empreende'));
      const coverImage = comunidadeCard?.querySelector<HTMLImageElement>('img');

      if (!coverImage) return;

      if (coverImage.src !== COMUNIDADE_EMPREENDE_COVER) {
        coverImage.src = COMUNIDADE_EMPREENDE_COVER;
      }

      coverImage.alt = 'Projeto Comunidade Empreende';
      coverImage.removeAttribute('srcset');
      coverImage.loading = 'eager';
      coverImage.decoding = 'async';
      coverImage.style.display = 'block';
      coverImage.style.width = '100%';
      coverImage.style.height = '100%';
      coverImage.style.objectFit = 'cover';
      coverImage.style.opacity = '1';
      coverImage.style.visibility = 'visible';

      coverImage.onerror = () => {
        coverImage.onerror = null;
        coverImage.src = COMUNIDADE_EMPREENDE_FALLBACK;
      };
    };

    const setupFaqItems = () => {
      ensureComunidadeEmpreendeCover();
      const retryId = window.setTimeout(ensureComunidadeEmpreendeCover, 350);

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
        window.clearTimeout(retryId);
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
