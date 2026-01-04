import { BlogPost } from '@/types/blog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Facebook, Twitter, Linkedin, Image } from 'lucide-react';

interface BlogSocialPreviewProps {
  formData: Partial<BlogPost>;
  onFieldChange: (field: keyof BlogPost, value: any) => void;
}

export function BlogSocialPreview({ formData, onFieldChange }: BlogSocialPreviewProps) {
  const defaultImage = formData.featured_image_url || 'https://via.placeholder.com/1200x630/f3f4f6/a1a1aa?text=Imagem+de+Preview';
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="facebook">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Twitter/X
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </TabsTrigger>
        </TabsList>

        {/* Facebook Tab */}
        <TabsContent value="facebook" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Open Graph (Facebook)</CardTitle>
                <CardDescription>
                  Personalize como seu post aparece quando compartilhado no Facebook
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>OG Título</Label>
                  <Input
                    value={formData.og_title || ''}
                    onChange={(e) => onFieldChange('og_title', e.target.value)}
                    placeholder={formData.meta_title || formData.title || 'Título do post'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para usar o meta título
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>OG Descrição</Label>
                  <Textarea
                    value={formData.og_description || ''}
                    onChange={(e) => onFieldChange('og_description', e.target.value)}
                    placeholder={formData.meta_description || 'Descrição do post'}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OG Imagem URL</Label>
                  <Input
                    value={formData.og_image_url || ''}
                    onChange={(e) => onFieldChange('og_image_url', e.target.value)}
                    placeholder={formData.featured_image_url || 'https://...'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendado: 1200x630px
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Facebook Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview Facebook</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="aspect-[1.91/1] bg-muted">
                    <img
                      src={formData.og_image_url || defaultImage}
                      alt="OG Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 border-t bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase">seusite.com.br</p>
                    <p className="font-semibold text-gray-900 line-clamp-2 mt-1">
                      {formData.og_title || formData.meta_title || formData.title || 'Título do Post'}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {formData.og_description || formData.meta_description || formData.excerpt || 'Descrição do post...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Twitter Tab */}
        <TabsContent value="twitter" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Twitter Card</CardTitle>
                <CardDescription>
                  Personalize como seu post aparece quando compartilhado no Twitter/X
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Twitter Título</Label>
                  <Input
                    value={formData.twitter_title || ''}
                    onChange={(e) => onFieldChange('twitter_title', e.target.value)}
                    placeholder={formData.og_title || formData.meta_title || formData.title || 'Título'}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Twitter Descrição</Label>
                  <Textarea
                    value={formData.twitter_description || ''}
                    onChange={(e) => onFieldChange('twitter_description', e.target.value)}
                    placeholder={formData.og_description || formData.meta_description || 'Descrição'}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Twitter Imagem URL</Label>
                  <Input
                    value={formData.twitter_image_url || ''}
                    onChange={(e) => onFieldChange('twitter_image_url', e.target.value)}
                    placeholder={formData.og_image_url || formData.featured_image_url || 'https://...'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendado: 1200x600px para Summary Large Image
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Twitter Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview Twitter/X</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-2xl overflow-hidden bg-white shadow-sm max-w-[500px]">
                  <div className="aspect-[2/1] bg-muted">
                    <img
                      src={formData.twitter_image_url || formData.og_image_url || defaultImage}
                      alt="Twitter Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 border-t">
                    <p className="font-bold text-gray-900 line-clamp-1">
                      {formData.twitter_title || formData.og_title || formData.meta_title || formData.title || 'Título'}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {formData.twitter_description || formData.og_description || formData.meta_description || 'Descrição...'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      seusite.com.br
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LinkedIn Tab */}
        <TabsContent value="linkedin" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>LinkedIn Preview</CardTitle>
                <CardDescription>
                  O LinkedIn usa as mesmas tags Open Graph do Facebook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure as tags Open Graph na aba Facebook para personalizar a aparência no LinkedIn.
                </p>
              </CardContent>
            </Card>

            {/* LinkedIn Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview LinkedIn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="aspect-[1.91/1] bg-muted">
                    <img
                      src={formData.og_image_url || defaultImage}
                      alt="LinkedIn Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 border-t">
                    <p className="font-semibold text-gray-900 line-clamp-2">
                      {formData.og_title || formData.meta_title || formData.title || 'Título do Post'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">seusite.com.br</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
