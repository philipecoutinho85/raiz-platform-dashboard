import { useState, useEffect } from 'react';
import { Cookie, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    setShowPreferences(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const rejectNonEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    savePreferences(essentialOnly);
  };

  const openPreferences = () => {
    setShowPreferences(true);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed inset-x-3 bottom-[92px] z-[80] rounded-[28px] border border-home-line bg-white/95 p-4 shadow-home-card backdrop-blur-xl md:bottom-0 md:left-0 md:right-0 md:rounded-none md:border-x-0 md:border-b-0 md:bg-background/95">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-home-100 text-home-800 md:h-auto md:w-auto md:bg-transparent md:text-raiz-primary">
                <Cookie className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <h3 className="mb-1 font-display text-base font-extrabold tracking-[-.02em] text-home-900 md:font-semibold md:text-raiz-dark">
                  Consentimento de Cookies
                </h3>
                <p className="text-sm leading-relaxed text-home-muted md:text-raiz-secondary">
                  Ao continuar navegando na Raiz Token, você concorda com o uso de cookies essenciais e analíticos. 
                  Eles nos ajudam a entender como você usa a plataforma e aprimorar nossos serviços.
                </p>
              </div>
            </div>
            
            <div className="grid w-full grid-cols-1 gap-2 md:flex md:w-auto md:flex-wrap md:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                onClick={rejectNonEssential}
                className="h-10 rounded-full border-home-line whitespace-nowrap"
              >
                Recusar não essenciais
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openPreferences}
                className="h-10 rounded-full border-home-line whitespace-nowrap"
              >
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar preferências
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
                className="h-10 rounded-full bg-home-800 text-white hover:bg-home-900 whitespace-nowrap"
              >
                Aceitar todos os cookies
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[28px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-raiz-primary" />
              Configurações de Privacidade
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <p className="text-sm text-raiz-secondary">
              Gerencie suas preferências de cookies. Os cookies essenciais são necessários para o funcionamento básico do site e não podem ser desativados.
            </p>
            
            <div className="flex flex-col gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Políticas de Privacidade</p>
              <div className="flex flex-col gap-1">
                <a 
                  href="/privacidade-apoiadores" 
                  target="_blank"
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline"
                >
                  → Política de Privacidade - Apoiadores
                </a>
                <a 
                  href="/privacidade-criadores" 
                  target="_blank"
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline"
                >
                  → Política de Privacidade - Criadores
                </a>
              </div>
            </div>

            {/* Essential Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cookies Essenciais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="essential" className="font-semibold text-raiz-dark">
                      Sempre Ativo
                    </Label>
                    <p className="text-sm text-raiz-secondary mt-1">
                      Necessários para o funcionamento básico da plataforma, incluindo autenticação e segurança.
                    </p>
                  </div>
                  <Switch
                    id="essential"
                    checked={preferences.essential}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            {/* Analytics Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cookies Analíticos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="analytics" className="font-semibold text-raiz-dark cursor-pointer">
                      Cookies de Análise
                    </Label>
                    <p className="text-sm text-raiz-secondary mt-1">
                      Nos ajudam a entender como os visitantes interagem com a plataforma, coletando informações de forma anônima.
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, analytics: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Marketing Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cookies de Marketing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="marketing" className="font-semibold text-raiz-dark cursor-pointer">
                      Cookies de Preferências
                    </Label>
                    <p className="text-sm text-raiz-secondary mt-1">
                      Permitem que a plataforma lembre suas escolhas e preferências para oferecer uma experiência personalizada.
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={preferences.marketing}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, marketing: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowPreferences(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveCustomPreferences}>
              Salvar Preferências
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
