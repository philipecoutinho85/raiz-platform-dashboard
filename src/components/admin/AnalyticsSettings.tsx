import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BarChart3 } from 'lucide-react';
import { AnalyticsSettings as AnalyticsSettingsType } from '@/hooks/useSystemSettings';

interface AnalyticsSettingsProps {
  settings: AnalyticsSettingsType;
  onUpdate: (settings: AnalyticsSettingsType) => void;
}

const AnalyticsSettings = ({ settings, onUpdate }: AnalyticsSettingsProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Integrações de Analytics
        </CardTitle>
        <CardDescription>
          Configure IDs de rastreamento para Google Analytics, GTM e Meta Pixel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ga-id">Google Analytics ID</Label>
          <Input
            id="ga-id"
            placeholder="G-XXXXXXXXXX"
            value={localSettings.google_analytics_id}
            onChange={(e) => 
              setLocalSettings({ ...localSettings, google_analytics_id: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: G-XXXXXXXXXX
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gtm-id">Google Tag Manager ID</Label>
          <Input
            id="gtm-id"
            placeholder="GTM-XXXXXXX"
            value={localSettings.google_tag_manager_id}
            onChange={(e) => 
              setLocalSettings({ ...localSettings, google_tag_manager_id: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: GTM-XXXXXXX
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-pixel-id">Meta Pixel ID</Label>
          <Input
            id="meta-pixel-id"
            placeholder="000000000000000"
            value={localSettings.meta_pixel_id}
            onChange={(e) => 
              setLocalSettings({ ...localSettings, meta_pixel_id: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: 000000000000000 (apenas números)
          </p>
        </div>

        <Button onClick={handleSave} className="w-full">
          Salvar Integrações
        </Button>
      </CardContent>
    </Card>
  );
};

export default AnalyticsSettings;
