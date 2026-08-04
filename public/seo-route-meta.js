(function () {
  'use strict';

  var BASE_URL = 'https://raiztoken.com.br';
  var SITE_NAME = 'Raiz Token';
  var DEFAULT_IMAGE = BASE_URL + '/og-image.png';
  var dynamicTimer = null;
  var rootObserver = null;

  var ROUTES = {
    '/': {
      title: 'Raiz Token: Conectando pessoas a projetos que transformam o Brasil',
      description: 'Transforme seu apoio em legado. Na Raiz Token, cada contribuição financia ideias autênticas e cria impacto de verdade. Faça parte de algo que vai além do investimento.',
      type: 'WebPage'
    },
    '/projetos': {
      title: 'Projetos | Raiz Token',
      description: 'Encontre campanhas publicadas na Raiz Token, acompanhe metas, apoiadores, progresso e sinais de confiança antes de decidir apoiar.',
      type: 'CollectionPage'
    },
    '/como-funciona': {
      title: 'Como funciona | Raiz Token',
      description: 'A Raiz Token organiza o apoio por meio de tokens simbólicos, validação de projetos, prestação de contas e mecanismos de proteção para o apoiador.',
      type: 'WebPage'
    },
    '/faq': {
      title: 'FAQ | Raiz Token',
      description: 'Tire suas dúvidas sobre tokens, apoios, reembolsos, verificação de criadores, prestação de contas e regras da plataforma.',
      type: 'WebPage'
    },
    '/contato': {
      title: 'Contato | Raiz Token',
      description: 'Envie sua mensagem para dúvidas sobre projetos, conta, carteira, apoios, validação, prestação de contas ou funcionamento da plataforma.',
      type: 'ContactPage'
    },
    '/blog': {
      title: 'Blog | Raiz Token - Artigos sobre Crowdfunding e Empreendedorismo',
      description: 'Artigos, dicas e novidades sobre crowdfunding, financiamento coletivo, empreendedorismo e projetos de impacto social.',
      type: 'Blog'
    }
  };

  var NOINDEX_PREFIXES = [
    '/login',
    '/registro',
    '/register',
    '/esqueci-senha',
    '/dashboard',
    '/criar-projeto',
    '/editar-projeto/',
    '/criar-projeto-legado',
    '/meus-projetos',
    '/perfil',
    '/admin',
    '/carteira',
    '/checkout-pagamento',
    '/avaliar-suporte',
    '/c/',
    '/campanha/'
  ];

  var CANONICAL_ALIASES = {
    '/how-it-works': '/como-funciona'
  };

  function normalizePath(pathname) {
    if (!pathname || pathname === '/') return '/';
    return pathname.replace(/\/+$/, '') || '/';
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function truncate(value, maxLength) {
    var text = cleanText(value);
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1).replace(/\s+\S*$/, '') + '…';
  }

  function upsertMeta(selector, attributes) {
    var el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      document.head.appendChild(el);
    }
    Object.keys(attributes).forEach(function (key) {
      el.setAttribute(key, attributes[key]);
    });
    return el;
  }

  function getMeta(selector) {
    var el = document.head.querySelector(selector);
    return el ? cleanText(el.getAttribute('content')) : '';
  }

  function setCanonical(url) {
    var canonicals = Array.prototype.slice.call(document.head.querySelectorAll('link[rel="canonical"]'));
    var canonical = canonicals.shift();
    canonicals.forEach(function (el) { el.remove(); });
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }

  function removeCanonicals() {
    Array.prototype.slice.call(document.head.querySelectorAll('link[rel="canonical"]')).forEach(function (el) {
      el.remove();
    });
  }

  function setRobots(indexable) {
    var value = indexable
      ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      : 'noindex, nofollow, noarchive';

    upsertMeta('meta[name="robots"]', { name: 'robots', content: value });
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot', content: value });
  }

  function routeIsNoindex(path) {
    return NOINDEX_PREFIXES.some(function (prefix) {
      return path === prefix || path.indexOf(prefix) === 0;
    });
  }

  function isDynamicContentRoute(path) {
    return path.indexOf('/blog/') === 0 || path.indexOf('/projeto/') === 0;
  }

  function routeConfig(path) {
    if (ROUTES[path]) return ROUTES[path];
    if (path.indexOf('/blog/') === 0) return { type: 'BlogPosting' };
    if (path.indexOf('/projeto/') === 0) return { title: 'Projeto | Raiz Token', type: 'WebPage' };
    if (path.indexOf('/usuario/') === 0) return { title: 'Perfil público | Raiz Token', type: 'ProfilePage' };
    return { type: 'WebPage' };
  }

  function canonicalPath(path) {
    return CANONICAL_ALIASES[path] || path;
  }

  function breadcrumbItems(path, leafName) {
    var items = [{ name: 'Raiz Token', url: BASE_URL + '/' }];
    if (path === '/') return items;

    if (path === '/projetos' || path.indexOf('/projeto/') === 0) {
      items.push({ name: 'Projetos', url: BASE_URL + '/projetos' });
    } else if (path === '/blog' || path.indexOf('/blog/') === 0) {
      items.push({ name: 'Blog', url: BASE_URL + '/blog' });
    } else if (path === '/como-funciona') {
      items.push({ name: 'Como funciona', url: BASE_URL + '/como-funciona' });
    } else if (path === '/faq') {
      items.push({ name: 'FAQ', url: BASE_URL + '/faq' });
    } else if (path === '/contato') {
      items.push({ name: 'Contato', url: BASE_URL + '/contato' });
    }

    if (path.indexOf('/projeto/') === 0) {
      items.push({ name: leafName || 'Projeto', url: BASE_URL + path });
    } else if (path.indexOf('/blog/') === 0) {
      items.push({ name: leafName || 'Artigo', url: BASE_URL + path });
    }

    return items;
  }

  function setJsonLd(id, data) {
    var script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  function removeJsonLd(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  function updateBreadcrumbs(path, leafName) {
    var crumbs = breadcrumbItems(path, leafName);
    if (crumbs.length <= 1) {
      removeJsonLd('seo-breadcrumb-jsonld');
      return;
    }

    setJsonLd('seo-breadcrumb-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map(function (item, index) {
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        };
      })
    });
  }

  function updateStructuredData(path, config, canonicalUrl, leafName) {
    var webPage = {
      '@context': 'https://schema.org',
      '@type': config.type || 'WebPage',
      '@id': canonicalUrl + '#webpage',
      url: canonicalUrl,
      name: document.title || SITE_NAME,
      isPartOf: { '@id': BASE_URL + '/#website' },
      about: { '@id': BASE_URL + '/#organization' },
      inLanguage: 'pt-BR'
    };

    var description = getMeta('meta[name="description"]');
    if (description) webPage.description = description;

    setJsonLd('seo-webpage-jsonld', webPage);
    updateBreadcrumbs(path, leafName);
  }

  function updateSocialMeta(canonicalUrl, type) {
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'pt_BR' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type || 'website' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: document.title || SITE_NAME });

    var description = getMeta('meta[name="description"]');
    if (description) {
      upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
      upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    }

    if (!document.head.querySelector('meta[property="og:image"]')) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_IMAGE });
    }

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: document.title || SITE_NAME });
  }

  function applySeo() {
    var path = normalizePath(window.location.pathname);
    var config = routeConfig(path);
    var protectedRoute = routeIsNoindex(path);
    var dynamicPending = isDynamicContentRoute(path);
    var canonical = BASE_URL + canonicalPath(path);

    if (canonical.endsWith('/') && canonical !== BASE_URL + '/') canonical = canonical.slice(0, -1);

    if (config.title) document.title = config.title;

    if (config.description) {
      upsertMeta('meta[name="description"]', {
        name: 'description',
        content: config.description
      });
    }

    setRobots(!protectedRoute && !dynamicPending);

    if (!protectedRoute && !dynamicPending) setCanonical(canonical);
    else removeCanonicals();

    updateSocialMeta(canonical, path.indexOf('/blog/') === 0 ? 'article' : 'website');

    if (!protectedRoute && !dynamicPending) {
      updateStructuredData(path, config, canonical);
    } else {
      removeJsonLd('seo-webpage-jsonld');
      removeJsonLd('seo-breadcrumb-jsonld');
      removeJsonLd('seo-dynamic-content-jsonld');
    }
  }

  function pageTextContains(value) {
    if (!document.body) return false;
    return document.body.innerText.indexOf(value) !== -1;
  }

  function findProjectTitle() {
    var preferred = document.querySelector('h3.text-2xl');
    if (preferred && cleanText(preferred.textContent)) return cleanText(preferred.textContent);

    var headings = Array.prototype.slice.call(document.querySelectorAll('h1, h2, h3'));
    var blocked = ['Projeto não encontrado', 'Prestação de contas', 'Atualizações', 'Apoiadores', 'Comentários'];

    for (var i = 0; i < headings.length; i += 1) {
      var text = cleanText(headings[i].textContent);
      if (text.length < 4) continue;
      if (blocked.indexOf(text) !== -1) continue;
      return text;
    }

    return '';
  }

  function findLongParagraph() {
    var paragraphs = Array.prototype.slice.call(document.querySelectorAll('p'));
    var candidates = paragraphs
      .map(function (el) { return cleanText(el.textContent); })
      .filter(function (text) { return text.length >= 80; })
      .sort(function (a, b) { return b.length - a.length; });

    return candidates.length ? candidates[0] : '';
  }

  function findProjectImage(title) {
    var images = Array.prototype.slice.call(document.images || []);
    for (var i = 0; i < images.length; i += 1) {
      var alt = cleanText(images[i].getAttribute('alt'));
      if (alt === title || alt === 'Projeto ' + title) {
        return images[i].currentSrc || images[i].src || '';
      }
    }
    return getMeta('meta[property="og:image"]') || DEFAULT_IMAGE;
  }

  function hydrateBlogPost(path, canonicalUrl) {
    if (pageTextContains('Artigo não encontrado')) {
      setRobots(false);
      removeCanonicals();
      removeJsonLd('seo-dynamic-content-jsonld');
      return;
    }

    var headlineEl = document.querySelector('article h1') || document.querySelector('h1');
    var headline = headlineEl ? cleanText(headlineEl.textContent) : '';
    if (!headline) return;

    var description = getMeta('meta[name="description"]');
    var image = getMeta('meta[property="og:image"]') || DEFAULT_IMAGE;
    var published = getMeta('meta[property="article:published_time"]');
    var modified = getMeta('meta[property="article:modified_time"]');

    setCanonical(canonicalUrl);
    setRobots(true);
    updateSocialMeta(canonicalUrl, 'article');
    updateStructuredData(path, { type: 'WebPage' }, canonicalUrl, headline);

    var article = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': canonicalUrl + '#article',
      headline: headline,
      mainEntityOfPage: { '@id': canonicalUrl + '#webpage' },
      url: canonicalUrl,
      inLanguage: 'pt-BR',
      publisher: { '@id': BASE_URL + '/#organization' }
    };

    if (description) article.description = description;
    if (image) article.image = image;
    if (published) article.datePublished = published;
    if (modified) article.dateModified = modified;

    setJsonLd('seo-dynamic-content-jsonld', article);
  }

  function hydrateProject(path, canonicalUrl) {
    if (pageTextContains('Projeto não encontrado')) {
      setRobots(false);
      removeCanonicals();
      removeJsonLd('seo-dynamic-content-jsonld');
      return;
    }

    var title = findProjectTitle();
    if (!title) return;

    var approved = pageTextContains('Aprovado');
    if (!approved) {
      setRobots(false);
      removeCanonicals();
      removeJsonLd('seo-dynamic-content-jsonld');
      return;
    }

    var description = findLongParagraph();
    var image = findProjectImage(title);

    document.title = title + ' | Raiz Token';
    if (description) {
      upsertMeta('meta[name="description"]', {
        name: 'description',
        content: truncate(description, 160)
      });
    }

    setCanonical(canonicalUrl);
    setRobots(true);
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image || DEFAULT_IMAGE });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image || DEFAULT_IMAGE });
    updateSocialMeta(canonicalUrl, 'website');
    updateStructuredData(path, { type: 'WebPage' }, canonicalUrl, title);

    var project = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': canonicalUrl + '#project',
      name: title,
      url: canonicalUrl,
      mainEntityOfPage: { '@id': canonicalUrl + '#webpage' },
      inLanguage: 'pt-BR',
      publisher: { '@id': BASE_URL + '/#organization' }
    };

    if (description) project.description = description;
    if (image) project.image = image;

    setJsonLd('seo-dynamic-content-jsonld', project);
  }

  function updateCollectionItemList(path) {
    var prefix = path === '/projetos' ? '/projeto/' : path === '/blog' ? '/blog/' : '';
    if (!prefix) {
      removeJsonLd('seo-itemlist-jsonld');
      return;
    }

    var links = Array.prototype.slice.call(document.querySelectorAll('a[href]'));
    var seen = {};
    var items = [];

    links.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var absolute = '';

      if (href.indexOf(prefix) === 0) absolute = BASE_URL + href;
      else if (href.indexOf(BASE_URL + prefix) === 0) absolute = href;
      else return;

      if (path === '/blog' && absolute === BASE_URL + '/blog') return;
      if (seen[absolute]) return;

      var name = cleanText(link.textContent);
      if (!name) return;

      seen[absolute] = true;
      items.push({
        '@type': 'ListItem',
        position: items.length + 1,
        name: truncate(name, 120),
        url: absolute
      });
    });

    if (!items.length) {
      removeJsonLd('seo-itemlist-jsonld');
      return;
    }

    setJsonLd('seo-itemlist-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.slice(0, 50)
    });
  }

  function hydrateDynamicContent() {
    var path = normalizePath(window.location.pathname);
    var canonical = BASE_URL + canonicalPath(path);
    if (canonical.endsWith('/') && canonical !== BASE_URL + '/') canonical = canonical.slice(0, -1);

    if (path.indexOf('/blog/') === 0) hydrateBlogPost(path, canonical);
    else if (path.indexOf('/projeto/') === 0) hydrateProject(path, canonical);
    else removeJsonLd('seo-dynamic-content-jsonld');

    updateCollectionItemList(path);
  }

  function scheduleDynamicHydration() {
    if (dynamicTimer) window.clearTimeout(dynamicTimer);
    dynamicTimer = window.setTimeout(function () {
      hydrateDynamicContent();
    }, 180);
  }

  function scheduleApply() {
    window.requestAnimationFrame(function () {
      applySeo();
      scheduleDynamicHydration();
    });
  }

  function observeRoot() {
    var root = document.getElementById('root');
    if (!root || typeof MutationObserver === 'undefined') return;

    if (rootObserver) rootObserver.disconnect();
    rootObserver = new MutationObserver(function () {
      scheduleDynamicHydration();
    });

    rootObserver.observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    });

    scheduleDynamicHydration();
  }

  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;

  history.pushState = function () {
    var result = originalPushState.apply(this, arguments);
    scheduleApply();
    return result;
  };

  history.replaceState = function () {
    var result = originalReplaceState.apply(this, arguments);
    scheduleApply();
    return result;
  };

  window.addEventListener('popstate', scheduleApply);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeRoot, { once: true });
  } else {
    observeRoot();
  }

  applySeo();
})();
