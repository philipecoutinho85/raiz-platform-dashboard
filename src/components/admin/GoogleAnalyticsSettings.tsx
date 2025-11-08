import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BarChart3 } from 'lucide-react';

const GoogleAnalyticsSettings = () => {
  const [gtagScript, setGtagScript] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('google_analytics_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setGtagScript(data.gtag_script || '');
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('google_analytics_settings')
        .select('id')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('google_analytics_settings')
          .update({
            gtag_script: gtagScript,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('google_analytics_settings')
          .insert({
            gtag_script: gtagScript
          });

        if (error) throw error;
      }

      toast.success('Configurações salvas! Recarregue a página para aplicar.');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center">Carregando...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Google Analytics / Tag Manager
        </CardTitle>
        <CardDescription>
          Cole aqui o código completo fornecido pelo Google Analytics ou Tag Manager
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gtag-script">Código Google Analytics/GTM</Label>
          <Textarea
            id="gtag-script"
            placeholder={`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`}
            value={gtagScript}
            onChange={(e) => setGtagScript(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Este código será inserido no &lt;head&gt; de todas as páginas do site
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GoogleAnalyticsSettings;
