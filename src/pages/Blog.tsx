import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Search, Tag, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Helmet } from 'react-helmet';
import Footer from '@/components/Footer';

export default function Blog() {
  const { data: posts, isLoading } = useBlogPosts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter only published posts
  const publishedPosts = posts?.filter(post => post.status === 'published') || [];

  // Get unique categories
  const categories = [...new Set(publishedPosts.map(post => post.category).filter(Boolean))];

  // Filter posts by search and category
  const filteredPosts = publishedPosts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get featured post (first post)
  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-hero py-20">
          <div className="container mx-auto px-4">
            <Skeleton className="h-12 w-64 bg-white/20 mb-4" />
            <Skeleton className="h-6 w-96 bg-white/20" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="pt-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Blog | Raiz Token - Artigos sobre Crowdfunding e Empreendedorismo</title>
        <meta 
          name="description" 
          content="Artigos, dicas e novidades sobre crowdfunding, financiamento coletivo, empreendedorismo e projetos de impacto social." 
        />
        <meta name="keywords" content="blog crowdfunding, artigos financiamento coletivo, dicas empreendedorismo, raiz token blog" />
        <link rel="canonical" href="https://raiztoken.com.br/blog" />
      </Helmet>

      <div className="min-h-screen bg-background pt-16 md:pt-20">
        {/* Hero Section */}
        <section className="relative bg-gradient-hero overflow-hidden min-h-[400px] md:min-h-[450px] flex flex-col justify-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23%238FBC8F%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          
          <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center space-x-2 bg-raiz-gold/20 text-raiz-gold px-4 py-2 rounded-full mb-6">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-semibold">Blog Raiz Token</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Conhecimento para{' '}
                <span className="text-raiz-gold">transformar ideias</span>{' '}
                em realidade
              </h1>
              
              <p className="text-lg md:text-xl text-raiz-light/80 mb-10 max-w-2xl mx-auto">
                Artigos, guias e insights sobre crowdfunding, empreendedorismo e como viabilizar projetos de impacto.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-raiz-gold rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Wave decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 md:h-16">
              <path d="M0 80L60 70C120 60 240 40 360 30C480 20 600 20 720 25C840 30 960 40 1080 45C1200 50 1320 50 1380 50L1440 50V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))"/>
            </svg>
          </div>
        </section>

        {/* Category Filters */}
        {categories.length > 0 && (
          <section className="container mx-auto px-4 -mt-6 relative z-20">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge
                variant={selectedCategory === null ? "default" : "outline"}
                className={`cursor-pointer text-sm px-4 py-2 ${
                  selectedCategory === null 
                    ? 'bg-raiz-primary hover:bg-raiz-primary/90' 
                    : 'hover:bg-raiz-primary/10'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Todos
              </Badge>
              {categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={`cursor-pointer text-sm px-4 py-2 ${
                    selectedCategory === category 
                      ? 'bg-raiz-primary hover:bg-raiz-primary/90' 
                      : 'hover:bg-raiz-primary/10'
                  }`}
                  onClick={() => setSelectedCategory(category as string)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {category}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Content */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Nenhum artigo encontrado</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {searchQuery || selectedCategory 
                  ? 'Tente ajustar os filtros ou buscar por outros termos.'
                  : 'Em breve publicaremos novos conteúdos. Fique ligado!'}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Post */}
              {featuredPost && (
                <Link to={`/blog/${featuredPost.slug}`} className="block group">
                  <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="aspect-video md:aspect-auto md:h-full overflow-hidden bg-muted">
                        {featuredPost.featured_image_url ? (
                          <img
                            src={featuredPost.featured_image_url}
                            alt={featuredPost.featured_image_alt || featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-gradient-to-br from-raiz-primary/20 to-raiz-secondary/20">
                            <span className="text-8xl font-bold text-raiz-primary/30">
                              {featuredPost.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6 md:p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge className="bg-raiz-gold text-raiz-dark hover:bg-raiz-gold/90">
                            Destaque
                          </Badge>
                          {featuredPost.category && (
                            <Badge variant="secondary">
                              {featuredPost.category}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 group-hover:text-raiz-primary transition-colors leading-tight">
                          {featuredPost.title}
                        </h2>
                        {featuredPost.excerpt && (
                          <p className="text-muted-foreground text-lg mb-6 line-clamp-3">
                            {featuredPost.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(featuredPost.published_at || featuredPost.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                            {featuredPost.reading_time_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {featuredPost.reading_time_minutes} min de leitura
                              </span>
                            )}
                          </div>
                          <Button variant="ghost" className="text-raiz-primary group-hover:translate-x-1 transition-transform">
                            Ler artigo
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Remaining Posts Grid */}
              {remainingPosts.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-6">Mais artigos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingPosts.map(post => (
                      <Link key={post.id} to={`/blog/${post.slug}`}>
                        <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden group border-0 shadow-md">
                          <div className="aspect-video overflow-hidden bg-muted">
                            {post.featured_image_url ? (
                              <img
                                src={post.featured_image_url}
                                alt={post.featured_image_alt || post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-raiz-primary/10 to-raiz-secondary/10">
                                <span className="text-5xl font-bold text-raiz-primary/20">
                                  {post.title.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-5">
                            {post.category && (
                              <Badge variant="secondary" className="mb-3">
                                <Tag className="h-3 w-3 mr-1" />
                                {post.category}
                              </Badge>
                            )}
                            <h2 className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-raiz-primary transition-colors">
                              {post.title}
                            </h2>
                            {post.excerpt && (
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                {post.excerpt}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(post.published_at || post.created_at), "d MMM, yyyy", { locale: ptBR })}
                              </span>
                              {post.reading_time_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {post.reading_time_minutes} min
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-raiz-primary to-raiz-secondary py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para transformar sua ideia em realidade?
            </h2>
            <p className="text-raiz-light/80 text-lg mb-8 max-w-2xl mx-auto">
              Crie seu projeto na Raiz Token e conecte-se com apoiadores que acreditam no seu potencial.
            </p>
            <Button asChild size="lg" className="bg-raiz-gold hover:bg-raiz-gold/90 text-raiz-dark text-lg px-8">
              <Link to="/login">
                Começar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
