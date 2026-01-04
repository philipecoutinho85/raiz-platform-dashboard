import { BlogPost, SEOAnalysis } from '@/types/blog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Search, FileText, Link, Image } from 'lucide-react';

interface BlogSEOChecklistProps {
  formData: Partial<BlogPost>;
  seoAnalysis: SEOAnalysis;
  onFieldChange: (field: keyof BlogPost, value: any) => void;
}

export function BlogSEOChecklist({ formData, seoAnalysis, onFieldChange }: BlogSEOChecklistProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* SEO Score Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Análise SEO</CardTitle>
              <CardDescription>
                Otimize seu conteúdo para melhor ranqueamento nos buscadores
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(seoAnalysis.score)}`}>
                {seoAnalysis.score}%
              </div>
              <p className="text-sm text-muted-foreground">Pontuação SEO</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span className={getScoreColor(seoAnalysis.score)}>{seoAnalysis.score}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressColor(seoAnalysis.score)}`}
                  style={{ width: `${seoAnalysis.score}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${getScoreColor(seoAnalysis.readabilityScore)}`}>
                  {seoAnalysis.readabilityScore}%
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Legibilidade</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {formData.word_count || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Palavras</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Focus Keyword */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Palavra-chave Foco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Palavra-chave principal</Label>
            <Input
              value={formData.focus_keyword || ''}
              onChange={(e) => onFieldChange('focus_keyword', e.target.value)}
              placeholder="ex: marketing digital"
            />
            <p className="text-xs text-muted-foreground">
              A palavra-chave principal que você quer ranquear
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meta Title */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meta Título
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título para buscadores</Label>
            <Input
              value={formData.meta_title || ''}
              onChange={(e) => onFieldChange('meta_title', e.target.value)}
              placeholder={formData.title || 'Título do post'}
            />
            <div className="flex justify-between text-xs">
              <span className={`${(formData.meta_title?.length || 0) > 60 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {formData.meta_title?.length || 0}/60 caracteres
              </span>
              {formData.meta_title?.toLowerCase().includes(formData.focus_keyword?.toLowerCase() || '') && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Contém keyword
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta Description */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Meta Descrição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição para resultados de busca</Label>
            <Textarea
              value={formData.meta_description || ''}
              onChange={(e) => onFieldChange('meta_description', e.target.value)}
              placeholder="Uma descrição atraente do seu conteúdo..."
              className="min-h-[80px]"
            />
            <div className="flex justify-between text-xs">
              <span className={`${(formData.meta_description?.length || 0) > 160 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {formData.meta_description?.length || 0}/160 caracteres
              </span>
              {formData.meta_description?.toLowerCase().includes(formData.focus_keyword?.toLowerCase() || '') && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Contém keyword
                </Badge>
              )}
            </div>
          </div>

          {/* SERP Preview */}
          <div className="mt-4 p-4 border rounded-lg bg-white">
            <p className="text-xs text-muted-foreground mb-2">Preview nos resultados do Google:</p>
            <div className="space-y-1">
              <p className="text-[#1a0dab] text-lg hover:underline cursor-pointer line-clamp-1">
                {formData.meta_title || formData.title || 'Título do Post'}
              </p>
              <p className="text-[#006621] text-sm">
                seusite.com.br › blog › {formData.slug || 'url-do-post'}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {formData.meta_description || formData.excerpt || 'Adicione uma meta descrição para aparecer aqui...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Checklist de SEO</CardTitle>
          <CardDescription>
            Itens verificados automaticamente para otimização do seu conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {seoAnalysis.items.map(item => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  item.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                {item.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${item.passed ? 'text-green-800' : 'text-red-800'}`}>
                    {item.label}
                  </p>
                  <p className={`text-sm ${item.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {seoAnalysis.suggestions.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Sugestões de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {seoAnalysis.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                  <span className="text-yellow-800">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
