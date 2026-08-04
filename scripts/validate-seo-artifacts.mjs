import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BASE_URL = 'https://raiztoken.com.br';

const PRIVATE_PATH_MARKERS = [
  '/login',
  '/registro',
  '/dashboard',
  '/criar-projeto',
  '/editar-projeto/',
  '/meus-projetos',
  '/perfil',
  '/admin',
  '/carteira',
  '/checkout-pagamento',
  '/avaliar-suporte',
  '/c/',
  '/campanha/',
];

function fail(message) {
  throw new Error(`[seo:validate] ${message}`);
}

function validateSitemap(xml) {
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    fail('sitemap.xml sem declaração XML UTF-8 válida');
  }

  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    fail('sitemap.xml sem namespace oficial do protocolo');
  }

  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  if (locations.length === 0) fail('sitemap.xml não contém URLs');

  const duplicateLocations = locations.filter(
    (location, index) => locations.indexOf(location) !== index,
  );
  if (duplicateLocations.length > 0) {
    fail(`URLs duplicadas no sitemap: ${[...new Set(duplicateLocations)].join(', ')}`);
  }

  for (const location of locations) {
    if (!location.startsWith(`${BASE_URL}/`)) {
      fail(`URL fora do domínio canônico: ${location}`);
    }

    const pathname = new URL(location).pathname;
    if (PRIVATE_PATH_MARKERS.some((marker) => pathname === marker || pathname.startsWith(marker))) {
      fail(`rota privada presente no sitemap: ${pathname}`);
    }
  }

  return locations.length;
}

function validateIndexHtml(html) {
  const requiredFragments = [
    '<html lang="pt-BR">',
    '<meta name="viewport"',
    '<meta name="description"',
    '<meta property="og:title"',
    '<meta property="og:description"',
    '<meta property="og:image"',
    '<script type="application/ld+json">',
    '<script src="/seo-route-meta.js"></script>',
  ];

  for (const fragment of requiredFragments) {
    if (!html.includes(fragment)) fail(`index.html sem requisito: ${fragment}`);
  }

  const jsonLdBlocks = [...html.matchAll(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g,
  )];
  if (jsonLdBlocks.length === 0) fail('index.html sem JSON-LD');

  for (const [, json] of jsonLdBlocks) {
    try {
      JSON.parse(json);
    } catch (error) {
      fail(`JSON-LD inválido: ${error.message}`);
    }
  }

  return jsonLdBlocks.length;
}

async function main() {
  const [sitemapXml, indexHtml] = await Promise.all([
    readFile(path.join(DIST_DIR, 'sitemap.xml'), 'utf8'),
    readFile(path.join(DIST_DIR, 'index.html'), 'utf8'),
  ]);

  const urlCount = validateSitemap(sitemapXml);
  const jsonLdCount = validateIndexHtml(indexHtml);

  console.log(
    `[seo:validate] aprovado: ${urlCount} URLs canônicas no sitemap e ` +
      `${jsonLdCount} bloco(s) JSON-LD válido(s).`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
