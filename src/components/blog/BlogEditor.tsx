import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlogPost, useCreateBlogPost, useUpdateBlogPost, useSaveVersion } from '@/hooks/useBlogPosts';
import { analyzeSEO, generateExcerpt, calculateReadingTime, countWordsInContent } from '@/lib/seoAnalyzer';
import { BlogPost, SEOAnalysis } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  History,
  Settings,
  Search,
  Share2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Monitor,
  Tablet,
  Smartphone,
  Code as CodeIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { BlogSEOChecklist } from './BlogSEOChecklist';
import { BlogVersionHistory } from './BlogVersionHistory';
import { BlogSocialPreview } from './BlogSocialPreview';
import { TipTapEditor } from './TipTapEditor';
import { BlogImageGallery } from './BlogImageGallery';

const BLOG_CATEGORIES = [
  'Tecnologia',
  'Marketing',
  'Finanças',
  'Educação',
  'Saúde',
  'Negócios',
  'Estilo de Vida',
  'Notícias',
];

export function BlogEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== 'novo';

  const { data: existingPost, isLoading } = useBlogPost(isEditing ? id : undefined);
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const saveVersionMutation = useSaveVersion();

  const [activeTab, setActiveTab] = useState('editor');
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [autoSave, setAutoSave] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    featured_image_alt: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image_url: '',
    category: '',
    tags: [],
  });

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setFormData(existingPost);
    }
  }, [existingPost]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, isEditing]);

  // Calculate SEO analysis
  const seoAnalysis: SEOAnalysis = useMemo(() => {
    return analyzeSEO({
      title: formData.title || '',
      content: formData.content || '',
      metaTitle: formData.meta_title || formData.title || '',
      metaDescription: formData.meta_description || '',
      focusKeyword: formData.focus_keyword || '',
      slug: formData.slug || '',
      excerpt: formData.excerpt || '',
      featuredImageAlt: formData.featured_image_alt || '',
    });
  }, [formData]);

  // Update SEO scores in form data
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      seo_score: seoAnalysis.score,
      readability_score: seoAnalysis.readabilityScore,
      word_count: countWordsInContent(formData.content || ''),
      reading_time_minutes: calculateReadingTime(formData.content || ''),
    }));
  }, [seoAnalysis, formData.content]);

  const handleChange = useCallback((field: keyof BlogPost, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async (publish = false) => {
    if (!formData.title) {
      toast.error('Título é obrigatório');
      return;
    }

    const dataToSave: Partial<BlogPost> = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      excerpt: formData.excerpt || generateExcerpt(formData.content || ''),
      featured_image_url: formData.featured_image_url,
      featured_image_alt: formData.featured_image_alt,
      status: publish ? 'published' : formData.status,
      published_at: publish ? new Date().toISOString() : formData.published_at,
      meta_title: formData.meta_title,
      meta_description: formData.meta_description,
      focus_keyword: formData.focus_keyword,
      canonical_url: formData.canonical_url,
      og_title: formData.og_title,
      og_description: formData.og_description,
      og_image_url: formData.og_image_url,
      twitter_title: formData.twitter_title,
      twitter_description: formData.twitter_description,
      twitter_image_url: formData.twitter_image_url,
      category: formData.category,
      tags: formData.tags || [],
      word_count: formData.word_count || 0,
      reading_time_minutes: formData.reading_time_minutes || 0,
      seo_score: formData.seo_score || 0,
      readability_score: formData.readability_score || 0,
      scheduled_at: formData.scheduled_at,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id, ...dataToSave });
        // Save version
        await saveVersionMutation.mutateAsync({
          postId: id,
          title: formData.title!,
          content: formData.content || '',
          meta_title: formData.meta_title || undefined,
          meta_description: formData.meta_description || undefined,
          focus_keyword: formData.focus_keyword || undefined,
        });
      } else {
        const result = await createMutation.mutateAsync(dataToSave);
        navigate(`/admin/blog/${result.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blog')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold">
                {isEditing ? 'Editar Post' : 'Novo Post'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={seoAnalysis.score >= 80 ? 'default' : seoAnalysis.score >= 50 ? 'secondary' : 'destructive'}>
                  SEO: {seoAnalysis.score}%
                </Badge>
                <span>{formData.word_count || 0} palavras</span>
                <span>~{formData.reading_time_minutes || 1} min leitura</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
              <Label className="text-sm">Auto-save</Label>
            </div>
            <Button variant="outline" onClick={() => setShowVersionHistory(true)}>
              <History className="h-4 w-4 mr-2" />
              Versões
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button onClick={() => handleSave(true)}>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Editor Area */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="editor">
                <FileText className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="seo">
                <Search className="h-4 w-4 mr-2" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="social">
                <Share2 className="h-4 w-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            {/* Editor Tab */}
            <TabsContent value="editor" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Título do post..."
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>URL:</span>
                  <Input
                    value={formData.slug || ''}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    className="w-auto max-w-md h-7 text-sm"
                    placeholder="url-do-post"
                  />
                </div>

                {/* Editor Mode Toggle */}
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1">
                    <Button
                      variant={editorMode === 'visual' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setEditorMode('visual')}
                    >
                      Visual
                    </Button>
                    <Button
                      variant={editorMode === 'html' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setEditorMode('html')}
                    >
                      <CodeIcon className="h-4 w-4 mr-1" />
                      HTML
                    </Button>
                  </div>
                </div>

                {/* Content Editor */}
                {editorMode === 'visual' ? (
                  <TipTapEditor
                    content={formData.content || ''}
                    onChange={(html) => handleChange('content', html)}
                    placeholder="Comece a escrever seu conteúdo..."
                  />
                ) : (
                  <Textarea
                    id="content-editor"
                    placeholder="Comece a escrever seu conteúdo em HTML..."
                    value={formData.content || ''}
                    onChange={(e) => handleChange('content', e.target.value)}
                    className="min-h-[500px] font-mono text-sm resize-y"
                  />
                )}

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label>Resumo / Excerpt</Label>
                  <Textarea
                    placeholder="Resumo do post (será usado como preview)..."
                    value={formData.excerpt || ''}
                    onChange={(e) => handleChange('excerpt', e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.excerpt?.length || 0)}/160 caracteres
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo">
              <BlogSEOChecklist
                formData={formData}
                seoAnalysis={seoAnalysis}
                onFieldChange={handleChange}
              />
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social">
              <BlogSocialPreview
                formData={formData}
                onFieldChange={handleChange}
              />
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Preview</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setPreviewDevice('tablet')}
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`mx-auto border rounded-lg p-4 overflow-auto transition-all ${
                      previewDevice === 'mobile' ? 'max-w-[375px]' :
                      previewDevice === 'tablet' ? 'max-w-[768px]' : 'max-w-full'
                    }`}
                    style={{ minHeight: '500px' }}
                  >
                    <article className="prose max-w-none">
                      <h1>{formData.title || 'Título do Post'}</h1>
                      <div 
                        dangerouslySetInnerHTML={{ __html: formData.content || '<p>Conteúdo do post...</p>' }}
                      />
                    </article>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Publicação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => handleChange('status', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                          <SelectItem value="scheduled">Agendado</SelectItem>
                          <SelectItem value="archived">Arquivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.category || ''}
                        onValueChange={(v) => handleChange('category', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOG_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tags (separadas por vírgula)</Label>
                      <Input
                        value={formData.tags?.join(', ') || ''}
                        onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                        placeholder="seo, marketing, dicas"
                      />
                    </div>
                  </CardContent>
                </Card>

                <BlogImageGallery
                  postId={isEditing ? id : undefined}
                  featuredImageUrl={formData.featured_image_url || ''}
                  featuredImageAlt={formData.featured_image_alt || ''}
                  onFeaturedImageChange={(url) => handleChange('featured_image_url', url)}
                  onFeaturedImageAltChange={(alt) => handleChange('featured_image_alt', alt)}
                />

                <Card>
                  <CardHeader>
                    <CardTitle>URL Canônica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={formData.canonical_url || ''}
                      onChange={(e) => handleChange('canonical_url', e.target.value)}
                      placeholder="https://seusite.com/blog/post-original"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Use apenas se este conteúdo foi publicado originalmente em outro lugar.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - SEO Quick View */}
        <aside className="w-80 border-l bg-muted/30 p-4 hidden xl:block">
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Pontuação SEO</h3>
                <div className="flex items-center gap-4">
                  <div
                    className={`text-4xl font-bold ${
                      seoAnalysis.score >= 80 ? 'text-green-600' :
                      seoAnalysis.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}
                  >
                    {seoAnalysis.score}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Legibilidade: {seoAnalysis.readabilityScore}%</p>
                    <p>{formData.word_count || 0} palavras</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Checklist</h3>
                <div className="space-y-2">
                  {seoAnalysis.items.slice(0, 8).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      {item.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={item.passed ? 'text-muted-foreground' : ''}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {seoAnalysis.suggestions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Sugestões</h3>
                    <div className="space-y-2">
                      {seoAnalysis.suggestions.slice(0, 3).map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* Version History Modal */}
      {showVersionHistory && id && (
        <BlogVersionHistory
          postId={id}
          onClose={() => setShowVersionHistory(false)}
          onRestore={(version) => {
            setFormData(prev => ({
              ...prev,
              title: version.title,
              content: version.content,
              meta_title: version.meta_title,
              meta_description: version.meta_description,
              focus_keyword: version.focus_keyword,
            }));
            setShowVersionHistory(false);
            toast.success('Versão restaurada!');
          }}
        />
      )}
    </div>
  );
}
