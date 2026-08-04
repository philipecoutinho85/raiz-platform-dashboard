(function () {
  'use strict';

  var BASE_URL = 'https://raiztoken.com.br';
  var SITE_NAME = 'Raiz Token';
  var DEFAULT_IMAGE = BASE_URL + '/og-image.png';

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

  function routeIsNoindex(path) {
    return NOINDEX_PREFIXES.some(function (prefix) {
      return path === prefix || path.indexOf(prefix) === 0;
    });
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

  function breadcrumbItems(path) {
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
      items.push({ name: 'Projeto', url: BASE_URL + path });
    } else if (path.indexOf('/blog/') === 0) {
      items.push({ name: 'Artigo', url: BASE_URL + path });
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

  function updateStructuredData(path, config, canonicalUrl) {
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

    var description = document.head.querySelector('meta[name="description"]');
    if (description && description.content) webPage.description = description.content;

    setJsonLd('seo-webpage-jsonld', webPage);

    var crumbs = breadcrumbItems(path);
    if (crumbs.length > 1) {
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
    } else {
      var oldBreadcrumb = document.getElementById('seo-breadcrumb-jsonld');
      if (oldBreadcrumb) oldBreadcrumb.remove();
    }
  }

  function applySeo() {
    var path = normalizePath(window.location.pathname);
    var config = routeConfig(path);
    var noindex = routeIsNoindex(path);
    var canonical = BASE_URL + canonicalPath(path);
    if (canonical.endsWith('/') && canonical !== BASE_URL + '/') canonical = canonical.slice(0, -1);

    if (config.title) document.title = config.title;

    if (config.description) {
      upsertMeta('meta[name="description"]', {
        name: 'description',
        content: config.description
      });
    }

    var robotsValue = noindex
      ? 'noindex, nofollow, noarchive'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    upsertMeta('meta[name="robots"]', { name: 'robots', content: robotsValue });
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot', content: robotsValue });

    if (!noindex) setCanonical(canonical);
    else {
      Array.prototype.slice.call(document.head.querySelectorAll('link[rel="canonical"]')).forEach(function (el) { el.remove(); });
    }

    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'pt_BR' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: path.indexOf('/blog/') === 0 ? 'article' : 'website' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: document.title || SITE_NAME });

    var descriptionMeta = document.head.querySelector('meta[name="description"]');
    if (descriptionMeta && descriptionMeta.content) {
      upsertMeta('meta[property="og:description"]', { property: 'og:description', content: descriptionMeta.content });
    }

    var ogImage = document.head.querySelector('meta[property="og:image"]');
    if (!ogImage) upsertMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_IMAGE });

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: document.title || SITE_NAME });
    if (descriptionMeta && descriptionMeta.content) {
      upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: descriptionMeta.content });
    }

    if (!noindex) updateStructuredData(path, config, canonical);
    else {
      ['seo-webpage-jsonld', 'seo-breadcrumb-jsonld'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    }
  }

  function scheduleApply() {
    window.requestAnimationFrame(function () {
      applySeo();
    });
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

  applySeo();
})();
