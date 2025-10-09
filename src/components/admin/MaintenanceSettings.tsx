import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { MaintenanceSettings as MaintenanceSettingsType } from '@/hooks/useSystemSettings';

interface MaintenanceSettingsProps {
  settings: MaintenanceSettingsType;
  onUpdate: (settings: MaintenanceSettingsType) => void;
}

const MaintenanceSettings = ({ settings, onUpdate }: MaintenanceSettingsProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Modo de Manutenção
        </CardTitle>
        <CardDescription>
          Ative o modo de manutenção para bloquear temporariamente login e cadastro de usuários
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintenance-mode">Ativar Modo de Manutenção</Label>
            <p className="text-sm text-muted-foreground">
              Quando ativo, usuários não poderão fazer login ou se cadastrar
            </p>
          </div>
          <Switch
            id="maintenance-mode"
            checked={localSettings.enabled}
            onCheckedChange={(checked) => 
              setLocalSettings({ ...localSettings, enabled: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Mensagem de Manutenção</Label>
          <Textarea
            id="maintenance-message"
            placeholder="Digite a mensagem que será exibida aos usuários..."
            value={localSettings.message}
            onChange={(e) => 
              setLocalSettings({ ...localSettings, message: e.target.value })
            }
            rows={4}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
};

export default MaintenanceSettings;
