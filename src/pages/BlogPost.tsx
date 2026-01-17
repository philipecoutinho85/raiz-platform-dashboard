import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Helmet } from 'react-helmet';

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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || '';

  const handleShare = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    };
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="aspect-video w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
        <p className="text-muted-foreground mb-8">
          O artigo que você está procurando não existe ou não está disponível.
        </p>
        <Button onClick={() => navigate('/blog')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Blog
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title}</title>
        <meta name="description" content={post.meta_description || post.excerpt || ''} />
        {post.canonical_url && <link rel="canonical" href={post.canonical_url} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={post.og_title || post.title} />
        <meta property="og:description" content={post.og_description || post.meta_description || post.excerpt || ''} />
        {post.og_image_url && <meta property="og:image" content={post.og_image_url} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={shareUrl} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.twitter_title || post.title} />
        <meta name="twitter:description" content={post.twitter_description || post.meta_description || post.excerpt || ''} />
        {post.twitter_image_url && <meta name="twitter:image" content={post.twitter_image_url} />}
        
        {/* Article metadata */}
        {post.published_at && <meta property="article:published_time" content={post.published_at} />}
        {post.updated_at && <meta property="article:modified_time" content={post.updated_at} />}
        {post.tags?.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
      </Helmet>

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          {post.category && (
            <Badge variant="secondary" className="mb-4">
              <Tag className="h-3 w-3 mr-1" />
              {post.category}
            </Badge>
          )}
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.published_at || post.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.reading_time_minutes} min de leitura
              </span>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none dark:prose-invert mb-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 pt-8 border-t">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Share buttons */}
        <div className="flex items-center gap-4 pt-8 border-t">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Share2 className="h-4 w-4" />
            Compartilhar:
          </span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => handleShare('facebook')}
          >
            <Facebook className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => handleShare('twitter')}
          >
            <Twitter className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => handleShare('linkedin')}
          >
            <Linkedin className="h-4 w-4" />
          </Button>
        </div>
      </article>
    </>
  );
}
