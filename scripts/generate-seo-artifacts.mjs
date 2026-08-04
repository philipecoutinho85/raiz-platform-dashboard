import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BASE_URL = 'https://raiztoken.com.br';
const PAGE_SIZE = 1000;

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://oefkzjyqjjfzfrmovfdt.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZmt6anlxampmemZybW92ZmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTQ0MDYsImV4cCI6MjA2NTg3MDQwNn0.e2pJAbPn3Y6tmut2ClBDeRUHTr-pqYt5Mqc2B_wKGOU';

const STATIC_ROUTES = [
  '/',
  '/projetos',
  '/como-funciona',
  '/faq',
  '/blog',
  '/contato',
  '/terms',
  '/privacy',
  '/privacidade-apoiadores',
  '/privacidade-criadores',
  '/politica-de-cookies',
  '/security',
];

const PRIVATE_PREFIXES = [
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
  '/campanha/',
];

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normalizeLastmod(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function isPublicPath(routePath) {
  return !PRIVATE_PREFIXES.some(
    (prefix) => routePath === prefix || routePath.startsWith(prefix),
  );
}

async function fetchAllRows(table, baseQuery) {
  const rows = [];

  for (let offset = 0; offset < 10000; offset += PAGE_SIZE) {
    const search = new URLSearchParams(baseQuery);
    search.set('limit', String(PAGE_SIZE));
    search.set('offset', String(offset));

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${search.toString()}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`${table}: HTTP ${response.status} ${details.slice(0, 240)}`);
    }

    const page = await response.json();
    if (!Array.isArray(page)) {
      throw new TypeError(`${table}: resposta inesperada da API pública`);
    }

    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

async function fetchDynamicEntries() {
  const [blogResult, projectsResult] = await Promise.allSettled([
    fetchAllRows('blog_posts', {
      select: 'slug,published_at,updated_at',
      status: 'eq.published',
      order: 'published_at.desc',
    }),
    fetchAllRows('projects', {
      select: 'id,created_at',
      status: 'eq.approved',
      order: 'created_at.desc',
    }),
  ]);

  const entries = [];

  if (blogResult.status === 'fulfilled') {
    for (const post of blogResult.value) {
      const slug = typeof post.slug === 'string' ? post.slug.trim() : '';
      if (!slug) continue;

      entries.push({
        path: `/blog/${encodeURIComponent(slug)}`,
        lastmod: normalizeLastmod(post.updated_at || post.published_at),
      });
    }
  } else {
    console.warn(`[seo] Não foi possível carregar artigos publicados: ${blogResult.reason}`);
  }

  if (projectsResult.status === 'fulfilled') {
    for (const project of projectsResult.value) {
      const id = typeof project.id === 'string' ? project.id.trim() : '';
      if (!id) continue;

      entries.push({
        path: `/projeto/${encodeURIComponent(id)}`,
        lastmod: normalizeLastmod(project.created_at),
      });
    }
  } else {
    console.warn(`[seo] Não foi possível carregar projetos aprovados: ${projectsResult.reason}`);
  }

  return entries;
}

function buildSitemap(entries) {
  const deduplicated = new Map();

  for (const entry of entries) {
    if (!entry?.path || !isPublicPath(entry.path)) continue;
    const normalizedPath = entry.path === '/' ? '/' : entry.path.replace(/\/+$/, '');
    deduplicated.set(normalizedPath, {
      path: normalizedPath,
      lastmod: entry.lastmod,
    });
  }

  const urls = [...deduplicated.values()].map(({ path: routePath, lastmod }) => {
    const loc = routePath === '/' ? `${BASE_URL}/` : `${BASE_URL}${routePath}`;
    const lastmodNode = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodNode}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

async function main() {
  await mkdir(DIST_DIR, { recursive: true });

  const dynamicEntries = await fetchDynamicEntries();
  const entries = [
    ...STATIC_ROUTES.map((routePath) => ({ path: routePath })),
    ...dynamicEntries,
  ];

  const sitemap = buildSitemap(entries);
  const destination = path.join(DIST_DIR, 'sitemap.xml');
  await writeFile(destination, sitemap, 'utf8');

  const dynamicBlogCount = dynamicEntries.filter((entry) => entry.path.startsWith('/blog/')).length;
  const dynamicProjectCount = dynamicEntries.filter((entry) => entry.path.startsWith('/projeto/')).length;

  console.log(
    `[seo] sitemap.xml gerado com ${STATIC_ROUTES.length} rotas estáticas, ` +
      `${dynamicBlogCount} artigos e ${dynamicProjectCount} projetos aprovados.`,
  );
}

main().catch((error) => {
  console.error('[seo] Falha ao gerar artefatos SEO:', error);
  process.exitCode = 1;
});
