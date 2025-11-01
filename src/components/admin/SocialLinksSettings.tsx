import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Linkedin, Instagram, Twitter } from 'lucide-react';

interface SocialLinksSettingsProps {
  settings: {
    linkedin: string;
    instagram: string;
    twitter: string;
  };
  onUpdate: (settings: any) => Promise<void>;
}

const SocialLinksSettings = ({ settings, onUpdate }: SocialLinksSettingsProps) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await onUpdate({
      linkedin: formData.get('linkedin') as string,
      instagram: formData.get('instagram') as string,
      twitter: formData.get('twitter') as string,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes Sociais</CardTitle>
        <CardDescription>
          Configure os links das redes sociais que aparecerão no rodapé do site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              name="linkedin"
              type="url"
              placeholder="https://linkedin.com/company/raiz-token"
              defaultValue={settings.linkedin}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </Label>
            <Input
              id="instagram"
              name="instagram"
              type="url"
              placeholder="https://instagram.com/raiztoken"
              defaultValue={settings.instagram}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              Twitter
            </Label>
            <Input
              id="twitter"
              name="twitter"
              type="url"
              placeholder="https://twitter.com/raiztoken"
              defaultValue={settings.twitter}
            />
          </div>

          <Button type="submit" className="w-full">
            Salvar Configurações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SocialLinksSettings;
