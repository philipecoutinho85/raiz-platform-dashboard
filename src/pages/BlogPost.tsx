import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Facebook, Twitter, Linkedin, BookOpen, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Helmet } from 'react-helmet';
import Footer from '@/components/Footer';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Use absolute URL for social sharing - production domain
  const baseUrl = 'https://raiztoken.com.br';
  const supabaseUrl = 'https://oefkzjyqjjfzfrmovfdt.supabase.co';
  
  // Canonical URL for the blog post
  const shareUrl = `${baseUrl}/blog/${slug}`;
  // URL that serves proper OG meta tags for social media crawlers
  const ogPreviewUrl = `${supabaseUrl}/functions/v1/blog-og-preview?slug=${slug}`;
  const shareTitle = post?.title || '';
  
  // Ensure absolute URLs for images
  const getAbsoluteImageUrl = (url: string | null | undefined): string => {
    if (!url) return `${baseUrl}/og-image.png`;
    // If it's already an absolute URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Otherwise, prepend the base URL
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };
  
  const ogImage = getAbsoluteImageUrl(post?.og_image_url || post?.featured_image_url);
  const twitterImage = getAbsoluteImageUrl(post?.twitter_image_url || post?.featured_image_url);

  const getShareUrl = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    // Use the OG preview URL for sharing - it serves proper meta tags and redirects to actual page
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogPreviewUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(ogPreviewUrl)}&text=${encodeURIComponent(shareTitle)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(ogPreviewUrl)}`,
    };
    return urls[platform];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-hero py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-32 bg-white/20 mb-8" />
            <Skeleton className="h-12 w-3/4 bg-white/20 mb-4" />
            <Skeleton className="h-6 w-1/2 bg-white/20" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="aspect-video w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            O artigo que você está procurando não existe ou não está disponível.
          </p>
          <Button onClick={() => navigate('/blog')} className="bg-raiz-primary hover:bg-raiz-primary/90">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} | Raiz Token Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt || ''} />
        {post.canonical_url && <link rel="canonical" href={post.canonical_url} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={post.og_title || post.title} />
        <meta property="og:description" content={post.og_description || post.meta_description || post.excerpt || ''} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:site_name" content="Raiz Token" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@raiz_platform" />
        <meta name="twitter:title" content={post.twitter_title || post.title} />
        <meta name="twitter:description" content={post.twitter_description || post.meta_description || post.excerpt || ''} />
        <meta name="twitter:image" content={twitterImage} />
        
        {/* Article metadata */}
        {post.published_at && <meta property="article:published_time" content={post.published_at} />}
        {post.updated_at && <meta property="article:modified_time" content={post.updated_at} />}
        {post.tags?.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
      </Helmet>

      <div className="min-h-screen bg-background pt-16 md:pt-20">
        {/* Hero Header */}
        <section className="relative bg-gradient-hero overflow-hidden min-h-[350px] md:min-h-[400px] flex flex-col justify-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23%238FBC8F%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          
          <div className="container mx-auto px-4 py-14 md:py-16 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Back button */}
              <Link 
                to="/blog" 
                className="inline-flex items-center text-raiz-light/80 hover:text-white mb-8 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Blog
              </Link>

              {/* Category and meta */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {post.category && (
                  <Badge className="bg-raiz-gold text-raiz-dark">
                    <Tag className="h-3 w-3 mr-1" />
                    {post.category}
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-raiz-light/70 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at || post.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                {post.reading_time_minutes && (
                  <span className="flex items-center gap-1 text-raiz-light/70 text-sm">
                    <Clock className="h-4 w-4" />
                    {post.reading_time_minutes} min de leitura
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              
              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-lg md:text-xl text-raiz-light/80 max-w-3xl">
                  {post.excerpt}
                </p>
              )}
            </div>
          </div>

          {/* Wave decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 md:h-16">
              <path d="M0 80L60 70C120 60 240 40 360 30C480 20 600 20 720 25C840 30 960 40 1080 45C1200 50 1320 50 1380 50L1440 50V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))"/>
            </svg>
          </div>
        </section>

        {/* Content */}
        <article className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
          {/* Featured Image */}
          {post.featured_image_url && (
            <figure className="mb-10 rounded-xl overflow-hidden shadow-xl">
              <img
                src={post.featured_image_url}
                alt={post.featured_image_alt || post.title}
                className="w-full h-auto object-cover"
              />
              {post.featured_image_alt && (
                <figcaption className="text-sm text-muted-foreground mt-3 text-center italic">
                  {post.featured_image_alt}
                </figcaption>
              )}
            </figure>
          )}

          {/* Article Content */}
          <div 
            className="prose prose-lg prose-slate dark:prose-invert max-w-none 
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
              prose-h1:text-3xl prose-h1:md:text-4xl prose-h1:mt-10 prose-h1:mb-6
              prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-3
              prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-base prose-p:md:text-lg prose-p:leading-relaxed prose-p:my-5 prose-p:text-muted-foreground
              prose-a:text-raiz-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-strong:font-semibold prose-strong:text-foreground
              prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
              prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
              prose-li:my-2 prose-li:text-muted-foreground
              prose-blockquote:border-l-4 prose-blockquote:border-raiz-primary prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/50 prose-blockquote:py-4 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg
              prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
              prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
              prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
              prose-hr:my-10 prose-hr:border-border
              mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10 pt-8 border-t">
              <span className="text-muted-foreground mr-2">Tags:</span>
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="hover:bg-muted transition-colors">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Share buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t">
            <span className="flex items-center gap-2 text-muted-foreground font-medium">
              <Share2 className="h-5 w-5" />
              Compartilhar este artigo:
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                asChild
                className="hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-colors"
              >
                <a href={getShareUrl('facebook')} target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                asChild
                className="hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-colors"
              >
                <a href={getShareUrl('twitter')} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                asChild
                className="hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-colors"
              >
                <a href={getShareUrl('linkedin')} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </article>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-raiz-primary to-raiz-secondary py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Gostou do conteúdo?
            </h2>
            <p className="text-raiz-light/80 text-lg mb-8 max-w-2xl mx-auto">
              Explore mais artigos ou comece seu projeto na Raiz Token agora mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-raiz-primary hover:bg-white/90">
                <Link to="/blog">
                  Ver mais artigos
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-raiz-gold hover:bg-raiz-gold/90 text-raiz-dark">
                <Link to="/login">
                  Criar meu projeto
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
