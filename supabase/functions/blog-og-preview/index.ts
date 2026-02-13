import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response('Slug is required', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      console.error('Error fetching post:', error);
      return new Response('Post not found', { status: 404, headers: corsHeaders });
    }

    const baseUrl = 'https://raiztoken.com.br';
    const postUrl = `${baseUrl}/blog/${slug}`;
    
    const title = post.og_title || post.meta_title || post.title;
    const description = post.og_description || post.meta_description || post.excerpt || '';
    const image = post.og_image_url || post.featured_image_url || `${baseUrl}/og-image.png`;
    const twitterImage = post.twitter_image_url || image;
    
    // Ensure image is absolute URL
    const absoluteImage = image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
    const absoluteTwitterImage = twitterImage.startsWith('http') ? twitterImage : `${baseUrl}${twitterImage.startsWith('/') ? '' : '/'}${twitterImage}`;

    // Try to fetch the SPA index.html to inject OG tags
    let spaHtml: string | null = null;
    try {
      const res = await fetch(`${baseUrl}/index.html`, {
        headers: { 'User-Agent': 'RaizToken-OG-Injector/1.0' },
      });
      if (res.ok) {
        spaHtml = await res.text();
      }
    } catch (e) {
      console.error('Failed to fetch SPA HTML:', e);
    }

    if (spaHtml) {
      // Inject dynamic OG tags into the SPA HTML
      let html = spaHtml;

      // Replace <title>
      html = html.replace(
        /<title>[^<]*<\/title>/,
        `<title>${escapeHtml(title)} | Raiz Token Blog</title>`
      );

      // Replace meta description
      html = html.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${escapeHtml(description)}">`
      );

      // Replace OG tags
      html = html.replace(
        /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:title" content="${escapeHtml(title)}">`
      );
      html = html.replace(
        /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:description" content="${escapeHtml(description)}">`
      );
      html = html.replace(
        /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:type" content="article">`
      );
      html = html.replace(
        /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:url" content="${postUrl}">`
      );
      html = html.replace(
        /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image" content="${absoluteImage}">`
      );
      html = html.replace(
        /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image:alt" content="${escapeHtml(post.featured_image_alt || title)}">`
      );

      // Replace Twitter tags
      html = html.replace(
        /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:title" content="${escapeHtml(post.twitter_title || title)}">`
      );
      html = html.replace(
        /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:description" content="${escapeHtml(post.twitter_description || description)}">`
      );
      html = html.replace(
        /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:image" content="${absoluteTwitterImage}">`
      );

      // Add article metadata and canonical before </head>
      const articleMeta = [
        `<link rel="canonical" href="${postUrl}">`,
        post.published_at ? `<meta property="article:published_time" content="${post.published_at}">` : '',
        post.updated_at ? `<meta property="article:modified_time" content="${post.updated_at}">` : '',
        ...(post.tags || []).map((tag: string) => `<meta property="article:tag" content="${escapeHtml(tag)}">`),
      ].filter(Boolean).join('\n    ');

      html = html.replace('</head>', `    ${articleMeta}\n  </head>`);

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      });
    }

    // Fallback: serve standalone HTML with OG tags + redirect
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Raiz Token Blog</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <meta property="og:type" content="article">
  <meta property="og:url" content="${postUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${absoluteImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Raiz Token">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@raiz_platform">
  <meta name="twitter:url" content="${postUrl}">
  <meta name="twitter:title" content="${escapeHtml(post.twitter_title || title)}">
  <meta name="twitter:description" content="${escapeHtml(post.twitter_description || description)}">
  <meta name="twitter:image" content="${absoluteTwitterImage}">
  
  ${post.published_at ? `<meta property="article:published_time" content="${post.published_at}">` : ''}
  ${post.updated_at ? `<meta property="article:modified_time" content="${post.updated_at}">` : ''}
  
  <link rel="canonical" href="${postUrl}">
  <meta http-equiv="refresh" content="0;url=${postUrl}">
</head>
<body>
  <p>Redirecionando para <a href="${postUrl}">${escapeHtml(title)}</a>...</p>
  <script>window.location.replace("${postUrl}");</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error in blog-og-preview:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});
